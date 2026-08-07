# MIKOSHI

Marketing site for MIKOSHI — robotic software.

Next.js 16 (App Router) · TypeScript · Tailwind 4 · GSAP · Lenis. Builds to a
fully static export, so it deploys anywhere with no server runtime.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site → out/
npm run typecheck
```

## Changing the copy

**All site text lives in [`src/content.ts`](src/content.ts).** Editing a
sentence should never mean opening a component. The copy there is deliberately
abstract — it sets a tone without committing to claims about the product.

## The hero

The wordmark is a dot-matrix field on canvas ([`src/lib/dither.ts`](src/lib/dither.ts),
[`src/components/DitherField.tsx`](src/components/DitherField.tsx)). Cells are
lit by the wordmark mask, a cursor-following light, and a faint ambient floor,
then quantised through a 4×4 Bayer ordered dither — that last step is what gives
the crosshatch texture rather than smooth grey.

Two things to know before changing it:

- **The light reveals the mask, it doesn't compete with it.** Mask cells hold a
  brightness floor everywhere and bloom where lit; bare cells barely catch the
  light. Flatten that asymmetry and the letterforms wash out inside the halo.
- **Grid pitch is driven by the wordmark, not the screen** (`spacingFor`). Letters
  need ~10 cells across to resolve, so narrow viewports get a *finer* grid. A
  cell budget coarsens the grid on large displays.

Cells are bucketed by brightness and drawn bucket by bucket, so a frame costs
8 `fillStyle` assignments instead of one per cell.

`prefers-reduced-motion` is honoured throughout: the field renders a single
static resolved frame with no animation loop, and Lenis smooth scrolling is
disabled.

## Wiring up the waitlist

[`src/lib/waitlist.ts`](src/lib/waitlist.ts) is a stub — it resolves after a
delay and stores nothing. Replace the body of `submitWaitlist` with a `fetch` to
Formspree, Resend, or your own endpoint; the UI already handles the loading,
success and error states, so no component changes are needed.

Since this is a static export, anything needing a secret key must go through a
hosted form service or a serverless function. Never inline a key in that file —
it ships to the browser.

## Not done yet

Real product copy, a logo lockup, analytics, and OG images. `site.url` in
`src/content.ts` is a placeholder — set it once the domain is live, or OG and
canonical URLs won't resolve.
