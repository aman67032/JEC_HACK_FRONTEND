"use client";

import { useState } from "react";

export default function AdherenceTracker() {
  const [taken, setTaken] = useState<Record<string, boolean>>({
    "2025-10-30:metformin:morn": true,
    "2025-10-30:metformin:night": false,
  });

  const adherence = 85;

  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Adherence</h2>
        <span className="text-xs text-zinc-500">This week: {adherence}%</span>
      </div>
      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <span>Metformin — Morning</span>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" defaultChecked className="h-4 w-4" /> Taken
          </label>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <span>Metformin — Night</span>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" className="h-4 w-4" /> Taken
          </label>
        </div>
      </div>
    </section>
  );
}

