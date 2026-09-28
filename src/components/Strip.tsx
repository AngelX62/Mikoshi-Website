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
 * It drops below `md`, where the two ends of the strip have all the width.
 *
 * **It sits on the band's centre line, and it used not to.** It was a `flex-1`
 * span centring itself in whatever the two labels left over, so its position
 * depended on how long the labels were: 620px across on /vision's opening strip,
 * 750 and 800 on two strips of /evidence. A mark that moves between bands reads
 * as misalignment, not as a register. From `md` the row is a three-track grid
 * with equal outer tracks, so the middle one is the centre whatever the labels
 * say, and a long label wraps inside its own half instead of pushing it.
 *
 * **`md` and not `sm`, measured.** At 640 each half is about 280px, and
 * "Proposed first experiments" and "What we must improve on" both wrapped to two
 * lines. From 768 every label on the site fits its half on one line.
 */
export default function Strip({
  left,
  right,
  leftId,
  as,
}: {
  left: string;
  right?: string;
  /**
   * An id on the left half, so a `Band` can name itself from the label a reader
   * can already see.
   *
   * **This replaced a second, hidden copy of the same words.** `Band` used to
   * render `<h2 class="sr-only">{heading}</h2>` above this strip, reasoning that
   * the strip said it on screen so a visible heading would be furniture. True of
   * the design and false of the delivery: a screen reader reads this span like
   * any other text, so on three bands of /first-proof the section title was
   * announced twice in a row, verbatim.
   *
   * Pointing `aria-labelledby` here names the landmark from the words that are
   * actually on the page, which is what `aria-labelledby` is for.
   */
  leftId?: string;
  /**
   * Renders the left half as an `h2` instead of a `span`.
   *
   * The type does not change: an `h2` here inherits the strip's own 11px mono
   * from the row, and the browser's default heading margins and weight are
   * already overridden by the row's utilities. It is the same words at the same
   * size in the same place, in the document outline. `Band` decides when, and
   * the note on `titled` there says why it is off more often than on.
   */
  as?: "h2";
}) {
  const Left = as ?? "span";
  return (
    <div className="mb-12 flex items-start gap-4 border-b border-rule pb-3 font-mono text-[11px] uppercase leading-[1.6] tracking-[0.22em] text-ink-dim md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:mb-16">
      {/*
        `min-w-0` and no `shrink-0`, which is not a detail.

        Both ends were `shrink-0` so a long label could not be squeezed by the
        glyph cluster between them. At 390 that let one overflow the page
        instead: the vision's closing strip measured 359px inside a 327px
        content box and pushed the document 8px wide. A flex child that refuses
        to shrink and cannot wrap has nowhere to go but out of the frame.

        Nothing is actually competing for the space below `md`, because the
        glyph cluster is hidden there, so shrinking costs nothing and wrapping
        is the correct failure mode. `items-start` keeps a wrapped left half
        aligned with a single-line right half.
      */}
      {/* `font-normal` and `m-0` because an `h2` arrives with the user agent's
          bold and its own margins, and this row is 11px mono on a hairline
          whichever element it is. */}
      <Left id={leftId} className="m-0 min-w-0 font-normal">
        {left}
      </Left>

      {/* Two filled dots and a bar-plus-matrix, drawn rather than typed, so
          they hold their size and spacing independently of the font. */}
      <span
        aria-hidden="true"
        className="hidden items-center justify-center gap-[6px] self-center text-ink-faint md:flex"
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
        <span className="ml-auto min-w-0 text-right md:col-start-3 md:ml-0 md:justify-self-end">{right}</span>
      )}
    </div>
  );
}
