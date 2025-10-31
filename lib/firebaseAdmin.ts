import * as admin from "firebase-admin";

let initialized = false;

export function getAdminApp() {
  if (!initialized) {
    try {
      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (saJson) {
        const creds = JSON.parse(saJson);
        admin.initializeApp({
          credential: admin.credential.cert(creds)
        });
      } else {
        admin.initializeApp(); // ADC
      }
      initialized = true;
    } catch (e) {
      // Re-throw to surface config issues at runtime
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


