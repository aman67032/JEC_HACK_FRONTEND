"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./AnimationProvider";

export function useGsapTimeline(options?: gsap.TimelineVars) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  if (!timelineRef.current) {
    timelineRef.current = gsap.timeline({ paused: true, ...options });
  }

  useEffect(() => {
    const timeline = timelineRef.current;
    return () => {
      if (timeline) {
        timeline.kill();
      }
    };
  }, []);

  return timelineRef.current!;
}


