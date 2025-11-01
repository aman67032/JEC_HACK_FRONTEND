"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import RequireAuth from "@/components/RequireAuth";
import EmergencyButton from "@/components/EmergencyButton";
import { useAuthClaims } from "@/lib/auth";
import FamilyPatientSelector from "@/components/FamilyPatientSelector";
import FamilyMedicineNotifications from "@/components/FamilyMedicineNotifications";
import FamilyWeeklyReport from "@/components/FamilyWeeklyReport";
import FamilySmartMedCard from "@/components/FamilySmartMedCard";
import ChatBot from "@/components/chatbot/ChatBot";

interface ConnectedPatient {
  patientId: string;
  name: string;
  email?: string;
  age?: number;
  gender?: string;
  shareCode?: string;
  conditions?: string[];
  allergies?: string[];
  connectedAt?: string;
  photoUrl?: string;
}

export default function FamilyDashboardPage() {
  const router = useRouter();
  const { token } = useAuthClaims();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedPatients, setConnectedPatients] = useState<ConnectedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setFamilyId(user.uid);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handlePatientsLoaded = (patients: ConnectedPatient[]) => {
    setConnectedPatients(patients);
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].patientId);
      setSelectedPatientName(patients[0].name);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = connectedPatients.find((p) => p.patientId === patientId);
    setSelectedPatientName(patient?.name || "Patient");
  };

  async function connectPatient() {
    const connectCode = prompt("Enter patient share code to connect:");
    if (!connectCode || !token) return;

    try {
      const response = await fetch("/api/family/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shareCode: connectCode.trim().toUpperCase() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to connect");
      
      alert("Successfully connected to patient! Refreshing...");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Failed to connect to patient");
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl border border-zinc-200 p-8 text-center text-[color:var(--color-muted)] dark:border-zinc-800">
            Loading family dashboard...
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Family Dashboard Header */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
          <h1 className="mb-2 text-3xl font-bold">👨‍👩‍👧‍👦 Family Caregiver Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Welcome, {familyName}! Monitor and help manage medications for your connected patients.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {connectedPatients.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="mb-2 text-lg font-semibold">No Patients Connected</p>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Ask your family member to share their Patient ID (share code) with you, then connect using the button below.
            </p>
            <button
              onClick={connectPatient}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Connect to Patient
            </button>
          </div>
        ) : (
          <>
            {/* Patient Selector */}
            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold">Select Patient to View:</label>
                <button
                  onClick={connectPatient}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  + Connect New Patient
                </button>
              </div>
              <select
                value={selectedPatientId || ""}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                {connectedPatients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.name} {patient.age ? `(${patient.age} years old)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Alerts Banner for Family Members */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                ⚠️ Family Member View
              </p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                You are viewing {selectedPatientId ? connectedPatients.find(p => p.patientId === selectedPatientId)?.name || "patient" : "a patient"}'s information. 
                You can help manage medications and track adherence.
              </p>
            </div>

            {selectedPatientId && (
              <>
                {/* Patient Info Card */}
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <h2 className="mb-2 text-lg font-semibold">
                    Viewing: {connectedPatients.find(p => p.patientId === selectedPatientId)?.name || "Patient"}
                  </h2>
                  {connectedPatients.find(p => p.patientId === selectedPatientId) && (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      <p>Patient ID: {connectedPatients.find(p => p.patientId === selectedPatientId)?.shareCode || selectedPatientId.slice(0, 8).toUpperCase()}</p>
                      {connectedPatients.find(p => p.patientId === selectedPatientId)?.age && (
                        <p>Age: {connectedPatients.find(p => p.patientId === selectedPatientId)?.age} years</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Note: Components need to be updated to support patientId prop for multi-patient view */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 Note: Currently viewing basic patient information. Full dashboard features for family members will be available soon.
                  </p>
                </div>

                {/* Placeholder for patient-specific views */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="col-span-1 grid gap-6 lg:col-span-2">
                    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                      <h3 className="mb-4 text-lg font-semibold">Patient Profile</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        View and manage patient profile information.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                      <h3 className="mb-4 text-lg font-semibold">Medicine List</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        View all medications for this patient.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                      <h3 className="mb-4 text-lg font-semibold">Medicine Schedule</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Track medication schedule and adherence.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                      <h3 className="mb-4 text-lg font-semibold">Reminders</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Medication reminders and alerts for this patient.
                      </p>
                    </div>
                  </div>
                  <div className="col-span-1 grid gap-6">
                    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                      <h3 className="mb-4 text-lg font-semibold">Adherence Tracker</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        View adherence statistics for this patient.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                      <h3 className="mb-4 text-lg font-semibold">History Report</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        View medication history and reports.
                      </p>
                    </div>
                    <EmergencyButton />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </RequireAuth>
  );
}

