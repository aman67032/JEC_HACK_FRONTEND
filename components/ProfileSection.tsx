"use client";

import { useStore } from "@/lib/store";

export default function ProfileSection() {
  const { state } = useStore();
  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profile</h2>
        <button className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Edit</button>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Name</dt>
          <dd>{state.profile.name}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Age</dt>
          <dd>{state.profile.age}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Conditions</dt>
          <dd>{state.profile.conditions.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Allergies</dt>
          <dd>{state.profile.allergies.join(", ")}</dd>
        </div>
      </dl>
    </section>
  );
}

