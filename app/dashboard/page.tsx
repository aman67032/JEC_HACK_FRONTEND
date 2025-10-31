"use client";

import { useState } from "react";
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
import ReminderSidebar from "@/components/ReminderSidebar";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <RequireAuth>
      <div className="space-y-6 relative">
        {/* Quick Actions Bar */}
        <QuickActions />
        
        {/* Mobile Toggle Button for Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed right-4 bottom-4 z-50 lg:hidden rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Toggle reminder sidebar"
        >
          {sidebarOpen ? "✕" : "💊"}
        </button>
        
        <div className={`grid grid-cols-1 gap-6 transition-all duration-300 ${sidebarOpen ? 'lg:grid-cols-3 lg:pr-80' : 'lg:grid-cols-3'}`}>
          <div className="col-span-1 grid gap-6 lg:col-span-2">
            <ProfileSection />
            <UploadSection />
            <MedicineList />
            <InteractionChecker />
            <ReminderSection />
          </div>
          <div className="col-span-1 grid gap-6">
            <AdherenceTracker />
            <HistoryReport />
            <EmergencyButton />
          </div>
        </div>

        {/* Medicine Reminder Sidebar */}
        <ReminderSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>
    </RequireAuth>
  );
}

