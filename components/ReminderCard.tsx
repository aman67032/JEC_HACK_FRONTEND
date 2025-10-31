"use client";

import { MedicineReminder } from "./ReminderSidebar";

interface ReminderCardProps {
  reminder: MedicineReminder;
  currentTime: Date;
  onVerify: () => void;
  onSnooze: () => void;
  onDelete: () => void;
}

export default function ReminderCard({
  reminder,
  currentTime,
  onVerify,
  onSnooze,
  onDelete,
}: ReminderCardProps) {
  const scheduledDate = new Date(reminder.nextScheduledDate);
  const scheduledTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isDue = reminder.status === "pending" && scheduledDate <= currentTime;
  const isSnoozed = reminder.status === "snoozed";
  const isMissed = reminder.status === "missed";
  const isTaken = reminder.status === "taken";

  const getStatusColor = () => {
    if (isTaken) return "bg-green-100 border-green-300 dark:bg-green-950/20 dark:border-green-700";
    if (isMissed) return "bg-red-100 border-red-300 dark:bg-red-950/20 dark:border-red-700";
    if (isDue) return "bg-amber-100 border-amber-400 dark:bg-amber-950/20 dark:border-amber-700";
    if (isSnoozed) return "bg-blue-100 border-blue-300 dark:bg-blue-950/20 dark:border-blue-700";
    return "bg-white border-[color:var(--color-border)] dark:bg-zinc-900 dark:border-zinc-800";
  };

  const getStatusBadge = () => {
    if (isTaken) return { text: "✅ Taken", color: "bg-green-500" };
    if (isMissed) return { text: "⚠️ Missed", color: "bg-red-500" };
    if (isDue) return { text: "⏰ Due Now", color: "bg-amber-500" };
    if (isSnoozed) return { text: "😴 Snoozed", color: "bg-blue-500" };
    return { text: "📅 Pending", color: "bg-gray-500" };
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className={`card p-5 space-y-4 transition-all hover:shadow-lg ${getStatusColor()}`}
      role="article"
      aria-label={`Reminder for ${reminder.medicineName} at ${scheduledTime}`}
    >
      {/* Medicine Name & Status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {reminder.medicineName}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {reminder.dosage}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold text-white ${statusBadge.color}`}
        >
          {statusBadge.text}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="text-xs font-semibold text-[color:var(--color-muted)]">Scheduled</div>
            <div className="text-lg font-bold text-[color:var(--color-foreground)]">{scheduledTime}</div>
          </div>
          <div className="absolute left-1/2 top-1/2 h-0.5 w-16 -translate-x-1/2 bg-[color:var(--color-border)]"></div>
          <div className="text-right">
            <div className="text-xs font-semibold text-[color:var(--color-muted)]">Frequency</div>
            <div className="text-lg font-bold text-[color:var(--color-foreground)]">
              {reminder.frequency === "daily"
                ? "Daily"
                : reminder.frequency === "alternate-days"
                ? "Alternate Days"
                : "Custom"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isTaken && !isMissed && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={onVerify}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={`Mark ${reminder.medicineName} as taken`}
          >
            ✅ Mark as Taken
          </button>
          <button
            onClick={onSnooze}
            className="rounded-lg border-2 border-blue-400 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Snooze reminder for ${reminder.medicineName}`}
          >
            😴 Snooze (15 min)
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border-2 border-red-300 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={`Delete reminder for ${reminder.medicineName}`}
          >
            🗑️
          </button>
        </div>
      )}

      {(isTaken || isMissed) && (
        <div className="pt-2 text-center text-sm text-[color:var(--color-muted)]">
          {isTaken
            ? "This reminder has been completed."
            : "This reminder was missed. Please contact your doctor if needed."}
        </div>
      )}
    </div>
  );
}

