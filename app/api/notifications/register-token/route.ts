import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { handleFirebaseError } from "@/lib/firebaseHelpers";

/**
 * Register FCM token for push notifications
 * Called when user grants notification permission
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, fcmToken } = body;

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { error: "Missing required fields: userId, fcmToken" },
        { status: 400 }
      );
    }

    let db;
    try {
      db = getFirestoreAdmin();
    } catch (firebaseError: any) {
      return NextResponse.json(
        { 
          error: "Firebase service unavailable",
          message: firebaseError?.message || "Could not initialize Firebase Admin. Please configure FIREBASE_SERVICE_ACCOUNT."
        },
        { status: 500 }
      );
    }

    const userRef = db.collection("users").doc(userId);

    // Add token to user's fcmTokens array (avoid duplicates)
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const existingTokens = userData?.fcmTokens || [];
      
      if (!existingTokens.includes(fcmToken)) {
        await userRef.update({
          fcmTokens: FieldValue.arrayUnion(fcmToken),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Create user document if doesn't exist
      await userRef.set({
        fcmTokens: [fcmToken],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "FCM token registered successfully",
    });
  } catch (error: any) {
    console.error("FCM token registration error:", error);
    const errorResponse = handleFirebaseError(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.status }
    );
  }
}

/**
 * Unregister FCM token
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, fcmToken } = body;

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { error: "Missing required fields: userId, fcmToken" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    await db.collection("users").doc(userId).update({
      fcmTokens: FieldValue.arrayRemove(fcmToken),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "FCM token unregistered successfully",
    });
  } catch (error: any) {
    console.error("FCM token unregistration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unregister FCM token" },
      { status: 500 }
    );
  }
}

