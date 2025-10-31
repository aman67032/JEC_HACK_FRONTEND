"use client";

import React, { PropsWithChildren, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "./animations/AnimationProvider";

type RevealOnScrollProps = PropsWithChildren<{
  y?: number;
  duration?: number;
  delay?: number;
  className?: string;
}>;

export default function RevealOnScroll({
  children,
  y = 40,
  duration = 0.8,
  delay = 0,
  className,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.set(el, { y, opacity: 0 });
    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: 0,
        opacity: 1,
        ease: "power3.out",
        duration,
        delay,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    }, el);
    return () => ctx.revert();
  }, [y, duration, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}


