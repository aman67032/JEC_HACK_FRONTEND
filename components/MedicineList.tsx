"use client";

import { useState } from "react";
import DosageChangeModal from "@/components/DosageChangeModal";
import { useStore, Medication } from "@/lib/store";

type Med = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start: string;
  end?: string;
  addedBy: string;
  updated: string;
};

const initialMeds: Med[] = [];

export default function MedicineList() {
  const { state, setState } = useStore();
  const [meds, setMeds] = useState<Med[]>(state.medications as Med[]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMed, setActiveMed] = useState<string | undefined>(undefined);

  function syncFromStore() {
    setMeds(state.medications as Med[]);
  }

  function handleDosageChange(e: any) {
    const { dosage, reason } = e.detail || {};
    if (!activeMed || !dosage) return;
    setState((prev) => {
      const mIndex = prev.medications.findIndex((m) => m.name === activeMed);
      if (mIndex === -1) return prev;
      const prevDosage = prev.medications[mIndex].dosage;
      const updatedMeds: Medication[] = [...prev.medications];
      updatedMeds[mIndex] = { ...updatedMeds[mIndex], dosage, updated: new Date().toDateString() };
      const change = {
        id: `${Date.now()}`,
        medId: updatedMeds[mIndex].id,
        prevDosage,
        newDosage: dosage,
        reason: reason || "",
        changedBy: "User",
        ts: new Date().toISOString()
      };
      return { ...prev, medications: updatedMeds, dosageChanges: [...prev.dosageChanges, change] };
    });
    setModalOpen(false);
  }

  // listen once per mount
  if (typeof window !== "undefined") {
    window.removeEventListener("dosageChange", handleDosageChange as any);
    window.addEventListener("dosageChange", handleDosageChange as any);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Medication List</h2>
        <button 
          onClick={() => {
            const name = prompt("Medicine Name:");
            if (!name) return;
            const dosage = prompt("Dosage (e.g., 500mg):") || "";
            const frequency = prompt("Frequency (e.g., 2/day, morning, night):") || "";
            const newMed = {
              id: `${Date.now()}`,
              name,
              dosage,
              frequency,
              start: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
              end: "",
              addedBy: "Manual",
              updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            };
            setState((prev) => ({ ...prev, medications: [...prev.medications, newMed] }));
            syncFromStore();
            alert(`✅ Added ${name} to your medication list!`);
          }}
          className="btn-primary px-4 py-2 text-sm font-bold rounded-full"
        >
          ➕ Add Medicine
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="px-2 py-2">Medicine</th>
              <th className="px-2 py-2">Dosage</th>
              <th className="px-2 py-2">Frequency</th>
              <th className="px-2 py-2">Start</th>
              <th className="px-2 py-2">End</th>
              <th className="px-2 py-2">Added By</th>
              <th className="px-2 py-2">Last Updated</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
              {meds.map((m) => (
              <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-2 py-2 font-medium">{m.name}</td>
                <td className="px-2 py-2">{m.dosage}</td>
                <td className="px-2 py-2">{m.frequency}</td>
                <td className="px-2 py-2">{m.start}</td>
                <td className="px-2 py-2">{m.end || "—"}</td>
                <td className="px-2 py-2">{m.addedBy}</td>
                <td className="px-2 py-2">{m.updated}</td>
                <td className="px-2 py-2 text-right">
                  <button onClick={() => { setActiveMed(m.name); setModalOpen(true); }} className="rounded-full border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Edit Dosage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
        ⚠ Interaction check pending — run after confirming meds.
      </div>
      <DosageChangeModal open={modalOpen} onClose={() => setModalOpen(false)} medName={activeMed} />
    </section>
  );
}

