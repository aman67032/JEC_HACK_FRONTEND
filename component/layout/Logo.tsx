"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image src="/next.svg" alt="Logo" width={28} height={28} className="dark:invert" />
      <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        JEC
      </span>
    </Link>
  );
}


