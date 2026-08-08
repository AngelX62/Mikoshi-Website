"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  DURATION,
  EASE_OUT_EXPO,
  SCROLL,
  STAGGER,
  prefersReducedMotion,
} from "@/lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /**
   * Wipe each direct child in sequence rather than the block as a whole.
   *
   * Use this where a section has several units that should arrive in order.
   * Pick the children so they *are* those units: this deliberately has no
   * selector escape hatch, because the moment one exists every section starts
   * choreographing itself and the page goes back to having several vocabularies.
   */
  stagger?: boolean;
};

/**
 * The site's one arrival gesture: type wiping up from behind a mask.
 *
 * There used to be two components. This wiped single headings, and `Reveal`
 * faded and translated everything else, which meant a section's heading and its
 * body arrived by different means. Two gestures for one job reads as
 * indecision, and the fade was the more generic of the pair, so it is gone and
 * this absorbed its staggering.
 *
 * Reuses the `.line-mask` rule in globals.css, including the padding and
 * negative margin pair that stops the mask clipping descenders.
 *
 * `yPercent`, not `y`: headings here are clamped against viewport width, so a
 * pixel offset would under- or overshoot the mask at other sizes.
 */
export default function Wipe({
  children,
  className,
  delay = 0,
  stagger = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const masks = Array.from(el.querySelectorAll<HTMLElement>(":scope > .line-mask"));
    const inner = masks
      .map((m) => m.firstElementChild)
      .filter((n): n is HTMLElement => n instanceof HTMLElement);
    if (inner.length === 0) return;

    // The spans carry no hidden state in CSS, so leaving them alone is readable.
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
          stagger: stagger ? STAGGER.base : 0,
          delay,
          scrollTrigger: { trigger: el, start: SCROLL.enter, once: true },
          // The mask has done its job once the content has landed, and leaving
          // `overflow: hidden` in place afterwards would clip anything that
          // legitimately paints outside its box for the rest of the visit —
          // most importantly the focus ring on the waitlist input, which sits
          // inside one of these in the footer.
          onComplete: () => {
            masks.forEach((m) => {
              m.style.overflow = "visible";
            });
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay, stagger]);

  return (
    <div ref={ref} className={className}>
      {stagger ? (
        Children.map(children, (child) => (
          <span className="line-mask">
            <span>{child}</span>
          </span>
        ))
      ) : (
        <span className="line-mask">
          <span>{children}</span>
        </span>
      )}
    </div>
  );
}
