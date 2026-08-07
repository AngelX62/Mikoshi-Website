/**
 * The dither engine behind the hero.
 *
 * A grid of square cells is drawn on black. Each cell's brightness comes from
 * three sources — the wordmark mask, a moving light, and a faint ambient floor —
 * and that brightness is then quantised through an ordered (Bayer) dither, which
 * is what produces the crosshatch texture rather than smooth grey.
 *
 * The one performance decision that matters: cells are bucketed by brightness
 * level and drawn bucket by bucket, so a frame costs LEVELS fillStyle
 * assignments instead of one per cell. At ~30k cells the naive version is a
 * slideshow; this holds 60fps.
 */

import { clamp } from "./motion";

/**
 * Classic 4x4 ordered-dither threshold matrix, normalised to 0..1.
 *
 * Exported because the statement text resolves in this same order — the type
 * and the field quantise by the identical pattern, which is the whole point.
 */
export const BAYER_4 = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);

/** Number of discrete brightness levels. Level 0 is "not drawn". */
export const LEVELS = 8;

/**
 * Precomputed sine, already mapped to 0..1, for the ambient shimmer.
 * A Math.sin per cell per frame is tens of thousands of transcendental calls a
 * second for an effect that only needs to look irregular — a table lookup is
 * indistinguishable and far cheaper.
 */
const SIN_STEPS = 1024;
const SIN_LUT = new Float32Array(SIN_STEPS);
for (let i = 0; i < SIN_STEPS; i++) {
  SIN_LUT[i] = 0.5 + 0.5 * Math.sin((i / SIN_STEPS) * Math.PI * 2);
}

/** Size of the square drawn in each cell, as a fraction of the pitch. */
export const DOT_RATIO = 0.34;

/**
 * Cell pitch in CSS pixels.
 *
 * Pitch is driven by the wordmark, not by the screen. What matters is how many
 * cells fall across each letter — below about ten the letterforms stop
 * resolving — and the wordmark is sized as a fraction of viewport width. So
 * pitch scales *with* width, which means a narrow screen needs a finer grid,
 * not a coarser one. It can afford it: it has a fraction of the area.
 *
 * The cell budget is the backstop. Cost is close to linear in cell count
 * (it's dominated by per-cell fillRect volume, not by pixels), so on a large
 * display the grid is coarsened until it fits the budget. That still leaves
 * ~20 cells per letter at 2560px wide, well clear of the legibility floor.
 */
const PITCH_PER_PX = 1 / 210;
const MIN_PITCH = 4.5;
const MAX_PITCH = 10;
const CELL_BUDGET = 30_000;

export function spacingFor(width: number, height: number): number {
  const pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, width * PITCH_PER_PX));
  if ((width / pitch) * (height / pitch) <= CELL_BUDGET) return pitch;
  return Math.sqrt((width * height) / CELL_BUDGET);
}

export type Grid = {
  cols: number;
  rows: number;
  spacing: number;
  dotSize: number;
  count: number;
  /** Resting position of each cell, in CSS pixels. */
  x: Float32Array;
  y: Float32Array;
  /** Bayer threshold for the cell, from its column/row parity. */
  threshold: Float32Array;
  /** Wordmark coverage, 0..1. Rebuilt whenever the canvas resizes. */
  mask: Float32Array;
  /** A second mask, for the footer bookend. Same buffer shape as `mask`. */
  maskAlt: Float32Array;
  /** Per-cell dispersal vector, and a scatter offset for the intro resolve. */
  driftX: Float32Array;
  driftY: Float32Array;
  scatterX: Float32Array;
  scatterY: Float32Array;
  /** Per-cell shimmer phase, as an index into SIN_LUT. */
  phase: Uint16Array;
};

export function buildGrid(width: number, height: number, spacing: number): Grid {
  const cols = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;
  const count = cols * rows;

  const grid: Grid = {
    cols,
    rows,
    spacing,
    dotSize: Math.max(1, Math.round(spacing * DOT_RATIO * 2) / 2),
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    threshold: new Float32Array(count),
    mask: new Float32Array(count),
    maskAlt: new Float32Array(count),
    driftX: new Float32Array(count),
    driftY: new Float32Array(count),
    scatterX: new Float32Array(count),
    scatterY: new Float32Array(count),
    phase: new Uint16Array(count),
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      grid.x[i] = col * spacing;
      grid.y[i] = row * spacing;
      grid.threshold[i] = BAYER_4[(row & 3) * 4 + (col & 3)];

      // Dispersal fans outward from centre, so scrolling feels like the field
      // is being blown apart rather than sliding as a sheet.
      const dx = grid.x[i] - width / 2;
      const dy = grid.y[i] - height / 2;
      const len = Math.hypot(dx, dy) || 1;
      const spread = 0.6 + Math.random() * 0.8;
      grid.driftX[i] = (dx / len) * spread;
      grid.driftY[i] = (dy / len) * spread - 0.35;

      grid.scatterX[i] = (Math.random() - 0.5) * spacing * 9;
      grid.scatterY[i] = (Math.random() - 0.5) * spacing * 9;
      grid.phase[i] = (Math.random() * SIN_STEPS) | 0;
    }
  }

  return grid;
}

/**
 * Renders `text` to an offscreen canvas and samples it onto the grid, filling
 * `grid.mask` with per-cell coverage. Auto-fits the type to `widthRatio` of the
 * canvas so the wordmark holds its proportions at any viewport size.
 */
export function sampleTextMask(
  grid: Grid,
  text: string,
  width: number,
  height: number,
  fontFamily: string,
  opts: {
    widthRatio?: number;
    centerY?: number;
    letterSpacing?: string;
    /** Which buffer to fill. `maskAlt` holds the footer bookend. */
    into?: "mask" | "maskAlt";
  } = {},
): void {
  const {
    widthRatio = 0.72,
    centerY = 0.5,
    letterSpacing = "0.06em",
    into = "mask",
  } = opts;

  const buffer = grid[into];
  buffer.fill(0);
  if (width <= 0 || height <= 0) return;

  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.floor(width));
  off.height = Math.max(1, Math.floor(height));
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, off.width, off.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";

  // `letterSpacing` is Chromium-only; harmless where unsupported.
  type SpacedContext = CanvasRenderingContext2D & { letterSpacing?: string };
  (ctx as SpacedContext).letterSpacing = letterSpacing;

  // Fit by measuring once at a reference size and scaling — one extra measure
  // beats a binary search and is exact for a linear font metric.
  const target = width * widthRatio;
  const reference = 100;
  ctx.font = `600 ${reference}px ${fontFamily}`;
  const measured = ctx.measureText(text).width || 1;
  let fontSize = (target / measured) * reference;
  fontSize = Math.min(fontSize, height * 0.42);

  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  ctx.fillText(text, width / 2, height * centerY);

  const data = ctx.getImageData(0, 0, off.width, off.height).data;

  for (let i = 0; i < grid.count; i++) {
    const px = Math.round(grid.x[i]);
    const py = Math.round(grid.y[i]);
    if (px < 0 || py < 0 || px >= off.width || py >= off.height) continue;
    // Red channel is enough — the mask is drawn in pure white on black.
    buffer[i] = data[(py * off.width + px) * 4] / 255;
  }
}

/**
 * Reusable scratch space, so a frame allocates nothing.
 *
 * `index[level]` holds the cell ids that landed in that brightness level this
 * frame; `posX`/`posY` cache each cell's displaced position so the draw pass
 * doesn't recompute it. Caching by cell id rather than per level keeps this at
 * two `count`-sized buffers instead of LEVELS × count.
 */
export type Buckets = {
  index: Int32Array[];
  size: Int32Array;
  posX: Float32Array;
  posY: Float32Array;
};

export function createBuckets(count: number): Buckets {
  return {
    index: Array.from({ length: LEVELS }, () => new Int32Array(count)),
    size: new Int32Array(LEVELS),
    posX: new Float32Array(count),
    posY: new Float32Array(count),
  };
}

/**
 * How much of the field survives past the hero.
 *
 * The field is the site's whole identity, so it doesn't die when the hero
 * scrolls away — it settles to a faint ambient grid that persists the length of
 * the page. Far below text contrast, but present.
 */
export const FIELD_FLOOR = 0.75;

export type FrameState = {
  /** 0..1 intro resolve: scattered and dark → settled and lit. */
  intro: number;
  /** 0..1 scroll dispersal: wordmark holds → field scatters → field re-forms. */
  scroll: number;
  /** 0..1 gain on the footer bookend mask. */
  altGain: number;
  /** Momentary brightening, 0..1 — used to pulse on waitlist submit. */
  pulse: number;
  /**
   * 0..1 opening title sequence. Gates the field behind a front expanding from
   * the centre, so the page opens on a point of light rather than a full grid.
   */
  open: number;
  /** Scan band: centre in CSS pixels, and its strength. */
  bandY: number;
  bandGain: number;
  /** Point-cloud sphere: radius in CSS pixels, and its strength. */
  orbR: number;
  orbGain: number;
  /**
   * 0 = solid sphere, 1 = hollow shell.
   *
   * Ramped toward 1 as the sphere expands, so it breaks up into a thinning ring
   * rather than inflating into a uniform wash of dots.
   */
  orbRing: number;
  lightX: number;
  lightY: number;
  /** Radius of the cursor light in CSS pixels. */
  lightRadius: number;
  time: number;
};

/**
 * Draws one frame. `ctx` is expected to already carry the devicePixelRatio
 * transform, so all maths here stays in CSS pixels.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  buckets: Buckets,
  state: FrameState,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  const {
    intro,
    scroll,
    altGain,
    pulse,
    open,
    bandY,
    bandGain,
    orbR,
    orbGain,
    orbRing,
    lightX,
    lightY,
    lightRadius,
    time,
  } = state;

  // The wordmark fades out over the first 60% of the scroll, while the field
  // itself keeps drifting for the full range.
  const maskGain = intro * (1 - clamp(scroll / 0.6, 0, 1));
  const globalFade =
    FIELD_FLOOR +
    (1 - FIELD_FLOOR) * (1 - clamp((scroll - 0.15) / 0.85, 0, 1)) +
    pulse * 0.5;

  // Dispersal is a hump, not a ramp. A ramp blows the field apart and leaves it
  // apart — permanently sparse in the middle, piled at the edges. Peaking mid
  // hero and returning to zero lets the grid re-form into a calm ambient field
  // below the fold, so it reads as settling rather than breaking.
  const dispersal = Math.sin(clamp(scroll, 0, 1) * Math.PI) * 260;

  // How strongly bare field cells catch the light.
  //
  // Under a wordmark this has to stay low or the lit background washes the
  // letterforms out — that's why it's 0.13 in the hero. With no wordmark on
  // screen there is nothing to protect, so it rises and the cursor genuinely
  // illuminates the grid. Without this the field is invisible past the hero.
  const bareLight = 0.13 + 0.34 * (1 - Math.min(1, maskGain + altGain));
  const scatter = 1 - intro;

  // Opening title sequence: a front expanding from the centre. Cells only light
  // once it has passed them, so the page opens on a point of light rather than
  // a grid that is simply already there. `open` at 1 puts the front past every
  // corner, which switches the gate off for the rest of the session.
  const halfW = width / 2;
  const halfH = height / 2;
  const diagonal = Math.hypot(halfW, halfH);
  const frontR = open * diagonal * 1.25;
  const gated = open < 0.999;
  /** Width of the soft edge on the expanding front, in CSS pixels. */
  const FRONT_FEATHER = 190;

  // Passage shapes are computed here rather than rasterised into a mask: they
  // move every frame, and a getImageData per frame is orders of magnitude too
  // slow. A band is an abs and a compare; the sphere is one sqrt.
  const bandActive = bandGain > 0.002;
  const orbActive = orbGain > 0.002;
  /** Falloff of the scan band either side of its centre, in CSS pixels. */
  const BAND_HALF = 74;
  const invOrbR = orbR > 0 ? 1 / orbR : 0;
  const invRadius = 1 / lightRadius;
  const invRadius2 = invRadius * invRadius;
  const ambient = 0.055 * intro;
  const half = grid.dotSize / 2;
  /** Shimmer clock, as a LUT offset. Hoisted out of the per-cell loop. */
  const tIdx = (time * 0.179) | 0;

  buckets.size.fill(0);

  for (let i = 0; i < grid.count; i++) {
    const px = grid.x[i] + grid.scatterX[i] * scatter + grid.driftX[i] * dispersal;
    const py = grid.y[i] + grid.scatterY[i] * scatter + grid.driftY[i] * dispersal;

    // Cheap early-out: skip anything already off-canvas.
    if (px < -8 || py < -8 || px > width + 8 || py > height + 8) continue;

    // Opening gate. Only paid for while the intro is running.
    let gate = 1;
    if (gated) {
      const gr = Math.hypot(px - halfW, py - halfH);
      if (gr > frontR) continue;
      gate = clamp((frontR - gr) / FRONT_FEATHER, 0, 1);
    }

    // Light falloff. Squared distance avoids a sqrt in the hot loop.
    const dx = px - lightX;
    const dy = py - lightY;
    const d2 = (dx * dx + dy * dy) * invRadius2;

    // Two terms: a tight core plus a much wider, weaker halo. A single falloff
    // terminates at its radius and leaves a visible disc edge; the wide term
    // feathers that boundary away.
    const core = d2 < 1 ? (1 - d2) * (1 - d2) : 0;
    const w = d2 * 0.2;
    const halo = w < 1 ? (1 - w) * (1 - w) : 0;
    const lit = core * 0.72 + halo * 0.38;

    // The light *reveals* the wordmark rather than competing with it. Mask
    // cells hold a floor of brightness everywhere and bloom where lit; bare
    // field cells barely catch the light at all. Without that asymmetry the
    // letterforms wash out inside the halo and the wordmark disappears.
    // `maskAlt` is the footer bookend, gained in as the footer arrives.
    let m = grid.mask[i] * maskGain + grid.maskAlt[i] * altGain;

    if (bandActive) {
      const d = Math.abs(py - bandY);
      if (d < BAND_HALF) {
        const f = 1 - d / BAND_HALF;
        m += f * f * bandGain;
      }
    }

    if (orbActive) {
      const ox = px - halfW;
      const oy = py - halfH;
      const r = Math.hypot(ox, oy);
      if (r < orbR) {
        // Projected point density on a sphere goes as 1/sqrt(1-(r/R)^2), which
        // is what gives a point cloud its bright rim and makes it read as a
        // sphere rather than a flat disc. It diverges at the edge, so clamp it.
        const u = r * invOrbR;
        const shell = Math.min(1 / Math.sqrt(1 - u * u + 0.0001), 3.4) / 3.4;
        // Interior fades out as `orbRing` rises, leaving only the rim.
        m += (0.25 * (1 - orbRing) + shell * 0.9) * orbGain;
      }
    }

    const base = m * (0.34 + lit * 0.85) + lit * bareLight;

    // Shimmer can only ever add `ambient`, so anything that still falls under
    // the visibility floor at full shimmer is dropped here — before paying for
    // the table lookup. Most of the field is dark, so this skips the majority
    // of cells outright.
    if ((base + ambient) * globalFade <= 0.02) continue;

    // Ambient shimmer keeps the dark field alive without reading as noise.
    const shimmer = SIN_LUT[(tIdx + grid.phase[i]) & (SIN_STEPS - 1)];
    const intensity = (base + ambient * shimmer) * globalFade * gate;

    // Ordered dither: the Bayer threshold biases the quantisation per cell,
    // turning smooth gradients into the crosshatch of the reference images.
    let level = Math.floor(intensity * LEVELS + grid.threshold[i] - 0.5);
    if (level <= 0) continue;
    if (level >= LEVELS) level = LEVELS - 1;

    buckets.index[level][buckets.size[level]++] = i;
    // Stash the displaced position so the draw pass doesn't redo this maths.
    buckets.posX[i] = px;
    buckets.posY[i] = py;
  }

  // One fillStyle assignment per level instead of one per cell. This is the
  // difference between 60fps and a slideshow.
  for (let level = 1; level < LEVELS; level++) {
    const n = buckets.size[level];
    if (n === 0) continue;

    const v = level / (LEVELS - 1);
    ctx.fillStyle = `rgba(250,250,250,${(v * 0.95).toFixed(3)})`;

    const ids = buckets.index[level];
    for (let k = 0; k < n; k++) {
      const i = ids[k];
      ctx.fillRect(
        buckets.posX[i] - half,
        buckets.posY[i] - half,
        grid.dotSize,
        grid.dotSize,
      );
    }
  }
}
