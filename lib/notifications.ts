"use client";

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { getFirebaseApp } from "./firebaseClient";
import { firebaseAuth } from "./firebaseClient";

let messagingInstance: Messaging | null = null;
let messagingInitialized = false;

/**
 * Initialize Firebase Cloud Messaging
 * Returns messaging instance if available (browser only, requires HTTPS or localhost)
 */
function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null; // Server-side: no messaging
  
  if (!messagingInitialized) {
    try {
      const app = getFirebaseApp();
      messagingInstance = getMessaging(app);
      messagingInitialized = true;
    } catch (error) {
      console.warn("Firebase Messaging not available:", error);
      messagingInstance = null;
    }
  }
  
  return messagingInstance;
}

/**
 * Request notification permission and register FCM token
 * Call this after user logs in
 */
export async function initializeNotifications(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  const messaging = getMessagingInstance();
  if (!messaging) {
    console.warn("Firebase Messaging not available");
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return false;
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY not configured. Push notifications may not work.");
      return false;
    }

    const token = await getToken(messaging, { vapidKey });
    if (!token) {
      console.log("No FCM token available");
      return false;
    }

    // Get current user
    const user = firebaseAuth().currentUser;
    if (!user) {
      console.log("No user logged in, cannot register token");
      return false;
    }

    // Register token with backend
    const response = await fetch("/api/notifications/register-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.uid,
        fcmToken: token,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to register FCM token:", error);
      return false;
    }

    console.log("✅ FCM token registered successfully");
    
    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      // You can show a notification here or update UI
      if (payload.notification) {
        new Notification(payload.notification.title || "Notification", {
          body: payload.notification.body,
          icon: "/logo.png",
        });
      }
    });

    return true;
  } catch (error: any) {
    console.error("Failed to initialize notifications:", error);
    return false;
  }
}

/**
 * Unregister FCM token (e.g., on logout)
 */
export async function unregisterNotifications(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  const messaging = getMessagingInstance();
  if (!messaging) return false;

  try {
    const user = firebaseAuth().currentUser;
    if (!user) return false;

    // Get current token
    const token = await getToken(messaging);
    if (!token) return true; // No token to unregister

    // Unregister from backend
    const response = await fetch("/api/notifications/register-token", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.uid,
        fcmToken: token,
      }),
    });

    if (!response.ok) {
      console.error("Failed to unregister FCM token");
      return false;
    }

    console.log("✅ FCM token unregistered");
    return true;
  } catch (error) {
    console.error("Failed to unregister notifications:", error);
    return false;
  }
}

