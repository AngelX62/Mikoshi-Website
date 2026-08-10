/**
 * The section marker.
 *
 * Rotated into the left margin from `md` up, inline above the heading below it.
 *
 * The page was a stack of centred boxes, each opening with a mono label sitting
 * on its own line above a heading. That shape is what made every section read
 * as the same section. Turning the label into a spine running up the left edge
 * costs nothing, frees the top of each block, and makes the page read the way a
 * drawing sheet does: the identifier lives in the margin, not in the content.
 *
 * Absolute from `md` up, so it takes the margin the section's padding already
 * reserves and never pushes the copy around. Below `md` there is no margin to
 * spare, so it falls back to sitting above the heading where it always was.
 *
 * **That fallback is not free, and it is not this file's to guarantee.** A
 * static span is an in-flow child, so a section laid out as a flex *row* puts
 * it beside the content rather than above it, and it silently takes a column
 * of a phone screen. Measured at 390 before this was fixed: 54px off the
 * thesis and 100px off the deployment, the latter with the label wrapped to two
 * lines, which squeezed the deployment's copy into 227px of a 342px box and
 * broke three of the thesis's seven hand-set line breaks.
 *
 * So every section that uses this must be `flex-col` below `md`. There is no
 * way to enforce that from here; the sections carry a note.
 */
export default function SectionLabel({ children }: { children: string }) {
  return (
    <span
      className="
        mb-10 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim
        md:absolute md:left-0 md:top-1/2 md:mb-0 md:-translate-y-1/2 md:[writing-mode:vertical-rl]
        md:rotate-180 md:tracking-[0.3em]
      "
    >
      {children}
    </span>
  );
}
