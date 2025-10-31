"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuthClaims } from "@/lib/auth";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function DoctorAdminPage() {
  const { role, token } = useAuthClaims();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState("");
  const [clinic, setClinic] = useState("");
  const [connectCode, setConnectCode] = useState("");
  const [connectMsg, setConnectMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = firebaseAuth().currentUser;
      if (!u) return;
      try {
        const snap = await getDoc(doc(firestoreDb(), "users", u.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          setSpecialization(d.specialization || "");
          setClinic(d.clinic || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveProfile() {
    setError(null);
    try {
      const u = firebaseAuth().currentUser;
      if (!u) return;
      await setDoc(doc(firestoreDb(), "users", u.uid), { specialization, clinic, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    }
  }

  async function connectPatient() {
    setConnectMsg(null);
    try {
      const res = await fetch("/api/doctor/connect", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ shareCode: connectCode.trim() }) });
      const json = await res.json();
      if (res.ok) setConnectMsg(`Connected to patient ${json.patientId}`);
      else setConnectMsg(json.error || "Failed to connect");
    } catch (e: any) {
      setConnectMsg(e?.message || "Failed to connect");
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Doctor Admin</h1>
        {role !== "doctor" && <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Your account is not marked as Doctor. Contact Super Admin.</div>}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 p-5 text-sm text-[color:var(--color-muted)] dark:border-zinc-800">Loading…</div>
        ) : (
          <div className="grid gap-6">
            <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-semibold">Profile</h2>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Specialization</label>
                  <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Clinic/Hospital</label>
                  <input value={clinic} onChange={(e) => setClinic(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
                </div>
                <div className="flex justify-end">
                  <button onClick={saveProfile} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black">Save</button>
                </div>
                {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-semibold">Connect to Patient</h2>
              <div className="flex items-center gap-2">
                <input value={connectCode} onChange={(e) => setConnectCode(e.target.value)} placeholder="Enter patient share code" className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
                <button onClick={connectPatient} className="rounded-lg border px-3 py-2 text-sm">Connect</button>
              </div>
              {connectMsg && <div className="mt-2 text-xs text-[color:var(--color-muted)]">{connectMsg}</div>}
            </section>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}


