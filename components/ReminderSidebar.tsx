"use client";

import { useState, useEffect } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useStore } from "@/lib/store";
import ReminderCard from "./ReminderCard";
import AddReminderModal from "./AddReminderModal";
import VerificationModal from "./VerificationModal";
import ReminderAlertPopup from "./ReminderAlertPopup";

export interface MedicineReminder {
  id: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // HH:MM format
  frequency: "daily" | "alternate-days" | "custom";
  customDays?: number[];
  status: "pending" | "taken" | "missed" | "snoozed";
  nextScheduledDate: string; // ISO date
  createdAt: string;
  snoozedUntil?: string; // ISO timestamp
  userId: string;
}

interface ReminderSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ReminderSidebar({ isOpen = true, onToggle }: ReminderSidebarProps) {
  const { state } = useStore();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<MedicineReminder | null>(null);
  const [verificationModal, setVerificationModal] = useState<{ open: boolean; reminder: MedicineReminder | null }>({
    open: false,
    reminder: null,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth(), (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Load reminders from Firestore
  useEffect(() => {
    if (!userId) return;

    const db = firestoreDb();
    const remindersRef = collection(doc(db, "users", userId), "reminders");
    
    const unsubscribe = onSnapshot(remindersRef, (snapshot) => {
      const loadedReminders: MedicineReminder[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MedicineReminder, "id">),
      }));
      
      // Sort by next scheduled time
      loadedReminders.sort((a, b) => 
        new Date(a.nextScheduledDate).getTime() - new Date(b.nextScheduledDate).getTime()
      );
      
      setReminders(loadedReminders);
    });

    return () => unsubscribe();
  }, [userId]);

  // Check for due reminders every minute
  useEffect(() => {
    const checkDueReminders = () => {
      const now = new Date();
      
      reminders.forEach((reminder) => {
        if (reminder.status !== "pending" && reminder.status !== "snoozed") return;
        
        // Handle snoozed reminders
        if (reminder.status === "snoozed" && reminder.snoozedUntil) {
          const snoozedUntil = new Date(reminder.snoozedUntil);
          if (now >= snoozedUntil && !activeAlert) {
            // Snooze time expired, trigger alert
            setActiveAlert(reminder);
            playNotificationSound();
          }
          return;
        }
        
        // Parse scheduled time
        const [hour, minute] = reminder.scheduledTime.split(":").map(Number);
        const scheduledDateTime = new Date(reminder.nextScheduledDate);
        scheduledDateTime.setHours(hour, minute, 0, 0);
        
        // Check if reminder is due (within ±2 minutes of scheduled time)
        const timeDiff = Math.abs(now.getTime() - scheduledDateTime.getTime());
        const twoMinutes = 2 * 60 * 1000;
        
        if (timeDiff <= twoMinutes && !activeAlert && reminder.status === "pending") {
          // Trigger alert
          setActiveAlert(reminder);
          // Play sound notification
          playNotificationSound();
        }
        
        // Check for missed reminders (30 minutes past scheduled time)
        const thirtyMinutes = 30 * 60 * 1000;
        if (now.getTime() - scheduledDateTime.getTime() > thirtyMinutes && reminder.status === "pending") {
          handleMissedReminder(reminder);
        }
      });
    };

    const interval = setInterval(checkDueReminders, 60000); // Check every minute
    checkDueReminders(); // Initial check

    return () => clearInterval(interval);
  }, [reminders, activeAlert]);

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleMissedReminder = async (reminder: MedicineReminder) => {
    if (!userId) return;

    // Update reminder status to missed
    const db = firestoreDb();
    await setDoc(
      doc(collection(doc(db, "users", userId), "reminders"), reminder.id),
      { status: "missed" },
      { merge: true }
    );

    // Notify caretakers
    await notifyCaretakers(userId, reminder);
  };

  const notifyCaretakers = async (patientId: string, reminder: MedicineReminder) => {
    try {
      const db = firestoreDb();
      const userSnap = await getDoc(doc(db, "users", patientId));
      
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const caregivers = userData.caregivers || [];

      if (caregivers.length === 0) {
        console.log("No caregivers found for patient");
        return;
      }

      // Create notification for each caregiver
      for (const caregiverId of caregivers) {
        try {
          await addDoc(collection(doc(db, "users", caregiverId), "notifications"), {
            type: "missed_reminder",
            patientId: patientId,
            patientName: userData.name || state.profile.name,
            medicineName: reminder.medicineName,
            scheduledTime: reminder.scheduledTime,
            message: `⚠ Patient ${userData.name || state.profile.name} may have missed their scheduled dose of ${reminder.medicineName}. Please check in.`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: "high",
          });
        } catch (error) {
          console.error(`Failed to notify caregiver ${caregiverId}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to notify caretakers:", error);
    }
  };

  const handleSnooze = async (reminder: MedicineReminder) => {
    if (!userId) return;

    const db = firestoreDb();
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + 15);

    await setDoc(
      doc(collection(doc(db, "users", userId), "reminders"), reminder.id),
      {
        status: "snoozed",
        snoozedUntil: snoozedUntil.toISOString(),
      },
      { merge: true }
    );

    setActiveAlert(null);
  };

  const handleVerifyIntake = (reminder: MedicineReminder) => {
    setActiveAlert(null);
    setVerificationModal({ open: true, reminder });
  };

  const handleReminderVerified = async (reminder: MedicineReminder, verificationData: {
    photoUrl: string;
    ocrOutput: string;
    matchStatus: "match" | "mismatch";
    timestamp: string;
  }) => {
    if (!userId) return;

    const db = firestoreDb();

    // Calculate next scheduled date based on frequency
    const [hours, minutes] = reminder.scheduledTime.split(":").map(Number);
    const nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    if (reminder.frequency === "alternate-days") {
      nextDate.setDate(nextDate.getDate() + 2);
    } else if (reminder.frequency === "custom" && reminder.customDays && reminder.customDays.length > 0) {
      const today = new Date().getDay();
      const sortedDays = [...reminder.customDays].sort((a, b) => a - b);
      const nextDay = sortedDays.find((day) => day > today) || sortedDays[0];
      const daysUntilNext = nextDay > today ? nextDay - today : (7 - today) + nextDay;
      nextDate.setDate(nextDate.getDate() + daysUntilNext);
    } else {
      // Daily frequency
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Update reminder status and next scheduled date
    await setDoc(
      doc(collection(doc(db, "users", userId), "reminders"), reminder.id),
      { 
        status: "pending", // Reset to pending for next occurrence
        nextScheduledDate: nextDate.toISOString(),
        lastTakenAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Save verification data (try Supabase first, fallback to Firestore)
    try {
      const { saveVerificationToSupabase } = await import("@/lib/supabaseClient");
      await saveVerificationToSupabase({
        reminderId: reminder.id,
        medicineName: reminder.medicineName,
        photoUrl: verificationData.photoUrl,
        ocrOutput: verificationData.ocrOutput,
        matchStatus: verificationData.matchStatus,
        timestamp: verificationData.timestamp,
        scheduledTime: reminder.scheduledTime,
        userId,
      });
    } catch (error) {
      // Fallback to Firestore if Supabase is not configured
      await addDoc(collection(doc(db, "users", userId), "verifications"), {
        reminderId: reminder.id,
        medicineName: reminder.medicineName,
        photoUrl: verificationData.photoUrl,
        ocrOutput: verificationData.ocrOutput,
        matchStatus: verificationData.matchStatus,
        timestamp: verificationData.timestamp,
        scheduledTime: reminder.scheduledTime,
      });
    }

    setVerificationModal({ open: false, reminder: null });
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!userId) return;

    const db = firestoreDb();
    await deleteDoc(doc(collection(doc(db, "users", userId), "reminders"), reminderId));
  };

  const upcomingReminders = reminders.filter((r) => r.status === "pending" || r.status === "snoozed");
  const activeReminders = upcomingReminders.filter((r) => {
    if (r.status === "snoozed" && r.snoozedUntil) {
      return new Date(r.snoozedUntil) <= new Date();
    }
    return r.status === "pending";
  });

  return (
    <>
      <aside
        className={`fixed right-0 top-16 bottom-0 z-40 w-full max-w-md transform border-l border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Medicine Reminder Sidebar"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[color:var(--color-foreground)]">
                  Reminders
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                  {activeReminders.length} active reminder{activeReminders.length !== 1 ? "s" : ""}
                </p>
              </div>
              {onToggle && (
                <button
                  onClick={onToggle}
                  className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5"
                  aria-label="Toggle sidebar"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 w-full btn-primary px-6 py-4 text-lg font-bold rounded-full flex items-center justify-center gap-2"
            >
              <span className="text-2xl">➕</span> Add Reminder
            </button>
          </div>

          {/* Reminders List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {upcomingReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {/* Styled Pill Icon */}
                <div className="mb-6 relative">
                  <div className="w-24 h-16 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
                    {/* Left half - Pink/Orange */}
                    <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-pink-400 to-pink-500"></div>
                    {/* Right half - Orange */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                    {/* Glossy highlight effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full"></div>
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 transform -translate-x-1/2"></div>
                  </div>
                </div>
                <p className="text-xl font-bold text-[color:var(--color-foreground)] mb-2">
                  No reminders scheduled
                </p>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Add a reminder to get started
                </p>
              </div>
            ) : (
              upcomingReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  currentTime={currentTime}
                  onVerify={() => handleVerifyIntake(reminder)}
                  onSnooze={() => handleSnooze(reminder)}
                  onDelete={() => handleDeleteReminder(reminder.id)}
                />
              ))
            )}
          </div>

          {/* Current Time Display */}
          <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
            <div className="text-sm font-semibold text-[color:var(--color-muted)] mb-1">Current Time</div>
            <div className="text-2xl font-bold text-[color:var(--color-foreground)]">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Alert Popup */}
      {activeAlert && (
        <ReminderAlertPopup
          reminder={activeAlert}
          onVerify={() => handleVerifyIntake(activeAlert)}
          onSnooze={() => handleSnooze(activeAlert)}
          onClose={() => setActiveAlert(null)}
        />
      )}

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={() => {
          // Save reminder logic is in AddReminderModal
          setIsAddModalOpen(false);
        }}
        userId={userId}
      />

      {/* Verification Modal */}
      {verificationModal.open && verificationModal.reminder && (
        <VerificationModal
          isOpen={verificationModal.open}
          reminder={verificationModal.reminder}
          onClose={() => setVerificationModal({ open: false, reminder: null })}
          onVerify={handleReminderVerified}
        />
      )}
    </>
  );
}

