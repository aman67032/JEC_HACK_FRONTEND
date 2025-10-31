"use client";

import { useState, useEffect } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { useStore } from "@/lib/store";
import CameraDialog from "./CameraDialog";

interface MedicineScheduleItem {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
  upcoming: boolean;
}

export default function MedicineSchedule() {
  const { state } = useStore();
  const [schedule, setSchedule] = useState<MedicineScheduleItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [adherence, setAdherence] = useState({ today: 0, week: 85, month: 78 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Generate schedule from medications
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const schedules: MedicineScheduleItem[] = [];
    
    state.medications.forEach((med) => {
      // Parse frequency (e.g., "2/day", "morning, night", etc.)
      const frequency = med.frequency.toLowerCase();
      
      if (frequency.includes("morning") || frequency.includes("morn")) {
        schedules.push({
          id: `${med.id}-morning`,
          name: med.name,
          dosage: med.dosage,
          time: "09:00",
          taken: false,
          upcoming: currentHour < 9 || (currentHour === 9 && currentMinute < 30)
        });
      }
      if (frequency.includes("afternoon") || frequency.includes("noon")) {
        schedules.push({
          id: `${med.id}-afternoon`,
          name: med.name,
          dosage: med.dosage,
          time: "14:00",
          taken: false,
          upcoming: currentHour < 14 || (currentHour === 14 && currentMinute < 30)
        });
      }
      if (frequency.includes("night") || frequency.includes("evening") || frequency.includes("eve")) {
        schedules.push({
          id: `${med.id}-night`,
          name: med.name,
          dosage: med.dosage,
          time: "20:00",
          taken: false,
          upcoming: currentHour < 20 || (currentHour === 20 && currentMinute < 30)
        });
      }
      
      // Generic schedules based on frequency number
      const numMatch = frequency.match(/(\d+)\s*(?:x|\/|times)/i);
      if (numMatch) {
        const count = parseInt(numMatch[1]);
        for (let i = 0; i < count; i++) {
          const hour = 8 + (i * 6);
          schedules.push({
            id: `${med.id}-${i}`,
            name: med.name,
            dosage: med.dosage,
            time: `${hour.toString().padStart(2, "0")}:00`,
            taken: false,
            upcoming: currentHour < hour || (currentHour === hour && currentMinute < 30)
          });
        }
      }
    });

    // Sort by time
    schedules.sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(schedules);
  }, [state.medications]);

  const handleMarkTaken = (id: string, medicineName: string) => {
    setSelectedMedicine(medicineName);
    setCameraOpen(true);
  };

  const handlePhotoCapture = async (file: File) => {
    // Here you would normally validate the medicine using OCR
    // For now, just mark as taken
    setSchedule(prev => prev.map(item => 
      item.id === schedule.find(s => s.name === selectedMedicine)?.id 
        ? { ...item, taken: true }
        : item
    ));
    
    // Update adherence
    const takenCount = schedule.filter(s => s.taken).length + 1;
    const totalCount = schedule.length;
    setAdherence(prev => ({
      ...prev,
      today: Math.round((takenCount / totalCount) * 100)
    }));
    
    setCameraOpen(false);
    setSelectedMedicine("");
    
    // Show success alert
    alert(`✅ ${selectedMedicine} marked as taken!`);
  };

  const upcomingMedicines = schedule.filter(s => s.upcoming && !s.taken);
  const onTimeMedicines = schedule.filter(s => {
    const [hour, minute] = s.time.split(":").map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeDiff = (currentHour * 60 + currentMinute) - (hour * 60 + minute);
    return timeDiff >= 0 && timeDiff <= 30 && !s.taken;
  });

  // If no medications, show demo/signup prompt
  if (!isLoggedIn || state.medications.length === 0) {
    return (
      <div className="card p-6 space-y-4 text-center">
        <h3 className="text-2xl font-bold mb-2">💊 Medicine Schedule</h3>
        <p className="text-lg text-[color:var(--color-muted)] mb-4">
          {!isLoggedIn 
            ? "Sign up to track your medicines and get smart reminders!"
            : "Add medicines to see your schedule here"}
        </p>
        {!isLoggedIn && (
          <div className="flex justify-center gap-4">
            <a href="/signup" className="btn-primary px-6 py-3 text-lg font-bold rounded-full">
              Get Started
            </a>
            <a href="/login" className="btn-secondary px-6 py-3 text-lg font-bold rounded-full">
              Login
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">💊 Medicine Schedule</h3>
          <div className="text-right">
            <div className="text-sm text-[color:var(--color-muted)]">Today's Adherence</div>
            <div className="text-2xl font-bold text-green-600">{adherence.today}%</div>
          </div>
        </div>

        {/* On-Time Medicines (Due Now) */}
        {onTimeMedicines.length > 0 && (
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20">
            <h4 className="mb-3 text-lg font-bold text-amber-800 dark:text-amber-200">
              ⏰ Take Now
            </h4>
            <div className="space-y-2">
              {onTimeMedicines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-zinc-900"
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-[color:var(--color-muted)]">
                      {item.dosage} • {item.time}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkTaken(item.id, item.name)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                  >
                    ✅ Mark Taken
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Medicines */}
        {upcomingMedicines.length > 0 && (
          <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-4 dark:bg-blue-950/20">
            <h4 className="mb-3 text-lg font-bold text-blue-800 dark:text-blue-200">
              📅 Upcoming
            </h4>
            <div className="space-y-2">
              {upcomingMedicines.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-zinc-900"
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-[color:var(--color-muted)]">
                      {item.dosage} • {item.time}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkTaken(item.id, item.name)}
                    className="rounded-lg border-2 border-blue-400 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
                  >
                    📷 Verify
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="rounded-xl bg-gradient-to-r from-[color:var(--color-sage)] to-[color:var(--color-sage-light)] p-4 text-white">
          <div className="mb-2 text-sm font-semibold">This Week's Progress</div>
          <div className="mb-2 h-4 w-full overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${adherence.week}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>{adherence.week}% Adherence</span>
            <span>{schedule.filter(s => s.taken).length} / {schedule.length} Taken</span>
          </div>
        </div>
      </div>

      <CameraDialog
        isOpen={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setSelectedMedicine("");
        }}
        onCapture={(url) => console.log("Image captured:", url)}
        onTakePhoto={handlePhotoCapture}
        medicineName={selectedMedicine}
      />
    </>
  );
}

