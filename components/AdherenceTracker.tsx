"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";

export default function AdherenceTracker() {
  const { state } = useStore();
  const [taken, setTaken] = useState<Record<string, boolean>>({});

  // Generate today's medication schedule items
  const todaySchedule = useMemo(() => {
    const today = new Date();
    const schedule: Array<{ id: string; medName: string; dosage: string; time: string; medId: string }> = [];
    
    state.medications.forEach((med) => {
      if (!med.frequency) return;
      
      const frequency = med.frequency.toLowerCase();
      const now = new Date();
      const currentHour = now.getHours();
      
      if (frequency.includes("morning") || frequency.includes("morn")) {
        schedule.push({
          id: `${med.id}-morning`,
          medName: med.name,
          dosage: med.dosage,
          time: "Morning",
          medId: med.id
        });
      }
      if (frequency.includes("afternoon") || frequency.includes("noon")) {
        schedule.push({
          id: `${med.id}-afternoon`,
          medName: med.name,
          dosage: med.dosage,
          time: "Afternoon",
          medId: med.id
        });
      }
      if (frequency.includes("night") || frequency.includes("evening") || frequency.includes("eve")) {
        schedule.push({
          id: `${med.id}-night`,
          medName: med.name,
          dosage: med.dosage,
          time: "Night",
          medId: med.id
        });
      }
      
      // Handle numeric frequencies
      const numMatch = frequency.match(/(\d+)\s*(?:x|\/|times?)/i);
      if (numMatch && schedule.filter(s => s.medId === med.id).length === 0) {
        const count = parseInt(numMatch[1]);
        for (let i = 0; i < count; i++) {
          const hour = 8 + (i * 6);
          const timeLabel = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Night";
          schedule.push({
            id: `${med.id}-${i}`,
            medName: med.name,
            dosage: med.dosage,
            time: timeLabel,
            medId: med.id
          });
        }
      }
    });
    
    return schedule;
  }, [state.medications]);

  // Calculate adherence percentage
  const adherence = useMemo(() => {
    if (todaySchedule.length === 0) return 0;
    const takenCount = Object.values(taken).filter(Boolean).length;
    return Math.round((takenCount / todaySchedule.length) * 100);
  }, [taken, todaySchedule]);

  function handleToggle(id: string) {
    setTaken(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  // Load saved adherence from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`adherence_${new Date().toDateString()}`);
    if (saved) {
      try {
        setTaken(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save adherence to localStorage
  useEffect(() => {
    localStorage.setItem(`adherence_${new Date().toDateString()}`, JSON.stringify(taken));
  }, [taken]);

  return (
    <section id="caregiver" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Adherence</h2>
        <span className="text-xs text-zinc-500">
          Today: {adherence}%
        </span>
      </div>
      {todaySchedule.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          No medications scheduled for today. Add medications and set their frequency to track adherence.
        </p>
      ) : (
        <div className="grid gap-2 text-sm">
          {todaySchedule.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <span>{item.medName} — {item.time}</span>
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={taken[item.id] || false}
                  onChange={() => handleToggle(item.id)}
                  className="h-4 w-4 cursor-pointer" 
                /> 
                Taken
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

