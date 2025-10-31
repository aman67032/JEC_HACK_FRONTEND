import * as admin from "firebase-admin";

let initialized = false;

export function getAdminApp() {
  // Check if app is already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (!initialized) {
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
      
      if (!projectId) {
        throw new Error(
          "Firebase Project ID not found. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your environment variables."
        );
      }

      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (saJson) {
        // Parse service account JSON string
        let creds;
        try {
          creds = typeof saJson === 'string' ? JSON.parse(saJson) : saJson;
        } catch (parseError) {
          throw new Error(
            "FIREBASE_SERVICE_ACCOUNT is not valid JSON. " +
            "Please ensure it contains the full service account JSON as a string."
          );
        }

        // Validate required fields
        if (!creds.private_key || !creds.client_email) {
          throw new Error(
            "FIREBASE_SERVICE_ACCOUNT JSON is missing required fields (private_key or client_email). " +
            "Please download a new service account key from Firebase Console."
          );
        }

        admin.initializeApp({
          credential: admin.credential.cert(creds),
          projectId: projectId
        });
        initialized = true;
      } else {
        // On Vercel/cloud platforms, we MUST have service account credentials
        if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
          throw new Error(
            "FIREBASE_SERVICE_ACCOUNT environment variable is required for Vercel deployment.\n\n" +
            "To fix this:\n" +
            "1. Go to Firebase Console → Project Settings → Service Accounts\n" +
            "2. Click 'Generate New Private Key'\n" +
            "3. Copy the entire JSON content\n" +
            "4. In Vercel Dashboard → Project Settings → Environment Variables\n" +
            "5. Add FIREBASE_SERVICE_ACCOUNT and paste the JSON as the value\n" +
            "6. Redeploy your application"
          );
        }
        
        // For local development, try Application Default Credentials
        // But warn if not available
        try {
          admin.initializeApp({
            projectId: projectId
          });
          console.warn(
            "⚠️ Firebase Admin initialized without explicit credentials. " +
            "This may not work in production. Set FIREBASE_SERVICE_ACCOUNT for best results."
          );
        } catch (adcError: any) {
          throw new Error(
            "Firebase Admin credentials not found.\n\n" +
            "For local development:\n" +
            "1. Download service account key from Firebase Console\n" +
            "2. Set FIREBASE_SERVICE_ACCOUNT environment variable with the JSON content\n\n" +
            "For Vercel deployment:\n" +
            "1. Add FIREBASE_SERVICE_ACCOUNT to Vercel environment variables\n" +
            "2. Paste the entire service account JSON as the value\n\n" +
            "Original error: " + (adcError?.message || "Unknown error")
          );
        }
        initialized = true;
      }
    } catch (e: any) {
      // If app already exists, that's okay - just return it
      if (e?.code === 'app/already-exists' || e?.message?.includes('already exists')) {
        initialized = true;
        return admin.app();
      }
      // Re-throw other errors with helpful context
      const errorMessage = e?.message || String(e);
      throw new Error(
        `Firebase Admin initialization failed: ${errorMessage}\n\n` +
        "This usually means:\n" +
        "1. FIREBASE_SERVICE_ACCOUNT is not set (required for Vercel)\n" +
        "2. FIREBASE_SERVICE_ACCOUNT contains invalid JSON\n" +
        "3. Service account JSON is missing required fields\n\n" +
        "See: https://firebase.google.com/docs/admin/setup#initialize-sdk"
      );
    }
  }
  return admin.app();
}

export function getAuthAdmin() {
  return getAdminApp().auth();
}

export function getFirestoreAdmin() {
  return admin.firestore(getAdminApp());
}


