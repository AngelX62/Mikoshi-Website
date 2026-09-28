#!/usr/bin/env node
/**
 * Print a light-on-dark stipple image as ink on transparency, and measure it.
 *
 * ── PARKED ON 22 SEPTEMBER 2026 ──────────────────────────────────────────────
 * The footer now carries a colour gradient instead: see footer-gradient.mjs and
 * Footer.tsx. This script, its master `src/assets/footer-field.png` and its
 * output `footer-field.webp` were kept on purpose, so the stipple can come back.
 * Nothing imports the output now, so it costs the build nothing.
 *
 * Putting it back takes three things beyond this file, and the last two were
 * removed with it:
 *
 *   1. The footer on the tint again: `tint relative w-full border-t border-rule`
 *      in place of `dusk`, which also restores the paper's ink tokens.
 *   2. The art, from `lg` up only, height-fitted and anchored left:
 *        <div aria-hidden="true" className="footer-field pointer-events-none
 *             absolute inset-0 hidden overflow-hidden lg:block">
 *          <Image src={footerField} alt="" unoptimized
 *                 className="absolute left-0 top-0 h-full w-auto max-w-none" />
 *        </div>
 *   3. The mask that keeps it off the colophon, which was measured clear of the
 *      text by 27px at every width from 640 to 2560:
 *        .footer-field {
 *          --fade: linear-gradient(to right,
 *            #000 calc(50% - 24rem), rgb(0 0 0 / 0.84) calc(50% - 21.25rem),
 *            rgb(0 0 0 / 0.5) calc(50% - 18.5rem),
 *            rgb(0 0 0 / 0.16) calc(50% - 15.75rem),
 *            transparent calc(50% - 13rem));
 *          -webkit-mask-image: var(--fade);
 *          mask-image: var(--fade);
 *        }
 *
 * ── THE SIBLING OF tone-plate.mjs, AND WHY IT IS NOT A FLAG ON IT ────────────
 * tone-plate turns a photograph into an opaque picture made of the site's four
 * colours. This produces no paper at all. Every pixel is ink and the only thing
 * that varies is how much of it there is, so the band's own ground shows through
 * wherever the source was dark. The art cannot disagree with the paper it sits
 * on, and the paper can change without a rebake. That is a different output with
 * a different contract, which is why it is a second script rather than a mode.
 *
 * ── LIGHT BECOMES INK ────────────────────────────────────────────────────────
 * The source is light on a dark ground. On paper the equivalent runs the other
 * way: where the source is bright, ink is laid down. That is how the hero's wave
 * already builds its tone, from the density of its points rather than from a
 * fill, so the footer closes the page in the same hand that opened it.
 *
 * Colour in the source is discarded. It was silver and tan, and the only
 * colours this site prints are ink and, for what is under test, rose. A footer
 * is not under test.
 *
 * ── TEXT IS NOT PROTECTED HERE, AND THAT IS DELIBERATE ───────────────────────
 * The footer's grey labels clear 4.5:1 on the tint with almost no room, so ink
 * of any weight behind them fails. Keeping them clear is a layout fact, not an
 * image fact: where the text sits depends on the viewport. The `.footer-field`
 * mask in globals.css erases the art short of the colophon's column at every
 * width. Nothing in this file needs to know where the text is.
 *
 * Usage:  node scripts/ink-field.mjs [source] [output]
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
  : path.join(ROOT, "src/assets/footer-field.png");
const OUTPUT = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "src/assets/footer-field.webp");

/** `--color-ink` from globals.css. Keep it in step with that file. */
const INK = [0x14, 0x12, 0x0e];

/**
 * Where ink starts, as luma.
 *
 * At or below this the source is its own dark ground plus that ground's noise,
 * and it prints nothing. Measured on the current master, the dark right third
 * never rises above 0.153 even at the 99.9th percentile, so 0.16 sits just clear
 * of it. Set it lower and the whole band acquires a faint grey haze of printed
 * noise; the report warns when that is about to happen.
 */
const FLOOR = 0.16;

/**
 * Where ink is at its heaviest, as luma.
 *
 * The whole master's 99th percentile is 0.81 and the crest's 90th is 0.91, so
 * 0.85 lets the brightest of the crest saturate while the rest of it keeps the
 * speckle the source was drawn with. Raise it and the crest goes greyer and more
 * granular; lower it and it closes up into a solid stroke.
 */
const CEILING = 0.85;

/**
 * The heaviest the ink is allowed to get.
 *
 * Half strength, so the densest part of the crest reads as a pencil shading
 * rather than as a black band across the bottom of every page. It is the only
 * number here worth tuning by eye.
 */
const MAX_ALPHA = 0.5;

/**
 * A slight Gaussian softening of the source before it is mapped, in source pixels.
 *
 * ── THE SPECKLE WAS COSTING 280 KB AND THE GRAIN LAYER ALREADY PROVIDES IT ───
 * Every pixel's alpha in the raw master is independent noise, and noise is the
 * one thing no encoder can compress: unsoftened, the art served at 283 KB for a
 * 1x screen and 392 KB for a 2x one, for a decoration at the foot of the page.
 *
 * Most of that noise never reaches a reader anyway. At 1x the art is drawn at 60%
 * of its master size, which averages neighbouring pixels together, and Grain.tsx
 * multiplies its own pixel-scale noise over the whole page, this art included.
 * So the fine speckle is softened out here and the site's grain puts a texture
 * back that matches every other surface on the page. At 0.8 the shape and the
 * coarser stipple survive; compared side by side at rendered size, the
 * difference only shows at 1.8.
 */
const SOFTEN = 0.8;

/**
 * Alpha quality for the WebP encoder, 0 to 100, where 100 is lossless.
 *
 * Lossless is the default, and it is what Next's image optimiser uses, which is
 * why this file is served `unoptimized`: see Footer.tsx. Lossy alpha at 50 took
 * the softened art from 277 KB to 99 KB, at a mean alpha error of 0.94 in 255,
 * which is below anything a screen can show on a stipple.
 */
const ALPHA_QUALITY = 50;

/**
 * The shortest master that stays sharp.
 *
 * The art is set as tall as the footer, which is 435px from `md` up, so a 2x
 * display wants 870 source pixels. Shorter still works; the browser upscales it,
 * and stipple is the first thing that goes soft when it does.
 */
const MIN_HEIGHT = 870;

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);
const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** A percentile of a typed array, which is sorted in place. */
function percentile(values, p) {
  values.sort();
  return values[Math.min(values.length - 1, Math.floor((p / 100) * values.length))];
}

async function main() {
  try {
    await stat(SOURCE);
  } catch {
    console.error(`\nNo master at ${path.relative(ROOT, SOURCE)}\n`);
    process.exit(1);
  }

  let pipeline = sharp(SOURCE).removeAlpha();
  if (SOFTEN > 0) pipeline = pipeline.blur(SOFTEN);
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const pixels = width * height;

  const out = Buffer.alloc(pixels * 4);
  const lumas = new Float32Array(pixels);
  let inked = 0;
  let alphaSum = 0;

  for (let p = 0; p < pixels; p++) {
    const i = p * channels;
    const l = luma(data[i], data[i + 1], data[i + 2]);
    lumas[p] = l;

    // Linear on purpose. The speckle is the texture, and a curve here would
    // compress the spread of neighbouring pixels that makes it read as stipple.
    const alpha = clamp01((l - FLOOR) / (CEILING - FLOOR)) * MAX_ALPHA;

    const o = p * 4;
    out[o] = INK[0];
    out[o + 1] = INK[1];
    out[o + 2] = INK[2];
    out[o + 3] = Math.round(alpha * 255);

    if (out[o + 3] > 0) inked++;
    alphaSum += alpha;
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: ALPHA_QUALITY })
    .toFile(OUTPUT);

  const sourceBytes = (await stat(SOURCE)).size;
  const outputBytes = (await stat(OUTPUT)).size;
  const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

  // Where the light lives, by tenth of the width. The mask in globals.css keeps
  // the art out of the colophon's column, so this says how much of it survives.
  const tenths = Array.from({ length: 10 }, () => [0, 0]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = tenths[Math.min(9, Math.floor((x / width) * 10))];
      t[0] += out[(y * width + x) * 4 + 3] / 255;
      t[1]++;
    }
  }
  const profile = tenths.map(([sum, n]) => (sum / n).toFixed(3)).join(" ");

  const noiseTop = percentile(lumas.slice(), 99.9);
  const median = percentile(lumas.slice(), 50);

  console.log(`
  ${path.relative(ROOT, SOURCE)}  ->  ${path.relative(ROOT, OUTPUT)}
  ${width} x ${height}   (${(width / height).toFixed(2)} : 1)

  floor / ceiling          ${FLOOR} / ${CEILING} luma
  max alpha                ${MAX_ALPHA}
  soften / alpha quality   ${SOFTEN}px / ${ALPHA_QUALITY}
  median source luma       ${median.toFixed(3)}   (the dark ground; must sit under the floor)
  pixels carrying ink      ${((inked / pixels) * 100).toFixed(1)}%
  mean alpha               ${(alphaSum / pixels).toFixed(3)}
  alpha by tenth of width  ${profile}
  size                     ${kb(sourceBytes)}  ->  ${kb(outputBytes)}
`);

  if (median >= FLOOR) {
    console.warn(
      "  WARNING: the median pixel is above FLOOR, so the dark ground itself is\n" +
        "  printing. Expect a grey haze across the whole band; raise FLOOR.\n",
    );
  }
  if (noiseTop > CEILING) {
    console.log(`  (99.9th percentile ${noiseTop.toFixed(3)} is above CEILING and saturates.)\n`);
  }
  if (height < MIN_HEIGHT) {
    console.warn(
      `  NOTE: the master is ${height}px tall. The footer is 435px, so a 2x display\n` +
        `  wants ${MIN_HEIGHT}. It will be upscaled ${(MIN_HEIGHT / height).toFixed(2)}x there and the stipple\n` +
        "  will soften. Re-export the source taller to fix it.\n",
    );
  }
}

main();
