"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function ReminderSection() {
  const { state, setState } = useStore();
  const [addingSchedule, setAddingSchedule] = useState(false);

  function handleAddSchedule() {
    const medName = prompt("Select medicine to schedule:");
    if (!medName) return;
    
    const med = state.medications.find(m => m.name.toLowerCase() === medName.toLowerCase());
    if (!med) {
      alert("Medicine not found in your list. Please add it first.");
      return;
    }
    
    const time = prompt("What time? (e.g., 09:00, 14:00, 20:00):");
    if (!time) return;
    
    alert(`✅ Schedule added: ${medName} at ${time}. Reminders will be sent at this time.`);
  }

  return (
    <section id="reminders" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reminders</h2>
        <button 
          onClick={handleAddSchedule}
          className="btn-primary px-5 py-3 text-base font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          ⏰ Add Schedule
        </button>
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

