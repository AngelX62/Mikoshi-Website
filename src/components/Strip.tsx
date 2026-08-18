/**
 * The annotation row that runs across the top of a band.
 *
 * Lifted from the reference frame that reads `A/ ●● 1` at one end of a baseline
 * strip and `LETTER "A" FORWARD SLASH ZERO ZERO ONE` at the other. Two things
 * make that frame work and both are reproduced here.
 *
 * **It states its identifier twice, once as a symbol and once in words.** So a
 * method band reads `02 · RECONSTRUCT` on the left and `SHEET TWO OF FOUR` on
 * the right. Redundant on purpose: the redundancy is what makes it read as a
 * technical caption rather than as a label, and the spelled half carries real
 * information the numeral does not, which is how many bands are left.
 *
 * **The glyph cluster in the middle means nothing, and that is deliberate.** It
 * is the one purely decorative mark on the site. A page with no imagery needs
 * somewhere for the eye to register that this is an instrument's register, and
 * a fake readout is more honest than a real-looking number would be, since a
 * number here would have to be invented. See rule three in content.ts.
 *
 * It drops below `sm`, where the two ends of the strip have all the width.
 */
export default function Strip({
  left,
  right,
}: {
  left: string;
  right?: string;
}) {
  return (
    <div className="mb-12 flex items-start gap-4 border-b border-rule pb-3 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.22em] text-ink-dim md:mb-16">
      {/*
        `min-w-0` and no `shrink-0`, which is not a detail.

        Both ends were `shrink-0` so a long label could not be squeezed by the
        glyph cluster between them. At 390 that let one overflow the page
        instead: the vision's closing strip measured 359px inside a 327px
        content box and pushed the document 8px wide. A flex child that refuses
        to shrink and cannot wrap has nowhere to go but out of the frame.

        Nothing is actually competing for the space below `sm`, because the
        glyph cluster is hidden there, so shrinking costs nothing and wrapping
        is the correct failure mode. `items-start` keeps a wrapped left half
        aligned with a single-line right half.
      */}
      <span className="min-w-0">{left}</span>

      {/* Two filled dots and a bar-plus-matrix, drawn rather than typed, so
          they hold their size and spacing independently of the font. */}
      <span
        aria-hidden="true"
        className="hidden flex-1 items-center justify-center gap-[6px] text-ink-faint sm:flex"
      >
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
        <span className="ml-3 h-[5px] w-[14px] bg-current" />
        <span className="flex gap-[3px]">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="h-[2px] w-[2px] bg-current" />
          ))}
        </span>
      </span>

      {right && (
        <span className="ml-auto min-w-0 text-right sm:ml-0">{right}</span>
      )}
    </div>
  );
}
