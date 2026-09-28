# Afterscale

Site for Afterscale, an AI research company working on **training-efficient
intelligence**: helping models gain more capability from the computation used to
train them. The first question is whether the value of what a model should learn
next can be estimated cheaply enough to be worth using.

> **Afterscale is a working name**, and the site says so on its front page. The
> wordmark is set in type rather than drawn for exactly that reason. See
> [`src/lib/logo.ts`](src/lib/logo.ts).

This was MIKOSHI, a physical-AI programme with CNC machine tending as its proving
ground. Nothing of that thesis survives in the copy; the layout system, the
tokens and the transport all did. The pivot is documented at the top of
[`src/content.ts`](src/content.ts).

Next.js 16 (App Router) · TypeScript · Tailwind 4. No animation library, no
smooth-scroll library. Every page is prerendered to static HTML; one POST route
runs on the server, which is why this wants a host that runs Next rather than a
bucket. See "Wiring up the forms".

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm typecheck
```

`packageManager` pins pnpm, so run `corepack enable` once and you get the version
this was built with. Vercel detects `pnpm-lock.yaml` and needs no config.

On Windows, **stop any server holding the build output before building** or
`next build` fails with `EBUSY: rmdir`.

## Routes

Five pages, all prerendered, plus a 404 and one API route.

```
/                 Home         the claim, the record of what is open, updates
/vision           Vision       why training efficiency is worth a company
/research         Research     the first question, and the prior art it must beat
/evidence         Evidence     what would count, and what would make us stop
/contact          Contact      the collaborator and objection form
/api/subscribe    POST only    the Buttondown proxy
```

`/technology` and `/first-proof` are the old names of `/research` and
`/evidence`. Nothing was deployed under either, so no redirects exist; the 404
page names both.

## Changing the copy

**Every word lives in [`src/content.ts`](src/content.ts)**, including chrome like
the nav labels and the sheet numbers on the annotation strips. Editing a sentence
should never mean opening a component.

Three rules govern that file and they are stated at the top of it: prose does not
enumerate, no em dashes, nothing invented. Read them before adding copy.

**The third rule is doing real work here.** The research brief is careful about
what it declines to claim, and content.ts lists four traps a future edit could
walk into: cheaper training does not imply cheaper inference or lower industry
energy use, this is not an argument that scaling has stopped working, and the
learning-value estimate is a question rather than a mechanism.

## How the layout works

Two primitives carry the whole site.

- **[`Band`](src/components/Band.tsx)** is a full-bleed horizontal section with
  `tone="bone"` or `tone="tint"`. Pages are made by stacking bands and choosing a
  tone for each. Hard edges, no gutters, no radii, no shadows.
- **[`Strip`](src/components/Strip.tsx)** is the tiny mono annotation row across
  the top of a band. It states its identifier twice, once short and once spelled
  out, which is where `RESEARCH` and `SHEET TWO OF FOUR` come from.

**The tint is a place, not a mode.** There is one theme and no toggle. `.tint` in
[`globals.css`](src/app/globals.css) redefines the ink tokens inside its own
subtree, so nothing within a band needs to know which ground it stands on.

**One ink means one thing.** The rose `#962a45` marks what is under test and
nothing else, at most once per band. `.under-test` is the device. A record of
open decisions is *not* under test, which is why home's record separates settled
from open with ink weight instead.

## Type, and the three registers

Two families, three jobs.

- **Archivo on a width axis**, used as a ladder of certainty: `wdth` 108 where
  the site claims (`.display`), 100 where it explains (body), 88 where it
  qualifies (`.qualifier`). `axes: ["wdth"]` must be named in `layout.tsx` or the
  axis never ships and every one of those silently sets at normal width.
- **Martian Mono at 10px**, tracked, for chrome: labels, strips, status lines.
- **Martian Mono at 13px**, untracked (`.data`), for anything that is a reference
  or a value rather than prose: citations, model sizes, the rows of a record.

The wordmark is Archivo at `wdth` 125, the top of the axis, set in
[`Logo.tsx`](src/components/Logo.tsx) beside the mark as a flex row. Archivo's
cap is **0.690em** measured, not the 0.73 a rule of thumb suggests, and the mark
is scaled against that number.

## Four things that will bite you

- **The grain is pre-compensated into the ground colours.** It multiplies over
  bone, so `--color-ground` sits about four levels above the bone you actually
  see, and every contrast ratio in `globals.css` is measured against the
  composite rather than the token. Change the grain opacity and the ground
  drifts.
- **Home follows its content, not the viewport height.** Its mission and links
  share the opening with a live particle surface, then lead into
  `#research-intro`, with the question and all six decision rows.
  `Header.tsx` still publishes `--header-h`, but home no longer uses it for sizing.
- **`.reveal`'s translate must stay negative.** A downward transform adds to a
  page's scrollable overflow, which made home 906px tall inside a 900px window
  while it animated. It also means **any measurement taken in the first 1.8s
  reads elements 6px high**, which has produced a false bug report before.
- **`prefetch={false}` on every internal link.** Originally to dodge a 404 that
  only happened under `output: "export"`, which is gone. It stays off because
  five routes of a few kilobytes each do not need prefetching.

`prefers-reduced-motion` resolves every entrance to its finished state, including
zeroing the stagger delays.

## Wiring up the forms

Two forms, one transport. The band at the foot of home asks engineers for an
address; /contact asks for a collaborator or an objection. Both post to
`/api/subscribe/` and land in **Buttondown**, tagged `home` or `contact`.

```
BUTTONDOWN_API_KEY=...        # .env.local, and Vercel's env vars
```

Get it from Buttondown under API → Keys. It is a **server** variable with no
`NEXT_PUBLIC_` prefix, and that is the point: it never enters the browser bundle.

**This is why `output: "export"` is gone.** Buttondown's embed endpoint has to be
the action of a native HTML form and their docs say not to call it with `fetch`,
since a subscriber sometimes has to follow the response to clear a CAPTCHA.
Their API refuses cross-origin browser requests and points you at a server-side
proxy. [`src/app/api/subscribe/route.ts`](src/app/api/subscribe/route.ts) is that
proxy. The alternative was throwing the reader to a Buttondown-branded page at
the moment they convert.

Three behaviours in that route are deliberate:

- **With no key set it answers 503 and the form says it is not connected.** It
  does not pretend to have sent anything. That rule is load-bearing and predates
  this transport; do not replace it with a fake success state.
- **A duplicate address is a success, not an error.** Buttondown answers 400 on a
  collision, the route turns that into 409, and the form says "You are already on
  the list" in ordinary ink.
- **A rejected tag is retried without one.** Tagging is gated on Buttondown's
  plan. Without the retry a free account would fail every signup. The address is
  what matters; the tag is a convenience.

Post to `/api/subscribe/` **with the trailing slash**. `trailingSlash: true` is
on and the bare path answers 308.

**The endpoint is gated, not protected, and the difference matters.** Two checks
stand in front of it:

- An **`Origin` check**. The Fetch standard requires the header on every POST,
  including same-origin ones, so a request without it never came from a browser.
  The header is one line in any HTTP client, so this removes the effortless case
  and nothing more. Do not write it down as a security control.
- A **honeypot**, a `company` field placed off-screen and taken out of both the
  accessibility tree and the tab order. Filled means a form-filler, and the route
  answers 204 rather than an error so the run gets no signal to correct.

**There is still no rate limit**, which is the check that would actually hold,
and it needs state that outlives a request: Vercel KV or Upstash, keyed on IP.

The honeypot sits **above** the API key check on purpose. It was below it once,
which made the trap stop working whenever the key was absent, and the window
between a first deploy and somebody setting the variable is exactly when an open
endpoint gets found.

## The preview card

`src/app/opengraph-image.png` is a 1200x630 screenshot of home's opening.
Capture at a 1200x750 viewport and device scale 1 with reduced motion on, after
`document.fonts.ready`, with the development toolbar (`nextjs-portal`) and
document scrollbars hidden. Clip x=0, y=0, width=1200, height=630, and review
the crop before replacing the file. `opengraph-image.alt.txt` describes the
picture and must be updated whenever it changes.

**Clip from the document top, not from `.home-hero`.** Home's `h1` is the
headline now rather than the lockup, so a capture that starts at the hero
produces a card with the company's name nowhere on it. Starting at y=0 puts the
header lockup in frame.

At 1200 the hero runs to y=685, so the frame cannot hold it all. What falls
outside is the field's lower edge and the motion toggle; the alt text says the
field shows no data.

**It is a screenshot, so nothing regenerates it, and it has gone stale twice**
already: once when the title card became the hero, once at the typeface change.
A change to home's opening or to the display face is a recapture. Generating it
with `ImageResponse` would rebuild on every deploy, but Satori cannot draw the
WebGL field, which is half the composition.

The file is about 600KB. A field of fine particles is close to noise and does
not compress; only crawlers fetch it, and no page on the site loads it.

The home illustration is drawn directly on a transparent canvas by
`src/lib/hero-field.ts`, managed by `src/components/LivingHero.tsx`. It samples
no image and uses the site's ink and rose tokens. The generated PNG approach
was rejected during visual review because it looked pasted onto the page.

The field runs at up to 30 frames per second, with fewer points on small screens
and a capped drawing resolution. Pause, reduced motion, a hidden tab, and
scrolling out of view all stop animation. Reduced motion renders one still
frame; devices without WebGL use a transparent Canvas 2D drawing. GPU resources
and listeners are released on navigation. Context restoration recreates the
renderer. This is an illustration, not research evidence.

`src/app/home.css` owns the responsive hero layout. The historical
`afterscale-wave.png` and `wave.webp` in `src/assets/` are retained and imported
by nothing, so neither reaches a bundle. They are 4.6 MB between them; delete
them or gitignore them rather than carrying them in history if the raster is
not coming back.

Every route builds its own `openGraph` object through
[`routeMetadata`](src/lib/metadata.ts). That is not optional tidiness: Next takes
`openGraph` whole from the nearest ancestor that declares one and does not
backfill it, so for a while every route emitted home's card and an `og:url` of
`/`.

`site.url` is read from the environment: `NEXT_PUBLIC_SITE_URL` first, then
`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` (the production alias), then
`NEXT_PUBLIC_VERCEL_URL` (the per-deployment hostname), then localhost. Set the
first once there is a real domain.

Every one of those fallbacks is a `NEXT_PUBLIC_` variable, and Vercel only
provides them when **"Automatically expose System Environment Variables"** is on
in the project settings. With it off and no domain set, a deploy would publish
`http://localhost:3000` as every canonical, every `og:url` and all five sitemap
entries, with nothing failing. `resolveSiteUrl` throws at build time if that
happens on Vercel rather than shipping it.

## Indexing

**The site is unlisted.** `layout.tsx` sets `robots: { index: false, follow:
false }`, which puts `noindex, nofollow` on all five routes and the 404.
"Afterscale" is a working name and a cached working name is slow to undo.

`robots.ts` still allows crawling, and that is deliberate rather than an
oversight. **robots.txt governs crawling, not indexing.** `disallow: "/"` stops
the crawler at the door, so it never reads the `noindex`, and a URL found
through any external link can still be listed as a bare address. Google's
guidance says so directly: do not block a page you want kept out of the index.
The sitemap line was dropped from robots.txt for the same reason, though
`sitemap.ts` still answers.

**To go listed:** delete the `robots` key in `layout.tsx` and restore the
sitemap line in `robots.ts`. Those two edits are the whole reversal.

## Not done yet

FIG. 1. Home had a character-grid drawing and it went with the old thesis; the
frame it sat in now holds the record of open decisions instead.
[`Drawings.tsx`](src/components/Drawings.tsx) keeps the numbered-figure furniture
and describes what the replacement has to be, the short version being that
Afterscale has no results, so a chart would have to invent them.

There is no contact email on the site: it printed an address on a domain nobody
owns. The colophon's Contact pair comes back once an address receives mail.
