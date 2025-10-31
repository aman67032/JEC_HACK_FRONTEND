"use client";

import { useState } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { collection, doc, addDoc } from "firebase/firestore";
import { useStore } from "@/lib/store";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string | null;
}

export default function AddReminderModal({
  isOpen,
  onClose,
  onSave,
  userId,
}: AddReminderModalProps) {
  const { state } = useStore();
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "alternate-days" | "custom">("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableMedicines = state.medications.map((m) => m.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !medicineName || !dosage || !scheduledTime) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const db = firestoreDb();
      const remindersRef = collection(doc(db, "users", userId), "reminders");

      // Calculate next scheduled date based on frequency
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (nextDate <= new Date()) {
        if (frequency === "alternate-days") {
          nextDate.setDate(nextDate.getDate() + 2);
        } else if (frequency === "custom") {
          // For custom days, find the next scheduled day
          const today = new Date().getDay();
          const sortedDays = [...customDays].sort((a, b) => a - b);
          const nextDay = sortedDays.find((day) => day > today) || sortedDays[0];
          const daysUntilNext = nextDay > today ? nextDay - today : (7 - today) + nextDay;
          nextDate.setDate(nextDate.getDate() + daysUntilNext);
        } else {
          // Daily frequency
          nextDate.setDate(nextDate.getDate() + 1);
        }
      } else if (frequency === "alternate-days") {
        // If time hasn't passed today but it's alternate days, check if today is a scheduled day
        const today = new Date().getDay();
        // Simple alternate day logic: schedule every other day starting from today
        nextDate.setDate(nextDate.getDate() + 2);
      }

      await addDoc(remindersRef, {
        medicineName,
        dosage,
        scheduledTime,
        frequency,
        customDays: frequency === "custom" ? customDays : [],
        status: "pending",
        nextScheduledDate: nextDate.toISOString(),
        createdAt: new Date().toISOString(),
        userId,
      });

      // Reset form
      setMedicineName("");
      setDosage("");
      setScheduledTime("");
      setFrequency("daily");
      setCustomDays([]);

      onSave();
      alert("✅ Reminder added successfully!");
    } catch (error) {
      console.error("Error adding reminder:", error);
      alert("Failed to add reminder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!isOpen) return null;

  const daysOfWeek = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-reminder-title"
    >
      <div
        className="card w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="add-reminder-title" className="text-2xl font-bold">
            ➕ Add Medicine Reminder
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medicine Name */}
          <div>
            <label htmlFor="medicine-name" className="block text-sm font-semibold mb-2">
              Medicine Name *
            </label>
            <input
              id="medicine-name"
              type="text"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              list="medicine-list"
              className="w-full rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="e.g., Amoxil, Metformin"
            />
            <datalist id="medicine-list">
              {availableMedicines.map((med) => (
                <option key={med} value={med} />
              ))}
            </datalist>
          </div>

          {/* Dosage */}
          <div>
            <label htmlFor="dosage" className="block text-sm font-semibold mb-2">
              Dosage *
            </label>
            <input
              id="dosage"
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="e.g., 1 tablet, 500 mg"
            />
          </div>

          {/* Scheduled Time */}
          <div>
            <label htmlFor="scheduled-time" className="block text-sm font-semibold mb-2">
              Scheduled Time *
            </label>
            <input
              id="scheduled-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-semibold mb-2">
              Frequency *
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as "daily" | "alternate-days" | "custom")
              }
              className="w-full rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="daily">Daily</option>
              <option value="alternate-days">Alternate Days</option>
              <option value="custom">Custom Days</option>
            </select>
          </div>

          {/* Custom Days */}
          {frequency === "custom" && (
            <div>
              <label className="block text-sm font-semibold mb-2">Select Days</label>
              <div className="flex gap-2 flex-wrap">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      customDays.includes(day.value)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-[color:var(--color-border)] hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary px-4 py-3 text-base font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "✅ Add Reminder"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border-2 border-[color:var(--color-border)] px-4 py-3 text-base font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

