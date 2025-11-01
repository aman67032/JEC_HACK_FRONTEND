"use client";

import RequireAuth from "@/components/RequireAuth";
import { firebaseAuth, firestoreDb, firebaseStorage } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DoctorVerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [degreeInstitution, setDegreeInstitution] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploadingDegree, setUploadingDegree] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  
  const [degreeFileUrl, setDegreeFileUrl] = useState("");
  const [licenseFileUrl, setLicenseFileUrl] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestoreDb(), "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHospitalName(data.hospitalName || "");
          setHospitalAddress(data.hospitalAddress || "");
          setDegreeName(data.degreeName || "");
          setDegreeInstitution(data.degreeInstitution || "");
          setLicenseNumber(data.licenseNumber || "");
          setSpecialization(data.specialization || "");
          setDegreeFileUrl(data.degreeFileUrl || "");
          setLicenseFileUrl(data.licenseFileUrl || "");
          setIsVerified(data.isVerified === true);
          setVerificationStatus(data.verificationStatus || "pending");
        }
      } catch (e: any) {
        console.error("Error loading verification data:", e);
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function handleDegreeUpload(file: File): Promise<string> {
    setUploadingDegree(true);
    try {
      const user = firebaseAuth().currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const path = `doctor_verification/${user.uid}/degree_${Date.now()}_${file.name}`;
      const storageRef = ref(firebaseStorage(), path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setDegreeFileUrl(url);
      return url;
    } catch (e: any) {
      setError(e?.message || "Failed to upload degree certificate");
      throw e;
    } finally {
      setUploadingDegree(false);
    }
  }

  async function handleLicenseUpload(file: File): Promise<string> {
    setUploadingLicense(true);
    try {
      const user = firebaseAuth().currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const path = `doctor_verification/${user.uid}/license_${Date.now()}_${file.name}`;
      const storageRef = ref(firebaseStorage(), path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setLicenseFileUrl(url);
      return url;
    } catch (e: any) {
      setError(e?.message || "Failed to upload license");
      throw e;
    } finally {
      setUploadingLicense(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const user = firebaseAuth().currentUser;
      if (!user) {
        setError("You must be logged in");
        return;
      }

      if (!hospitalName || !degreeName || !degreeInstitution || !licenseNumber) {
        setError("Please fill in all required fields");
        return;
      }

      if (!degreeFileUrl && !degreeFile) {
        setError("Please upload your degree certificate");
        return;
      }

      if (!licenseFileUrl && !licenseFile) {
        setError("Please upload your medical license");
        return;
      }

      // Upload files if new ones are selected
      let finalDegreeUrl = degreeFileUrl;
      let finalLicenseUrl = licenseFileUrl;

      if (degreeFile && !degreeFileUrl) {
        finalDegreeUrl = await handleDegreeUpload(degreeFile);
      }

      if (licenseFile && !licenseFileUrl) {
        finalLicenseUrl = await handleLicenseUpload(licenseFile);
      }

      // Ensure we have both file URLs
      if (!finalDegreeUrl || !finalLicenseUrl) {
        setError("Please upload both degree certificate and license document");
        return;
      }

      // Demo mode: Just save verification data to database (no actual verification)
      await setDoc(
        doc(firestoreDb(), "users", user.uid),
        {
          hospitalName,
          hospitalAddress,
          degreeName,
          degreeInstitution,
          licenseNumber,
          specialization: specialization || undefined,
          degreeFileUrl: finalDegreeUrl,
          licenseFileUrl: finalLicenseUrl,
          verificationStatus: "submitted", // Demo mode - just mark as submitted
          verificationSubmittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Success - redirect to doctor dashboard after a short delay
      setSuccess("Information saved successfully! Redirecting to dashboard...");
      setVerificationStatus("submitted");
      
      // Redirect to doctor dashboard after 1.5 seconds
      setTimeout(() => {
        router.push("/doctor/dashboard");
      }, 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to save verification");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 p-8 text-center text-[color:var(--color-muted)] dark:border-zinc-800">
            Loading...
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Doctor Verification</h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Submit your credentials for verification. Our team will review your hospital and degree information.
        </p>

        {isVerified && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <p className="font-semibold">✓ Your account has been verified!</p>
            <a href="/doctor/dashboard" className="mt-2 inline-block text-sm underline">
              Go to Dashboard
            </a>
          </div>
        )}

        {verificationStatus === "pending" && !isVerified && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <p>Your verification is under review. We'll notify you once it's complete.</p>
          </div>
        )}

        {verificationStatus === "rejected" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <p>Your verification was rejected. Please review your information and resubmit.</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">Hospital Information</h2>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Hospital/Clinic Name *</label>
                <input
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="e.g., City General Hospital"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Hospital Address</label>
                <textarea
                  value={hospitalAddress}
                  onChange={(e) => setHospitalAddress(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="Full address of your hospital/clinic"
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">Degree Information</h2>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Degree Name *</label>
                <input
                  value={degreeName}
                  onChange={(e) => setDegreeName(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="e.g., MBBS, MD, DO"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Degree Institution *</label>
                <input
                  value={degreeInstitution}
                  onChange={(e) => setDegreeInstitution(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="e.g., Harvard Medical School"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Degree Certificate *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setDegreeFile(file);
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                />
                {uploadingDegree && <p className="text-xs text-zinc-500">Uploading...</p>}
                {degreeFileUrl && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ File uploaded: <a href={degreeFileUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">License Information</h2>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Medical License Number *</label>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="e.g., MD12345"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">License Document *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLicenseFile(file);
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                />
                {uploadingLicense && <p className="text-xs text-zinc-500">Uploading...</p>}
                {licenseFileUrl && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ File uploaded: <a href={licenseFileUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Specialization</label>
                <input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="e.g., Cardiology, Pediatrics"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || isVerified}
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-black"
            >
              {submitting ? "Submitting..." : isVerified ? "Already Verified" : "Submit for Verification"}
            </button>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

