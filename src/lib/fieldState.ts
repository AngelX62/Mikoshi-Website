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
export const fieldState = {
  /** Vertical centre of the scan band. */
  bandY: 0,
  bandGain: 0,
  /** Radius of the point-cloud sphere. */
  orbR: 0,
  orbGain: 0,
  /** 0 = solid sphere, 1 = hollow shell. */
  orbRing: 0,
};

export function resetFieldShapes(): void {
  fieldState.bandGain = 0;
  fieldState.orbGain = 0;
  fieldState.orbRing = 0;
}
