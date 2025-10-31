"use client";

import { useStore } from "@/lib/store";

export default function HistoryReport() {
  const { state } = useStore();

  // Format date for display
  function formatDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return isoString;
    }
  }

  // Combine dosage changes and medication history
  const historyItems = [
    ...state.dosageChanges.map(change => ({
      id: change.id,
      date: change.ts,
      type: "dosage" as const,
      text: `Dosage changed: ${change.prevDosage} → ${change.newDosage}${change.reason ? ` (${change.reason})` : ""} - ${change.changedBy}`,
      dateFormatted: formatDate(change.ts)
    })),
    ...state.medications
      .filter(m => m.updated && m.start !== m.updated)
      .map(med => ({
        id: `med-${med.id}`,
        date: med.updated,
        type: "medication" as const,
        text: `Medication ${med.name} updated - ${med.addedBy}`,
        dateFormatted: med.updated
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
      {historyItems.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          No history yet. Dosage changes and medication updates will appear here.
        </p>
      ) : (
        <ul className="grid gap-2 text-sm max-h-96 overflow-y-auto">
          {historyItems.map((item) => (
            <li key={item.id} className="rounded-lg border border-zinc-200 p-3 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <span className="font-medium">{item.dateFormatted}</span> — {item.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

