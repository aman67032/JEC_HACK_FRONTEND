"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";
import { initializeNotifications, unregisterNotifications } from "@/lib/notifications";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (u) => {
      if (!u) {
        // Unregister notifications on logout
        await unregisterNotifications();
        router.replace("/login");
      } else {
        setReady(true);
        // Initialize notifications when user is authenticated
        await initializeNotifications();
      }
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}


