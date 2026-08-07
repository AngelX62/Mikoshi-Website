"use client";

import { useEffect, useRef } from "react";
import { clamp, prefersReducedMotion } from "@/lib/motion";

/**
 * A hairline progress rail on the right edge.
 *
 * Kept because it encodes something true — how far down the page you are — and
 * reads as instrumentation, which suits the subject. It writes a transform on
 * one element from a passive scroll listener; no rAF loop, no layout reads
 * beyond the cached document height.
 */
export default function ScrollRail() {
  const fillRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const fill = fillRef.current;
    const readout = readoutRef.current;
    if (!fill || !readout) return;

    let max = 1;
    let last = -1;

    function measure() {
      max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    }

    function update() {
      const p = clamp(window.scrollY / max, 0, 1);
      fill!.style.transform = `scaleY(${p.toFixed(4)})`;

      // Only touch the DOM when the rounded value actually changes.
      const pct = Math.round(p * 100);
      if (pct !== last) {
        last = pct;
        readout!.textContent = String(pct).padStart(2, "0");
      }
    }

    measure();
    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
    >
      <div className="relative h-24 w-px bg-edge">
        <div
          ref={fillRef}
          className="absolute inset-0 origin-top bg-ink-dim"
          style={{ transform: "scaleY(0)" }}
        />
      </div>
      <span
        ref={readoutRef}
        className="font-mono text-[10px] tabular-nums tracking-[0.18em] text-ink-dim"
      >
        00
      </span>
    </div>
  );
}
