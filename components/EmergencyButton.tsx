"use client";

import { useStore } from "@/lib/store";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";

export default function EmergencyButton() {
  const { state } = useStore();
  const [linkId, setLinkId] = useState<string | null>(null);

  function generate() {
    const id = `${Date.now()}`;
    const summary = {
      patient: state.profile,
      medications: state.medications,
      ts: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 60 * 1000
    };
    localStorage.setItem(`hc_emergency_${id}`, JSON.stringify(summary));
    setLinkId(id);
  }

  return (
    <section id="emergency" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Emergency</h2>
      </div>
      <div className="flex flex-col items-start gap-3">
        <button onClick={generate} className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">🚨 Generate Smart Med Card</button>
        {linkId && (
          <div className="mt-2 flex items-center gap-4">
            <QRCodeSVG value={`${location.origin}/emergency/${linkId}`} size={96} />
            <div className="text-sm">
              <div className="font-semibold">Scan or open:</div>
              <a className="underline" href={`/emergency/${linkId}`}>{`${location.origin}/emergency/${linkId}`}</a>
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

