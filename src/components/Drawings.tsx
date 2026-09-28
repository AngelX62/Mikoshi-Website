import type { ReactNode } from "react";

/**
 * Drawn figures, in the register of a technical sheet.
 *
 * ── THIS FILE IS CURRENTLY A TOOLKIT WITH NOTHING BUILT ON IT ────────────────
 * It held two figures and both were deleted with the pivot away from physical
 * AI. They are worth describing, because what replaces them has to clear the
 * same bar and neither was decoration:
 *
 *   **FIG. 2, Parallax.** Two viewpoints on a dimensioned baseline, an occluder,
 *   and a square of hidden structure behind it. A's sightline dashed and
 *   terminating in an X at a computed intersection, B's solid and arriving. The
 *   geometry *was* the word parallax, which is why nothing underneath it could
 *   be kept: the drawing had no meaning apart from the claim it illustrated.
 *
 *   **FIG. 3, Two cells.** The old benchmark in plan: two workcells, a record
 *   between them, arrows, and a dimension line reading HOURS AND SCRAP TO THE
 *   FIRST QUALIFIED PART. Equally irreducible.
 *
 * What survives is the furniture, and it is the part that took the measuring:
 * `FigureFrame` binds every figure on the site into one numbered series, and
 * `drawing` solves SVG label sizing, which is a real problem with a
 * counter-intuitive answer. See the note on `drawing`.
 *
 * ── WHAT THE NEXT FIGURE HAS TO BE ──────────────────────────────────────────
 * Afterscale has no apparatus to draw and, more importantly, **no results to
 * chart**. A plot with invented numbers on it would break rule three in
 * content.ts more thoroughly than any sentence could, and a reader in this field
 * would spot it instantly.
 *
 * So the next figure has to show a *mechanism* rather than a measurement. The
 * two candidates on the table are a schematic of the compute-versus-capability
 * relationship labelled explicitly as hypothesis, and a field of characters with
 * a small fraction marked, which is the selection question itself and invents
 * nothing at all.
 *
 * Until then this file exports nothing but the frame. **Do not add figure
 * numbering back to a page before there is a figure on it**: FIG. references
 * pointing at nothing are exactly the borrowed authority the registration ticks
 * were removed for.
 *
 * ── /research CARRIES A PICTURE AND IT IS NOT IN THIS SERIES ─────────────────
 * It is a photograph, uncaptioned and unnumbered, and it lives in Plate.tsx.
 * That is not an oversight to be tidied up by giving it a number. The FIG. series
 * is reserved for drawn arguments, and admitting a photograph to it would quietly
 * redefine the series as "picture", which is the exact thing the paragraph above
 * is holding the numbering back to protect.
 */

/**
 * Tracked mono, as SVG text. Uppercase in the string, not in CSS.
 *
 * ── THE SIZE IS NOT HERE, AND IT CANNOT BE ──────────────────────────────────
 * SVG text is sized in the drawing's own units and scales with it, so a 10-unit
 * label is 10px only when the drawing renders at its viewBox width. It never
 * does: the column is 512px at 1440 and 342px on a phone, which put a fixed
 * label at 8.5px and 5.7px on screen. The size lives in `--fig-label`, set per
 * breakpoint on the `<svg>` so the label lands near 10px at every width, and the
 * rule that reads it is in globals.css. Line breaks inside a label use `dy` in
 * em for the same reason.
 */
export const label = {
  letterSpacing: "0.18em",
} as const;

/**
 * Unit size per breakpoint, chosen so the label renders at 9.5 to 10px:
 * 17 at 342px wide, 18 at the 312px an `md` column gives, 14 at the 416px of
 * `lg`, 11.5 at the 512px cap the column reaches by `xl`.
 */
export const drawing =
  "drawing block h-auto w-full font-mono [--fig-label:17px] md:[--fig-label:18px] lg:[--fig-label:14px] xl:[--fig-label:11.5px]";

/**
 * The numbered caption that binds every figure on the site into one series.
 *
 * The number leads in full ink and the caption follows in dim, which is the same
 * two-weight treatment the title card's own figure caption used, so a reader
 * meets one convention rather than two.
 */
export function FigureFrame({
  number,
  caption,
  className = "",
  children,
}: {
  number: number;
  caption: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={`m-0 ${className}`}>
      {children}
      <figcaption className="mt-4 border-t border-rule pt-3 font-mono text-[11px] uppercase leading-[1.6] tracking-[0.22em] text-ink-dim">
        <span className="text-ink">Fig. {number}</span>
        <span aria-hidden="true" className="mx-3 text-ink-faint">
          &middot;
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}
