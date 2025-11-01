# 🔧 Environment Variables Setup - Quick Fix

## Current Issue
Your `.env.local` file exists but is missing the required Firebase configuration variables.

## Quick Fix Steps

### 1. Open `.env.local` in your project root

### 2. Add these required variables:

```env
# Firebase Configuration - REQUIRED
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=health-connect-d256d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=health-connect-d256d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=health-connect-d256d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID_HERE
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID_HERE

# Admin Secret - REQUIRED
ADMIN_API_SECRET=YOUR_RANDOM_SECRET_HERE
```

### 3. Get Your Firebase Values

**Go to Firebase Console:**
1. Visit: https://console.firebase.google.com/project/health-connect-d256d/settings/general
2. Scroll to "Your apps" section
3. Click on your web app (or create one if it doesn't exist)
4. You'll see a config object - copy these values:

```
apiKey: "AIza..." → NEXT_PUBLIC_FIREBASE_API_KEY
authDomain: "..." → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
projectId: "..." → NEXT_PUBLIC_FIREBASE_PROJECT_ID
storageBucket: "..." → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
messagingSenderId: "..." → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
appId: "..." → NEXT_PUBLIC_FIREBASE_APP_ID
```

### 4. Generate Admin Secret

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 5. Save `.env.local` and Restart Server

**Important:** After saving, restart your development server:
1. Stop server (Ctrl+C)
2. Run: `npm run dev`

## ✅ Expected Result

After restart, your app should load without the Firebase configuration error.

## Example `.env.local` File

Here's what a complete file should look like:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnop
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=health-connect-d256d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=health-connect-d256d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=health-connect-d256d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
ADMIN_API_SECRET=aB3xY9mN2pQ7sT5vW8zA1cD4fG6hJ0kL
```

⚠️ **Note:** Replace the example values above with your actual Firebase values!

## Still Having Issues?

Check:
- ✅ File is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- ✅ File is in project root (same folder as `package.json`)
- ✅ All variables start with `NEXT_PUBLIC_` prefix
- ✅ No quotes around values (e.g., use `value` not `"value"`)
- ✅ Server was restarted after saving the file

