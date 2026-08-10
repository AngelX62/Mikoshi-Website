"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { horizon } from "@/content";
import { rippleField } from "@/lib/fieldState";
import { prefersReducedMotion } from "@/lib/motion";
import SectionLabel from "./SectionLabel";
import Wipe from "./Wipe";

/**
 * Where this goes.
 *
 * One claim and the loop that supports it, kept short on purpose. A long vision
 * section directly after a concrete product section undoes the concrete product
 * section.
 *
 * **One ring, on arrival.** This used to run a `setInterval` firing a ring
 * every 2.6 seconds for as long as the section was on screen, on the grounds
 * that its subject is continuous rather than staged. It was the only motion on
 * the whole page driven by a clock rather than by the reader's own hand, which
 * meant it was also the only thing that moved while you were standing still
 * trying to read, forever, until you scrolled away. A section that never
 * settles is a section you cannot finish.
 *
 * It strikes once as the section arrives and is then still. Same gesture, no
 * metronome.
 */
export default function Horizon() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        end: "bottom 30%",
        // Both directions, so coming back up the page is an arrival too. Not
        // `once`: the ring is what marks entering this section, and a reader who
        // scrolls past and returns has entered it again.
        onEnter: () => rippleField(window.innerHeight * 0.5),
        onEnterBack: () => rippleField(window.innerHeight * 0.5),
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="horizon"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-32 md:py-48 md:pl-24 md:pr-10"
    >
      <SectionLabel>{horizon.label}</SectionLabel>

      {/* A measure, not a centring device. See the note in Thesis.tsx. */}
      <div className="w-full max-w-4xl">
        <Wipe stagger>
          <h2 className="mb-8 max-w-4xl text-[clamp(2.5rem,8vw,6rem)] font-medium leading-[0.98] tracking-[-0.035em]">
            {horizon.heading}
          </h2>

          <p className="max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
            {horizon.body}
          </p>
        </Wipe>
      </div>

      {/*
        The loop breaks out of the container the rest of the page lives in.
        Full width, spread edge to edge on a dashed rule, it stops being a list
        under a paragraph and becomes a scale the section is measured against.
        This is the one place the reference's device is quoted directly, and it
        lands here because this is the one section whose subject is a cycle
        rather than a step.

        `justify-between` rather than gaps: what carries the idea is that the
        verbs are distributed across the whole frame, not that they are near
        each other. Only from `md`, though. Five verbs do not fit on one line on
        a phone, and spreading a wrapped row leaves the last two marooned at
        opposite edges with a hole between them, which reads as broken rather
        than as distributed.
      */}
      <ol
        className="
          mt-20 flex w-full flex-wrap items-center gap-x-6 gap-y-3
          border-t border-dashed border-ink-faint/45 pt-6
          font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft
          md:mt-28 md:justify-between md:gap-x-4 md:tracking-[0.3em]
        "
      >
        {horizon.loop.map((verb) => (
          <li key={verb}>{verb}</li>
        ))}
      </ol>
    </section>
  );
}
