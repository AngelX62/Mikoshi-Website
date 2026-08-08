"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import DitherField from "./DitherField";
import { hero } from "@/content";
import { DURATION, EASE_OUT_EXPO, INTRO, prefersReducedMotion } from "@/lib/motion";

export default function Hero() {
  const chromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chromeRef.current;
    if (!el) return;

    const items = el.querySelectorAll<HTMLElement>("[data-intro]");

    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    // The chrome arrives after the dither field has resolved, so the wordmark
    // lands first and the UI settles around it.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE_OUT_EXPO,
          stagger: 0.12,
          delay: INTRO.chrome,
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative h-screen w-full">
      <DitherField text={hero.wordmark} />

      {/*
        The wordmark is drawn as canvas pixels, which are invisible to search
        engines and screen readers, so the real heading lives here.
      */}
      <h1 className="sr-only">
        {hero.wordmark}. {hero.descriptor}
      </h1>

      <div
        ref={chromeRef}
        className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-6 md:p-10"
      >
        <div
          data-intro
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim opacity-0"
        >
          {hero.eyebrow}
        </div>

        <div className="flex items-end justify-between gap-8">
          <p
            data-intro
            className="max-w-xs text-balance text-sm leading-relaxed text-ink-soft opacity-0 md:max-w-sm md:text-base"
          >
            {hero.descriptor}
          </p>

          <div
            data-intro
            // Brighter than the other instrumentation on purpose: this sits in
            // the bottom-right corner, where the vignette is heaviest, and it's
            // wayfinding rather than decoration — it has to clear AA there.
            className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft opacity-0"
          >
            <span>{hero.scrollCue}</span>
            <span className="block h-px w-10 origin-left animate-pulse bg-ink-faint" />
          </div>
        </div>
      </div>
    </section>
  );
}
