/**
 * Next.js API Route: Medicine Registration
 * Proxies to Python Flask API for medicine registration with Firebase Storage URLs
 */

import { NextRequest, NextResponse } from "next/server";
import { validateUrlField, validateStringField, validateOptionalStringField } from "@/lib/validation";

const PYTHON_API_URL = process.env.PYTHON_MEDICINE_API_URL || "http://localhost:5000";

async function checkFlaskHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, medicine_name, user_id, dosage } = body;

    // Validate required fields with type checking
    const imageUrlValidation = validateUrlField(imageUrl, "imageUrl");
    if (!imageUrlValidation.valid) {
      return NextResponse.json(
        { error: imageUrlValidation.error || "Invalid imageUrl" },
        { status: 400 }
      );
    }

    const medicineNameValidation = validateStringField(medicine_name, "medicine_name");
    if (!medicineNameValidation.valid) {
      return NextResponse.json(
        { error: medicineNameValidation.error || "Invalid medicine_name" },
        { status: 400 }
      );
    }

    const userIdValidation = validateStringField(user_id, "user_id");
    if (!userIdValidation.valid) {
      return NextResponse.json(
        { error: userIdValidation.error || "Invalid user_id" },
        { status: 400 }
      );
    }

    // Validate optional dosage field if provided
    if (dosage !== undefined) {
      const dosageValidation = validateOptionalStringField(dosage, "dosage");
      if (!dosageValidation.valid) {
        return NextResponse.json(
          { error: dosageValidation.error || "Invalid dosage" },
          { status: 400 }
        );
      }
    }

    // Check if Flask backend is available
    const isFlaskHealthy = await checkFlaskHealth();
    if (!isFlaskHealthy) {
      return NextResponse.json(
        { 
          error: "Medicine verification service is temporarily unavailable",
          message: `Cannot connect to Python Flask backend at ${PYTHON_API_URL}. Please ensure the Flask server is running on port 5000.`,
          hint: "Start the Flask server: cd medicine_verification && python app.py"
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Forward request to Python Flask API
    const response = await fetch(`${PYTHON_API_URL}/api/medicine/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        medicine_name,
        user_id,
        dosage: dosage || "",
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `Flask backend returned ${response.status}: ${response.statusText}` };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Optionally store in Firestore for integration with existing system
    if (data.success && data.medicine_id) {
      try {
        const { getFirestoreAdmin } = await import("@/lib/firebaseAdmin");
        const db = getFirestoreAdmin();
        const { FieldValue } = await import("firebase-admin/firestore");

        await db
          .collection("users")
          .doc(user_id)
          .collection("registeredMedicines")
          .doc(data.medicine_id)
          .set(
            {
              medicineId: data.medicine_id,
              medicineName: medicine_name,
              imageUrl: imageUrl,
              dosage: dosage || "",
              ocrText: data.ocr_extracted_text || "",
              registeredAt: FieldValue.serverTimestamp(),
              status: "active",
            },
            { merge: true }
          );
      } catch (firestoreError) {
        console.error("Failed to store in Firestore:", firestoreError);
        // Don't fail the request if Firestore fails
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Medicine registration error:", error);
    
    // Handle specific error types
    if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
      return NextResponse.json(
        { 
          error: "Medicine verification service is unavailable",
          message: `Cannot connect to Python Flask backend at ${PYTHON_API_URL}`,
          hint: "Please ensure the Flask server is running: cd medicine_verification && python app.py"
        },
        { status: 503 }
      );
    }
    
    if (error.message?.includes("fetch failed")) {
      return NextResponse.json(
        { 
          error: "Failed to connect to medicine verification service",
          message: "The Python Flask backend server is not responding",
          hint: "Start the Flask server: cd medicine_verification && python app.py"
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to register medicine" },
      { status: 500 }
    );
  }
}
