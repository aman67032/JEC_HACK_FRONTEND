"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface PrescriptionReport {
  id: string;
  fileUrl: string;
  uploadedAt: any;
  extractedText?: string;
  medicines?: Array<{ name: string; dosage: string; frequency?: string }>;
  status?: string;
}

interface MedicalReport {
  id: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: any;
  reportType?: string;
  notes?: string;
}

export default function HistoryReport() {
  const { state } = useStore();
  const [prescriptions, setPrescriptions] = useState<PrescriptionReport[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch prescription reports from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setPrescriptions([]);
        setLoading(false);
        return;
      }

      try {
        const db = firestoreDb();
        
        // Fetch prescriptions
        const prescriptionsRef = collection(db, "users", user.uid, "prescriptions");
        const presQ = query(prescriptionsRef, orderBy("uploadedAt", "desc"), limit(50));
        const presSnapshot = await getDocs(presQ);
        
        const prescriptionData: PrescriptionReport[] = [];
        presSnapshot.forEach((doc) => {
          const data = doc.data();
          prescriptionData.push({
            id: doc.id,
            fileUrl: data.fileUrl || "",
            uploadedAt: data.uploadedAt,
            extractedText: data.extractedText || "",
            medicines: data.medicines || [],
            status: data.status || "processed",
          });
        });
        setPrescriptions(prescriptionData);

        // Fetch medical reports
        const reportsRef = collection(db, "users", user.uid, "medicalReports");
        const reportsQ = query(reportsRef, orderBy("uploadedAt", "desc"), limit(50));
        const reportsSnapshot = await getDocs(reportsQ);
        
        const reportsData: MedicalReport[] = [];
        reportsSnapshot.forEach((doc) => {
          const data = doc.data();
          reportsData.push({
            id: doc.id,
            fileUrl: data.fileUrl || "",
            fileName: data.fileName || "Unknown",
            uploadedAt: data.uploadedAt,
            reportType: data.reportType || "general",
            notes: data.notes || "",
          });
        });
        setMedicalReports(reportsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Format date for display
  function formatDate(isoString: string | any): string {
    try {
      let date: Date;
      if (isoString?.toDate) {
        // Firestore Timestamp
        date = isoString.toDate();
      } else if (typeof isoString === "string") {
        date = new Date(isoString);
      } else {
        return "Unknown date";
      }
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return typeof isoString === "string" ? isoString : "Unknown date";
    }
  }

  // Combine dosage changes, medication history, prescription reports, and medical reports
  const historyItems = [
    ...state.dosageChanges.map(change => ({
      id: change.id,
      date: change.ts,
      type: "dosage" as const,
      text: `Dosage changed: ${change.prevDosage} → ${change.newDosage}${change.reason ? ` (${change.reason})` : ""} - ${change.changedBy}`,
      dateFormatted: formatDate(change.ts),
      fileUrl: null as string | null,
    })),
    ...state.medications
      .filter(m => m.updated && m.start !== m.updated)
      .map(med => ({
        id: `med-${med.id}`,
        date: med.updated,
        type: "medication" as const,
        text: `Medication ${med.name} updated - ${med.addedBy}`,
        dateFormatted: med.updated,
        fileUrl: null as string | null,
      })),
    ...prescriptions.map(pres => ({
      id: `pres-${pres.id}`,
      date: pres.uploadedAt?.toDate ? pres.uploadedAt.toDate().toISOString() : (pres.uploadedAt || new Date().toISOString()),
      type: "prescription" as const,
      text: `Prescription uploaded${pres.medicines && pres.medicines.length > 0 ? ` - ${pres.medicines.length} medicine(s) extracted: ${pres.medicines.slice(0, 3).map(m => m.name).join(", ")}${pres.medicines.length > 3 ? "..." : ""}` : ""}`,
      dateFormatted: formatDate(pres.uploadedAt),
      fileUrl: pres.fileUrl,
    })),
    ...medicalReports.map(report => ({
      id: `report-${report.id}`,
      date: report.uploadedAt?.toDate ? report.uploadedAt.toDate().toISOString() : (report.uploadedAt || new Date().toISOString()),
      type: "report" as const,
      text: `Report uploaded: ${report.fileName}${report.reportType !== "general" ? ` (${report.reportType})` : ""}`,
      dateFormatted: formatDate(report.uploadedAt),
      fileUrl: report.fileUrl,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleDownloadPDF() {
    alert("PDF download feature coming soon! For now, you can print this page using your browser's print function.");
  }

  return (
    <section id="history" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">History & Reports</h2>
        <button 
          onClick={handleDownloadPDF}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Download PDF
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500 text-center py-4">Loading history...</p>
      ) : historyItems.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          No history yet. Dosage changes, medication updates, and prescription uploads will appear here.
        </p>
      ) : (
        <ul className="grid gap-2 text-sm max-h-96 overflow-y-auto">
          {historyItems.map((item) => (
            <li key={item.id} className="rounded-lg border border-zinc-200 p-3 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="font-medium">{item.dateFormatted}</span> — {item.text}
                  {(item.type === "prescription" || item.type === "report") && item.fileUrl && (
                    <div className="mt-2">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        📄 {item.type === "prescription" ? "View prescription image" : "View report"}
                      </a>
                    </div>
                  )}
                </div>
                {item.type === "prescription" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    📋 Prescription
                  </span>
                )}
                {item.type === "report" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    📄 Report
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

