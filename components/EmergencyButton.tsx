"use client";

import { useStore } from "@/lib/store";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { createEmergencySummary } from "@/lib/emergency";
import { firebaseAuth } from "@/lib/firebaseClient";

export default function EmergencyButton() {
  const { state } = useStore();
  const [linkId, setLinkId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  async function generate() {
    const user = firebaseAuth().currentUser;
    const { profile, medications } = state;
    
    // Reset error state
    setError(null);
    
    // Check authentication
    if (!user) {
      alert("Please log in first to generate your Smart Med Card.");
      return;
    }
    
    // Check profile completion
    if (!profile.name || profile.name.trim() === "") {
      alert("Please complete your profile first (add your name in Profile section).");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const res = await createEmergencySummary({
        userId: user.uid,
        patientName: profile.name,
        age: profile.age,
        conditions: profile.conditions || [],
        allergies: profile.allergies || [],
        currentMedications: medications.map((m) => ({ 
          name: m.name, 
          dosage: m.dosage, 
          frequency: m.frequency 
        })),
        emergencyContact: undefined,
        ttlMinutes: 30
      });
      
      if (res && res.summaryId) {
      setLinkId(res.summaryId);
        console.log("✅ Smart Med Card generated successfully:", res.summaryId);
      } else {
        throw new Error("Invalid response from emergency summary creation");
      }
    } catch (error: any) {
      console.error("Error generating emergency summary:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      setError(errorMessage);
      alert(`Failed to generate emergency card: ${errorMessage}\n\nPlease try again or contact support.`);
    } finally {
      setIsGenerating(false);
    }
  }

  const emergencyUrl = linkId && origin ? `${origin}/emergency/${linkId}` : "";

  return (
    <section id="emergency" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Emergency</h2>
      </div>
      <div className="flex flex-col items-start gap-3">
        <button 
          onClick={generate} 
          disabled={isGenerating}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? "⏳ Generating..." : "🚨 Generate Smart Med Card"}
        </button>
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        )}
        {linkId && emergencyUrl && (
          <div className="mt-2 flex items-center gap-4">
            <QRCodeSVG value={emergencyUrl} size={96} />
            <div className="text-sm">
              <div className="font-semibold">Scan or open:</div>
              <a 
                className="underline break-all" 
                href={`/emergency/${linkId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {emergencyUrl}
              </a>
              <div className="text-[12px] text-[color:var(--color-muted)]">Expires in ~30 minutes</div>
            </div>
          </div>
        )}
        <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <div>• Generates a temporary Smart Med Card (QR)</div>
          <div>• Suggests nearby hospitals (demo placeholder)</div>
          <div>• Sends pre-alert summary (simulated)</div>
        </div>
        <div className="mt-2 w-full rounded-xl border border-[color:var(--color-border)]">
          <iframe title="Hospitals nearby" className="h-60 w-full rounded-xl" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=hospital%20ICU%20near%20me&output=embed"></iframe>
        </div>
      </div>
    </section>
  );
}

