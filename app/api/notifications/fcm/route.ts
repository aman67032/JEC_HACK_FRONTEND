import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin, getAdminApp } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

/**
 * Send FCM push notifications to users
 * Supports: reminder alerts, missed doses, drug interactions, emergency alerts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, title, message" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    
    // Get user's FCM tokens
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      // Store notification in Firestore even if no FCM tokens
      await db.collection("users").doc(userId).collection("notifications").add({
        type,
        title,
        message,
        data: data || {},
        timestamp: FieldValue.serverTimestamp(),
        read: false,
        priority: "high",
      });
      return NextResponse.json({
        success: true,
        message: "Notification stored (no FCM tokens)",
      });
    }

    // Get Firebase Admin Messaging
    const messaging = admin.messaging(getAdminApp());

    // Send to all tokens
    const messages: admin.messaging.Message[] = fcmTokens.map((token: string) => ({
      token,
      notification: {
        title,
        body: message,
      },
      data: {
        type,
        ...data,
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "medication_alerts",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    }));

    const results = await Promise.allSettled(
      messages.map((msg: admin.messaging.Message) => messaging.send(msg))
    );

    // Store notification in Firestore
    await db.collection("users").doc(userId).collection("notifications").add({
      type,
      title,
      message,
      data: data || {},
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      priority: "high",
      fcmSent: results.filter(r => r.status === "fulfilled").length,
    });

    const successful = results.filter(r => r.status === "fulfilled").length;
    return NextResponse.json({
      success: true,
      sent: successful,
      total: fcmTokens.length,
      message: `Sent ${successful} of ${fcmTokens.length} notifications`,
    });
  } catch (error: any) {
    console.error("FCM notification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}


/**
 * Send notification to caregivers
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, type, title, message, data } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: "Missing patientId" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const userDoc = await db.collection("users").doc(patientId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const caregivers = userData?.caregivers || [];

    const results = await Promise.allSettled(
      caregivers.map(async (caregiverId: string) => {
        // Send notification via POST
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/fcm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: caregiverId,
              type: type || "patient_alert",
              title: title || `Alert: ${userData?.name || "Patient"}`,
              message: message || "Patient requires attention",
              data: {
                patientId,
                patientName: userData?.name,
                ...data,
              },
            }),
          }
        );
        return response.json();
      })
    );

    return NextResponse.json({
      success: true,
      notified: results.filter(r => r.status === "fulfilled").length,
      total: caregivers.length,
    });
  } catch (error: any) {
    console.error("Caregiver notification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to notify caregivers" },
      { status: 500 }
    );
  }
}

