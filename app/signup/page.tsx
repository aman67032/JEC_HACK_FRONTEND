export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-2xl font-semibold">Create your account</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Choose your role to get a tailored experience.
      </p>
      <form className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input id="name" type="text" placeholder="Ramesh Kumar" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" placeholder="you@example.com" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" type="password" placeholder="••••••••" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="role" className="text-sm font-medium">Role</label>
          <select id="role" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <option value="patient">Patient</option>
            <option value="caregiver">Family Member / Caregiver</option>
            <option value="doctor">Doctor (read-only)</option>
          </select>
        </div>
        <button type="button" className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black">
          Create Account
        </button>
      </form>
      <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
        Already have an account? <a href="/login" className="underline">Login</a>
      </p>
    </div>
  );
}

