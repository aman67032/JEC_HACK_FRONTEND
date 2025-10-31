"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { firebaseAuth, firestoreDb, firebaseStorage } from "@/lib/firebaseClient";
import { collection, doc, addDoc, onSnapshot, deleteDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CameraDialog from "./CameraDialog";
import Tesseract from "tesseract.js";

export interface MedicineReminder {
  id: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // HH:MM format
  frequency: "daily" | "alternate-days" | "custom";
  customDays?: number[];
  status: "pending" | "taken" | "missed" | "snoozed";
  nextScheduledDate: string;
  createdAt: string;
  userId: string;
}

export default function ReminderSection() {
  const { state, setState } = useStore();
  const [firestoreReminders, setFirestoreReminders] = useState<MedicineReminder[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<MedicineReminder | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      
      setFirestoreReminders(loadedReminders);
    });

    return () => unsubscribe();
  }, [userId]);

  // Generate reminders from medications based on frequency (for display only)
  const medicationReminders = useMemo(() => {
    const reminderList: Array<{ medName: string; times: string[]; frequency: string }> = [];
    
    state.medications.forEach((med) => {
      if (!med.frequency) return;
      
      const frequency = med.frequency.toLowerCase();
      const times: string[] = [];
      
      if (frequency.includes("morning") || frequency.includes("morn")) {
        times.push("Morning");
      }
      if (frequency.includes("afternoon") || frequency.includes("noon")) {
        times.push("Afternoon");
      }
      if (frequency.includes("night") || frequency.includes("evening") || frequency.includes("eve")) {
        times.push("Night");
      }
      
      // Check for numeric patterns like "2/day", "3 times"
      const numMatch = frequency.match(/(\d+)\s*(?:x|\/|times?)/i);
      if (numMatch && times.length === 0) {
        const count = parseInt(numMatch[1]);
        if (count === 1) times.push("Morning");
        else if (count === 2) {
          times.push("Morning", "Night");
        } else if (count === 3) {
          times.push("Morning", "Afternoon", "Night");
        } else {
          // Generic for more than 3
          times.push(`${count} times/day`);
        }
      }
      
      if (times.length > 0) {
        reminderList.push({
          medName: med.name,
          times,
          frequency: med.frequency
        });
      }
    });
    
    return reminderList;
  }, [state.medications]);

  async function handleAddSchedule() {
    if (!userId) {
      alert("Please login first.");
      return;
    }

    if (state.medications.length === 0) {
      alert("Please add a medicine to your list first.");
      return;
    }
    
    const medNames = state.medications.map(m => m.name).join("\n");
    const medName = prompt(`Select medicine to schedule:\n\n${medNames}`);
    if (!medName) return;
    
    const med = state.medications.find(m => m.name.toLowerCase() === medName.toLowerCase());
    if (!med) {
      alert("Medicine not found in your list. Please add it first.");
      return;
    }
    
    const timeInput = prompt("What time? (e.g., 09:00, 14:00, 20:00):");
    if (!timeInput) return;

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeInput)) {
      alert("Invalid time format. Please use HH:MM format (e.g., 09:00, 14:30).");
      return;
    }

    try {
      const db = firestoreDb();
      const remindersRef = collection(doc(db, "users", userId), "reminders");

      // Calculate next scheduled date
      const [hours, minutes] = timeInput.split(":").map(Number);
      const nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (nextDate <= new Date()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      // Create reminder in Firestore
      await addDoc(remindersRef, {
        medicineName: medName,
        dosage: med.dosage || "",
        scheduledTime: timeInput,
        frequency: "daily",
        status: "pending",
        nextScheduledDate: nextDate.toISOString(),
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      // Update medication frequency in local state
      const currentFreq = med.frequency || "";
      const newFreq = currentFreq ? `${currentFreq}, ${timeInput}` : timeInput;
      
      setState((prev) => ({
        ...prev,
        medications: prev.medications.map(m => 
          m.id === med.id ? { ...m, frequency: newFreq } : m
        )
      }));

      alert(`✅ Reminder added: ${medName} at ${timeInput}. You'll receive notifications at this time.`);
    } catch (error: any) {
      console.error("Error adding reminder:", error);
      alert(`Failed to add reminder: ${error.message || "Unknown error"}`);
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!userId) return;
    
    try {
      const db = firestoreDb();
      await deleteDoc(doc(collection(doc(db, "users", userId), "reminders"), reminderId));
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      alert(`Failed to delete reminder: ${error.message || "Unknown error"}`);
    }
  }

  return (
    <section id="reminders" className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reminders</h2>
        <button 
          onClick={handleAddSchedule}
          className="btn-primary px-5 py-3 text-base font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          ⏰ Add Schedule
        </button>
      </div>
      {firestoreReminders.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          No reminders scheduled. Click "Add Schedule" to create a reminder.
        </p>
      ) : (
        <ul className="grid gap-2 text-sm">
          {firestoreReminders.map((reminder) => (
            <li key={reminder.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex-1">
                <div className="font-medium">{reminder.medicineName}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {reminder.dosage} at {reminder.scheduledTime} • {reminder.frequency === "daily" ? "Daily" : reminder.frequency}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Next: {new Date(reminder.nextScheduledDate).toLocaleDateString()} at {reminder.scheduledTime}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mark as Taken Button - Show when medicine is due */}
                {reminder.status === "pending" && (() => {
                  const now = new Date();
                  const [hour, minute] = reminder.scheduledTime.split(":").map(Number);
                  const scheduledDateTime = new Date(reminder.nextScheduledDate);
                  scheduledDateTime.setHours(hour, minute, 0, 0);
                  const timeDiff = Math.abs(now.getTime() - scheduledDateTime.getTime());
                  const twoMinutes = 2 * 60 * 1000;
                  const isDue = timeDiff <= twoMinutes || now >= scheduledDateTime;
                  return isDue ? (
                    <button
                      onClick={() => {
                        setSelectedReminder(reminder);
                        setCameraOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      title="Mark as taken with camera verification"
                    >
                      ✅ Take
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={() => {
                    if (confirm(`Delete reminder for ${reminder.medicineName} at ${reminder.scheduledTime}?`)) {
                      handleDeleteReminder(reminder.id);
                    }
                  }}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
                  title="Delete reminder"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Camera Dialog for Medicine Verification */}
      <CameraDialog
        isOpen={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setSelectedReminder(null);
          setIsVerifying(false);
        }}
        onCapture={(url) => console.log("Image captured:", url)}
        onTakePhoto={async (file: File) => {
          if (!selectedReminder || !userId) return;
          
          setIsVerifying(true);
          try {
            // Upload photo to Firebase Storage
            const timestamp = Date.now();
            const photoRef = ref(firebaseStorage(), `verifications/${userId}/${selectedReminder.id}/${timestamp}.jpg`);
            
            await uploadBytes(photoRef, file);
            const photoUrl = await getDownloadURL(photoRef);

            // Verify medicine using OCR
            const image = URL.createObjectURL(file);
            const { data } = await Tesseract.recognize(image, "eng");
            const ocrText = data.text.toLowerCase();
            const medicineNameLower = selectedReminder.medicineName.toLowerCase();
            
            // Check if medicine name appears in OCR text
            const matchStatus = ocrText.includes(medicineNameLower) ? "match" : "mismatch";

            // Calculate next scheduled date
            const [hours, minutes] = selectedReminder.scheduledTime.split(":").map(Number);
            const nextDate = new Date();
            nextDate.setHours(hours, minutes, 0, 0);
            
            if (nextDate <= new Date() || selectedReminder.frequency === "daily") {
              nextDate.setDate(nextDate.getDate() + 1);
            }

            const db = firestoreDb();

            // Update reminder status
            await setDoc(
              doc(collection(doc(db, "users", userId), "reminders"), selectedReminder.id),
              {
                status: "pending", // Reset for next occurrence
                nextScheduledDate: nextDate.toISOString(),
                lastTakenAt: new Date().toISOString(),
              },
              { merge: true }
            );

            // Save verification log
            await addDoc(collection(doc(db, "users", userId), "adherenceLogs"), {
              reminderId: selectedReminder.id,
              medicineName: selectedReminder.medicineName,
              dosage: selectedReminder.dosage,
              scheduledTime: selectedReminder.scheduledTime,
              status: "taken",
              photoUrl,
              ocrText: data.text,
              matchStatus,
              timestamp: new Date().toISOString(),
            });

            // Save verification data
            await addDoc(collection(doc(db, "users", userId), "verifications"), {
              reminderId: selectedReminder.id,
              medicineName: selectedReminder.medicineName,
              photoUrl,
              ocrOutput: data.text,
              matchStatus,
              timestamp: new Date().toISOString(),
              scheduledTime: selectedReminder.scheduledTime,
            });

            setCameraOpen(false);
            setSelectedReminder(null);
            
            if (matchStatus === "match") {
              alert(`✅ ${selectedReminder.medicineName} verified and marked as taken!`);
            } else {
              alert(`⚠️ ${selectedReminder.medicineName} marked as taken, but verification didn't match. Please confirm you took the correct medicine.`);
            }
          } catch (error: any) {
            console.error("Error verifying medicine:", error);
            alert(`Failed to verify medicine: ${error.message || "Unknown error"}`);
          } finally {
            setIsVerifying(false);
          }
        }}
        medicineName={selectedReminder?.medicineName}
      />
    </section>
  );
}

