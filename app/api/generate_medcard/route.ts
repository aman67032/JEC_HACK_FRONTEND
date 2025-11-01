import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);
    const body = await request.json();

    const expiresInMinutes = body.expires_in_minutes || 60;
    const patientId = body.patient_id || uid; // Support family members generating for patients
    const token = randomBytes(16).toString("hex");

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const db = getFirestoreAdmin();

    // Check if user is family member trying to generate for patient
    if (patientId !== uid) {
      const patientDoc = await db.collection("users").doc(patientId).get();
      if (!patientDoc.exists) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      const patientData = patientDoc.data();
      const caregivers = patientData?.caregivers || [];
      if (!caregivers.includes(uid)) {
        return NextResponse.json({ error: "You don't have permission to generate med card for this patient" }, { status: 403 });
      }
    }

    // Fetch user profile
    const profileDoc = await db
      .collection("users")
      .doc(patientId)
      .collection("profile")
      .doc("meta")
      .get();

    const profile = profileDoc.exists ? profileDoc.data() : {};

    // If profile not found in subcollection, try main user doc
    if (!profileDoc.exists) {
      const userDoc = await db.collection("users").doc(patientId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (profile) {
          profile.name = userData?.name || "";
          profile.age = userData?.age || "";
          profile.allergies = userData?.allergies || [];
        }
      }
    }

    // Fetch medicines
    const medsSnapshot = await db
      .collection("users")
      .doc(patientId)
      .collection("medicines")
      .limit(10)
      .get();

    const meds = medsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name,
        dosage: data.dosage,
      };
    });

    // Save med card
    await db.collection("medcards").doc(token).set({
      owner: patientId,
      generatedBy: uid, // Track who generated it (patient or family member)
      profile: {
        name: profile?.name || "",
        age: profile?.age || "",
        allergies: profile?.allergies || [],
      },
      medicines: meds,
      expires_at: expiresAt,
      created_at: FieldValue.serverTimestamp(),
      read_only: true,
    });

    return NextResponse.json({
      ok: true,
      token,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate med card" },
      { status: 500 }
    );
  }
}

async function getUserIdFromToken(
  authHeader: string | null
): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return "anonymous";
  }

  try {
    const { getAuthAdmin } = await import("@/lib/firebaseAdmin");
    const auth = getAuthAdmin();
    const token = authHeader.split(" ")[1];
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    return "anonymous";
  }
}

