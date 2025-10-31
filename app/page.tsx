import Image from "next/image";
import AnimatedText from "../component/AnimatedText";
import RevealOnScroll from "../component/RevealOnScroll";
import HeroSection from "../component/sections/HeroSection";
import AboutSection from "../component/sections/AboutSection";
import ContactSection from "../component/sections/ContactSection";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full bg-white dark:bg-black">
        <HeroSection />
        <div className="mx-auto w-full max-w-3xl px-6 py-24">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            <AnimatedText text="Welcome to JEC" />
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        </div>
        <div className="mx-auto w-full max-w-3xl px-6 pb-24 flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
        <div className="mx-auto mt-12 grid w-full max-w-3xl gap-12 px-6 pb-24">
          <RevealOnScroll>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h2 className="mb-2 text-xl font-semibold text-black dark:text-zinc-50">GSAP Scroll Reveal</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                This block reveals into view using GSAP + ScrollTrigger.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll y={80} delay={0.1}>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h2 className="mb-2 text-xl font-semibold text-black dark:text-zinc-50">Anime.js Timeline</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Use the provided hook to orchestrate complex sequences with anime.js.
              </p>
            </div>
          </RevealOnScroll>
        </div>
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  );
}
