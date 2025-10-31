import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Cloud Function equivalent: Monitor reminders and trigger alerts
 * Should be called periodically (e.g., every minute via cron job)
 * Checks for due reminders and missed doses
 */
export async function POST(req: NextRequest) {
  try {
    const db = getFirestoreAdmin();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Get all users with active reminders
    const usersSnapshot = await db.collection("users").get();

    let processedCount = 0;
    let alertsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const remindersSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("reminders")
        .where("status", "in", ["pending", "snoozed"])
        .get();

      for (const reminderDoc of remindersSnapshot.docs) {
        const reminder = reminderDoc.data();
        const reminderId = reminderDoc.id;

        // Check if reminder is due
        const scheduledTime = reminder.scheduledTime; // HH:MM format
        const [hour, minute] = scheduledTime.split(":").map(Number);
        const scheduledMinutes = hour * 60 + minute;

        // Check if it's time for reminder (±2 minutes)
        const timeDiff = Math.abs(nowMinutes - scheduledMinutes);
        if (timeDiff <= 2 && reminder.status === "pending") {
          // Send reminder alert
          await sendReminderAlert(userId, reminderId, reminder);
          alertsSent++;
          processedCount++;
        }

        // Check for missed reminders (30 minutes past scheduled time)
        const missedThreshold = scheduledMinutes + 30;
        if (nowMinutes > missedThreshold && reminder.status === "pending") {
          await handleMissedReminder(userId, reminderId, reminder);
          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      alertsSent,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Reminder monitoring error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to monitor reminders" },
      { status: 500 }
    );
  }
}

async function sendReminderAlert(
  userId: string,
  reminderId: string,
  reminder: any
): Promise<void> {
  const db = getFirestoreAdmin();

  try {
    // Create notification
    await db.collection("users").doc(userId).collection("notifications").add({
      type: "reminder_due",
      title: "💊 Time to take medicine",
      message: `It's time to take ${reminder.medicineName} (${reminder.dosage})`,
      reminderId,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      scheduledTime: reminder.scheduledTime,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      priority: "high",
    });

    // Send FCM push notification
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/fcm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            type: "reminder_due",
            title: "💊 Time to take medicine",
            message: `It's time to take ${reminder.medicineName} (${reminder.dosage})`,
            data: {
              reminderId,
              medicineName: reminder.medicineName,
              dosage: reminder.dosage,
            },
          }),
        }
      );
    } catch (e) {
      console.error("Failed to send FCM:", e);
    }
  } catch (error) {
    console.error("Failed to send reminder alert:", error);
  }
}

async function handleMissedReminder(
  userId: string,
  reminderId: string,
  reminder: any
): Promise<void> {
  const db = getFirestoreAdmin();

  try {
    // Mark as missed
    await db
      .collection("users")
      .doc(userId)
      .collection("reminders")
      .doc(reminderId)
      .update({
        status: "missed",
        missedAt: FieldValue.serverTimestamp(),
      });

    // Log missed dose
    await db.collection("users").doc(userId).collection("adherenceLogs").add({
      reminderId,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      scheduledTime: reminder.scheduledTime,
      status: "missed",
      timestamp: FieldValue.serverTimestamp(),
    });

    // Notify patient
    await db.collection("users").doc(userId).collection("notifications").add({
      type: "missed_reminder",
      title: "⚠️ Missed Medicine",
      message: `You may have missed ${reminder.medicineName}. Please take it if you haven't.`,
      reminderId,
      medicineName: reminder.medicineName,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      priority: "high",
    });

    // Notify caregivers
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const caregivers = userData?.caregivers || [];

      for (const caregiverId of caregivers) {
        await db
          .collection("users")
          .doc(caregiverId)
          .collection("notifications")
          .add({
            type: "missed_reminder",
            patientId: userId,
            patientName: userData?.name || "Patient",
            title: "⚠️ Missed Medicine Alert",
            message: `${userData?.name || "Patient"} may have missed ${reminder.medicineName} at ${reminder.scheduledTime}`,
            reminderId,
            medicineName: reminder.medicineName,
            timestamp: FieldValue.serverTimestamp(),
            read: false,
            priority: "high",
          });

        // Send FCM to caregiver
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/fcm`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: caregiverId,
                type: "missed_reminder",
                title: "⚠️ Missed Medicine Alert",
                message: `${userData?.name || "Patient"} may have missed ${reminder.medicineName}`,
                data: {
                  patientId: userId,
                  patientName: userData?.name,
                  reminderId,
                  medicineName: reminder.medicineName,
                },
              }),
            }
          );
        } catch (e) {
          console.error("Failed to send FCM to caregiver:", e);
        }
      }
    }
  } catch (error) {
    console.error("Failed to handle missed reminder:", error);
  }
}

