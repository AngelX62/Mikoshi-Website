"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  DURATION,
  EASE_OUT_EXPO,
  STAGGER,
  prefersReducedMotion,
} from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** Selector for the children to stagger. Defaults to direct children. */
  target?: string;
  delay?: number;
  /** Travel distance in pixels. */
  y?: number;
  className?: string;
};

/**
 * Section entrance. Wraps children and reveals them on scroll with the shared
 * easing tokens, so every section on the site enters the same way.
 */
export default function Reveal({
  children,
  target,
  delay = 0,
  y = 28,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = target
      ? Array.from(el.querySelectorAll<HTMLElement>(target))
      : Array.from(el.children as HTMLCollectionOf<HTMLElement>);
    if (items.length === 0) return;

    // Reduced motion still needs the content visible — just show it.
    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE_OUT_EXPO,
          stagger: STAGGER.base,
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [target, delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
