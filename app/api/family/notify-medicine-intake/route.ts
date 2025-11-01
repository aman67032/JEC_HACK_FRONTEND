import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Notify family members when patient takes medicine
 * This endpoint should be called by the medicine verification system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, medicineName, dosage, status, verified, proofPhotoUrl, validationDetails } = body;

    if (!patientId || !medicineName) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, medicineName" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();

    // Get patient document to find caregivers
    const patientDoc = await db.collection("users").doc(patientId).get();
    if (!patientDoc.exists) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patientData = patientDoc.data();
    const caregivers = patientData?.caregivers || [];
    const patientName = patientData?.name || "Patient";

    if (caregivers.length === 0) {
      return NextResponse.json({ ok: true, notified: 0, message: "No caregivers to notify" });
    }

    // Create notification document for each caregiver
    const notifications = [];
    const timestamp = FieldValue.serverTimestamp();

    for (const caregiverId of caregivers) {
      const notificationData = {
        type: status === "wrong_medicine" ? "wrong_medicine_alert" : "medicine_taken",
        title:
          status === "wrong_medicine"
            ? `⚠️ WRONG MEDICINE ALERT - ${patientName}`
            : verified
            ? `✅ Medicine Taken - ${patientName}`
            : `💊 Medicine Marked - ${patientName}`,
        message:
          status === "wrong_medicine"
            ? `${patientName} took ${medicineName} (${dosage || ""}). WRONG MEDICINE DETECTED! ${validationDetails || ""}`
            : verified
            ? `${patientName} verified taking ${medicineName} (${dosage || ""}) correctly.`
            : `${patientName} marked ${medicineName} (${dosage || ""}) as taken. Pending verification.`,
        patientId,
        patientName,
        medicineName,
        dosage,
        status,
        verified: verified || false,
        proofPhotoUrl: proofPhotoUrl || null,
        validationDetails: validationDetails || null,
        timestamp,
        read: false,
        priority: status === "wrong_medicine" ? "high" : "normal",
      };

      await db
        .collection("users")
        .doc(caregiverId)
        .collection("notifications")
        .add(notificationData);

      notifications.push(caregiverId);

      // Also create an intake event in family dashboard format
      await db
        .collection("users")
        .doc(patientId)
        .collection("medicineIntakes")
        .add({
          patientId,
          patientName,
          medicineName,
          dosage,
          scheduledTime: timestamp,
          actualTakenTime: timestamp,
          status,
          verified,
          proofPhotoUrl,
          validationDetails,
          timestamp,
          notifiedCaregivers: true,
        });
    }

    // Send FCM push notifications to caregivers
    // Note: This would require FCM tokens - you can add that integration separately
    // For now, we store notifications in Firestore which the dashboard listens to

    return NextResponse.json({
      ok: true,
      notified: notifications.length,
      caregivers: notifications,
      message: `Notified ${notifications.length} caregiver(s)`,
    });
  } catch (error: any) {
    console.error("Error notifying caregivers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to notify caregivers" },
      { status: 500 }
    );
  }
}

