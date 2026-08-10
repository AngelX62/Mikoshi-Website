/**
 * Corner falloff, so every screen reads as a shot rather than a web page.
 *
 * Every reference image for this site goes dark at the corners; this is that,
 * generalised. Kept deliberately soft — it sits over the content, and the
 * eyebrow, scroll cue and footer legal row all live exactly where it darkens.
 */
export default function Vignette() {
  return (
    <div
      aria-hidden="true"
      data-chrome
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background:
          "radial-gradient(ellipse 78% 78% at 50% 48%, transparent 42%, rgba(0,0,0,0.42) 78%, rgba(0,0,0,0.72) 100%)",
      }}
    />
  );
}
