"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuthClaims } from "@/lib/auth";
import { useState } from "react";

export default function SuperAdminPage() {
  const { role } = useAuthClaims();
  const [userId, setUserId] = useState("");
  const [makeDoctor, setMakeDoctor] = useState(true);
  const [secret, setSecret] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function applyRole() {
    setMsg(null);
    try {
      const res = await fetch("/api/admin/setDoctor", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ userId, makeDoctor }) });
      const json = await res.json();
      setMsg(res.ok ? "Updated" : json.error || "Failed");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Super Admin</h1>
        {role !== "super" && <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">You are not Super Admin. Access limited.</div>}
        <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-3 text-lg font-semibold">Assign Doctor Role</h2>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm">Target User ID</label>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Admin API Secret</label>
              <input value={secret} onChange={(e) => setSecret(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={makeDoctor} onChange={(e) => setMakeDoctor(e.target.checked)} /> Make doctor</label>
            </div>
            <div className="flex justify-end">
              <button onClick={applyRole} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black">Apply</button>
            </div>
            {msg && <div className="text-xs text-[color:var(--color-muted)]">{msg}</div>}
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}


