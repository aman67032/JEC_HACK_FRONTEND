"use client";

import { useState, useRef } from "react";
import { MedicineReminder } from "./ReminderSidebar";
import { firebaseStorage } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createWorker } from "tesseract.js";
import CameraDialog from "./CameraDialog";

interface VerificationModalProps {
  isOpen: boolean;
  reminder: MedicineReminder;
  onClose: () => void;
  onVerify: (
    reminder: MedicineReminder,
    data: {
      photoUrl: string;
      ocrOutput: string;
      matchStatus: "match" | "mismatch";
      timestamp: string;
    }
  ) => void;
}

export default function VerificationModal({
  isOpen,
  reminder,
  onClose,
  onVerify,
}: VerificationModalProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>("");
  const [matchStatus, setMatchStatus] = useState<"match" | "mismatch" | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = async (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setCameraOpen(false);
  };

  const handleOCR = async () => {
    if (!photoFile) return;

    setIsProcessing(true);
    try {
      // Initialize Tesseract worker
      const worker = await createWorker("eng");
      
      // Perform OCR
      const { data: { text } } = await worker.recognize(photoFile);
      
      // Clean up
      await worker.terminate();

      const extractedText = text.toLowerCase().trim();
      setOcrResult(extractedText);

      // Check if medicine name matches
      const medicineNameLower = reminder.medicineName.toLowerCase();
      const matches = extractedText.includes(medicineNameLower) || 
                     medicineNameLower.split(/\s+/).some(word => extractedText.includes(word));

      setMatchStatus(matches ? "match" : "mismatch");
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to process image. Please try again.");
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!photoFile || !isConfirmed) {
      alert("Please capture/upload a photo and confirm you have taken the medicine.");
      return;
    }

    setIsProcessing(true);

    try {
      // Upload photo to Firebase Storage
      const storage = firebaseStorage();
      const { firebaseAuth } = await import("@/lib/firebaseClient");
      const userId = firebaseAuth().currentUser?.uid;
      if (!userId) {
        alert("You must be logged in to verify medicine intake.");
        setIsProcessing(false);
        return;
      }
      const timestamp = Date.now();
      const photoRef = ref(storage, `verifications/${userId}/${reminder.id}/${timestamp}.jpg`);
      
      await uploadBytes(photoRef, photoFile);
      const photoUrl = await getDownloadURL(photoRef);

      // If OCR wasn't run, run it now
      let finalOcrOutput = ocrResult;
      let finalMatchStatus = matchStatus;

      if (!ocrResult) {
        await handleOCR();
        // Wait a bit for OCR to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      onVerify(reminder, {
        photoUrl,
        ocrOutput: finalOcrOutput || "OCR processing completed",
        matchStatus: finalMatchStatus || "mismatch",
        timestamp: new Date().toISOString(),
      });

      // Reset state
      setCapturedImage(null);
      setPhotoFile(null);
      setOcrResult("");
      setMatchStatus(null);
      setIsConfirmed(false);
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to upload verification. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-title"
      >
        <div
          className="card w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id="verification-title" className="text-2xl font-bold">
              ✅ Verify Medicine Intake
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Medicine Info */}
          <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-4 dark:bg-blue-950/20">
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {reminder.medicineName}
            </h3>
            <p className="text-sm text-[color:var(--color-muted)]">{reminder.dosage}</p>
          </div>

          {/* Photo Capture Section */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold">
              📷 Upload or Capture Photo of Medicine
            </label>
            
            {!capturedImage ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="w-full btn-primary px-6 py-4 text-lg font-bold rounded-full"
                >
                  📷 Open Camera
                </button>
                <div className="text-center text-[color:var(--color-muted)]">or</div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-[color:var(--color-border)] px-6 py-4 text-lg font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  📁 Choose from Gallery
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoCapture(file);
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-[color:var(--color-border)]">
                  <img
                    src={capturedImage}
                    alt="Captured medicine"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      setPhotoFile(null);
                    }}
                    className="rounded-lg border-2 border-[color:var(--color-border)] px-4 py-2 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Retake
                  </button>
                  {!ocrResult && (
                    <button
                      type="button"
                      onClick={handleOCR}
                      disabled={isProcessing}
                      className="flex-1 btn-secondary px-4 py-2 font-bold rounded-lg disabled:opacity-50"
                    >
                      {isProcessing ? "Processing..." : "🔍 Run OCR Check"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* OCR Results */}
          {ocrResult && (
            <div
              className={`rounded-xl border-2 p-4 ${
                matchStatus === "match"
                  ? "bg-green-50 border-green-400 dark:bg-green-950/20 dark:border-green-700"
                  : "bg-red-50 border-red-400 dark:bg-red-950/20 dark:border-red-700"
              }`}
            >
              <div className="mb-2 font-bold">
                {matchStatus === "match" ? "✅ Match Found!" : "⚠ Warning"}
              </div>
              <div className="text-sm mb-2">
                {matchStatus === "match" ? (
                  <span className="text-green-800 dark:text-green-200">
                    You have taken the correct medicine.
                  </span>
                ) : (
                  <span className="text-red-800 dark:text-red-200">
                    Warning: This doesn't match your scheduled medicine ({reminder.medicineName}).
                    Please verify you have the correct medicine.
                  </span>
                )}
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-[color:var(--color-muted)]">
                  View OCR Output
                </summary>
                <pre className="mt-2 text-xs overflow-auto bg-white dark:bg-zinc-900 p-2 rounded">
                  {ocrResult}
                </pre>
              </details>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-2 border-[color:var(--color-border)]"
            />
            <span className="text-lg">
              ✅ I have taken this medicine.
            </span>
          </label>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || !isConfirmed || !photoFile}
              className="flex-1 btn-primary px-6 py-4 text-lg font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "✅ Submit Verification"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border-2 border-[color:var(--color-border)] px-6 py-4 text-lg font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Camera Dialog */}
      <CameraDialog
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(url) => setCapturedImage(url)}
        onTakePhoto={handlePhotoCapture}
        medicineName={reminder.medicineName}
      />
    </>
  );
}

