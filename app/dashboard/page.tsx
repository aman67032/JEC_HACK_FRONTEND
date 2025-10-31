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
import MedicineSchedule from "@/components/MedicineSchedule";
export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        {/* Quick Actions Bar */}
        <QuickActions />
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1 grid gap-6 lg:col-span-2">
            <ProfileSection />
            <UploadSection />
            <MedicineList />
            <MedicineSchedule />
            <InteractionChecker />
            <ReminderSection />
          </div>
          <div className="col-span-1 grid gap-6">
            <AdherenceTracker />
            <HistoryReport />
            <EmergencyButton />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

