"use client";

import { useState, useEffect } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

interface Patient {
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

interface FamilyPatientSelectorProps {
  familyId: string;
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
  onPatientsLoaded: (patients: Patient[]) => void;
}

export default function FamilyPatientSelector({
  familyId,
  selectedPatientId,
  onPatientSelect,
  onPatientsLoaded,
}: FamilyPatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;

    const db = firestoreDb();
    const usersRef = collection(db, "users");
    const familyQuery = query(usersRef, where("caregivers", "array-contains", familyId));

    const unsubscribe = onSnapshot(
      familyQuery,
      (snapshot) => {
        const patientList: Patient[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.role === "patient") {
            patientList.push({
              patientId: doc.id,
              name: data.name || "Unknown",
              email: data.email,
              age: data.age,
              gender: data.gender,
              shareCode: data.shareCode,
              conditions: data.conditions || [],
              allergies: data.allergies || [],
              connectedAt: data.connectedAt,
              photoUrl: data.profilePhoto || data.photoUrl,
            });
          }
        });
        setPatients(patientList);
        onPatientsLoaded(patientList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading patients:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId, onPatientsLoaded]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 p-4 bg-white">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 bg-white text-center">
        <p className="text-gray-600 mb-2 font-semibold">No patients connected yet</p>
        <p className="text-sm text-gray-500 mb-4">Click the "Connect New Patient" button above to add a patient using their share code</p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>How to connect:</strong> Ask the patient for their share code, then click "Connect New Patient" and enter the code when prompted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Select Patient to Monitor
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {patients.map((patient) => (
          <button
            key={patient.patientId}
            onClick={() => onPatientSelect(patient.patientId)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedPatientId === patient.patientId
                ? "border-red-500 bg-red-50 shadow-md"
                : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {patient.photoUrl ? (
                  <img
                    src={patient.photoUrl}
                    alt={patient.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{patient.name}</p>
                {patient.age && (
                  <p className="text-xs text-gray-500">{patient.age} years old</p>
                )}
                {patient.shareCode && (
                  <p className="text-xs text-gray-400 font-mono">ID: {patient.shareCode}</p>
                )}
              </div>
              {selectedPatientId === patient.patientId && (
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {patients.length > 1 && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          💡 You can monitor {patients.length} patient{patients.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

