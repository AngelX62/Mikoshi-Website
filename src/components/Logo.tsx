/**
 * The logo: the mark, then the wordmark, as one lockup.
 *
 * ── IT IS HALF SVG AND HALF TYPE NOW, AND THAT IS THE POINT ──────────────────
 * The wordmark used to be drawn paths. It is set in the site's own sans again,
 * because Afterscale is a working name and lib/logo.ts explains at length why a
 * provisional name does not get hand-drawn letterforms. The face was Archivo at
 * `wdth` 125 and is Bricolage Grotesque at `wdth` 100, which is the top of what
 * that axis offers here: see `WORDMARK_WIDTH` in lib/logo.ts for why no other
 * family could keep the 125.
 *
 * So this renders a flex row rather than one SVG: the mark as a small square
 * drawing, the name as **real text in the document**. That is not a compromise,
 * it is the better construction for type:
 *
 *   the browser hints and subpixel-positions it, where SVG `<text>` scaled by a
 *   viewBox does neither;
 *   `font-variation-settings` and `letter-spacing` are CSS, so the width axis is
 *   set the same way it is set everywhere else on the site;
 *   and the name is selectable, findable and readable, so the `sr-only` span
 *   home's `h1` used to need is gone.
 *
 * **`currentColor` still drives everything**, which was the original reason the
 * paths were inlined rather than loaded from `public/logo/`. The header link is
 * `text-ink hover:text-accent` and a ground class can redefine the ink tokens
 * inside its own subtree; an `<img src="...svg">` would inherit neither.
 *
 * ── THE MARK KEEPS ITS OWN VIEWBOX AND IS SIZED AGAINST THE CAP ──────────────
 * The mark's ink is 69.2% of its 104-unit box. Its base size matches the
 * wordmark's measured cap height; the 12% trial increase gives the symbol more
 * presence beside the spaced lettering at header size.
 */

import {
  MARK_BOX,
  MARK_INK_RATIO,
  MARK_PATHS,
  WORDMARK,
  WORDMARK_TRACKING,
  WORDMARK_WIDTH,
} from "@/lib/logo";

/**
 * The mark's rendered box, as a multiple of the wordmark's font size.
 *
 * The cap-matched base is derived from `CAP_HEIGHT_EM / MARK_INK_RATIO`.
 * The 1.12 multiplier is a reversible visual trial, not a new geometry master.
 *
 * ── THIS NUMBER HAS BEEN WRONG TWICE. MEASURE IT, NEVER REASON ABOUT IT ─────
 * It was 0.73 on the usual rule of thumb for a grotesque, and Archivo at `wdth`
 * 125 weight 500 actually capped at 0.690em, so the guess made the mark 5.8%
 * taller than the letters beside it: exactly the amount that looks like a
 * mistake rather than a decision.
 *
 * **Bricolage Grotesque at weight 500 caps at 0.660em**, measured by rendering
 * an H at 200px and reading the ink height off the raster, which is 132px.
 * Carrying Archivo's 0.690 across would have repeated the same failure at 4.3%.
 *
 * `TextMetrics.actualBoundingBoxAscent` is not enough on its own here: canvas2d
 * has no `font-variation-settings`, so it silently measures the default optical
 * size rather than the wordmark's. Measure the rendered element.
 *
 * **`opsz` does not move the cap**, checked at 16, 64 and 96, all 132px. It
 * moves the H's advance instead, 0.545 to 0.535 to 0.525em, which is what an
 * optical size axis is supposed to do. So this one value covers every register.
 *
 * Measure with the real face loaded. A stale dev chunk serving a fallback caps
 * somewhere else entirely and will send you tuning against a number that is not
 * this family's. See the note in page.tsx.
 */
const CAP_HEIGHT_EM = 0.66;
const MARK_SCALE = 1.12 * CAP_HEIGHT_EM / MARK_INK_RATIO;

/**
 * The gap between the mark and the M.
 *
 * The previous gap was about 0.513em. This trial tightens it to 0.40em, or 8px
 * at the header's 20px font size. The SVG viewBox still supplies clear space
 * around the symbol's ink.
 */
const GAP_EM = 0.40;

export default function Logo({
  size,
  accent = false,
  className = "",
}: {
  /**
   * The wordmark's font size in CSS pixels. The mark follows from it.
   *
   * **This replaced a `height` prop and the change is not cosmetic.** The old
   * lockup was one SVG with an intrinsic aspect ratio, so a rendered height set
   * everything. Half of this is type now, and type is sized by font size, so a
   * caller that says "28 tall" is asking a question the component can no longer
   * answer exactly: the answer depends on the loaded face.
   *
   * In use: 20 in the header and 14 in the footer.
   *
   * **Do not go below 12.** The stem of Archivo at `wdth` 125 is about 8% of the
   * cap, so at 12px it is a single device pixel at 1x, and a hairline wordmark is
   * the same stroke weight as the 10px mono nav links beside it, which inverts
   * the hierarchy the header depends on.
   *
   * A string is passed straight through as `font-size` for callers that need a
   * `clamp()`. It cannot come through `className` instead: this component sets
   * `font-size` inline, and inline wins over any utility.
   */
  size: number | string;
  /**
   * Whether the mark's displaced square is drawn in the accent.
   *
   * **Off by default, and that is a rule rather than a preference.**
   * Under globals.css the accent means one thing: what is under test. The header
   * and footer appear on every route, and a rose square in the chrome would say
   * the company itself is the hypothesis, which is both untrue and the fastest
   * way to spend a signal colour down to a brand colour. In ink the square still
   * reads as an interruption, which is the idea. Only the colour is withheld.
   *
   * On where the lockup is large enough for the square to read as an event,
   * which is home's `h1` and nowhere else.
   */
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{
        fontSize: typeof size === "number" ? `${size}px` : size,
        gap: `${GAP_EM}em`,
      }}
    >
      <svg
        // `aria-hidden` on the drawing only. The name beside it is real text, so
        // the lockup as a whole has an accessible name without one being
        // declared, which is what the drawn version could not do.
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${MARK_BOX} ${MARK_BOX}`}
        width={`${MARK_SCALE}em`}
        height={`${MARK_SCALE}em`}
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Filled forms. The contrast between a solid symbol and set type is
            the lockup. */}
        <g fill="currentColor">
          {MARK_PATHS.ink.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path
          d={MARK_PATHS.register}
          fill={accent ? "var(--color-accent)" : "currentColor"}
        />
      </svg>

      {/*
        `text-indent` cancels the trailing space tracking adds after the final E.
        Without it the lockup carries 0.18em of invisible width on its right,
        which shifts a centred mark left by half a space and puts the header's
        hit area slightly off the ink. Negative on the indent would move the
        first glyph, so the correction goes on `margin-right` instead.
      */}
      <span
        style={{
          fontVariationSettings: `"wdth" ${WORDMARK_WIDTH}`,
          letterSpacing: `${WORDMARK_TRACKING}em`,
          marginRight: `-${WORDMARK_TRACKING}em`,
          fontWeight: 500,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {WORDMARK}
      </span>
    </span>
  );
}
