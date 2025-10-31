/**
 * Supabase client setup for Medicine Verification storage
 * 
 * To use Supabase, set these environment variables:
 * NEXT_PUBLIC_SUPABASE_URL=your-project-url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 * 
 * If not configured, verification data will be stored in Firestore instead.
 */

export interface VerificationData {
  reminderId: string;
  medicineName: string;
  photoUrl: string;
  ocrOutput: string;
  matchStatus: "match" | "mismatch";
  timestamp: string;
  scheduledTime: string;
  userId: string;
}

export async function saveVerificationToSupabase(
  data: VerificationData
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase not configured. Using Firestore instead.");
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/verifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to save to Supabase:", error);
    throw error;
  }
}

/**
 * Example Supabase table schema (SQL):
 * 
 * CREATE TABLE verifications (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   reminder_id TEXT NOT NULL,
 *   medicine_name TEXT NOT NULL,
 *   photo_url TEXT NOT NULL,
 *   ocr_output TEXT,
 *   match_status TEXT NOT NULL CHECK (match_status IN ('match', 'mismatch')),
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   scheduled_time TEXT NOT NULL,
 *   user_id TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_verifications_user_id ON verifications(user_id);
 * CREATE INDEX idx_verifications_timestamp ON verifications(timestamp);
 */

