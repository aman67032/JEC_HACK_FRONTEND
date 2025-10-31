import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let app: FirebaseApp;

function validateFirebaseConfig() {
  const requiredVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const envVarMap: Record<string, string> = {
      apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
      authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      appId: 'NEXT_PUBLIC_FIREBASE_APP_ID'
    };
    const missingVars = missing.map(key => envVarMap[key] || key).join(', ');
    throw new Error(
      `Firebase configuration is missing. Please add the following environment variables to your .env.local file:\n${missingVars}\n\n` +
      `See FIREBASE_SETUP_GUIDE.md for instructions on how to get these values from Firebase Console.`
    );
  }

  return requiredVars as {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    const config = validateFirebaseConfig();
    app = initializeApp(config);
  }
  return app as FirebaseApp;
}

export const firebaseAuth = () => getAuth(getFirebaseApp());
export const firestoreDb = () => getFirestore(getFirebaseApp());
export const firebaseStorage = () => getStorage(getFirebaseApp());


