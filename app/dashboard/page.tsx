export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-[50vh] w-full max-w-6xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-40 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="h-40 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="h-40 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
      </div>
    </main>
  );
}


