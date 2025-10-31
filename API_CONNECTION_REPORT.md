# API Endpoints Connection Report

## Summary
Not all API endpoints in the `app/api` folder are connected to the frontend. Here's the detailed breakdown:

## ✅ Connected to Frontend

### 1. `/api/admin/setDoctor`
- **File:** `app/api/admin/setDoctor/route.ts`
- **Used in:** `app/admin/super/page.tsx` (line 17)
- **Status:** ✅ Connected
- **Purpose:** Sets doctor role for users (admin function)

### 2. `/api/doctor/connect`
- **File:** `app/api/doctor/connect/route.ts`
- **Used in:** `app/admin/doctor/page.tsx` (line 49)
- **Status:** ✅ Connected
- **Purpose:** Connects doctor to patient using share code

### 3. `/api/emergency/location`
- **File:** `app/api/emergency/location/route.ts`
- **Used in:** `components/EmergencyNavButton.tsx` (line 93)
- **Status:** ✅ Connected
- **Purpose:** Handles emergency location updates and notifications

### 4. `/api/proxy/rxnav/[...path]`
- **File:** `app/api/proxy/rxnav/[...path]/route.ts`
- **Used in:** `components/InteractionChecker.tsx` (lines 8, 19)
- **Status:** ✅ Connected
- **Purpose:** Proxies RxNav API calls for drug interaction checking

### 5. `/api/notifications/fcm`
- **File:** `app/api/notifications/fcm/route.ts`
- **Used in:** Called internally by other APIs
  - `app/api/emergency/location/route.ts` (line 278)
  - `app/api/reminders/monitor/route.ts` (lines 98, 191)
  - `app/api/notifications/fcm/route.ts` (line 145 - self-referencing for caregivers)
- **Status:** ✅ Connected (indirectly)
- **Purpose:** Sends FCM push notifications

## ❌ NOT Connected to Frontend

### 1. `/api/notifications/register-token`
- **File:** `app/api/notifications/register-token/route.ts`
- **Status:** ❌ **NOT CONNECTED**
- **Issue:** No frontend code calls this endpoint
- **Purpose:** Registers/unregisters FCM tokens for push notifications
- **Action Required:** 
  - Add FCM token registration in your frontend (e.g., in `lib/auth.ts` or a notification service)
  - Should be called when user grants notification permission
  - Example: When initializing Firebase messaging, register the token

### 2. `/api/prescription/ocr`
- **File:** `app/api/prescription/ocr/route.ts`
- **Status:** ❌ **NOT CONNECTED**
- **Issue:** `components/UploadSection.tsx` uses client-side Tesseract.js instead of the API
- **Purpose:** Server-side OCR processing with Google Vision API
- **Action Required:**
  - Either:
    1. Modify `UploadSection.tsx` to upload images to Firebase Storage and call `/api/prescription/ocr`
    2. Or remove the API endpoint if you prefer client-side OCR only

### 3. `/api/reminders/monitor`
- **File:** `app/api/reminders/monitor/route.ts`
- **Status:** ⚠️ **DESIGNED FOR CRON, NOT FRONTEND**
- **Note:** This endpoint is intended to be called by a cron job (every minute), not directly by frontend
- **Action Required:**
  - Set up a cron job to call this endpoint periodically
  - Can use Vercel Cron Jobs, external cron service (cron-job.org), or a scheduled function

## Recommendations

### High Priority
1. **Connect `/api/notifications/register-token`** - Required for push notifications to work
   - Add FCM token registration in your authentication flow
   - Register token when user logs in or grants notification permission

2. **Decide on `/api/prescription/ocr`** 
   - If you want server-side OCR (better accuracy), connect it to frontend
   - If you prefer client-side (current Tesseract.js), you can keep it as-is

### Medium Priority
3. **Set up cron job for `/api/reminders/monitor`**
   - This is critical for reminder monitoring to work
   - Consider using Vercel Cron Jobs or an external service

## Files That Need Updates

1. **Add FCM token registration:**
   - `lib/auth.ts` or create `lib/notifications.ts`
   - Call `/api/notifications/register-token` when FCM token is obtained

2. **Update prescription upload (optional):**
   - `components/UploadSection.tsx` - Add option to use server-side OCR API
   - Upload to Firebase Storage first, then call `/api/prescription/ocr`

3. **Set up cron job:**
   - Create `vercel.json` with cron configuration, OR
   - Use external service to call `/api/reminders/monitor` every minute

