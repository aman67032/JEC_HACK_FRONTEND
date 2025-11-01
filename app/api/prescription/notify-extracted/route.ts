import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Notify doctors and family when medicines are extracted from prescription (for client-side OCR)
 * This endpoint is called after client-side OCR saves medicines to Firestore
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, prescriptionId, medicines } = body;

    if (!userId || !prescriptionId || !medicines || !Array.isArray(medicines)) {
      return NextResponse.json(
        { error: "Missing required fields: userId, prescriptionId, medicines" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const patientName = userData?.name || "Patient";
    
    // Get connected doctors from privacy settings
    const privacy = userData?.privacy || {};
    const doctorIds: string[] = Array.isArray(privacy.shareWithDoctorIds) 
      ? privacy.shareWithDoctorIds 
      : [];
    
    // Get connected family/caregivers
    const caregivers: string[] = Array.isArray(userData?.caregivers) 
      ? userData.caregivers 
      : [];

    // Create medicine list text
    const medicineList = medicines
      .map((m: any) => `• ${m.name} - ${m.dosage}${m.frequency ? ` (${m.frequency})` : ""}`)
      .join("\n");

    // Notify connected doctors
    for (const doctorId of doctorIds) {
      try {
        await db.collection("users").doc(doctorId).collection("notifications").add({
          type: "prescription_extracted",
          patientId: userId,
          patientName: patientName,
          prescriptionId: prescriptionId,
          title: "📋 New Prescription Uploaded",
          message: `${patientName} uploaded a prescription with ${medicines.length} medicine(s) extracted via OCR.`,
          medicines: medicines,
          medicineList: medicineList,
          timestamp: FieldValue.serverTimestamp(),
          read: false,
          priority: "normal",
        });

        // Send FCM notification to doctor
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/fcm`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: doctorId,
                type: "prescription_extracted",
                title: "📋 New Prescription - " + patientName,
                message: `${medicines.length} medicine(s) extracted: ${medicines.slice(0, 2).map((m: any) => m.name).join(", ")}${medicines.length > 2 ? "..." : ""}`,
                data: {
                  patientId: userId,
                  patientName: patientName,
                  prescriptionId: prescriptionId,
                  medicinesCount: medicines.length,
                },
              }),
            }
          );
        } catch (fcmError) {
          console.error(`Failed to send FCM to doctor ${doctorId}:`, fcmError);
        }
      } catch (error) {
        console.error(`Failed to notify doctor ${doctorId}:`, error);
      }
    }

    // Notify connected family/caregivers
    for (const caregiverId of caregivers) {
      try {
        await db.collection("users").doc(caregiverId).collection("notifications").add({
          type: "prescription_extracted",
          patientId: userId,
          patientName: patientName,
          prescriptionId: prescriptionId,
          title: "📋 New Prescription Uploaded",
          message: `${patientName} uploaded a prescription with ${medicines.length} medicine(s) extracted via OCR.`,
          medicines: medicines,
          medicineList: medicineList,
          timestamp: FieldValue.serverTimestamp(),
          read: false,
          priority: "normal",
        });

        // Send FCM notification to caregiver
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/fcm`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: caregiverId,
                type: "prescription_extracted",
                title: "📋 New Prescription - " + patientName,
                message: `${medicines.length} medicine(s) extracted: ${medicines.slice(0, 2).map((m: any) => m.name).join(", ")}${medicines.length > 2 ? "..." : ""}`,
                data: {
                  patientId: userId,
                  patientName: patientName,
                  prescriptionId: prescriptionId,
                  medicinesCount: medicines.length,
                },
              }),
            }
          );
        } catch (fcmError) {
          console.error(`Failed to send FCM to caregiver ${caregiverId}:`, fcmError);
        }
      } catch (error) {
        console.error(`Failed to notify caregiver ${caregiverId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      notified: doctorIds.length + caregivers.length,
      message: `Notifications sent to ${doctorIds.length} doctor(s) and ${caregivers.length} caregiver(s)`,
    });
  } catch (error: any) {
    console.error("Prescription notification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notifications" },
      { status: 500 }
    );
  }
}

