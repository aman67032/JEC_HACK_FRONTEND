"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import ProfileSection from "@/components/ProfileSection";
import UploadSection from "@/components/UploadSection";
import MedicineList from "@/components/MedicineList";
import ReminderSection from "@/components/ReminderSection";
import AdherenceTracker from "@/components/AdherenceTracker";
import EmergencyButton from "@/components/EmergencyButton";
import HistoryReport from "@/components/HistoryReport";
import InteractionChecker from "@/components/InteractionChecker";
import QuickActions from "@/components/QuickActions";
import RequireAuth from "@/components/RequireAuth";
import MedicineSchedule from "@/components/MedicineSchedule";
import ChatBot from "@/components/chatbot/ChatBot";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Check user role and redirect accordingly
        const userDoc = await getDoc(doc(firestoreDb(), "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          
          // Redirect doctors to doctor dashboard
          if (role === "doctor") {
            router.push("/doctor/dashboard");
            return;
          }
          
          // Redirect family members to family dashboard
          if (role === "family") {
            router.push("/family/dashboard");
            return;
          }
        }
      } catch (e) {
        console.error("Error checking user role:", e);
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <RequireAuth>
        <div className="flex items-center justify-center p-8">
          <div className="text-[color:var(--color-muted)]">Loading...</div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="space-y-8">
        {/* Elderly-Friendly Quick Access Section */}
        <section className="grid gap-6 md:grid-cols-2 mb-4">
          {/* Large Camera/OCR Box */}
          <div className="rounded-3xl border-4 border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-2xl hover:shadow-3xl transition-all dark:from-blue-950 dark:to-blue-900 dark:border-blue-600">
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">📷</div>
              <h2 className="text-4xl font-bold mb-2 text-blue-900 dark:text-blue-100">Scan Prescription</h2>
              <p className="text-xl text-blue-700 dark:text-blue-200">Take a photo to add medicines automatically</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  // Scroll to upload section and trigger the file input
                  const uploadSection = document.querySelector('section#upload input[type="file"]') as HTMLInputElement;
                  if (uploadSection) {
                    window.location.hash = 'upload';
                    setTimeout(() => {
                      uploadSection.click();
                    }, 300);
                  } else {
                    window.location.hash = 'upload';
                  }
                }}
                className="block w-full rounded-2xl bg-blue-600 px-8 py-6 text-3xl font-bold text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-center dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                📁 Upload Photo or PDF
              </button>
            </div>
          </div>

          {/* Large Emergency Box */}
          <div className="rounded-3xl border-4 border-red-400 bg-gradient-to-br from-red-50 to-red-100 p-8 shadow-2xl hover:shadow-3xl transition-all dark:from-red-950 dark:to-red-900 dark:border-red-600">
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">🚨</div>
              <h2 className="text-4xl font-bold mb-2 text-red-900 dark:text-red-100">Emergency Help</h2>
              <p className="text-xl text-red-700 dark:text-red-200">Get help instantly when you need it</p>
            </div>
            <div className="space-y-4">
              <a
                href="#emergency"
                className="block w-full rounded-2xl bg-red-600 px-8 py-6 text-3xl font-bold text-white hover:bg-red-700 shadow-lg hover:shadow-xl transition-all text-center dark:bg-red-700 dark:hover:bg-red-800"
              >
                🆘 Emergency Button
              </a>
            </div>
          </div>
        </section>

        {/* Quick Actions Bar */}
        <QuickActions />
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="col-span-1 grid gap-8 lg:col-span-2">
            <ProfileSection />
            <div id="upload">
              <UploadSection />
            </div>
            <MedicineList />
            <MedicineSchedule />
            <InteractionChecker />
            <ReminderSection />
          </div>
          <div className="col-span-1 grid gap-8">
            <AdherenceTracker />
            <HistoryReport />
            <div id="emergency">
              <EmergencyButton />
            </div>
          </div>
        </div>
        <ChatBot />
      </div>
    </RequireAuth>
  );
}

