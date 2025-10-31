"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { useStore } from "@/lib/store";
import { firebaseAuth, firebaseStorage } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function UploadSection() {
  const { state, setState } = useStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [extracted, setExtracted] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [useServerOCR, setUseServerOCR] = useState(false); // Default to client-side OCR for reliability

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    setFiles(list);
  }

  async function runOCR() {
    if (!files || files.length === 0) return;
    setLoading(true);
    
    try {
      if (useServerOCR) {
        // Server-side OCR using Google Vision API
        await runServerOCR();
      } else {
        // Client-side OCR using Tesseract.js
        await runClientOCR();
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      const errorMessage = error?.message || "OCR processing failed";
      console.error("Full error:", error);
      
      // If server OCR fails, automatically fallback to client-side
      if (useServerOCR) {
        console.log("Falling back to client-side OCR...");
        setUseServerOCR(false);
        try {
          await runClientOCR();
          alert("Server OCR failed, but client-side OCR completed successfully.");
        } catch (clientError: any) {
          console.error("Client OCR also failed:", clientError);
          alert(`OCR failed: ${errorMessage}. Please try again or check your connection.`);
        }
      } else {
        alert(`OCR processing failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function runServerOCR() {
    if (!files || files.length === 0) return;
    
    const user = firebaseAuth().currentUser;
    if (!user) {
      throw new Error("You must be logged in to use server-side OCR");
    }

    try {
      // Initialize Firebase Storage
      const storage = firebaseStorage();
      if (!storage) {
        throw new Error("Firebase Storage not initialized. Please check your Firebase configuration.");
      }
    } catch (storageError: any) {
      throw new Error(`Firebase Storage error: ${storageError.message || "Storage not available"}`);
    }

    const results: string[] = [];
    const medicines: Array<{ name: string; dosage: string; frequency?: string }> = [];

    for (const file of Array.from(files)) {
      try {
        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `prescription_${timestamp}_${file.name}`;
        const storageRef = ref(firebaseStorage(), `prescriptions/${user.uid}/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        // Call server-side OCR API
        const response = await fetch("/api/prescription/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl,
            userId: user.uid,
            prescriptionId: `pres_${timestamp}`,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Server OCR failed" }));
          throw new Error(error.error || `Server OCR failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.extractedText) {
          results.push(data.extractedText);
        }
        if (data.medicines && data.medicines.length > 0) {
          medicines.push(...data.medicines);
        }
      } catch (fileError: any) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with other files, but add error message
        results.push(`Error processing ${file.name}: ${fileError.message}`);
      }
    }

    // Use extracted medicines from API, or fallback to parsing extracted text
    if (medicines.length > 0) {
      const medNames = medicines.map(m => `${m.name} - ${m.dosage}${m.frequency ? ` - ${m.frequency}` : ""}`);
      setExtracted(medNames);
    } else {
      // Parse from extracted text as fallback
      const meds = results
        .join("\n")
        .split(/\n|,|;/)
        .map((s) => s.trim())
        .filter((s) => /[a-zA-Z].*\d+mg|\d+\s*mg|ml|tablets?/i.test(s));
      setExtracted(meds.slice(0, 10));
    }
  }

  async function runClientOCR() {
    if (!files || files.length === 0) return;
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
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            multiple 
            accept="image/*,.pdf" 
            onChange={(e) => {
              onSelect(e);
              if (e.target.files && e.target.files.length > 0) {
                // Use setTimeout to avoid blocking the UI thread
                setTimeout(() => {
                  runOCR().catch((error) => {
                    console.error("Failed to run OCR:", error);
                    setLoading(false);
                  });
                }, 0);
              }
            }} 
            className="flex-1 rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-3 text-base font-semibold dark:border-zinc-800 dark:bg-zinc-950 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors" 
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button" 
            onClick={runOCR} 
            disabled={loading || !files || files.length === 0} 
            className="btn-primary px-6 py-3 text-base font-bold rounded-full disabled:opacity-60 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? "🔄 Processing..." : "📷 Run OCR"}
          </button>
          <label className="flex items-center gap-2 text-sm text-[color:var(--color-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={useServerOCR}
              onChange={(e) => setUseServerOCR(e.target.checked)}
              className="rounded"
            />
            <span>Use server OCR (Google Vision)</span>
          </label>
          {files && (
            <span className="text-base font-semibold text-[color:var(--color-muted)]">
              {files.length} file(s) selected
            </span>
          )}
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

