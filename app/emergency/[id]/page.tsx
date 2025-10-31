type Props = { params: { id: string } };

export default function EmergencyView({ params }: Props) {
  const { id } = params;
  let payload: any = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`hc_emergency_${id}`);
      if (raw) payload = JSON.parse(raw);
    } catch {}
  }
  const expired = payload ? Date.now() > payload.expiresAt : false;
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold">Emergency Summary</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Link ID: {id} — Read-only view. {expired ? "Expired" : "Valid"}</p>
      {!payload && (
        <div className="rounded-2xl border border-zinc-200 p-5 text-sm text-[color:var(--color-muted)] dark:border-zinc-800">No data found for this link.</div>
      )}
      {payload && (
        <section className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-2 text-lg font-semibold">Patient</h2>
            <p className="text-sm text-[color:var(--color-muted)]">{payload.patient.name}, {payload.patient.age} • Conditions: {payload.patient.conditions.join(", ")} • Allergies: {payload.patient.allergies.join(", ")}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-2 text-lg font-semibold">Current Medications</h2>
            <ul className="grid gap-1 text-sm">
              {payload.medications.map((m: any) => (
                <li key={m.id}>{m.name} {m.dosage} — {m.frequency || "schedule N/A"}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

