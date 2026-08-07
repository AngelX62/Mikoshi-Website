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
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.055] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,${NOISE}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    />
  );
}
