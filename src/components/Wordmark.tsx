"use client";

import { useEffect, useRef } from "react";
import {
  buildGrid,
  createBuckets,
  renderFrame,
  sampleWordmark,
  spacingFor,
  type Buckets,
  type FrameState,
  type Grid,
} from "@/lib/halftone";

/**
 * The wordmark, sampled onto a halftone grid.
 *
 * This is the one image on the site. It draws MIKOSHI as roughly sixteen
 * thousand marks whose size and colour come from a measured ramp, which is what
 * the old canvas field did and the single thing that made the site look like
 * itself. See lib/halftone.ts for where it came from and what was cut.
 *
 * **It resolves once and then stops.** Cells arrive scattered and settle into
 * the letterforms over about a second and a half, and when that finishes the
 * animation frame loop is cancelled rather than left spinning. Nothing here
 * reacts to the cursor and nothing drifts on its own: the rule that got the
 * scroll machinery deleted was that nothing moves while the reader stands
 * still, and a title card is the last place to break it.
 *
 * **The light modulates the mark, it does not ink it.** The first version had
 * this backwards, carrying most of the mark's density in a key light the way
 * the dark theme did. On paper more light means more ink, so a falloff across
 * the wordmark read as ink running out and left the ends of the name pink. The
 * floor inks it now and the light only swings it between the top two levels.
 * See `MASK_FLOOR` in lib/halftone.ts.
 *
 * **It only runs at `lg` and up.** Below that home sets the wordmark in type,
 * because a halftone needs the mark to be physically large enough to sample and
 * at 390 it is two dots across a stroke. See the note in page.tsx.
 */

/**
 * Where the key sits in the box, and how far it reaches. Fractions of the box.
 *
 * Broad on purpose. With `KEY_LIFT` at 0.15 this only swings the mark between
 * levels six and seven, so it wants to be a slow gradient across the whole
 * width rather than a spot: a tight light at a low lift is just a smudge.
 */
const KEY = { x: 0.42, y: 0.36, rx: 0.98, ry: 1.1, gain: 1 };

/** How long the resolve takes, in milliseconds. */
const RESOLVE_MS = 1500;

/** Expo-out, matching `--ease-out-expo` in globals.css closely enough. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function Wordmark({ text }: { text: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let grid: Grid | null = null;
    let buckets: Buckets | null = null;
    let width = 0;
    let height = 0;
    let frame = 0;
    let startedAt = 0;
    let disposed = false;

    const state: FrameState = {
      intro: reduced ? 1 : 0,
      lightX: 0,
      lightY: 0,
      lightRX: 1,
      lightRY: 1,
      lightGain: KEY.gain,
    };

    /**
     * The font family that next/font actually generated.
     *
     * Read off the element rather than hard-coded, because the family name is a
     * build-time hash. Hard-coding "Archivo" would silently sample whatever the
     * fallback stack resolves to, and a wordmark sampled from the wrong face is
     * a wordmark that does not match the header two lines above it.
     */
    const familyOf = () => getComputedStyle(wrap).fontFamily;

    const draw = () => {
      if (!grid || !buckets) return;
      renderFrame(ctx, grid, buckets, state, width, height);
    };

    /**
     * Below this the box is hidden and there is nothing to draw.
     *
     * Home swaps to the type wordmark under `lg`, because a halftone of a 49px
     * mark is 2 dots across a stroke and dissolves. The guard exists so a
     * hidden box costs nothing rather than sampling a 1px canvas on every
     * resize tick. See the note in page.tsx.
     */
    const MIN_BOX = 600;

    const layout = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < MIN_BOX) {
        grid = null;
        return;
      }
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Everything downstream works in CSS pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = spacingFor(width, height);
      grid = buildGrid(width, height, spacing);
      buckets = createBuckets(grid.count);
      sampleWordmark(grid, text, width, height, familyOf());

      state.lightX = width * KEY.x;
      state.lightY = height * KEY.y;
      state.lightRX = width * KEY.rx;
      state.lightRY = height * KEY.ry;

      draw();
    };

    const tick = (now: number) => {
      if (disposed) return;
      if (!startedAt) startedAt = now;
      const t = Math.min(1, (now - startedAt) / RESOLVE_MS);
      state.intro = easeOutExpo(t);
      draw();
      // Stop, rather than idling at 60fps forever. The field is finished.
      if (t < 1) frame = requestAnimationFrame(tick);
      else frame = 0;
    };

    /**
     * Sample only once the real face is available.
     *
     * `document.fonts.ready` alone is not enough on a cold load: the face is
     * requested lazily, so the grid can be sampled from the fallback stack and
     * then never resampled. Asking for the exact cut first forces it.
     */
    let cancelled = false;
    let ready = false;
    const start = async () => {
      try {
        // 800, because that is the weight the mask is drawn at. Asking for a
        // weight nothing samples can leave the real cut unrequested.
        await document.fonts.load(`800 100px ${familyOf()}`);
        await document.fonts.ready;
      } catch {
        // A browser without the Font Loading API still renders; it just may
        // sample a frame early. Falling through is better than not drawing.
      }
      if (cancelled || disposed) return;
      ready = true;
      layout();
      if (!reduced) frame = requestAnimationFrame(tick);
    };

    void start();

    // Re-sample on resize. The grid pitch is derived from the box width, so a
    // resize is a rebuild rather than a rescale.
    //
    // Gated on `ready` rather than on `grid`, which is not the same thing and
    // was a bug: `layout` sets `grid` back to null whenever the box is under
    // MIN_BOX, so a gate on `grid` would refuse to rebuild after a window came
    // back from narrow to wide, leaving the field permanently blank.
    const observer = new ResizeObserver(() => {
      if (!ready) return;
      layout();
    });
    observer.observe(wrap);

    return () => {
      disposed = true;
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="relative w-full min-h-0 flex-1"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
