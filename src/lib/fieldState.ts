/**
 * Shape state the passage hands to the field.
 *
 * A plain mutable singleton rather than context or props: `Passage` writes to it
 * from a scrubbed ScrollTrigger and `DitherField` reads it once per frame, so
 * scrolling never triggers a React render. Same reasoning as the pulse event in
 * `DitherField` — the canvas is outside React's world and shouldn't be dragged
 * into it sixty times a second.
 *
 * Values are in CSS pixels. Gains are 0..1 and default to off, so the field
 * behaves exactly as before wherever the passage isn't driving it.
 */
/**
 * How many shockwaves can be in flight at once.
 *
 * The premise lands five lines about 90ms apart, each firing one, and they live
 * for a second — so a single slot would just restart the same wave five times
 * and read as a stutter. One slot per line lets them overlap into a burst of
 * fronts, which is the point.
 */
export const RIPPLE_SLOTS = 5;

export const fieldState = {
  /** Vertical centre of the scan band. */
  bandY: 0,
  bandGain: 0,
  /** Radius of the point-cloud sphere. */
  orbR: 0,
  orbGain: 0,
  /** 0 = solid sphere, 1 = hollow shell. */
  orbRing: 0,

  /**
   * Shockwave origins, in CSS pixels from the top of the viewport. Fired by the
   * premise as each line lands, so the type and the field are one instrument.
   */
  rippleY: new Float32Array(RIPPLE_SLOTS),
  /** `performance.now()` when each was fired; -1 marks an empty slot. */
  rippleStart: new Float32Array(RIPPLE_SLOTS).fill(-1),
};

export function resetFieldShapes(): void {
  fieldState.bandGain = 0;
  fieldState.orbGain = 0;
  fieldState.orbRing = 0;
  fieldState.rippleStart.fill(-1);
}

/** Round-robin write position into the ripple slots. */
let rippleCursor = 0;

/** Fires a shockwave outward from `y`, given in CSS pixels down the viewport. */
export function rippleField(y: number): void {
  fieldState.rippleY[rippleCursor] = y;
  fieldState.rippleStart[rippleCursor] = performance.now();
  rippleCursor = (rippleCursor + 1) % RIPPLE_SLOTS;
}
