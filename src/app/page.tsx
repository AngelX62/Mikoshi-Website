import Link from "next/link";
import Wordmark from "@/components/Wordmark";
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
 * wordmark, the claim under it, one action, and a credit line at the foot of
 * the frame. Dead symmetrical. Every other page on the site is asymmetric and
 * stacked, so this is the one composition that announces itself as a title card
 * rather than as a document.
 *
 * **The wordmark is drawn, not set.** It was 88px of type, and this was the
 * only route on the site with no plate on it, so the one page meant to read as
 * a title card was the one page with no texture and no tonal range in it at
 * all. It is now sampled onto a halftone grid, which is what the site looked
 * like before the rebuild and the single thing that made it look like itself.
 * See Wordmark.tsx.
 *
 * The real `h1` stays in the DOM as `sr-only` and the canvas is `aria-hidden`,
 * because a heading drawn as sixteen thousand dots is not a heading to anything
 * that cannot see it.
 *
 * **It carries a one-line colophon rather than the site footer.** A full
 * colophon under a full-screen lockup would sit below the fold, which is the
 * one thing this page exists not to do. See the note in layout.tsx.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/*
        No horizontal padding on this column, which is unlike every other page.
        The field is full bleed and the padding lives on the text children
        instead. See the note on the field below for why the width matters.
      */}
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p
          className="reveal px-6 font-mono text-[10px] uppercase leading-none tracking-[0.28em] text-ink-dim"
          style={{ animationDelay: "80ms" }}
        >
          {hero.eyebrow}
        </p>

        {/*
          Type below `lg`, the field at `lg` and up, and this is not a fallback.

          A halftone needs the mark to be physically big enough to sample.
          Measured across widths at weight 800: 1440 gives a 31px stem against a
          5.9px pitch, which is 5.3 dots across a stroke and reads crisply. 768
          gives 4.0. **390 gives 2.0**, because the wordmark is 335px wide there
          and only 49px tall, so the letterforms dissolve exactly the way the
          desktop version did before this was fixed.

          Nothing tunes that away. The pitch cannot go much below 4.5 without
          the dots themselves going sub-pixel, which trades a blurry wordmark
          for a grey smear. So the phone gets the wordmark set in type, which at
          that size is not a lesser version of the mark, it is the legible one.

          The crossover is 1024 because that is where the measurement clears 5
          dots per stroke, and it happens to be `lg`, so it reads as a normal
          breakpoint rather than a magic number.
        */}
        <h1
          className="reveal wordmark mt-8 text-[clamp(2rem,10.5vw,5.5rem)] leading-[0.95] text-ink lg:sr-only"
          style={{ animationDelay: "220ms" }}
        >
          {hero.wordmark}
        </h1>

        {/*
          The field absorbs whatever height is left rather than declaring one.

          `flex-1 min-h-0` with a ceiling, not a fixed height or a `vh` clamp.
          Home must not scroll, and any height expressed in the viewport's own
          units has to be right at every aspect ratio at once: 26vh fits
          comfortably at 1440x900 and overflows at 360x640, where the header
          wraps to two rows and there are only 490px left for everything. Taking
          the slack instead makes the guarantee structural rather than
          arithmetic, and the ceiling stops it becoming a billboard on a tall
          monitor.

          **Full bleed, and it was `max-w-5xl`.** Width is what decides whether
          the mark survives being sampled, because the grid pitch is fixed in
          pixels and the letterforms are not: constrained to 1024 the stems came
          out 16px against a 4.5px pitch, which is 3.6 dots across a stroke and
          is why it read as blur. Edge to edge at 1440 the same stems are 33px
          and about 5.6 dots. The field is the widest thing on the site because
          it has to be.

          **No `reveal` here either.** The canvas runs its own resolve, so the
          class would animate it twice, and its retained `transform` puts the
          canvas on a composited layer where it can be rasterised at the wrong
          scale. A canvas that draws its own entrance does not want a CSS one.
        */}
        <div
          className="mt-8 hidden w-full flex-1 justify-center lg:flex"
          style={{ maxHeight: "clamp(120px, 30vh, 300px)" }}
        >
          <Wordmark text={hero.wordmark} />
        </div>

        <div
          className="reveal mt-10 flex flex-col gap-1 px-6 text-lg leading-snug text-ink-soft md:mt-12 md:text-2xl"
          style={{ animationDelay: "460ms" }}
        >
          {hero.descriptor.map((beat) => (
            <span key={beat}>{beat}</span>
          ))}
        </div>

        <Link
          href="/contact"
          prefetch={false}
          className="reveal group mx-6 mt-12 inline-flex items-center gap-3 border-b border-ink-faint pb-2 font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink transition-colors duration-300 hover:border-accent hover:text-accent md:mt-16"
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
