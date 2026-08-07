"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DitherText from "./DitherText";
import { statement } from "@/content";
import { SCROLL, prefersReducedMotion } from "@/lib/motion";

export default function Statement() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const holder = textRef.current;
    if (!section || !holder) return;

    const para = holder.querySelector<HTMLElement>("p");
    if (!para) return;

    // Reduced motion: the CSS already defaults to resolved, so there's nothing
    // to do but stay out of the way.
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    // Pinning against touch scrolling is fraught, so it's desktop-only. Narrow
    // viewports get the identical scrubbed resolve, just without the hold.
    const pin = window.innerWidth >= SCROLL.pinMinWidth;

    const write = (v: number) => para.style.setProperty("--p", v.toFixed(4));

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: pin ? "top top" : "top 78%",
        end: pin ? "+=110%" : "bottom 55%",
        pin: pin,
        pinSpacing: pin,
        scrub: SCROLL.scrub,
        // Progress is written straight to the custom property rather than
        // tweened. With scrub, GSAP is already interpolating the scroll
        // position; interpolating again would only add lag.
        onUpdate: (self) => write(self.progress),
        // onUpdate doesn't fire outside the trigger's range, and the CSS
        // defaults to fully resolved — so without seeding these, the text sits
        // readable and then snaps to scattered the instant the pin engages.
        onRefresh: (self) => write(self.progress),
        onLeaveBack: () => write(0),
        onLeave: () => write(1),
      });

      write(trigger.progress);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="statement"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen items-center px-6 py-32 md:px-10 md:py-48"
    >
      <div ref={textRef} className="mx-auto w-full max-w-4xl">
        <span className="mb-10 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          {statement.label}
        </span>

        <DitherText
          lines={statement.lines}
          className="text-[clamp(1.75rem,5vw,3.5rem)] font-medium leading-[1.15] tracking-[-0.02em]"
        />
      </div>
    </section>
  );
}
