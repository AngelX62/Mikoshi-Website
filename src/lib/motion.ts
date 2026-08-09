/**
 * Motion tokens.
 *
 * Every animation on the site pulls its easing and duration from here, so the
 * whole thing feels like one system instead of a pile of per-component guesses.
 * These mirror the `--ease-*` custom properties in globals.css.
 */

/** Expo-out. The workhorse: fast departure, long graceful settle. */
export const EASE_OUT_EXPO = "expo.out";
/** For anything that both starts and stops on screen. */
export const EASE_IN_OUT_SOFT = "power3.inOut";

export const DURATION = {
  /** Micro-interactions: hovers, cursor tracking. */
  fast: 0.4,
  /** Standard element entrances. */
  base: 0.6,
  /** Section reveals. */
  slow: 0.9,
  /** The hero resolve, and anything that should feel cinematic. */
  cinematic: 1.4,
} as const;

/** Stagger between siblings in a group reveal. */
export const STAGGER = {
  tight: 0.05,
  base: 0.09,
  loose: 0.14,
} as const;

/** Page-load choreography, in seconds from first paint. */
export const INTRO = {
  grainIn: 0.0,
  fieldResolve: 0.25,
  wordmark: 1.1,
  chrome: 1.7,
  total: 2.2,
} as const;

/** Scroll-linked motion. `scrub` is the lag, in seconds, behind the wheel. */
export const SCROLL = {
  /**
   * Tight enough to feel direct, loose enough to smooth wheel jitter.
   *
   * At 0.6 every scrubbed section trailed the wheel by six tenths of a second,
   * which stacked on top of Lenis's own smoothing: the method's forms and the
   * proof's photograph arrived visibly after the scroll that asked for them.
   * Two lags in series is what made the page feel disconnected from the hand.
   */
  scrub: 0.35,
  /**
   * Below this width the method stacks instead of pinning.
   *
   * It was 768, chosen only as "not a phone", and 768 cannot hold the layout it
   * was authorising: the form takes the frame from 52% of the width outward, so
   * at 768 the copy beside it gets a 238px column, which is not a column. It is
   * also where pinning starts fighting touch scrolling.
   *
   * 1152 is the width of the page's own content container, which makes it the
   * honest threshold: below the width at which the frame can hold two columns,
   * the section stacks into the listed layout, and the field runs behind the
   * copy as atmosphere instead of beside it as a subject.
   */
  pinMinWidth: 1152,
  /**
   * Where anything on the page arrives. One value, no exceptions.
   *
   * There used to be three: the thesis at 78%, the shared entrances at 82%, and
   * the instrument layer at 65%. Inside a single section the copy and the
   * geometry then landed at two different moments, which is most of why the
   * page read as a set of separate scenes rather than one continuous shot — the
   * annotation always arrived after the thing it was annotating.
   */
  enter: "top 80%",
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

/** Maps `v` from [inMin, inMax] into [0, 1], clamped. */
export const norm = (v: number, inMin: number, inMax: number) =>
  clamp((v - inMin) / (inMax - inMin || 1), 0, 1);

/** Smoothstep easing for values already in 0..1. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
