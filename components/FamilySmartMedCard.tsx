"use client";

import { useState } from "react";
import { firebaseAuth } from "@/lib/firebaseClient";
import { QRCodeSVG } from "qrcode.react";

interface FamilySmartMedCardProps {
  patientId: string | null;
  patientName?: string;
}

export default function FamilySmartMedCard({
  patientId,
  patientName = "Patient",
}: FamilySmartMedCardProps) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const generateMedCard = async () => {
    if (!patientId) {
      alert("Please select a patient first");
      return;
    }

    setLoading(true);
    try {
      const user = firebaseAuth().currentUser;
      if (!user) {
        throw new Error("Not authenticated");
      }

      const idToken = await user.getIdToken();
      const response = await fetch("/api/generate_medcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          patient_id: patientId, // Specify which patient
          expires_in_minutes: 60, // 1 hour
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate med card");
      }

      const data = await response.json();
      setToken(data.token);
      setExpiresAt(data.expires_at);
      
      // Generate URL for QR code
      const baseUrl = window.location.origin;
      const medCardUrl = `${baseUrl}/medcard/${data.token}`;
      setCardUrl(medCardUrl);
    } catch (error: any) {
      console.error("Error generating med card:", error);
      alert(error.message || "Failed to generate medical card");
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 bg-white text-center">
        <p className="text-gray-500">Select a patient to generate Smart Med Card</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Med Card (QR)</h3>
      
      {!token ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 mb-2">Generate a temporary Smart Med Card for {patientName}</p>
          <p className="text-sm text-gray-500 mb-6">
            This QR code can be scanned by emergency responders to access critical medical information
          </p>
          <button
            onClick={generateMedCard}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Smart Med Card"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl border-2 border-red-200">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                {cardUrl && (
                  <QRCodeSVG
                    value={cardUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">{patientName}'s Med Card</p>
                <p className="text-xs text-gray-500 mb-2">
                  Expires: {expiresAt ? new Date(expiresAt).toLocaleString() : "Unknown"}
                </p>
                <a
                  href={cardUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:underline"
                >
                  View Full Card →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Instructions:</strong> Share this QR code with emergency responders, healthcare providers, 
              or anyone who needs quick access to {patientName}'s medical information. The card expires in 1 hour.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (cardUrl) {
                  navigator.clipboard.writeText(cardUrl);
                  alert("Card URL copied to clipboard!");
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              📋 Copy Link
            </button>
            <button
              onClick={() => {
                setToken(null);
                setExpiresAt(null);
                setCardUrl(null);
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

