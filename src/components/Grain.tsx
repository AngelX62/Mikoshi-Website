/**
 * Film grain over the whole viewport.
 *
 * This is the only texture on a site with no photography, and it is the single
 * most transferable thing in either reference: the frame that gave this site
 * its annotation strip is defined more by its grain than by anything drawn in
 * it. So it is meant to be seen. Grain tuned down until it is technically
 * present and visually absent is a cost with no benefit.
 *
 * **Multiply, not overlay.** The noise the filter produces averages to mid
 * grey. Multiplying it into bone darkens in proportion to the noise and leaves
 * the ground's hue alone, which is what grain in a print does. Overlay would
 * push both ways from mid grey and, on a ground this light, would mostly push
 * up into blown white and read as haze.
 *
 * It follows that this layer does nothing at all over a plate, since
 * multiplying into near black is near black. Plates carry their own screened
 * copy of the same noise. See Band.tsx.
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
