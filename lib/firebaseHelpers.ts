/**
 * Helper functions for Firebase operations with error handling
 */

export function handleFirebaseError(error: any): { status: number; message: string } {
  // Check for Firebase credential errors
  if (
    error?.message?.includes("Could not load the default credentials") ||
    error?.message?.includes("FIREBASE_SERVICE_ACCOUNT") ||
    error?.code === "app/no-app"
  ) {
    return {
      status: 500,
      message: "Firebase Admin credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT environment variable. See: https://console.firebase.google.com/project/health-connect-d256d/settings/serviceaccounts/adminsdk"
    };
  }

  // Check for permission errors
  if (error?.code === "permission-denied" || error?.code === 7) {
    return {
      status: 403,
      message: "Permission denied. Check Firebase security rules."
    };
  }

  // Check for not found errors
  if (error?.code === "not-found" || error?.code === 5) {
    return {
      status: 404,
      message: error.message || "Resource not found"
    };
  }

  // Generic Firebase error
  if (error?.code?.startsWith("firebase/") || error?.code?.startsWith("functions/")) {
    return {
      status: 500,
      message: `Firebase error: ${error.message || "Unknown error"}`
    };
  }

  // Default error
  return {
    status: 500,
    message: error?.message || "Internal server error"
  };
}

