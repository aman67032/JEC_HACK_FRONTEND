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
        throw new Error("Firebase Project ID not found. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your environment variables.");
      }

      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (saJson) {
        const creds = JSON.parse(saJson);
        admin.initializeApp({
          credential: admin.credential.cert(creds),
          projectId: projectId
        });
      } else {
        // Use Application Default Credentials (ADC) with explicit project ID
        admin.initializeApp({
          projectId: projectId
        });
      }
      initialized = true;
    } catch (e: any) {
      // If app already exists, that's okay - just return it
      if (e?.code === 'app/already-exists' || e?.message?.includes('already exists')) {
        initialized = true;
        return admin.app();
      }
      // Re-throw other errors
      throw e;
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


