# GitHub to Firebase Auto-Deployment Setup Guide

This guide will help you set up automatic deployment to Firebase Hosting whenever you push changes to GitHub.

## 🚀 Quick Setup Steps

### Step 1: Get Your Firebase Token

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login:ci
   ```
   This will:
   - Open your browser
   - Ask you to authenticate with your Google account
   - Generate a CI token
   - Display the token in your terminal

3. **Copy the token** - You'll need it for Step 2.

---

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

2. Click on **Settings** (top navigation)

3. Click on **Secrets and variables** → **Actions** (left sidebar)

4. Click **New repository secret** and add each of the following:

#### Required Secrets:

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `FIREBASE_TOKEN` | Your Firebase CI token | From Step 1 above (run `firebase login:ci`) |

#### Firebase Environment Variables (for build):

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD6Q8kqJyB8RroIi5ags3WqzvkkhQSVk1k` | From Firebase Console → Project Settings → Your apps → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `health-connect-d256d.firebaseapp.com` | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `health-connect-d256d` | Same as above |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `health-connect-d256d.firebasestorage.app` | Same as above |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `581962389987` | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:581962389987:web:27d6e37acfe457d136e8d6` | Same as above |
| `ADMIN_API_SECRET` | Your admin secret | Generate or use existing from `.env.local` |

**Note:** To get Firebase config values:
1. Go to: https://console.firebase.google.com/project/health-connect-d256d/settings/general
2. Scroll to "Your apps" section
3. Copy values from the Firebase SDK snippet

---

### Step 3: Verify Your Branch Name

The workflow is set to trigger on pushes to:
- `main` branch (default for new repos)
- `master` branch (older repos)

If your default branch has a different name, edit `.github/workflows/firebase-deploy.yml` and update the `branches` section.

---

### Step 4: Test the Deployment

1. **Make a small change** to your code (e.g., update a comment)

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Test auto-deployment"
   git push origin main  # or master
   ```

3. **Check GitHub Actions**:
   - Go to your repo on GitHub
   - Click on **Actions** tab
   - You should see a workflow run called "Deploy to Firebase Hosting"
   - Click on it to see the progress

4. **Wait for completion** (usually 2-3 minutes)

5. **Verify deployment**:
   - Visit: https://health-connect-d256d.web.app/
   - Your changes should be live!

---

## 📋 Manual Deployment Trigger

You can also manually trigger a deployment:

1. Go to **Actions** tab in GitHub
2. Click on **Deploy to Firebase Hosting** workflow
3. Click **Run workflow** button (right side)
4. Select branch and click **Run workflow**

---

## 🔧 Troubleshooting

### Error: "Firebase authentication failed"

**Solution:**
1. Your `FIREBASE_TOKEN` might have expired
2. Generate a new token: `firebase login:ci`
3. Update the secret in GitHub: Settings → Secrets → FIREBASE_TOKEN → Update

### Error: "Environment variables missing"

**Solution:**
1. Verify all `NEXT_PUBLIC_FIREBASE_*` secrets are added in GitHub
2. Double-check secret names match exactly (case-sensitive!)
3. Make sure they're set for all environments (if applicable)

### Error: "Build failed"

**Solution:**
1. Check the build logs in GitHub Actions
2. Ensure your code builds locally: `npm run build`
3. Verify all dependencies are in `package.json`

### Changes not appearing on site

**Solution:**
1. Check GitHub Actions - did the workflow complete successfully?
2. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Firebase Hosting logs: https://console.firebase.google.com/project/health-connect-d256d/hosting
4. Verify the correct branch is being deployed

### Workflow not triggering

**Solution:**
1. Verify you're pushing to `main` or `master` branch
2. Check workflow file exists: `.github/workflows/firebase-deploy.yml`
3. Ensure workflow file has correct YAML syntax (no errors in GitHub Actions)

---

## 📝 Environment Variables Reference

Your build process needs these environment variables. They're set as GitHub Secrets and passed to the build:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ADMIN_API_SECRET` (optional, but recommended)

---

## ✅ Checklist

Before your first deployment:

- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase token generated (`firebase login:ci`)
- [ ] `FIREBASE_TOKEN` added to GitHub Secrets
- [ ] All `NEXT_PUBLIC_FIREBASE_*` secrets added to GitHub
- [ ] `ADMIN_API_SECRET` added to GitHub Secrets
- [ ] Code pushed to `main` or `master` branch
- [ ] Workflow file exists (`.github/workflows/firebase-deploy.yml`)
- [ ] Tested build locally (`npm run build`)

---

## 🔐 Security Notes

- **Never commit secrets** to your repository
- **Never share your Firebase token** publicly
- Tokens expire after 1 year - regenerate as needed
- Use GitHub Secrets for all sensitive values
- Review who has access to your GitHub repository

---

## 📚 Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)

---

## Need Help?

If you encounter issues:

1. Check the GitHub Actions logs for specific error messages
2. Verify all secrets are correctly set
3. Test building locally first: `npm run build`
4. Ensure Firebase project permissions are correct

