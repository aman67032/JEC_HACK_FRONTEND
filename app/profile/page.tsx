"use client";

import RequireAuth from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { firebaseAuth, firestoreDb, firebaseStorage } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (u) => {
      if (!u) {
        setLoading(false);
        return;
      }
      
      try {
        const snap = await getDoc(doc(firestoreDb(), "users", u.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          setName(d.name || u.displayName || "");
          setAge(d.age || "");
          setGender(d.gender || "");
          setConditions((d.conditions || []).join(", "));
          setAllergies((d.allergies || []).join(", "));
          setPhotoUrl(d.profilePhoto || u.photoURL || "");
          if (d.shareCode) setShareCode(d.shareCode);
        } else {
          // User document doesn't exist yet, set defaults from auth user
          setName(u.displayName || "");
          setPhotoUrl(u.photoURL || "");
        }
      } catch (e: any) {
        console.error("Profile load error:", e);
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function onSave() {
    setError(null);
    try {
      const u = firebaseAuth().currentUser;
      if (!u) return;
      await setDoc(doc(firestoreDb(), "users", u.uid), {
        userId: u.uid,
        name,
        age: typeof age === "number" ? age : Number(age) || undefined,
        gender: gender || undefined,
        conditions: conditions.split(",").map(s => s.trim()).filter(Boolean),
        allergies: allergies.split(",").map(s => s.trim()).filter(Boolean),
        profilePhoto: photoUrl || undefined,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    }
  }

  async function onUploadPhoto(file: File) {
    setUploading(true);
    try {
      const u = firebaseAuth().currentUser;
      if (!u) return;
      const path = `avatars/${u.uid}/${Date.now()}_${file.name}`;
      const sref = ref(firebaseStorage(), path);
      await uploadBytes(sref, file);
      const url = await getDownloadURL(sref);
      setPhotoUrl(url);
      await setDoc(doc(firestoreDb(), "users", u.uid), { profilePhoto: url, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function generateShareCode() {
    const u = firebaseAuth().currentUser;
    if (!u) return;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await setDoc(doc(firestoreDb(), "publicShareCodes", code), { patientId: u.uid, createdAt: new Date().toISOString() }, { merge: true });
    await setDoc(doc(firestoreDb(), "users", u.uid), { shareCode: code, updatedAt: new Date().toISOString() }, { merge: true });
    setShareCode(code);
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Your Profile</h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Manage your basic information used in summaries.</p>
        {loading && <div className="rounded-2xl border border-zinc-200 p-5 text-sm text-[color:var(--color-muted)] dark:border-zinc-800">Loading…</div>}
        {!loading && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Age</label>
              <input value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} type="number" min={0} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Gender</label>
              <input value={gender} onChange={(e) => setGender(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Conditions (comma-separated)</label>
              <input value={conditions} onChange={(e) => setConditions(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Allergies (comma-separated)</label>
              <input value={allergies} onChange={(e) => setAllergies(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Profile photo URL</label>
              <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
              <div className="flex items-center gap-2 text-xs">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadPhoto(f); }} />
                {uploading && <span>Uploading…</span>}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Doctor share code</label>
              <div className="flex items-center gap-2">
                <input readOnly value={shareCode || "(not generated)"} className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
                <button type="button" onClick={generateShareCode} className="rounded-lg border px-3 py-2 text-sm">{shareCode ? "Regenerate" : "Generate"}</button>
              </div>
              <p className="text-xs text-[color:var(--color-muted)]">Share this code with your doctor so they can connect to your profile.</p>
            </div>
            {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
            <div className="flex justify-end">
              <button onClick={onSave} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black">Save</button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}


