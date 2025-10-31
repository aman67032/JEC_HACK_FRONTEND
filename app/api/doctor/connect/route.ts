import type { NextRequest } from "next/server";
import { getAuthAdmin, getFirestoreAdmin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
    const idToken = authHeader.slice("Bearer ".length);
    const auth = getAuthAdmin();
    const decoded = await auth.verifyIdToken(idToken);
    const doctorId = decoded.uid;
    const role = (decoded as any).role;
    if (role !== "doctor") return new Response("Forbidden", { status: 403 });

    const { shareCode } = await req.json();
    if (!shareCode) return new Response("shareCode required", { status: 400 });

    const db = getFirestoreAdmin();
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
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}


