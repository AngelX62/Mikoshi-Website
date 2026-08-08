"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { horizon } from "@/content";
import { rippleField } from "@/lib/fieldState";
import { prefersReducedMotion } from "@/lib/motion";
import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";
import Wipe from "./Wipe";

/** Seconds between rings while the section is in view. */
const RING_INTERVAL = 2.6;

/**
 * Where this goes.
 *
 * One claim and the loop that supports it, kept short on purpose. A long vision
 * section directly after a concrete product section undoes the concrete product
 * section.
 *
 * The field keeps emitting slow rings from the middle of the frame for as long
 * as this is on screen. It is the one section whose subject is continuous
 * rather than staged, so it gets the only motion on the page that is driven by
 * a clock instead of by scroll position.
 */
export default function Horizon() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    let timer: ReturnType<typeof setInterval> | undefined;
    const fire = () => rippleField(window.innerHeight * 0.5);

    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };

    const start = () => {
      if (timer) return;
      fire();
      timer = setInterval(fire, RING_INTERVAL * 1000);
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        end: "bottom 30%",
        // Only while visible: a timer left running would keep striking the
        // field from a section nobody is looking at.
        onEnter: start,
        onEnterBack: start,
        onLeave: stop,
        onLeaveBack: stop,
      });
    }, section);

    return () => {
      stop();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="horizon"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-32 md:py-48 md:pl-24 md:pr-10"
    >
      <SectionLabel>{horizon.label}</SectionLabel>

      <div className="mx-auto w-full max-w-4xl">
        <Reveal>
          <Wipe
            className="mb-8 max-w-4xl text-[clamp(2.5rem,8vw,6rem)] font-medium leading-[0.98] tracking-[-0.035em]"
          >
            <h2>{horizon.heading}</h2>
          </Wipe>

          <p className="max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
            {horizon.body}
          </p>
        </Reveal>
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
