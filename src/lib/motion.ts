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
