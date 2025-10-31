"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";

export default function ReminderSection() {
  const { state, setState } = useStore();

  // Generate reminders from medications based on frequency
  const reminders = useMemo(() => {
    const reminderList: Array<{ medName: string; times: string[]; frequency: string }> = [];
    
    state.medications.forEach((med) => {
      if (!med.frequency) return;
      
      const frequency = med.frequency.toLowerCase();
      const times: string[] = [];
      
      if (frequency.includes("morning") || frequency.includes("morn")) {
        times.push("Morning");
      }
      if (frequency.includes("afternoon") || frequency.includes("noon")) {
        times.push("Afternoon");
      }
      if (frequency.includes("night") || frequency.includes("evening") || frequency.includes("eve")) {
        times.push("Night");
      }
      
      // Check for numeric patterns like "2/day", "3 times"
      const numMatch = frequency.match(/(\d+)\s*(?:x|\/|times?)/i);
      if (numMatch && times.length === 0) {
        const count = parseInt(numMatch[1]);
        if (count === 1) times.push("Morning");
        else if (count === 2) {
          times.push("Morning", "Night");
        } else if (count === 3) {
          times.push("Morning", "Afternoon", "Night");
        } else {
          // Generic for more than 3
          times.push(`${count} times/day`);
        }
      }
      
      if (times.length > 0) {
        reminderList.push({
          medName: med.name,
          times,
          frequency: med.frequency
        });
      }
    });
    
    return reminderList;
  }, [state.medications]);

  function handleAddSchedule() {
    if (state.medications.length === 0) {
      alert("Please add a medicine to your list first.");
      return;
    }
    
    const medNames = state.medications.map(m => m.name).join("\n");
    const medName = prompt(`Select medicine to schedule:\n\n${medNames}`);
    if (!medName) return;
    
    const med = state.medications.find(m => m.name.toLowerCase() === medName.toLowerCase());
    if (!med) {
      alert("Medicine not found in your list. Please add it first.");
      return;
    }
    
    const time = prompt("What time? (e.g., 09:00, 14:00, 20:00):");
    if (!time) return;
    
    // Update the medication frequency if needed
    const currentFreq = med.frequency || "";
    const newFreq = currentFreq ? `${currentFreq}, ${time}` : time;
    
    setState((prev) => ({
      ...prev,
      medications: prev.medications.map(m => 
        m.id === med.id ? { ...m, frequency: newFreq } : m
      )
    }));
    
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
      {reminders.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          No reminders scheduled. Add a medicine and set its frequency, or click "Add Schedule" to create custom reminders.
        </p>
      ) : (
        <ul className="grid gap-2 text-sm">
          {reminders.map((reminder, idx) => (
            <li key={idx} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <span>{reminder.medName} — {reminder.times.join(", ")}</span>
              <span className="text-xs text-zinc-500">Daily</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

