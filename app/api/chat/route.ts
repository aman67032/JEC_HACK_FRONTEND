import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Google Gemini API (free tier, works with Firebase)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

interface UserInput {
  message: string;
  role: string;
  conversation_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UserInput = await request.json();
    const { message, conversation_id } = body;

    if (!message || !conversation_id) {
      return NextResponse.json(
        { error: "Missing required fields: message and conversation_id" },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin with error handling
    let db;
    try {
      db = getFirestoreAdmin();
    } catch (firebaseError: any) {
      console.error("Firebase Admin initialization error:", firebaseError);
      // If Firebase fails, still return a response using fallback logic
      const assistantResponse = generateSimpleResponse(message);
      return NextResponse.json({
        response: assistantResponse,
        conversation_id,
        warning: "Firebase connection unavailable, using local response",
      });
    }

    // Get or create conversation
    let messages: any[] = [];
    try {
      if (!db) {
        throw new Error("Database not initialized");
      }
      const convRef = db.collection("conversations").doc(conversation_id);
      const convDoc = await convRef.get();
      
      if (convDoc.exists) {
        const data = convDoc.data();
        messages = data?.messages || [];
      } else {
        // Initialize with system prompt
        const systemPrompt = {
          role: "system",
          content:
            "You are Baymax, the Health Connect Assistant — a professional, calm, and caring digital " +
            "health companion. Your job is to help patients, caretakers, and doctors use the Health Connect " +
            "dashboard and features. Be concise, empathetic, and action-oriented. You can answer about:\n\n" +
            "Core features (based on the dashboard):\n" +
            "- Medication List: add, edit, remove medicines; supports manual add and photo/PDF upload for OCR.\n" +
            "- Scan Prescription & OCR: explain how to upload prescription images/PDFs, server OCR options, and how OCR extracts medicine names, dosages, and schedules.\n" +
            "- Drug Interaction Checker: how to run checks, what warnings mean, and next steps when interactions are detected.\n" +
            "- Medicine Schedule & Reminders: set reminder times, how adherence tracking works, and how to mark doses as taken (including proof photo).\n" +
            "- Smart Med Card (QR): generation, temporary read-only access, and emergency sharing.\n" +
            "- Emergency Help: SOS button behavior, nearby hospital suggestions, sharing medical context with responders.\n" +
            "- History & Reports: downloading PDFs, where past uploads and dosage changes appear.\n" +
            "- Caretaker & Doctor workflows: connecting caretakers, doctor groups, shared dashboards, and permissions.\n" +
            "- Privacy & Security: brief notes about Firebase/Firestore storage, role-based access controls, and temporary emergency access.\n\n" +
            "When answering, always:\n" +
            "1) Start with a short, empathetic one-line summary.\n" +
            "2) Give a clear step-by-step action the user can take next.\n" +
            "3) Give one short tip or warning if relevant.\n\n" +
            "If users ask about technical deployment (Firebase, OCR server, Google Vision), provide clear instructions and configuration hints.\n\n" +
            "Do NOT provide medical diagnoses — explain what the app can do and when to contact a real medical professional.\n" +
            "Be helpful, match the UI words (e.g., 'Run OCR', 'Add Medicine', 'Generate Smart Med Card'), and prefer short lists and bolded actions for clarity.",
        };
        messages = [systemPrompt];
        if (db) {
          await convRef.set({
            conversation_id,
            messages,
            created_at: FieldValue.serverTimestamp(),
            active: true,
          });
        }
      }
    } catch (firestoreError: any) {
      console.error("Firestore error:", firestoreError);
      // If Firestore fails, use default system prompt and continue
      const systemPrompt = {
        role: "system",
        content:
          "You are Baymax, the Health Connect Assistant — a calm, professional, and caring digital health companion.",
      };
      messages = [systemPrompt];
    }

    // Add user message
    const userMessage = { role: "user", content: message };
    messages.push(userMessage);

    // Call Gemini API if key is available, otherwise return a simple response
    let assistantResponse = "I'm here to help you with Health Connect features. How can I assist you today?";

    if (GEMINI_API_KEY) {
      try {
        // Convert messages to Gemini format
        const systemMsg = messages.find((m) => m.role === "system");
        const systemInstruction = systemMsg?.content || "";
        
        const geminiMessages = messages
          .filter((msg) => msg.role !== "system")
          .slice(-10) // Keep last 10 messages for context
          .map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          }));

        const requestBody: any = {
          contents: geminiMessages,
        };

        // Add system instruction if available (Gemini API v1beta supports systemInstruction)
        if (systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const response = await fetch(
          `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const data = await response.json();
          assistantResponse =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            assistantResponse;
        } else {
          console.error("Gemini API error:", await response.text());
        }
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback to simple responses
        assistantResponse = generateSimpleResponse(message);
      }
    } else {
      // Fallback to simple response logic
      assistantResponse = generateSimpleResponse(message);
    }

    // Add assistant response
    const assistantMessage = { role: "assistant", content: assistantResponse };
    messages.push(assistantMessage);

    // Persist to Firestore (if available)
    try {
      if (db) {
        const convRef = db.collection("conversations").doc(conversation_id);
        await convRef.update({
          messages,
          updated_at: FieldValue.serverTimestamp(),
        });
      }
    } catch (persistError: any) {
      console.error("Failed to persist conversation:", persistError);
      // Continue anyway - response is still valid
    }

    return NextResponse.json({
      response: assistantResponse,
      conversation_id,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    // Return a helpful fallback response even on error
    const fallbackResponse = generateSimpleResponse("help");
    return NextResponse.json({
      response: fallbackResponse,
      error: error.message || "An error occurred",
      warning: "Response generated in fallback mode",
    });
  }
}

function generateSimpleResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("medicine") || lowerMessage.includes("medication")) {
    return (
      "I can help you manage your medicines! You can:\n" +
      "1. Add medicines manually from the Medicine List section\n" +
      "2. Scan a prescription using the Upload Section to automatically add medicines\n" +
      "3. View your medicine schedule and set reminders\n" +
      "4. Check for drug interactions using the Interaction Checker\n\n" +
      "Would you like help with any of these?"
    );
  }

  if (lowerMessage.includes("emergency") || lowerMessage.includes("sos")) {
    return (
      "For emergencies, you can:\n" +
      "1. Use the Emergency Button (SOS) to alert your caretakers\n" +
      "2. Your location will be shared with emergency contacts\n" +
      "3. A Smart Med Card QR code will be generated for first responders\n\n" +
      "Stay calm, help is on the way!"
    );
  }

  if (lowerMessage.includes("prescription") || lowerMessage.includes("scan") || lowerMessage.includes("ocr")) {
    return (
      "To scan a prescription:\n" +
      "1. Go to the Upload Section on your dashboard\n" +
      "2. Click 'Upload Photo or PDF'\n" +
      "3. Take a photo or select a file\n" +
      "4. The system will extract medicine names and dosages automatically\n" +
      "5. Review and add medicines to your list\n\n" +
      "Need help with a specific step?"
    );
  }

  if (lowerMessage.includes("reminder") || lowerMessage.includes("schedule")) {
    return (
      "To set medicine reminders:\n" +
      "1. Go to Medicine Schedule section\n" +
      "2. Click 'Add Reminder' for any medicine\n" +
      "3. Set the time and frequency\n" +
      "4. You'll receive notifications when it's time to take your medicine\n\n" +
      "Would you like help setting up reminders?"
    );
  }

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("help")) {
    return (
      "Hello! I'm Baymax, your Health Connect Assistant. I'm here to help you with:\n" +
      "• Managing your medicines and prescriptions\n" +
      "• Setting up reminders and schedules\n" +
      "• Emergency assistance (SOS)\n" +
      "• Health history and reports\n" +
      "• Drug interaction checking\n\n" +
      "What would you like help with today?"
    );
  }

  return (
    "I understand you need help. I can assist with:\n" +
    "• Medicine management and prescriptions\n" +
    "• Reminders and schedules\n" +
    "• Emergency assistance\n" +
    "• Health reports\n\n" +
    "Can you tell me more about what you need?"
  );
}

