"use client";

import { MedicineReminder } from "./ReminderSidebar";

interface ReminderAlertPopupProps {
  reminder: MedicineReminder;
  onVerify: () => void;
  onSnooze: () => void;
  onClose: () => void;
}

export default function ReminderAlertPopup({
  reminder,
  onVerify,
  onSnooze,
  onClose,
}: ReminderAlertPopupProps) {
  const scheduledTime = new Date(reminder.nextScheduledDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-title"
    >
      <div
        className="card w-full max-w-md p-6 space-y-6 animate-pulse-once"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alert Header */}
        <div className="text-center">
          <div className="mb-4 text-6xl">⏰</div>
          <h2 id="alert-title" className="text-3xl font-bold text-amber-800 dark:text-amber-200">
            It's Time to Take Your Medicine!
          </h2>
        </div>

        {/* Medicine Card */}
        <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-5 dark:bg-blue-950/20">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {reminder.medicineName}
            </h3>
            <p className="text-lg text-[color:var(--color-muted)]">{reminder.dosage}</p>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Scheduled: {scheduledTime}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onVerify}
            className="w-full btn-primary px-6 py-4 text-lg font-bold rounded-full"
            aria-label="Verify intake of medicine"
          >
            ✅ Verify Intake
          </button>
          <button
            onClick={onSnooze}
            className="w-full rounded-lg border-2 border-blue-400 px-6 py-4 text-lg font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900"
            aria-label="Snooze reminder for 15 minutes"
          >
            😴 Snooze (15 min)
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
          aria-label="Close alert"
        >
          Close
        </button>
      </div>
    </div>
  );
}

