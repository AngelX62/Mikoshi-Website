import Image from "next/image";
import Link from "next/link";
import footerGradient from "@/assets/footer-gradient.webp";
import Logo from "@/components/Logo";
// `site` went with the PROJECT pair. Its only use here was `site.name`, which
// was the wordmark's own text printed a second line under the wordmark.
import { footer, hero, nav } from "@/content";

/**
 * The colophon.
 *
 * Lifted from the credit block on the reference sheet: the wordmark, then a row
 * of tiny label-over-value pairs, the whole group centred and given far more
 * air than type this small looks like it deserves. The label is in the faintest
 * ink the palette has and the value directly under it in full ink, so the pair
 * reads as one unit at a glance and as two facts on inspection.
 *
 * It is the one dark ground on the site, which is what lets it close the page.
 * Every route ends on the same gradient regardless of what tone the route's last
 * content band was, so the site has one ending rather than five.
 *
 * ── DARK AGAIN, AND THIS IS NOT THE PLATE COMING BACK ───────────────────────
 * It was a near-black plate, then a tint. The plate went because the bands were
 * plates too, so a reader scrolling the site passed through bone, black, bone,
 * black, and the page could not decide what it was printed on. No band on any
 * route is dark now. The page stays on paper until it ends and then ends once,
 * in the accent's own hue rather than in black.
 *
 * Chosen on 22 September 2026 against a light version that lit the middle of
 * the same picture instead, with the cost stated: one dark ground, and a token
 * set of its own in `.dusk`. The light version kept the paper and lost most of
 * the colour, which was the reason for the picture.
 *
 * The nav is repeated here from the same array the header uses. One list, two
 * places, and no chance of the two drifting apart.
 *
 * **There were three pairs and the third was an address that did not work.** It
 * printed a contact address on a domain the project does not own, in the
 * colophon of every route. The forms deliver now, so the site has a working way
 * in and does not need a decorative one. The row was built to wrap and never
 * assumed a count, so it has taken each change without one of its own.
 *
 * **A second pair also went, for saying the name twice.** The block printed the
 * wordmark, then `PROJECT / <name>` about 40px under it, then the copyright:
 * three occurrences of one word inside roughly 180px of a centred stack. It
 * carried nothing the wordmark directly above it had not already given, which is
 * rule one in content.ts happening in the footer of the file that wrote the rule.
 *
 * ── THE VERSION PAIR IS NEW, AND IT REPLACED THE REGISTRATION TICKS ──────────
 * The tinted bands used to carry printer's corner marks. Those were earned while
 * the subject was physical apparatus and became costume the moment it was not: a
 * press mark on a document about training runs is borrowed authority.
 *
 * What a pre-registered protocol actually carries is a version and a date, so
 * that is what the furniture says now. `DIRECTION / v1.0, 7 September 2026`
 * states which revision of the research brief this site was built from, which is
 * a real fact, a checkable one, and the kind of thing only a company that
 * expects to be checked bothers to print.
 *
 * Two pairs, and they are the two that say something: what the discipline is,
 * and which version of the direction you are reading.
 */
export default function Footer() {
  const pairs = [
    { label: footer.labels.discipline, value: hero.eyebrow },
    { label: footer.labels.direction, value: footer.direction },
  ];

  return (
    // `isolate` makes the footer its own stacking context, so the blend modes
    // in `.footer-art` reach the footer's plum and its picture and nothing
    // behind the page. No top rule: where a dark ground meets bone, the change
    // of ground is the edge, and a rule would draw it twice.
    <footer className="dusk relative isolate w-full">
      {/*
        ── THE GRADIENT, SHOWN AS IT WAS DRAWN ─────────────────────────────────
        A noise gradient in plum, wine, rose and peach, full bleed at every
        width. `object-fit: cover`, centred: the picture is 3:1 and the footer
        runs from 0.6:1 on a 320 phone to 5.9:1 at 2560, so cover crops its
        sides on narrow screens and its top and bottom on wide ones, and a
        gradient survives either.

        **Until 22 September 2026 this was an ink stipple on the tint, and that
        is parked, not deleted.** The picture and its script are still in the
        project; see ink-field.mjs for how to put it back.

        The colophon cannot stand on the picture as drawn: its bright crest
        crosses the middle of the frame, where the text is. `.footer-art` in
        globals.css darkens the picture behind the text and puts back the grain
        that darkening took. The measurements are there.

        ── `unoptimized`, BECAUSE THE BAKE ALREADY CHOSE THE ENCODING ──────────
        Next's optimiser is limited to quality 90 on this site (see
        next.config.ts), and at 90 this picture is 363 KB, because it is mostly
        grain and grain does not compress. scripts/footer-gradient.mjs encodes it
        once at 80: 177 KB, with 86% of the grain kept.

        **A srcset would only ever choose the largest file anyway.** Cover sets
        the picture by the footer's height on a phone, so it is drawn about 1200
        CSS pixels wide at 390 and 1500 at 360, where the nav wraps and the
        footer is taller. A 3x phone asks for 3600 to 4500, more than the 2172
        the master has. One file, one URL on every route, fetched once per
        visit.

        **Lazy, and that is right on the routes it is not right for.** On home,
        /vision, /research and /evidence the footer starts at least 1500px down
        at every size measured. On /contact and the 404 page at desktop sizes it
        starts on screen, where a lazy image is fetched at once anyway, so the
        cost there is the browser's short wait for layout. Next's dev overlay
        then reports the picture as the page's largest paint and suggests
        `loading="eager"`; that would fetch it up front on every route, for the
        sake of two.

        **Re-measure the labels whenever the picture changes.** Hide the
        colophon's text, screenshot the footer and sample the pixels behind each
        line: the numbers in globals.css were taken that way. The bake script
        warns when a new master is brighter behind the text than this one.
      */}
      <div aria-hidden="true" className="footer-art pointer-events-none absolute inset-0 overflow-hidden">
        <Image src={footerGradient} alt="" fill unoptimized className="object-cover" />
      </div>

      <div className="track relative z-10 flex flex-col items-center gap-12 py-20 md:py-24">
        <Link
          href="/"
          prefetch={false}
          aria-label={`${hero.wordmark}, home`}
          className="-my-1 block py-2 text-ink transition-colors duration-300 hover:text-accent"
        >
          {/*
            14 rather than the header's 15, so the colophon stays the quieter of
            the two, and not lower: 12 is where the stem drops to a single device
            pixel at 1x. The mark fills in `currentColor` and the name inherits
            it, so the ink token drives the whole lockup here with nothing else
            to do, which is what makes a light-on-dark master a file nobody has
            to ship. See Logo.tsx.
          */}
          <Logo size={14} />
        </Link>

        <div className="flex flex-wrap items-start justify-center gap-x-14 gap-y-8 text-center">
          {pairs.map((pair) => (
            <div key={pair.label} className="flex flex-col items-center gap-2">
              <span className="font-mono text-[11px] uppercase leading-none tracking-[0.22em] text-ink-dim">
                {pair.label}
              </span>
              <span className="text-sm text-ink-soft">{pair.value}</span>
            </div>
          ))}
        </div>

        {/* The same destinations as the header, for a reader who has arrived
            here down three screens of vision copy rather than by scrolling
            back to the top to look for them.

            **Set exactly as the header's nav is**, mono in sentence case at the
            same size steps. It was 10px uppercase here and 14px sentence case up
            there, so one list looked like two different things. The labels and
            the copyright above and below stay uppercase: they are labels, and
            this is navigation. */}
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-[11px] leading-none tracking-[0.06em] sm:gap-x-8 sm:text-xs sm:tracking-[0.08em] lg:text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  // Same 24px target problem and the same fix as the header.
                  // See the note there for why the negative margin is not
                  // optional on a nav that wraps.
                  className="-my-1 block py-2 text-ink-dim transition-colors duration-300 hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="font-mono text-[11px] uppercase leading-none tracking-[0.22em] text-ink-dim">
          {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
