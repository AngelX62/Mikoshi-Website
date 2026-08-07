"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { statement } from "@/content";
import {
  DURATION,
  EASE_OUT_EXPO,
  STAGGER,
  prefersReducedMotion,
} from "@/lib/motion";

/**
 * The premise.
 *
 * This is the only prose on the site, so its job is to be read. That rules out
 * anything scroll-scrubbed: scrubbing ties comprehension to the wheel and turns
 * five short lines into a task. The lines fire once on entry instead, arriving
 * whole and legible, and then the reader is left alone with the paragraph.
 */
export default function Statement() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const lines = el.querySelectorAll<HTMLElement>(".line-mask > span");
    if (lines.length === 0) return;

    // Nothing to do: the spans have no hidden state in CSS, so leaving them
    // untouched means the paragraph is simply readable.
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { yPercent: 115, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: DURATION.slow,
          ease: EASE_OUT_EXPO,
          stagger: STAGGER.base,
          // yPercent, not y: the type is clamped against viewport width, so a
          // pixel offset would under- or overshoot the mask at other sizes.
          scrollTrigger: { trigger: el, start: "top 78%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="statement"
      className="relative z-10 flex min-h-screen items-center px-6 py-32 md:px-10 md:py-48"
    >
      <div ref={ref} className="mx-auto w-full max-w-4xl">
        <span className="mb-10 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {statement.label}
        </span>

        <p className="text-[clamp(1.75rem,5vw,3.5rem)] font-medium leading-[1.15] tracking-[-0.02em]">
          {statement.lines.map((line, i) => (
            <span key={i} className="line-mask">
              <span>{line}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
