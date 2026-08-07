"use client";

import { useMemo } from "react";
import { BAYER_4 } from "@/lib/dither";

/**
 * Text that resolves the way the field does.
 *
 * Each character is given a threshold from the **same 4×4 Bayer matrix that
 * drives the hero dither**, so the type resolves in the identical crosshatch
 * order — the field and the language quantise by one pattern. That shared
 * ordering is the point; it's why this imports BAYER_4 rather than rolling its
 * own shuffle.
 *
 * Deliberately DOM text rather than a canvas of dots: the type stays crisp,
 * selectable and legible to screen readers. The split spans are hidden from
 * assistive tech and the real sentence is exposed via aria-label on the parent.
 */

type Props = {
  lines: readonly string[];
  className?: string;
};

/** How far past its own threshold a character takes to finish resolving. */
const RAMP = 0.28;

/**
 * Deterministic per-character scatter.
 *
 * Must not be Math.random: the page is a static export, so markup rendered at
 * build time has to match what the client renders or React reports a hydration
 * mismatch. Math.sin is bit-identical across both.
 */
function hash(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export default function DitherText({ lines, className }: Props) {
  // Thresholds are stable per character position, so they're computed once and
  // only the CSS variable changes as `progress` moves.
  const split = useMemo(
    () =>
      lines.map((line, row) =>
        Array.from(line).map((char, col) => ({
          char,
          // Walk the Bayer matrix by row/column parity, exactly as the field
          // does per grid cell. Scaled to leave headroom for the ramp, with a
          // slight left-to-right bias so reading order still feels honoured.
          threshold:
            BAYER_4[(row & 3) * 4 + (col & 3)] * (1 - RAMP) +
            (col / Math.max(line.length, 1)) * 0.1,
          jx: (hash(row, col) * 2 - 1).toFixed(3),
          jy: (hash(col, row) * 2 - 1).toFixed(3),
        })),
      ),
    [lines],
  );

  return (
    // `--p` is deliberately not set here. The CSS falls back to `var(--p, 1)`
    // — fully resolved — so if scripting fails or hasn't run yet, the text is
    // readable rather than invisible. The caller's ScrollTrigger owns it after
    // mount.
    <p className={className} aria-label={lines.join(" ")}>
      {split.map((chars, row) => (
        <span key={row} className="block" aria-hidden="true">
          {chars.map(({ char, threshold, jx, jy }, col) =>
            char === " " ? (
              <span key={col}> </span>
            ) : (
              <span
                key={col}
                className="dither-char"
                style={
                  {
                    "--t": threshold.toFixed(4),
                    "--jx": jx,
                    "--jy": jy,
                  } as React.CSSProperties
                }
              >
                {char}
              </span>
            ),
          )}
        </span>
      ))}
    </p>
  );
}
