import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-2 text-4xl font-semibold text-zinc-900 dark:text-zinc-100">Page not found</h1>
      <p className="mb-6 text-zinc-700 dark:text-zinc-300">The page you are looking for doesn’t exist.</p>
      <Link href="/" className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">Go home</Link>
    </main>
  );
}


