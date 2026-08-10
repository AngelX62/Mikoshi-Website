"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { thesis } from "@/content";
import SectionLabel from "./SectionLabel";
import { rippleField } from "@/lib/fieldState";
import {
  DURATION,
  EASE_OUT_EXPO,
  SCROLL,
  STAGGER,
  prefersReducedMotion,
} from "@/lib/motion";

/** How far into a line's wipe the shockwave fires, in seconds. */
const RIPPLE_OFFSET = 0.42;

/**
 * The thesis.
 *
 * The job here is to be read, which rules out anything scroll-scrubbed:
 * scrubbing ties comprehension to the wheel and turns a few short lines into a
 * task. The lines fire once on entry instead, arriving whole and legible, and
 * then the reader is left alone with the paragraph.
 *
 * What carries the section is the field behind it, not the type. Each line
 * punches a shockwave outward through the dither as it lands. The words
 * themselves never distort, so nothing here makes the paragraph harder to read.
 * It just stops the background being a bystander.
 */
export default function Thesis() {
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
      // A timeline rather than one tween with `stagger`: a staggered tween
      // fires its callbacks once for the whole group, and each line needs to
      // punch the field at its own moment and its own height.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: SCROLL.enter, once: true },
      });

      lines.forEach((line, i) => {
        const at = i * STAGGER.base;

        tl.fromTo(
          line,
          { yPercent: 115, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: DURATION.slow,
            ease: EASE_OUT_EXPO,
            // yPercent, not y: the type is clamped against viewport width, so a
            // pixel offset would under- or overshoot the mask at other sizes.
          },
          at,
        );

        // Measured at fire time, not at setup: smooth scrolling means the line
        // is somewhere else on screen by the time this runs.
        tl.call(
          () => {
            const box = line.getBoundingClientRect();
            rippleField(box.top + box.height / 2);
          },
          undefined,
          at + RIPPLE_OFFSET,
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="thesis"
      // `flex-col` below `md` is load-bearing, not tidiness. `SectionLabel` is
      // only `absolute` from `md` up; below that it is a static span, and in a
      // row it becomes a sibling column that eats the left of the screen.
      // Measured at 390 it took 54px of a 342px box and squeezed the copy into
      // 273px, which is what made three of the seven hand-set breaks below wrap.
      //
      // `justify-center` centres on the main axis, which is vertical in the
      // column and horizontal in the row, so it needs releasing at `md` or the
      // copy floats back off the left edge.
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-32 md:flex-row md:items-center md:justify-start md:py-48 md:pl-24 md:pr-10"
    >
      <SectionLabel>{thesis.label}</SectionLabel>

      {/*
        `max-w-4xl` is a measure, not a way of centring. Every section hangs off
        the same left edge the label spine sits in the margin of, which is the
        one thing that makes a page of separate frames read as a single sheet.
      */}
      <div ref={ref} className="w-full max-w-4xl">

        {/*
          The lower bound is set by the narrowest phone, not by taste. These
          breaks are hand-set and each line sits in its own mask, so a line that
          wraps turns one clean reveal into a ragged two-line one and undoes the
          rhythm the copy was written for.

          Below 448px the clamp is pinned to its minimum, so this single value
          governs every phone. 1.4rem is the largest that holds all seven breaks
          at 360px. At 320px the longest line still wraps; fixing that would
          mean shrinking the type on the sizes people actually use, which is the
          worse trade. The wipe still works there, it just reads as eight lines.
        */}
        <p className="text-[clamp(1.4rem,5vw,3.5rem)] font-medium leading-[1.15] tracking-[-0.02em]">
          {thesis.lines.map((line, i) => (
            <span key={i} className="line-mask">
              <span>{line}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
