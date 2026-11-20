/** Seeded, unit-space print geometry. No telemetry, assets, or frame randomness. */
export const INK_WIDTH = 900;
export const INK_HEIGHT = 780;
export const INK_PERIOD = 12_000;
export const INK_COLORS = ["#14244b", "#243faf", "#3751cb", "#ba91a1"] as const;

export type InkGrain = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: number;
  layer: number;
};

export type InkSquare = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: number;
};

function randomFrom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function inkNoise(x: number, y: number, seed: number) {
  const hash = (a: number, b: number) => {
    let value = Math.imul(a, 374761393) + Math.imul(b, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  };
  const left = Math.floor(x);
  const top = Math.floor(y);
  const tx = smoothstep(x - left);
  const ty = smoothstep(y - top);
  const upper = hash(left, top) * (1 - tx) + hash(left + 1, top) * tx;
  const lower = hash(left, top + 1) * (1 - tx) + hash(left + 1, top + 1) * tx;
  return upper * (1 - ty) + lower * ty;
}

export function createInkGeometry(seed = 570319) {
  const random = randomFrom(seed);
  const grains: InkGrain[] = [];
  const squares: InkSquare[] = [];

  // Offset rows open a precise, intentionally incomplete staircase into ink.
  const rows = [
    { x: 182, y: 104, cells: [0, 2] },
    { x: 204, y: 157, cells: [0, 1, 3] },
    { x: 238, y: 210, cells: [0, 1, 2, 3] },
    { x: 279, y: 263, cells: [0, 1, 2] },
    { x: 330, y: 316, cells: [0, 1, 2] },
  ];
  rows.forEach((row, rowIndex) => {
    row.cells.forEach((cell, index) => {
      squares.push({
        x: row.x + cell * 53,
        y: row.y,
        size: 39 - Math.max(0, rowIndex - 2) * 3,
        alpha: rowIndex < 3 ? 0.96 : 0.76 - index * 0.09,
        color: rowIndex < 2 ? 0 : 1,
      });
    });
  });

  // One curving print body, not a field of individually wandering particles.
  // The normal distribution gives a dense dry center and a powder-fine edge.
  for (let i = 0; i < 78_000; i += 1) {
    const t = Math.pow(random(), 0.79);
    const u = Math.max(0.000001, random());
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(random() * Math.PI * 2);
    const spread = 24 + 72 * Math.pow(Math.sin(Math.PI * t * 0.92), 0.9);
    const centerX = 373 + 244 * t + 100 * Math.sin(Math.PI * t * 1.14);
    const centerY = 252 + 347 * t;
    const x = centerX + normal * spread * 0.89 + (random() - 0.5) * 5;
    const y = centerY - normal * spread * 0.46 + (random() - 0.5) * (8 + 24 * t * t);
    // Nonperiodic value noise changes ink weight, never punches repeated holes.
    const dry = 0.62 + inkNoise(x / 38, y / 38, seed) * 0.38;
    const tail = 1 - smoothstep((t - 0.82) / 0.18) * 0.8;
    if (Math.abs(normal) > 2.8 || x < 92 || y < 150) continue;
    const edge = Math.min(1, Math.abs(normal) / 2.6);
    grains.push({
      x, y,
      radius: 0.29 + random() * 0.77,
      alpha: (0.42 + random() * 0.57) * (1 - edge * 0.32) * dry * tail,
      color: random() < 0.3 ? 0 : random() < 0.75 ? 1 : 2,
      layer: Math.min(5, Math.floor(t * 6)),
    });
  }

  // A very small, dusty registration ghost, down and right of the print.
  for (let i = 0; i < 3_600; i += 1) {
    const t = random();
    const normal = (random() + random() + random() - 1.5) * 70;
    grains.push({
      x: 665 + 86 * t + normal * 0.75,
      y: 460 + 146 * t - normal * 0.4,
      radius: 0.3 + random() * 0.65,
      alpha: 0.08 + random() * 0.16,
      color: random() < 0.28 ? 3 : 2,
      layer: 6,
    });
  }

  // Grow the optical footprint while reserving real paper around the print.
  const grown = grains.flatMap((grain) => {
    const x = 425 + (grain.x - 425) * 1.12;
    const y = 360 + (grain.y - 360) * 1.08;
    const margin = Math.max(0, Math.min(1, (818 - x) / 42, (715 - y) / 42));
    return margin > 0 ? [{ ...grain, x, y, alpha: grain.alpha * margin }] : [];
  });
  return {
    grains: grown,
    squares: squares.map((square) => ({
      ...square,
      x: 425 + (square.x - 425) * 1.12,
      y: 360 + (square.y - 360) * 1.08,
      size: square.size * 1.1,
    })),
  };
}

function smoothstep(value: number) {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
}

/** Twelve seconds: gather 3.6s, hold 3s, release 4.2s, breathe 1.2s. */
export function getInkFrame(elapsed: number) {
  const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const phase = (time % INK_PERIOD) / INK_PERIOD;
  const resolve = phase < 0.3
    ? smoothstep(phase / 0.3)
    : phase < 0.55
      ? 1
      : phase < 0.9
        ? 1 - smoothstep((phase - 0.55) / 0.35)
        : 0;
  const gather = 0.2 + resolve * 0.8;
  return { gather, drift: 1 - resolve };
}

/** Bound the whole eight-surface backing store to about 28 MB, less on phones. */
export function getInkCanvasSize(cssWidth: number, deviceRatio: number) {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 600;
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? Math.min(deviceRatio, 1.5) : 1;
  const pixelWidth = Math.max(1, Math.min(1000, Math.round(width * ratio)));
  return { width: pixelWidth, height: Math.round(pixelWidth * INK_HEIGHT / INK_WIDTH) };
}
