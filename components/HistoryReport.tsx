export default function HistoryReport() {
  return (
    <section id="history" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">History & Reports</h2>
        <button className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Download PDF</button>
      </div>
      <ul className="grid gap-2 text-sm">
        <li className="rounded-lg border border-zinc-200 p-3 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">31 Oct — Dosage changed: Metformin 500mg → 750mg (Doctor)</li>
        <li className="rounded-lg border border-zinc-200 p-3 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">30 Oct — Missed dose: Metformin (Night)</li>
      </ul>
    </section>
  );
}

