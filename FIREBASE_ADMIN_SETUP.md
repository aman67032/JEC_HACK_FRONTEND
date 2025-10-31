# Firebase Admin SDK Setup Guide

## Problem
If you're seeing this error:
```
Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started
```

This means Firebase Admin SDK cannot find valid credentials to authenticate with Firebase.

## Solution: Add Service Account Credentials

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the ⚙️ Settings icon → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** in the confirmation dialog
7. A JSON file will download (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

### Step 2: Add to Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Open the downloaded JSON file, copy ALL the content, and paste it here
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your application

### Step 3: For Local Development

Create or update your `.env.local` file:

```env
# Firebase Public Config (already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (NEW - Required)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important:** 
- Copy the ENTIRE JSON file content (including all curly braces, quotes, etc.)
- Keep it as a single line or escape newlines properly
- Do NOT share this file publicly - it contains sensitive credentials!

### Step 4: Verify Setup

After adding the environment variable:

1. **Redeploy on Vercel:**
   - Go to **Deployments** tab
   - Click the **⋯** menu on latest deployment
   - Click **Redeploy**

2. **Test locally:**
   ```bash
   npm run dev
   ```
   - Check console for any Firebase Admin errors
   - Try accessing an API route that uses Admin SDK

## Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT is not valid JSON"
- Make sure you copied the ENTIRE JSON file content
- Check for any missing quotes or brackets
- In Vercel, the value should be one continuous string

### Error: "missing required fields (private_key or client_email)"
- The JSON you pasted might be incomplete
- Re-download the service account key from Firebase Console
- Make sure you copied the entire file, not just part of it

### Error persists after adding environment variable
- Make sure you **redeployed** after adding the variable
- Check that the variable is set for the correct environment (Production/Preview/Development)
- Verify the JSON is valid by testing it in a JSON validator

### Local development works but Vercel fails
- Vercel requires the environment variable to be set
- Make sure `FIREBASE_SERVICE_ACCOUNT` is added in Vercel Dashboard
- Select all environments (Production, Preview, Development) when adding

## Security Notes

⚠️ **IMPORTANT:**
- Never commit the service account JSON file to Git
- Never expose `FIREBASE_SERVICE_ACCOUNT` in client-side code
- Only use it in server-side code (API routes)
- If credentials are compromised, revoke them immediately in Firebase Console

## Alternative: Environment File (Advanced)

For local development, you can also use a file path:

```env
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
```

But this only works locally. For Vercel, you MUST use the `FIREBASE_SERVICE_ACCOUNT` environment variable.

