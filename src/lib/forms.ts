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

/** Stroke width for arms. Comfortably above the sampling pitch. */
const STROKE = 15;
/** Node radius in the engram graph. */
const NODE_R = 15;
/** Width to height of the form's bounding box. */
const ASPECT = 1.5;

type Box = { x: number; y: number; w: number; h: number };

/**
 * Where a form sits in the frame.
 *
 * The aspect is locked rather than derived per axis. Sizing width and height
 * independently against the viewport lets short or narrow windows flatten the
 * box toward 3:1, which squashes every form into an unreadable band.
 *
 * On wide screens the method puts its copy down the left, so the form is biased
 * right to stay clear of it. Narrow screens stack instead, so it centres.
 */
function frame(w: number, h: number): Box {
  const wide = w >= 768;
  const availW = wide ? w * 0.46 : w * 0.8;
  const availH = h * 0.52;

  let bw = Math.min(availW, 640);
  let bh = bw / ASPECT;
  if (bh > availH) {
    bh = availH;
    bw = bh * ASPECT;
  }

  return {
    x: wide ? w * 0.52 + (w * 0.46 - bw) / 2 : (w - bw) / 2,
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
  const rx = b.w * 0.38;
  const ry = b.h * 0.42;

  const OUTER = 6;
  const outer: Array<[number, number]> = [];
  for (let i = 0; i < OUTER; i++) {
    // Rotated so no node sits dead on the vertical axis, which would read as a
    // pointer rather than as a ring.
    const a = (i / OUTER) * Math.PI * 2 - Math.PI / 2 + 0.3;
    outer.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }

  // Off-centre, so the graph reads as directed rather than as a wheel.
  const hub: [number, number] = [cx - b.w * 0.08, cy + b.h * 0.05];

  ctx.lineWidth = STROKE * 0.6;
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

  for (const [x, y] of [...outer, hub]) {
    ctx.beginPath();
    ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
    ctx.fill();
  }
}
