"use client";

import { useState, useEffect } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  totalMedicines: number;
  taken: number;
  missed: number;
  wrongMedicine: number;
  adherenceRate: number;
  dailyBreakdown: {
    date: string;
    scheduled: number;
    taken: number;
    missed: number;
  }[];
  medicines: {
    name: string;
    dosage: string;
    scheduled: number;
    taken: number;
    missed: number;
  }[];
}

interface FamilyWeeklyReportProps {
  patientId: string | null;
  patientName?: string;
}

export default function FamilyWeeklyReport({
  patientId,
  patientName = "Patient",
}: FamilyWeeklyReportProps) {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    if (!patientId) {
      setReport(null);
      return;
    }
    loadWeeklyReport();
  }, [patientId, selectedWeek]);

  const loadWeeklyReport = async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      const db = firestoreDb();
      
      // Calculate week boundaries
      const now = new Date();
      const weekOffset = selectedWeek * 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + weekOffset));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Fetch medicine intake events for this week
      const intakesRef = collection(db, "users", patientId, "medicineIntakes");
      const q = query(
        intakesRef,
        where("timestamp", ">=", weekStart.toISOString()),
        where("timestamp", "<=", weekEnd.toISOString()),
        orderBy("timestamp")
      );

      const snapshot = await getDocs(q);
      const events: any[] = [];
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });

      // Fetch medicines to get scheduled count
      const medicinesRef = collection(db, "users", patientId, "medicines");
      const medicinesSnapshot = await getDocs(medicinesRef);
      const medicinesList: any[] = [];
      medicinesSnapshot.forEach((doc) => {
        medicinesList.push({ id: doc.id, ...doc.data() });
      });

      // Process data
      const dailyBreakdown: { [key: string]: { scheduled: number; taken: number; missed: number } } = {};
      const medicinesMap: { [key: string]: { scheduled: number; taken: number; missed: number } } = {};

      // Initialize daily breakdown
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateKey = date.toISOString().split("T")[0];
        dailyBreakdown[dateKey] = { scheduled: 0, taken: 0, missed: 0 };
      }

      // Process events
      let taken = 0;
      let missed = 0;
      let wrongMedicine = 0;

      events.forEach((event) => {
        const eventDate = new Date(event.timestamp?.toDate?.() || event.timestamp).toISOString().split("T")[0];
        if (dailyBreakdown[eventDate]) {
          if (event.status === "taken") {
            dailyBreakdown[eventDate].taken++;
            taken++;
          } else if (event.status === "missed") {
            dailyBreakdown[eventDate].missed++;
            missed++;
          }
          if (event.status === "wrong_medicine") {
            wrongMedicine++;
          }

          // Count by medicine
          const medKey = `${event.medicineName || "Unknown"}_${event.dosage || ""}`;
          if (!medicinesMap[medKey]) {
            medicinesMap[medKey] = { scheduled: 0, taken: 0, missed: 0 };
          }
          if (event.status === "taken") medicinesMap[medKey].taken++;
          if (event.status === "missed") medicinesMap[medKey].missed++;
        }
      });

      // Calculate scheduled doses (assuming daily frequency)
      medicinesList.forEach((med) => {
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const dateKey = date.toISOString().split("T")[0];
          dailyBreakdown[dateKey].scheduled++;
        }

        const medKey = `${med.name}_${med.dosage || ""}`;
        if (!medicinesMap[medKey]) {
          medicinesMap[medKey] = { scheduled: 0, taken: 0, missed: 0 };
        }
        medicinesMap[medKey].scheduled += 7;
      });

      const totalScheduled = medicinesList.length * 7;
      const totalMedicines = medicinesList.length;
      const adherenceRate = totalScheduled > 0 ? ((taken / totalScheduled) * 100).toFixed(1) : "0";

      setReport({
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        totalMedicines,
        taken,
        missed,
        wrongMedicine,
        adherenceRate: parseFloat(adherenceRate),
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
          date,
          ...data,
        })),
        medicines: Object.entries(medicinesMap).map(([key, data]) => {
          const [name, dosage] = key.split("_");
          return {
            name,
            dosage,
            ...data,
          };
        }),
      });
    } catch (error) {
      console.error("Error loading weekly report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const reportText = `
Weekly Medication Report - ${patientName}
Period: ${new Date(report.weekStart).toLocaleDateString()} to ${new Date(report.weekEnd).toLocaleDateString()}

SUMMARY:
- Total Medicines: ${report.totalMedicines}
- Taken: ${report.taken}
- Missed: ${report.missed}
- Wrong Medicine: ${report.wrongMedicine}
- Adherence Rate: ${report.adherenceRate}%

DAILY BREAKDOWN:
${report.dailyBreakdown.map((day) => `- ${new Date(day.date).toLocaleDateString()}: ${day.taken}/${day.scheduled} taken`).join("\n")}

MEDICINE DETAILS:
${report.medicines.map((med) => `- ${med.name} (${med.dosage}): ${med.taken}/${med.scheduled} taken, ${med.missed} missed`).join("\n")}
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Weekly_Report_${report.weekStart}_${patientName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!patientId) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 bg-white text-center">
        <p className="text-gray-500">Select a patient to view weekly report</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Report</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            disabled={loading}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500 min-w-[100px] text-center">
            Week {selectedWeek === 0 ? "(Current)" : `${-selectedWeek} weeks ago`}
          </span>
          <button
            onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
            disabled={loading || selectedWeek === 0}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next →
          </button>
          {report && (
            <button
              onClick={downloadReport}
              className="ml-2 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              📥 Download
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Total Medicines</p>
              <p className="text-2xl font-bold text-blue-900">{report.totalMedicines}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Taken</p>
              <p className="text-2xl font-bold text-green-900">{report.taken}</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <p className="text-xs text-yellow-600 mb-1">Missed</p>
              <p className="text-2xl font-bold text-yellow-900">{report.missed}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 mb-1">Wrong Medicine</p>
              <p className="text-2xl font-bold text-red-900">{report.wrongMedicine}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">Adherence</p>
              <p className="text-2xl font-bold text-purple-900">{report.adherenceRate}%</p>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Daily Breakdown</h4>
            <div className="space-y-2">
              {report.dailyBreakdown.map((day) => (
                <div key={day.date} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-24 text-sm font-medium">
                    {new Date(day.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(day.taken / day.scheduled) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-20 text-right">
                        {day.taken}/{day.scheduled}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medicine Details */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Medicine Details</h4>
            <div className="space-y-2">
              {report.medicines.map((med, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{med.name}</span>
                    <span className="text-xs text-gray-500">{med.dosage}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-600">✅ Taken: {med.taken}</span>
                    <span className="text-yellow-600">⏰ Missed: {med.missed}</span>
                    <span className="text-gray-500">📅 Scheduled: {med.scheduled}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No data available for this week</p>
        </div>
      )}
    </div>
  );
}

