"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { gsap } from "./animations/AnimationProvider";

type AnimatedTextProps = {
  text: string;
  className?: string;
  delay?: number;
};

export default function AnimatedText({ text, className, delay = 0 }: AnimatedTextProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  const characters = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (!containerRef.current) return;
    const targets = containerRef.current.querySelectorAll("span[data-char]");
    gsap.set(targets, { yPercent: 120, opacity: 0 });
    const tl = gsap.timeline();
    tl.to(targets, {
      yPercent: 0,
      opacity: 1,
      ease: "power3.out",
      duration: 0.7,
      stagger: 0.03,
      delay,
    });
    return () => tl.kill();
  }, [delay]);

  return (
    <span ref={containerRef} className={className} aria-label={text}>
      {characters.map((c, i) => (
        <span key={i} data-char className="inline-block will-change-transform">
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
}


