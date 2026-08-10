"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A small square cursor, echoing the pixel mark in the reference imagery.
 *
 * Desktop only: it's enabled behind a `pointer: fine` check, and the native
 * cursor is only hidden once this is actually mounted and tracking, so a
 * touch device or a reduced-motion user is never left with no cursor at all.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    document.documentElement.classList.add("has-custom-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;
    let visible = false;

    const INTERACTIVE = "a, button, input, textarea, select, [data-cursor-grow]";

    function loop() {
      // Trailing ease — the lag is what stops it feeling like a plain cursor.
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      scale += (targetScale - scale) * 0.15;
      if (dot) {
        dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: PointerEvent) {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible && dot) {
        visible = true;
        dot.style.opacity = "1";
      }
      targetScale = (e.target as Element | null)?.closest?.(INTERACTIVE) ? 2.6 : 1;
    }

    function onLeave() {
      if (dot) dot.style.opacity = "0";
      visible = false;
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      data-chrome
      className="pointer-events-none fixed left-0 top-0 z-[60] h-2 w-2 bg-ink opacity-0 mix-blend-difference transition-opacity duration-300"
    />
  );
}
