/**
 * Film grain over the whole viewport.
 *
 * This is the only texture layer on the site, and it is the single most
 * transferable thing in either reference: the frame that gave this site its
 * annotation strip is defined more by its grain than by anything drawn in it.
 * So it is meant to be seen. Grain tuned down until it is technically present
 * and visually absent is a cost with no benefit.
 *
 * ── IT SAID "A SITE WITH NO PHOTOGRAPHY", AND THERE IS ONE PHOTOGRAPH NOW ────
 * /research carries a toned plate. See Plate.tsx. That makes this layer do a
 * second job it was not designed for and is unexpectedly good at: the same
 * noise crosses the picture and the paper around it, at the same scale, welded
 * to the viewport rather than to either. A photograph under a grain that is
 * continuous with the page is part of the sheet; the same photograph without it
 * is an image pasted onto a page.
 *
 * So the plate depends on this layer more than any type on the site does.
 * **If the grain is ever removed or tuned down, look at /research before
 * deciding it cost nothing.**
 *
 * **Multiply, not overlay.** The noise the filter produces averages to mid
 * grey. Multiplying it into bone darkens in proportion to the noise and leaves
 * the ground's hue alone, which is what grain in a print does. Overlay would
 * push both ways from mid grey and, on a ground this light, would mostly push
 * up into blown white and read as haze.
 *
 * **It reaches every band, and it does not reach the footer.** While the site
 * had a near black `plate` tone this layer did nothing over it, because
 * multiplying into near black is near black, so plates carried a second
 * screened copy of the same noise. No band is dark now, but the footer is, and
 * it carries its own copy of the noise in `soft-light` for the same reason. See
 * `.footer-art` in globals.css. It reads the same `--noise`, so it is the same
 * grain, not a second texture.
 *
 * That is also why the ground tokens are pre-compensated. This multiply pulls
 * bone down about four levels and the tint block with it, and the tint's ink
 * values are measured against the composite rather than the token. See the note
 * on `.tint` in globals.css, where `ink-dim` fails on the composite and passes
 * on the token, which is the trap.
 *
 * Fixed rather than absolute, so the grain stays welded to the screen while the
 * page moves under it. Grain that scrolls with the content reads as a texture
 * printed on the page; grain that does not reads as the image being one shot.
 */
export default function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.14] mix-blend-multiply [background-image:var(--noise)] [background-size:180px_180px]"
    />
  );
}
