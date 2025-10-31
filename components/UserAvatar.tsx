"use client";

import { useEffect, useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

function initialsFrom(name?: string | null) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
}

export default function UserAvatar({ size = 32 }: { size?: number }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const u = firebaseAuth().currentUser;
    if (!u) return;
    setPhoto(u.photoURL);
    setName(u.displayName);
    (async () => {
      try {
        const snap = await getDoc(doc(firestoreDb(), "users", u.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          if (d.profilePhoto) setPhoto(d.profilePhoto);
          if (d.name) setName(d.name);
        }
      } catch {}
    })();
  }, []);

  const text = initialsFrom(name) || "U";
  if (photo) {
    return <img src={photo} alt="avatar" width={size} height={size} className="rounded-full object-cover" />;
  }
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
      {text}
    </div>
  );
}


