"use client";

import { useState, useEffect, useCallback } from "react";
import DosageChangeModal from "@/components/DosageChangeModal";
import { useStore, Medication } from "@/lib/store";
import { firebaseAuth, firebaseStorage } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

export default function MedicineList() {
  const { state, setState } = useStore();
  const [meds, setMeds] = useState<Med[]>(state.medications as Med[]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMed, setActiveMed] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  // Sync with store whenever medications change
  useEffect(() => {
    setMeds(state.medications as Med[]);
  }, [state.medications]);

  const handleDosageChange = useCallback((e: any) => {
    const { dosage, reason } = e.detail || {};
    if (!activeMed || !dosage) return;
    setState((prev) => {
      const mIndex = prev.medications.findIndex((m) => m.name === activeMed);
      if (mIndex === -1) return prev;
      const prevDosage = prev.medications[mIndex].dosage;
      const updatedMeds: Medication[] = [...prev.medications];
      updatedMeds[mIndex] = { ...updatedMeds[mIndex], dosage, updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) };
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
    setActiveMed(undefined);
  }, [activeMed, setState]);

  // Setup event listener for dosage changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("dosageChange", handleDosageChange as any);
      return () => {
        window.removeEventListener("dosageChange", handleDosageChange as any);
      };
    }
  }, [handleDosageChange]);

  // Handle medicine photo scan and OCR
  const handleScanMedicine = async (file: File) => {
    const user = firebaseAuth().currentUser;
    if (!user) {
      alert("You must be logged in to scan medicines.");
      return;
    }

    setScanning(true);
    try {
      // Upload image to Firebase Storage
      const timestamp = Date.now();
      const fileName = `medicine_scan_${timestamp}_${file.name}`;
      const storageRef = ref(firebaseStorage(), `medicine_scans/${user.uid}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // Use prescription OCR API which has better medicine parsing
      const prescriptionResponse = await fetch("/api/prescription/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          userId: user.uid,
          prescriptionId: `scan_${timestamp}`,
        }),
      });

      let medicines: Array<{ name: string; dosage: string; frequency?: string }> = [];
      let extractedText = "";

      if (prescriptionResponse.ok) {
        const prescriptionData = await prescriptionResponse.json();
        if (prescriptionData.medicines && prescriptionData.medicines.length > 0) {
          medicines = prescriptionData.medicines;
        }
        extractedText = prescriptionData.extractedText || "";
      } else {
        // Fallback: Try Python medicine API if prescription OCR fails
        const response = await fetch("/api/medicine/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: imageUrl,
            medicine_name: "Scanned Medicine",
            user_id: user.uid,
            dosage: "",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          extractedText = data.ocr_extracted_text || "";
        }
      }

      // If no medicines found from APIs, parse manually from extracted text
      if (medicines.length === 0 && extractedText) {
        // Try to extract medicine names and dosages from text
        const lines = extractedText.split("\n").filter(line => line.trim());
        for (const line of lines) {
          // Match patterns like "Medicine Name 500mg" or "Medicine Name - 500mg"
          const medMatch = line.match(/([A-Za-z\s]+?)\s*[-–—]?\s*(\d+\s*(?:mg|ml|tablets?)?)/i);
          if (medMatch) {
            medicines.push({
              name: medMatch[1].trim(),
              dosage: medMatch[2].trim(),
              frequency: "daily",
            });
          } else if (line.match(/\d+\s*(?:mg|ml)/i)) {
            // Fallback: extract if dosage pattern found
            const parts = line.split(/\s+/);
            const dosageMatch = line.match(/\d+\s*(?:mg|ml)/i);
            if (dosageMatch && parts.length >= 2) {
              medicines.push({
                name: parts[0],
                dosage: dosageMatch[0],
                frequency: "daily",
              });
            }
          }
        }
      }

      // Add extracted medicines to medication list
      if (medicines.length > 0) {
        const newMedications: Medication[] = medicines.map((med) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: med.name.trim(),
          dosage: med.dosage.trim(),
          frequency: med.frequency || "daily",
          start: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
          end: "",
          addedBy: "OCR Scan",
          updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        }));

        setState((prev) => ({
          ...prev,
          medications: [...prev.medications, ...newMedications],
        }));

        alert(`✅ Successfully added ${medicines.length} medicine(s) from photo!\n\n${medicines.map(m => `• ${m.name} - ${m.dosage}`).join("\n")}`);
      } else {
        alert("⚠️ No medicines found in the image. Please ensure the medicine name and dosage are clearly visible.");
      }
    } catch (error: any) {
      console.error("Medicine scan error:", error);
      alert(`Failed to scan medicine: ${error?.message || "Unknown error"}`);
    } finally {
      setScanning(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScanMedicine(file);
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Medication List</h2>
        <div className="flex items-center gap-2">
          {/* Hidden file input for OCR scan */}
          <input
            type="file"
            accept="image/*"
            ref={(el) => setFileInputRef(el)}
            onChange={handleFileSelect}
            className="hidden"
            id="medicine-scan-input"
          />
          
          {/* Scan Medicine Button */}
          <label
            htmlFor="medicine-scan-input"
            className={`${
              scanning
                ? "btn-secondary cursor-wait opacity-60"
                : "btn-secondary cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
            } px-4 py-2 text-sm font-bold rounded-full flex items-center gap-2`}
          >
            {scanning ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>📷</span>
                <span>Scan Medicine</span>
              </>
            )}
          </label>

          {/* Manual Add Button */}
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
              alert(`✅ Added ${name} to your medication list!`);
            }}
            className="btn-primary px-4 py-2 text-sm font-bold rounded-full"
          >
            ➕ Add Medicine
          </button>
        </div>
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
            {meds.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-zinc-500">
                  No medications added yet. Click "➕ Add Medicine" to get started.
                </td>
              </tr>
            ) : (
              meds.map((m) => (
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
              ))
            )}
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

