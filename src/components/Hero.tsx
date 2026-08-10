"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import DitherField from "./DitherField";
import Theme from "./Theme";
import { hero } from "@/content";
import { DURATION, EASE_OUT_EXPO, INTRO, prefersReducedMotion } from "@/lib/motion";
import { scrollToSection } from "@/lib/scroll";

export default function Hero() {
  const chromeRef = useRef<HTMLDivElement>(null);

  const jumpToThesis = () => scrollToSection("thesis");

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
    <section id="hero" className="relative h-screen w-full">
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
        <div className="flex items-start justify-between gap-8">
          <div
            data-intro
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim opacity-0"
          >
            {hero.eyebrow}
          </div>

          {/* Opposite the eyebrow, in the same register, and inside the same
              stagger: it should arrive with the rest of the chrome rather than
              sitting there while the field is still resolving. */}
          <div data-intro className="shrink-0 opacity-0">
            <Theme />
          </div>
        </div>

        <div className="flex items-end justify-between gap-8">
          <p
            data-intro
            className="max-w-md text-balance text-[clamp(1rem,2vw,1.5rem)] font-medium leading-[1.25] tracking-[-0.015em] text-ink-soft opacity-0 md:max-w-lg"
          >
            {hero.descriptor}
          </p>

          {/*
            A real control, not a label.

            It always said "Scroll" and did nothing, which on desktop is merely
            inert and below `md` is the whole problem: the rail that carries the
            page's navigation is `hidden md:flex`, so a phone had no way to move
            through 8400px of document except by dragging. One button that jumps
            to the thesis is the affordance a linear page actually needs.

            Brighter than the other instrumentation on purpose: it sits in the
            bottom-right corner where the vignette is heaviest, and it is
            wayfinding rather than decoration, so it has to clear AA there.
          */}
          <button
            type="button"
            data-intro
            onClick={jumpToThesis}
            className="pointer-events-auto flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft opacity-0 transition-colors duration-300 hover:text-accent focus-visible:text-accent"
          >
            <span>{hero.scrollCue}</span>
            <span
              aria-hidden="true"
              className="block h-px w-10 origin-left animate-pulse bg-ink-faint"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
