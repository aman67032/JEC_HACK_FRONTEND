import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { validateUrlField, validateStringField } from "@/lib/validation";

/**
 * Cloud Function equivalent: Process prescription upload with Google Vision API OCR
 * Triggered when a prescription image is uploaded to Firebase Storage
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, userId, prescriptionId } = body;

    // Validate required fields with type checking
    const imageUrlValidation = validateUrlField(imageUrl, "imageUrl");
    if (!imageUrlValidation.valid) {
      return NextResponse.json(
        { error: imageUrlValidation.error || "Invalid imageUrl" },
        { status: 400 }
      );
    }

    const userIdValidation = validateStringField(userId, "userId");
    if (!userIdValidation.valid) {
      return NextResponse.json(
        { error: userIdValidation.error || "Invalid userId" },
        { status: 400 }
      );
    }

    // Call Google Vision API for OCR
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!visionApiKey) {
      // Fallback: Use Tesseract.js if Vision API key not configured
      return NextResponse.json({
        message: "Google Vision API key not configured. Use client-side OCR.",
        extractedText: "",
        medicines: []
      });
    }

    // Google Vision API OCR request
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [{ type: "TEXT_DETECTION", maxResults: 10 }]
            }
          ]
        })
      }
    );

    if (!visionResponse.ok) {
      throw new Error(`Vision API error: ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    const extractedText =
      visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    // Parse medicines from extracted text
    const medicines = parseMedicinesFromText(extractedText);

    // Store in Firestore
    const db = getFirestoreAdmin();
    const prescriptionRef = db.collection("users").doc(userId).collection("prescriptions").doc(prescriptionId || `pres_${Date.now()}`);

    await prescriptionRef.set(
      {
        fileUrl: imageUrl,
        uploadedBy: userId,
        uploadedAt: FieldValue.serverTimestamp(),
        extractedText: extractedText,
        medicines: medicines,
        status: "processed",
        verifiedMedicines: [],
      },
      { merge: true }
    );

    // Automatically add medicines to user's medication list
    if (medicines.length > 0) {
      const medicationsRef = db.collection("users").doc(userId).collection("medications");
      for (const med of medicines) {
        await medicationsRef.add({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "daily",
          start: new Date().toISOString(),
          addedBy: "Prescription OCR",
          status: "active",
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Notify doctors and family about extracted medicines
      await notifyPrescriptionExtracted(userId, medicines, prescriptionId);

      // Trigger automatic drug interaction check
      await checkDrugInteractions(userId, medicines.map(m => m.name));
    }

    return NextResponse.json({
      success: true,
      extractedText,
      medicines,
      message: `Extracted ${medicines.length} medicines from prescription`,
    });
  } catch (error: any) {
    console.error("Prescription OCR error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process prescription" },
      { status: 500 }
    );
  }
}

function parseMedicinesFromText(text: string): Array<{ name: string; dosage: string; frequency?: string }> {
  const medicines: Array<{ name: string; dosage: string; frequency?: string }> = [];
  const lines = text.split("\n").filter(line => line.trim());

  for (const line of lines) {
    // Match medicine patterns: "Medicine Name - 500mg - 2/day"
    const medMatch = line.match(/([A-Za-z\s]+?)\s*[-–—]?\s*(\d+\s*(?:mg|ml|tablets?)?)\s*[-–—]?\s*([\d\/day\s]+)?/i);
    if (medMatch) {
      medicines.push({
        name: medMatch[1].trim(),
        dosage: medMatch[2].trim(),
        frequency: medMatch[3]?.trim() || "daily",
      });
    } else if (line.match(/\d+\s*(?:mg|ml)/i)) {
      // Fallback: extract if dosage pattern found
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        medicines.push({
          name: parts[0],
          dosage: parts.find(p => p.match(/\d+\s*(?:mg|ml)/i)) || "",
          frequency: "daily",
        });
      }
    }
  }

  return medicines;
}

async function checkDrugInteractions(userId: string, medicineNames: string[]): Promise<void> {
  try {
    // Get all existing medications
    const db = getFirestoreAdmin();
    const userMedsSnapshot = await db.collection("users").doc(userId).collection("medications")
      .where("status", "==", "active")
      .get();

    const allMedicines = [...medicineNames];
    userMedsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && !allMedicines.includes(data.name)) {
        allMedicines.push(data.name);
      }
    });

    if (allMedicines.length < 2) return; // Need at least 2 medicines to check interactions

    // Get RxNav CUIs for all medicines
    const cuis: string[] = [];
    for (const name of allMedicines) {
      try {
        const resp = await fetch(
          `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(name)}&maxEntries=1`
        );
        const json = await resp.json();
        const cui = json.approximateGroup?.candidate?.[0]?.rxcui;
        if (cui) cuis.push(cui);
      } catch (e) {
        console.error(`Failed to get CUI for ${name}:`, e);
      }
    }

    if (cuis.length < 2) return;

    // Check interactions
    const interactionResp = await fetch(
      `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${cuis.join("+")}`
    );
    const interactionData = await interactionResp.json();
    const warnings: string[] = [];

    const groups = interactionData.fullInteractionTypeGroup || [];
    for (const g of groups) {
      for (const t of g.fullInteractionType || []) {
        for (const p of t.interactionPair || []) {
          warnings.push(p.description);
        }
      }
    }

    if (warnings.length > 0) {
      // Store interaction warnings
      await db.collection("users").doc(userId).collection("drugInteractions").add({
        medicines: allMedicines,
        warnings: warnings,
        timestamp: FieldValue.serverTimestamp(),
        severity: "high",
      });

      // Send FCM notification to patient and caregivers
      await sendInteractionAlert(userId, warnings);
    }
  } catch (error) {
    console.error("Drug interaction check error:", error);
  }
}

async function sendInteractionAlert(userId: string, warnings: string[]): Promise<void> {
  try {
    const db = getFirestoreAdmin();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const caregivers = userData?.caregivers || [];

    // Create notification for patient
    await db.collection("users").doc(userId).collection("notifications").add({
      type: "drug_interaction",
      title: "⚠️ Drug Interaction Alert",
      message: `Dangerous interactions detected: ${warnings.slice(0, 2).join(", ")}`,
      warnings: warnings,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      priority: "high",
    });

    // Notify caregivers
    for (const caregiverId of caregivers) {
      await db.collection("users").doc(caregiverId).collection("notifications").add({
        type: "drug_interaction",
        patientId: userId,
        patientName: userData?.name || "Patient",
        title: "⚠️ Drug Interaction Alert",
        message: `${userData?.name || "Patient"} has potential drug interactions detected`,
        warnings: warnings,
        timestamp: FieldValue.serverTimestamp(),
        read: false,
        priority: "high",
      });
    }

    // TODO: Send FCM push notification if FCM tokens available
  } catch (error) {
    console.error("Failed to send interaction alert:", error);
  }
}

/**
 * Notify connected doctors and family members when medicines are extracted from prescription
 */
async function notifyPrescriptionExtracted(
  userId: string,
  medicines: Array<{ name: string; dosage: string; frequency?: string }>,
  prescriptionId: string
): Promise<void> {
  try {
    const db = getFirestoreAdmin();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return;

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
      .map(m => `• ${m.name} - ${m.dosage}${m.frequency ? ` (${m.frequency})` : ""}`)
      .join("\n");

    const notificationMessage = `New prescription uploaded. Extracted ${medicines.length} medicine(s):\n${medicineList}`;

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
                message: `${medicines.length} medicine(s) extracted: ${medicines.slice(0, 2).map(m => m.name).join(", ")}${medicines.length > 2 ? "..." : ""}`,
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
                message: `${medicines.length} medicine(s) extracted: ${medicines.slice(0, 2).map(m => m.name).join(", ")}${medicines.length > 2 ? "..." : ""}`,
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
  } catch (error) {
    console.error("Failed to send prescription extraction notifications:", error);
  }
}

