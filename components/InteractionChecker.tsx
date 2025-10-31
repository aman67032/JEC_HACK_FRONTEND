"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

async function getRxcuiForName(name: string): Promise<string | null> {
  try {
    const resp = await fetch(`/api/proxy/rxnav/approximateTerm?term=${encodeURIComponent(name)}&maxEntries=1`);
    const json = await resp.json();
    const cand = json.approximateGroup?.candidate?.[0]?.rxcui;
    return cand || null;
  } catch {
    return null;
  }
}

async function checkInteractions(rxcuis: string[]): Promise<string[]> {
  try {
    const resp = await fetch(`/api/proxy/rxnav/interaction/list?rxcuis=${encodeURIComponent(rxcuis.join("+"))}`);
    const json = await resp.json();
    const groups = json.fullInteractionTypeGroup || [];
    const warnings: string[] = [];
    for (const g of groups) {
      for (const t of g.fullInteractionType || []) {
        for (const p of t.interactionPair || []) {
          warnings.push(p.description);
        }
      }
    }
    return warnings;
  } catch {
    return ["Interaction service not available right now."];
  }
}

export default function InteractionChecker() {
  const { state } = useStore();
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function run() {
    setLoading(true);
    setWarnings([]);
    const names = state.medications.map((m) => m.name).filter(Boolean);
    const cuis: string[] = [];
    for (const n of names) {
      const c = await getRxcuiForName(n);
      if (c) cuis.push(c);
    }
    const w = await checkInteractions(cuis);
    setWarnings(w);
    setLoading(false);
  }

  return (
    <section id="interactions" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Drug Interaction Checker</h2>
        <button onClick={run} disabled={loading} className="btn-secondary px-5 py-3 text-base font-bold rounded-full disabled:opacity-60 shadow-lg hover:shadow-xl transition-all">
          {loading ? "🔄 Checking..." : "🔍 Check Interactions"}
        </button>
      </div>
      {warnings.length === 0 && !loading && (
        <p className="text-sm text-[color:var(--color-muted)]">No warnings yet. Click "Run Check" to evaluate current medicines.</p>
      )}
      {warnings.length > 0 && (
        <ul className="grid gap-2 text-sm text-amber-800">
          {warnings.map((w, i) => (
            <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">⚠ {w}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

