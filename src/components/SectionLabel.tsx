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
 * Absolute, so it takes the margin the section's padding already reserves and
 * never pushes the copy around. Below `md` there is no margin to spare, so it
 * falls back to sitting above the heading where it always was.
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
