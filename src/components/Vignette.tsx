/**
 * Corner falloff, so every screen reads as a shot rather than a web page.
 *
 * Every reference image for this site goes dark at the corners; this is that,
 * generalised. Kept deliberately soft — it sits over the content, and the
 * eyebrow, scroll cue and footer legal row all live exactly where it darkens.
 *
 * The two stops are tokens rather than literals because the light theme needs
 * different ones, and not merely lighter ones. Black at 0.72 over a near-white
 * ground is a grey picture frame around the page: a falloff on a light ground
 * has to be warm and about a fifth as strong to read as fall-off at all rather
 * than as a border. See `--vignette-edge` in globals.css.
 */
export default function Vignette() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background:
          "radial-gradient(ellipse 78% 78% at 50% 48%, transparent 42%, var(--vignette-mid) 78%, var(--vignette-edge) 100%)",
      }}
    />
  );
}
