"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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

  // Load from Firestore if user is authenticated (replaces local state)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth(), (user) => {
      if (!user) {
        // User signed out, reset to default state
        setState(defaultState);
        return;
      }
      
      // User signed in, load their data from Firestore
      const db = firestoreDb();
      (async () => {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          const medsSnap = await getDocs(collection(doc(db, "users", user.uid), "medications"));
          
          // Read profile data directly from user document (not nested in 'profile' field)
          let profile = defaultState.profile;
          if (userSnap.exists()) {
            const userData = userSnap.data() as any;
            profile = {
              name: userData.name || defaultState.profile.name,
              age: userData.age || defaultState.profile.age,
              conditions: userData.conditions || defaultState.profile.conditions,
              allergies: userData.allergies || defaultState.profile.allergies,
            };
          }
          
          const medications = medsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          setState((prev) => ({ ...prev, profile, medications }));
        } catch {}
      })();
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    save(state);
    // Also persist to Firestore when signed in (simple upsert)
    const user = firebaseAuth().currentUser;
    if (!user) return;
    const db = firestoreDb();
    (async () => {
      try {
        // Save profile data directly to user document (not nested in 'profile' field)
        await setDoc(doc(db, "users", user.uid), {
          name: state.profile.name,
          age: state.profile.age,
          conditions: state.profile.conditions,
          allergies: state.profile.allergies,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        for (const m of state.medications) {
          await setDoc(doc(collection(doc(db, "users", user.uid), "medications"), m.id), m, { merge: true });
        }
      } catch {}
    })();
  }, [state]);

  const value = useMemo(() => ({ state, setState }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

