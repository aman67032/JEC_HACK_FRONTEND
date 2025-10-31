export default function LoginPage() {
  return (
    <main className="mx-auto min-h-[60vh] w-full max-w-md px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Log in</h1>
      <form className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-300">Email</label>
          <input className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-300">Password</label>
          <input type="password" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" placeholder="••••••••" />
        </div>
        <button className="h-10 w-full rounded-md bg-black text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
          Continue
        </button>
      </form>
    </main>
  );
}


