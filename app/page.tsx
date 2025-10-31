"use client";

import Link from "next/link";
import MedicineSchedule from "@/components/MedicineSchedule";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 py-8">
      {/* Hero Section */}
      <section className="flex flex-col gap-8 text-center">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[color:var(--color-border)] bg-white/90 px-4 py-2 text-xl font-semibold text-[color:var(--color-muted)] mx-auto">
          💊 Health Connect — Complete Healthcare Platform
        </span>
        <h1 className="text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
          Keep Your Family Safe with Smart Medicine Management
          </h1>
        <p className="max-w-3xl text-2xl text-[color:var(--color-muted)] mx-auto leading-relaxed">
          Track medicines, get reminders, connect with doctors and family, and be ready for emergencies — all in one simple platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/signup" className="btn-primary inline-flex items-center justify-center px-8 py-4 text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
            Get Started Free
          </a>
          <a href="/dashboard" className="btn-secondary inline-flex items-center justify-center px-8 py-4 text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
            View Dashboard
          </a>
        </div>
      </section>

      {/* Medicine Schedule - Hero Section */}
      <section className="w-full">
        <MedicineSchedule />
      </section>

      {/* Quick Start Guide */}
      <section className="card p-8 space-y-6">
        <h2 className="text-4xl font-bold mb-6">🚀 Quick Start — How It Works</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3 p-6 rounded-xl bg-[color:var(--background)] border-2 border-[color:var(--color-border)]">
            <div className="text-5xl mb-2">1️⃣</div>
            <h3 className="text-2xl font-bold">Sign Up</h3>
            <p className="text-lg text-[color:var(--color-muted)]">Create your free account in seconds. No credit card needed.</p>
          </div>
          <div className="flex flex-col gap-3 p-6 rounded-xl bg-[color:var(--background)] border-2 border-[color:var(--color-border)]">
            <div className="text-5xl mb-2">2️⃣</div>
            <h3 className="text-2xl font-bold">Add Medicines</h3>
            <p className="text-lg text-[color:var(--color-muted)]">Upload your prescription or add medicines manually. Our smart system will organize everything.</p>
          </div>
          <div className="flex flex-col gap-3 p-6 rounded-xl bg-[color:var(--background)] border-2 border-[color:var(--color-border)]">
            <div className="text-5xl mb-2">3️⃣</div>
            <h3 className="text-2xl font-bold">Get Reminders</h3>
            <p className="text-lg text-[color:var(--color-muted)]">Receive alerts when it's time to take your medicine. Never miss a dose again.</p>
          </div>
          <div className="flex flex-col gap-3 p-6 rounded-xl bg-[color:var(--background)] border-2 border-[color:var(--color-border)]">
            <div className="text-5xl mb-2">4️⃣</div>
            <h3 className="text-2xl font-bold">Stay Safe</h3>
            <p className="text-lg text-[color:var(--color-muted)]">Generate your emergency QR code and connect with family and doctors.</p>
        </div>
        </div>
      </section>

      {/* All Features - Main Sections */}
      <section className="space-y-12">
        <h2 className="text-5xl font-bold text-center mb-12">✨ Complete Feature List</h2>

        {/* Medicine Management */}
        <div id="medicine-management" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">💊</span>
            <h3 className="text-4xl font-bold">1. Medicine Management & Tracking</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Everything you need to manage your medicines:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Upload Prescriptions:</strong> Take a photo of your prescription. Our smart system automatically reads it and adds your medicines.</li>
              <li><strong className="text-2xl">Manual Entry:</strong> Add medicines yourself with name, dosage, and schedule.</li>
              <li><strong className="text-2xl">Smart Reminders:</strong> Get alerts on your phone, tablet, or computer when it's time to take your medicine.</li>
              <li><strong className="text-2xl">Mark as Taken:</strong> Click "Taken" when you take your medicine. You can even take a photo as proof.</li>
              <li><strong className="text-2xl">Safety Check:</strong> Our system checks if you took the right medicine by comparing the photo you took.</li>
              <li><strong className="text-2xl">Adherence Tracking:</strong> See how well you're following your medicine schedule with weekly and monthly reports.</li>
            </ul>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#upload" className="btn-primary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                Try Medicine Upload →
              </a>
            </div>
          </div>
        </div>

        {/* Digital Medical History */}
        <div id="medical-history" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🧾</span>
            <h3 className="text-4xl font-bold">2. Digital Medical History</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Your complete health record in one place:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Store Everything:</strong> Keep all your prescriptions, lab reports, and discharge summaries in one safe place.</li>
              <li><strong className="text-2xl">Smart Organization:</strong> Our system automatically organizes your documents by date and type.</li>
              <li><strong className="text-2xl">Share Safely:</strong> Share your medical history with doctors and family members when needed.</li>
              <li><strong className="text-2xl">Always Available:</strong> Access your health records from anywhere, anytime. Never lose important documents.</li>
            </ul>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#upload" className="btn-secondary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                Upload Documents →
              </a>
            </div>
          </div>
        </div>

        {/* Smart Med Card */}
        <div id="smart-med-card" className="card p-10 space-y-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🏥</span>
            <h3 className="text-4xl font-bold">3. Smart Med Card (Emergency QR Code)</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Life-saving information in an emergency:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Instant Access:</strong> Generate a QR code with your essential medical information.</li>
              <li><strong className="text-2xl">What's Included:</strong> Name, age, blood group, allergies, conditions, current medicines, and emergency contacts.</li>
              <li><strong className="text-2xl">Emergency Use:</strong> If you're unconscious, doctors can scan the QR code to see your medical information instantly.</li>
              <li><strong className="text-2xl">Privacy Protected:</strong> QR codes expire after 30 minutes for your privacy and safety.</li>
              <li><strong className="text-2xl">No Internet Needed:</strong> The QR code works even without internet connection on the scanner device.</li>
            </ul>
            <div className="mt-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-red-300">
              <p className="text-xl font-bold mb-3">⚠️ Important:</p>
              <p className="text-lg">Keep this QR code on your phone or print it. Show it to doctors in emergencies for instant access to your medical information.</p>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#emergency" className="btn-primary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full bg-red-600 hover:bg-red-700">
                Generate Emergency QR →
              </a>
            </div>
          </div>
        </div>

        {/* AI Health Assistant */}
        <div id="ai-assistant" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🤖</span>
            <h3 className="text-4xl font-bold">4. AI Health Assistant</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Your smart healthcare companion:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Drug Interaction Checker:</strong> Automatically checks if your medicines can cause harmful interactions with each other.</li>
              <li><strong className="text-2xl">Safety Warnings:</strong> Get instant alerts if there's a danger in your medicine combination.</li>
              <li><strong className="text-2xl">Health Insights:</strong> Get personalized advice based on your medicine schedule and adherence.</li>
              <li><strong className="text-2xl">Pattern Detection:</strong> Our AI notices if you're missing doses at certain times and suggests improvements.</li>
              <li><strong className="text-2xl">Doctor Support:</strong> Helps doctors answer questions about your medical history quickly.</li>
            </ul>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#interactions" className="btn-secondary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                Check Drug Interactions →
              </a>
            </div>
          </div>
        </div>

        {/* Emergency Alert System */}
        <div id="emergency-alerts" className="card p-10 space-y-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🚨</span>
            <h3 className="text-4xl font-bold">5. Emergency Alert System</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">One-tap emergency help:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">SOS Button:</strong> A big red button visible on every screen for emergencies.</li>
              <li><strong className="text-2xl">Instant Alerts:</strong> Pressing the button immediately alerts your family members and doctors.</li>
              <li><strong className="text-2xl">Location Sharing:</strong> Automatically shares your location with emergency contacts.</li>
              <li><strong className="text-2xl">Hospital Alerts:</strong> Sends your medical information to the nearest hospital automatically.</li>
              <li><strong className="text-2xl">Ambulance Dispatch:</strong> Can automatically contact ambulance services in your area.</li>
              <li><strong className="text-2xl">Complete Medical Info:</strong> Emergency responders get all your important medical details instantly.</li>
            </ul>
            <div className="mt-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-amber-300">
              <p className="text-xl font-bold mb-3">💡 Tip:</p>
              <p className="text-lg">Make sure to add your emergency contacts in your profile so they can be notified in emergencies.</p>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#emergency" className="btn-primary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full bg-red-600 hover:bg-red-700">
                Test Emergency Button →
              </a>
            </div>
          </div>
        </div>

        {/* Hospital & Ambulance Network */}
        <div id="hospital-network" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🏥</span>
            <h3 className="text-4xl font-bold">6. Hospital & Ambulance Network</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Find help when you need it:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Nearby Hospitals:</strong> See all hospitals near you on an interactive map.</li>
              <li><strong className="text-2xl">Facility Information:</strong> Know which hospitals have ICU, cardiology, trauma care, and other facilities.</li>
              <li><strong className="text-2xl">Availability Status:</strong> Check if hospitals have beds and doctors available.</li>
              <li><strong className="text-2xl">Smart Routing:</strong> Get directions to the nearest suitable hospital for your needs.</li>
              <li><strong className="text-2xl">Ambulance Services:</strong> Find and contact nearby ambulance services quickly.</li>
              <li><strong className="text-2xl">NGO Support:</strong> Access NGO contacts for help in rural or low-income areas.</li>
            </ul>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#emergency" className="btn-secondary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                Find Nearby Hospitals →
              </a>
            </div>
          </div>
        </div>

        {/* Family & Caretaker Dashboard */}
        <div id="caregiver" className="card p-10 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">👨‍👩‍👧</span>
            <h3 className="text-4xl font-bold">7. Family & Caretaker Dashboard</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Stay connected with your loved ones:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Connect Family:</strong> Add family members or caretakers to your account so they can help you.</li>
              <li><strong className="text-2xl">Real-Time Updates:</strong> Your family automatically gets notified when you take or miss medicines.</li>
              <li><strong className="text-2xl">Shared Dashboard:</strong> Family members can see your medicine schedule and adherence on their dashboard.</li>
              <li><strong className="text-2xl">Help from Family:</strong> Family members can mark medicines as taken for you if needed.</li>
              <li><strong className="text-2xl">Emergency Alerts:</strong> Family gets instant alerts if you press the emergency button.</li>
              <li><strong className="text-2xl">Upload Help:</strong> Family can help upload prescriptions and reports on your behalf.</li>
            </ul>
            <div className="mt-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-blue-300">
              <p className="text-xl font-bold mb-3">👨‍👩‍👧 Family Features:</p>
              <p className="text-lg">Share your share code with family members so they can connect to your account and help manage your medicines.</p>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/profile" className="btn-primary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                Connect Family Members →
              </a>
            </div>
          </div>
        </div>

        {/* Doctor Collaboration */}
        <div id="doctor-collaboration" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">👨‍⚕️</span>
            <h3 className="text-4xl font-bold">8. Doctor Collaboration & Consultations</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Work together with your doctors:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Connect Doctors:</strong> Share your code with doctors so they can access your medical history.</li>
              <li><strong className="text-2xl">Complete Medical History:</strong> Doctors can see all your prescriptions, reports, and adherence data.</li>
              <li><strong className="text-2xl">Direct Prescriptions:</strong> Doctors can add new medicines directly to your schedule.</li>
              <li><strong className="text-2xl">Upload Reports:</strong> Doctors can upload lab reports and notes to your account.</li>
              <li><strong className="text-2xl">Adherence Analytics:</strong> Doctors can see how well you're following your treatment plan.</li>
              <li><strong className="text-2xl">Multiple Doctors:</strong> If you see multiple doctors, they can all collaborate and share insights.</li>
              <li><strong className="text-2xl">Video Consultations:</strong> Schedule and have video calls with your doctors right from the app.</li>
            </ul>
            <div className="mt-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-green-300">
              <p className="text-xl font-bold mb-3">👨‍⚕️ Doctor Features:</p>
              <p className="text-lg">Doctors can access your complete medical history, prescribe medicines, and track your progress — all in one place.</p>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/profile" className="btn-secondary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                Generate Doctor Share Code →
              </a>
              <a href="/admin/doctor" className="btn-secondary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full ml-4">
                Doctor Dashboard →
              </a>
            </div>
          </div>
        </div>

        {/* Analytics & Insights */}
        <div id="analytics" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">📊</span>
            <h3 className="text-4xl font-bold">9. Analytics & Insights</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Understand your health progress:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Adherence Percentage:</strong> See how many doses you've taken correctly as a percentage.</li>
              <li><strong className="text-2xl">Visual Charts:</strong> Easy-to-understand graphs showing your medicine intake over time.</li>
              <li><strong className="text-2xl">Missed vs. Taken:</strong> Clear view of which doses you took and which you missed.</li>
              <li><strong className="text-2xl">Prescription Status:</strong> See which prescriptions are active and which are completed.</li>
              <li><strong className="text-2xl">Doctor Feedback:</strong> View summaries of feedback from your doctors.</li>
              <li><strong className="text-2xl">Pattern Detection:</strong> Our AI detects patterns like "you often miss night doses" and suggests improvements.</li>
            </ul>
            <div className="mt-6 pt-6 border-t-2 border-[color:var(--color-border)]">
              <a href="/dashboard#caregiver" className="btn-primary inline-flex items-center px-6 py-3 text-lg font-bold rounded-full">
                View Your Analytics →
              </a>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div id="privacy" className="card p-10 space-y-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🔐</span>
            <h3 className="text-4xl font-bold">10. Privacy, Security, and Permissions</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Your data is safe and secure:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Your Data, Your Control:</strong> Only you can see your complete medical data.</li>
              <li><strong className="text-2xl">Family Access:</strong> Family members can only see what you allow them to see.</li>
              <li><strong className="text-2xl">Doctor Permissions:</strong> Doctors can only access records of patients who have connected with them.</li>
              <li><strong className="text-2xl">Emergency Access:</strong> Emergency QR codes are time-limited and read-only for your safety.</li>
              <li><strong className="text-2xl">Encrypted Storage:</strong> All your data is encrypted and stored securely.</li>
              <li><strong className="text-2xl">Revocable Shares:</strong> You can revoke access from family or doctors anytime.</li>
            </ul>
            <div className="mt-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-green-300">
              <p className="text-xl font-bold mb-3">🔒 Security Features:</p>
              <p className="text-lg">We use industry-standard encryption and security practices to protect your medical information. Your privacy is our top priority.</p>
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div id="accessibility" className="card p-10 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">♿</span>
            <h3 className="text-4xl font-bold">11. Accessibility-Focused Design</h3>
          </div>
          <div className="space-y-4 text-xl leading-relaxed">
            <p className="text-2xl font-semibold text-[color:var(--color-muted)]">Designed for everyone, especially elderly users:</p>
            <ul className="space-y-3 ml-6 list-disc">
              <li><strong className="text-2xl">Large Text:</strong> All text is large and easy to read. No squinting needed.</li>
              <li><strong className="text-2xl">High Contrast:</strong> Text and buttons have high contrast colors so they're easy to see.</li>
              <li><strong className="text-2xl">Big Buttons:</strong> All important buttons are large and easy to click.</li>
              <li><strong className="text-2xl">Simple Navigation:</strong> Everything is just 1-2 taps away. No confusing menus.</li>
              <li><strong className="text-2xl">Color Coding:</strong> Green means done, Red means alert, Blue means information.</li>
              <li><strong className="text-2xl">Clear Icons:</strong> Every feature has clear icons that are easy to understand.</li>
              <li><strong className="text-2xl">Voice Instructions:</strong> Coming soon — voice guidance to help you navigate.</li>
          </ul>
            <div className="mt-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-purple-300">
              <p className="text-xl font-bold mb-3">💡 Designed for You:</p>
              <p className="text-lg">This platform was specifically designed with elderly users in mind. Every feature is simple, clear, and easy to use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="card p-12 text-center bg-gradient-to-br from-[color:var(--color-accent)]/10 to-[color:var(--color-sage)]/10">
        <h2 className="text-5xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-2xl text-[color:var(--color-muted)] mb-8 max-w-3xl mx-auto">
          Join thousands of families using Health Connect to manage their medicines safely and stay connected with healthcare providers.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="/signup" className="btn-primary inline-flex items-center justify-center px-10 py-5 text-2xl font-bold rounded-full shadow-xl hover:shadow-2xl transition-all">
            Create Free Account
          </a>
          <a href="/login" className="btn-secondary inline-flex items-center justify-center px-10 py-5 text-2xl font-bold rounded-full shadow-xl hover:shadow-2xl transition-all">
            Login to Your Account
          </a>
        </div>
        <p className="mt-8 text-xl text-[color:var(--color-muted)]">
          ✨ No credit card required • Free forever • Your data is always secure
        </p>
      </section>

      {/* Footer Info */}
      <section className="text-center space-y-4">
        <p className="text-xl text-[color:var(--color-muted)]">
          Questions? Contact us at <a href="mailto:support@healthconnect.com" className="font-bold underline">support@healthconnect.com</a>
        </p>
        <p className="text-lg text-[color:var(--color-muted)]">
          © {new Date().getFullYear()} Health Connect — Smart Healthcare Platform for Everyone
        </p>
      </section>
    </div>
  );
}
