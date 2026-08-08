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
 * laid over the page. Dim samples sit at an ashy violet and bright ones burn
 * out to near-white, which makes the colour a *consequence of light*: the
 * ambient field reads dusty, and anything the light touches — the wordmark
 * included — goes white. That's also what preserves the high-contrast
 * black-and-white dither of the reference images.
 *
 * Baked into strings once at module load, so the draw loop still costs one
 * fillStyle assignment per level and builds nothing per frame.
 *
 * `RAMP_DIM` is more saturated than the tint actually wanted, on purpose. Cells
 * are drawn with alpha proportional to level, and compositing scales all three
 * channels together — so the channel *spread* that carries the hue shrinks with
 * it, and a colour picked to look right at full strength turns to neutral grey
 * by the time it's painted at 0.4. Both endpoints are chosen to read correctly
 * after that compositing, not before it.
 */
const RAMP_DIM = [126, 94, 190];
const RAMP_BRIGHT = [247, 245, 250];
/** >1 holds the violet through the midtones instead of racing to white. */
const RAMP_BIAS = 1.35;

/**
 * Alpha is deliberately *not* linear in level.
 *
 * Compositing scales all three channels together, so the channel spread that
 * carries hue shrinks with luminance — and below about luminance 24 there is no
 * room left in 8-bit sRGB to see any colour at all. With a linear curve roughly
 * four fifths of the drawn field landed in exactly that band: present, but
 * neither visible nor violet. Lifting the low and middle levels puts the
 * populated part of the ramp where chroma has headroom, which is what makes
 * the ambient field read as dusty rather than as black-on-black.
 */
const ALPHA_BIAS = 0.7;

const LEVEL_FILL: string[] = Array.from({ length: LEVELS }, (_, level) => {
  const v = level / (LEVELS - 1);
  const t = Math.pow(v, RAMP_BIAS);
  const c = (i: number) =>
    Math.round(RAMP_DIM[i] + (RAMP_BRIGHT[i] - RAMP_DIM[i]) * t);
  const alpha = Math.pow(v, ALPHA_BIAS) * 0.95;
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
const DOT_MIN = 0.5;
const DOT_MAX = 1.55;
const DOT_SCALE = Array.from(
  { length: LEVELS },
  (_, level) => DOT_MIN + (level / (LEVELS - 1)) * (DOT_MAX - DOT_MIN),
);

/**
 * Bloom.
 *
 * The top levels get a wide, faint square painted underneath the crisp dot, so
 * lit cells carry a halo instead of ending at a hard edge. Without it the
 * brightest thing on the page is a flat pale square, which reads as grey paint
 * rather than as something emitting light.
 *
 * Confined to the hottest levels on purpose: those buckets hold the fewest
 * cells, so the extra fill is cheap, and bloom on the midtones would just fog
 * the black ground the reference images depend on.
 */
const BLOOM_FROM = LEVELS - 2;
const BLOOM_SCALE = 2.4;
const BLOOM_FILL: Array<string | null> = Array.from(
  { length: LEVELS },
  (_, level) => {
    if (level < BLOOM_FROM) return null;
    const v = level / (LEVELS - 1);
    const t = Math.pow(v, RAMP_BIAS);
    const c = (i: number) =>
      Math.round(RAMP_DIM[i] + (RAMP_BRIGHT[i] - RAMP_DIM[i]) * t);
    return `rgba(${c(0)},${c(1)},${c(2)},${(0.05 + v * 0.06).toFixed(3)})`;
  },
);

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

  // One fillStyle assignment per level instead of one per cell. This is the
  // difference between 60fps and a slideshow. Dot size is now per level too,
  // which is what makes this a halftone; it costs nothing here because the
  // bucketing already grouped the cells.
  for (let level = 1; level < LEVELS; level++) {
    const n = buckets.size[level];
    if (n === 0) continue;

    const ids = buckets.index[level];
    const size = grid.dotSize * DOT_SCALE[level];
    const half = size / 2;
    const rectH = size + smear;
    const top = half + (velocity < 0 ? smear : 0);

    // Halo first, so the crisp dot lands on top of its own glow.
    const bloom = BLOOM_FILL[level];
    if (bloom) {
      const bSize = size * BLOOM_SCALE;
      const bHalf = bSize / 2;
      const bH = bSize + smear;
      const bTop = bHalf + (velocity < 0 ? smear : 0);
      ctx.fillStyle = bloom;
      for (let k = 0; k < n; k++) {
        const i = ids[k];
        ctx.fillRect(buckets.posX[i] - bHalf, buckets.posY[i] - bTop, bSize, bH);
      }
    }

    ctx.fillStyle = LEVEL_FILL[level];
    for (let k = 0; k < n; k++) {
      const i = ids[k];
      ctx.fillRect(buckets.posX[i] - half, buckets.posY[i] - top, size, rectH);
    }
  }
}
