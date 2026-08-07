"use client";

import { useEffect, useRef } from "react";
import {
  buildGrid,
  createBuckets,
  renderFrame,
  sampleTextMask,
  spacingFor,
  type Buckets,
  type Grid,
} from "@/lib/dither";
import { clamp, prefersReducedMotion } from "@/lib/motion";

const MAX_DPR = 2;
/** Length of the intro resolve, in milliseconds. */
const RESOLVE_MS = 1900;

type Props = {
  /** Text drawn into the field. Mirrored as a real heading by the caller. */
  text: string;
};

export default function DitherField({ text }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    let grid: Grid | null = null;
    let buckets: Buckets | null = null;
    let width = 0;
    let height = 0;
    let raf = 0;
    let startTime = 0;
    let disposed = false;

    // Light position, and the target it eases toward.
    let lightX = 0;
    let lightY = 0;
    let targetX = 0;
    let targetY = 0;
    /** Timestamp of the last real pointer movement, for the idle drift. */
    let lastPointer = -Infinity;

    const fontFamily = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-geist-sans")
        .trim();
      return v ? `${v}, sans-serif` : "system-ui, sans-serif";
    };

    function applyMask() {
      if (!grid) return;
      sampleTextMask(grid, text, width, height, fontFamily(), {
        // Narrow viewports get a proportionally larger wordmark, or it reads as
        // a stamp floating in the middle of an empty field.
        widthRatio: width < 768 ? 0.84 : 0.66,
        centerY: 0.46,
      });
    }

    function layout() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Work in CSS pixels everywhere downstream.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      grid = buildGrid(width, height, spacingFor(width, height));
      buckets = createBuckets(grid.count);
      applyMask();

      if (lightX === 0 && lightY === 0) {
        lightX = targetX = width / 2;
        lightY = targetY = height * 0.46;
      }
    }

    /** Scroll dispersal, 0 at the top to 1 one viewport-height down. */
    function scrollProgress() {
      return clamp(window.scrollY / (window.innerHeight || 1), 0, 1);
    }

    function drawStatic() {
      if (!grid || !buckets || !ctx) return;
      renderFrame(
        ctx,
        grid,
        buckets,
        {
          intro: 1,
          scroll: scrollProgress(),
          lightX: width / 2,
          lightY: height * 0.46,
          lightRadius: Math.max(width, height) * 0.42,
          time: 0,
        },
        width,
        height,
      );
    }

    function frame(now: number) {
      if (disposed || !grid || !buckets || !ctx) return;
      if (!startTime) startTime = now;

      const elapsed = now - startTime;
      // Expo-out, so the field snaps into legibility then settles.
      const t = clamp(elapsed / RESOLVE_MS, 0, 1);
      const intro = 1 - Math.pow(2, -10 * t);

      // With no pointer for a moment, the light drifts on a slow Lissajous so
      // the field stays alive on touch devices and while idle.
      const idle = now - lastPointer > 2600;
      if (idle) {
        const s = now * 0.00013;
        targetX = width * (0.5 + Math.sin(s) * 0.26);
        targetY = height * (0.46 + Math.cos(s * 1.37) * 0.2);
      }

      // Ease toward the target; the lag is what makes the light feel weighted.
      lightX += (targetX - lightX) * (idle ? 0.014 : 0.085);
      lightY += (targetY - lightY) * (idle ? 0.014 : 0.085);

      const scroll = scrollProgress();

      renderFrame(
        ctx,
        grid,
        buckets,
        {
          intro,
          scroll,
          lightX,
          lightY,
          lightRadius: Math.min(Math.max(width, height) * 0.3, 420),
          time: now,
        },
        width,
        height,
      );

      // Once the field is fully dispersed it draws nothing — stop burning
      // frames until the user scrolls back up.
      if (scroll >= 1 && intro >= 0.999) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced || disposed) return;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function onPointerMove(e: PointerEvent) {
      lastPointer = performance.now();
      targetX = e.clientX;
      targetY = e.clientY;
      start();
    }

    function onScroll() {
      if (reduced) drawStatic();
      else start();
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        layout();
        if (reduced) drawStatic();
        else {
          // Re-run the resolve from settled, not from scattered.
          startTime = performance.now() - RESOLVE_MS;
          start();
        }
      }, 150);
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        start();
      }
    }

    layout();

    if (reduced) {
      drawStatic();
    } else {
      start();
    }

    // Webfonts usually land after first paint; the mask has to be rebuilt from
    // the real letterforms once they do, or the wordmark is drawn in a fallback.
    document.fonts?.ready.then(() => {
      if (disposed || !grid) return;
      applyMask();
      if (reduced) drawStatic();
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    />
  );
}
