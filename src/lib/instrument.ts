/**
 * The instrument layer, drawn onto the field's own canvas.
 *
 * Thin annotation geometry over the dither: a dashed rule carrying a scale and
 * a fainter rule trailing it. A page where nothing measures anything reads as
 * flat however
 * good the field is, and MIKOSHI's fourth step is to physically qualify the
 * result, so a company selling judgement about whether work is good should look
 * like something being measured.
 *
 * **No circles.** They were the largest painted thing in the overlay, they
 * swept across body copy, and at up to 765px of radius they were the one part
 * that drew attention to itself rather than to the field. What replaces them is
 * a second rule: lines belong to an instrument in a way that large arcs do not.
 *
 * **No layer of its own.** This used to be a full-viewport SVG whose contents
 * changed every frame, which meant a second rasterising layer stacked on the
 * canvas. Drawing it here costs a handful of strokes in a frame that already
 * draws sixteen thousand marks.
 *
 * Geometry arrives resolved: `Instrument` owns the waypoints and the scroll
 * maths, this owns nothing but the painting.
 */

import type { instrument as InstrumentState } from "./fieldState";

/** Where the ticks sit along the rule, as fractions of the width. */
const TICKS = [
  0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88,
];

/** Dash pattern for the rule. Reset after, since the context is shared. */
const DASH: number[] = [3, 7];
/**
 * A denser dash, for the leader only.
 *
 * The rule can afford `[3, 7]` because it crosses the whole frame, so the eye
 * gets a hundred and forty dashes to integrate and reads a line. The leader is
 * about 290px long and gets twenty-nine, and it runs diagonally, so it also
 * antialiases across roughly 1.4px instead of landing on a snapped hairline.
 * Measured at the qualifying shot, the leader averaged 68.48 luma against 69.43
 * and 67.71 for control lines 26px either side of it: drawn, and invisible.
 */
const LEADER_DASH: number[] = [3, 4];
const NO_DASH: number[] = [];

export type InstrumentGeometry = typeof InstrumentState;

/**
 * Colours, resolved once from the CSS tokens rather than hard-coded, so the
 * overlay and the type stay one material. Filled by `setInstrumentInk`.
 */
// `--color-ink-faint` and `--color-ink-dim` in decimal. Written out rather than
// as hexes so they are legible here, which means a search for the token values
// will not find them: they have to be moved by hand whenever those tokens move.
let stroke = "rgba(94,86,76,1)";
let ink = "rgba(168,158,146,1)";
let font = "10px monospace";

export function setInstrumentInk(
  strokeColor: string,
  inkColor: string,
  fontSpec: string,
): void {
  stroke = strokeColor;
  ink = inkColor;
  font = fontSpec;
}

/**
 * The trailing rule's alpha as a lag, and as a held residual.
 *
 * `FOLLOW_HELD` stays well under the leading rule's 0.7 on purpose. The pair
 * has to read as a primary and a reference, an expectation against a
 * measurement, and two rules of equal weight would read as two rules rather
 * than as one instrument reporting a discrepancy.
 */
const FOLLOW_LAG = 0.28;
const FOLLOW_HELD = 0.6;
/** The offset at which the trailing rule counts as fully held rather than lagging. */
const HELD_AT = 20;

/** Radius of the circle a leader lands in. Small enough to read as a target. */
const LANDING = 4;
/** Half-length of the ticks that close a dimension line. */
const SPAN_TICK = 5;

export function drawInstrument(
  ctx: CanvasRenderingContext2D,
  g: InstrumentGeometry,
  width: number,
  readout: string,
  /** Eased scroll velocity, -1..1. The scale breathes with it. */
  velocity: number,
  /**
   * What the dimension line reads, at the one shot that draws one.
   *
   * A word rather than a figure, and deliberately: a number here would be
   * invented, which is the one thing the copy rules in content.ts forbid
   * outright. What MIKOSHI actually measures is whether the parts are good, so
   * that is what the caliper says.
   */
  measure: string = "",
): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = stroke;

  // Hairlines land on a half pixel, or a 1px stroke straddles two rows and
  // renders as a soft two-pixel band.
  const snap = (v: number) => Math.round(v) + 0.5;

  // The trailing rule, drawn first and fainter, so the pair reads as one
  // instrument tracking rather than as two lines. Scrolling separates them and
  // stillness closes them back together.
  //
  // **Except under the vision, where it is held open and has to be read.**
  //
  // 0.28 was tuned for a lag: a line that only ever exists while the page is
  // moving, where the movement itself is most of what makes it legible. Asked
  // to sit still and be looked at, it is far too faint. Measured at the
  // vision's hold pose, the leading rule read 216.45 luma against a 229.9
  // control and the trailing one read 225.89, a lift of 4 where the leading
  // rule had 13.4. Ordinary dither texture two rows away was darker than it.
  // Drawn, and invisible, which is exactly what the leader did before `8ef2225`.
  //
  // Effective coverage is the number that matters: 0.28 alpha at a 30% duty
  // cycle is 0.084, against the leading rule's 0.21.
  //
  // So presence is scaled by how far the rule is being held rather than by a
  // flat constant. It gets more visible exactly to the degree that it is
  // saying something, and the lag everywhere else is byte-identical because
  // `followOffset` is zero there. The dash is left alone: across a full frame
  // this gets 144 dashes, which integrates as a line at any alpha. The leader
  // needed a denser one because it is 290px long and diagonal.
  if (Math.abs(g.followY - g.ruleY) > 0.6) {
    const held = Math.min(Math.abs(g.followOffset) / HELD_AT, 1);
    ctx.globalAlpha = FOLLOW_LAG + (FOLLOW_HELD - FOLLOW_LAG) * held;
    ctx.setLineDash(DASH);
    ctx.beginPath();
    ctx.moveTo(0, snap(g.followY));
    ctx.lineTo(width, snap(g.followY));
    ctx.stroke();
  }

  ctx.globalAlpha = 0.7;
  ctx.setLineDash(DASH);
  ctx.beginPath();
  ctx.moveTo(0, snap(g.ruleY));
  ctx.lineTo(width, snap(g.ruleY));
  ctx.stroke();

  ctx.setLineDash(NO_DASH);

  // The scale, lengthening slightly with travel. The field already computes
  // this velocity for its own smear, so the two read as one mechanism.
  const tick = g.tick * (1 + Math.min(Math.abs(velocity), 1) * 0.9);
  if (tick > 0.3) {
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (const t of TICKS) {
      const x = snap(t * width);
      ctx.moveTo(x, snap(g.ruleY));
      ctx.lineTo(x, snap(g.ruleY) + tick);
    }
    ctx.stroke();
  }

  // The leader.
  //
  // One straight dashed run and a circle, rather than a shoulder and an elbow.
  // The rule is already the shoulder: the readout sits on it, so a line leaving
  // the rule at exactly the readout's x reads as "this label, at this point,
  // is about that place" with nothing else needed to say it.
  //
  // Drawn before the readout so the word stays the top thing in its own patch
  // of frame, and fainter than the rule so the apparatus does not start
  // competing with the specimen it is annotating.
  if (g.leaderGain > 0.01) {
    // **The leader belongs to the readout, not to the rule**, so it carries the
    // readout's ink rather than the hairline colour. That is the fix for it
    // having been invisible, and it is the right relationship rather than a
    // nudge: the line and the word are one annotation, and the line was drawn
    // in the colour of the thing it crosses instead of the thing it serves.
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.75 * g.leaderGain;
    ctx.setLineDash(LEADER_DASH);
    ctx.beginPath();
    ctx.moveTo(snap(g.readoutX), snap(g.ruleY));
    ctx.lineTo(snap(g.leaderX), snap(g.leaderY));
    ctx.stroke();
    ctx.setLineDash(NO_DASH);

    // Full strength on the landing. It is four pixels across and it is the one
    // mark that says *here*, so it should not be the faintest thing in its own
    // annotation.
    ctx.globalAlpha = g.leaderGain;
    ctx.beginPath();
    ctx.arc(g.leaderX, g.leaderY, LANDING, 0, Math.PI * 2);
    ctx.stroke();

    // The context is shared, and the dimension line below is a rule rather than
    // an annotation, so it goes back to the hairline colour.
    ctx.strokeStyle = stroke;
  }

  // The dimension line, and the only place on the page anything is measured.
  //
  // The line breaks for its own label rather than carrying it above, because a
  // figure sitting inside the run is what makes a dimension line a dimension
  // line rather than a rule with a caption. Ends are closed with ticks, which
  // is the drafting convention this whole register is quoting.
  if (g.spanGain > 0.01 && g.spanX1 > g.spanX0) {
    const y = snap(g.spanY);
    const label = measure.toUpperCase();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const half = label ? ctx.measureText(label).width / 2 + 9 : 0;
    const mid = (g.spanX0 + g.spanX1) / 2;

    ctx.globalAlpha = 0.75 * g.spanGain;
    ctx.beginPath();
    if (half > 0) {
      ctx.moveTo(snap(g.spanX0), y);
      ctx.lineTo(snap(mid - half), y);
      ctx.moveTo(snap(mid + half), y);
      ctx.lineTo(snap(g.spanX1), y);
    } else {
      ctx.moveTo(snap(g.spanX0), y);
      ctx.lineTo(snap(g.spanX1), y);
    }
    for (const x of [g.spanX0, g.spanX1]) {
      ctx.moveTo(snap(x), y - SPAN_TICK);
      ctx.lineTo(snap(x), y + SPAN_TICK);
    }
    ctx.stroke();

    if (label) {
      ctx.globalAlpha = 0.95 * g.spanGain;
      ctx.fillStyle = ink;
      ctx.fillText(label, mid, y);
    }
    ctx.textBaseline = "alphabetic";
  }

  if (g.readout > 0.01 && readout) {
    // `ink-dim`, not the stroke colour: this is text, and the hairline colour
    // measures 2.74:1 on black, well under AA. Hairlines are exempt as
    // decoration; a legible word is not.
    ctx.globalAlpha = g.readout;
    ctx.fillStyle = ink;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(readout.toUpperCase(), g.readoutX, g.ruleY - 14);
  }

  ctx.restore();
}
