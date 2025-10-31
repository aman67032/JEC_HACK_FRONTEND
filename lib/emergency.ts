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

  // Get origin safely (works in browser)
  const origin = typeof window !== "undefined" ? window.location.origin : "";

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
    qrLink: `${origin}/emergency/${summaryId}`,
    status: "active"
  };

  try {
    // Write to public collection (readable without auth while not expired)
    await setDoc(doc(db, "publicEmergency", summaryId), payload);
    console.log("✅ Emergency summary written to publicEmergency collection");
  } catch (error) {
    console.error("Failed to write to publicEmergency:", error);
    throw new Error(`Failed to create public emergency summary: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // If userId provided, also store under user's private tree
  if (params.userId) {
    try {
      await setDoc(doc(collection(doc(db, "users", params.userId), "emergencySummaries"), summaryId), payload);
      console.log("✅ Emergency summary written to user's private collection");
    } catch (error) {
      console.error("Failed to write to user's emergencySummaries:", error);
      // Don't throw - public version was created successfully
      console.warn("Warning: Public emergency summary created but private copy failed");
    }
  }

  return { summaryId, publicUrl: payload.qrLink };
}

export async function readPublicEmergencySummary(summaryId: string): Promise<EmergencySummaryDoc | null> {
  const db = firestoreDb();
  const snap = await getDoc(doc(db, "publicEmergency", summaryId));
  if (!snap.exists()) return null;
  return snap.data() as EmergencySummaryDoc;
}


