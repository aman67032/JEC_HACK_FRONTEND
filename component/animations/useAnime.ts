"use client";

import { useEffect, useRef } from "react";
import { timeline } from "animejs";

export function useAnimeTimeline(params?: Record<string, unknown>) {
  const timelineRef = useRef<any>(null);

  if (!timelineRef.current) {
    timelineRef.current = timeline({ autoplay: false, ...(params || {}) });
  }

  useEffect(() => {
    const tl = timelineRef.current;
    return () => {
      // Best-effort cleanup for v4 timelines
      if (tl && typeof tl.cancel === "function") tl.cancel();
    };
  }, []);

  return timelineRef.current as any;
}


