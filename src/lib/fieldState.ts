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

/**
 * Which mask buffer a form channel is pointing at.
 *
 * A name rather than a number, because `renderFrame` hoists the buffer out of
 * its per-cell loop by looking it up on the grid once, and a name is what the
 * grid is keyed by.
 */
export type FormName = "maskSource" | "maskEngram" | "maskTarget";

/** Everything one section can ask the field to do. */
type Channel = {
  /**
   * The two forms in play, and the line between them.
   *
   * Only ever two, because a handover is a wipe and not a pile: ahead of
   * `wipeY` the outgoing form is still standing, behind it the incoming one has
   * already resolved. Three independent gains was the old shape, and it had the
   * failure the wipe exists to remove — measured at 1920, total form gain fell
   * to 0.17 for about 200px of scroll at the engram-to-target handover, which
   * left the frame empty under copy that was busy naming what should have been
   * in it. Worse, the ground wash is suppressed by form presence, so the
   * background *rose* as the subject left and the transition read as the field
   * swelling rather than as one body becoming another.
   *
   * With a wipe the two gains sum to roughly one at every point in the sweep,
   * so there is no gap to fall into and nothing for the wash to react to.
   */
  formOut: FormName | null;
  outGain: number;
  formIn: FormName | null;
  inGain: number;
  /** The line, in CSS pixels down the viewport, and its feather half-width. */
  wipeY: number;
  wipeSoft: number;
  /**
   * A key light for whatever form is on screen.
   *
   * Without this the only light on the page is the cursor's, which has no
   * relationship to where a form is: unlit, a form cell tops out at level 3 of
   * 8, so which part of a machine was bright came down to where the mouse
   * happened to be, and the engram shot held nothing above level 3 anywhere on
   * screen. A form should carry its own hot core and cold edge, and the light
   * should be doing something — reading the source, sitting in the engram's
   * hub, crossing from one work point to the other.
   */
  lightX: number;
  lightY: number;
  lightR: number;
  lightGain: number;
  /** A photograph, sampled through the same grid as everything else. */
  photo: number;
  /** A scan band: its centre down the viewport, and its strength. */
  bandY: number;
  band: number;
};

const empty = (): Channel => ({
  formOut: null,
  outGain: 0,
  formIn: null,
  inGain: 0,
  wipeY: 0,
  wipeSoft: 1,
  lightX: 0,
  lightY: 0,
  lightR: 1,
  lightGain: 0,
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
  formOut: FormName | null;
  outGain: number;
  formIn: FormName | null;
  inGain: number;
  wipeY: number;
  wipeSoft: number;
  formLightX: number;
  formLightY: number;
  formLightR: number;
  formLightGain: number;
  photoGain: number;
  bandY: number;
  bandGain: number;
};

/**
 * Reused, so a frame allocates nothing. `DitherField` reads it and copies the
 * values straight into the frame state.
 */
const composed: ComposedField = {
  formOut: null,
  outGain: 0,
  formIn: null,
  inGain: 0,
  wipeY: 0,
  wipeSoft: 1,
  formLightX: 0,
  formLightY: 0,
  formLightR: 1,
  formLightGain: 0,
  photoGain: 0,
  bandY: 0,
  bandGain: 0,
};

export function composeField(): ComposedField {
  const { method, proof, deployment } = channels;

  // Only the method draws these, but they compose the same way so that adding a
  // second owner later cannot reintroduce the race this replaced.
  composed.formOut = method.formOut;
  composed.outGain = method.outGain;
  composed.formIn = method.formIn;
  composed.inGain = method.inGain;
  composed.wipeY = method.wipeY;
  composed.wipeSoft = method.wipeSoft;
  composed.formLightX = method.lightX;
  composed.formLightY = method.lightY;
  composed.formLightR = method.lightR;
  composed.formLightGain = method.lightGain;

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
