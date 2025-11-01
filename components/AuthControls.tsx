"use client";

import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import UserAvatar from "@/components/UserAvatar";

export default function AuthControls() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (u) => {
      setUserEmail(u?.email ?? null);
      setDisplayName(u?.displayName ?? null);
    });
    return () => unsub();
  }, []);

  if (!userEmail) {
    return (
      <>
        <a href="/login" className="rounded-full px-5 py-2 text-xl font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Login</a>
        <a href="/signup" className="rounded-full px-5 py-2 text-xl font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Sign Up</a>
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a href="/profile" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-black/[.04]">
        <UserAvatar size={32} />
        <div className="flex flex-col">
          {displayName && (
            <span className="text-sm font-semibold text-[color:var(--color-foreground)] leading-tight">{displayName}</span>
          )}
          <span className="text-sm text-[color:var(--color-muted)] leading-tight">{userEmail}</span>
        </div>
      </a>
      <button onClick={() => signOut(firebaseAuth())} className="rounded-full px-4 py-2 text-lg font-semibold text-[color:var(--color-foreground)] hover:bg-black/[.06]">Sign out</button>
    </div>
  );
}


