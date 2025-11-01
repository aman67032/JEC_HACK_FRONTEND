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
    const token = randomBytes(16).toString("hex");

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const db = getFirestoreAdmin();

    // Fetch user profile
    const profileDoc = await db
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("meta")
      .get();

    const profile = profileDoc.exists ? profileDoc.data() : {};

    // Fetch medicines
    const medsSnapshot = await db
      .collection("users")
      .doc(uid)
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
      owner: uid,
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

