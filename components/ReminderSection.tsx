export default function ReminderSection() {
  return (
    <section id="reminders" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reminders</h2>
        <button className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black">Add Schedule</button>
      </div>
      <ul className="grid gap-2 text-sm">
        <li className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <span>Metformin — Morning, Night</span>
          <span className="text-xs text-zinc-500">Daily</span>
        </li>
        <li className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <span>Atorvastatin — Night</span>
          <span className="text-xs text-zinc-500">Daily</span>
        </li>
      </ul>
    </section>
  );
}

