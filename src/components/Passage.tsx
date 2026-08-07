"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { passage } from "@/content";
import { fieldState, resetFieldShapes } from "@/lib/fieldState";
import { SCROLL, clamp, norm, prefersReducedMotion } from "@/lib/motion";

/**
 * The wordless passage.
 *
 * Scroll drives the field through three shots — a scan band sweeping the frame,
 * points condensing into a sphere, then dispersal. The section itself renders
 * almost nothing: the canvas behind it is the content, and the only text is a
 * mono readout that reads as instrumentation.
 *
 * Shapes are written to `fieldState`, a mutable singleton the canvas polls each
 * frame, so scrubbing never re-renders React.
 */

/** Shot windows, as fractions of the pinned scroll range. */
const SCAN = { from: 0.0, to: 0.34 };
const ORB = { from: 0.36, to: 0.72 };
const DISPERSE = { from: 0.72, to: 1.0 };

export default function Passage() {
  const sectionRef = useRef<HTMLElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const readout = readoutRef.current;
    const meter = meterRef.current;
    if (!section || !readout || !meter) return;

    const reduced = prefersReducedMotion();

    /** Applies one progress value to the field and the readout. */
    function apply(p: number, height: number) {
      // Scan: a band sweeps from above the frame to below it.
      const scan = norm(p, SCAN.from, SCAN.to);
      const scanIn = Math.sin(clamp(scan, 0, 1) * Math.PI);
      fieldState.bandY = -80 + scan * (height + 160);
      fieldState.bandGain = scanIn * 0.95;

      // Volume: the sphere grows in and holds, then expands as a thinning shell
      // — a shockwave rather than a balloon. Inflating a solid sphere just
      // fills the frame with a uniform wash of dots and reads as nothing.
      const orb = norm(p, ORB.from, ORB.to);
      const blow = norm(p, DISPERSE.from, DISPERSE.to);
      const maxR = Math.min(height * 0.36, 340);
      fieldState.orbR = maxR * (0.25 + orb * 0.75) * (1 + blow * 1.7);
      fieldState.orbGain = orb * (1 - blow * 0.85) * 0.9;
      fieldState.orbRing = blow;

      const shot =
        p >= DISPERSE.from ? 2 : p >= ORB.from ? 1 : 0;
      const label = passage.shots[shot].readout;
      if (readout!.textContent !== label) readout!.textContent = label;
      meter!.style.transform = `scaleX(${p.toFixed(4)})`;
    }

    // Reduced motion gets one held frame of the most characteristic shot — the
    // sphere — with no pin and no scrub.
    if (reduced) {
      apply(0.54, window.innerHeight);
      return () => resetFieldShapes();
    }

    gsap.registerPlugin(ScrollTrigger);
    const pin = window.innerWidth >= SCROLL.pinMinWidth;

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: pin ? "top top" : "top 70%",
        end: pin ? "+=150%" : "bottom 40%",
        pin,
        pinSpacing: pin,
        scrub: SCROLL.scrub,
        onUpdate: (self) => apply(self.progress, window.innerHeight),
        onRefresh: (self) => apply(self.progress, window.innerHeight),
        // The field is shared, so the passage has to hand it back on the way
        // out — otherwise the sphere would hang around over the footer.
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
      id="passage"
      ref={sectionRef}
      aria-hidden="true"
      className="relative z-10 flex min-h-screen items-end px-6 pb-16 md:px-10 md:pb-20"
    >
      {/*
        Deliberately almost empty. The canvas behind this section is the content;
        adding a heading here would put back the thing this replaced.
      */}
      <div className="flex w-full items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
        <span ref={readoutRef} className="w-20 shrink-0">
          {passage.shots[0].readout}
        </span>
        <div className="h-px flex-1 bg-edge">
          <div
            ref={meterRef}
            className="h-full origin-left bg-ink-faint"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}
