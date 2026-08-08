"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { proof } from "@/content";
import SectionLabel from "./SectionLabel";
import { fieldState, resetFieldShapes } from "@/lib/fieldState";
import { SCROLL, norm, prefersReducedMotion } from "@/lib/motion";

/**
 * The proof beat.
 *
 * A real cell, sampled through the same grid as the wordmark and the schematic
 * forms. That is the whole reason it is a field state rather than an `img`:
 * the site's argument is that work survives being re-expressed in another
 * substrate, and putting a photograph through the same halftone is that claim
 * made about the site itself.
 *
 * Almost no type. The image is the content, and the sequence just spent four
 * steps explaining the abstraction, so this is where it lands in something real.
 *
 * Not pinned. The page already carries one pin and there is nothing here to
 * read at a controlled pace.
 */
export default function Proof() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = prefersReducedMotion();

    /** Rises as the section arrives, holds across the middle, falls as it goes. */
    function apply(p: number, height: number) {
      // Well above 1 on purpose. Mask coverage feeds `base = m * (0.34 + lit)`,
      // so away from the cursor light even a fully white mask only reaches 0.34
      // and lands two levels up an eight level ramp. The wordmark escapes this
      // because the light sits on it; a photograph in the middle of the page
      // has no such luck, so it gets the headroom instead.
      const PHOTO_WEIGHT = 2.6;
      fieldState.photoGain =
        Math.min(norm(p, 0.05, 0.3), 1 - norm(p, 0.72, 0.95)) * PHOTO_WEIGHT;

      // One verification sweep across the middle of the hold, so the image is
      // read rather than merely displayed.
      const scan = norm(p, 0.34, 0.66);
      fieldState.bandY = -80 + scan * (height + 160);
      fieldState.bandGain = Math.sin(scan * Math.PI) * 0.55;
    }

    if (reduced) {
      apply(0.5, window.innerHeight);
      return () => resetFieldShapes();
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: SCROLL.scrub,
        onUpdate: (self) => apply(self.progress, window.innerHeight),
        onRefresh: (self) => apply(self.progress, window.innerHeight),
        // The field is shared, so hand it back or the photograph follows you
        // into the deployment copy at full strength.
        onLeave: () => resetFieldShapes(),
        onLeaveBack: () => resetFieldShapes(),
      });
      apply(trigger.progress, window.innerHeight);
    }, section);

    return () => {
      ctx.revert();
      resetFieldShapes();
    };
  }, []);

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col justify-end px-6 py-16 md:py-20 md:pl-24 md:pr-10"
    >
      <SectionLabel>{proof.label}</SectionLabel>

      {/*
        The photograph is drawn on canvas, which is invisible to search engines
        and screen readers, so its description lives here.
      */}
      <p className="sr-only">{proof.alt}</p>

      {/*
        Pinned to the bottom rather than spread against the label, which used to
        be the section's other flex child. Once the label moves to the margin
        there is nothing left to space it against, and a caption floating in the
        middle of a photograph is worse than one sitting under it.
      */}
      <p className="max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-ink-soft">
        {proof.caption}
      </p>
    </section>
  );
}
