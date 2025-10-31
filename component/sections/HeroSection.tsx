"use client";

import React, { useEffect, useRef } from "react";
import { animate, random, stagger } from "animejs";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const shapes = Array.from(container.querySelectorAll(".hero-shape"));

    const controls = animate(shapes, {
      x: () => random(-200, 200),
      y: () => random(-120, 120),
      rotate: () => random(-180, 180),
      scale: () => random(0.8, 1.4),
      duration: () => random(3000, 6000),
      easing: "inOutExpo",
      loop: true,
      direction: "alternate",
      delay: stagger(80),
    });

    return () => {
      // Best-effort cleanup for v4 controls
      // @ts-ignore - cancel is available on controls in v4
      if (controls?.cancel) controls.cancel();
    };
  }, []);

  return (
    <section className="relative flex h-[100vh] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-950">
      <div ref={containerRef} className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 size-24 hero-shape rounded-xl bg-blue-500/20 blur-2xl" />
        <div className="absolute left-1/2 top-1/2 size-20 hero-shape -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/20 blur-2xl" />
        <div className="absolute right-1/4 top-1/4 size-28 hero-shape rounded-lg bg-emerald-500/20 blur-2xl" />
        <div className="absolute bottom-16 left-12 size-16 hero-shape rotate-45 rounded-md bg-amber-500/20 blur-xl" />
        <div className="absolute right-10 bottom-20 size-14 hero-shape rounded-[999px] bg-cyan-500/20 blur-xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
        <h1 className="mb-4 text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Runs like clockwork
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Orchestrate sequences, trigger on scroll, and craft responsive animations with a modular API.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200" href="/buttons">
            Start animating
          </a>
          <a className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900" href="/about">
            Learn more
          </a>
        </div>
      </div>
    </section>
  );
}


