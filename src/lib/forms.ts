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
/** Leaders dropping from the engram's constraints to its trace channels. */
const LINK = 21;
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
 * The Work Engram, drawn as a Marey plate.
 *
 * Étienne-Jules Marey invented the *méthode graphique* in the 1860s:
 * instruments that transcribe the forces a body exerts in motion onto a moving
 * surface, so that physical work becomes a portable, readable record. That is
 * this company's whole proposition, described a hundred and fifty years early.
 * He then invented chronophotography, which is the part that matters here:
 * **many exposures on one plate** rather than frames laid side by side, dark
 * ground, white markers on the limbs, one image holding every repetition of a
 * movement at once.
 *
 * That distinction is the entire design. The copy beside this form says a
 * recording only tells you what moved, so the form cannot be a recording, and a
 * single traced path is exactly that. **What survives superposition is not a
 * recording.** It is whatever every run of the job agreed on, which is the
 * constraint, which is why the work succeeds, which is the only part of it that
 * can be carried to a different body.
 *
 * So: one work cycle, exposed many times. The strand pinches where the runs
 * agree and swells where the job is free, which makes its width a picture of
 * tolerance. Constraints drop leaders into two trace channels underneath, the
 * graphical method beneath the chronophotograph, and the whole thing terminates
 * on an accept gate.
 *
 * What this replaced was a ring of nodes with spokes to a hub, which is the
 * standard "AI understands things" diagram and had no time in it at all, while
 * four of the six chips printed next to it name properties of time.
 */

/** How many runs of the job are on the plate. */
const EXPOSURES = 13;
/**
 * Stroke width of one exposure.
 *
 * Under the two-cell floor the rest of this file works to, and deliberately.
 * That floor exists so a line *meant to read as a line* survives the sampler,
 * and one exposure is not meant to: the bundle is the mark. A strand this thin
 * samples intermittently out at the fringe, which is exactly what a run nothing
 * else agrees with should look like.
 */
const EXPOSURE_W = 13;
/**
 * How far apart the runs drift, in pixels, at a constraint and between them.
 *
 * The minimum is not zero. Collapsed onto a single line the agreement would be
 * a hairline, and the pinch has to be the densest thing in the frame rather
 * than the thinnest.
 */
const SPREAD_MIN = 9;
const SPREAD_MAX = 66;
/**
 * Alpha per exposure, composited additively.
 *
 * This is what makes the picture mean what it claims. `sampleMask` paints white
 * on black and reads the red channel over 255, so it already carries partial
 * coverage, but opaque strokes do not accumulate: a tight knot and a wide fan
 * would both sample as 1.0 and the pinch would differ from the swell in area
 * only, never in tone. Added, the mask becomes **a histogram of runs** — it
 * saturates where the exposures coincide and the ramp drives those cells to its
 * hot end, while a lone strand out at the fringe sits on level 1. The hot core
 * and cold edge come from what the picture means rather than from a light
 * pointed at it.
 */
const EXPOSURE_ALPHA = 0.42;

/** Where along the cycle the job is pinned. Fractions of its length. */
const CONSTRAINTS = [0.12, 0.36, 0.61, 0.85];
/**
 * How far from a constraint the strand has opened up again.
 *
 * Widened from 0.11 once the shot was measured against its neighbours. The knot
 * is where the plate saturates and therefore the only part of it that reaches
 * the top of the ramp, so a narrow reach left the reconstruct at 0.7 percent
 * hot area against the observe shot's 3.5, and a beat that dim between two
 * bright ones reads as a dip in the sequence rather than as a change of
 * subject. Widening the knots buys that back without flattening the difference
 * between agreement and tolerance, which raising the alpha alone would have.
 */
const CONSTRAINT_REACH = 0.145;

/**
 * Per-run signature: two summed harmonics, from a fixed table.
 *
 * Fixed and not random, so the plate is identical on every layout and across
 * reloads. Runs that differed each time you resized would be a screensaver, not
 * a record. The pairs are chosen to be mutually non-repeating so no two runs
 * shadow each other around the whole cycle.
 */
const SIGNATURES: ReadonlyArray<readonly [number, number, number, number]> = [
  [1, 0.0, 3, 1.1],
  [2, 2.3, 5, 0.4],
  [1, 1.7, 4, 2.9],
  [3, 0.8, 7, 1.9],
  [2, 4.1, 3, 3.6],
  [1, 3.2, 6, 0.2],
  [4, 1.4, 5, 2.2],
  [2, 0.6, 7, 4.4],
  [3, 3.9, 4, 1.5],
  [1, 2.8, 5, 3.1],
  [4, 4.7, 3, 0.9],
  [2, 1.2, 6, 2.6],
  [3, 2.1, 7, 3.3],
  [1, 4.4, 4, 0.7],
  [4, 0.3, 6, 1.8],
];

/** Steps along the cycle. Enough that the strand is smooth at this pitch. */
const CYCLE_STEPS = 128;

/**
 * Vertical deflection of the cycle itself, as a fraction of the box height.
 *
 * Deliberately small next to the spread. The path is not the subject here; the
 * disagreement around it is. A cycle that swung as far as its own fan would
 * hide the thing the picture is about, and it did: the first version ran a
 * closed loop whose fan was as wide as the loop's own minor radius, so the
 * exposures filled the interior and the whole thing sampled down to a
 * rectangular smudge.
 */
const CYCLE_AMP = 0.19;

/**
 * The work cycle, as a deflection at `u` along its length.
 *
 * Open, left to right, not closed. A closed loop was the first instinct, on the
 * grounds that a cycle returns to where it began, and it is wrong twice over:
 * it encloses a region the fan then fills in, and it has no direction, where
 * this shot is read from one end to the other. Traced against time a cycle is
 * an open curve, which is what every one of Marey's own plates shows.
 *
 * Three harmonics so the path has a shape rather than a period.
 */
function cycleDeflection(u: number): number {
  const t = u * Math.PI * 2;
  return (
    0.62 * Math.sin(t * 1.0 + 0.6) +
    0.26 * Math.sin(t * 2.3 + 2.1) +
    0.12 * Math.sin(t * 4.1 + 4.0)
  );
}

/** Spread at `u`: nearly closed at a constraint, wide open between. */
function spreadAt(u: number): number {
  let nearest = 1;
  for (const c of CONSTRAINTS) {
    const d = Math.abs(u - c);
    if (d < nearest) nearest = d;
  }
  const t = Math.min(1, nearest / CONSTRAINT_REACH);
  return SPREAD_MIN + (SPREAD_MAX - SPREAD_MIN) * t;
}

/** Vertical extent of the plate inside the box, leaving room for the channels. */
const PLATE_TOP = 0.0;
const PLATE_BOTTOM = 0.7;
/** Where the cycle starts and ends across the box. */
const PLATE_X0 = 0.02;
const PLATE_X1 = 0.93;
/**
 * Leaders from each constraint down into the channels.
 *
 * Thin and faint, because they are wiring rather than subject. At `LINK` width
 * and full white they came out as four heavy posts holding up the plate, which
 * put the most emphatic thing in the frame on the least important part of it.
 * Under two cells they sample intermittently, which is how the reference gets
 * its dashed leaders without a dash pattern the grid would swallow whole.
 */
const LEADER_W = 9;
const LEADER_ALPHA = 0.5;
/** The two trace channels underneath, and where the accept gate stands. */
const CHANNEL_Y = [0.86, 1.0];
const CHANNEL_BAND = 0.115;
const GATE_X = 0.955;
const GATE_W = 0.042;

export function drawEngram(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const b = frame(w, h);

  // The plate occupies the upper two thirds; the channels hang below it.
  const plateCY = mapY(b, (PLATE_TOP + PLATE_BOTTOM) / 2);
  const x0 = mapX(b, PLATE_X0);
  const x1 = mapX(b, PLATE_X1);
  const amp = CYCLE_AMP * b.h;

  /** One point on the cycle, in canvas pixels. */
  const at = (u: number): [number, number] => [
    x0 + (x1 - x0) * u,
    plateCY + cycleDeflection(u) * amp,
  ];

  ctx.save();
  // Additive, so overlap accumulates. Without this the plate is a silhouette of
  // where the runs went rather than a record of where they agreed.
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = EXPOSURE_ALPHA;
  ctx.lineWidth = EXPOSURE_W;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let k = 0; k < EXPOSURES; k++) {
    const [a1, p1, a2, p2] = SIGNATURES[k % SIGNATURES.length];
    ctx.beginPath();
    for (let s = 0; s <= CYCLE_STEPS; s++) {
      const u = s / CYCLE_STEPS;
      const [x, y] = at(u);
      // Tangent by finite difference, then the normal to it. Offsetting along
      // the normal is what keeps the fan perpendicular to the path everywhere;
      // offsetting in y alone would collapse the spread wherever the cycle runs
      // vertically, which is precisely where two of the constraints sit.
      const [xa, ya] = at(Math.max(0, u - 0.004));
      const [xb, yb] = at(Math.min(1, u + 0.004));
      const tx = xb - xa;
      const ty = yb - ya;
      const len = Math.hypot(tx, ty) || 1;
      const theta = u * Math.PI * 2;
      const sig =
        0.72 * Math.sin(theta * a1 + p1) + 0.28 * Math.sin(theta * a2 + p2);
      const off = spreadAt(u) * sig;
      const px = x + (-ty / len) * off;
      const py = y + (tx / len) * off;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Leaders, dropping from each constraint into the channels below: this is the
  // point where a thing that held across every run gets written down.
  ctx.save();
  ctx.globalAlpha = LEADER_ALPHA;
  ctx.lineWidth = LEADER_W;
  ctx.lineCap = "butt";
  const channelTop = mapY(b, CHANNEL_Y[0] - CHANNEL_BAND * 0.5);
  for (const c of CONSTRAINTS) {
    const [cx, cy] = at(c);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, channelTop);
    ctx.stroke();
  }
  ctx.restore();

  // The graphical method, under the chronophotograph: what moved above, why it
  // worked below. Filled from the curve down to the baseline rather than
  // stroked, because a filled area is a solid mass and a polyline is an outline,
  // and this grid keeps the first and throws away the second.
  for (let ch = 0; ch < CHANNEL_Y.length; ch++) {
    const baseY = mapY(b, CHANNEL_Y[ch]);
    const band = CHANNEL_BAND * b.h;
    const cx0 = mapX(b, PLATE_X0);
    const cx1 = mapX(b, GATE_X - 0.015);
    ctx.beginPath();
    ctx.moveTo(cx0, baseY);
    const STEPS = 96;
    for (let s = 0; s <= STEPS; s++) {
      const t = s / STEPS;
      const x = cx0 + (cx1 - cx0) * t;
      // Three summed harmonics at the ratios the ground wash uses in dither.ts,
      // so the record is drawn in the same material as the field it sits in.
      // Floored well above zero: a trace that touches its own baseline breaks
      // into separate islands at this pitch and stops reading as one channel.
      const phase = ch * 1.9;
      const v =
        0.55 * Math.sin(t * 7.4 + phase) +
        0.3 * Math.sin(t * 13.1 + phase * 2.2) +
        0.15 * Math.sin(t * 24.3 + phase * 0.6);
      ctx.lineTo(x, baseY - (0.22 + 0.78 * (0.5 + 0.5 * v)) * band);
    }
    ctx.lineTo(cx1, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // The accept gate. Everything terminates on it, including the light.
  rect(ctx, b, GATE_X, PLATE_TOP, GATE_X + GATE_W, 1);
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

/**
 * Where the playhead enters the plate and where it comes to rest.
 *
 * The reconstruct shot reads the record from one end to the other, so the light
 * needs a start and a finish rather than a point to sit on. Both are taken from
 * the same numbers the drawing uses, so they cannot drift from it.
 */
export function engramEntry(w: number, h: number): [number, number] {
  const b = frame(w, h);
  return [mapX(b, 0.01), mapY(b, (PLATE_TOP + PLATE_BOTTOM) / 2)];
}

export function engramGate(w: number, h: number): [number, number] {
  const b = frame(w, h);
  return [
    mapX(b, GATE_X + GATE_W / 2),
    mapY(b, (PLATE_TOP + PLATE_BOTTOM) / 2),
  ];
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
