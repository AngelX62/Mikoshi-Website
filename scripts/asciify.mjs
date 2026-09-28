/**
 * Turn a photograph into a character grid.
 *
 * Usage:
 *   node scripts/asciify.mjs public/source/figure.png --cols 200
 *   node scripts/asciify.mjs <src> [--cols N] [--crop x,y,w,h] [--aspect A]
 *                                  [--gamma G] [--floor F] [--falloff s,min,tilt]
 *                                  [--out path] [--preview]
 *
 * ── WHY A CHARACTER GRID AND NOT A CANVAS ────────────────────────────────────
 * This site has tried to carry an image three times and each attempt died on the
 * same class of problem: a halftone lattice moired against its own sample grid,
 * device pixel ratios rounded the cell pitch differently on every machine, and
 * the raster cost a frame budget to redraw. None of that exists for text. The
 * grid is computed once, here, and shipped as a string.
 *
 * ── THE ASPECT RATIO IS CONSTRUCTED, NOT MEASURED ────────────────────────────
 * A character cell is taller than it is wide, so sampling on a square grid
 * produces a figure stretched vertically by whatever the font's advance happens
 * to be. The obvious fix is to measure the face and match it, which is fragile:
 * it changes with the font, and it is wrong for the moment before the webfont
 * arrives.
 *
 * Instead the renderer PINS the ratio. In a monospace `1ch` is the advance width
 * of every glyph, and `line-height` accepts any length, so `line-height: 2ch`
 * makes the cell exactly twice as tall as it is wide whatever face is loaded.
 * `--aspect` here must equal `1 / (that multiplier)`. Default 0.5 for `2ch`.
 * See Figure.tsx, which declares it.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import path from "node:path";

/* ── PNG ─────────────────────────────────────────────────────────────────────
 * A minimal decoder rather than a dependency. The project ships `next`, `react`
 * and `react-dom` and nothing else, and adding an image library to a build
 * script that runs by hand a handful of times is a poor trade. Inflate plus
 * un-filter is most of a PNG; the rest is bookkeeping.
 *
 * Handles 8 and 16 bit, greyscale, RGB, palette and both alpha forms,
 * non-interlaced. Interlaced (Adam7) throws rather than producing a scrambled
 * image quietly, which is the failure that would otherwise be hard to read.
 */
function decodePng(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== sig[i]) throw new Error("not a PNG (bad signature)");
  }

  let pos = 8;
  let width = 0;
  let height = 0;
  let depth = 8;
  let colorType = 6;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "tRNS") {
      transparency = data;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (interlace !== 0) {
    throw new Error(
      "interlaced PNG (Adam7) is not supported. Re-export without interlacing.",
    );
  }
  if (depth !== 8 && depth !== 16) {
    throw new Error(`bit depth ${depth} is not supported. Re-export as 8-bit.`);
  }

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unknown PNG colour type ${colorType}`);

  const bytesPerSample = depth / 8;
  const bpp = channels * bytesPerSample;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));

  // Un-filter, in place, one scanline at a time. Each line is prefixed with its
  // filter byte and may refer to the line above, so this cannot be parallelised.
  const out = Buffer.alloc(height * stride);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          // Paeth: pick whichever neighbour the gradient predicts.
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default:
          throw new Error(`unknown PNG filter ${filter} on row ${y}`);
      }
      cur[x] = v & 0xff;
    }
  }

  // One luminance plane, premultiplied against black. The source is light on a
  // dark ground, so a transparent pixel is "no light" rather than "white".
  const lum = new Float32Array(width * height);
  const sample = (o) => (depth === 16 ? out[o * 2] : out[o]);

  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    let r;
    let g;
    let b;
    let a = 255;

    if (colorType === 0) {
      r = g = b = sample(o);
    } else if (colorType === 4) {
      r = g = b = sample(o);
      a = sample(o + 1);
    } else if (colorType === 2) {
      r = sample(o);
      g = sample(o + 1);
      b = sample(o + 2);
    } else if (colorType === 6) {
      r = sample(o);
      g = sample(o + 1);
      b = sample(o + 2);
      a = sample(o + 3);
    } else {
      // Palette. The index is the only stored channel.
      const idx = sample(o);
      r = palette[idx * 3];
      g = palette[idx * 3 + 1];
      b = palette[idx * 3 + 2];
      if (transparency && idx < transparency.length) a = transparency[idx];
    }

    // Rec. 709, which is the same luma the site's own ramp was derived on.
    lum[i] = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * (a / 255);
  }

  return { width, height, lum };
}

/* ── The ramp ────────────────────────────────────────────────────────────────
 * Ordered by how much ink each character puts on the cell, sparse to dense.
 * Deliberately short: a long ramp encodes tone the eye cannot separate at this
 * size and turns the figure into noise. These nine steps are the ones that stay
 * distinguishable in Martian Mono at 6 to 12px, which is the range this renders
 * at.
 *
 * The first entry is a space, so the ground is genuinely empty rather than a
 * field of dots. Most of this image is background and that is the whole reason
 * it can sit behind type.
 *
 * ── TONE IS CARRIED TWICE NOW, AND THE SECOND CARRIER IS INK ────────────────
 * One ink at two opacities was the first version, and it made a photograph of
 * light into a grey texture: every cell the same colour, only the glyph density
 * varying, which at 7px is a variation the eye barely resolves. The grid is now
 * split into tonal layers, dark to light, and Figure.tsx sets each layer in a
 * different ink from the plate's own scale. The glyph still encodes density
 * inside a layer; the ink says which layer it is. That is the difference between
 * a hand drawn in pencil and a hand drawn in pencil, pen and white chalk.
 *
 * ── CONTOURS ARE DRAWN, NOT DITHERED ────────────────────────────────────────
 * A density ramp cannot draw an edge. Where the silhouette runs, a ramp puts a
 * medium glyph next to a light one and the eye has to infer the boundary. So
 * each cell also gets a gradient, and where the gradient is strong the cell
 * takes a stroke glyph aligned to the edge instead of a density glyph: `-` along
 * a horizontal edge, `|` along a vertical one, `/` and `\` on the diagonals. The
 * outline of the hand comes out as a drawn line, which is what the patent
 * figures this site's chrome is lifted from do, and the interior stays tonal.
 */
const RAMP = " .:-=+*#%@";
const STROKES = ["-", "/", "|", "\\"];

const args = process.argv.slice(2);
const src = args[0];
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

if (!src || has("help")) {
  console.log(
    "usage: node scripts/asciify.mjs <src.png> [--cols N] [--crop x,y,w,h]\n" +
      "                                [--aspect A] [--gamma G] [--floor F]\n" +
      "                                [--bands q1,q2,q3] [--edge E] [--soften S]\n" +
      "                                [--falloff start,min,tilt]\n" +
      "                                [--out path] [--preview]",
  );
  process.exit(src ? 0 : 1);
}
if (!existsSync(src)) {
  console.error(`no such file: ${src}`);
  process.exit(1);
}

const cols = Number(flag("cols", 200));
const aspect = Number(flag("aspect", 0.5));
const gamma = Number(flag("gamma", 1));
const floor = Number(flag("floor", 0.04));
/*
 * Where the tonal layers split, as quantiles of the inked cells rather than as
 * absolute values. A fixed threshold is wrong for any source whose exposure
 * differs from the one it was tuned on; "the darkest 55% of what is drawn" is
 * not. Three cuts make four layers: base, mid, high, and a last sliver for the
 * very brightest cells, which Figure.tsx may set in the accent or may not.
 */
const bands = flag("bands", "0.55,0.85,0.995").split(",").map(Number);
/*
 * How strong a gradient has to be, as a fraction of the strongest in the grid,
 * before a cell is drawn as a stroke rather than as tone. 0 turns strokes off.
 */
const edge = Number(flag("edge", 0.42));
/*
 * How much of each cell's tone is borrowed from its neighbours, 0 to 1. The
 * source is scattered points, so even after box-averaging a cell can land
 * between particles and read as a hole in a surface that is continuous in the
 * photograph. Blending toward the 3x3 mean closes those holes without blurring
 * the outline, which is drawn from the gradient rather than from the tone.
 */
const soften = Number(flag("soften", 0));
/*
 * ── THE REACH AXIS ──────────────────────────────────────────────────────────
 * The subject is an arm, and an arm has a direction. `reach` is a coordinate
 * that runs 0 where the limb enters the frame to 1 at the fingertips, so every
 * part of this program can be told which way "further along" is.
 *
 * `--falloff start,min,tilt` scales tone by `min` at reach 0, ramping to 1 at
 * reach `start` and staying there. Default `0,1,0`, which is the identity: a
 * source that is not a limb gets exactly what it got before this existed.
 *
 * **Why tone and not just opacity.** Attenuating tone moves a cell across the
 * layer cuts, so the far end of the arm is drawn in a dimmer ink and with a
 * sparser glyph, and the very faintest of it falls under `--floor` and is not
 * drawn at all. That is three effects from one number, and all three are the
 * ones a receding limb should show. Fading a finished layer in CSS would give
 * none of them: it would dim an object that is still fully resolved, which is
 * haze rather than distance.
 *
 * **Why it is applied after the gradient pass.** The Sobel below runs on
 * unattenuated tone, so the arm's silhouette is found at full strength and
 * still gets drawn as strokes. The fill recedes and the outline holds, which is
 * how a drawing shows something far away rather than something out of focus.
 *
 * `tilt` shears the axis so its iso-lines sit perpendicular to a limb that
 * descends as it goes: positive tilt leans the axis with rows. It is shipped in
 * the emitted grid because Figure.tsx sweeps the entrance along this same axis,
 * and the two must not be able to disagree.
 */
const falloffArg = flag("falloff", "0,1,0").split(",").map(Number);
const foStart = Number.isFinite(falloffArg[0]) ? falloffArg[0] : 0;
const foMin = Number.isFinite(falloffArg[1]) ? falloffArg[1] : 1;
const tilt = Number.isFinite(falloffArg[2]) ? falloffArg[2] : 0;
const out = flag("out", "src/lib/figure.ts");

const { width, height, lum } = decodePng(readFileSync(src));

// The crop, in source pixels. Defaults to the whole image.
let [cx, cy, cw, ch] = (flag("crop", `0,0,${width},${height}`))
  .split(",")
  .map(Number);
cx = Math.max(0, Math.min(cx, width - 1));
cy = Math.max(0, Math.min(cy, height - 1));
cw = Math.max(1, Math.min(cw, width - cx));
ch = Math.max(1, Math.min(ch, height - cy));

/*
 * Rows follow from the crop and the cell aspect, never from a second flag.
 *
 * A cell samples `sw` by `sh` source pixels and must have the glyph box's own
 * proportions or the figure comes out stretched, so `sh = sw / aspect` and the
 * row count falls out. Passing rows independently is what lets the two disagree.
 */
const sw = cw / cols;
const sh = sw / aspect;
const rows = Math.max(1, Math.round(ch / sh));

/*
 * Box-average each cell rather than point-sampling its centre.
 *
 * The source is a particle render: bright isolated points on black. A point tap
 * lands between particles far more often than on one, so the figure comes out
 * with holes that move when the grid moves. Averaging the whole cell is what
 * turns scattered points into a density, which is the quantity the ramp is
 * meant to encode.
 */
function cellValue(col, row) {
  const x0 = Math.floor(cx + col * sw);
  const x1 = Math.min(width, Math.max(x0 + 1, Math.floor(cx + (col + 1) * sw)));
  const y0 = Math.floor(cy + row * sh);
  const y1 = Math.min(height, Math.max(y0 + 1, Math.floor(cy + (row + 1) * sh)));
  let sum = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    const base = y * width;
    for (let x = x0; x < x1; x++) {
      sum += lum[base + x];
      n++;
    }
  }
  return n ? sum / n : 0;
}

// Normalise against the crop's own range. An absolute threshold is wrong for
// any source whose exposure differs from the one it was tuned on.
let lo = Infinity;
let hi = -Infinity;
const cell = new Float32Array(cols * rows);
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const v = cellValue(c, r);
    cell[r * cols + c] = v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
}
const span = hi - lo || 1;

// Tone per cell, normalised and gamma-corrected, in [0, 1].
const tone = new Float32Array(cols * rows);
for (let i = 0; i < cols * rows; i++) {
  tone[i] = Math.pow(Math.max(0, (cell[i] - lo) / span), gamma);
}

/*
 * A 3x3 blur before the gradient. The source is scattered points, so the raw
 * gradient is spiky everywhere and would put stroke glyphs on noise. Smoothing
 * first means a stroke only appears where a real edge runs for several cells.
 */
const smooth = new Float32Array(cols * rows);
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
        sum += tone[rr * cols + cc];
        n++;
      }
    }
    smooth[r * cols + c] = sum / n;
  }
}
if (soften > 0) {
  for (let i = 0; i < cols * rows; i++) {
    tone[i] = tone[i] * (1 - soften) + smooth[i] * soften;
  }
}

/*
 * Sobel, corrected for the cell's proportions. A step of one row is a step of
 * `1 / aspect` cell widths in the picture, so the vertical difference has to be
 * scaled down by `aspect` before the two components are compared, or every
 * edge would lean toward horizontal.
 */
const gmag = new Float32Array(cols * rows);
const gang = new Float32Array(cols * rows);
let gmax = 0;
const at = (r, c) =>
  smooth[Math.min(rows - 1, Math.max(0, r)) * cols + Math.min(cols - 1, Math.max(0, c))];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const gx =
      at(r - 1, c + 1) + 2 * at(r, c + 1) + at(r + 1, c + 1) -
      (at(r - 1, c - 1) + 2 * at(r, c - 1) + at(r + 1, c - 1));
    const gy =
      (at(r + 1, c - 1) + 2 * at(r + 1, c) + at(r + 1, c + 1) -
        (at(r - 1, c - 1) + 2 * at(r - 1, c) + at(r - 1, c + 1))) *
      aspect;
    const m = Math.hypot(gx, gy);
    gmag[r * cols + c] = m;
    gang[r * cols + c] = Math.atan2(gy, gx);
    if (m > gmax) gmax = m;
  }
}

/*
 * Reach, and then the falloff along it. See the flag above for why.
 *
 * Unclamped on purpose: with a tilt the axis runs a little past both ends of
 * the grid, and the renderer needs the true range to sweep the whole figure.
 * Only the falloff clamps, and it clamps at the point of use.
 */
const reachAt = (c, r) => (c + 0.5) / cols + tilt * ((r + 0.5) / rows - 0.5);

if (foStart > 0 && foMin < 1) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = Math.min(1, Math.max(0, reachAt(c, r)));
      tone[r * cols + c] *= foMin + (1 - foMin) * Math.min(1, u / foStart);
    }
  }
}

/*
 * The glyph for every cell, decided once.
 *
 * A stroke where the gradient is strong, a density glyph otherwise, a space
 * below the floor. The floor is relaxed for strokes, because the outer cell of
 * a silhouette edge is by definition darker than the floor and it is exactly
 * the cell the outline should be drawn in.
 */
const glyph = new Array(cols * rows).fill(" ");
for (let i = 0; i < cols * rows; i++) {
  const v = tone[i];
  const isEdge = edge > 0 && gmax > 0 && gmag[i] / gmax >= edge && v >= floor * 0.3;
  if (isEdge) {
    // The stroke runs along the edge, which is perpendicular to the gradient.
    let phi = gang[i] + Math.PI / 2;
    phi = ((phi % Math.PI) + Math.PI) % Math.PI; // fold to [0, π)
    const bin = Math.round(phi / (Math.PI / 4)) % 4; // 0: -, 1: /, 2: |, 3: \
    glyph[i] = STROKES[bin];
  } else if (v >= floor) {
    // Below the floor the cell is ground, not faint ink. Without this the
    // sensor noise in the black surround quantises to a field of periods and
    // the figure loses its silhouette entirely.
    glyph[i] = RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))];
  }
}

/*
 * Layer cuts, from the quantiles of the inked cells. Strokes count as their
 * cell's own tone for placement, and are then lifted one layer, so an outline
 * is always drawn at least one ink brighter than the tone beside it.
 */
const inkedTones = [];
for (let i = 0; i < cols * rows; i++) if (glyph[i] !== " ") inkedTones.push(tone[i]);
inkedTones.sort((a, b) => a - b);
const quantile = (q) => inkedTones[Math.min(inkedTones.length - 1, Math.floor(q * inkedTones.length))] ?? 1;
const cuts = bands.map(quantile);
const layerCount = bands.length + 1;

const layerLines = Array.from({ length: layerCount }, () => []);
/** Which layer each cell landed in, -1 for ground. Kept for the reach report. */
const cellLayer = new Int8Array(cols * rows).fill(-1);
for (let r = 0; r < rows; r++) {
  const lines = Array.from({ length: layerCount }, () => "");
  for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const g = glyph[i];
    let layer = -1;
    if (g !== " ") {
      layer = 0;
      while (layer < cuts.length && tone[i] >= cuts[layer]) layer++;
      if (STROKES.includes(g)) layer = Math.min(layerCount - 2, layer + 1);
    }
    cellLayer[i] = layer;
    for (let l = 0; l < layerCount; l++) lines[l] += l === layer ? g : " ";
  }
  // Trailing spaces cost bytes and render as nothing.
  for (let l = 0; l < layerCount; l++) layerLines[l].push(lines[l].replace(/\s+$/, ""));
}
const layers = layerLines;

const inked = (g) => g.join("").replace(/ /g, "").length;
const total = cols * rows;
const strokes = glyph.filter((g) => STROKES.includes(g)).length;
const share = layers.map((l) => ((100 * inked(l)) / total).toFixed(1) + "%").join(" / ");

/*
 * Mean layer per eighth of the reach axis, over inked cells only.
 *
 * The falloff is meant to be structure rather than decoration, and the
 * difference is measurable: if the figure really does resolve as it reaches,
 * this sequence rises. If it wobbles, the ink is still being assigned by local
 * brightness and the numbers are wrong. Reported rather than asserted because
 * it is the one claim about this image that is easy to believe and easy to get
 * wrong.
 */
const BINS = 8;
const binSum = new Float64Array(BINS);
const binCount = new Float64Array(BINS);
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (cellLayer[i] < 0) continue;
    const u = Math.min(1, Math.max(0, reachAt(c, r)));
    const b = Math.min(BINS - 1, Math.floor(u * BINS));
    binSum[b] += cellLayer[i];
    binCount[b] += 1;
  }
}
const reachReport = Array.from({ length: BINS }, (_, b) =>
  binCount[b] ? (binSum[b] / binCount[b]).toFixed(2) : "----",
).join(" ");
const argv = process.argv
  .slice(2)
  .map((a) => (a.includes(" ") ? JSON.stringify(a) : a))
  .join(" ");

const body = `/**
 * The figure, as a character grid. **Generated. Do not edit by hand.**
 *
 *   node scripts/asciify.mjs ${argv}
 *
 * See scripts/asciify.mjs for the sampling, and Figure.tsx for the renderer and
 * for why \`aspect\` is pinned in CSS rather than measured off the face.
 *
 * Source ${width}x${height}, cropped to ${cw}x${ch} at (${cx}, ${cy}).
 * Grid ${cols}x${rows} at cell aspect ${aspect}.
 * Ink by layer, dark to light: ${share} of cells.
 * ${strokes} cells are drawn as strokes along an edge.
 * Mean layer per eighth of the reach axis: ${reachReport}.
 */

/**
 * Annotated rather than \`as const\`.
 *
 * \`as const\` narrows \`rows\` to its literal value, which makes Figure.tsx's
 * \`rows === 0\` guard a type error the moment a real grid is generated: the
 * compiler can see that 50 is never 0 and refuses the comparison. The guard has
 * to keep working, because it is what lets the site build and render correctly
 * with no source image in the repository.
 */
export type FigureGrid = {
  cols: number;
  rows: number;
  /** Cell width divided by cell height. Figure.tsx pins this as \`line-height\`. */
  aspect: number;
  /**
   * Shear of the reach axis, the direction the limb runs. The generator assigned
   * ink along it and Figure.tsx sweeps its entrance along it, so it travels with
   * the grid rather than being guessed twice. See \`--falloff\` in asciify.mjs.
   */
  tilt: number;
  /**
   * Tonal layers, darkest first. Every layer is the full grid, with a space in
   * every cell that belongs to another layer, so the layers stack into one
   * picture when drawn on top of each other. Figure.tsx assigns an ink to each.
   */
  layers: readonly (readonly string[])[];
};

export const FIGURE: FigureGrid = {
  cols: ${cols},
  rows: ${rows},
  aspect: ${aspect},
  tilt: ${tilt},
  layers: ${JSON.stringify(layers, null, 2).replace(/\n/g, "\n  ")},
};
`;

writeFileSync(out, body, "utf8");

console.log(`source   ${width}x${height}`);
console.log(`crop     ${cw}x${ch} at (${cx}, ${cy})`);
console.log(`grid     ${cols}x${rows}  aspect ${aspect}`);
console.log(`ink      ${share} by layer, ${strokes} strokes`);
console.log(`reach    falloff ${foStart},${foMin} tilt ${tilt}`);
console.log(`         mean layer per eighth: ${reachReport}`);
console.log(`wrote    ${out}  (${(Buffer.byteLength(body) / 1024).toFixed(1)} KB)`);

if (has("preview")) {
  // Terminal cells are about twice as tall as wide, which is the ratio this
  // samples at, so the preview is undistorted without any correction. The
  // layers are flattened back into one picture for the preview.
  const flat = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      let g = " ";
      for (const l of layers) {
        const ch = l[r][c];
        if (ch && ch !== " ") g = ch;
      }
      line += g;
    }
    flat.push(line.replace(/\s+$/, ""));
  }
  console.log(`\n${flat.join("\n")}\n`);
}
