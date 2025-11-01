"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import RequireAuth from "@/components/RequireAuth";
import BusinessSidebar from "@/components/business/BusinessSidebar";
import BusinessOverview from "@/components/business/BusinessOverview";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setBusinessId(user.uid);
      
      // Fetch business info
      try {
        const db = firestoreDb();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== "business" && data.role !== "vendor" && data.role !== "pharmacy") {
            setError("Access denied. This dashboard is for business users only.");
          } else {
            setBusinessInfo(data);
          }
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load business information");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen">
          <div className="w-64 bg-gray-100 dark:bg-gray-900"></div>
          <div className="flex-1 p-8">
            <div className="rounded-2xl border border-zinc-200 p-8 text-center text-[color:var(--color-muted)] dark:border-zinc-800">
              Loading business dashboard...
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen">
          <div className="w-64 bg-gray-100 dark:bg-gray-900"></div>
          <div className="flex-1 p-8">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Sidebar */}
        <BusinessSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950">
                <h1 className="mb-2 text-3xl font-bold">🏪 Business & Logistics Dashboard</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Welcome, {businessInfo?.name || businessInfo?.businessName || "Business"}! Manage your orders, deliveries, and inventory.
                </p>
              </div>
            </div>

            {/* Dynamic Content Based on Active Section */}
            <BusinessOverview 
              businessId={businessId}
              businessInfo={businessInfo}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

