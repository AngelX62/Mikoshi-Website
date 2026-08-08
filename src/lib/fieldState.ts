/**
 * Shape state the method hands to the field.
 *
 * A plain mutable singleton rather than context or props: `Method` writes to it
 * from a scrubbed ScrollTrigger and `DitherField` reads it once per frame, so
 * scrolling never triggers a React render. Same reasoning as the pulse event in
 * `DitherField`: the canvas is outside React's world and should not be dragged
 * into it sixty times a second.
 *
 * Values are in CSS pixels. Gains are 0..1 and default to off, so the field
 * behaves exactly as it does elsewhere wherever the method is not driving it.
 */

/**
 * How many shockwaves can be in flight at once.
 *
 * The thesis lands its lines about 90ms apart, each firing one, and they live
 * for a second. A single slot would just restart the same wave repeatedly and
 * read as a stutter. One slot per line lets them overlap into a burst of
 * fronts, which is the point.
 */
export const RIPPLE_SLOTS = 5;

export const fieldState = {
  /** Vertical centre of the scan band, and its strength. */
  bandY: 0,
  bandGain: 0,

  /**
   * The method's three forms: a working cell, the structure recovered from it,
   * and that structure rebuilt in a different body. Cross-faded by `Method`.
   */
  sourceGain: 0,
  engramGain: 0,
  targetGain: 0,

  /**
   * Shockwave origins, in CSS pixels from the top of the viewport. Fired by the
   * thesis as each line lands, so the type and the field are one instrument.
   */
  rippleY: new Float32Array(RIPPLE_SLOTS),
  /** `performance.now()` when each was fired; -1 marks an empty slot. */
  rippleStart: new Float32Array(RIPPLE_SLOTS).fill(-1),
};

export function resetFieldShapes(): void {
  fieldState.bandGain = 0;
  fieldState.sourceGain = 0;
  fieldState.engramGain = 0;
  fieldState.targetGain = 0;
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
