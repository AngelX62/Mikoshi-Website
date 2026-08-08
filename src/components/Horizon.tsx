"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { horizon } from "@/content";
import { rippleField } from "@/lib/fieldState";
import { prefersReducedMotion } from "@/lib/motion";
import Reveal from "./Reveal";
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
      className="relative z-10 flex min-h-screen items-center px-6 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto w-full max-w-4xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {horizon.label}
        </span>

        <Reveal>
          <Wipe
            className="mb-8 text-[clamp(2.5rem,8vw,6rem)] font-medium leading-[0.98] tracking-[-0.035em]"
          >
            <h2>{horizon.heading}</h2>
          </Wipe>

          <p className="mb-16 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
            {horizon.body}
          </p>

          {/*
            The loop reads as a sequence rather than a list: hairline rules
            between the verbs, wrapping on narrow screens. It is the same
            ordered-process device as the method spine, at a smaller scale.
          */}
          <ol className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-edge pt-8 font-mono text-[11px] uppercase tracking-[0.22em]">
            {horizon.loop.map((verb, i) => (
              <li key={verb} className="flex items-center gap-5">
                <span className="text-ink-soft">{verb}</span>
                {i < horizon.loop.length - 1 && (
                  <span aria-hidden="true" className="h-px w-6 bg-edge" />
                )}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
