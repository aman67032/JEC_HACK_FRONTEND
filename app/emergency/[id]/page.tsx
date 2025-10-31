"use client";

import { useEffect, useState } from "react";
import { readPublicEmergencySummary } from "@/lib/emergency";

type Props = { params: { id: string } };

export default function EmergencyView({ params }: Props) {
  const { id } = params;
  const [payload, setPayload] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await readPublicEmergencySummary(id);
      if (isMounted) {
        setPayload(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const expired = payload ? Date.now() > new Date(payload.expiresAt).getTime() : false;
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold">Emergency Summary</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Link ID: {id} — Read-only view. {expired ? "Expired" : "Valid"}</p>
      {loading && (
        <div className="rounded-2xl border border-zinc-200 p-5 text-sm text-[color:var(--color-muted)] dark:border-zinc-800">Loading…</div>
      )}
      {!loading && !payload && (
        <div className="rounded-2xl border border-zinc-200 p-5 text-sm text-[color:var(--color-muted)] dark:border-zinc-800">No data found for this link.</div>
      )}
      {!loading && payload && (
        <section className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-2 text-lg font-semibold">Patient</h2>
            <p className="text-sm text-[color:var(--color-muted)]">{payload.patientName}{payload.age ? `, ${payload.age}` : ""} • Conditions: {(payload.conditions || []).join(", ")} • Allergies: {(payload.allergies || []).join(", ")}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-2 text-lg font-semibold">Current Medications</h2>
            <ul className="grid gap-1 text-sm">
              {payload.currentMedications.map((m: any, idx: number) => (
                <li key={idx}>{m.name} {m.dosage} — {m.frequency || "schedule N/A"}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

