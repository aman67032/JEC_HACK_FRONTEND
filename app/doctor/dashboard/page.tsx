"use client";

import RequireAuth from "@/components/RequireAuth";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

interface PatientInfo {
  patientId: string;
  name: string;
  email?: string;
  age?: number;
  gender?: string;
  conditions?: string[];
  allergies?: string[];
  shareCode?: string;
  connectedAt?: string;
}

export default function DoctorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get doctor's user document
        const doctorDoc = await getDoc(doc(firestoreDb(), "users", user.uid));
        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data();
          setDoctorInfo(doctorData);
          setIsVerified(doctorData.isVerified === true);
        }

        // Get connected patients from subcollection
        const patientsRef = collection(firestoreDb(), `users/${user.uid}/patients`);
        const patientsSnap = await getDocs(patientsRef);
        
        const patientsList: PatientInfo[] = [];
        
        for (const patientDoc of patientsSnap.docs) {
          const patientId = patientDoc.id;
          const connectionData = patientDoc.data();
          
          // Get patient's full details
          const patientUserDoc = await getDoc(doc(firestoreDb(), "users", patientId));
          
          if (patientUserDoc.exists()) {
            const patientData = patientUserDoc.data();
            patientsList.push({
              patientId,
              name: patientData.name || "Unknown",
              email: patientData.email,
              age: patientData.age,
              gender: patientData.gender,
              conditions: patientData.conditions || [],
              allergies: patientData.allergies || [],
              shareCode: patientData.shareCode,
              connectedAt: connectionData.connectedAt,
            });
          }
        }
        
        setPatients(patientsList);
      } catch (e: any) {
        console.error("Error loading doctor dashboard:", e);
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl border border-zinc-200 p-8 text-center text-[color:var(--color-muted)] dark:border-zinc-800">
            Loading dashboard...
          </div>
        </div>
      </RequireAuth>
    );
  }

  // Demo mode: Allow access if verification is submitted (not requiring actual verification)
  if (!isVerified && doctorInfo?.verificationStatus !== "submitted") {
    return (
      <RequireAuth>
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950">
            <h2 className="mb-4 text-2xl font-semibold text-amber-900 dark:text-amber-100">
              Verification Required
            </h2>
            <p className="mb-6 text-amber-800 dark:text-amber-200">
              Your doctor account needs to be verified before you can access the patient dashboard.
              Please submit your hospital and degree credentials for verification.
            </p>
            <a
              href="/doctor/verify"
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Go to Verification Page
            </a>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Doctor Dashboard</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {doctorInfo?.name || "Doctor"} • {doctorInfo?.specialization || "General Practice"}
            </p>
            {doctorInfo?.clinic && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{doctorInfo.clinic}</p>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 dark:border-green-800 dark:bg-green-950">
            <span className="text-green-700 dark:text-green-300">✓ Verified</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Connected Patients ({patients.length})</h2>
            <a
              href="/admin/doctor"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Connect New Patient
            </a>
          </div>

          {patients.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <p className="mb-4">No patients connected yet.</p>
              <p className="text-sm">
                Use the "Connect New Patient" button to connect with patients using their share code.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <div
                  key={patient.patientId}
                  className="rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{patient.name}</h3>
                      {patient.email && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{patient.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">Patient ID:</span>
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {patient.shareCode || patient.patientId.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    {patient.age && (
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Age: </span>
                        <span>{patient.age}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Gender: </span>
                        <span>{patient.gender}</span>
                      </div>
                    )}
                  </div>

                  {patient.conditions && patient.conditions.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Conditions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {patient.conditions.map((condition, idx) => (
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

                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Allergies:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, idx) => (
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

                  {patient.connectedAt && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      Connected: {new Date(patient.connectedAt).toLocaleDateString()}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <a
                      href={`/doctor/patient/${patient.patientId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Full Profile →
                    </a>
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

