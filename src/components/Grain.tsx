/**
 * Film grain overlay.
 *
 * A single inline SVG turbulence baked into a data URI — it costs nothing per
 * frame, unlike redrawing noise on a canvas. Kept at low opacity so it reads as
 * film stock rather than as visible noise.
 */
const NOISE = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="200" height="200" filter="url(%23n)" opacity="0.55"/></svg>`;

export default function Grain() {
  return (
    <div
      aria-hidden="true"
      // No blend mode. The element itself never repaints, but `mix-blend-overlay`
      // across the full viewport forces the compositor to read back and re-blend
      // the backdrop on every frame the canvas changes, which is every frame. At
      // this opacity plain compositing is indistinguishable and costs nothing.
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.055]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${NOISE}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    />
  );
}
