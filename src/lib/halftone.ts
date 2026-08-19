/**
 * The halftone engine behind the wordmark on home.
 *
 * A grid of cells is sampled from a wordmark mask, lit by one fixed key light,
 * and quantised through an ordered (Bayer) dither, which is what produces the
 * crosshatch texture rather than smooth grey. The dot *grows* with tone, so it
 * reads as a print halftone rather than as a grid of identical dots at varying
 * opacity.
 *
 * ── WHERE THIS CAME FROM ─────────────────────────────────────────────────────
 * This is `lib/dither.ts` from before `b5cc933`, cut down to the wordmark path.
 * That file drove a full-viewport field behind an eight-screen scroll: two
 * schematic machine forms with a wipe between them, a photograph channel, a
 * cursor light, scroll dispersal, a rolling-shutter smear, shockwaves, a scan
 * band, and a footer bookend. All of it is gone, because all of it existed to
 * serve a scroll that no longer exists.
 *
 * What survives is the part that was never about scrolling: the measured ramp,
 * the grid, the sampler and the batched draw. **The docblocks survive with it.**
 * They record why each number is what it is, and re-deriving them would cost far
 * more than the file itself.
 *
 * The one performance decision that matters is unchanged: cells are bucketed by
 * brightness level and drawn bucket by bucket, so a frame costs LEVELS
 * fillStyle assignments instead of one per cell.
 */

const TAU = Math.PI * 2;

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

/** Classic 4x4 ordered-dither threshold matrix, normalised to 0..1. */
const BAYER_4 = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);

/** Number of discrete brightness levels. Level 0 is "not drawn". */
export const LEVELS = 8;

/**
 * The level ramp, and where the site's colour lives.
 *
 * **Derived from the dark ramp's distances, not from its colours.** The first
 * version of this table was written by eye, picking light equivalents for each
 * dark stop, and it came out washed out for a reason worth recording. Level 1
 * on black sits 30 luma above its ground and is unmistakably a mark; the light
 * L1 was written at 231 against a 243 ground, which is 12 luma, a 5% step, and
 * therefore nothing. The ground wash is most of the field by a wide margin, so
 * most of the field simply vanished and the page read as type on blank paper
 * rather than as a sampled surface.
 *
 * Each stop is placed at `groundLuma - darkLuma` on Rec. 709 luma, so a level
 * is exactly as far from the paper as its counterpart was from the black. The
 * two themes carried the same amount of contrast and only spent it in opposite
 * directions. The dark one is gone; this is the survivor.
 *
 * **L7 is the one deliberate exception.** The mirror rule is sound while the
 * dark ramp's top is a near-white. It was not, once that top became a saturated
 * orange at luma 168: mirrored literally, the darkest ink on paper would land
 * at 64, a mid brown, lighter than the paper's own midtones and useless as the
 * bottom of a ramp. So the top stop is a proper near-black plum and the
 * symmetry is spent on the low and middle levels, which is where it was earned.
 *
 * **The colour lives in the middle here, and that is forced.** Chroma only
 * survives compositing where alpha is high, which is why `ALPHA_BIAS` exists.
 * On black that put the usable colour at the top of the ramp, where the light
 * was. On paper the top is nearly black, where 8-bit sRGB has no room for hue
 * at all, and the bottom is washed toward the ground. So L4 carries magenta and
 * L5 and L6 rose.
 *
 * That rose is the same hue as `--color-accent`, and not by coincidence: the
 * site's accent was declared as the hot end of this ramp rather than picked, so
 * the field and the accent agree by construction.
 *
 * These are the colours **as they should appear on screen**, already
 * composited. `LEVEL_FILL` divides the ground back out.
 */
const RAMP: ReadonlyArray<readonly [number, number, number]> = [
  [236, 234, 228], //       L0  never drawn; the ground itself
  [214, 200, 226], //       L1  the ground speckle, and a real mark
  [200, 180, 214], //       L2  violet tint
  [190, 163, 200], //       L3  violet tint
  [204, 133, 170], //       L4  magenta
  [192, 106, 136], //       L5  rose
  [178, 96, 126], //        L6  rose
  [54, 29, 40], //          L7  the darkest ink, a near-black plum
];

/**
 * The ground the ramp is declared against, and it is **not** the ground token.
 *
 * The canvas is cleared rather than filled, so whatever is behind it is what
 * every mark composites over. That used to be `--color-ground` directly. It is
 * not any more, because the grain overlay multiplies over the whole page
 * including this canvas: the token is `#F1EEE8`, deliberately set about four
 * levels above the bone anyone actually sees, and the composite measures
 * `#ECEAE4`.
 *
 * So this is the measured composite, not the token. Measured at 1440x900 over
 * 38,400 pixels of flat ground: (236.4, 233.5, 227.5).
 *
 * The ramp above was originally written against `#ECE8E0`, which is within 4 on
 * blue and identical on red, so restoring it needed almost no re-derivation.
 * That is luck rather than design and it should be re-measured if either the
 * ground token or the grain opacity moves. **The failure mode is silent**: a
 * ramp that misses its ground does not error, the field just goes flat.
 */
const GROUND: readonly [number, number, number] = [236, 234, 228];

/**
 * Alpha is deliberately *not* linear in level.
 *
 * Below about luminance 24 there is no room left in 8-bit sRGB to see any
 * colour at all. With a linear curve roughly four fifths of the drawn field
 * landed in exactly that band: present, but neither visible nor violet. Lifting
 * the low and middle levels puts the populated part of the ramp where chroma
 * has headroom, which is what makes the field read as dusty rather than flat.
 */
const ALPHA_BIAS = 0.55;

function levelAlpha(level: number): number {
  return Math.pow(level / (LEVELS - 1), ALPHA_BIAS) * 0.95;
}

/**
 * Solve for the source colour that composites onto the ground as the target.
 *
 * `source-over` gives `out = source * a + ground * (1 - a)`, so
 *
 *     source = (target - ground * (1 - a)) / a
 *
 * Every level has been checked to land inside 0..255 in all three channels on
 * this ground. The binding constraint on a light ground is the *low* end, where
 * `target` must stay above `ground * (1 - alpha)`.
 */
function solve(target: number, groundChannel: number, alpha: number): number {
  const c = (target - groundChannel * (1 - alpha)) / alpha;
  return c < 0 ? 0 : c > 255 ? 255 : Math.round(c);
}

/**
 * Bloom.
 *
 * The top levels carry a halo, so lit cells fade out instead of ending at a
 * hard edge. Without it the strongest thing on the page is a flat mark, which
 * reads as paint rather than as something being sampled.
 *
 * Two concentric rings rather than a radial gradient. A gradient means one
 * paint per cell, which is the thing the batched draw exists to avoid; two flat
 * rings are two more batched fills over the sparsest buckets on the ramp.
 *
 * **The alphas are already halved for paper**, which was never a taste call.
 * Bloom on black adds light to nothing and lands at luminance 21. The same
 * alpha on a near-white ground is ink over 236, and a hot mark on paper is the
 * *darkest* thing in the frame, so the ring reads as a smudge rather than as
 * bleed. A ground this bright also cannot reach the declared target at 5%
 * coverage at all: `solve` clamps to pure ink and the ring becomes a plain
 * darkening.
 */
const BLOOM_FROM = LEVELS - 2;
const BLOOM_RINGS: ReadonlyArray<{ scale: number; alpha: number }> = [
  { scale: 2.6, alpha: 0.025 },
  { scale: 1.7, alpha: 0.045 },
];

const LEVEL_FILL: string[] = Array.from({ length: LEVELS }, (_, level) => {
  const alpha = levelAlpha(level) || 1;
  const c = (i: number) => solve(RAMP[level][i], GROUND[i], alpha);
  return `rgba(${c(0)},${c(1)},${c(2)},${alpha.toFixed(3)})`;
});

const BLOOM_FILL: string[][] = Array.from({ length: LEVELS }, (_, level) =>
  BLOOM_RINGS.map((ring) => {
    const c = (i: number) => solve(RAMP[level][i], GROUND[i], ring.alpha);
    return `rgba(${c(0)},${c(1)},${c(2)},${ring.alpha})`;
  }),
);

/**
 * Dot size per level, as a multiple of `grid.dotSize`.
 *
 * This is what makes the field a halftone rather than a grid of identical dots
 * at varying opacity. In a real halftone the dot grows with tone: shadows are
 * sparse specks, highlights are fat and nearly touching. Brightness alone gives
 * an even grey texture no matter how the ramp is tuned.
 *
 * Free, because cells are already bucketed by level: the size is computed once
 * per bucket, not once per cell.
 */
const DOT_MIN = 0.55;
const DOT_MAX = 1.7;
const DOT_SCALE = Array.from(
  { length: LEVELS },
  (_, level) => DOT_MIN + (level / (LEVELS - 1)) * (DOT_MAX - DOT_MIN),
);

/**
 * The level at which marks become round.
 *
 * Below this they are rectangles. The cold levels carry the ground wash, which
 * is most of the field by a wide margin, and at those sizes the shape is not
 * visible. An `ellipse` costs about three times what a `rect` does in the
 * batched path, measured at 4.25ms against 1.18ms over 15k marks, so roundness
 * is bought only where it is legible.
 */
const ROUND_FROM = 4;

/*
 * THE HOT LEVELS ARE NOT DRAWN AS CHARACTERS HERE, AND CANNOT BE.
 *
 * The field this came from drew its top two levels as 3x5 dot matrices rather
 * than as dots, on the argument that where a sample is strongest it should read
 * as data rather than as texture. It was one of the better things in that file
 * and it is gone, because the arithmetic its own docblock set out rules it out
 * at this size.
 *
 * A matrix element is `dotSize * DOT_SCALE[7] / 3.6`. The old field was
 * full-viewport, so at 1920 it ran a 7.84px pitch and put 1.65px into each
 * element. This box is roughly 1024 wide at its widest, which lands under
 * `MIN_PITCH`, so the pitch is 4.5 at *every* viewport width and each element
 * gets **0.94px**. That is sub-pixel, and it rendered exactly as the original
 * note predicted: the letterforms came out as vertical bars rather than as
 * characters, because rows of a full 3-bit row abut into solid columns once
 * each element rounds up to one device pixel.
 *
 * Coarsening the grid to fix it is ruled out by the constraint above it: pitch
 * is driven by the wordmark, and below about ten cells per letter the
 * letterforms stop resolving. So the hot levels are round marks, like the rest
 * of the ramp above `ROUND_FROM`.
 */

/**
 * Precomputed sine, mapped to 0..1, for the ground wash's cloud.
 *
 * The temporal shimmer this also used to drive is gone: the field resolves once
 * and holds, so nothing here moves. What remains is spatial, baked per cell.
 */
const SIN_STEPS = 1024;
const SIN_LUT = new Float32Array(SIN_STEPS);
for (let i = 0; i < SIN_STEPS; i++) {
  SIN_LUT[i] = 0.5 + 0.5 * Math.sin((i / SIN_STEPS) * TAU);
}

/** Nominal mark size in each cell, as a fraction of the pitch. */
export const DOT_RATIO = 0.42;

/**
 * Cell pitch in CSS pixels.
 *
 * Pitch is driven by the wordmark, not by the screen. What matters is how many
 * cells fall across each letter, and below about ten the letterforms stop
 * resolving. The wordmark is sized as a fraction of box width, so pitch scales
 * *with* width, which means a narrow screen needs a finer grid, not a coarser
 * one. It can afford it: it has a fraction of the area.
 *
 * The cell budget is the backstop. Cost is close to linear in cell count, so on
 * a large display the grid is coarsened until it fits.
 */
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
  /** Where a cell starts before the resolve settles it. */
  scatterX: Float32Array;
  scatterY: Float32Array;
  /**
   * Two standing waves across the grid, as SIN_LUT indices baked from each
   * cell's resting position.
   *
   * The ground wash needs *structure*, not an even level. Run flat through an
   * ordered dither it produces a strictly periodic lattice, the Bayer matrix
   * made visible, which reads as graph paper rather than as a surface. Two
   * waves at different frequencies and angles, summed, break that periodicity
   * into a slow cloud: dense in places, thin in others.
   */
  wave: Uint16Array;
  waveAlt: Uint16Array;
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
    scatterX: new Float32Array(count),
    scatterY: new Float32Array(count),
    wave: new Uint16Array(count),
    waveAlt: new Uint16Array(count),
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      grid.x[i] = col * spacing;
      grid.y[i] = row * spacing;
      grid.threshold[i] = BAYER_4[(row & 3) * 4 + (col & 3)];

      grid.scatterX[i] = (Math.random() - 0.5) * spacing * 9;
      grid.scatterY[i] = (Math.random() - 0.5) * spacing * 9;

      // Two wavelengths, neither a multiple of the other and neither aligned to
      // an axis, so their sum has no short repeat anywhere in the box.
      grid.wave[i] =
        ((grid.x[i] / 430 + grid.y[i] / 265) * SIN_STEPS) & (SIN_STEPS - 1);
      grid.waveAlt[i] =
        ((grid.x[i] / -183 + grid.y[i] / 121) * SIN_STEPS) & (SIN_STEPS - 1);
    }
  }

  return grid;
}

/**
 * Rasterises a drawing to an offscreen canvas and samples it onto the grid,
 * filling `mask` with per-cell coverage.
 *
 * `draw` receives a context already cleared to black with the fill set to
 * white, and should paint in white: the sampler reads one channel.
 */
export function sampleMask(
  grid: Grid,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): void {
  grid.mask.fill(0);
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

  // Four taps a quarter-pitch out from the centre, not one at the centre.
  //
  // A single tap makes coverage binary, and binary coverage is why a form reads
  // as a bright block: it ends at a hard edge with nothing between it and the
  // ground. Four taps give a cell partial coverage wherever an edge crosses it,
  // which is what lets a letterform feather into the field and what makes the
  // level ramp usable across an edge rather than only across a light.
  const q = Math.max(1, Math.round(grid.spacing / 4));
  const maxX = off.width - 1;
  const maxY = off.height - 1;
  const tap = (x: number, y: number) =>
    data[
      ((y < 0 ? 0 : y > maxY ? maxY : y) * off.width +
        (x < 0 ? 0 : x > maxX ? maxX : x)) *
        4
    ];

  for (let i = 0; i < grid.count; i++) {
    const px = Math.round(grid.x[i]);
    const py = Math.round(grid.y[i]);
    if (px < -q || py < -q || px > maxX + q || py > maxY + q) continue;
    grid.mask[i] =
      (tap(px - q, py - q) +
        tap(px + q, py - q) +
        tap(px - q, py + q) +
        tap(px + q, py + q)) /
      1020;
  }
}

/**
 * How wide Archivo is set for the wordmark.
 *
 * `ctx.fontStretch` takes the CSS keywords rather than a percentage, and
 * `"expanded"` is 125%, which is exactly the `wdth` axis value the header and
 * footer use. Where the property is unsupported the caller falls back to a
 * horizontal transform, which is not the same thing but lands well under the
 * resolution of a grid that renders each letter across ten to twenty dots.
 */
const WIDTH_AXIS = 1.25;

/**
 * The weight the mask is drawn at, and it is **not** the weight of the type.
 *
 * The header sets the wordmark at 500. Sampled at 500 the mark came out mush,
 * and the file this was restored from warned about exactly that: "Weight 600 is
 * not optional. Without the real cut the browser synthesises a bold that turns
 * to mush once it is reduced to dots." The warning was about a missing cut and
 * the underlying reason is more general than that.
 *
 * **What matters is stroke width measured in cells.** A halftone replaces a
 * solid stroke with a row of dots, so a stroke only survives if several dots
 * fall across it. Measured on the shipped build: Archivo at 500, sized to a
 * 1024px box, gave a 16px stem against a 4.5px pitch, which is **3.6 cells per
 * stroke** and is why it read as blur. At 800 the same box gives 21px and 4.7
 * cells, and full width gives 33px and about 5.6.
 *
 * Drawing heavier also lands at the *same apparent weight* rather than a
 * bolder one, because the dots cover less area than the strokes they replace.
 * The mark is not a bolder MIKOSHI, it is the same MIKOSHI that survives being
 * sampled.
 */
const MASK_WEIGHT = 800;

/**
 * Draws the wordmark into the mask, letter by letter.
 *
 * **Per-letter advances, not `ctx.letterSpacing`.** That property is not
 * universally supported, and the previous version of this code noted it as
 * "Chromium-only, harmless where unsupported". It stopped being harmless when
 * the wordmark's tracking went from 0.06em to 0.18em: a browser ignoring it
 * renders a visibly narrower mark than the type version of the same wordmark
 * sitting in the header directly above. Measuring and placing each glyph makes
 * the tracking exact everywhere.
 *
 * Fit by measuring once at a reference size and scaling. One extra measure
 * beats a binary search and is exact for a linear font metric.
 */
export function sampleWordmark(
  grid: Grid,
  text: string,
  width: number,
  height: number,
  fontFamily: string,
  opts: { widthRatio?: number; tracking?: number; centerY?: number } = {},
): void {
  const { widthRatio = 0.86, tracking = 0.18, centerY = 0.5 } = opts;

  sampleMask(grid, width, height, (ctx) => {
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    type StretchContext = CanvasRenderingContext2D & { fontStretch?: string };
    const sc = ctx as StretchContext;
    sc.fontStretch = "expanded";
    const stretched = sc.fontStretch === "expanded";

    const letters = [...text];
    const reference = 100;
    const setFont = (size: number) => {
      ctx.font = `${MASK_WEIGHT} ${size}px ${fontFamily}`;
      sc.fontStretch = "expanded";
    };

    setFont(reference);
    // Scaling the transform widens advances too, so the fallback measures at
    // its own scale and the fit stays correct either way.
    const axis = stretched ? 1 : WIDTH_AXIS;
    const advances = letters.map((ch) => ctx.measureText(ch).width * axis);
    const glyphs = advances.reduce((a, b) => a + b, 0);
    // Tracking is added after every letter including the last, exactly as CSS
    // `letter-spacing` behaves, then the trailing space is trimmed off the
    // total so the mark is optically centred rather than pushed left.
    const spacing = reference * tracking;
    const runAt100 = glyphs + spacing * (letters.length - 1);

    let fontSize = (width * widthRatio * reference) / (runAt100 || 1);
    fontSize = Math.min(fontSize, height * 0.62);

    const scale = fontSize / reference;
    const run = runAt100 * scale;
    const gap = spacing * scale;

    setFont(fontSize);
    const y = height * centerY;
    let x = (width - run) / 2;

    ctx.save();
    if (!stretched) {
      // No width axis available. Scale horizontally about the run's centre so
      // the mark stays where it was placed.
      ctx.translate(width / 2, 0);
      ctx.scale(WIDTH_AXIS, 1);
      ctx.translate(-width / 2, 0);
      x = width / 2 + (x - width / 2) / WIDTH_AXIS;
    }

    for (let i = 0; i < letters.length; i++) {
      ctx.fillText(letters[i], stretched ? x : x, y);
      x += (stretched ? advances[i] : advances[i] / WIDTH_AXIS) * scale + gap;
    }
    ctx.restore();
  });
}

/**
 * Reusable scratch space, so a frame allocates nothing.
 *
 * `index[level]` holds the cell ids that landed in that brightness level;
 * `posX`/`posY` cache each cell's displaced position so the draw pass does not
 * recompute it.
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
 * Everything the renderer needs, which used to be twenty-six fields.
 *
 * The rest belonged to the scroll: dispersal, the wipe between two machine
 * forms, a photograph gain, ripples, a scan band, velocity smear, a pulse, and
 * an opening front. All of it is gone.
 */
export type FrameState = {
  /** 0..1 resolve: scattered and dark, to settled and lit. */
  intro: number;
  /** The key light, in CSS pixels relative to the canvas box. */
  lightX: number;
  lightY: number;
  /** Two radii, so the light is shaped rather than a disc. */
  lightRX: number;
  lightRY: number;
  lightGain: number;
};

/**
 * How the mark is inked, and the first version of this got it backwards.
 *
 * It shipped at `MASK_FLOOR` 0.4 with `KEY_LIFT` 0.55, which is the dark
 * theme's model: the mark sits nearly unlit and the light supplies most of its
 * brightness. **That model does not survive the inversion.** On black, more
 * light means a brighter mark, and a falloff across the wordmark reads as a
 * lamp aimed at it. On paper, more light means *more ink*, so the same falloff
 * reads as ink running out: measured on the shipped build, the middle of the
 * word sat at level 7 and both ends at level 4, which is rose. The wordmark
 * looked faded at the edges and pink at the ends, and the ends of a wordmark
 * are where its name starts and finishes.
 *
 * So the floor carries the ink and the light only modulates it. At 0.85 a mask
 * cell quantises to level 6 or 7 across the whole mark, which is the near-black
 * plum at the top of the ramp, and the rose survives only in the feathered
 * cells along each edge. That is what a halftone print actually looks like:
 * solid in the mass, chromatic in the fringe.
 *
 * Swept before choosing. At 0.60 the whole mark is rose. At 0.75 it is dark
 * with heavy rose fringing and reads muddy. At 0.88 it is clean and solid.
 * 0.85 with a 0.15 lift lands just inside that and leaves the light something
 * to do.
 */
const MASK_FLOOR = 0.85;
const KEY_LIFT = 0.15;

/**
 * The ground wash.
 *
 * Without this the field exists only where the wordmark is, and the box reads
 * as letters floating on blank paper rather than as a sampled surface. The
 * reference halftones have structure in every part of the frame.
 *
 * Graded down the box rather than flat, so the ground has a direction. Ordered
 * dither turns a wash this faint into speckle rather than a grey veil, because
 * only the cells whose Bayer threshold is favourable ever cross into level 1.
 */
/**
 * Far weaker than the version this came from, which ran 0.36 to 0.13 across a
 * full viewport. Inside a band the same numbers do not read as atmosphere, they
 * read as a rectangular grey haze with visible edges sitting behind the mark.
 * A viewport is big enough for a wash to be a gradient; a band is not.
 *
 * **Nearly flat, for the same reason.** A steep grade puts most of the surviving
 * speckle along the top edge, and a band of scattered dots above the wordmark
 * and none below it reads as dirt rather than as ground. Level 1 needs 0.066 to
 * cross at the most favourable Bayer threshold, so both ends sit close to that
 * boundary and the dither decides which cells make it.
 */
const WASH_TOP = 0.075;
const WASH_BOTTOM = 0.05;
/** How much of the wash survives in the troughs of the cloud. */
const WASH_FLOOR = 0.2;

/**
 * Where the wash starts falling off toward the edges of the box, as a fraction
 * of the half-diagonal.
 *
 * **This is what keeps the field's colour off the rest of the page.** The ramp
 * carries magenta and rose through its middle, which is correct inside the mark
 * and wrong spread across a whole viewport: a violet speckle reaching the frame
 * edges would tint the page and put a fifth accent everywhere. Falling the wash
 * off to nothing before the box edge leaves clean bone around it.
 *
 * Applied to the wash only, never to the mask. The wordmark keeps full
 * brightness to its last letter; it is the atmosphere around it that fades.
 */
const WASH_EDGE_FROM = 0.55;

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  buckets: Buckets,
  state: FrameState,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  const { intro, lightX, lightY, lightRX, lightRY, lightGain } = state;

  const scatter = 1 - intro;
  const washBase = WASH_TOP * intro;
  const washSlope = ((WASH_BOTTOM - WASH_TOP) * intro) / (height || 1);

  const lit = lightGain > 0.002;
  const invRX2 = 1 / Math.max(1, lightRX * lightRX);
  const invRY2 = 1 / Math.max(1, lightRY * lightRY);

  const halfW = width / 2;
  const halfH = height / 2;
  const halfDiag = Math.hypot(halfW, halfH) || 1;
  const invEdgeSpan = 1 / (1 - WASH_EDGE_FROM);

  buckets.size.fill(0);

  for (let i = 0; i < grid.count; i++) {
    const px = grid.x[i] + grid.scatterX[i] * scatter;
    const py = grid.y[i] + grid.scatterY[i] * scatter;

    // Cheap early-out: skip anything already off-canvas.
    if (px < -8 || py < -8 || px > width + 8 || py > height + 8) continue;

    const mk = grid.mask[i];

    const cloud =
      (SIN_LUT[grid.wave[i]] + SIN_LUT[grid.waveAlt[i]]) * 0.5;
    const edgeR = Math.hypot(px - halfW, py - halfH) / halfDiag;
    const edge =
      edgeR <= WASH_EDGE_FROM
        ? 1
        : Math.max(0, 1 - (edgeR - WASH_EDGE_FROM) * invEdgeSpan);
    const wash =
      (washBase + py * washSlope) *
      (WASH_FLOOR + (1 - WASH_FLOOR) * cloud) *
      edge *
      edge;

    // The key light. Quadratic falloff to zero at the radius, so it has an edge
    // rather than an unbounded glow, and two radii so it is shaped like a lamp
    // aimed at the mark rather than a disc sitting on it.
    let keyLit = 0;
    if (lit) {
      const fx = px - lightX;
      const fy = py - lightY;
      const fd2 = fx * fx * invRX2 + fy * fy * invRY2;
      if (fd2 < 1) keyLit = (1 - fd2) * (1 - fd2) * lightGain;
    }

    const m = mk * intro;
    const intensity = m * MASK_FLOOR + wash + m * keyLit * KEY_LIFT;

    // The cull is the exact quantisation boundary, not a guess. A cell reaches
    // level 1 when `intensity * LEVELS + threshold - 0.5 >= 1`, and the largest
    // Bayer threshold is 0.969, so nothing below 0.066 can ever be drawn
    // however lucky its cell is.
    if (intensity <= 0.066) continue;

    let level = Math.floor(intensity * LEVELS + grid.threshold[i] - 0.5);
    if (level <= 0) continue;
    if (level >= LEVELS) level = LEVELS - 1;

    buckets.index[level][buckets.size[level]++] = i;
    buckets.posX[i] = px;
    buckets.posY[i] = py;
  }

  // One path per level, one `fill` per path.
  //
  // This is the single decision that pays for everything else in the frame.
  // Measured over 15,364 marks: a batched path of arcs costs 4.6ms, where a
  // `fillRect` per cell costs 15.7ms, an `arc` plus `fill` per cell costs 23ms,
  // and a `drawImage` per cell from a pre-rendered tile costs 59ms. Building
  // the path is still per cell; what collapses is the rasterisation.
  const posX = buckets.posX;
  const posY = buckets.posY;

  for (let level = 1; level < LEVELS; level++) {
    const n = buckets.size[level];
    if (n === 0) continue;

    const ids = buckets.index[level];
    const mark = grid.dotSize * DOT_SCALE[level];

    // Halos first, widest first, so the crisp mark lands on top of its own glow.
    if (level >= BLOOM_FROM) {
      const fills = BLOOM_FILL[level];
      for (let r = 0; r < BLOOM_RINGS.length; r++) {
        const rr = (mark * BLOOM_RINGS[r].scale) / 2;
        ctx.fillStyle = fills[r];
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const i = ids[k];
          ctx.moveTo(posX[i] + rr, posY[i]);
          ctx.ellipse(posX[i], posY[i], rr, rr, 0, 0, TAU);
        }
        ctx.fill();
      }
    }

    ctx.fillStyle = LEVEL_FILL[level];
    ctx.beginPath();

    if (level < ROUND_FROM) {
      // Rectangles, and this is where the frame is won. The ground wash puts
      // the overwhelming majority of marks in the coldest level, and two pixels
      // is well under the size at which an eye can tell a disc from a square.
      const half = mark / 2;
      for (let k = 0; k < n; k++) {
        const i = ids[k];
        ctx.rect(posX[i] - half, posY[i] - half, mark, mark);
      }
    } else {
      const rr = mark / 2;
      for (let k = 0; k < n; k++) {
        const i = ids[k];
        ctx.moveTo(posX[i] + rr, posY[i]);
        ctx.ellipse(posX[i], posY[i], rr, rr, 0, 0, TAU);
      }
    }

    ctx.fill();
  }
}

export { clamp };
