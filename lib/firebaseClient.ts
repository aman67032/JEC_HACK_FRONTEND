import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

let app: FirebaseApp;
let analytics: Analytics | null = null;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6Q8kqJyB8RroIi5ags3WqzvkkhQSVk1k",
  authDomain: "health-connect-d256d.firebaseapp.com",
  projectId: "health-connect-d256d",
  storageBucket: "health-connect-d256d.firebasestorage.app",
  messagingSenderId: "581962389987",
  appId: "1:581962389987:web:27d6e37acfe457d136e8d6",
  measurementId: "G-LT1YK8MYCL"
};

function getFirebaseConfig() {
  // Use environment variables if available, otherwise fallback to direct config
  if (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId
    };
  }
  
  // Fallback to direct config
  return firebaseConfig;
}

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    const config = getFirebaseConfig();
    app = initializeApp(config);
    
    // Initialize Analytics (only in browser environment)
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {
        // Analytics not supported or failed to initialize
        console.log("Firebase Analytics not available");
      });
    }
  }
  return app as FirebaseApp;
}

export const firebaseAuth = () => getAuth(getFirebaseApp());
export const firestoreDb = () => getFirestore(getFirebaseApp());
export const firebaseStorage = () => getStorage(getFirebaseApp());
export const getAnalyticsInstance = () => analytics;


