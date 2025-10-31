"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-8 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
        <p>© {new Date().getFullYear()} JEC. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </div>
    </footer>
  );
}


