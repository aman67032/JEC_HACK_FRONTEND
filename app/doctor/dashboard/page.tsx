"use client";

import RequireAuth from "@/components/RequireAuth";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, getDocs, query, orderBy, limit, setDoc } from "firebase/firestore";
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
  recentReports?: number;
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

export default function DoctorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState("");
  const [addPatientLoading, setAddPatientLoading] = useState(false);
  const [addPatientError, setAddPatientError] = useState<string | null>(null);
  const [addPatientSuccess, setAddPatientSuccess] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patientReports, setPatientReports] = useState<ReportInfo[]>([]);

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
            
            // Count recent reports (prescriptions + medicalReports from last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            let reportCount = 0;
            try {
              const presRef = collection(firestoreDb(), `users/${patientId}/prescriptions`);
              const presQ = query(presRef, orderBy("uploadedAt", "desc"), limit(100));
              const presSnap = await getDocs(presQ);
              
              presSnap.docs.forEach((doc) => {
                const data = doc.data();
                const uploadDate = data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt);
                if (uploadDate >= thirtyDaysAgo) reportCount++;
              });
              
              const reportsRef = collection(firestoreDb(), `users/${patientId}/medicalReports`);
              const reportsQ = query(reportsRef, orderBy("uploadedAt", "desc"), limit(100));
              const reportsSnap = await getDocs(reportsQ);
              
              reportsSnap.docs.forEach((doc) => {
                const data = doc.data();
                const uploadDate = data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt);
                if (uploadDate >= thirtyDaysAgo) reportCount++;
              });
            } catch (e) {
              console.error("Error counting reports:", e);
            }
            
            patientsList.push({
              patientId,
              name: patientData.name || "Unknown",
              email: patientData.email,
              age: patientData.age,
              gender: patientData.gender,
              conditions: patientData.conditions || [],
              allergies: patientData.allergies || [],
              shareCode: patientData.shareCode || patientId.slice(0, 8).toUpperCase(),
              connectedAt: connectionData.connectedAt,
              recentReports: reportCount,
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

  async function addPatientById() {
    setAddPatientError(null);
    setAddPatientLoading(true);
    
    try {
      const user = firebaseAuth().currentUser;
      if (!user) {
        setAddPatientError("You must be logged in");
        return;
      }

      let patientId = patientIdInput.trim();
      if (!patientId) {
        setAddPatientError("Please enter a patient ID");
        return;
      }

      // First, try to find patient by direct user ID
      let patientDoc = await getDoc(doc(firestoreDb(), "users", patientId));
      
      // If not found, try searching by shareCode
      if (!patientDoc.exists()) {
        console.log("Patient not found by ID, searching by share code...");
        // Search for patient by shareCode
        const usersRef = collection(firestoreDb(), "users");
        const usersSnapshot = await getDocs(usersRef);
        
        let foundPatient = null;
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          if (userData.shareCode === patientId || 
              userData.shareCode?.toUpperCase() === patientId.toUpperCase() ||
              userDoc.id.slice(0, 8).toUpperCase() === patientId.toUpperCase()) {
            foundPatient = { id: userDoc.id, data: userData };
            break;
          }
        }
        
        if (foundPatient) {
          patientId = foundPatient.id;
          patientDoc = await getDoc(doc(firestoreDb(), "users", patientId));
          console.log("Found patient by share code:", patientId);
        }
      }

      // Check if patient exists after search
      if (!patientDoc.exists()) {
        setAddPatientError("Patient not found. Please check the patient ID or share code.");
        return;
      }

      const patientData = patientDoc.data();
      if (patientData.role === "doctor") {
        setAddPatientError("Cannot connect to another doctor account");
        return;
      }

      // Check if already connected
      const doctorPatientRef = doc(firestoreDb(), `users/${user.uid}/patients/${patientId}`);
      const existingConnection = await getDoc(doctorPatientRef);
      
      if (existingConnection.exists()) {
        setAddPatientError("Patient is already connected");
        return;
      }

      // Create connection in doctor's patients subcollection
      console.log("Creating connection at:", `users/${user.uid}/patients/${patientId}`);
      await setDoc(doctorPatientRef, {
        patientId: patientId,
        connectedAt: new Date().toISOString(),
        connectedBy: user.uid,
      }, { merge: true });
      
      console.log("Connection created successfully");

      // Verify the connection was saved
      const verifyConnection = await getDoc(doctorPatientRef);
      if (!verifyConnection.exists()) {
        throw new Error("Failed to save connection - verification failed");
      }
      console.log("Connection verified:", verifyConnection.data());

      // Update patient's privacy settings (optional)
      const patientRef = doc(firestoreDb(), "users", patientId);
      const currentPatientData = patientDoc.data();
      const privacy = currentPatientData.privacy || {};
      const shareWithDoctorIds = Array.isArray(privacy.shareWithDoctorIds) ? privacy.shareWithDoctorIds : [];
      
      if (!shareWithDoctorIds.includes(user.uid)) {
        shareWithDoctorIds.push(user.uid);
        console.log("Updating patient privacy settings...");
        await setDoc(patientRef, {
          privacy: {
            ...privacy,
            shareWithDoctorIds,
          },
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log("Patient privacy settings updated");
      }

      setPatientIdInput("");
      setAddPatientSuccess(`Successfully connected to patient: ${patientData.name || patientId}`);
      setShowAddPatientModal(false);
      
      // Reload patients list after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error("Error adding patient:", e);
      setAddPatientError(e?.message || "Failed to add patient");
      setAddPatientSuccess(null);
    } finally {
      setAddPatientLoading(false);
    }
  }

  async function loadPatientReports(patientId: string) {
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
      
      setPatientReports(reportsList);
      setSelectedPatient(patientId);
    } catch (e: any) {
      console.error("Error loading patient reports:", e);
      setError(e?.message || "Failed to load reports");
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Patient by ID
              </button>
              <a
                href="/admin/doctor"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Connect via Share Code
              </a>
            </div>
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

                  {patient.recentReports !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Recent Reports:
                      </span>
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                        {patient.recentReports} (last 30 days)
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => loadPatientReports(patient.patientId)}
                      className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                    >
                      View Reports
                    </button>
                    <a
                      href={`/doctor/patient/${patient.patientId}`}
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                      Full Profile
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Patient Modal */}
        {showAddPatientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Patient by ID</h3>
                <button
                  onClick={() => {
                    setShowAddPatientModal(false);
                    setPatientIdInput("");
                    setAddPatientError(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Patient ID</label>
                <input
                  type="text"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  placeholder="Enter patient's user ID"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  onKeyPress={(e) => e.key === "Enter" && addPatientById()}
                />
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Enter the patient's unique user ID or share code (e.g., 6EBRWY) to connect with them.
                </p>
              </div>

              {addPatientSuccess && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                  {addPatientSuccess}
                </div>
              )}

              {addPatientError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                  {addPatientError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddPatientModal(false);
                    setPatientIdInput("");
                    setAddPatientError(null);
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={addPatientById}
                  disabled={addPatientLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addPatientLoading ? "Adding..." : "Add Patient"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Reports Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Patient Reports</h3>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setPatientReports([]);
                  }}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {patientReports.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <p>No reports found for this patient.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientReports.map((report) => (
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
        )}
      </div>
    </RequireAuth>
  );
}

