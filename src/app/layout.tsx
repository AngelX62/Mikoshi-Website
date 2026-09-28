import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Martian_Mono } from "next/font/google";
import { site } from "@/content";
import Header from "@/components/Header";
import Grain from "@/components/Grain";
import "./globals.css";

/**
 * Bricolage Grotesque, variable on optical size, width and weight.
 *
 * ── ARCHIVO WAS HERE, AND THE COMPLAINT WAS THAT IT READ STIFF ───────────────
 * It was set as a ladder of certainty on its width axis: 108 where Afterscale
 * claims, 100 where it explains, 88 where it qualifies. The idea was sound and
 * the execution was rigid. Measured on /vision, the h1 was **86.4px at weight
 * 600, `wdth` 108, tracking -0.03em and leading 0.980**, which is leading
 * tighter than the type is tall. Wide, heavy, negative tracked and locked into a
 * rectangle: four settings all pushing the same way.
 *
 * **This family cannot carry that ladder and no other family can either.**
 * Checked against next/font's own data, Archivo is the only candidate whose
 * width axis goes above 100: it runs 62 to 125, and Bricolage, Instrument Sans,
 * Newsreader, Source Serif, Literata and Fraunces all stop at 100 or have no
 * width axis at all. So `wdth` 108 for a claim, and the wordmark's `wdth` 125,
 * are simply unreachable now.
 *
 * `opsz` replaces it, and is the better instrument anyway. It is the axis drawn
 * for this exact job: at 64px the face gives display letterforms rather than
 * body shapes scaled up, which is what fixes stiffness at the root rather than
 * by unwinding tracking. **`wdth` is still requested** because the qualifier
 * register survives untouched at 88, which is inside this family's 75 to 100.
 *
 * ── NAME EVERY AXIS YOU RELY ON. THIS TRAP HAS NOW CAUGHT FOUR FACES ─────────
 * next/font ships only the default axes unless the others are asked for by
 * name, and the failure is silent. Archivo's `wdth` fell into it, Bodoni's
 * `opsz` fell into it, Doto's `ROND` fell into it, and `opsz` here would take
 * the whole point of the change with it. Verify on a rendered element's
 * computed `font-variation-settings`, never on this config.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

/*
 * ── DOTO WAS HERE, AND IT WAS A FONT REQUEST BOUGHT WITH NOTHING ─────────────
 * The display face was Bodoni Moda, on the reasoning that didone and halftone
 * are the same era and the same printing technology. It was replaced by Doto on
 * a better reasoning: `halftone.ts` drew `ctx.ellipse`, so the field was a
 * Bayer-dithered lattice of discs, and Doto is built on a 6x10 dot matrix. The
 * glyphs were made of the same primitive as the picture, so the headline and the
 * image were one system rather than two sharing a page.
 *
 * That was a good argument for as long as there was a picture. The halftone is
 * gone from every route, and by the end `.matrix` had one call site and
 * `.resolve` had none: a whole variable family with a custom `ROND` axis,
 * downloaded on every page, for a single line of type.
 *
 * **The trap it fell into is worth keeping, because it has now caught three
 * faces.** Next's font loader ships only the default axes unless the others are
 * named: Archivo's `wdth` fell into it, Bodoni's `opsz` fell into it, and Doto's
 * `ROND` is a custom axis, so unrequested the face shipped square-dotted, which
 * is the one thing it was chosen not to be. If a variable axis is load-bearing,
 * name it in `axes` or it never reaches the browser, and the failure is silent.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Martian Mono, used at exactly one size and one weight: 10px, regular,
 * uppercase, tracked +0.22em. It is an unusually wide monospace, which is what
 * makes it read as an instrument annotation rather than as code.
 *
 * 600 was declared here and never used by a single rule on the site, which put
 * a second `@font-face` in the stylesheet for a face nothing could ever ask
 * for. One weight, because one weight is what the design uses.
 */
const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-martian-mono",
  display: "swap",
});

/** Title separator. Not an em dash: see the copy rules in src/content.ts. */
const TITLE = `${site.name} · ${site.tagline}`;

/**
 * The shared preview card, and **it has now gone stale twice**, once when the
 * title card was replaced by the hero and once at the typeface change. It is a
 * screenshot, so nothing regenerates it. Treat a change to home's opening or to
 * the display face as a recapture.
 *
 * Recipe: 1200x750 viewport, DPR 1, reduced motion on so the field is one still
 * frame, `document.fonts.ready` awaited, the development toolbar
 * (`nextjs-portal`) and document scrollbars hidden, then clip x=0 y=0
 * 1200x630 and review the crop before replacing the file.
 *
 * **Clip from y=0, not from `.home-hero`.** Home's `h1` is the headline now
 * rather than the lockup, so a capture starting at the hero produces a card with
 * the company's name nowhere on it. Starting at the document top puts the header
 * lockup in the frame, which is the only place the name appears.
 *
 * At 1200 the hero runs to y=685, so the frame cannot hold all of it. What falls
 * outside is the field's lower edge and the motion toggle. The crop keeps the
 * headline, the paragraph, both links and the stage line, and
 * `opengraph-image.alt.txt` says in as many words that the field shows no data.
 * Update that file whenever the picture changes.
 *
 * The PNG is about 600KB, because a field of fine particles is close to noise
 * and does not compress. Only crawlers fetch it; no page on the site loads it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: TITLE,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  /**
   * Home's canonical, and the only one declared here.
   *
   * **This object does not reach the child routes and it must not be relied on
   * to.** Next takes `openGraph` and `alternates` whole from the nearest
   * ancestor that declares them, without backfilling either from a child's own
   * `title` or `description`, so for a long time every route on this site
   * emitted home's social card and `og:url` of `/`. The four routes each build
   * their own now. See `routeMetadata` in lib/metadata.ts, which has the
   * measurements.
   *
   * Trailing slash, matching `trailingSlash: true` and sitemap.ts.
   */
  alternates: { canonical: "/" },
  /**
   * ── UNLISTED WHILE THE NAME IS PROVISIONAL, AND THIS IS THE SWITCH ──────────
   * "Afterscale" is a working name, home says so in the standing table, and a
   * search engine that caches a working name is slow to persuade otherwise. So
   * the site is reachable by anybody holding the link and absent from results.
   *
   * **`disallow: "/"` in robots.ts is the switch that looks like it works.**
   * robots.txt governs crawling, not indexing. A blocked page is one the crawler
   * never fetches, so it never reads a `noindex`, and a URL discovered from any
   * external link can still be listed bare with no description. Google's own
   * guidance is explicit: do not block a page you want kept out of the index.
   *
   * This tag is the load-bearing half, and robots.ts stays open enough for it to
   * be read. See the docblock there.
   *
   * **It reaches the child routes and `openGraph` does not**, which is a
   * distinction this file has already been wrong about once. Next merges
   * metadata field by field from the nearest ancestor that declares it, and
   * `routeMetadata` declares no `robots`, so one line covers five routes and the
   * 404. Confirm that in the rendered HTML rather than here: the same reasoning
   * applied to `openGraph` shipped four routes carrying home's social card.
   *
   * **To go listed, delete this key and restore the sitemap line in robots.ts.**
   * Those two edits are the whole reversal.
   */
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: site.description,
  },
};

/**
 * One ground, so one theme colour.
 *
 * This used to carry two entries keyed off `prefers-color-scheme`, and the
 * document head used to carry an inline script that stamped `data-theme` before
 * first paint so the static export would not flash the wrong ground on load.
 * Both are gone with the dark theme. The near-black on this site is a band
 * inside the page, not a mode the page can be in, so the browser chrome should
 * match the ground and nothing else.
 */
export const viewport: Viewport = {
  themeColor: "#edeae4",
  colorScheme: "light",
};

/**
 * The header lives here. The footer deliberately does not.
 *
 * The header is shared because five routes rebuilding their own nav is five
 * chances for it to drift. It is static rather than sticky: a sticky header on
 * a site of full-bleed bands would have to keep re-reading the ground beneath
 * it, and no route is long enough to need it.
 *
 * **The footer is composed by each route instead.** The original reason was
 * that home did not scroll at all, so a colophon would have fallen below the
 * fold. Home scrolls by exactly one band now and ends on `Footer` like everyone
 * else, so what keeps this arrangement is the weaker but still sufficient
 * reason: five repeated imports is a smaller price than a layout that reads the
 * current route to decide what to render, and it keeps every page a server
 * component.
 *
 * **`min-h-screen` here no longer sizes home's title card.** It did while home
 * was the only content on the page and `flex-1` could absorb the slack. With a
 * band under it `main` exceeds the viewport, `flex-1` contributes nothing, and
 * the card follows its content height. What this still does is hold the footer
 * at the bottom on a short route.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${martianMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-ground antialiased">
        <Header />
        {children}
        <Grain />
      </body>
    </html>
  );
}
