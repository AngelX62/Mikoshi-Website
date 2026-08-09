"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Wires Lenis to GSAP's ticker and to ScrollTrigger.
 *
 * Both have to be driven from a single clock — left on their own, Lenis and
 * ScrollTrigger run on separate rAF loops and scroll-linked animations judder.
 */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Smooth scroll is a motion effect like any other; honour the preference.
    if (prefersReducedMotion()) {
      ScrollTrigger.refresh();
      return;
    }

    // 1.15s of smoothing was long enough that the page kept gliding well after
    // the wheel stopped, which reads as the site not following your hand rather
    // than as smoothness. Shorter still absorbs trackpad jitter, which is the
    // only thing this is here for, without the float.
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
