"use client";

import RequireAuth from "@/components/RequireAuth";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface MedicationInfo {
  medId: string;
  name: string;
  dosage: string;
  frequency: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export default function PatientProfilePage() {
  const params = useParams();
  const patientId = params?.patientId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setDoctorId(user.uid);

      try {
        // Get patient's information
        const patientDoc = await getDoc(doc(firestoreDb(), "users", patientId));
        
        if (!patientDoc.exists()) {
          setError("Patient not found");
          setLoading(false);
          return;
        }

        const patientData = patientDoc.data();
        setPatientInfo(patientData);

        // Get patient's medications
        const medsRef = collection(firestoreDb(), `users/${patientId}/medications`);
        const medsSnap = await getDocs(medsRef);
        
        const medsList: MedicationInfo[] = [];
        medsSnap.docs.forEach((medDoc) => {
          medsList.push({
            medId: medDoc.id,
            ...medDoc.data(),
          } as MedicationInfo);
        });
        
        setMedications(medsList);
      } catch (e: any) {
        console.error("Error loading patient profile:", e);
        setError(e?.message || "Failed to load patient profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [patientId]);

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl border border-zinc-200 p-8 text-center text-[color:var(--color-muted)] dark:border-zinc-800">
            Loading patient profile...
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error || !patientInfo) {
    return (
      <RequireAuth>
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error || "Patient not found"}
          </div>
          <a href="/doctor/dashboard" className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Back to Dashboard
          </a>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{patientInfo.name || "Patient"}</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              {patientInfo.email && <span>{patientInfo.email}</span>}
              {patientInfo.shareCode && (
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  ID: {patientInfo.shareCode}
                </span>
              )}
            </div>
          </div>
          <a
            href="/doctor/dashboard"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            ← Back to Dashboard
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
            <dl className="space-y-3 text-sm">
              {patientInfo.age && (
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">Age</dt>
                  <dd className="font-medium">{patientInfo.age}</dd>
                </div>
              )}
              {patientInfo.gender && (
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">Gender</dt>
                  <dd className="font-medium">{patientInfo.gender}</dd>
                </div>
              )}
              {patientInfo.phone && (
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">Phone</dt>
                  <dd className="font-medium">{patientInfo.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-xl font-semibold">Medical Information</h2>
            {patientInfo.conditions && patientInfo.conditions.length > 0 && (
              <div className="mb-4">
                <dt className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">Conditions</dt>
                <div className="flex flex-wrap gap-2">
                  {patientInfo.conditions.map((condition: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {patientInfo.allergies && patientInfo.allergies.length > 0 && (
              <div>
                <dt className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">Allergies</dt>
                <div className="flex flex-wrap gap-2">
                  {patientInfo.allergies.map((allergy: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(!patientInfo.conditions || patientInfo.conditions.length === 0) &&
              (!patientInfo.allergies || patientInfo.allergies.length === 0) && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No medical information available</p>
              )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-4 text-xl font-semibold">Current Medications ({medications.length})</h2>
          {medications.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No medications found</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {medications.map((med) => (
                <div
                  key={med.medId}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <h3 className="mb-2 font-semibold">{med.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Dosage: </span>
                      <span className="font-medium">{med.dosage}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Frequency: </span>
                      <span className="font-medium">{med.frequency}</span>
                    </div>
                    {med.startDate && (
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Start Date: </span>
                        <span className="font-medium">{med.startDate}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Status: </span>
                      <span className={`font-medium ${
                        med.status === "active" ? "text-green-600 dark:text-green-400" :
                        med.status === "stopped" ? "text-red-600 dark:text-red-400" :
                        "text-zinc-600 dark:text-zinc-400"
                      }`}>
                        {med.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}

