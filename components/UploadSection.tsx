"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { useStore } from "@/lib/store";

export default function UploadSection() {
  const { state, setState } = useStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [extracted, setExtracted] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    setFiles(list);
  }

  async function runOCR() {
    if (!files || files.length === 0) return;
    setLoading(true);
    const results: string[] = [];
    for (const file of Array.from(files)) {
      const image = URL.createObjectURL(file);
      const { data } = await Tesseract.recognize(image, "eng");
      results.push(data.text);
    }
    const meds = results
      .join("\n")
      .split(/\n|,|;/)
      .map((s) => s.trim())
      .filter((s) => /[a-zA-Z].*\d+mg|\d+\s*mg|ml|tablets?/i.test(s));
    setExtracted(meds.slice(0, 10));
    setLoading(false);
  }

  function confirmToMeds() {
    if (extracted.length === 0) return;
    const newMeds = extracted.map((line, idx) => {
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
        addedBy: "Upload",
        updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      };
    });
    setState((prev) => ({ ...prev, medications: [...prev.medications, ...newMeds] }));
    setExtracted([]);
    setFiles(null);
  }

  return (
    <section id="upload" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upload: Prescription & Pharmacy Bill</h2>
      </div>
      <div className="grid gap-3">
        <input type="file" multiple accept="image/*,.pdf" onChange={onSelect} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={runOCR} disabled={loading} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-black">{loading ? "Processing..." : "Run OCR"}</button>
          {files && <span className="text-xs text-zinc-600 dark:text-zinc-400">{files.length} file(s) selected</span>}
        </div>
        {extracted.length > 0 && (
          <div className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <div className="mb-2 font-medium">Extracted (review & confirm)</div>
            <ul className="grid gap-1">
              {extracted.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>{t}</span>
                  <button className="rounded-full border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Edit</button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button onClick={confirmToMeds} className="btn-secondary px-4 py-2 text-sm font-semibold">Confirm to list</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

