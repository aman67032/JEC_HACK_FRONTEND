import type { NextRequest } from "next/server";
import { getAuthAdmin } from "@/lib/firebaseAdmin";
import { validateStringField } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    // Parse body first to validate required fields
    const body = await req.json();
    const { userId, makeDoctor } = body;
    
    // Validate required fields before checking authentication
    const userIdValidation = validateStringField(userId, "userId");
    if (!userIdValidation.valid) {
      return new Response(
        JSON.stringify({ ok: false, error: userIdValidation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check authentication after body validation
    const secret = process.env.ADMIN_API_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ ok: false, error: "ADMIN_API_SECRET not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const header = req.headers.get("x-admin-secret");
    if (!header || header !== secret) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized - Invalid or missing x-admin-secret header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // All validations passed, proceed with operation
    let auth;
    try {
      auth = getAuthAdmin();
    } catch (firebaseError: any) {
      // Handle Firebase Admin initialization errors
      if (firebaseError?.message?.includes("Could not load") || firebaseError?.message?.includes("FIREBASE_SERVICE_ACCOUNT")) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: "Firebase Admin not initialized. Please configure FIREBASE_SERVICE_ACCOUNT environment variable.",
            hint: "See: https://console.firebase.google.com/project/health-connect-d256d/settings/serviceaccounts/adminsdk"
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      throw firebaseError; // Re-throw if it's a different error
    }

    try {
      await auth.setCustomUserClaims(userId, { role: makeDoctor === false ? undefined : "doctor" });
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (firebaseOpError: any) {
      // Handle Firebase operation errors (e.g., user not found)
      if (firebaseOpError?.code === "auth/user-not-found") {
        return new Response(
          JSON.stringify({ ok: false, error: `User not found: ${userId}` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      throw firebaseOpError; // Re-throw other errors
    }
  } catch (e: any) {
    // Handle any other errors
    if (e?.code === "app/no-app" || e?.message?.includes("Could not load")) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Firebase Admin not initialized. Please configure FIREBASE_SERVICE_ACCOUNT.",
          hint: "See: https://console.firebase.google.com/project/health-connect-d256d/settings/serviceaccounts/adminsdk"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


