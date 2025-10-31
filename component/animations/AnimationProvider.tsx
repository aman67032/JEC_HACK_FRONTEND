"use client";

import React, { PropsWithChildren, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register core plugins once on the client
export function AnimationProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!gsap.core.globals()["ScrollTrigger"]) {
      gsap.registerPlugin(ScrollTrigger);
    }
  }, []);

  return <>{children}</>;
}

export { gsap, ScrollTrigger };


