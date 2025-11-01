# Baymax Chatbot Setup Guide

## Overview

The Baymax chatbot has been successfully integrated into your Health Connect application. It replaces the previous Groq API implementation with a Firebase-native solution using Google Gemini API (with intelligent fallback).

## What's Been Added

### 1. Chatbot Component (`components/chatbot/ChatBot.tsx`)
- Floating chat widget with toggle button
- Real-time message interface
- Firebase Auth integration
- Conversation persistence in Firestore

### 2. API Routes (Replacing FastAPI endpoints)
- `app/api/chat/route.ts` - Main chat endpoint with Gemini AI
- `app/api/medicines/route.ts` - CRUD operations for medicines
- `app/api/medicines/[medId]/route.ts` - Update/Delete specific medicines
- `app/api/upload_prescription/route.ts` - Prescription file uploads
- `app/api/sos/route.ts` - Emergency SOS trigger
- `app/api/generate_medcard/route.ts` - Generate medical card QR
- `app/api/medcard/[token]/route.ts` - Retrieve medical card by token

### 3. Updated Files
- `app/dashboard/page.tsx` - Added ChatBot component
- `lib/firebaseAdmin.ts` - Added `getStorageBucket()` helper

## Quick Start

### 1. Environment Variables

Add to your `.env.local`:

```env
# Google Gemini API (optional - fallback responses available)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase credentials (should already be set)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 2. Get Gemini API Key (Optional)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in and create a new API key
3. Copy the key to `GEMINI_API_KEY` in your `.env.local`

**Note**: The chatbot works without Gemini API key using intelligent rule-based responses, but Gemini provides better conversational AI.

### 3. Firebase Firestore Rules

Ensure your Firestore rules allow conversations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
      // Or allow anonymous for development:
      // allow read, write: if true;
    }
    
    match /users/{userId}/medicines/{medicineId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /medcards/{token} {
      allow read: if true; // Public read for QR codes
      allow write: if request.auth != null;
    }
  }
}
```

## Testing

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the dashboard (`/dashboard`)

3. Click the chat icon in the bottom-right corner

4. Try asking:
   - "How do I add a medicine?"
   - "Tell me about emergency features"
   - "How do I scan a prescription?"

## API Differences from FastAPI Version

### Previous (FastAPI)
- Endpoint: `http://localhost:8000/chat/`
- Auth: Custom header verification
- LLM: Groq API

### Current (Next.js)
- Endpoint: `/api/chat` (relative to your domain)
- Auth: Firebase ID tokens automatically verified
- LLM: Google Gemini API (with rule-based fallback)

### Benefits
- ✅ No separate server needed - everything in Next.js
- ✅ Better integration with Firebase
- ✅ Automatic deployment with your frontend
- ✅ Works with Vercel/Netlify out of the box
- ✅ Free tier Gemini API (better than Groq for some use cases)

## Troubleshooting

### Chat widget not appearing
- Check browser console for errors
- Verify Firebase is initialized correctly
- Ensure you're on a page that imports ChatBot

### "Failed to get response" error
- Check network tab for API call details
- Verify `/api/chat` route is accessible
- Check Firebase Admin is properly configured

### AI responses not working
- Verify `GEMINI_API_KEY` is set (if using Gemini)
- Check API quota in Google AI Studio
- Rule-based fallback should work without API key

### Firestore permission errors
- Update Firestore security rules (see above)
- Check that user is authenticated
- Verify service account has proper permissions

## Next Steps

1. **Customize System Prompt**: Edit the system message in `app/api/chat/route.ts` to change Baymax's personality
2. **Add More Features**: Extend the chatbot to handle specific Health Connect workflows
3. **Analytics**: Add conversation analytics to track common questions
4. **Multi-language**: Add support for multiple languages using Gemini's translation capabilities

## Deployment

The chatbot works automatically with:
- ✅ Vercel
- ✅ Netlify  
- ✅ Any Next.js hosting platform

Make sure to:
1. Set environment variables in your hosting platform
2. Deploy Firestore security rules
3. Test the chat after deployment

## Support

For issues or questions:
- Check `components/chatbot/README.md` for detailed documentation
- Review Firebase console for Firestore/storage errors
- Check Vercel/Netlify logs for API route errors

