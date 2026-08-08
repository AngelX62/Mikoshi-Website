"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE_OUT_EXPO, prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * A single line of type that wipes up from behind a mask on entry.
 *
 * The site had two entrance idioms: this wipe for the thesis, and `Reveal`'s
 * fade plus translate for everything else. Two gestures for one job reads as
 * indecision, and the fade is the more generic of the pair, so headlines use
 * this and `Reveal` is left to handle supporting blocks.
 *
 * Reuses the `.line-mask` rule in globals.css, including the padding and
 * negative margin pair that stops the mask clipping descenders.
 *
 * `yPercent`, not `y`: headings here are clamped against viewport width, so a
 * pixel offset would under- or overshoot the mask at other sizes.
 */
export default function Wipe({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const inner = el.querySelector<HTMLElement>(".line-mask > span");
    if (!inner) return;

    // The span carries no hidden state in CSS, so leaving it alone is readable.
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 112, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: DURATION.slow,
          ease: EASE_OUT_EXPO,
          delay,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      <span className="line-mask">
        <span>{children}</span>
      </span>
    </div>
  );
}
