# API Endpoints - Connection Complete ✅

All API endpoints in the `app/api` folder are now connected to the frontend or properly configured.

## ✅ Completed Connections

### 1. `/api/notifications/register-token` - **NOW CONNECTED** ✅
- **Implementation:** `lib/notifications.ts`
- **Integration:** `components/RequireAuth.tsx`
- **How it works:**
  - Automatically initializes when user logs in
  - Requests notification permission
  - Gets FCM token and registers it with the backend
  - Unregisters token on logout
- **Required:** 
  - Environment variable: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (get from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)

### 2. `/api/prescription/ocr` - **NOW CONNECTED** ✅
- **Implementation:** `components/UploadSection.tsx`
- **How it works:**
  - Added checkbox option to use server-side OCR (Google Vision API)
  - Defaults to server-side OCR when enabled
  - Uploads image to Firebase Storage first
  - Calls API endpoint with image URL
  - Falls back to client-side OCR if server OCR fails
- **Features:**
  - Automatically extracts medicines from prescription
  - Parses dosage and frequency information
  - Stores prescription in Firestore
  - Triggers drug interaction checking

### 3. `/api/reminders/monitor` - **CRON JOB CONFIGURED** ✅
- **Implementation:** `vercel.json`
- **Schedule:** Every minute (`*/1 * * * *`)
- **How it works:**
  - Vercel will automatically call this endpoint every minute
  - Checks for due reminders
  - Sends FCM notifications for due/missed medications
- **Note:** Vercel Cron Jobs require a Pro plan. Alternative options:
  - Use external cron service (cron-job.org, EasyCron, etc.)
  - Set up a scheduled Cloud Function in Firebase
  - Use GitHub Actions with scheduled workflows

## 📋 Setup Checklist

### Environment Variables Required

Add these to your `.env.local` and Vercel project settings:

```env
# Firebase (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase vars

# NEW: Required for FCM push notifications
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here

# Optional: For server-side OCR (Google Vision API)
GOOGLE_VISION_API_KEY=your-vision-api-key-here
```

### Firebase Storage Rules

Updated `firebase/storage.rules` to allow prescription uploads:
- Path: `prescriptions/{userId}/{filename}`
- Limit: 10MB per file
- Allowed: Images and PDFs

**Deploy updated rules:**
```bash
firebase deploy --only storage:rules
```

### Vercel Cron Job

The cron job is configured in `vercel.json` but requires:
1. Vercel Pro plan (for Cron Jobs feature)
2. Or use alternative: External cron service pointing to your deployed URL

**External Cron Service Alternative:**
1. Go to https://cron-job.org (or similar service)
2. Create new cron job:
   - URL: `https://your-domain.vercel.app/api/reminders/monitor`
   - Method: POST
   - Schedule: Every minute
   - Add authentication header if needed

## 🎯 Testing

### Test FCM Token Registration:
1. Login to the app
2. Check browser console for: "✅ FCM token registered successfully"
3. Check Firestore: `users/{userId}` should have `fcmTokens` array

### Test Server-Side OCR:
1. Go to Dashboard → Upload Section
2. Check "Use server OCR (Google Vision)" checkbox
3. Upload a prescription image
4. Should extract medicines automatically

### Test Reminder Monitor:
1. Manually call: `POST /api/reminders/monitor`
2. Check logs for processed reminders
3. Ensure cron job is running (Vercel Dashboard → Cron Jobs)

## 📝 Files Modified

1. ✅ `lib/notifications.ts` - NEW: FCM token registration service
2. ✅ `components/RequireAuth.tsx` - Updated: Auto-initialize notifications on login
3. ✅ `components/UploadSection.tsx` - Updated: Added server-side OCR support
4. ✅ `firebase/storage.rules` - Updated: Added prescription upload path
5. ✅ `vercel.json` - NEW: Cron job configuration

## 🚀 Next Steps

1. **Get VAPID Key:**
   - Firebase Console → Project Settings → Cloud Messaging
   - Scroll to "Web Push certificates"
   - Generate key pair if not exists
   - Add to environment variables

2. **Test Push Notifications:**
   - Create a reminder
   - Wait for scheduled time
   - Should receive browser notification

3. **Deploy:**
   - Push changes to GitHub
   - Vercel will automatically deploy
   - Cron job will start running (if Pro plan)

## ⚠️ Important Notes

- **FCM tokens:** Only work on HTTPS or localhost
- **Notifications:** Require user permission (browser will prompt)
- **Cron jobs:** Vercel free plan doesn't support cron jobs - use external service
- **Server OCR:** Requires Google Vision API key for best results

All endpoints are now fully integrated! 🎉

