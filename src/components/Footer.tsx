import Link from "next/link";
import { footer, hero, nav, site } from "@/content";

/**
 * The colophon.
 *
 * Lifted from the credit block on the reference sheet: the wordmark, then a row
 * of tiny label-over-value pairs, the whole group centred and given far more
 * air than type this small looks like it deserves. The label is in the faintest
 * ink the palette has and the value directly under it in full ink, so the pair
 * reads as one unit at a glance and as two facts on inspection.
 *
 * It is a plate, which is what lets it close the page. Every route ends on a
 * band of near-black regardless of what tone the route's last content band was,
 * so the site has one ending rather than five.
 *
 * The nav is repeated here from the same array the header uses. One list, two
 * places, and no chance of the two drifting apart.
 */
export default function Footer() {
  const pairs = [
    { label: footer.labels.company, value: site.name },
    { label: footer.labels.discipline, value: hero.eyebrow },
  ];

  return (
    <footer className="plate relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] mix-blend-screen [background-image:var(--noise)] [background-size:180px_180px]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[86rem] flex-col items-center gap-12 px-6 py-20 md:px-10 md:py-24 lg:px-16">
        <Link
          href="/"
          prefetch={false}
          aria-label={`${hero.wordmark}, home`}
          className="wordmark text-[13px] text-ink transition-colors duration-300 hover:text-accent"
        >
          {hero.wordmark}
        </Link>

        <div className="flex flex-wrap items-start justify-center gap-x-14 gap-y-8 text-center">
          {pairs.map((pair) => (
            <div key={pair.label} className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim">
                {pair.label}
              </span>
              <span className="text-sm text-ink-soft">{pair.value}</span>
            </div>
          ))}

          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim">
              {footer.labels.contact}
            </span>
            <a
              href={`mailto:${footer.email}`}
              className="text-sm text-ink-soft underline decoration-ink-faint underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
            >
              {footer.email}
            </a>
          </div>
        </div>

        {/* The same destinations as the header, for a reader who has arrived
            here down three screens of vision copy rather than by scrolling
            back to the top to look for them. */}
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase leading-none tracking-[0.18em] sm:gap-x-8 sm:tracking-[0.22em]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="text-ink-dim transition-colors duration-300 hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim">
          {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
