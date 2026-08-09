/**
 * Shape state the page hands to the field.
 *
 * A plain mutable singleton rather than context or props: sections write to it
 * from scrubbed ScrollTriggers and `DitherField` reads it once per frame, so
 * scrolling never triggers a React render. Same reasoning as the pulse event in
 * `DitherField`: the canvas is outside React's world and should not be dragged
 * into it sixty times a second.
 *
 * **One channel per owner, composed at read time.**
 *
 * This used to be a flat set of gains that every section wrote to directly, plus
 * a `resetFieldShapes()` that zeroed all of them. That is fine while only one
 * section is ever live, and the page stopped being that some time ago. Measured
 * at 1440x900, the proof runs from scroll 4320 to 6120 and the deployment from
 * 5220 to 7020: for a full viewport of scroll both are live and both were
 * writing `photoGain`, and when the proof left it zeroed the value the
 * deployment was driving that same frame. The method and the proof overlapped
 * the same way on the scan band.
 *
 * Last writer won, the loser was whichever section was about to become the
 * subject, and the result was a drop at exactly the boundary where the page
 * most needs to feel continuous. So a section now writes only its own channel
 * and releases only its own channel, and `composeField` decides what the canvas
 * actually gets. Overlap becomes a cross-fade instead of a fight.
 *
 * Values are in CSS pixels. Gains default to off, so the field behaves exactly
 * as it does elsewhere wherever nothing is driving it.
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

/** Everything one section can ask the field to do. */
type Channel = {
  /** The method's three forms: a working cell, its structure, another body. */
  source: number;
  engram: number;
  target: number;
  /** A photograph, sampled through the same grid as everything else. */
  photo: number;
  /** A scan band: its centre down the viewport, and its strength. */
  bandY: number;
  band: number;
};

const empty = (): Channel => ({
  source: 0,
  engram: 0,
  target: 0,
  photo: 0,
  bandY: 0,
  band: 0,
});

/**
 * One channel per section that drives the field.
 *
 * Named after the section rather than the effect, because ownership is the
 * whole point: `Proof` may only ever touch `channels.proof`.
 */
export const channels = {
  method: empty(),
  proof: empty(),
  deployment: empty(),
};

export type ChannelName = keyof typeof channels;

/** Hands a channel back. A section calls this for itself and nothing else. */
export function releaseChannel(name: ChannelName): void {
  Object.assign(channels[name], empty());
}

/**
 * The instrument's resolved geometry, in CSS pixels.
 *
 * Written by `Instrument`, which owns the waypoints and the scroll maths, and
 * read by `DitherField`, which draws it onto the canvas the field already uses.
 * Same split as the gains above and for the same reason: this changes on every
 * scroll frame and must never pass through React.
 *
 * It lives on a canvas rather than in an SVG because the overlay used to be a
 * second full-viewport layer whose contents changed every frame, sitting between
 * the field and the copy and re-rasterising alongside it. What it draws is a
 * rule, a scale and a few short strokes, which is nothing next to sixteen
 * thousand dots already being drawn one layer down.
 */
export const instrument = {
  /** The rule, and the fainter one that trails it. */
  ruleY: 0,
  followY: 0,
  /** Tick length. Zero is how a scale is put away. */
  tick: 0,
  /** Region of interest, and the arm length that reveals it. */
  bracketX: 0,
  bracketY: 0,
  bracketW: 0,
  bracketH: 0,
  arm: 0,
  /** 0..1 on the readout, the one thing here that fades. */
  readout: 0,
  readoutX: 0,
};

/**
 * Non-shape state, which has exactly one owner each and so needs no channel.
 */
export const fieldState = {
  /**
   * Which of the method's four shots is running, 0 to 3. Written by `Method`,
   * read by the instrument overlay, which annotates whatever the field holds.
   */
  shot: 0,

  /**
   * Shockwave origins, in CSS pixels from the top of the viewport. Fired by the
   * thesis as each line lands, so the type and the field are one instrument.
   */
  rippleY: new Float32Array(RIPPLE_SLOTS),
  /** `performance.now()` when each was fired; -1 marks an empty slot. */
  rippleStart: new Float32Array(RIPPLE_SLOTS).fill(-1),
};

/** What the canvas actually draws, after every live channel is combined. */
export type ComposedField = {
  sourceGain: number;
  engramGain: number;
  targetGain: number;
  photoGain: number;
  bandY: number;
  bandGain: number;
};

/**
 * Reused, so a frame allocates nothing. `DitherField` reads it and copies the
 * values straight into the frame state.
 */
const composed: ComposedField = {
  sourceGain: 0,
  engramGain: 0,
  targetGain: 0,
  photoGain: 0,
  bandY: 0,
  bandGain: 0,
};

export function composeField(): ComposedField {
  const { method, proof, deployment } = channels;

  // Only the method draws these, but they compose the same way so that adding a
  // second owner later cannot reintroduce the race this replaced.
  composed.sourceGain = method.source;
  composed.engramGain = method.engram;
  composed.targetGain = method.target;

  // The proof shows the photograph and the deployment holds it faintly behind
  // its copy. Their ranges overlap by a viewport, and `max` is what makes that
  // overlap read as one image being carried forward rather than as two sections
  // taking turns: the proof's envelope is still falling while the deployment's
  // is rising, so the larger of the two is always the one still in charge.
  composed.photoGain = Math.max(proof.photo, deployment.photo);

  // A band has a position as well as a strength, so it cannot be combined
  // termwise: averaging two bands would put a third band between them, in a
  // place neither section asked for. The stronger one wins outright and brings
  // its own `y` with it.
  if (proof.band >= method.band) {
    composed.bandGain = proof.band;
    composed.bandY = proof.bandY;
  } else {
    composed.bandGain = method.band;
    composed.bandY = method.bandY;
  }

  return composed;
}

/** Round-robin write position into the ripple slots. */
let rippleCursor = 0;

/** Fires a shockwave outward from `y`, given in CSS pixels down the viewport. */
export function rippleField(y: number): void {
  fieldState.rippleY[rippleCursor] = y;
  fieldState.rippleStart[rippleCursor] = performance.now();
  rippleCursor = (rippleCursor + 1) % RIPPLE_SLOTS;
}
