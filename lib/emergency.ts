import { firestoreDb } from "./firebaseClient";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import type { EmergencySummaryDoc } from "@/types/pillsync";

export async function createEmergencySummary(params: {
  userId?: string; // if absent, only public doc is created
  patientName: string;
  age?: number;
  conditions?: string[];
  allergies?: string[];
  currentMedications: Array<{ name: string; dosage: string; frequency?: string }>;
  emergencyContact?: { name: string; phone: string };
  ttlMinutes?: number;
}): Promise<{ summaryId: string; publicUrl: string }>
{
  const db = firestoreDb();
  const summaryId = `${Date.now()}`;
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + (params.ttlMinutes ?? 30) * 60 * 1000).toISOString();

  const payload: EmergencySummaryDoc = {
    summaryId,
    generatedAt: nowIso,
    expiresAt: expiresAtIso,
    patientId: params.userId ?? "public",
    patientName: params.patientName,
    age: params.age,
    conditions: params.conditions,
    allergies: params.allergies,
    currentMedications: params.currentMedications,
    emergencyContact: params.emergencyContact,
    qrLink: `${location.origin}/emergency/${summaryId}`,
    status: "active"
  };

  // Write to public collection (readable without auth while not expired)
  await setDoc(doc(db, "publicEmergency", summaryId), payload);

  // If userId provided, also store under user's private tree
  if (params.userId) {
    await setDoc(doc(collection(doc(db, "users", params.userId), "emergencySummaries"), summaryId), payload);
  }

  return { summaryId, publicUrl: payload.qrLink };
}

export async function readPublicEmergencySummary(summaryId: string): Promise<EmergencySummaryDoc | null> {
  const db = firestoreDb();
  const snap = await getDoc(doc(db, "publicEmergency", summaryId));
  if (!snap.exists()) return null;
  return snap.data() as EmergencySummaryDoc;
}


