import type { NextRequest } from "next/server";
import { getAuthAdmin, getFirestoreAdmin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
    const idToken = authHeader.slice("Bearer ".length);
    const auth = getAuthAdmin();
    const decoded = await auth.verifyIdToken(idToken);
    const familyId = decoded.uid;
    const role = (decoded as any).role;
    if (role !== "family") return new Response("Forbidden - Family role required", { status: 403 });

    const { shareCode } = await req.json();
    if (!shareCode) return new Response("shareCode required", { status: 400 });

    const db = getFirestoreAdmin();
    const codeSnap = await db.doc(`publicShareCodes/${shareCode}`).get();
    if (!codeSnap.exists) return new Response("Invalid code", { status: 404 });
    const patientId = (codeSnap.data() as any).patientId as string;

    // Update patient's caregivers array and family's patients list
    const patientRef = db.doc(`users/${patientId}`);
    const familyPatientRef = db.doc(`users/${familyId}/patients/${patientId}`);

    await db.runTransaction(async (tx) => {
      const pSnap = await tx.get(patientRef);
      const data = (pSnap.exists ? pSnap.data() : {}) as any;
      const caregivers: string[] = Array.isArray(data.caregivers) ? data.caregivers : [];
      if (!caregivers.includes(familyId)) caregivers.push(familyId);
      tx.set(patientRef, { caregivers }, { merge: true });
      tx.set(familyPatientRef, { connectedAt: new Date().toISOString() }, { merge: true });
    });

    return new Response(JSON.stringify({ ok: true, patientId }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Failed to connect" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

