import type { NextRequest } from "next/server";
import { getAuthAdmin, getFirestoreAdmin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Try to get token from Authorization header or cookie
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("auth-token")?.value;
    
    let userId: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.slice("Bearer ".length);
      try {
        const auth = getAuthAdmin();
        const decoded = await auth.verifyIdToken(idToken);
        userId = decoded.uid;
      } catch (e) {
        // Token invalid, continue to try other methods
      }
    } else if (cookieToken) {
      try {
        const auth = getAuthAdmin();
        const decoded = await auth.verifyIdToken(cookieToken);
        userId = decoded.uid;
      } catch (e) {
        // Token invalid
      }
    }

    const body = await req.json();
    
    // Allow userId from body if not in token (for client-side submission)
    if (!userId && body.userId) {
      userId = body.userId;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      hospitalName,
      hospitalAddress,
      degreeName,
      degreeInstitution,
      licenseNumber,
      specialization,
      degreeFileUrl,
      licenseFileUrl,
    } = body;

    if (!hospitalName || !degreeName || !degreeInstitution || !licenseNumber) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let db;
    try {
      db = getFirestoreAdmin();
    } catch (firebaseError: any) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Firebase service unavailable",
          message: firebaseError?.message || "Could not initialize Firebase Admin. Please configure FIREBASE_SERVICE_ACCOUNT."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create verification submission document
    const verificationData = {
      userId,
      hospitalName,
      hospitalAddress: hospitalAddress || undefined,
      degreeName,
      degreeInstitution,
      licenseNumber,
      specialization: specialization || undefined,
      degreeFileUrl,
      licenseFileUrl,
      verificationStatus: "pending",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to user document
    await db.doc(`users/${userId}`).set(verificationData, { merge: true });

    // Also create a separate verification request document for admin review
    const verificationRef = db.collection("doctor_verifications").doc();
    await verificationRef.set({
      ...verificationData,
      verificationId: verificationRef.id,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    });

    return new Response(
      JSON.stringify({ ok: true, message: "Verification submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Doctor verification error:", e);
    
    // Handle Firebase errors
    if (e?.message?.includes("Could not load") || e?.message?.includes("FIREBASE_SERVICE_ACCOUNT")) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Firebase Admin not initialized. Please configure FIREBASE_SERVICE_ACCOUNT environment variable.",
          hint: "See: https://console.firebase.google.com/project/health-connect-d256d/settings/serviceaccounts/adminsdk"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Failed to submit verification" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

