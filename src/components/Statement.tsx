"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { statement } from "@/content";
import { DURATION, EASE_OUT_EXPO, prefersReducedMotion } from "@/lib/motion";

export default function Statement() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const lines = el.querySelectorAll<HTMLElement>(".line-mask > span");

    if (prefersReducedMotion()) {
      gsap.set(lines, { yPercent: 0, opacity: 1 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Each line wipes up from behind its own mask, one after the next. The
    // overflow clip on .line-mask is what makes this read as a wipe, not a fade.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { yPercent: 115, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: DURATION.cinematic,
          ease: EASE_OUT_EXPO,
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 72%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 bg-void px-6 py-32 md:px-10 md:py-48">
      <div ref={ref} className="mx-auto max-w-4xl">
        <span className="mb-10 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
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
