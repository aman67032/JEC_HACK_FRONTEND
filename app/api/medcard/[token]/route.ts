import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const db = getFirestoreAdmin();

    const doc = await db.collection("medcards").doc(token).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Med card not found" },
        { status: 404 }
      );
    }

    const data = doc.data();

    // Check expiry
    if (data?.expires_at) {
      const expiresAt = data.expires_at.toDate();
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Med card expired" },
          { status: 410 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      profile: data?.profile || {},
      medicines: data?.medicines || [],
      read_only: data?.read_only !== false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get med card" },
      { status: 500 }
    );
  }
}

