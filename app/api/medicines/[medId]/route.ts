import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { medId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);
    const body = await request.json();
    const { medId } = params;

    const db = getFirestoreAdmin();
    const medRef = db
      .collection("users")
      .doc(uid)
      .collection("medicines")
      .doc(medId);

    const doc = await medRef.get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (body.name) updateData.name = body.name;
    if (body.dosage !== undefined) updateData.dosage = body.dosage;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await medRef.update(updateData);

    return NextResponse.json({ ok: true, id: medId, updated: updateData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update medicine" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { medId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);
    const { medId } = params;

    const db = getFirestoreAdmin();
    const medRef = db
      .collection("users")
      .doc(uid)
      .collection("medicines")
      .doc(medId);

    await medRef.delete();

    return NextResponse.json({ ok: true, deleted: medId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete medicine" },
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

