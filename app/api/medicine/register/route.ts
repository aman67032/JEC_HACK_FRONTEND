/**
 * Next.js API Route: Medicine Registration
 * Proxies to Python Flask API for medicine registration with Firebase Storage URLs
 */

import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_MEDICINE_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, medicine_name, user_id, dosage } = body;

    if (!imageUrl || !medicine_name || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: imageUrl, medicine_name, user_id" },
        { status: 400 }
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
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

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
    return NextResponse.json(
      { error: error.message || "Failed to register medicine" },
      { status: 500 }
    );
  }
}
