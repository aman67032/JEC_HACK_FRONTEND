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

        {familyId && (
          <>
            {/* Patient Selector */}
            <FamilyPatientSelector
              familyId={familyId}
              selectedPatientId={selectedPatientId}
              onPatientSelect={handlePatientSelect}
              onPatientsLoaded={handlePatientsLoaded}
            />

            {selectedPatientId && (
              <>
                {/* Alert Banner */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">
                    👨‍👩‍👧‍👦 Family Caregiver View - Monitoring {selectedPatientName}
                  </p>
                  <p className="mt-1 text-xs text-red-800">
                    You will receive real-time notifications when {selectedPatientName} takes medicines or if wrong medicine is detected.
                  </p>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Medicine Intake Notifications */}
                    <FamilyMedicineNotifications
                      patientId={selectedPatientId}
                      patientName={selectedPatientName}
                    />

                    {/* Weekly Report */}
                    <FamilyWeeklyReport
                      patientId={selectedPatientId}
                      patientName={selectedPatientName}
                    />
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className="space-y-6">
                    {/* Smart Med Card */}
                    <FamilySmartMedCard
                      patientId={selectedPatientId}
                      patientName={selectedPatientName}
                    />

                    {/* Emergency Button */}
                    <EmergencyButton />
                  </div>
                </div>
              </>
            )}
          </>
        )}
        
        {/* Chatbot */}
        <ChatBot />
      </div>
    </RequireAuth>
  );
}

