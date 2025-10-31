# Vercel Deployment Guide

This guide will help you deploy Health Connect to Vercel and fix the "Application error: a client-side exception has occurred" error.

## 🚨 Common Issue: Missing Environment Variables

The most common cause of the client-side error on Vercel is **missing Firebase environment variables**. These must be added to Vercel's project settings.

---

## Step 1: Get Your Firebase Configuration Values

1. Go to Firebase Console: https://console.firebase.google.com/project/health-connect-d256d/settings/general
2. Scroll down to **"Your apps"** section
3. If you don't have a web app, click **"Add app"** → Web (</> icon)
4. Copy the config values from the Firebase SDK snippet:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD6Q8kqJyB8RroIi5ags3WqzvkkhQSVk1k",
  authDomain: "health-connect-d256d.firebaseapp.com",
  projectId: "health-connect-d256d",
  storageBucket: "health-connect-d256d.firebasestorage.app",
  messagingSenderId: "581962389987",
  appId: "1:581962389987:web:27d6e37acfe457d136e8d6",
  measurementId: "G-LT1YK8MYCL"
};
```

---

## Step 2: Add Environment Variables to Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (`jec-hack-frontend`)
3. Click on **Settings** (in the top navigation)
4. Click on **Environment Variables** (in the left sidebar)
5. Add each of the following variables:

### Required Firebase Environment Variables:

| Variable Name | Value (from firebaseConfig above) |
|--------------|-----------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD6Q8kqJyB8RroIi5ags3WqzvkkhQSVk1k` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `health-connect-d256d.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `health-connect-d256d` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `health-connect-d256d.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `581962389987` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:581962389987:web:27d6e37acfe457d136e8d6` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-LT1YK8MYCL` (optional, for analytics) |

### Optional (but recommended) Environment Variables:

| Variable Name | Description | How to Get |
|--------------|-------------|------------|
| `ADMIN_API_SECRET` | Secret for admin API routes | Generate a random 32-character string |
| `API_ALLOWED_ORIGINS` | Allowed origins for API proxy | `https://jec-hack-frontend.vercel.app,https://yourdomain.com` |

---

## Step 3: Set Environment Scope

For each environment variable:
1. When adding, select **all environments**:
   - ☑ Production
   - ☑ Preview
   - ☑ Development

Or you can set different values for each environment if needed.

---

## Step 4: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** (three dots) menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a fresh deployment

---

## Step 5: Configure Firebase Authorized Domains

After deployment, add your Vercel domain to Firebase:

1. Go to: https://console.firebase.google.com/project/health-connect-d256d/authentication/settings
2. Scroll down to **"Authorized domains"**
3. Click **"Add domain"**
4. Add:
   - `jec-hack-frontend.vercel.app`
   - Any custom domains you're using
5. Click **"Add"**

**This is especially important if you're using Google Sign-In!**

---

## Step 6: Verify Deployment

After redeploying:

1. Visit: https://jec-hack-frontend.vercel.app
2. Open browser console (F12 → Console tab)
3. Check for any errors
4. The app should load without the "client-side exception" error

---

## Troubleshooting

### Error: "Firebase configuration is missing"

**Solution:** Double-check that all `NEXT_PUBLIC_FIREBASE_*` variables are added to Vercel's environment variables.

### Error: "auth/configuration-not-found"

**Solution:** 
1. Verify your Firebase project ID matches in both Vercel env vars and Firebase Console
2. Check that `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` includes the correct domain

### Google Sign-In not working

**Solution:**
1. Ensure your Vercel domain is added to Firebase Authorized Domains
2. Check OAuth redirect URIs in Google Cloud Console

### Still seeing errors?

1. Check Vercel deployment logs:
   - Go to Deployments → Click on a deployment → View build logs
2. Check browser console:
   - F12 → Console tab → Look for specific error messages
3. Verify environment variables are correct:
   - Settings → Environment Variables → Verify all values match Firebase config

---

## Quick Checklist

- [ ] All 7 `NEXT_PUBLIC_FIREBASE_*` variables added to Vercel
- [ ] All variables set for Production, Preview, and Development
- [ ] Vercel domain added to Firebase Authorized Domains
- [ ] Project redeployed after adding variables
- [ ] Browser console shows no Firebase errors
- [ ] Login page loads correctly
- [ ] Google Sign-In works (if enabled)

---

## Need Help?

If you're still experiencing issues:
1. Share the specific error message from browser console
2. Check Vercel deployment logs for build-time errors
3. Verify all environment variable names are exactly correct (case-sensitive!)

