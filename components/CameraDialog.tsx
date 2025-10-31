"use client";

import { useState, useRef } from "react";

interface CameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string) => void;
  onTakePhoto: (file: File) => void;
  medicineName?: string;
}

export default function CameraDialog({ isOpen, onClose, onCapture, onTakePhoto, medicineName }: CameraDialogProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageUrl);
        stopCamera();
        
        // Convert to blob and call onTakePhoto
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `medicine-${Date.now()}.jpg`, { type: "image/jpeg" });
            onTakePhoto(file);
          }
        }, "image/jpeg");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onTakePhoto(file);
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-zinc-900">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full bg-zinc-200 p-2 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          ✕
        </button>

        <h2 className="mb-4 text-2xl font-bold">📷 Take Medicine Photo</h2>
        {medicineName && (
          <p className="mb-4 text-lg text-[color:var(--color-muted)]">
            Verify: <strong>{medicineName}</strong>
          </p>
        )}

        {!stream && !capturedImage && (
          <div className="space-y-4">
            <button
              onClick={startCamera}
              className="w-full rounded-xl bg-[color:var(--color-accent)] px-6 py-4 text-lg font-bold text-white hover:bg-[color:var(--color-accent-hover)]"
            >
              📷 Open Camera
            </button>
            <div className="text-center text-[color:var(--color-muted)]">or</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-[color:var(--color-border)] px-6 py-4 text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              📁 Choose from Gallery
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {stream && !capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={capturePhoto}
                className="flex-1 rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white hover:bg-green-700"
              >
                ✅ Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="rounded-xl border-2 border-[color:var(--color-border)] px-6 py-4 text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <img src={capturedImage} alt="Captured medicine" className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  onCapture(capturedImage);
                  handleClose();
                }}
                className="flex-1 rounded-xl bg-[color:var(--color-accent)] px-6 py-4 text-lg font-bold text-white hover:bg-[color:var(--color-accent-hover)]"
              >
                ✅ Use This Photo
              </button>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="rounded-xl border-2 border-[color:var(--color-border)] px-6 py-4 text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Retake
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

