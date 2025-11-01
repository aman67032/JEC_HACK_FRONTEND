"use client";

import RequireAuth from "@/components/RequireAuth";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
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

interface ReportInfo {
  id: string;
  type: "prescription" | "report";
  date: any;
  fileName?: string;
  fileUrl?: string;
  extractedText?: string;
  medicines?: Array<{ name: string; dosage: string }>;
  reportType?: string;
}

export default function PatientProfilePage() {
  const params = useParams();
  const patientId = params?.patientId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

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

        // Load patient reports
        await loadPatientReports(patientId);
      } catch (e: any) {
        console.error("Error loading patient profile:", e);
        setError(e?.message || "Failed to load patient profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [patientId]);

  async function loadPatientReports(patientId: string) {
    setReportsLoading(true);
    try {
      const reportsList: ReportInfo[] = [];
      
      // Fetch prescriptions
      const presRef = collection(firestoreDb(), `users/${patientId}/prescriptions`);
      const presQ = query(presRef, orderBy("uploadedAt", "desc"), limit(50));
      const presSnap = await getDocs(presQ);
      
      presSnap.docs.forEach((doc) => {
        const data = doc.data();
        reportsList.push({
          id: doc.id,
          type: "prescription",
          date: data.uploadedAt,
          fileUrl: data.fileUrl,
          extractedText: data.extractedText,
          medicines: data.medicines || [],
        });
      });
      
      // Fetch medical reports
      const reportsRef = collection(firestoreDb(), `users/${patientId}/medicalReports`);
      const reportsQ = query(reportsRef, orderBy("uploadedAt", "desc"), limit(50));
      const reportsSnap = await getDocs(reportsQ);
      
      reportsSnap.docs.forEach((doc) => {
        const data = doc.data();
        reportsList.push({
          id: doc.id,
          type: "report",
          date: data.uploadedAt,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          reportType: data.reportType,
        });
      });
      
      // Sort by date
      reportsList.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      });
      
      setReports(reportsList);
    } catch (e: any) {
      console.error("Error loading patient reports:", e);
    } finally {
      setReportsLoading(false);
    }
  }

  function formatDate(dateInput: any): string {
    try {
      let date: Date;
      if (dateInput?.toDate) {
        date = dateInput.toDate();
      } else if (typeof dateInput === "string") {
        date = new Date(dateInput);
      } else {
        return "Unknown date";
      }
      return date.toLocaleDateString("en-GB", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  }

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

        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-4 text-xl font-semibold">Patient Reports ({reports.length})</h2>
          {reportsLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No reports found for this patient.</p>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          report.type === "prescription"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        }`}>
                          {report.type === "prescription" ? "📋 Prescription" : "📄 Medical Report"}
                        </span>
                        {report.reportType && report.type === "report" && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {report.reportType}
                          </span>
                        )}
                      </div>
                      {report.fileName && (
                        <p className="mb-1 text-sm font-medium">{report.fileName}</p>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(report.date)}
                      </p>
                    </div>
                    {report.fileUrl && (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                      >
                        View
                      </a>
                    )}
                  </div>

                  {report.type === "prescription" && report.medicines && report.medicines.length > 0 && (
                    <div className="mt-2 rounded bg-zinc-50 p-2 dark:bg-zinc-800">
                      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Extracted Medicines:
                      </p>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300">
                        {report.medicines.slice(0, 5).map((med, idx) => (
                          <li key={idx}>
                            • {med.name} - {med.dosage}
                          </li>
                        ))}
                        {report.medicines.length > 5 && (
                          <li className="text-zinc-500 dark:text-zinc-400">
                            ... and {report.medicines.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {report.type === "prescription" && report.extractedText && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                        View extracted text
                      </summary>
                      <div className="mt-2 max-h-32 overflow-y-auto rounded bg-zinc-50 p-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {report.extractedText.substring(0, 500)}
                        {report.extractedText.length > 500 && "..."}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}

