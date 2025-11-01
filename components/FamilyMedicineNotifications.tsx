"use client";

import { useState, useEffect } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";

interface MedicineIntakeEvent {
  id: string;
  patientId: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  actualTakenTime: string;
  status: "taken" | "missed" | "wrong_medicine";
  verified: boolean;
  proofPhotoUrl?: string;
  validationDetails?: string;
  timestamp: string;
}

interface FamilyMedicineNotificationsProps {
  patientId: string | null;
  patientName?: string;
}

export default function FamilyMedicineNotifications({
  patientId,
  patientName = "Patient",
}: FamilyMedicineNotificationsProps) {
  const [events, setEvents] = useState<MedicineIntakeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!patientId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const db = firestoreDb();
    
    // Listen to medicine intake events for this patient
    const eventsRef = collection(db, "users", patientId, "medicineIntakes");
    const q = query(eventsRef, orderBy("timestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventList: MedicineIntakeEvent[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          eventList.push({
            id: doc.id,
            patientId: patientId,
            patientName: patientName,
            medicineName: data.medicineName || "Unknown",
            dosage: data.dosage || "",
            scheduledTime: data.scheduledTime || "",
            actualTakenTime: data.actualTakenTime || data.timestamp || "",
            status: data.status || "taken",
            verified: data.verified || false,
            proofPhotoUrl: data.proofPhotoUrl,
            validationDetails: data.validationDetails,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });
        setEvents(eventList);
        
        // Count unread (events from last 24 hours that are not viewed)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const unread = eventList.filter(
          (e) => new Date(e.timestamp) > last24Hours && !e.verified
        ).length;
        setUnreadCount(unread);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading medicine events:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, patientName]);

  const getStatusColor = (status: string, verified: boolean) => {
    if (status === "wrong_medicine") return "bg-red-100 border-red-500 text-red-900";
    if (status === "missed") return "bg-yellow-100 border-yellow-500 text-yellow-900";
    if (verified) return "bg-green-100 border-green-500 text-green-900";
    return "bg-blue-100 border-blue-500 text-blue-900";
  };

  const getStatusIcon = (status: string, verified: boolean) => {
    if (status === "wrong_medicine") return "⚠️";
    if (status === "missed") return "⏰";
    if (verified) return "✅";
    return "💊";
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 bg-white text-center">
        <p className="text-gray-500">Select a patient to view medicine intake notifications</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Medicine Intake Notifications
        </h3>
        {unreadCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">
            {unreadCount} new
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No medicine intake events yet</p>
          <p className="text-sm text-gray-400">
            You'll receive notifications when {patientName} takes medicines
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-xl border-2 ${getStatusColor(
                event.status,
                event.verified
              )} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getStatusIcon(event.status, event.verified)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">
                      {event.medicineName}
                      {event.dosage && ` - ${event.dosage}`}
                    </h4>
                    <span className="text-xs font-medium flex-shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 mb-2">
                    {event.status === "taken" && verified
                      ? `✅ Verified: ${patientName} took the correct medicine`
                      : event.status === "wrong_medicine"
                      ? `⚠️ WRONG MEDICINE: ${event.validationDetails || "Medicine mismatch detected"}`
                      : event.status === "missed"
                      ? `⏰ Missed: ${patientName} did not take the scheduled dose`
                      : `💊 Pending verification: ${patientName} marked as taken`}
                  </p>
                  {event.proofPhotoUrl && (
                    <img
                      src={event.proofPhotoUrl}
                      alt="Proof photo"
                      className="mt-2 w-24 h-24 rounded-lg object-cover border border-gray-300"
                    />
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(event.timestamp).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

