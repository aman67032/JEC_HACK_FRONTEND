"use client";

import { useState } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { createEmergencySummary } from "@/lib/emergency";
import { useStore } from "@/lib/store";

export default function EmergencyNavButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useStore();

  async function handleEmergency() {
    const user = firebaseAuth().currentUser;
    if (!user) {
      alert("Please login first to use emergency services.");
      return;
    }

    if (!state.profile.name) {
      alert("Please complete your profile first.");
      return;
    }

    // Confirm action
    const confirmed = confirm(
      "🚨 EMERGENCY ALERT\n\n" +
      "This will:\n" +
      "• Alert your family members/caregivers\n" +
      "• Call emergency services (108/102)\n" +
      "• Generate your Smart Med Card\n\n" +
      "Continue?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    let emergencyRes: { summaryId: string; publicUrl: string } | null = null;
    let notifiedCount = 0;
    let errors: string[] = [];

    // 1. Generate emergency summary
    try {
      emergencyRes = await createEmergencySummary({
        userId: user.uid,
        patientName: state.profile.name,
        age: state.profile.age,
        conditions: state.profile.conditions,
        allergies: state.profile.allergies,
        currentMedications: state.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency
        })),
        ttlMinutes: 30
      });
      console.log("✅ Emergency summary created:", emergencyRes.summaryId);
    } catch (error: any) {
      console.error("Failed to create emergency summary:", error);
      errors.push(`Failed to create Smart Med Card: ${error.message || "Unknown error"}`);
    }

    // 2. Notify family members/caregivers (continue even if summary failed)
    if (emergencyRes) {
      try {
        notifiedCount = await notifyCaregivers(user.uid, emergencyRes.summaryId);
        if (notifiedCount === 0) {
          console.warn("No caregivers were notified - user may not have caregivers set up");
        }
      } catch (error: any) {
        console.error("Failed to notify caregivers:", error);
        errors.push(`Failed to notify some caregivers: ${error.message || "Unknown error"}`);
      }
    }

    // 3. Call ambulance (demo) - don't let this block success message
    try {
      await callAmbulance();
    } catch (error: any) {
      console.error("Ambulance call error:", error);
      // Don't add to errors since it's just a dialer link
    }

    // Show result
    setIsLoading(false);
    
    if (emergencyRes) {
      alert(
        "✅ Emergency Alert Sent!\n\n" +
        `• ${notifiedCount} family member(s) notified\n` +
        "• Ambulance dialer opened (call 108)\n" +
        "• Smart Med Card generated\n\n" +
        "Smart Med Card URL:\n" + emergencyRes.publicUrl +
        (notifiedCount === 0 ? "\n\n⚠️ Note: No caregivers found. Please add caregivers in your profile." : "") +
        (errors.length > 0 ? "\n\n⚠️ Some actions had issues:\n" + errors.join("\n") : "")
      );
    } else {
      // If summary creation failed completely
      alert(
        "⚠️ Emergency Alert - Partial Failure\n\n" +
        `• Smart Med Card: Failed\n` +
        `• ${notifiedCount} family member(s) notified\n` +
        "• Please call emergency services manually: 108\n\n" +
        "Errors:\n" + errors.join("\n") +
        "\n\nPlease try again or call 108 directly."
      );
    }
  }

  return (
    <button
      onClick={handleEmergency}
      disabled={isLoading}
      className="ml-3 inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2 text-lg font-bold tracking-wide text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Emergency - Alert family and call ambulance"
    >
      {isLoading ? "⏳ Processing..." : "🚨 Emergency"}
    </button>
  );
}

// Notify caregivers via Firestore
async function notifyCaregivers(patientId: string, emergencyId: string) {
  try {
    const db = firestoreDb();
    const userSnap = await getDoc(doc(db, "users", patientId));
    
    if (!userSnap.exists()) {
      console.warn("User document not found");
      return 0;
    }

    const userData = userSnap.data();
    const caregivers = userData.caregivers || [];
    
    if (caregivers.length === 0) {
      console.warn("No caregivers found for patient");
      return 0;
    }

    // Create emergency notification for each caregiver
    let notifiedCount = 0;
    for (const caregiverId of caregivers) {
      try {
        await addDoc(
          collection(db, "users", caregiverId, "notifications"),
          {
            type: "emergency",
            patientId: patientId,
            patientName: userData.name || "Patient",
            emergencyId: emergencyId,
            message: `🚨 EMERGENCY ALERT: ${userData.name || "Patient"} has activated the emergency button!`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: "high"
          }
        );
        notifiedCount++;
      } catch (err) {
        console.error(`Failed to notify caregiver ${caregiverId}:`, err);
      }
    }

    // Also log emergency event in patient's history
    try {
      await addDoc(
        collection(db, "users", patientId, "emergencyLogs"),
        {
          emergencyId: emergencyId,
          timestamp: new Date().toISOString(),
          caregiversNotified: notifiedCount,
          totalCaregivers: caregivers.length,
          status: "active"
        }
      );
    } catch (err) {
      console.error("Failed to log emergency event:", err);
    }

    console.log(`✅ Notified ${notifiedCount} of ${caregivers.length} caregiver(s)`);
    return notifiedCount;
  } catch (error) {
    console.error("Error notifying caregivers:", error);
    return 0;
  }
}

// Get caregiver count
async function getCaregiverCount(patientId: string): Promise<number> {
  try {
    const db = firestoreDb();
    const userSnap = await getDoc(doc(db, "users", patientId));
    if (!userSnap.exists()) return 0;
    const userData = userSnap.data();
    return (userData.caregivers || []).length;
  } catch {
    return 0;
  }
}

// Call ambulance (demo)
async function callAmbulance() {
  // In a real app, this would integrate with emergency services API
  // For demo, we'll just log it and show a phone dialer link
  
  const ambulanceNumber = "108"; // Indian emergency number
  
  try {
    // Show confirmation and offer to dial
    const shouldDial = confirm(
      "🚑 Calling Emergency Services (108)\n\n" +
      "Click OK to open phone dialer, or call manually: " + ambulanceNumber
    );

    if (shouldDial && typeof window !== "undefined") {
      // Open phone dialer on mobile devices or copy number
      try {
        window.location.href = `tel:${ambulanceNumber}`;
      } catch (e) {
        // Fallback: copy to clipboard or just log
        console.log("🚑 Emergency number to call:", ambulanceNumber);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(ambulanceNumber);
          console.log("Emergency number copied to clipboard");
        }
      }
    }

    // Log the emergency call (demo)
    console.log("🚑 Emergency call initiated to:", ambulanceNumber);
  } catch (error) {
    console.error("Error in ambulance call:", error);
    // Don't throw - this is just a convenience feature
  }
  
  // In production, you would:
  // - Integrate with emergency services API
  // - Send location data
  // - Send patient medical info
  // - Get dispatch confirmation
}

