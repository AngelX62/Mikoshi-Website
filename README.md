# MIKOSHI

Marketing site for MIKOSHI, physical intelligence for manufacturing.

Next.js 16 (App Router) · TypeScript · Tailwind 4. No animation library, no
smooth-scroll library, no canvas. Builds to a fully static export, so it deploys
anywhere with no server runtime.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static site -> out/
pnpm typecheck
```

`packageManager` pins pnpm, so run `corepack enable` once and you get the version
this was built with. Vercel detects `pnpm-lock.yaml` and needs no config.

On Windows, **stop any server holding `out/` before building** or `next build`
fails with `EBUSY: rmdir`.

## Routes

Five, all statically prerendered.

```
/                 Home         one screen, and it must never scroll
/technology       Technology   the thesis, then the four method steps
/deployment       Deployment   CNC machine tending, then ownership
/vision           Vision       the heading, four beats, the full statement
/contact          Contact      the form and the address
```

## Changing the copy

**Every word lives in [`src/content.ts`](src/content.ts)**, including chrome like
the nav labels and the sheet numbers on the annotation strips. Editing a sentence
should never mean opening a component.

Three rules govern that file and they are stated at the top of it: prose does not
enumerate, no em dashes, nothing invented. Read them before adding copy.

## How the layout works

Two primitives carry the whole site.

- **[`Band`](src/components/Band.tsx)** is a full-bleed horizontal section with
  `tone="bone"` or `tone="plate"`. Pages are made by stacking bands and choosing
  a tone for each. Hard edges, no gutters, no radii, no shadows.
- **[`Strip`](src/components/Strip.tsx)** is the tiny mono annotation row across
  the top of a band. It states its identifier twice, once as a symbol and once
  spelled out, which is where `02 · RECONSTRUCT` and `SHEET TWO OF FOUR` come
  from.

**The plate is a place, not a mode.** There is one theme and no toggle. `.plate`
in [`globals.css`](src/app/globals.css) redefines the ink tokens inside its own
subtree, so nothing within a band needs to know which ground it stands on.

## Three things that will bite you

- **The grain is pre-compensated into the ground colours.** It multiplies over
  bone and screens over plates, so `--color-ground` sits about four levels above
  the bone you actually see and `--color-plate` sits well below the black you
  actually see. Change a grain opacity and the ground drifts. Both tokens carry
  the measurements in a comment.
- **`.reveal`'s translate must stay negative.** A downward transform adds to a
  page's scrollable overflow, which made home 906px tall inside a 900px window
  while it animated. Home is the one page that must never scroll.
- **`prefetch={false}` on every internal link.** Next 16 requests an RSC payload
  at a path `output: "export"` does not write, which produced four 404s per page
  load. Five static routes do not need prefetching. Revisit if Next fixes it.

`prefers-reduced-motion` resolves every entrance to its finished state, including
zeroing the stagger delays.

## Wiring up the contact form

[`src/lib/waitlist.ts`](src/lib/waitlist.ts) posts JSON to
`NEXT_PUBLIC_WAITLIST_ENDPOINT`. Set it at build time to a hosted form endpoint
that needs no secret (Formspree, Formcarry, Basin all work):

```
NEXT_PUBLIC_WAITLIST_ENDPOINT=https://formspree.io/f/xxxxxxxx
```

**With no endpoint set the form says so and points at the address in the
footer.** It does not pretend to have sent anything. That behaviour is
deliberate and load-bearing; do not replace it with a fake success state.

The value is inlined into the browser bundle, so the endpoint must be one that is
safe to publish. Anything needing a real secret has to move to a serverless
function.

## Not done yet

Photography, OG images, and analytics. `site.url` in `src/content.ts` is still
`https://mikoshi.com`, which may not be the real domain; set it before launch or
OG and canonical URLs will not resolve.
