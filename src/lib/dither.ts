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

import type { FormName } from "./fieldState";
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
 * The shape of the ramp is *cold shadow, hot highlight*: it opens at a navy
 * dark enough to read as near-black, climbs through violet and magenta across
 * the populated midtones, and reaches red and then a saturated orange at the
 * top. So heat appears exactly where light actually lands: the wordmark core,
 * the cursor, the bloom.
 *
 * Heat belongs at the top for a measured reason, not a taste one. See
 * `ALPHA_BIAS`: chroma only survives compositing where alpha is high, and
 * levels 6 and 7 are the only place on this ramp with the headroom to hold a
 * saturated hue at all.
 *
 * **The field never reaches white, and that is the point.** The reference this
 * is drawn from puts no white anywhere in its subject, and white is reserved for
 * the hairlines, the thin circles and the mono labels. This page is already
 * built that way, with the field painting the subject and the instrument layer
 * taking its ink from the CSS tokens, so the division holds without a single
 * structural change. The cost is real and was accepted knowingly: a saturated
 * hue cannot be as luminous as a near-white, so L7 falls from luma 229 to 169
 * and the hero's lit core is a colour now rather than a highlight.
 *
 * **One hue family, and this is the hard-won part.** The reference runs navy
 * through magenta to an *orange* core, and copying that literally is what the
 * first two versions of this table did. It read as garish, and the reason is
 * worth writing down because the obvious fix does not work.
 *
 * The obvious fix is to desaturate, and it was tried: every stop above L2 mixed
 * toward its own luma, taking peak saturation from 78% to 54%. It changed almost
 * nothing, because **mixing a colour toward its own luma preserves hue exactly**.
 * The problem was never the amount of chroma. It was that the ramp spanned 100
 * degrees of hue between L4 and L7, and the dither interleaves levels at cell
 * resolution, so a single lit letter was rendered in magenta and amber at once,
 * cell by cell. Two saturated hues inside one object read as a rainbow however
 * muted each one is.
 *
 * The proof that hue span alone is not the culprit: the violet ramp this page
 * ran for months spanned a *wider* 117 degrees and never read as vibrant,
 * because its top stop was 8% saturated. It was a near-white. Two tones where
 * one is white read as lighting; two tones that both carry chroma read as
 * colour. So the ramp now holds one family, 300 to 345 degrees, and a lit letter
 * spans 33 degrees instead of 100.
 *
 * L1 and L2 keep their navy and are deliberately outside the family. They carry
 * the ground wash, which is around four fifths of the marks on screen; at luma
 * 27 and 44 against a lit letter at 169 they read as texture rather than as a
 * hue; and the cold ground under a warm subject is the composition the reference
 * is built on. The old violet ramp ran indigo to rose for the same reason.
 *
 * **Nothing here may drift upward, and L7 is why the core is pale.** `solve`
 * divides the target back out by alpha, so the highest reachable value is
 * `255 * levelAlpha(level)`, which is 242 at L7. Luma is `0.2126 R + 0.7152 G +
 * 0.0722 B`, so brightness lives almost entirely in green, and a magenta is
 * defined by having little green. At L7's target luma of 169 the most saturation
 * any rose can carry under that ceiling is 39%. The amber this replaced managed
 * 78% only because amber is yellow-adjacent and full of green. So the pale core
 * is not a preference, it is the only thing the arithmetic allows short of
 * dimming the brightest mark on the page.
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
  //
  // Navy rather than the indigo they were, because the reference's ground is
  // navy and it is *not* a background colour: it is dot density. The wash below
  // is graded down the viewport from `WASH_TOP` to `WASH_BOTTOM`, so a dense
  // crest of these two stops at the top of a frame is the reference's navy band
  // and a thin one at the bottom is its black. Lifting `--color-ground` as well
  // would double the effect and flatten the gradient the wash exists to make.
  [24, 24, 60], //          L1  navy, the ground speckle
  [44, 38, 98], //          L2  indigo
  [99, 44, 99], //          L3  violet
  [134, 61, 120], //        L4  magenta-violet
  [177, 80, 137], //        L5  magenta
  [193, 93, 134], //        L6  rose
  [234, 150, 171], //       L7  pale rose, the core
];

/**
 * The same ramp for a light ground, where the field prints instead of emitting.
 *
 * Same shape, inverted role. On black a cell that catches more light is
 * brighter; on a near-white ground it carries more ink. So level still means
 * "how much of the field is excited here" and `DOT_SCALE` still grows with it,
 * which is what a halftone is in the first place: shadows are fat dots,
 * highlights are specks. Nothing about the geometry changes. Only what the
 * marks are made of.
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
 * Each stop below is placed at `groundLuma - darkLuma` on Rec. 709 luma, so a
 * level is exactly as far from the paper as its counterpart is from the black.
 * The two themes now carry the same amount of contrast; they only spend it in
 * opposite directions.
 *
 * **L7 is the one deliberate exception, and it is new.** The mirror rule is
 * sound while the dark ramp's top is a near-white. It is not sound now that the
 * top is a saturated orange at luma 168: mirrored literally, the darkest ink on
 * paper would land at 64, a mid brown, lighter than the paper's own midtones
 * and useless as the bottom of a ramp. So the top stop is set to a proper
 * near-black rust and the symmetry is spent on the low and middle levels, which
 * is where it was earned. The problem it was written to solve, a ground wash
 * that vanished into the paper, lives entirely down there.
 *
 * **And the chroma had to move.** Alpha rises with level in both themes, and
 * chroma only survives compositing where alpha is high — that is the whole
 * reason `ALPHA_BIAS` exists. On black that puts the usable colour at the top
 * of the ramp, which is where the light is. On paper the top of the ramp is
 * nearly black, where 8-bit sRGB has no room for hue at all, and the bottom is
 * washed toward a near-neutral ground. So the colour lives in the middle here:
 * L4 carries magenta and L5 and L6 rose, and the channel spread across those
 * three is 71, 86 and 82 against the violet table that preceded this one, which
 * managed 48, 62 and 66.
 *
 * That improvement is not tuning, it is the hue. A warm stop at these lumas has
 * more room in 8-bit sRGB than a violet one does, because it spends its spread
 * by pushing blue *down*, and blue is the cheapest channel to lose: it carries
 * 0.0722 of the luma against green's 0.7152. A violet stop has to push blue up
 * instead, and there is a ceiling at 255.
 *
 * **L5, L6 and L7 moved onto one hue family with the dark table**, for the
 * reason set out over there: two saturated hues inside a single lit object read
 * as a rainbow, and this table had a rust at L6 sitting 47 degrees from its own
 * L4. It now spans 9. Only those three stops moved, because the hue collapse
 * holds every luma fixed, and every luma here is placed against its dark
 * counterpart. So the mirror below still holds to within 2 at every stop and
 * none of it had to be re-derived.
 *
 * The one number that changed character: peak saturation was 68% at the rust,
 * the most saturated colour anywhere in the project, and is now 46%.
 *
 * The low three are still cool, mirroring the dark ramp's navy, and still bound
 * by the same hard ceiling: a faint mark is by definition close to the ground,
 * and the ground is near-neutral, so the two themes cannot be made equal there.
 * They are as close as the arithmetic gets.
 *
 * As with the dark ramp these are the colours **as they should appear on
 * screen**, already composited. `LEVEL_FILL` divides the ground back out, and
 * every stop has been checked to be reachable at its own alpha: the binding
 * constraint on a light ground is the *low* end, where `target` must stay above
 * `ground * (1 - alpha)`.
 */
const RAMP_ON_PAPER: ReadonlyArray<readonly [number, number, number]> = [
  [236, 232, 224], //       L0  never drawn; the ground itself
  [214, 200, 226], //       L1  the ground speckle, and a real mark
  [200, 180, 214], //       L2  violet tint
  [190, 163, 200], //       L3  violet tint
  [204, 133, 170], //       L4  magenta
  [192, 106, 136], //       L5  rose
  [178, 96, 126], //        L6  rose, mirroring the dark ramp's
  [54, 29, 40], //          L7  the darkest ink, a near-black plum. Not mirrored
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

/** Which ground the field is painting onto. */
export type FieldTheme = "dark" | "light";

/**
 * The ramp in force, and the ground it is declared against.
 *
 * The canvas is cleared rather than filled, so the page's background colour is
 * what every mark composites over. These two must therefore agree with the
 * `--color-ground` token or the declared ramp lands somewhere else entirely.
 */
let ramp = RAMP_ON_BLACK;
let ground: readonly [number, number, number] = [0, 0, 0];

/**
 * What to actually paint, so that painting it at `levelAlpha` lands on the
 * target above. Rebuilt on a theme change, never per frame.
 */
let LEVEL_FILL: string[] = [];
/** Bloom ring colours, pre-strung for the same reason. */
let BLOOM_FILL: string[][] = [];
/** Bloom ring alphas in force, which differ per ground. See `BLOOM_LIGHT_SCALE`. */
let BLOOM_ALPHA: number[] = [];

/**
 * Solve for the source colour that composites onto the ground as the target.
 *
 * `source-over` gives `out = source * a + ground * (1 - a)`, so
 *
 *     source = (target - ground * (1 - a)) / a
 *
 * The dark theme is the `ground = 0` case of this, which is why the previous
 * version of this file could get away with a bare `target / alpha`. Every level
 * of both ramps has been checked to land inside 0..255 in all three channels on
 * its own ground, which is also why the alpha curve is shared: it did not need
 * to change to make the light ramp representable.
 */
function solve(target: number, groundChannel: number, alpha: number): number {
  const c = (target - groundChannel * (1 - alpha)) / alpha;
  return c < 0 ? 0 : c > 255 ? 255 : Math.round(c);
}

function buildFills(light: boolean): void {
  LEVEL_FILL = Array.from({ length: LEVELS }, (_, level) => {
    const alpha = levelAlpha(level) || 1;
    const c = (i: number) => solve(ramp[level][i], ground[i], alpha);
    return `rgba(${c(0)},${c(1)},${c(2)},${alpha.toFixed(3)})`;
  });

  BLOOM_ALPHA = BLOOM_RINGS.map((ring) =>
    light ? ring.alpha * BLOOM_LIGHT_SCALE : ring.alpha,
  );

  BLOOM_FILL = Array.from({ length: LEVELS }, (_, level) =>
    BLOOM_RINGS.map((_ring, r) => {
      const a = BLOOM_ALPHA[r];
      const c = (i: number) => solve(ramp[level][i], ground[i], a);
      return `rgba(${c(0)},${c(1)},${c(2)},${a})`;
    }),
  );
}

/**
 * Switches the ground the field paints onto.
 *
 * Called by `DitherField` when the theme changes, before the next layout. The
 * grid, the masks, the alpha curve, the dot sizes and every piece of geometry
 * are untouched: a theme here is a palette and nothing else.
 */
export function setFieldTheme(theme: FieldTheme): void {
  const light = theme === "light";
  ramp = light ? RAMP_ON_PAPER : RAMP_ON_BLACK;
  ground = light ? RAMP_ON_PAPER[0] : [0, 0, 0];
  buildFills(light);
}

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
 * How much of that survives on a light ground.
 *
 * Not the same number, and not a taste call. Bloom on black adds light to
 * nothing, so the ring lands at luminance 21 and is barely there. The same
 * alpha on a near-white ground is ink laid over 243, which lands at 221 — a
 * visible grey ring around every hot mark, and a hot mark on a light ground is
 * the *darkest* thing in the frame, so the ring reads as a smudge rather than
 * as bleed. A ground this bright also cannot reach the declared target at 5%
 * coverage at all: `solve` clamps to pure ink and the ring becomes a plain
 * darkening. Halved, it does what bloom is for, which is to stop the hottest
 * marks ending on a hard edge.
 */
const BLOOM_LIGHT_SCALE = 0.5;

/** Seeds the ramp. Down here because `buildFills` needs `BLOOM_RINGS`. */
setFieldTheme("dark");

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
 * **Two levels, and it cannot be more.** The reference the palette is drawn
 * from makes *every* cell of its subject a character, not only the hottest, and
 * that is the first thing anyone will reach for next. It does not survive the
 * arithmetic. At the desktop pitch of about 5.9px a level 4 mark is 3.0px
 * across, and `GLYPH_PX` puts a 3x5 matrix inside it at 0.84px an element,
 * which is sub-pixel and renders as mush rather than as a character. The other
 * way round, coarsening the grid to the reference's roughly 12px cell, is ruled
 * out by the constraint `PITCH_PER_PX` already states: pitch is driven by the
 * wordmark, and below about ten cells per letter the letterforms stop
 * resolving. The reference is one still image and can pick its cell size; this
 * grid has to spell MIKOSHI at every viewport width.
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
 * The coverage at which one of the method's forms counts as fully present.
 *
 * Measured, not chosen: at 1920x1080 the source cell covers 0.054 of the grid
 * and the target 0.047. A gain says a form is switched on and says nothing
 * about how much frame it occupies, so suppressing the ground wash by gain
 * alone takes the same texture out of the frame whatever is actually in it.
 * Pinned to the denser of the two, the source cell suppresses the ground
 * exactly as much as it always did and the target lets a little back in.
 *
 * **This once mattered a great deal more than it does now**, and the note is
 * kept because the shape of the problem will come back if a third form ever
 * does. The method used to run a Work Engram between these two, a diagram
 * covering 0.019, nearly three times sparser than the silhouettes either side
 * of it. Weighted by gain alone that shot came out visibly darker than its
 * neighbours; weighted by straight proportion it came out *brighter*, measured
 * 3.66 mean luminance against 2.5 and 2.1. The floor below is what held all
 * three inside a narrow band. With two silhouettes of similar density it barely
 * does anything, and it is left in place rather than tuned out because it costs
 * one compare and it is the thing that makes an unlike form safe to add.
 *
 * Applied only to the method's two channels. The wordmark, the footer bookend
 * and the photograph each have one fixed shape and one meaning, so weighting
 * them would change three other beats to fix a problem none of them has.
 */
const COVER_REF = 0.054;

/** How much of the wash a form displaces, from its coverage. See above. */
const COVER_FLOOR = 0.55;
const weigh = (cover: number) =>
  cover > COVER_REF
    ? 1
    : COVER_FLOOR + (1 - COVER_FLOOR) * (cover / COVER_REF);

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
   * There is no third form. The middle step holds the source cell, which is
   * the body the work is still attached to while it is being recovered. See
   * the note where the engram used to be drawn, in lib/forms.ts.
   */
  maskSource: Float32Array;
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
  /**
   * Mean coverage of each mask, 0..1, filled by `sampleMask` as it samples.
   *
   * The one thing a gain cannot tell the renderer: how much of the frame a form
   * actually occupies. Used to suppress the ground wash in proportion to what
   * is really on screen rather than to what has been switched on.
   */
  cover: Record<MaskTarget, number>;
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
    cover: {
      mask: 0,
      maskAlt: 0,
      maskSource: 0,
      maskTarget: 0,
      maskPhoto: 0,
    },
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
  let covered = 0;

  // Four taps a quarter-pitch out from the centre, not one at the centre.
  //
  // A single tap makes coverage binary, and binary coverage is why the forms
  // read as bright blocks: a machine ended at a hard rectangle edge with
  // nothing between it and the ground, so the silhouette had a border instead
  // of a falloff. Four taps give a cell partial coverage wherever an edge
  // crosses it, which is what lets a form feather into the field and what makes
  // the level ramp usable across an edge rather than only across a light.
  //
  // Cost is four index lookups against one, once per layout, into an ImageData
  // buffer that is already being read in full.
  const q = Math.max(1, Math.round(grid.spacing / 4));
  const maxX = off.width - 1;
  const maxY = off.height - 1;
  // Red channel is enough: the mask is drawn in pure white on black.
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
    const v =
      (tap(px - q, py - q) +
        tap(px + q, py - q) +
        tap(px - q, py + q) +
        tap(px + q, py + q)) /
      1020;
    buffer[i] = v;
    covered += v;
  }

  // How much of the grid this form actually occupies.
  //
  // Read by `renderFrame` to decide how far to suppress the ground wash, since
  // a gain is not a measure of visual weight. See `COVER_REF`.
  grid.cover[into] = grid.count > 0 ? covered / grid.count : 0;
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
   * The method's handover: the form on its way out, the one arriving, and the
   * line between them.
   *
   * Ahead of `wipeY` the outgoing form is still standing; behind it the
   * incoming one has already resolved. `wipeSoft` is the feather half-width, so
   * the line is an edge rather than a cut. Both names index the grid's mask
   * buffers directly and are hoisted out of the per-cell loop.
   */
  formOut: FormName | null;
  outGain: number;
  formIn: FormName | null;
  inGain: number;
  wipeY: number;
  wipeSoft: number;
  /**
   * A key light belonging to the form rather than to the cursor, in CSS pixels.
   *
   * It multiplies form coverage only, so it lights a machine without lifting
   * the ground the machine stands on.
   */
  formLightX: number;
  formLightY: number;
  /** Two radii, so the light is shaped like the gesture it belongs to. */
  formLightRX: number;
  formLightRY: number;
  formLightGain: number;
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
    formOut,
    outGain,
    formIn,
    inGain,
    wipeY,
    wipeSoft,
    formLightX,
    formLightY,
    formLightRX,
    formLightRY,
    formLightGain,
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
  //
  // The method's two form channels are *blended* here, not summed, because a
  // wipe partitions the frame rather than stacking on it: above the line only
  // the incoming form exists and below it only the outgoing one, so what is on
  // screen at any moment is one form's worth in total. Summing them made a
  // sweep read as twice the subject, which drove the suppression to its ceiling
  // and pulled the ground out from under the handover — the frame measurably
  // dimmed in the middle of every sweep, which is the one moment it must not.
  //
  // And weighted by measured coverage, because a gain says a form is switched
  // on and says nothing about how much frame it occupies. See `COVER_REF`.
  const cover = grid.cover;
  const outWeight = formOut ? outGain * weigh(cover[formOut]) : 0;
  const inWeight = formIn ? inGain * weigh(cover[formIn]) : 0;
  const blending = outWeight > 0 && inWeight > 0;
  // Fraction of the frame the line has already crossed.
  const wipeShare = blending ? clamp(wipeY / (height || 1), 0, 1) : 0;
  const formShare = blending
    ? outWeight * (1 - wipeShare) + inWeight * wipeShare
    : outWeight + inWeight;
  const formPresence = Math.min(
    1,
    maskGain + altGain + photoGain + formShare,
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

  // The handover, resolved to buffers once rather than per cell.
  //
  // A mask name costs a property load on the grid; done inside the loop that is
  // 40,000 of them a frame for a value that cannot change during the frame. So
  // both arrays and every scalar the blend needs are pulled out here, and the
  // loop sees plain locals.
  const maskIn = formIn && inGain > 0.002 ? grid[formIn] : null;
  const maskOut = formOut && outGain > 0.002 ? grid[formOut] : null;
  // Only worth blending when both are live. One form alone is a single
  // multiply-add and needs no line at all.
  const wiping = maskIn !== null && maskOut !== null;
  const invWipe = 1 / Math.max(1, wipeSoft);

  // The form's own key light. Same gate as the band: off-sequence this is one
  // compare per frame, not per cell.
  const formLit = formLightGain > 0.002;
  const invFormRX2 = 1 / Math.max(1, formLightRX * formLightRX);
  const invFormRY2 = 1 / Math.max(1, formLightRY * formLightRY);
  /**
   * How far the key light lifts a form, on top of everything else.
   *
   * Set so a fully lit cell lands at the top of the ramp and not past it: a
   * cold form floor of 0.4 through the 0.75 global fade is 0.30, and 0.55 more
   * puts it at 0.85, which quantises to level 6 or 7 depending on the cell's
   * Bayer threshold. Hot core, and still a core rather than a stencil.
   */
  const KEY_LIFT = 0.55;

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
    let m = mk * maskGain + grid.maskAlt[i] * altGain + grid.maskPhoto[i] * photoGain;

    // The method's forms, blended across the wipe line.
    //
    // `t` is 1 well above the line and 0 well below it, so behind the sweep the
    // incoming form has fully resolved and ahead of it the outgoing one is
    // still standing. The two branches are taken identically by every cell in a
    // frame, so they predict perfectly; what they save is real work, since off
    // the sequence there is nothing here to do at all.
    if (wiping) {
      const t = clamp((wipeY - py) * invWipe + 0.5, 0, 1);
      m += maskIn![i] * inGain * t + maskOut![i] * outGain * (1 - t);
    } else if (maskIn) {
      m += maskIn[i] * inGain;
    } else if (maskOut) {
      m += maskOut[i] * outGain;
    }

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

    // The form's own key light, evaluated only while the sequence is running.
    //
    // Quadratic falloff to zero at the radius, like the cursor's core term, so
    // it has an edge you can see travelling rather than an unbounded glow.
    let keyLit = 0;
    if (formLit) {
      const fx = px - formLightX;
      const fy = py - formLightY;
      // Two radii rather than one, which is one more multiply and one fewer:
      // the falloff is an ellipse, so a pass down the frame can carry a wide
      // shallow scan band and a read across it can carry a narrow tall
      // playhead, instead of both being the same disc travelling differently.
      const fd2 = fx * fx * invFormRX2 + fy * fy * invFormRY2;
      if (fd2 < 1) keyLit = (1 - fd2) * (1 - fd2) * formLightGain;
    }
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
    //
    // The key light is deliberately *not* in here. See `intensity` below.
    const base = m * (0.4 + lit * 0.5) + lit * bareLight + wash;

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
    const keyed = m * keyLit * KEY_LIFT;
    if ((base + ambient) * globalFade + keyed <= 0.066) continue;

    // Ambient shimmer keeps the dark field alive without reading as noise.
    const shimmer = SIN_LUT[(tIdx + grid.phase[i]) & (SIN_STEPS - 1)];
    // The key light is added *after* the global fade rather than folded into
    // `base` with the cursor's light.
    //
    // `globalFade` bottoms out at FIELD_FLOOR, 0.75, everywhere past the hero:
    // it exists so the field calms down once the wordmark has come apart. Put
    // through it, a fully key-lit form cell reached 0.71 and quantised to level
    // 5 or 6, so the method's hot core could not exist however the coefficients
    // were set — measured across all four shots, level 7 was empty in every one
    // the scan band did not happen to be crossing. Raising the coefficients
    // instead would have driven the hero's wordmark, which is *not* faded,
    // straight past the top of the ramp and flattened it back into a stencil.
    //
    // So the section's key light is exempt. It is a light someone aimed, not
    // ambience left over from the hero, and it should not be dimmed by the
    // hero's decay.
    const intensity =
      ((base + ambient * shimmer) * globalFade + keyed) * gate;

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
      const fills = BLOOM_FILL[level];
      for (let r = 0; r < BLOOM_RINGS.length; r++) {
        const ring = BLOOM_RINGS[r];
        const rx = (mark * ring.scale) / 2;
        const ry = rx + smear / 2;
        ctx.fillStyle = fills[r];
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
