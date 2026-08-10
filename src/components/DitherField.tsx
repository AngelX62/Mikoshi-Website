"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  buildGrid,
  createBuckets,
  renderFrame,
  sampleImageMask,
  sampleMask,
  sampleTextMask,
  setFieldTheme,
  spacingFor,
  type Buckets,
  type Grid,
} from "@/lib/dither";
import { THEME_EVENT, currentTheme } from "@/lib/theme";
import { drawProofFallback, drawSource, drawTarget } from "@/lib/forms";
import { proof } from "@/content";
import {
  RIPPLE_SLOTS,
  composeField,
  fieldState,
  instrument,
} from "@/lib/fieldState";
import { drawInstrument, setInstrumentInk } from "@/lib/instrument";
import { fieldReadout } from "@/content";
import { clamp, prefersReducedMotion } from "@/lib/motion";

const MAX_DPR = 2;
/**
 * Hard ceiling on the canvas backing store, in pixels.
 *
 * Roughly a 1440p frame. Above this the field is coarsened rather than allowed
 * to draw an unbounded number of pixels every frame on a large display.
 */
const MAX_BACKING_PIXELS = 3_700_000;

/**
 * Quality tiers, coarsest first, picked at runtime from measured frame time.
 *
 * The hardware is the one variable that cannot be known in advance, so the page
 * finds its own level rather than being tuned for one machine. Density is the
 * primary lever and pixel ratio the secondary one: a dpr change is a canvas
 * resize and a `setTransform`, since the grid is built in CSS pixels and does
 * not depend on dpr at all, while a cell-count change needs `buildGrid` plus
 * six mask samplings and so has to be rare.
 *
 * It starts one below the top. The complaint that prompted this was lag, so the
 * default is the smooth one and the detail is earned.
 */
const TIERS = [
  { budget: 24_000, dpr: 1.25 },
  { budget: 34_000, dpr: 1.5 },
  { budget: 40_000, dpr: MAX_DPR },
] as const;
const START_TIER = 1;

/** Rolling frame time above which the field steps down, and below which up. */
const TIER_DOWN_MS = 14;
const TIER_UP_MS = 8;
/**
 * How long the evidence has to hold before either move, in milliseconds.
 *
 * Deliberately a duration and not a frame count. Counting frames makes the
 * controller slower to react the slower the machine is, which is exactly
 * backwards: at 20fps a 45-frame window is more than two seconds of stutter
 * before anything happens, where at 60fps it is under one.
 */
const TIER_WINDOW_MS = 700;
/**
 * Longest frame that is allowed to influence the average.
 *
 * A frame over this did not happen because the field is too dense; it happened
 * because something stalled — a garbage collection, a background tab being
 * throttled, the compositor waiting on the main thread. Feeding a 1000ms frame
 * into the average would convince the controller the machine runs at 1fps and
 * drop it to the lowest tier over one hiccup.
 */
const TIER_MAX_SAMPLE_MS = 100;
/** Minimum gap between changes, so a rebuild cannot happen twice in a second. */
const TIER_COOLDOWN_MS = 4000;
/** How long after start to begin trusting readings at all. */
const TIER_WARMUP_MS = 1800;
/** Length of the intro resolve, in milliseconds. */
const RESOLVE_MS = 1900;
/** Length of the opening title sequence, in milliseconds. */
const OPEN_MS = 2600;
/** How long a premise shockwave takes to cross the frame. */
const RIPPLE_MS = 1100;
/** Scroll rate, in px per 60fps frame, at which the smear saturates. */
const VELOCITY_FULL = 90;

/** Dispatch on `window` to flare the field. See `pulseField`. */
export const FIELD_PULSE_EVENT = "mikoshi:field-pulse";

export function pulseField() {
  window.dispatchEvent(new Event(FIELD_PULSE_EVENT));
}

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

    /**
     * Current quality tier, and the state the controller needs to move it.
     * `overBudget` and `underBudget` hold the timestamp the evidence started,
     * or 0 when it is not currently holding.
     */
    let tier = START_TIER;
    let avgFrame = 16;
    let overBudget = 0;
    let underBudget = 0;
    let lastTierChange = 0;

    // Light position, and the target it eases toward.
    let lightX = 0;
    let lightY = 0;
    let targetX = 0;
    let targetY = 0;
    /** Timestamp of the last real pointer movement, for the idle drift. */
    let lastPointer = -Infinity;
    /** Momentary brightening, decayed each frame. See `onPulse`. */
    let pulse = 0;
    /** Eased scroll velocity, -1..1. Drives the smear. See `FrameState`. */
    let velocity = 0;
    // Seeded, not zeroed: a reload part-way down the page would otherwise read
    // the whole scroll offset as one frame of travel and smear on arrival.
    let lastScrollY = window.scrollY;
    let lastFrameTime = 0;

    // Live shockwave geometry, compacted each frame. Allocated once so the
    // frame loop stays garbage-free.
    const rippleY = new Float32Array(RIPPLE_SLOTS);
    const rippleR = new Float32Array(RIPPLE_SLOTS);
    const rippleGain = new Float32Array(RIPPLE_SLOTS);
    /** Set by any visitor input; collapses the opening sequence immediately. */
    let skipOpen = reduced;

    const cssFont = (token: string, fallback: string) => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim();
      return v ? `${v}, ${fallback}` : fallback;
    };

    const fontFamily = () =>
      cssFont("--font-plex-sans", "system-ui, sans-serif");

    /**
     * The instrument's ink, taken from the same tokens the type uses so the
     * overlay and the copy read as one material rather than as a canvas colour
     * that happens to sit nearby.
     */
    function applyInstrumentInk() {
      const root = getComputedStyle(document.documentElement);
      const token = (name: string, fallback: string) =>
        root.getPropertyValue(name).trim() || fallback;
      setInstrumentInk(
        token("--color-ink-faint", "#575065"),
        token("--color-ink-dim", "#a49bb2"),
        `500 10px ${cssFont("--font-plex-mono", "monospace")}`,
      );
    }

    function applyMask() {
      if (!grid) return;
      sampleTextMask(grid, text, width, height, fontFamily(), {
        // Narrow viewports get a proportionally larger wordmark, or it reads as
        // a stamp floating in the middle of an empty field.
        widthRatio: width < 768 ? 0.84 : 0.66,
        centerY: 0.46,
      });
      // The footer bookend: the same wordmark re-condensing out of the
      // scattered field as you reach the bottom. Sat low in the viewport so it
      // lands in the footer's empty band rather than behind the copy.
      sampleTextMask(grid, text, width, height, fontFamily(), {
        widthRatio: width < 768 ? 0.78 : 0.58,
        centerY: 0.68,
        into: "maskAlt",
      });

      // The method's two forms. Rasterised once per layout rather than per
      // frame: they never move, only their gains change as the sequence runs.
      sampleMask(grid, width, height, "maskSource", drawSource);
      sampleMask(grid, width, height, "maskTarget", drawTarget);
      applyPhoto();
    }

    /**
     * The photograph, or the target cell standing in for it.
     *
     * The fallback is the point: the proof beat has to work before anyone has
     * supplied a photo, and it has to keep working if the file 404s in
     * production. Either way the section renders something true.
     */
    let photo: HTMLImageElement | null = null;

    function applyPhoto() {
      if (!grid) return;
      if (photo?.complete && photo.naturalWidth > 0) {
        sampleImageMask(
          grid,
          photo,
          photo.naturalWidth,
          photo.naturalHeight,
          width,
          height,
        );
      } else {
        // Not `drawTarget`: that one is placed for the method's two-column
        // frame. See `drawProofFallback`.
        sampleMask(grid, width, height, "maskPhoto", drawProofFallback);
      }
    }

    if (proof.src) {
      const img = new Image();
      img.decoding = "async";
      img.src = proof.src;
      img.onload = () => {
        if (disposed) return;
        photo = img;
        applyPhoto();
        if (reduced) drawStatic();
      };
      // No onerror handler beyond this: `applyPhoto` already falls back, and a
      // missing file should degrade quietly rather than blank the section.
    }

    /** Cached so the frame loop never forces a layout to find the footer. */
    let footerTop = Infinity;

    function measureFooter() {
      const el = document.getElementById("site-footer");
      footerTop = el
        ? el.getBoundingClientRect().top + window.scrollY
        : Infinity;
    }

    // The pinned sections insert spacing, which pushes the footer down the
    // document. Measuring once at mount reads a position from before those pins
    // exist, and the bookend then fires while the passage is still on screen.
    // ScrollTrigger recomputes on refresh, so re-measure with it.
    ScrollTrigger.addEventListener("refresh", measureFooter);

    /**
     * 0..1 as the footer arrives.
     *
     * Capped low on purpose. At full strength the wordmark competes with the
     * footer copy sitting over it; as a faint watermark it reads as a closing
     * bookend instead of a collision.
     */
    function footerGain() {
      if (footerTop === Infinity) return 0;
      const topInView = footerTop - window.scrollY;
      const t = clamp((height * 0.9 - topInView) / (height * 0.5 || 1), 0, 1);
      return t * 0.42;
    }

    function layout() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;

      // A ceiling on the backing store, not just on the pixel ratio.
      //
      // MAX_DPR alone bounds nothing on a large display: a 4K panel at dpr 1 is
      // already 8.3M pixels to clear and redraw every frame, and at dpr 2 it is
      // four times that. Capping the area directly is the only limit that holds
      // whatever the screen turns out to be.
      const tierDpr = TIERS[tier].dpr;
      let dpr = Math.min(window.devicePixelRatio || 1, tierDpr);
      const area = width * height * dpr * dpr;
      if (area > MAX_BACKING_PIXELS) {
        dpr = Math.max(1, dpr * Math.sqrt(MAX_BACKING_PIXELS / area));
      }

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Work in CSS pixels everywhere downstream.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      grid = buildGrid(width, height, spacingFor(width, height, TIERS[tier].budget));
      buckets = createBuckets(grid.count);
      applyInstrumentInk();
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
          altGain: footerGain(),
          ...composeField(),
          pulse: 0,
          open: 1,
          // Reduced motion gets no shockwave and no smear — both are pure
          // motion, and neither carries information the frame needs.
          rippleY,
          rippleR,
          rippleGain,
          rippleCount: 0,
          lightX: width / 2,
          lightY: height * 0.46,
          lightRadius: Math.max(width, height) * 0.42,
          velocity: 0,
          time: 0,
        },
        width,
        height,
      );
      drawInstrument(
        ctx,
        instrument,
        width,
        fieldReadout[fieldState.shot] ?? "",
        0,
      );
    }

    function frame(now: number) {
      if (disposed || !grid || !buckets || !ctx) return;
      if (!startTime) startTime = now;

      const elapsed = now - startTime;
      // Expo-out, so the field snaps into legibility then settles.
      const t = clamp(elapsed / RESOLVE_MS, 0, 1);
      const intro = 1 - Math.pow(2, -10 * t);

      // Opening title sequence: the front expands from a point at the centre.
      // Eased so it leaves quickly and decelerates into the corners; `skipOpen`
      // collapses it instantly when the visitor does anything at all.
      const ot = skipOpen ? 1 : clamp(elapsed / OPEN_MS, 0, 1);
      const open = ot >= 1 ? 1 : 1 - Math.pow(1 - ot, 3);

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

      // Pulse decays exponentially from whatever the last trigger set.
      pulse *= 0.94;
      if (pulse < 0.002) pulse = 0;

      // Scroll velocity, for the smear. Lenis runs in native-scroll mode, so
      // window.scrollY is authoritative and this stays decoupled from it — the
      // field doesn't need to know a smooth-scroll library exists. Eased, so it
      // decays off a flick instead of snapping back to still.
      const dt = Math.max(1, now - lastFrameTime);
      lastFrameTime = now;
      const y = window.scrollY;
      const raw = ((y - lastScrollY) / dt) * 16.67;
      lastScrollY = y;
      velocity += (clamp(raw / VELOCITY_FULL, -1, 1) - velocity) * 0.18;

      // Premise shockwaves. The clock lives here rather than in renderFrame,
      // which takes concrete geometry and owns no timers — same split as the
      // orb. Slots retire themselves, so spent ripples cost nothing.
      let rippleCount = 0;
      for (let s = 0; s < RIPPLE_SLOTS; s++) {
        const started = fieldState.rippleStart[s];
        if (started < 0) continue;

        const t = (now - started) / RIPPLE_MS;
        if (t >= 1) {
          fieldState.rippleStart[s] = -1;
          continue;
        }

        rippleY[rippleCount] = fieldState.rippleY[s];
        rippleR[rippleCount] = t * height * 0.9;
        // Struck hard and decaying quadratically — at parity with the passage's
        // scan band at t=0, gone well before it reaches the frame edge.
        rippleGain[rippleCount] = (1 - t) * (1 - t);
        rippleCount++;
      }

      renderFrame(
        ctx,
        grid,
        buckets,
        {
          intro,
          scroll: scrollProgress(),
          altGain: footerGain(),
          ...composeField(),
          pulse,
          open,
          rippleY,
          rippleR,
          rippleGain,
          rippleCount,
          lightX,
          lightY,
          lightRadius: Math.min(Math.max(width, height) * 0.3, 420),
          velocity,
          time: now,
        },
        width,
        height,
      );

      // The annotation shares the field's canvas, its clock and its velocity.
      drawInstrument(
        ctx,
        instrument,
        width,
        fieldReadout[fieldState.shot] ?? "",
        velocity,
      );

      // Quality control.
      //
      // Frame time is measured rather than assumed, because the hardware is the
      // one variable that cannot be known in advance. A rolling average smooths
      // out single bad frames, and both directions need sustained evidence and a
      // cooldown, so a rebuild cannot happen twice in a second or oscillate
      // between two tiers that both sit near the threshold.
      if (elapsed > TIER_WARMUP_MS) {
        avgFrame += (Math.min(dt, TIER_MAX_SAMPLE_MS) - avgFrame) * 0.08;
        if (avgFrame > TIER_DOWN_MS) {
          if (!overBudget) overBudget = now;
          underBudget = 0;
        } else if (avgFrame < TIER_UP_MS) {
          if (!underBudget) underBudget = now;
          overBudget = 0;
        } else {
          overBudget = 0;
          underBudget = 0;
        }

        const settled = now - lastTierChange > TIER_COOLDOWN_MS;
        const down =
          overBudget > 0 && now - overBudget > TIER_WINDOW_MS && tier > 0;
        const up =
          underBudget > 0 &&
          now - underBudget > TIER_WINDOW_MS &&
          tier < TIERS.length - 1;
        if (settled && (down || up)) {
          tier += down ? -1 : 1;
          lastTierChange = now;
          overBudget = 0;
          underBudget = 0;
          avgFrame = 16;
          // `layout` only, not a ScrollTrigger refresh. The canvas is fixed and
          // its backing store has no effect on document layout, so refreshing
          // would re-measure and re-pin every trigger on the page for nothing —
          // an expensive hitch at the exact moment the field is already
          // rebuilding because frames were slow.
          layout();
        }
      }

      // The field now runs the length of the page rather than stopping past the
      // hero, so the loop keeps going. Cost stays bounded by the visibility
      // pause below, by the cell budget in `spacingFor` and by the tier above.
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

    /**
     * Any input at all ends the opening sequence.
     *
     * Someone returning to the site should never be made to sit through a title
     * card again, and a visitor who starts scrolling has told you they're ready.
     */
    function onSkip() {
      skipOpen = true;
      start();
    }

    function onScroll() {
      skipOpen = true;
      if (reduced) drawStatic();
      else start();
    }

    /**
     * Fired by the waitlist on submit — sending an address is itself a sample,
     * so the field flares. Decoupled via a DOM event so nothing needs to thread
     * a ref down through the tree.
     */
    function onPulse() {
      pulse = 1;
      start();
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        layout();
        measureFooter();
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

    /**
     * The ground changed under the field.
     *
     * The ramp declares its colours as they should appear *already composited*
     * onto the page's background, and the canvas is cleared rather than filled,
     * so the two have to be switched together or every mark on the page is
     * painted for a background that is no longer there.
     *
     * `applyInstrumentInk` inside `layout` re-reads the overlay's stroke
     * colours from the same CSS tokens the copy uses, which is why this is a
     * relayout rather than just a fill rebuild. It is also why nothing here
     * touches the grid or the masks: geometry does not depend on the ground.
     */
    function onThemeChange() {
      setFieldTheme(currentTheme());
      layout();
      if (reduced) drawStatic();
      else start();
    }

    setFieldTheme(currentTheme());
    layout();
    measureFooter();

    if (reduced) {
      drawStatic();
    } else {
      start();
    }

    // Webfonts usually land after first paint; the mask has to be rebuilt from
    // the real letterforms once they do, or the wordmark is drawn in a fallback.
    // The field's own hot-level glyphs need no such handling: they are a dot
    // matrix the engine draws itself, not type.
    document.fonts?.ready.then(() => {
      if (disposed || !grid) return;
      applyMask();
      if (reduced) drawStatic();
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onSkip, { passive: true });
    window.addEventListener("wheel", onSkip, { passive: true });
    window.addEventListener("touchstart", onSkip, { passive: true });
    window.addEventListener("keydown", onSkip);
    window.addEventListener("resize", onResize);
    window.addEventListener(FIELD_PULSE_EVENT, onPulse);
    window.addEventListener(THEME_EVENT, onThemeChange);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ScrollTrigger.removeEventListener("refresh", measureFooter);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onSkip);
      window.removeEventListener("wheel", onSkip);
      window.removeEventListener("touchstart", onSkip);
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(FIELD_PULSE_EVENT, onPulse);
      window.removeEventListener(THEME_EVENT, onThemeChange);
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
