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

export function drawInstrument(
  ctx: CanvasRenderingContext2D,
  g: InstrumentGeometry,
  width: number,
  readout: string,
  /** Eased scroll velocity, -1..1. The scale breathes with it. */
  velocity: number,
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
  if (Math.abs(g.followY - g.ruleY) > 0.6) {
    ctx.globalAlpha = 0.28;
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
