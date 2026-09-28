#!/usr/bin/env node
/**
 * Encode the footer's gradient for the web, and measure what the encode costs it.
 *
 * ── NOTHING IN THE PICTURE CHANGES HERE ──────────────────────────────────────
 * Unlike ink-field.mjs and tone-plate.mjs there is no mapping. The footer shows
 * the gradient in its own colours, and everything that keeps the colophon
 * legible on it is CSS, in `.footer-art` in globals.css: it has to be centred on
 * the text at every width, and a picture cannot know where the text is. So this
 * only chooses an encoding and reports what that cost.
 *
 * ── QUALITY 80, AND THE GRAIN DECIDED IT ─────────────────────────────────────
 * This is a noise gradient. Under the colour it is almost entirely grain, and
 * grain is the one thing an encoder cannot compress. Measured against the first
 * master, grain being the mean distance of each pixel's lightness from its
 * neighbourhood's, in L* so the number tracks what an eye sees:
 *
 *     master      2.6 MB   1.96
 *     webp q90    363 KB   1.83    94%
 *     webp q85    238 KB   1.68    86%
 *     webp q80    177 KB   1.67    86%
 *     webp q75    128 KB   1.49    76%
 *
 * 85 costs 61 KB more than 80 for nothing measurable, and 75 is the first step
 * that visibly smooths it. AVIF at 60 kept the same grain in 134 KB and was not
 * taken: Safari before 16.4 cannot show it, so it needs a WebP beside it, and one
 * file for every screen is the point of baking this. See Footer.tsx.
 *
 * ── THE TEXT CHECK IS A WARNING, NOT A MEASUREMENT ───────────────────────────
 * The scrim in globals.css was tuned on the first master, whose brightest ground
 * under the colophon was 0.46 relative luminance. With it the faintest label
 * measured 5.3:1. A new master brighter than that in the middle may need the
 * scrim deepened, and the report says so. The honest check is still the
 * rendered page: hide the text, sample the pixels behind it, as Footer.tsx
 * describes.
 *
 * Usage:  node scripts/footer-gradient.mjs [source] [output]
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
  : path.join(ROOT, "src/assets/footer-gradient.png");
const OUTPUT = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "src/assets/footer-gradient.webp");

/** WebP quality, 0 to 100. See the table above before moving it. */
const QUALITY = 80;

/**
 * The brightest ground the scrim is known to handle, as relative luminance.
 *
 * 0.46 under the colophon on the first master, where the faintest label came out
 * at 5.3:1 against a 4.5 floor. A little over that is still likely fine; well
 * over it is worth measuring before it ships.
 */
const KNOWN_BRIGHTEST = 0.46;
const WARN_ABOVE = 0.5;

/**
 * Where the colophon's text sits, measured in the browser on 22 September 2026.
 *
 * **Line by line, not the column's bounding box.** The box also takes in the
 * empty ground either side of the wordmark, which is the brightest part of the
 * crest and has no text on it; checked that way, the master the scrim was tuned
 * on warned against itself.
 *
 * From `md` up the colophon is one centred column, so its lines are stored as
 * offsets from the footer's centre line: `[left, right, top, bottom]`. Below
 * `sm` it stacks differently and is stored as measured at 390. `object-fit:
 * cover`, centred, maps both onto the picture. If the colophon's layout
 * changes, these go stale and the check with them.
 */
const CENTRED_LINES = [
  [-65, 68, 103, 120], // mark and wordmark
  [-149, -57, 175, 188], // DISCIPLINE
  [-163, -42, 196, 213], // Training Efficiency
  [47, 130, 175, 188], // DIRECTION
  [15, 163, 196, 213], // v1.0, 7 September 2026
  [-182, 182, 265, 278], // the nav row
  [-79, 79, 327, 340], // copyright
];
const PHONE_LINES = [
  [123, 255, 87, 104],
  [39, 131, 159, 172],
  [25, 146, 180, 197],
  [235, 317, 159, 172],
  [202, 350, 180, 197],
  [24, 351, 249, 262],
  [109, 266, 311, 324],
];
const LAYOUTS = [
  { viewport: 390, footer: [375, 403], lines: PHONE_LINES },
  ...[
    [768, 753],
    [1440, 1425],
    [2560, 2545],
  ].map(([viewport, fw]) => ({
    viewport,
    footer: [fw, 435],
    lines: CENTRED_LINES.map(([l, r, t, b]) => [fw / 2 + l, fw / 2 + r, t, b]),
  })),
];

const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const lstar = (y) => 116 * (y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116) - 16;

/** Mean |L* - local L*|: how much grain there is, in the units an eye reads. */
async function grain(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const local = await sharp(input).removeAlpha().blur(3).raw().toBuffer();
  const { width, height, channels } = info;
  let sum = 0;
  let n = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * channels;
      const here = lstar(luminance(data[i], data[i + 1], data[i + 2]));
      const around = lstar(luminance(local[i], local[i + 1], local[i + 2]));
      sum += Math.abs(here - around);
      n++;
    }
  }
  return sum / n;
}

async function main() {
  try {
    await stat(SOURCE);
  } catch {
    console.error(`\nNo master at ${path.relative(ROOT, SOURCE)}\n`);
    process.exit(1);
  }

  await sharp(SOURCE).removeAlpha().webp({ quality: QUALITY }).toFile(OUTPUT);

  const { width, height } = await sharp(SOURCE).metadata();
  const sourceBytes = (await stat(SOURCE)).size;
  const outputBytes = (await stat(OUTPUT)).size;
  const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
  const [before, after] = [await grain(SOURCE), await grain(OUTPUT)];

  // The ground behind the colophon, grain blurred out so a speckle is not
  // mistaken for the ground, at each measured layout.
  const { data: tone, info } = await sharp(SOURCE)
    .removeAlpha()
    .blur(4)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = LAYOUTS.map(({ viewport, footer: [fw, fh], lines }) => {
    const scale = Math.max(fw / width, fh / height);
    const ox = (fw - width * scale) / 2;
    const oy = (fh - height * scale) / 2;
    let brightest = 0;
    for (const [x0, x1, y0, y1] of lines) {
      for (let y = Math.floor((y0 - oy) / scale); y <= Math.ceil((y1 - oy) / scale); y++) {
        for (let x = Math.floor((x0 - ox) / scale); x <= Math.ceil((x1 - ox) / scale); x++) {
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          const i = (y * width + x) * info.channels;
          brightest = Math.max(brightest, luminance(tone[i], tone[i + 1], tone[i + 2]));
        }
      }
    }
    return { viewport, scale, brightest };
  });
  const worst = Math.max(...rows.map((row) => row.brightest));

  console.log(`
  ${path.relative(ROOT, SOURCE)}  ->  ${path.relative(ROOT, OUTPUT)}
  ${width} x ${height}   (${(width / height).toFixed(2)} : 1)

  quality                  ${QUALITY}
  size                     ${kb(sourceBytes)}  ->  ${kb(outputBytes)}
  grain                    ${before.toFixed(2)}  ->  ${after.toFixed(2)}   (${((after / before) * 100).toFixed(0)}% kept)

  brightest ground under a line of the colophon, before the scrim
${rows.map((row) => `    ${String(row.viewport).padStart(4)}px   ${row.brightest.toFixed(3)}   drawn at ${row.scale.toFixed(2)}x, ${(row.scale * 2).toFixed(2)}x on a 2x screen`).join("\n")}
    known good               ${KNOWN_BRIGHTEST}
`);

  if (worst > WARN_ABOVE) {
    console.warn(
      `  WARNING: this master is brighter behind the text than the scrim was tuned\n` +
        `  for (${worst.toFixed(2)} against ${KNOWN_BRIGHTEST}). Measure the footer labels on the\n` +
        "  rendered page before shipping it; the scrim in globals.css may need deepening.\n",
    );
  }
}

main();
