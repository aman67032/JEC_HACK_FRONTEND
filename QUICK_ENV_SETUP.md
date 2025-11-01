# Quick Environment Variables Setup

## ⚠️ Firebase Configuration Missing

Your app needs Firebase environment variables to run. Follow these steps:

## Step 1: Get Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/project/health-connect-d256d/settings/general)
2. Scroll down to the **"Your apps"** section
3. If you don't have a web app yet:
   - Click **"Add app"** → Select **Web** (</> icon)
   - Register your app with a nickname (e.g., "HealthConnect Web")
   - Click **"Register app"**
4. You'll see a Firebase SDK configuration snippet that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "health-connect-d256d.firebaseapp.com",
     projectId: "health-connect-d256d",
     storageBucket: "health-connect-d256d.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```

## Step 2: Create `.env.local` File

1. In your project root directory, create a new file named `.env.local`
2. Copy the template below and fill in your Firebase values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=health-connect-d256d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=health-connect-d256d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=health-connect-d256d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id-here
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-here

# Admin API Secret (generate a random string)
ADMIN_API_SECRET=your-strong-random-secret-here

# Firebase Service Account (optional for now, needed for server-side features)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

3. Replace the placeholder values with your actual Firebase config values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY` → Copy from `apiKey` in Firebase config
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → Copy from `authDomain`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → Copy from `projectId`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` → Copy from `storageBucket`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` → Copy from `messagingSenderId`
   - `NEXT_PUBLIC_FIREBASE_APP_ID` → Copy from `appId`

## Step 3: Generate Admin Secret

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use an online generator:**
- Visit: https://www.random.org/strings/

Copy the generated string and use it for `ADMIN_API_SECRET` in your `.env.local` file.

## Step 4: Restart Your Development Server

**Important:** Environment variables are only loaded when the server starts. After creating or updating `.env.local`, you must restart your dev server:

1. Stop your current server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## ✅ Verification

After restarting, your app should load without the Firebase configuration error. You should see:
- ✅ No errors about missing environment variables
- ✅ Firebase initialization successful
- ✅ App loads correctly

## Troubleshooting

### Still seeing the error?
1. Make sure the file is named exactly `.env.local` (not `.env`, `.env.example`, etc.)
2. Make sure the file is in the root directory (same level as `package.json`)
3. Make sure you've restarted the dev server after creating the file
4. Check that all variable names start with `NEXT_PUBLIC_` (for client-side variables)
5. Ensure there are no extra spaces or quotes around the values

### Can't find Firebase config?
- Make sure you're logged into the correct Firebase project
- Try creating a new web app if you don't see one listed
- Check that you're in the correct Firebase project: `health-connect-d256d`

## Need Help?

See the detailed guide: `FIREBASE_SETUP_GUIDE.md`


