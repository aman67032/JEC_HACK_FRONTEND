"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";

export default function ProfileSection() {
  const { state, setState } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(state.profile);

  // Sync editedProfile when state.profile changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedProfile(state.profile);
    }
  }, [state.profile, isEditing]);

  function handleEdit() {
    setIsEditing(true);
    setEditedProfile(state.profile);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditedProfile(state.profile);
  }

  function handleSave() {
    setState((prev) => ({
      ...prev,
      profile: editedProfile
    }));
    setIsEditing(false);
  }

  function handleChange(field: keyof typeof editedProfile, value: any) {
    if (field === "conditions" || field === "allergies") {
      // For arrays, split by comma
      const items = typeof value === "string" ? value.split(",").map(s => s.trim()).filter(Boolean) : value;
      setEditedProfile(prev => ({ ...prev, [field]: items }));
    } else {
      setEditedProfile(prev => ({ ...prev, [field]: value }));
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profile</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <button 
              onClick={handleCancel}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black"
            >
              Save
            </button>
          </div>
        ) : (
          <button 
            onClick={handleEdit}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Edit
          </button>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Name</dt>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          ) : (
            <dd>{state.profile.name}</dd>
          )}
        </div>
        <div>
          <dt className="text-zinc-500">Age</dt>
          {isEditing ? (
            <input
              type="number"
              value={editedProfile.age}
              onChange={(e) => handleChange("age", parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          ) : (
            <dd>{state.profile.age}</dd>
          )}
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">Conditions</dt>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.conditions.join(", ")}
              onChange={(e) => handleChange("conditions", e.target.value)}
              placeholder="e.g., Diabetes, Hypertension"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          ) : (
            <dd>{state.profile.conditions.join(", ") || "—"}</dd>
          )}
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">Allergies</dt>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.allergies.join(", ")}
              onChange={(e) => handleChange("allergies", e.target.value)}
              placeholder="e.g., Penicillin, Latex"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          ) : (
            <dd>{state.profile.allergies.join(", ") || "—"}</dd>
          )}
        </div>
      </dl>
    </section>
  );
}

