export default function AboutSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-24">
      <h2 className="mb-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">About</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-40 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="h-40 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
        <div className="h-40 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700" />
      </div>
    </section>
  );
}


