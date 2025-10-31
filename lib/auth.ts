"use client";

import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";

export function useAuthClaims() {
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const u = firebaseAuth().currentUser;
    if (!u) return;
    (async () => {
      const res = await u.getIdTokenResult(true);
      setRole((res.claims as any).role || null);
      setToken(res.token);
    })();
  }, []);
  return { role, token };
}


