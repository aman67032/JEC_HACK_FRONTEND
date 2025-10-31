"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (u) => {
      if (!u) router.replace("/login");
      else setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}


