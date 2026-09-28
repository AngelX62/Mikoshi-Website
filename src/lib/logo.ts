/**
 * The logo's geometry, in one place, for the one component that draws it.
 *
 * ── THE WORDMARK WENT BACK TO TYPE, AND THE NAME IS WHY ──────────────────────
 * It was seven hand-drawn monoline letterforms spelling MIKOSHI: five stroked
 * paths, an interrupted O traced open so it needed no SVG `<mask>` id, a K drawn
 * as an outline, and a register square displaced through the O's gap. All of it
 * is deleted. The company is Afterscale now, and the direction brief calls that
 * **a working name**.
 *
 * You do not hand-draw a logotype for a name that may not survive. Ten new
 * letterforms at the quality of the seven that were here is days of work
 * commissioned to be thrown away, and worse, a drawn mark is the single most
 * expensive thing to change your mind about. Set in type it is an afternoon in
 * either direction.
 *
 * ── SO THIS FILE IS A KERN TABLE AGAIN, AND THE METHOD IS RECORDED ───────────
 * Before the letterforms were drawn, the mark was Archivo at `wdth` 125 tracked
 * 0.18em, with three per-pair corrections solved against the **mean white gap by
 * area** over the rows where both letters have ink:
 *
 *     MI 35.3   IK 35.3   KO 49.8   OS 46.9   SH 40.3   HI 35.3
 *
 * Every pair touching K, O or S opened up, KO by 41%, so MIK sat tight and then
 * K O S H drifted apart. Equalising the *minimum* ink gap, which is what "space
 * them evenly" sounds like it means, made it worse and took the spread from 14.6
 * to 24.9: a font's sidebearings are already an area correction, so equalising
 * closest approach shoves a receding diagonal wider still. Solving against the
 * area measure converged in four rounds and took the spread to 0.19.
 *
 * **AFTERSCALE has not been through that.** It ships on even tracking. The
 * letters that caused trouble last time are all present again, and the pairs to
 * look at first are TE, RS, SC and LE. If the mark ever needs it, the method
 * above is the method; do not equalise the visible gaps by eye.
 *
 * ── AND THERE WAS A `MASK_STROKE`, FOR AN IMAGE THAT NO LONGER EXISTS ────────
 * Home's title card used to sample this geometry onto a halftone grid, and that
 * sampler stroked the letterforms at 10 units rather than 6. Worth one sentence
 * in case anything is ever sampled again: **a halftone stroke is measured in
 * cells, not in units.** Six units fitted to 1440 landed 3.3 cells across a stem,
 * where 4.7 read as blur; ten landed 5.4 and drew at the same apparent weight,
 * because the dots cover less area than the stroke they replace.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * The letters, as text, and now they really are text.
 *
 * `content.ts` re-exports this as `hero.wordmark`, the header and footer name
 * their links with it, and `Logo.tsx` renders this string directly rather than
 * drawing it. That last one is new: while the wordmark was paths, this constant
 * and the thing on screen could drift apart without anything failing.
 */
export const WORDMARK = "AFTERSCALE";

/**
 * The symbol, and it survived the rename without moving a coordinate.
 *
 * Two equal, rotationally related L forms on an 8-unit grid, and a square
 * displaced 8 units right and 8 up from the corner they leave open. Their equal
 * arm lengths and equal thickness are what make the missing corner read as
 * intentional rather than as an optical accident.
 *
 * ── IT MEANS SOMETHING DIFFERENT NOW, AND THE GEOMETRY DID NOT HAVE TO CHANGE ─
 * Drawn for MIKOSHI, the displaced square was an evidence register: a finding
 * pushed out through a gap in the enclosure. For Afterscale it reads as the one
 * thing selected out of what was left open, which is the learning-value question
 * stated in two forms and a gap. Same paths, honest new reading.
 *
 * That is the advantage of an abstract mark over an illustrative one, and it is
 * the reason this half of the lockup cost nothing to keep while the other half
 * had to be deleted entirely.
 *
 * Filled paths rather than strokes. The mark is a solid form and the wordmark is
 * type; that contrast is the lockup.
 */
export const MARK_PATHS = {
  ink: ["M16 24h48v16H32v32H16V24Z", "M32 72h32V40h16v48H32V72Z"],
  /** The displaced square. See above for what it now means. */
  register: "M72 16h16v16H72z",
} as const;

/**
 * The mark's own square canvas, from `public/logo/`.
 *
 * Ink runs 16 to 88 in both axes, so the master carries 16 units of clear space
 * on all four sides and nothing needs insetting. The ink is therefore
 * **72/104 = 69.2%** of the box, which is the number `Logo.tsx` uses to match
 * the mark's height to the wordmark's cap.
 */
export const MARK_BOX = 104;

/** Ink height as a fraction of `MARK_BOX`. See the note above. */
export const MARK_INK_RATIO = 72 / MARK_BOX;

/**
 * Tracking for the wordmark, in em.
 *
 * The value the drawn mark was derived from, before it was drawn. A geometric
 * grotesque at its widest sets very tight by default, and the whole point of the
 * lockup is that the name reads as an inscription rather than as a word.
 */
export const WORDMARK_TRACKING = 0.18;

/**
 * The wordmark's width, at the ceiling of the axis.
 *
 * ── IT WAS 125 AND THAT NUMBER DIED WITH ARCHIVO ─────────────────────────────
 * Archivo's width axis runs 62 to 125 and the lockup sat at the very top of it,
 * above all three rungs of the old ladder, which was right: a name is not a
 * claim being graded. **No other family can do that.** Checked against
 * next/font's own data, Archivo is the only candidate whose width axis goes
 * above 100 at all. Bricolage runs 75 to 100.
 *
 * So the wordmark is at 100, the top of what exists, and the *width* it used to
 * get from the axis now comes from `WORDMARK_TRACKING` instead. That is the
 * honest substitution: letterspacing is what sets an inscription anyway, and the
 * axis was only ever a second way of buying the same thing.
 */
export const WORDMARK_WIDTH = 100;
