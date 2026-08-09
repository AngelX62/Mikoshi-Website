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

const TAU = Math.PI * 2;

/** Classic 4x4 ordered-dither threshold matrix, normalised to 0..1. */
const BAYER_4 = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);

/** Number of discrete brightness levels. Level 0 is "not drawn". */
export const LEVELS = 8;

/**
 * The level ramp — where the site's colour lives.
 *
 * A dither ramp is a palette, so the tint belongs here rather than in a wash
 * laid over the page.
 *
 * One colour per level rather than a lerp between two endpoints. A two-point
 * ramp puts every cell on the page on a single line through colour space, and
 * the line from violet to white passes through desaturated mid-lilac on the way,
 * so the midtones — which is most of the field — arrive greyer than either end.
 * Hue has to be a dimension of the image, not a constant with brightness laid
 * over it.
 *
 * The shape of the ramp is *cold shadow, hot highlight*: it opens at an indigo
 * dark enough to read as near-black, holds ashy violet through the populated
 * midtones, and only picks up rose and a warm white at the top. So the page
 * still reads purple, and heat appears exactly where light actually lands — the
 * wordmark core, the cursor, the bloom.
 *
 * Heat belongs at the top for a measured reason, not a taste one. See
 * `ALPHA_BIAS`: chroma only survives compositing where alpha is high, and
 * levels 6 and 7 are the only place on this ramp with the headroom to hold a
 * saturated hue at all.
 *
 * These are the colours **as they should appear on screen**, already composited
 * onto black. That is not how the previous version was written and it is the
 * whole reason it was hard to tune: cells are painted with alpha proportional
 * to level, compositing scales all three channels together, and so the channel
 * spread that carries hue shrinks with it. A colour picked to look right in the
 * source turns to neutral grey by the time it is painted at 0.3.
 *
 * Declaring the target and dividing back out by the alpha means the numbers
 * below are the ones you can actually check against a screenshot.
 */
const RAMP_ON_BLACK: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0], //             L0  never drawn
  // L1 and L2 carry the ground, and they sit right on the edge of being seen at
  // all: below about luminance 24 an 8-bit sRGB colour has no room left to show
  // hue. Measured at the first pass of these values, 61% of everything drawn
  // landed under that line. They are pitched just clear of it on purpose.
  [31, 27, 56], //          L1  indigo, the ground speckle
  [55, 46, 96], //          L2  indigo
  [64, 52, 108], //         L3  deep violet
  [92, 73, 144], //         L4  violet
  [130, 101, 176], //       L5  lilac
  [186, 132, 170], //       L6  rose, where the heat starts
  [240, 226, 222], //       L7  hot white, warm cast
];

/**
 * Alpha is deliberately *not* linear in level.
 *
 * Below about luminance 24 there is no room left in 8-bit sRGB to see any
 * colour at all. With a linear curve roughly four fifths of the drawn field
 * landed in exactly that band: present, but neither visible nor violet. Lifting
 * the low and middle levels puts the populated part of the ramp where chroma
 * has headroom, which is what makes the ambient field read as dusty rather than
 * as black-on-black.
 */
const ALPHA_BIAS = 0.55;

/** Alpha for a level, on the biased curve above. */
function levelAlpha(level: number): number {
  return Math.pow(level / (LEVELS - 1), ALPHA_BIAS) * 0.95;
}

/**
 * What to actually paint, so that painting it at `levelAlpha` lands on the
 * target above. Baked into strings once at module load, so the draw loop builds
 * nothing per frame.
 */
const LEVEL_FILL: string[] = Array.from({ length: LEVELS }, (_, level) => {
  const alpha = levelAlpha(level) || 1;
  const c = (i: number) =>
    Math.min(255, Math.round(RAMP_ON_BLACK[level][i] / alpha));
  return `rgba(${c(0)},${c(1)},${c(2)},${alpha.toFixed(3)})`;
});

/**
 * Dot size per level, as a multiple of `grid.dotSize`.
 *
 * This is what makes the field a halftone rather than a grid of identical dots
 * at varying opacity. In a real halftone the *dot grows* with tone: shadows are
 * sparse specks, highlights are fat and nearly touching. Brightness alone gives
 * an even grey texture no matter how the ramp is tuned, which is why the field
 * read flat next to the reference images.
 *
 * Free, because cells are already bucketed by level: the size is computed once
 * per bucket, not once per cell.
 */
// Range chosen against the pitch, not in the abstract. At the desktop pitch a
// level 1 speck covers about a quarter of the cell's width and a level 7 mark
// about three quarters, so shadows are sparse and highlights nearly touch,
// which is the spread the reference halftones have. Narrower than this and the
// midtones all read as the same even grey texture.
const DOT_MIN = 0.55;
const DOT_MAX = 1.7;
const DOT_SCALE = Array.from(
  { length: LEVELS },
  (_, level) => DOT_MIN + (level / (LEVELS - 1)) * (DOT_MAX - DOT_MIN),
);

/**
 * Bloom.
 *
 * The top levels carry a halo, so lit cells fade out instead of ending at a
 * hard edge. Without it the brightest thing on the page is a flat pale mark,
 * which reads as paint rather than as something emitting light.
 *
 * Confined to the hottest levels on purpose: those buckets hold the fewest
 * cells, and bloom on the midtones would fog the black ground the reference
 * images depend on.
 *
 * Two concentric rings rather than a radial gradient. A gradient means one
 * paint per cell, which is the thing the batched draw exists to avoid; two flat
 * rings are two more batched fills over the sparsest buckets on the ramp, and
 * at these sizes the step between them is invisible.
 */
const BLOOM_FROM = LEVELS - 2;
const BLOOM_RINGS: ReadonlyArray<{ scale: number; alpha: number }> = [
  { scale: 2.6, alpha: 0.05 },
  { scale: 1.7, alpha: 0.09 },
];

/**
 * The hot levels are drawn as characters rather than as dots.
 *
 * The field is a machine's work being sampled, and where the sample is
 * strongest it should read as data rather than as texture. Confined to the top
 * two levels for two reasons: those cells are the largest on the ramp, which is
 * the only size at which a character survives at all, and they are the
 * sparsest, so nothing here turns into a wall of falling glyphs.
 *
 * **Drawn as a 3x5 dot matrix, not as type.** `fillText` was measured at 54
 * microseconds a call — 886 hot cells cost 47ms, three whole frames, for the
 * hot levels alone. A matrix emits a handful of rects into the batched path the
 * rest of the draw already uses, so it costs a fraction of a millisecond and,
 * unlike type, degrades linearly if a photograph ever puts thousands of cells
 * up here. It also happens to be the more honest mark: a dot matrix is what a
 * machine readout is, where an antialiased typeface is what a document is.
 *
 * Digits plus a registration cross. Each row is three bits, high bit leftmost.
 */
/**
 * The level at which marks become round.
 *
 * Below this they are drawn as rectangles: the cold levels carry the ground
 * wash, which is most of the field by a wide margin, and at those sizes the
 * shape is not visible. See the draw pass for the measurement.
 */
const ROUND_FROM = 4;

const GLYPHS: ReadonlyArray<readonly number[]> = [
  [0b111, 0b101, 0b101, 0b101, 0b111], // 0
  [0b010, 0b110, 0b010, 0b010, 0b111], // 1
  [0b101, 0b101, 0b111, 0b001, 0b001], // 4
  [0b111, 0b001, 0b010, 0b010, 0b010], // 7
  [0b111, 0b101, 0b111, 0b001, 0b111], // 9
  [0b000, 0b010, 0b111, 0b010, 0b000], // +
];
const GLYPH_FROM = LEVELS - 2;
/** Matrix pixel size, as a fraction of the mark. Five of them make the height. */
const GLYPH_PX = 1 / 3.6;

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

/** Nominal mark size in each cell, as a fraction of the pitch. */
export const DOT_RATIO = 0.42;

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
// Raised once the draw pass moved to batched paths. The reference halftones are
// roughly twice as fine as this grid was, relative to their frame, and the
// difference between a dot pattern and an image made of dots is mostly density.
// Batching cut the draw cost by a factor of five, and this is where that
// headroom is spent.
const PITCH_PER_PX = 1 / 245;
const MIN_PITCH = 4.5;
const MAX_PITCH = 8;
const CELL_BUDGET = 40_000;

export function spacingFor(
  width: number,
  height: number,
  budget: number = CELL_BUDGET,
): number {
  const pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, width * PITCH_PER_PX));
  if ((width / pitch) * (height / pitch) <= budget) return pitch;
  return Math.sqrt((width * height) / budget);
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
  /**
   * The method's three forms, in the order the sequence plays them.
   *
   * `maskSource` and `maskTarget` are schematic cells: a machine and an arm.
   * They have to read as two different bodies doing one job, which is the whole
   * argument, so they differ in proportion and handedness rather than position.
   *
   * `maskEngram` is deliberately not a picture of anything. It is nodes and
   * chords, a causal structure, because the middle step is where the work stops
   * being a shape and becomes the reason the shape works.
   */
  maskSource: Float32Array;
  maskEngram: Float32Array;
  maskTarget: Float32Array;
  /**
   * A photograph, sampled through the same grid as everything else.
   *
   * Not a separate image element on purpose. Running a real cell through this
   * buffer means it arrives with the same ramp, the same halftone and the same
   * scroll smear as the schematic forms, which is the site's own argument
   * applied to itself: the picture re-expressed in a different substrate.
   */
  maskPhoto: Float32Array;
  /** Per-cell dispersal vector, and a scatter offset for the intro resolve. */
  driftX: Float32Array;
  driftY: Float32Array;
  scatterX: Float32Array;
  scatterY: Float32Array;
  /** Per-cell shimmer phase, as an index into SIN_LUT. */
  phase: Uint16Array;
  /**
   * Two standing waves across the grid, as SIN_LUT indices baked from each
   * cell's resting position.
   *
   * The ground wash needs *structure*, not an even level. Run flat through an
   * ordered dither it produces a strictly periodic lattice — the Bayer matrix
   * made visible, which reads as graph paper rather than as a surface. Two
   * waves at different frequencies and angles, summed, break that periodicity
   * into a slow cloud: dense in places, thin in others, drifting.
   *
   * Baked here because the position never changes; only the phase offset does,
   * which is one add per frame.
   */
  wave: Uint16Array;
  waveAlt: Uint16Array;
  /**
   * Which glyph variant this cell draws once it is hot enough to be one.
   * Fixed to the cell rather than rolled per frame, so the hot levels read as
   * a stable readout instead of flickering through the alphabet.
   */
  glyph: Uint8Array;
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
    maskSource: new Float32Array(count),
    maskEngram: new Float32Array(count),
    maskTarget: new Float32Array(count),
    maskPhoto: new Float32Array(count),
    driftX: new Float32Array(count),
    driftY: new Float32Array(count),
    scatterX: new Float32Array(count),
    scatterY: new Float32Array(count),
    phase: new Uint16Array(count),
    wave: new Uint16Array(count),
    waveAlt: new Uint16Array(count),
    glyph: new Uint8Array(count),
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
      grid.glyph[i] = (Math.random() * GLYPHS.length) | 0;

      // Two wavelengths, neither a multiple of the other and neither aligned to
      // an axis, so their sum has no short repeat anywhere on screen.
      grid.wave[i] =
        ((grid.x[i] / 430 + grid.y[i] / 265) * SIN_STEPS) & (SIN_STEPS - 1);
      grid.waveAlt[i] =
        ((grid.x[i] / -183 + grid.y[i] / 121) * SIN_STEPS) & (SIN_STEPS - 1);
    }
  }

  return grid;
}

/** Which buffer a mask sampling pass fills. */
export type MaskTarget =
  | "mask"
  | "maskAlt"
  | "maskSource"
  | "maskEngram"
  | "maskTarget"
  | "maskPhoto";

/**
 * Rasterises an arbitrary drawing to an offscreen canvas and samples it onto
 * the grid, filling one mask buffer with per-cell coverage.
 *
 * `draw` receives a context already cleared to black with the fill set to
 * white, and should paint in white: the sampler reads one channel, so anything
 * else is wasted work. Whatever it paints becomes a form the field can hold.
 */
export function sampleMask(
  grid: Grid,
  width: number,
  height: number,
  into: MaskTarget,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): void {
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
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";

  draw(ctx, width, height);

  const data = ctx.getImageData(0, 0, off.width, off.height).data;

  for (let i = 0; i < grid.count; i++) {
    const px = Math.round(grid.x[i]);
    const py = Math.round(grid.y[i]);
    if (px < 0 || py < 0 || px >= off.width || py >= off.height) continue;
    // Red channel is enough: the mask is drawn in pure white on black.
    buffer[i] = data[(py * off.width + px) * 4] / 255;
  }
}

/**
 * Draws an image into a mask buffer, cover-fitting it to the canvas.
 *
 * Desaturated before sampling because `sampleMask` reads the red channel, which
 * only equals luminance once there is no colour left. Contrast is nudged up:
 * the ramp has eight levels to work with, so a flat midtone photograph
 * collapses into two or three of them and reads as noise.
 */
export function sampleImageMask(
  grid: Grid,
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  width: number,
  height: number,
  into: MaskTarget = "maskPhoto",
): void {
  if (naturalWidth <= 0 || naturalHeight <= 0) return;

  sampleMask(grid, width, height, into, (ctx, w, h) => {
    // Hard contrast, not a gentle nudge. There are eight levels to land in and
    // a photograph is mostly midtones, so an untouched image collapses into two
    // or three of them and reads as grey noise. The reference images are
    // extremely high contrast for the same reason: this ramp rewards images
    // that are already close to black and white.
    ctx.filter = "grayscale(1) brightness(1.12) contrast(1.9)";
    // Cover fit: fill the frame, crop the overflow, never distort.
    const scale = Math.max(w / naturalWidth, h / naturalHeight);
    const dw = naturalWidth * scale;
    const dh = naturalHeight * scale;
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  });
}

/**
 * Draws `text` into a mask buffer, auto-fitting it to `widthRatio` of the canvas
 * so the wordmark holds its proportions at any viewport size.
 *
 * One caller of `sampleMask` among several. The offscreen setup and sampling
 * loop live there; only the font fitting is text-specific.
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
    into?: MaskTarget;
  } = {},
): void {
  const {
    widthRatio = 0.72,
    centerY = 0.5,
    letterSpacing = "0.06em",
    into = "mask",
  } = opts;

  sampleMask(grid, width, height, into, (ctx) => {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // `letterSpacing` is Chromium-only; harmless where unsupported.
    type SpacedContext = CanvasRenderingContext2D & { letterSpacing?: string };
    (ctx as SpacedContext).letterSpacing = letterSpacing;

    // Fit by measuring once at a reference size and scaling. One extra measure
    // beats a binary search and is exact for a linear font metric.
    const target = width * widthRatio;
    const reference = 100;
    ctx.font = `600 ${reference}px ${fontFamily}`;
    const measured = ctx.measureText(text).width || 1;
    let fontSize = (target / measured) * reference;
    fontSize = Math.min(fontSize, height * 0.42);

    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    ctx.fillText(text, width / 2, height * centerY);
  });
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
  /**
   * 0..1 gains on the method's three forms. Cross-faded by Method.tsx as the
   * sequence advances, so the field holds one body, then the structure behind
   * it, then a different body.
   */
  sourceGain: number;
  engramGain: number;
  targetGain: number;
  /** 0..1 gain on the photograph. */
  photoGain: number;
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
  /**
   * Shockwaves from the thesis, each an expanding pair of horizontal fronts.
   * `rippleY` holds origins in CSS pixels and `rippleR` how far each front has
   * travelled; live entries are compacted into the first `rippleCount` slots,
   * so the draw loop never walks dead ones. The caller owns the clock, this
   * just draws where it is told.
   */
  rippleY: Float32Array;
  rippleR: Float32Array;
  rippleGain: Float32Array;
  rippleCount: number;
  lightX: number;
  lightY: number;
  /** Radius of the cursor light in CSS pixels. */
  lightRadius: number;
  /**
   * Signed scroll velocity, -1..1, where 1 is a hard flick downward.
   *
   * A sampling system smears when the scene moves fast — this is the field's
   * rolling shutter. Cells stretch along the direction of travel and the whole
   * grid flares, so every scroll on the page has a physical response rather
   * than just the two sections that drive the field explicitly.
   */
  velocity: number;
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
    sourceGain,
    engramGain,
    targetGain,
    photoGain,
    pulse,
    open,
    bandY,
    bandGain,
    rippleY,
    rippleR,
    rippleGain,
    rippleCount,
    lightX,
    lightY,
    lightRadius,
    velocity,
    time,
  } = state;

  // The wordmark fades out over the first 60% of the scroll, while the field
  // itself keeps drifting for the full range. The fade is deliberately not
  // linear: holding brightness and then dropping fast keeps the letters legible
  // *while* they come apart below, instead of dimming evenly through the whole
  // gesture and hiding it.
  const maskGain = intro * (1 - Math.pow(clamp(scroll / 0.6, 0, 1), 1.6));
  const globalFade =
    FIELD_FLOOR +
    (1 - FIELD_FLOOR) * (1 - clamp((scroll - 0.15) / 0.85, 0, 1)) +
    pulse * 0.5 +
    // Fast scroll flares the field as well as smearing it. Kept modest: the
    // stretched cells already add a lot of apparent brightness on their own, so
    // a larger term here blows the whole field out on every flick.
    Math.abs(velocity) * 0.09;

  // Dispersal is a hump, not a ramp. A ramp blows the field apart and leaves it
  // apart — permanently sparse in the middle, piled at the edges. Peaking mid
  // hero and returning to zero lets the grid re-form into a calm ambient field
  // below the fold, so it reads as settling rather than breaking.
  const dispersal = Math.sin(clamp(scroll, 0, 1) * Math.PI) * 260;

  // The wordmark is made of samples, so it comes apart into samples — but it
  // has to survive long enough to be seen doing it. Dispersal alone reaches
  // 260px by a third of the way down the hero, which is already more than
  // enough to erase a letterform, so simply pushing mask cells harder just
  // erases them sooner.
  //
  // Instead they resist first: `hold` exempts mask cells from the field's
  // dispersal early on, so the letters stay crisp while the grid around them
  // blows away. Once it lapses, `maskPush` takes over and the letters go too.
  const hold = 1 - clamp(scroll / 0.42, 0, 1);
  // `release` is not cosmetic. Without it the push never returns and those cells
  // stay permanently displaced — the ambient field would carry a MIKOSHI-shaped
  // hole for the rest of the page. It unwinds from 0.6 to 1.0, by which point
  // `maskGain` is already zero, so none of it is visible.
  const blow = clamp((scroll - 0.28) / 0.32, 0, 1);
  const release = 1 - clamp((scroll - 0.6) / 0.4, 0, 1);
  const maskPush = blow * blow * release * 340;

  // How strongly bare field cells catch the light.
  //
  // Under a wordmark this has to stay low or the lit background washes the
  // letterforms out, which is why it sits at 0.13 in the hero. With nothing on
  // screen there is nothing to protect, so it rises and the cursor genuinely
  // illuminates the grid. Without this the field is invisible past the hero.
  //
  // The method's forms need exactly the same protection as the wordmark, so any
  // form on screen suppresses the background by the same amount.
  const formPresence = Math.min(
    1,
    maskGain + altGain + sourceGain + engramGain + targetGain + photoGain,
  );
  const bareLight = 0.13 + 0.34 * (1 - formPresence);
  const scatter = 1 - intro;

  // The ground wash.
  //
  // Without this the field is only visible where the cursor light lands, and
  // everywhere else the cull below drops it outright — which is why the page
  // read as type floating on black rather than as a sampled surface. The
  // reference halftones have structure in every part of the frame.
  //
  // Graded down the viewport rather than flat, so the ground has a direction:
  // dense at the top, thinning toward the bottom, the way the second reference
  // fades its wash out under the subject. Ordered dither turns a wash this
  // faint into speckle rather than a grey veil, because only the cells whose
  // Bayer threshold is favourable ever cross into level 1.
  //
  // Suppressed wherever a form is on screen, for the same reason `bareLight` is:
  // a lifted ground competes with the letterforms sitting on it.
  // Pitched so the crest of the cloud clears the level 2 boundary at the top of
  // the frame and its trough falls under level 1 at the bottom, letting the
  // dither do the thinning: a wash this faint lights only the cells whose Bayer
  // threshold is favourable, and the proportion that qualify falls both down
  // the screen and through the cloud.
  const WASH_TOP = 0.36;
  const WASH_BOTTOM = 0.13;
  /** How much of the wash survives in the troughs of the cloud. */
  const WASH_FLOOR = 0.2;
  const washGain = intro * (1 - formPresence * 0.55);
  const washBase = WASH_TOP * washGain;
  const washSlope = ((WASH_BOTTOM - WASH_TOP) * washGain) / (height || 1);
  // The two waves drift at different rates and in opposite directions, so the
  // pattern never resolves into something a viewer can predict.
  const waveIdx = (time * 0.021) | 0;
  const waveAltIdx = (time * -0.013) | 0;

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

  // The scan band is computed here rather than rasterised into a mask: it moves
  // every frame, and a getImageData per frame is orders of magnitude too slow.
  // A band is an abs and a compare. The method's forms go the other way, since
  // they are fixed geometry and only their gains change.
  const bandActive = bandGain > 0.002;
  /** Falloff of the scan band either side of its centre, in CSS pixels. */
  const BAND_HALF = 74;
  /** Thickness of each shockwave front, in CSS pixels. */
  const RIPPLE_HALF = 46;
  const invRadius = 1 / lightRadius;
  const invRadius2 = invRadius * invRadius;
  const ambient = 0.055 * intro;
  /** Shimmer clock, as a LUT offset. Hoisted out of the per-cell loop. */
  const tIdx = (time * 0.179) | 0;

  buckets.size.fill(0);

  for (let i = 0; i < grid.count; i++) {
    // Mask cells move differently from bare ones — held back from the field's
    // dispersal at first, then thrown further than it once they let go. That
    // difference is the wordmark disintegrating. Read once here; the intensity
    // maths below reuses it.
    const mk = grid.mask[i];
    const push = dispersal * (1 - mk * hold) + mk * maskPush;

    const px = grid.x[i] + grid.scatterX[i] * scatter + grid.driftX[i] * push;
    const py = grid.y[i] + grid.scatterY[i] * scatter + grid.driftY[i] * push;

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
    let m =
      mk * maskGain +
      grid.maskAlt[i] * altGain +
      // The method's forms. Three unconditional multiply-adds rather than a
      // guard on the gains: a branch per cell costs more than the arithmetic
      // it would skip, and off-sequence these are all zero anyway.
      grid.maskSource[i] * sourceGain +
      grid.maskEngram[i] * engramGain +
      grid.maskTarget[i] * targetGain +
      grid.maskPhoto[i] * photoGain;

    if (bandActive) {
      const d = Math.abs(py - bandY);
      if (d < BAND_HALF) {
        const f = 1 - d / BAND_HALF;
        m += f * f * bandGain;
      }
    }

    // The premise shockwaves: each is two fronts travelling out from its
    // origin, one up and one down. The inner abs picks the distance to
    // whichever front is nearer, which is what makes one compare draw both.
    // `rippleCount` is zero for all but about a second of a visit, so this
    // costs a single compare the rest of the time.
    for (let r = 0; r < rippleCount; r++) {
      const d = Math.abs(Math.abs(py - rippleY[r]) - rippleR[r]);
      if (d < RIPPLE_HALF) {
        const f = 1 - d / RIPPLE_HALF;
        m += f * f * rippleGain[r];
      }
    }

    const cloud =
      (SIN_LUT[(grid.wave[i] + waveIdx) & (SIN_STEPS - 1)] +
        SIN_LUT[(grid.waveAlt[i] + waveAltIdx) & (SIN_STEPS - 1)]) *
      0.5;
    const wash =
      (washBase + py * washSlope) * (WASH_FLOOR + (1 - WASH_FLOOR) * cloud);

    // A form's brightness: a floor everywhere it exists, plus what the light
    // adds where it falls.
    //
    // The coefficients are set so a fully lit mask cell lands *just* at the top
    // of the ramp rather than far past it, and an unlit one still sits clear of
    // the ground wash. They used to overshoot by about a third, which pinned
    // every cell the light touched to level 7 and made the wordmark a flat white
    // stencil: 47% of the drawn field sat on one stop while the five violet
    // stops between it and the ground shared 22%. Traversing the ramp is the
    // entire point of having one, so the light now carries a form from violet at
    // its far edge through lilac to a rose and white core.
    const base = m * (0.42 + lit * 0.45) + lit * bareLight + wash;

    // Shimmer can only ever add `ambient`, so anything that still falls under
    // the visibility floor at full shimmer is dropped here — before paying for
    // the table lookup. Most of the field is dark, so this skips the majority
    // of cells outright.
    //
    // The floor is the exact quantisation boundary, not a guess. A cell reaches
    // level 1 when `intensity * LEVELS + threshold - 0.5 >= 1`, and the largest
    // Bayer threshold is 0.969, so nothing below 0.066 can ever be drawn however
    // lucky its cell is. Culling at that boundary rather than well under it pays
    // for the ground wash above, which puts many more cells in play.
    if ((base + ambient) * globalFade <= 0.066) continue;

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

  // Motion smear, measured in cell pitches rather than pixels.
  //
  // An absolute length is wrong here: at a fixed 13px the streaks run longer
  // than the gap between rows on every viewport, so they fuse into unbroken
  // vertical lines and the field reads as corduroy instead of as a grid in
  // motion. Held just under one pitch, cells stretch to roughly three times
  // their resting length and still read as discrete samples. It also bounds the
  // cost, since fill area is what this actually spends.
  //
  // Scrolling down moves content up, so the streak trails below the cell;
  // scrolling up it trails above.
  const SMEAR_PITCHES = 0.8;
  const smear = Math.min(Math.abs(velocity), 1) * grid.spacing * SMEAR_PITCHES;

  // One path per level, one `fill` per path.
  //
  // This is the single decision that pays for everything else in the frame.
  // Measured over 15,364 marks in the same renderer: a batched path of arcs
  // costs 4.6ms, where a `fillRect` per cell costs 15.7ms, an `arc` plus `fill`
  // per cell costs 23ms, and a `drawImage` per cell from a pre-rendered tile
  // costs 59ms. Building the path is still per cell; what collapses is the
  // rasterisation, which happens once per level instead of once per mark.
  //
  // It is also what makes the shape affordable. A halftone is round, and a grid
  // of squares on a square lattice reads as a grid; batching is why the field
  // can be circles at a third of what squares used to cost.
  const glyph = grid.glyph;
  const posX = buckets.posX;
  const posY = buckets.posY;
  // Scrolling down moves content up, so the streak trails below the cell.
  const lead = velocity < 0 ? smear : 0;

  for (let level = 1; level < LEVELS; level++) {
    const n = buckets.size[level];
    if (n === 0) continue;

    const ids = buckets.index[level];
    const mark = grid.dotSize * DOT_SCALE[level];

    // Halos first, widest first, so the crisp mark lands on top of its own glow.
    if (level >= BLOOM_FROM) {
      const [r, g, b] = RAMP_ON_BLACK[level];
      for (const ring of BLOOM_RINGS) {
        const rx = (mark * ring.scale) / 2;
        const ry = rx + smear / 2;
        ctx.fillStyle = `rgba(${r},${g},${b},${ring.alpha})`;
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const i = ids[k];
          ctx.moveTo(posX[i] + rx, posY[i]);
          ctx.ellipse(posX[i], posY[i] + smear / 2 - lead, rx, ry, 0, 0, TAU);
        }
        ctx.fill();
      }
    }

    ctx.fillStyle = LEVEL_FILL[level];
    ctx.beginPath();

    if (level >= GLYPH_FROM) {
      // A dot matrix, emitted as rects into the same path. Three columns wide
      // and five rows tall, so the mark reads as a character cell rather than
      // as a square.
      const px = mark * GLYPH_PX;
      const w = px * 3;
      const h = px * 5;
      const rowH = px + smear / 5;
      for (let k = 0; k < n; k++) {
        const i = ids[k];
        const left = posX[i] - w / 2;
        const top = posY[i] - h / 2 - lead;
        const rows = GLYPHS[glyph[i]];
        for (let row = 0; row < 5; row++) {
          const bits = rows[row];
          if (bits === 0) continue;
          const y = top + row * px;
          if (bits & 0b100) ctx.rect(left, y, px, rowH);
          if (bits & 0b010) ctx.rect(left + px, y, px, rowH);
          if (bits & 0b001) ctx.rect(left + px * 2, y, px, rowH);
        }
      }
    } else if (level < ROUND_FROM) {
      // Rectangles, and this is where the frame is won.
      //
      // A halftone is round, so the whole field was ellipses. But the ground
      // wash puts the overwhelming majority of marks in the coldest level:
      // measured at 1920x1080, level 1 alone held 13,723 of 16,091 drawn marks,
      // 85% of everything on screen, at a mark size of 1.9px. Two pixels is
      // well under the size at which an eye can tell a disc from a square, and
      // an `ellipse` costs about three times what a `rect` does in the batched
      // path — 4.25ms against 1.18ms over the same 15k marks.
      //
      // So roundness is bought only where it is legible. The cold levels are
      // texture, and texture is rectangles.
      const half = mark / 2;
      const h = mark + smear;
      for (let k = 0; k < n; k++) {
        const i = ids[k];
        ctx.rect(posX[i] - half, posY[i] - half - lead, mark, h);
      }
    } else {
      // Stretched along the direction of travel: an ellipse rather than a
      // circle is the field's rolling shutter, the same smear the previous
      // version got by growing a rectangle.
      const rx = mark / 2;
      const ry = rx + smear / 2;
      for (let k = 0; k < n; k++) {
        const i = ids[k];
        ctx.moveTo(posX[i] + rx, posY[i]);
        ctx.ellipse(posX[i], posY[i] + smear / 2 - lead, rx, ry, 0, 0, TAU);
      }
    }

    ctx.fill();
  }
}
