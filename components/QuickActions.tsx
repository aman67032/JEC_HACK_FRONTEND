"use client";

import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { useStore } from "@/lib/store";

export default function QuickActions() {
  const { state, setState } = useStore();
  const [ocrFiles, setOcrFiles] = useState<FileList | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleOCR() {
    if (!ocrFiles || ocrFiles.length === 0) {
      fileInputRef.current?.click();
      return;
    }
    
    setOcrLoading(true);
    const results: string[] = [];
    for (const file of Array.from(ocrFiles)) {
      const image = URL.createObjectURL(file);
      const { data } = await Tesseract.recognize(image, "eng");
      results.push(data.text);
    }
    const meds = results
      .join("\n")
      .split(/\n|,|;/)
      .map((s) => s.trim())
      .filter((s) => /[a-zA-Z].*\d+mg|\d+\s*mg|ml|tablets?/i.test(s));
    setOcrExtracted(meds.slice(0, 10));
    setOcrLoading(false);
    
    if (meds.length > 0) {
      const newMeds = meds.map((line, idx) => {
        const parts = line.split(/\s+-\s+|\s+/);
        const name = parts[0] || line;
        const dosage = (line.match(/\d+\s*(mg|ml)/i) || [""])[0];
        return {
          id: `${Date.now()}-${idx}`,
          name,
          dosage: dosage || "",
          frequency: "",
          start: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).replace(" ", " "),
          end: "",
          addedBy: "OCR Upload",
          updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        };
      });
      setState((prev) => ({ ...prev, medications: [...prev.medications, ...newMeds] }));
      alert(`✅ Added ${meds.length} medicines from prescription!`);
      setOcrExtracted([]);
      setOcrFiles(null);
    }
  }

  function handleAddMedicine() {
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
    alert(`✅ Added ${name} to your medication list!`);
  }

  function handleAddSchedule() {
    alert("Schedule feature coming soon! For now, medicines are automatically scheduled based on their frequency.");
  }

  return (
    <section className="card p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">⚡ Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Run OCR Button */}
        <button
          onClick={handleOCR}
          disabled={ocrLoading}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--color-border)] bg-gradient-to-br from-purple-50 to-pink-50 p-6 hover:shadow-lg transition-all dark:from-purple-950/20 dark:to-pink-950/20"
        >
          <span className="text-4xl">📷</span>
          <span className="font-bold text-lg">Run OCR</span>
          <span className="text-xs text-[color:var(--color-muted)] text-center">
            {ocrLoading ? "Processing..." : ocrFiles ? `${ocrFiles.length} file(s)` : "Scan Prescription"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => {
              setOcrFiles(e.target.files);
              if (e.target.files && e.target.files.length > 0) {
                handleOCR();
              }
            }}
            className="hidden"
          />
        </button>

        {/* Add Medicine Button */}
        <button
          onClick={handleAddMedicine}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--color-border)] bg-gradient-to-br from-blue-50 to-cyan-50 p-6 hover:shadow-lg transition-all dark:from-blue-950/20 dark:to-cyan-950/20"
        >
          <span className="text-4xl">💊</span>
          <span className="font-bold text-lg">Add Medicine</span>
          <span className="text-xs text-[color:var(--color-muted)] text-center">Add to Medication List</span>
        </button>

        {/* Drug Interaction Checker Button */}
        <button
          onClick={() => {
            document.getElementById("interactions")?.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => {
              const button = document.querySelector("#interactions button");
              (button as HTMLButtonElement)?.click();
            }, 500);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--color-border)] bg-gradient-to-br from-amber-50 to-orange-50 p-6 hover:shadow-lg transition-all dark:from-amber-950/20 dark:to-orange-950/20"
        >
          <span className="text-4xl">🔍</span>
          <span className="font-bold text-lg">Check Interactions</span>
          <span className="text-xs text-[color:var(--color-muted)] text-center">Verify Medicine Safety</span>
        </button>

        {/* Add Schedule Button */}
        <button
          onClick={() => {
            document.getElementById("reminders")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--color-border)] bg-gradient-to-br from-green-50 to-emerald-50 p-6 hover:shadow-lg transition-all dark:from-green-950/20 dark:to-emerald-950/20"
        >
          <span className="text-4xl">⏰</span>
          <span className="font-bold text-lg">Add Schedule</span>
          <span className="text-xs text-[color:var(--color-muted)] text-center">Set Reminder Times</span>
        </button>
      </div>
      
      {ocrLoading && (
        <div className="mt-4 rounded-lg border-2 border-purple-300 bg-purple-50 p-4 text-center dark:bg-purple-950/20">
          <div className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            🔄 Processing prescription... This may take a moment.
          </div>
        </div>
      )}
    </section>
  );
}

