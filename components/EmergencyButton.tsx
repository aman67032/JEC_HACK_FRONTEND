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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  async function generate() {
    const user = firebaseAuth().currentUser;
    const { profile, medications } = state;
    
    if (!profile.name) {
      alert("Please complete your profile first.");
      return;
    }
    
    try {
      const res = await createEmergencySummary({
        userId: user?.uid,
        patientName: profile.name,
        age: profile.age,
        conditions: profile.conditions,
        allergies: profile.allergies,
        currentMedications: medications.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency })),
        emergencyContact: undefined,
        ttlMinutes: 30
      });
      setLinkId(res.summaryId);
    } catch (error) {
      console.error("Error generating emergency summary:", error);
      alert("Failed to generate emergency card. Please try again.");
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
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          🚨 Generate Smart Med Card
        </button>
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

