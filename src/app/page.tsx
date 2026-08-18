import Link from "next/link";
import { footer, hero, site, waitlist } from "@/content";

/**
 * Home: one screen, one claim, one action.
 *
 * **Nothing below the fold, and that is the whole rebuild in one page.** The
 * site this replaces was 8.7 screens of continuous scroll with 2520px of that
 * pinned inside a single section, and a visitor could not tell how long it was
 * or what was coming. Home now says who MIKOSHI is and stops. Everything else
 * is behind the nav, which puts real weight on the four routes and means each
 * of them has to stand on its own.
 *
 * It is the centred lockup from the reference sheet: a small caps label, the
 * wordmark set as wide as the face goes, the claim under it, one action, and a
 * credit line at the foot of the frame. Dead symmetrical. Every other page on
 * the site is asymmetric and stacked, so this is the one composition that
 * announces itself as a title card rather than as a document.
 *
 * **It carries a one-line colophon rather than the site footer.** A full
 * colophon under a full-screen lockup would sit below the fold, which is the
 * one thing this page exists not to do. See the note in layout.tsx.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center md:px-10">
        <p
          className="reveal font-mono text-[10px] uppercase leading-none tracking-[0.28em] text-ink-dim"
          style={{ animationDelay: "80ms" }}
        >
          {hero.eyebrow}
        </p>

        {/*
          The page's real h1, set in type. It used to be rasterised into a
          canvas at weight 600 and mirrored into a visually hidden heading for
          anything that could not see it. There is no canvas, so the heading is
          simply the heading.

          The size clamp is bounded at both ends by measurement rather than by
          taste: at `wdth` 125 with 0.18em of tracking the seven letters run
          about 6.5em wide, so 5.5rem is the largest that clears the measure at
          1440 and 10.5vw is the largest that clears the padding at 390.
        */}
        <h1
          className="reveal wordmark mt-8 text-[clamp(2rem,10.5vw,5.5rem)] leading-[0.95] text-ink"
          style={{ animationDelay: "220ms" }}
        >
          {hero.wordmark}
        </h1>

        <div
          className="reveal mt-10 flex flex-col gap-1 text-lg leading-snug text-ink-soft md:mt-12 md:text-2xl"
          style={{ animationDelay: "460ms" }}
        >
          {hero.descriptor.map((beat) => (
            <span key={beat}>{beat}</span>
          ))}
        </div>

        <Link
          href="/contact"
          prefetch={false}
          className="reveal group mt-12 inline-flex items-center gap-3 border-b border-ink-faint pb-2 font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink transition-colors duration-300 hover:border-accent hover:text-accent md:mt-16"
          style={{ animationDelay: "660ms" }}
        >
          {waitlist.cta}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </Link>
      </div>

      {/*
        The credit line, held to one row so the screen ends here.

        Same label-over-value idea as the site colophon, laid out flat: on a
        title card the credit belongs along the bottom edge of the frame, not
        stacked in the middle of it.
      */}
      <div
        className="reveal mx-auto flex w-full max-w-[86rem] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 pb-8 font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim md:justify-between md:px-10 lg:px-16"
        style={{ animationDelay: "880ms" }}
      >
        <span>{site.name}</span>
        <span className="hidden sm:inline">{site.tagline}</span>
        <span>{footer.copyright}</span>
      </div>
    </main>
  );
}
