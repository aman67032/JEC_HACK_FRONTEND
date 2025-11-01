import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);

    const db = getFirestoreAdmin();
    const medsRef = db
      .collection("users")
      .doc(uid)
      .collection("medicines");

    const snapshot = await medsRef.get();
    const medicines = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ ok: true, medicines });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);
    const body = await request.json();

    const { name, dosage, frequency, start_date, end_date, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Medicine name is required" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const medRef = db
      .collection("users")
      .doc(uid)
      .collection("medicines")
      .doc();

    const now = new Date();
    const payload = {
      name,
      dosage: dosage || null,
      frequency: frequency || null,
      start_date: start_date || null,
      end_date: end_date || null,
      notes: notes || null,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      added_by: uid,
    };

    await medRef.set(payload);

    return NextResponse.json({
      ok: true,
      id: medRef.id,
      data: { ...payload, created_at: now, updated_at: now },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add medicine" },
      { status: 500 }
    );
  }
}

async function getUserIdFromToken(
  authHeader: string | null
): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Allow anonymous for dev, but in production you might want to require auth
    return "anonymous";
  }

  try {
    const { getAuthAdmin } = await import("@/lib/firebaseAdmin");
    const auth = getAuthAdmin();
    const token = authHeader.split(" ")[1];
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    // Return anonymous if token verification fails
    return "anonymous";
  }
}

