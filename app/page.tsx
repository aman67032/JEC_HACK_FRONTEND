import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-16 lg:grid-cols-2">
      <section className="flex flex-col gap-6">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/60 px-3 py-1 text-sm text-[color:var(--color-muted)]">
          💊 PillSync 360 — Smart Medication & Emergency Companion
        </span>
        <h1 className="text-5xl font-semibold leading-tight md:text-6xl">
          Keep family safe with medicine tracking and instant emergency handoff
          </h1>
        <p className="max-w-2xl text-[color:var(--color-muted)] text-xl">
          Upload prescriptions, confirm medicines, get interaction warnings, track adherence, and share a secure Smart Med Card with hospitals during emergencies.
          </p>
        <div className="flex flex-wrap gap-3">
          <a href="/signup" className="btn-primary inline-flex items-center justify-center px-6 py-3 text-base font-semibold">
            Get Started
          </a>
          <a href="/dashboard" className="btn-secondary inline-flex items-center justify-center px-6 py-3 text-base font-semibold">
            View Demo Dashboard
          </a>
        </div>
        <ul className="mt-6 grid gap-3 text-base text-[color:var(--color-muted)]">
          <li>• Upload prescription + bill (OCR assist, manual confirm)</li>
          <li>• Drug interaction check via RxNav/OpenFDA</li>
          <li>• Reminders and adherence tracking with caregiver sync</li>
          <li>• Emergency QR for safe, fast hospital handoff</li>
        </ul>
      </section>
      <section className="grid gap-4">
        <div className="card p-6">
          <h3 className="mb-2 text-base font-semibold">How it works</h3>
          <ol className="grid gap-2 text-base text-[color:var(--color-muted)]">
            <li>1) Set up and confirm medicines</li>
            <li>2) Get reminders and caregiver updates</li>
            <li>3) Press Emergency to generate QR</li>
            <li>4) Hospital scans and treats safely</li>
          </ol>
        </div>
        <div className="card p-6">
          <h3 className="mb-2 text-base font-semibold">For Demo</h3>
          <p className="text-base text-[color:var(--color-muted)]">
            This is a frontend prototype. Data is simulated. Connect to Firebase later for auth and storage.
          </p>
        </div>
      </section>

      <section className="col-span-1 lg:col-span-2 grid gap-10">
        <div className="grid gap-6">
          <h2 className="text-3xl font-semibold">What you can do</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Link href="/dashboard#caregiver" className="card p-5 hover:bg-black/[.03]">
              <h3 className="mb-1 text-lg font-semibold">Caregiver Sync</h3>
              <p className="text-base text-[color:var(--color-muted)]">Family gets notified when meds are marked taken or missed.</p>
            </Link>
            <Link href="/dashboard#interactions" className="card p-5 hover:bg-black/[.03]">
              <h3 className="mb-1 text-lg font-semibold">Interaction Warnings</h3>
              <p className="text-base text-[color:var(--color-muted)]">Spot risky combinations using RxNav/OpenFDA before they cause harm.</p>
            </Link>
            <Link href="/dashboard#history" className="card p-5 hover:bg-black/[.03]">
              <h3 className="mb-1 text-lg font-semibold">Dosage History</h3>
              <p className="text-base text-[color:var(--color-muted)]">Every change is logged with who changed it and why.</p>
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          <h2 className="text-3xl font-semibold">Emergency, simplified</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Link href="/dashboard#emergency" className="card p-6 hover:bg-black/[.03]">
              <h3 className="mb-2 text-lg font-semibold">Smart Med Card (QR)</h3>
              <p className="text-base text-[color:var(--color-muted)]">Share a time-limited, read-only summary of meds, allergies, and conditions with hospital staff.</p>
            </Link>
            <Link href="/dashboard#emergency" className="card p-6 hover:bg-black/[.03]">
              <h3 className="mb-2 text-lg font-semibold">Nearest capable hospital</h3>
              <p className="text-base text-[color:var(--color-muted)]">See nearby hospitals and route there. Pre-alert can be sent with key info (simulated).</p>
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-3 text-3xl font-semibold">Privacy & Accessibility</h2>
          <ul className="grid gap-2 text-base text-[color:var(--color-muted)]">
            <li>• Your data, your control — role-based access and revocable shares.</li>
            <li>• Large fonts, high contrast, low glare color palette.</li>
            <li>• Uses color plus labels/icons for clarity.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
