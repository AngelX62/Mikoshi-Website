/**
 * The three forms the method sequence moves through.
 *
 * These are drawing routines handed to `sampleMask`, which rasterises them once
 * per layout and samples them onto the dither grid.
 *
 * Two constraints come from the grid itself and drive every decision below.
 *
 * The field samples one pixel per cell at a pitch of roughly seven pixels, so
 * **solid masses read and outlines do not**. An earlier version cut door
 * openings out of the machine bodies, which turned each solid into a thin
 * rectangle of dots and left the whole thing looking like wireframe boxes.
 * Everything here is filled.
 *
 * And a cell is maybe twenty dots across, which is nowhere near enough to
 * render a recognisable CNC machine. So these are not illustrations. They are
 * silhouettes that differ in the ways that make one cell a different cell:
 * which side the machine stands on, its proportion, how the arm is mounted, and
 * which way it reaches. The viewer never needs to identify a machine. They need
 * to see that the second arrangement is not the first one moved.
 */

import { SCROLL } from "./motion";

/**
 * Stroke width for arms.
 *
 * "Comfortably above the sampling pitch" was the intent and 15 was not it. The
 * sampler takes a handful of taps per cell at a pitch of 7.84 at 1920, so a
 * 15px stroke is under two cells wide and a *diagonal* one lands on about one
 * cell per column: the source cell's arm broke into scattered specks while its
 * machine body, being solid, stayed crisp. Three cells is the floor at which a
 * line survives as a line.
 */
const STROKE = 22;
/** Links in the engram graph. Wider than an arm, since they carry the reading. */
const LINK = 21;
/** Node radius in the engram graph, and the hub, which is larger. */
const NODE_R = 24;
const HUB_R = 34;
/** Width to height of the form's bounding box. */
const ASPECT = 1.5;

type Box = { x: number; y: number; w: number; h: number };

/**
 * Where the form's half of the frame begins, as a fraction of viewport width.
 *
 * Exported because the copy has to be capped against the same number. The two
 * live in different coordinate systems — the form is placed in viewport pixels,
 * the copy in a flow-laid container — and the only thing keeping them apart is
 * that they agree on where the split is. They did not, and the method's chip row
 * ran 41px into the machine at 1920.
 */
export const FORM_SPLIT = 0.52;

/**
 * Where a form sits in the frame.
 *
 * The aspect is locked rather than derived per axis. Sizing width and height
 * independently against the viewport lets short or narrow windows flatten the
 * box toward 3:1, which squashes every form into an unreadable band.
 *
 * On wide screens the method puts its copy down the left, so the form is biased
 * right to stay clear of it. Narrow screens stack instead, so it centres. The
 * threshold is the method's own pin threshold, because "wide" here means
 * exactly one thing: the layout put the copy beside the form rather than over
 * it.
 */
function frame(w: number, h: number): Box {
  const wide = w >= SCROLL.pinMinWidth;
  const availW = wide ? w * 0.46 : w * 0.8;
  const availH = h * 0.52;

  let bw = Math.min(availW, 640);
  let bh = bw / ASPECT;
  if (bh > availH) {
    bh = availH;
    bw = bh * ASPECT;
  }

  return {
    x: wide ? w * FORM_SPLIT + (w * 0.46 - bw) / 2 : (w - bw) / 2,
    y: h * 0.5 - bh / 2,
    w: bw,
    h: bh,
  };
}

/** Maps unit coordinates inside a box to canvas pixels. */
const mapX = (b: Box, u: number) => b.x + u * b.w;
const mapY = (b: Box, v: number) => b.y + v * b.h;

function rect(
  ctx: CanvasRenderingContext2D,
  b: Box,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  ctx.fillRect(mapX(b, x0), mapY(b, y0), (x1 - x0) * b.w, (y1 - y0) * b.h);
}

/** A jointed arm, drawn as a thick polyline through unit-space points. */
function arm(
  ctx: CanvasRenderingContext2D,
  b: Box,
  points: ReadonlyArray<readonly [number, number]>,
) {
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach(([u, v], i) => {
    const x = mapX(b, u);
    const y = mapY(b, v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Joints, so the arm reads as articulated rather than as a bent wire.
  for (const [u, v] of points.slice(1, -1)) {
    ctx.beginPath();
    ctx.arc(mapX(b, u), mapY(b, v), STROKE * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Source cell: tall machine standing on the left, arm on a floor pedestal to
 * the right of it, reaching back left and low.
 */
export function drawSource(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const b = frame(w, h);

  // Machine: tall and narrow, full height.
  rect(ctx, b, 0.0, 0.08, 0.32, 1.0);

  // Floor pedestal.
  rect(ctx, b, 0.7, 0.62, 0.9, 1.0);

  arm(ctx, b, [
    [0.8, 0.64],
    [0.66, 0.26],
    [0.42, 0.42],
  ]);

  // End effector at the work point.
  rect(ctx, b, 0.34, 0.35, 0.46, 0.5);
}

/**
 * Target cell: an overhead gantry running the full width, arm hanging down from
 * a carriage into a wide, low machine at the bottom right, with stock waiting
 * at the bottom left.
 *
 * The mount is the whole point. An earlier version stood a column on the left
 * and reached across, which left both cells sharing one silhouette: tall mass
 * on the left, smaller mass on the right, arm between. The change read as the
 * same cell shuffled rather than as a different body.
 *
 * A gantry loader and a floor-mounted arm are both ordinary ways to tend a
 * machine, and they are unmistakable from each other at a glance, which is
 * exactly what the sequence needs to argue.
 */
export function drawTarget(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const b = frame(w, h);

  // Overhead beam, full width.
  rect(ctx, b, 0.0, 0.0, 1.0, 0.11);
  // Carriage riding it.
  rect(ctx, b, 0.28, 0.11, 0.44, 0.2);

  // Arm hanging down into the machine.
  arm(ctx, b, [
    [0.36, 0.2],
    [0.42, 0.46],
    [0.62, 0.62],
  ]);
  rect(ctx, b, 0.56, 0.56, 0.68, 0.7);

  // Machine: wide and low, bottom right.
  rect(ctx, b, 0.5, 0.66, 1.0, 1.0);

  // Stock waiting at floor level, bottom left.
  rect(ctx, b, 0.02, 0.82, 0.22, 1.0);
}

/**
 * The Work Engram.
 *
 * Not a picture of a cell. Nodes and the links between them: the reason the
 * work succeeds, which is the thing that actually gets carried across.
 *
 * Kept sparse on purpose. An earlier version ran a chord from all seven outer
 * nodes into two inner ones, and seven lines crossing one small centre sampled
 * down to a scribble. A ring plus three spokes stays legible and still reads as
 * something with an order to it.
 */
export function drawEngram(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const b = frame(w, h);
  const cx = mapX(b, 0.5);
  const cy = mapY(b, 0.5);

  // A circle, not an ellipse fitted to the box.
  //
  // The box is 1.5:1, so radii taken per axis gave a ring half again as wide as
  // it was tall, and a squashed circle reads as a squashed circle rather than as
  // a structure. Constrained by whichever axis is tighter, it is round at every
  // viewport, and roundness is what makes the spokes read as spokes.
  const r = Math.min(b.w * 0.34, b.h * 0.44);

  const OUTER = 6;
  const outer: Array<[number, number]> = [];
  for (let i = 0; i < OUTER; i++) {
    // Rotated so no node sits dead on the vertical axis, which would read as a
    // pointer rather than as a ring.
    const a = (i / OUTER) * Math.PI * 2 - Math.PI / 2 + 0.3;
    outer.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }

  // Off-centre, so the graph reads as directed rather than as a wheel.
  const hub: [number, number] = [cx - r * 0.22, cy + r * 0.1];

  ctx.lineWidth = LINK;
  ctx.lineCap = "round";

  const link = (a: [number, number], c: [number, number]) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.stroke();
  };

  for (let i = 0; i < OUTER; i++) link(outer[i], outer[(i + 1) % OUTER]);
  // Every other node only. All six spokes would fill the middle back in.
  for (let i = 0; i < OUTER; i += 2) link(hub, outer[i]);

  for (const [x, y] of outer) {
    ctx.beginPath();
    ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
    ctx.fill();
  }

  // The hub is drawn larger than the ring's nodes because it is not one of
  // them: it is the intent the rest of the structure hangs off, and the key
  // light sits on it for the whole of the reconstruct shot.
  ctx.beginPath();
  ctx.arc(hub[0], hub[1], HUB_R, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Where the key light should sit for each form, in viewport pixels.
 *
 * These are the points the section's argument actually turns on: the source's
 * work point is where the old cell does the job, the engram's hub is the intent
 * that gets carried, and the target's work point is where the new body does the
 * same job. Exported so `Method` can move one light between them rather than
 * inventing three positions that only look right by coincidence.
 */
export function sourceWorkPoint(w: number, h: number): [number, number] {
  const b = frame(w, h);
  return [mapX(b, 0.4), mapY(b, 0.42)];
}

export function engramHub(w: number, h: number): [number, number] {
  const b = frame(w, h);
  const r = Math.min(b.w * 0.34, b.h * 0.44);
  return [mapX(b, 0.5) - r * 0.22, mapY(b, 0.5) + r * 0.1];
}

export function targetWorkPoint(w: number, h: number): [number, number] {
  const b = frame(w, h);
  return [mapX(b, 0.62), mapY(b, 0.63)];
}

/** The short side of the form's box, which every light radius is scaled from. */
export function formUnit(w: number, h: number): number {
  return frame(w, h).h;
}

/**
 * The vertical extent of the form's box, in viewport pixels.
 *
 * Anything that travels down the frame — the reading light, the wipe line —
 * travels across this rather than across the viewport. Measured at 1920x1080
 * the box occupies y 327 to 754, so a pass run over the full viewport spends
 * more than half its travel above or below every form on screen: at the middle
 * of the source-to-engram sweep the line sat at y=829, below the bottom of both
 * silhouettes, and the frame went dark in the one moment the handover was
 * supposed to be legible.
 */
export function formBand(w: number, h: number): [top: number, bottom: number] {
  const b = frame(w, h);
  return [b.y, b.y + b.h];
}
