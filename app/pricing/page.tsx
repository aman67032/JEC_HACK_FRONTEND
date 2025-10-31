export default function PricingPage() {
  return (
    <main className="mx-auto min-h-[50vh] w-full max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Pricing</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-56 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="h-56 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="h-56 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
      </div>
    </main>
  );
}


