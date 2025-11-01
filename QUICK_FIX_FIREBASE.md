# 🔧 Quick Fix: Firebase Configuration Error

## The Error
```
Firebase configuration is missing. Please add the following environment variables:
NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ...
```

## ✅ Solution

### Step 1: Create `.env.local` file

A `.env.local` file has been created in your project root with template values.

### Step 2: Get Your Firebase Values

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/health-connect-d256d/settings/general
   ```

2. **Find Your Web App:**
   - Scroll down to "Your apps" section
   - If you don't have a web app, click "Add app" → Select Web (</>)
   - If you have a web app, click on it

3. **Copy Configuration Values:**
   - You'll see a Firebase config object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "health-connect-d256d.firebaseapp.com",
     projectId: "health-connect-d256d",
     storageBucket: "health-connect-d256d.appspot.com",
     messagingSenderId: "581962389987",
     appId: "1:581962389987:web:27d6e37acfe457d136e8d6"
   };
   ```

4. **Update `.env.local`:**
   - Open `.env.local` in your project root
   - Replace the placeholder values with your actual Firebase values:
   
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...          # From apiKey
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=health-connect-d256d.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=health-connect-d256d
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=health-connect-d256d.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=581962389987
   NEXT_PUBLIC_FIREBASE_APP_ID=1:581962389987:web:27d6e37acfe457d136e8d6
   ```

### Step 3: Generate Admin Secret

You can use the default value in `.env.local` or generate a new one:

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Mac/Linux:**
```bash
openssl rand -hex 32
```

### Step 4: Restart Your Development Server

**⚠️ IMPORTANT:** Environment variables are only loaded when the server starts!

1. **Stop your server:** Press `Ctrl+C` in the terminal
2. **Start it again:** Run `npm run dev`

### Step 5: Verify It Works

After restarting, the error should be gone and your app should load successfully.

## ✅ Checklist

- [ ] `.env.local` file exists in project root
- [ ] All `NEXT_PUBLIC_FIREBASE_*` variables are filled with actual values
- [ ] `ADMIN_API_SECRET` has a random value (32+ characters)
- [ ] No quotes around values (use `value` not `"value"`)
- [ ] Server was restarted after updating `.env.local`

## 🔍 Troubleshooting

### Error still appears after restart?
- ✅ Check file name is exactly `.env.local` (not `.env` or `.env.local.txt`)
- ✅ Check file is in project root (same folder as `package.json`)
- ✅ Check there are no extra spaces around the `=` sign
- ✅ Check values don't have quotes (remove any `"` or `'` around values)
- ✅ Try deleting `.next` folder and restart: `rm -rf .next && npm run dev`

### Can't find Firebase values?
- If you don't have a web app in Firebase:
  1. Go to Firebase Console → Project Settings
  2. Scroll to "Your apps" section
  3. Click "Add app" → Select Web (</>)
  4. Copy the config values shown

### Still having issues?
- Check the console for specific missing variables
- Verify you're using the correct Firebase project
- Make sure you copied the values correctly (no extra spaces)

## 📝 Example `.env.local` (Complete)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnop
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=health-connect-d256d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=health-connect-d256d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=health-connect-d256d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=581962389987
NEXT_PUBLIC_FIREBASE_APP_ID=1:581962389987:web:27d6e37acfe457d136e8d6
ADMIN_API_SECRET=3cf09bf9961e5e21daa7e07cbbda211ced13a24366253dba40f1fcc9cc0f0f89
PYTHON_MEDICINE_API_URL=http://localhost:5000
```

**Note:** Replace with your actual Firebase values from the console!


