"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start: string;
  end?: string;
  addedBy: string;
  updated: string;
};

export type DosageChange = {
  id: string;
  medId: string;
  prevDosage: string;
  newDosage: string;
  reason: string;
  changedBy: string;
  ts: string;
};

export type StoreState = {
  profile: { name: string; age: number; conditions: string[]; allergies: string[] };
  medications: Medication[];
  dosageChanges: DosageChange[];
};

const defaultState: StoreState = {
  profile: { name: "Ramesh Kumar", age: 62, conditions: ["Diabetes"], allergies: ["Penicillin"] },
  medications: [
    { id: "1", name: "Metformin", dosage: "500mg", frequency: "2/day", start: "31 Oct", end: "", addedBy: "Doctor", updated: "31 Oct 2025" },
    { id: "2", name: "Atorvastatin", dosage: "10mg", frequency: "1/day", start: "31 Oct", end: "", addedBy: "Doctor", updated: "31 Oct 2025" }
  ],
  dosageChanges: []
};

function load(): StoreState {
  try {
    const raw = localStorage.getItem("hc_store");
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) } as StoreState;
  } catch {
    return defaultState;
  }
}

function save(state: StoreState) {
  localStorage.setItem("hc_store", JSON.stringify(state));
}

type StoreCtx = {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(defaultState);

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    save(state);
  }, [state]);

  const value = useMemo(() => ({ state, setState }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

