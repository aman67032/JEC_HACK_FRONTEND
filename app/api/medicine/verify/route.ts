/**
 * Next.js API Route: Medicine Verification
 * Proxies to Python Flask API for medicine verification with Firebase Storage URLs
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
    const { imageUrl, user_id, medicine_id } = body;

    // Validate required fields with type checking
    const imageUrlValidation = validateUrlField(imageUrl, "imageUrl");
    if (!imageUrlValidation.valid) {
      return NextResponse.json(
        { error: imageUrlValidation.error || "Invalid imageUrl" },
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

    // Validate optional medicine_id if provided
    if (medicine_id !== undefined && medicine_id !== "") {
      const medicineIdValidation = validateStringField(medicine_id, "medicine_id");
      if (!medicineIdValidation.valid) {
        return NextResponse.json(
          { error: medicineIdValidation.error || "Invalid medicine_id" },
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
    const response = await fetch(`${PYTHON_API_URL}/api/medicine/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        user_id,
        medicine_id: medicine_id || "",
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

    // Store verification result in Firestore
    if (data.verification_id) {
      try {
        const { getFirestoreAdmin } = await import("@/lib/firebaseAdmin");
        const db = getFirestoreAdmin();
        const { FieldValue } = await import("firebase-admin/firestore");

        const verificationData = {
          verificationId: data.verification_id,
          imageUrl: imageUrl,
          verified: data.verified,
          bestMatch: data.best_match,
          patientOcrText: data.patient_ocr_text || "",
          verifiedAt: FieldValue.serverTimestamp(),
          notificationsSent: data.notifications_sent || {},
        };

        // Store in user's verifications collection
        await db
          .collection("users")
          .doc(user_id)
          .collection("medicineVerifications")
          .doc(data.verification_id)
          .set(verificationData, { merge: true });

        // Create notifications in Firestore (for existing notification system)
        const notificationType = data.verified
          ? "medicine_verified"
          : "medicine_mismatch";
        const title = data.verified
          ? `✅ Medicine Verified - ${data.best_match?.medicine_name || "Unknown"}`
          : `⚠️ MEDICINE MISMATCH ALERT - ${data.best_match?.medicine_name || "Unknown"}`;

        // Notify patient
        await db.collection("users").doc(user_id).collection("notifications").add({
          type: notificationType,
          title: title,
          message: data.message || "",
          medicineName: data.best_match?.medicine_name,
          verified: data.verified,
          confidence: data.best_match?.confidence,
          verificationId: data.verification_id,
          timestamp: FieldValue.serverTimestamp(),
          read: false,
          priority: data.verified ? "normal" : "high",
        });

        // Get user data to notify doctor and caregivers
        const userDoc = await db.collection("users").doc(user_id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const doctorId = userData?.doctorId || userData?.doctor_id;
          const caregivers = userData?.caregivers || [];

          // Notify doctor
          if (doctorId) {
            await db.collection("users").doc(doctorId).collection("notifications").add({
              type: notificationType,
              patientId: user_id,
              patientName: userData?.name || "Patient",
              title: title,
              message: data.message || "",
              medicineName: data.best_match?.medicine_name,
              verified: data.verified,
              confidence: data.best_match?.confidence,
              verificationId: data.verification_id,
              timestamp: FieldValue.serverTimestamp(),
              read: false,
              priority: data.verified ? "normal" : "high",
            });
          }

          // Notify caregivers/family
          for (const caregiverId of caregivers) {
            await db
              .collection("users")
              .doc(caregiverId)
              .collection("notifications")
              .add({
                type: notificationType,
                patientId: user_id,
                patientName: userData?.name || "Patient",
                title: title,
                message: data.message || "",
                medicineName: data.best_match?.medicine_name,
                verified: data.verified,
                confidence: data.best_match?.confidence,
                verificationId: data.verification_id,
                timestamp: FieldValue.serverTimestamp(),
                read: false,
                priority: data.verified ? "normal" : "high",
              });
          }
        }
      } catch (firestoreError) {
        console.error("Failed to store in Firestore:", firestoreError);
        // Don't fail the request if Firestore fails
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Medicine verification error:", error);
    
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
      { error: error.message || "Failed to verify medicine" },
      { status: 500 }
    );
  }
}
