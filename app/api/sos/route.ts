import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);
    const body = await request.json();

    const { location, note } = body;

    const db = getFirestoreAdmin();
    const sosRef = db
      .collection("users")
      .doc(uid)
      .collection("sos_events")
      .doc();

    const payload = {
      created_at: FieldValue.serverTimestamp(),
      location: location || null,
      note: note || null,
      user: uid,
      status: "triggered",
    };

    await sosRef.set(payload);

    return NextResponse.json({
      ok: true,
      event_id: sosRef.id,
      saved: payload,
      notice: "Event saved. Integrate FCM/SMS to notify caretakers.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger SOS" },
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

