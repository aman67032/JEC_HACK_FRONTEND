# Baymax Chatbot Component

The Baymax chatbot is a Health Connect Assistant that helps users navigate the dashboard features, manage medicines, and get health-related guidance.

## Features

- **Real-time Chat Interface**: Clean, user-friendly chat UI with message history
- **Firebase Integration**: Conversations stored in Firestore
- **AI-Powered Responses**: Uses Google Gemini API (with fallback to rule-based responses)
- **Authentication**: Supports Firebase Auth for user-specific conversations
- **Responsive Design**: Floating chat widget that works on all screen sizes

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your environment variables

**Note**: If `GEMINI_API_KEY` is not set, the chatbot will use intelligent rule-based responses as a fallback.

### 2. Firebase Firestore Structure

The chatbot automatically creates the following Firestore structure:

```
conversations/
  {conversation_id}/
    - conversation_id: string
    - messages: array of {role, content}
    - created_at: timestamp
    - updated_at: timestamp
    - active: boolean
    - user_id: string
```

### 3. Component Usage

The chatbot is already integrated into the dashboard. To add it to another page:

```tsx
import ChatBot from "@/components/chatbot/ChatBot";

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <ChatBot />
    </div>
  );
}
```

## API Endpoints

The chatbot uses the following API endpoints:

- `POST /api/chat` - Send a message and get AI response
- `GET /api/medicines` - List user's medicines
- `POST /api/medicines` - Add a new medicine
- `PATCH /api/medicines/[medId]` - Update a medicine
- `DELETE /api/medicines/[medId]` - Delete a medicine
- `POST /api/upload_prescription` - Upload prescription file
- `POST /api/sos` - Trigger emergency SOS
- `POST /api/generate_medcard` - Generate medical card QR
- `GET /api/medcard/[token]` - Retrieve medical card

## Customization

### Changing the System Prompt

Edit the system prompt in `components/chatbot/ChatBot.tsx` (line ~47) or `app/api/chat/route.ts` (line ~22).

### Styling

The component uses Tailwind CSS. Modify classes in `ChatBot.tsx` to change the appearance.

### Adding More Features

1. Add new API routes in `app/api/`
2. Update the chatbot's message handler to call new endpoints
3. Add UI elements to the chat interface as needed

## Troubleshooting

### Chat not loading
- Check Firebase configuration in `lib/firebaseClient.ts`
- Verify Firestore rules allow read/write to `conversations` collection

### AI responses not working
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota limits on Google AI Studio
- Fallback responses will work even without API key

### Authentication issues
- Ensure Firebase Auth is properly configured
- Check that users are logged in before using chat

## Security Notes

- All API routes verify Firebase ID tokens
- Conversations are stored per user ID
- Anonymous users can use chat but with limited features
- In production, require authentication for all endpoints

