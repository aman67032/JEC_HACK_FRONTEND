export default function CTASection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Start animating</h2>
        <p className="mx-auto mb-6 max-w-2xl text-zinc-700 dark:text-zinc-300">
          Build delightful, responsive motion with GSAP and anime.js. Modular, fast, and accessible.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200" href="/register">
            Get started
          </a>
          <a className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800" href="/about">
            Learn more
          </a>
        </div>
      </div>
    </section>
  );
}


