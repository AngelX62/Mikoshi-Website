#!/usr/bin/env node
/**
 * Duotone a photograph into the site's palette, and measure the result.
 *
 * ── WHY THIS IS BAKED RATHER THAN DONE IN CSS ────────────────────────────────
 * The obvious alternative is a `filter:` chain on the `<img>`, which is three
 * lines and needs no build step. It was rejected for two reasons.
 *
 * The first is that `saturate()` and `hue-rotate()` are defined as matrices over
 * linear light, and where a given red *lands* under them is not predictable by
 * reading the declaration. The accent on this site is one specific value,
 * `#962a45`, and the whole point of toning the plate is to hit it. A filter
 * chain can be tuned until it looks close in a browser; it cannot be checked.
 *
 * The second is `mix-blend-mode`. Dropping the photograph's studio background
 * onto bone wants a multiply, and this site already has a fixed multiply layer
 * over the whole viewport (Grain.tsx) plus an `isolation: isolate` on the home
 * hero. Adding a third blending participant to that stack is a thing you debug,
 * not a thing you declare.
 *
 * So the mapping happens once, here, in Node, where every value can be printed.
 * The numbers this script reports are the same kind of evidence the `qualities`
 * table in next.config.ts carries, and they were arrived at the same way.
 *
 * ── THE PLATE USES ONLY COLOURS THAT ALREADY EXIST ───────────────────────────
 * Every output pixel is a blend of four tokens lifted from globals.css and
 * nothing else: ink, ground, accent, accent-rule. That is a stronger guarantee
 * than "toned to look right". A photograph mapped onto the site's own four
 * values cannot introduce a fifth colour to the sheet, which is what makes it
 * sit in the paper rather than on top of it.
 *
 * Usage:  node scripts/tone-plate.mjs [source] [output]
 *
 * With no arguments it does the real job. Both paths can be overridden to try
 * the mapping on something else without touching what ships, which is how the
 * ramps below were checked against a synthetic swatch before there was a
 * photograph to check them against.
 *
 * Rerun it whenever the master is replaced. The output is a build artifact of
 * the input and is safe to delete.
 */

import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, "src/assets/research-plate.png");
const OUTPUT = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "src/assets/research-plate.webp");

/**
 * The four tokens, straight from globals.css. Keep them in step with that file.
 *
 * `ACCENT_RULE` is the hairline value of the accent and is the top of the warm
 * ramp, so the hot core of a light source blows out toward rose rather than
 * toward white. Using the existing token rather than inventing a highlight is
 * what keeps the promise in the docblock above.
 */
const INK = [0x14, 0x12, 0x0e];
const GROUND = [0xf1, 0xee, 0xe8];
const ACCENT = [0x96, 0x2a, 0x45];
const ACCENT_RULE = [0xd8, 0xa9, 0xb4];

/**
 * Where the red mask opens and where it saturates, in units of `R - max(G, B)`.
 *
 * Below FLOOR the pixel is treated as neutral, which is what keeps the bodywork,
 * the studio sweep and the motion smear on the cool ramp. Above CEILING it is
 * fully warm. The band between them is what stops the taillight acquiring a hard
 * edge it does not have in the photograph.
 */
const RED_FLOOR = 24;
const RED_CEILING = 88;

/**
 * The smallest `R - max(G, B)` the blown-highlight measure will trust.
 *
 * See `redWarmth`. Measured against this master: the taillight's blown core sits
 * at 17 and the specular white in the studio sweep sits at 1 to 4, so anything
 * in between separates them. 1492 pixels, 0.095% of the frame, are on the wrong
 * side of it without this floor and they are all pure white.
 */
const BLOWN_FLOOR = 8;

/**
 * How far the edges fade out, in master pixels, on all four sides.
 *
 * ── ONE DISTANCE, NOT A PERCENTAGE PER AXIS ─────────────────────────────────
 * The obvious spelling is "10% of each dimension", and on a 16:9 frame that is
 * 166px across and 93px down: the sides would fade almost twice as far as the
 * top and bottom, and the result reads as a horizontal smear rather than a
 * picture dissolving. A single distance renders as the same falloff on every
 * side, which at the 760px the plate occupies is about 55 screen pixels.
 *
 * Raise it for a softer dissolve, lower it for more picture. It is the only
 * number worth touching here.
 */
const FEATHER = 120;

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);
const mix = (a, b, t) => a + (b - a) * t;
const hex = (rgb) => "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

/**
 * Smoothstep, and it is not interchangeable with a linear ramp here.
 *
 * A linear fade has a discontinuity in its first derivative at both ends, and
 * against a flat ground the eye finds it: there is a faint but real line where
 * the fade begins, which is the exact artifact feathering is meant to remove.
 * Smoothstep leaves the slope at zero at both ends, so the fade has no visible
 * start and no visible finish.
 */
const smoothstep = (t) => t * t * (3 - 2 * t);

/**
 * Edge alpha for one pixel: 0 at the border, 1 once it is FEATHER inside.
 *
 * **The four falloffs multiply rather than taking their minimum.** `min` gives
 * a uniform border and leaves the corners as square as they started, so the
 * frame still reads as a rectangle with soft sides. Multiplying makes a corner
 * carry both falloffs at once, so it dissolves first, and nothing in the result
 * announces that the source was a rectangle at all.
 */
function edgeAlpha(x, y, width, height) {
  const left = smoothstep(clamp01(x / FEATHER));
  const right = smoothstep(clamp01((width - 1 - x) / FEATHER));
  const top = smoothstep(clamp01(y / FEATHER));
  const bottom = smoothstep(clamp01((height - 1 - y) / FEATHER));
  return left * right * top * bottom;
}

/** Rec. 709 luma, normalised. The same luma the ASCII pipeline uses. */
const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** HSV saturation, normalised. Used only for reporting. */
function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  if (max === 0) return 0;
  return (max - Math.min(r, g, b)) / max;
}

/**
 * How warm a pixel is, on 0 to 1, by the stronger of two measures.
 *
 * ── ONE MEASURE WAS NOT ENOUGH, AND THE FAILURE WAS VISIBLE ─────────────────
 * This used to be `(R - max(G,B) - RED_FLOOR) / (RED_CEILING - RED_FLOOR)` and
 * nothing else, which is correct for every red in the frame except the one that
 * matters most: **the blown core of the light itself**.
 *
 * A taillight photographed at speed has a centre that clips. In this master the
 * body of the streak reads 246,10,16 and keys at full warmth, while its core
 * reads 254,237,224 — obviously the same light, obviously red, and an absolute
 * difference of 17, which is *under* the floor. So the core fell through to the
 * neutral ramp and came out bone white: a hard white blob in the middle of a
 * wine-red smear, which looked like damage rather than like a bright light.
 *
 * The absolute measure cannot see it, and the reason is arithmetic rather than
 * tuning: at 254,237,224 there is only 18 units of headroom left before white,
 * so the largest red bias that pixel could *possibly* carry is 18. It is
 * carrying 17 of them. It is as red as a pixel that bright is able to be.
 *
 * So the second measure asks that question directly — what share of the
 * available headroom is red — and the two are combined by taking whichever is
 * stronger. The absolute one governs ordinary and dark reds, where headroom is
 * plentiful and the ratio would under-read. The headroom one governs clipped
 * highlights, where the absolute difference is compressed by the ceiling.
 *
 * `BLOWN_FLOOR` is what stops the headroom measure amplifying noise: near pure
 * white the denominator is tiny, so a one-unit difference in the studio sweep
 * would otherwise score 0.5 and tint the background pink.
 */
function redWarmth(r, g, b) {
  const ceiling = Math.max(g, b);
  const diff = r - ceiling;
  if (diff <= 0) return 0;

  const absolute = (diff - RED_FLOOR) / (RED_CEILING - RED_FLOOR);
  const headroom = diff >= BLOWN_FLOOR ? diff / (256 - ceiling) : 0;

  return clamp01(Math.max(absolute, headroom));
}

/** Ink at black, ground at white. The greys become this site's paper and ink. */
function neutralRamp(l) {
  return [mix(INK[0], GROUND[0], l), mix(INK[1], GROUND[1], l), mix(INK[2], GROUND[2], l)];
}

/**
 * Ink at black, accent at midtone, accent-rule at white.
 *
 * Two segments rather than one, because a single ink-to-accent-rule ramp passes
 * nowhere near `#962a45`: the accent is a dark, desaturated red and sits well
 * below the midpoint of that line. Pinning it at l = 0.5 is what guarantees the
 * body of the taillight lands on the token instead of near it.
 */
function accentRamp(l) {
  const [from, to, t] = l < 0.5 ? [INK, ACCENT, l * 2] : [ACCENT, ACCENT_RULE, (l - 0.5) * 2];
  return [mix(from[0], to[0], t), mix(from[1], to[1], t), mix(from[2], to[2], t)];
}

/**
 * Scan raw RGBA and report the values worth checking.
 *
 * ── `peakColourfulness` RATHER THAN PEAK SATURATION, AND THE REASON MATTERS ──
 * HSV saturation alone says the wrong thing here. The accent is a dark red and
 * scores 0.72 on it; a blown taillight core scores *lower*, because saturation
 * is normalised by value and near-white is near-zero saturation. Reported that
 * way, toning a bright red down onto the accent looks like it made the picture
 * louder, which is the opposite of what happened.
 *
 * Saturation times value is the honest one for "how much colour is on the page".
 * It is what a reader's eye is doing: a dark, fully saturated red is a quieter
 * event than a bright, half-saturated one covering the same area.
 */
function measure(data, channels) {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let peakColourfulness = 0;
  let reddest = -Infinity;
  let reddestPixel = [0, 0, 0];
  const pixels = data.length / channels;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    const value = Math.max(r, g, b) / 255;
    peakColourfulness = Math.max(peakColourfulness, saturation(r, g, b) * value);
    const redness = r - Math.max(g, b);
    if (redness > reddest) {
      reddest = redness;
      reddestPixel = [r, g, b];
    }
  }

  return {
    mean: [sumR / pixels, sumG / pixels, sumB / pixels],
    peakColourfulness,
    reddest,
    reddestPixel,
  };
}

/** Euclidean distance in sRGB. Crude, and adequate for "did we land on it". */
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

async function main() {
  try {
    await stat(SOURCE);
  } catch {
    console.error(
      `\nNo master at ${path.relative(ROOT, SOURCE)}\n\n` +
        "Save the image there first. It needs to be at least 1520px wide: the\n" +
        "plate is 47.5rem (760px) and a 2x display needs double that.\n",
    );
    process.exitCode = 1;
    return;
  }

  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const before = measure(data, channels);
  const out = Buffer.allocUnsafe(data.length);
  let opaquePixels = 0;

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const l = luma(r, g, b);
    const warmth = redWarmth(r, g, b);

    const cool = neutralRamp(l);
    const warm = accentRamp(l);

    out[i] = mix(cool[0], warm[0], warmth);
    out[i + 1] = mix(cool[1], warm[1], warmth);
    out[i + 2] = mix(cool[2], warm[2], warmth);

    /**
     * The feather, multiplied into whatever alpha the master already carried so
     * a source with its own transparency is not quietly made opaque.
     */
    const edge = edgeAlpha(p % width, Math.floor(p / width), width, height);
    out[i + 3] = data[i + 3] * edge;
    if (out[i + 3] >= 254) opaquePixels++;
  }

  const after = measure(out, channels);

  await sharp(out, { raw: { width, height, channels } })
    .webp({ quality: 90 })
    .toFile(OUTPUT);

  const sourceBytes = (await stat(SOURCE)).size;
  const outputBytes = (await stat(OUTPUT)).size;
  const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
  const triple = (rgb) => rgb.map((c) => c.toFixed(1).padStart(5)).join(" ");

  /**
   * The ceiling every output pixel is constructed to sit under.
   *
   * Nothing in the result can be more colourful than the most colourful of the
   * four tokens it is blended from, and that is the accent. Printing the ceiling
   * beside the measurement is what turns the number into a check: at or below
   * means the construction held, above means a bug.
   */
  const ceiling = saturation(...ACCENT) * (Math.max(...ACCENT) / 255);

  /** What the feather costs, as a share of the frame left fully opaque. */
  const opaqueShare = opaquePixels / (width * height);
  /** The same falloff expressed where it is actually seen, at 760px wide. */
  const onScreen = (FEATHER / width) * 760;

  console.log(`
  ${path.relative(ROOT, SOURCE)}  ->  ${path.relative(ROOT, OUTPUT)}
  ${width} x ${height}

                            before            after
  mean RGB            ${triple(before.mean)}   ${triple(after.mean)}
  peak colourfulness         ${before.peakColourfulness.toFixed(3)}            ${after.peakColourfulness.toFixed(3)}
  reddest pixel            ${hex(before.reddestPixel)}          ${hex(after.reddestPixel)}
  size                  ${kb(sourceBytes).padStart(8)}         ${kb(outputBytes).padStart(8)}

  colourfulness ceiling      ${ceiling.toFixed(3)}   (the accent itself)
  accent target            ${hex(ACCENT)}
  reddest pixel is ${distance(after.reddestPixel, ACCENT).toFixed(1)} from it in sRGB

  feather                  ${FEATHER}px on every edge, ${onScreen.toFixed(0)}px as rendered at 760
  fully opaque             ${(opaqueShare * 100).toFixed(1)}% of the frame
`);

  if (after.peakColourfulness > ceiling + 0.01) {
    console.warn(
      "  WARNING: something in the output is more colourful than the accent.\n" +
        "  Every pixel is meant to be a blend of four palette tokens, so this is\n" +
        "  a bug in the ramps rather than a property of the photograph.\n",
    );
  }

  if (opaqueShare < 0.35) {
    console.warn(
      `  WARNING: only ${(opaqueShare * 100).toFixed(1)}% of the frame is fully opaque.\n` +
        `  FEATHER is ${FEATHER}px against a ${width}x${height} master, which is eating\n` +
        "  the picture rather than softening its edges. Lower it.\n",
    );
  }

  if (width < 1520) {
    console.warn(
      `  WARNING: master is ${width}px wide. The plate is 760px and needs 1520px\n` +
        "  for a 2x display. Do not upscale it; export the artwork larger.\n" +
        "  See the measurements in next.config.ts for why upscaling loses.\n",
    );
  }
}

await main();
