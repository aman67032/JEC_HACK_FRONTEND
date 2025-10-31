# GitHub Secrets Checklist - Copy from .env.local

## ✅ Required Secrets (Must Add)

These are **REQUIRED** for your app to build and run. Copy these **exact values** from your `.env.local` file:

| GitHub Secret Name | Copy from .env.local | Example Value |
|-------------------|---------------------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Same name in `.env.local` | `AIzaSyD6Q8kqJyB8RroIi5ags3WqzvkkhQSVk1k` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same name in `.env.local` | `health-connect-d256d.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same name in `.env.local` | `health-connect-d256d` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same name in `.env.local` | `health-connect-d256d.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same name in `.env.local` | `581962389987` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same name in `.env.local` | `1:581962389987:web:27d6e37acfe457d136e8d6` |
| `ADMIN_API_SECRET` | Same name in `.env.local` | `your-secret-string-here` |

## ✅ Required for Deployment

| GitHub Secret Name | How to Get | Notes |
|-------------------|------------|-------|
| `FIREBASE_TOKEN` | Run `firebase login:ci` in terminal | **Not** from `.env.local` - generate this separately |

## ⚠️ Optional Secrets (Only if in your .env.local)

These are **OPTIONAL** - only add them if you have them in your `.env.local`:

| GitHub Secret Name | Copy from .env.local | When Needed |
|-------------------|---------------------|--------------|
| `FIREBASE_SERVICE_ACCOUNT` | Same name in `.env.local` | Only if using Firebase Admin SDK with service account |
| `API_ALLOWED_ORIGINS` | Same name in `.env.local` | Only if you set CORS restrictions for API proxy |

---

## 📋 Quick Steps

1. **Open your `.env.local` file** (in your local project folder)

2. **Go to GitHub** → Your Repository → **Settings** → **Secrets and variables** → **Actions**

3. **For each variable above**, click **New repository secret**:
   - **Name**: Use the exact name from the table (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: Copy the value from your `.env.local` file

4. **Get Firebase Token** (this is different - not from `.env.local`):
   ```bash
   firebase login:ci
   ```
   Copy the token and add it as `FIREBASE_TOKEN` secret

---

## 🔍 How to Find Values in .env.local

Your `.env.local` file should look something like this:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD6Q8kqJyB8RroIi5ags3WqzvkkhQSVk1k
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=health-connect-d256d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=health-connect-d256d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=health-connect-d256d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=581962389987
NEXT_PUBLIC_FIREBASE_APP_ID=1:581962389987:web:27d6e37acfe457d136e8d6
ADMIN_API_SECRET=your-secret-here
```

**Copy the value after the `=` sign** for each variable above.

---

## ✅ Verification Checklist

Before pushing to GitHub, verify:

- [ ] All 7 required Firebase variables added to GitHub Secrets
- [ ] `ADMIN_API_SECRET` added to GitHub Secrets
- [ ] `FIREBASE_TOKEN` generated and added (run `firebase login:ci`)
- [ ] All secret names match exactly (case-sensitive!)
- [ ] Values copied correctly (no extra spaces, quotes, etc.)

---

## ⚠️ Important Notes

1. **Never commit `.env.local`** - it contains sensitive data
2. **Copy values exactly** - don't add quotes or spaces
3. **Secret names must match exactly** - GitHub Secrets are case-sensitive
4. **FIREBASE_TOKEN is different** - this is generated separately, not from `.env.local`

---

## 🚨 Common Mistakes

❌ **Don't** add quotes around values in GitHub Secrets  
❌ **Don't** include the `=` sign from `.env.local`  
❌ **Don't** add extra spaces  
❌ **Don't** use different variable names  
✅ **Do** copy the exact value after the `=` sign  
✅ **Do** use the exact variable name from the table above

