import type { NextRequest } from "next/server";
import { getAuthAdmin, getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { handleFirebaseError } from "@/lib/firebaseHelpers";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized - Missing or invalid Bearer token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const idToken = authHeader.slice("Bearer ".length);
    let auth, decoded, doctorId, role;
    
    try {
      auth = getAuthAdmin();
      decoded = await auth.verifyIdToken(idToken);
      doctorId = decoded.uid;
      role = (decoded as any).role;
    } catch (authError: any) {
      const errorResponse = handleFirebaseError(authError);
      return new Response(
        JSON.stringify({ ok: false, error: errorResponse.message }),
        { status: errorResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (role !== "doctor") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Doctor role required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const { shareCode } = await req.json();
    if (!shareCode) {
      return new Response(
        JSON.stringify({ ok: false, error: "shareCode required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let db;
    try {
      db = getFirestoreAdmin();
    } catch (firebaseError: any) {
      const errorResponse = handleFirebaseError(firebaseError);
      return new Response(
        JSON.stringify({ ok: false, error: errorResponse.message }),
        { status: errorResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const codeSnap = await db.doc(`publicShareCodes/${shareCode}`).get();
    if (!codeSnap.exists) return new Response("Invalid code", { status: 404 });
    const patientId = (codeSnap.data() as any).patientId as string;

    // Update patient privacy list and doctor's patient list
    const patientRef = db.doc(`users/${patientId}`);
    const doctorPatientRef = db.doc(`users/${doctorId}/patients/${patientId}`);

    await db.runTransaction(async (tx) => {
      const pSnap = await tx.get(patientRef);
      const data = (pSnap.exists ? pSnap.data() : {}) as any;
      const privacy = data.privacy || {};
      const list: string[] = Array.isArray(privacy.shareWithDoctorIds) ? privacy.shareWithDoctorIds : [];
      if (!list.includes(doctorId)) list.push(doctorId);
      tx.set(patientRef, { privacy: { ...privacy, shareWithDoctorIds: list } }, { merge: true });
      tx.set(doctorPatientRef, { connectedAt: new Date().toISOString() }, { merge: true });
    });

    return new Response(JSON.stringify({ ok: true, patientId }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    const errorResponse = handleFirebaseError(e);
    return new Response(
      JSON.stringify({ ok: false, error: errorResponse.message }),
      { status: errorResponse.status, headers: { "Content-Type": "application/json" } }
    );
  }
}


