"use client";

import { useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function FamilyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email, password);
      
      const user = firebaseAuth().currentUser;
      if (!user) {
        setError("Login failed - no user found");
        return;
      }
      
      // Ensure user role is set to family
      const db = firestoreDb();
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Update role to family if not already set
        if (userData.role !== "family") {
          await setDoc(doc(db, "users", user.uid), {
            role: "family",
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        // Redirect to family dashboard
        router.push("/family/dashboard");
      } else {
        // Create user document with family role
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          role: "family",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        router.push("/family/dashboard");
      }
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth(), provider);
      const user = result.user;

      // Check if user document exists, create if not
      const db = firestoreDb();
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          role: "family",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        // Update role to family
        await setDoc(doc(db, "users", user.uid), {
          role: "family",
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      router.push("/family/dashboard");
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <div className="mb-4 text-6xl">👨‍👩‍👧‍👦</div>
        <h1 className="mb-2 text-2xl font-semibold">Family Member Login</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Access your family dashboard to monitor and help manage medications for your loved ones.
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
        <button onClick={onLogin} disabled={loading} className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-black">
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-300 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">Or</span>
          </div>
        </div>
        <button onClick={onGoogleSignIn} disabled={loading} className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-600 dark:text-zinc-400">
        New family member? <a href="/signup" className="underline">Create an account</a> or{" "}
        <a href="/login" className="underline">Login as Patient/Doctor</a>
      </p>
    </div>
  );
}

