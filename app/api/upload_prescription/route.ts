import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin, getStorageBucket } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const uid = await getUserIdFromToken(authHeader);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const bucket = getStorageBucket();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `prescriptions/${uid}/${timestamp}_${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = bucket.file(fileName);

    await blob.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file public for now (you can make it private and use signed URLs)
    await blob.makePublic();
    const publicUrl = blob.publicUrl();

    // Save metadata to Firestore
    await db
      .collection("users")
      .doc(uid)
      .collection("prescriptions")
      .add({
        path: fileName,
        uploaded_at: FieldValue.serverTimestamp(),
        content_type: file.type,
        uploader: uid,
        signed_url: publicUrl,
      });

    return NextResponse.json({
      ok: true,
      file_path: fileName,
      signed_url: publicUrl,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload prescription" },
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

