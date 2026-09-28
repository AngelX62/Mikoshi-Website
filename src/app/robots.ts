import type { MetadataRoute } from "next";

/**
 * Crawlable, and deliberately so while the site is unlisted.
 *
 * ── THAT SENTENCE LOOKS BACKWARDS AND IS NOT ────────────────────────────────
 * The site is kept out of search results by `robots: { index: false }` in
 * layout.tsx, which emits `<meta name="robots" content="noindex, nofollow">` on
 * every route. **A crawler can only obey a tag it is allowed to fetch.**
 *
 * robots.txt governs crawling. `noindex` governs indexing. They are different
 * controls and the obvious combination defeats itself: `disallow: "/"` stops the
 * crawler at the door, so it never reads the `noindex`, and a URL discovered
 * from an external link can still be listed as a bare address with no
 * description and no way to ask for it back. Google documents this directly.
 * Blocking is for pages you do not want fetched; `noindex` is for pages you do
 * not want listed, and this site wants the second.
 *
 * **So do not "fix" this to `disallow: "/"`.** The README recommended exactly
 * that for a while and it was wrong.
 *
 * ── THE SITEMAP LINE IS GONE ON PURPOSE ─────────────────────────────────────
 * sitemap.ts is untouched and still answers, because it is needed the day
 * indexing is switched on. It is simply not announced here: pointing a crawler
 * at a manifest of five URLs while asking it to list none of them is the site
 * working against itself.
 *
 * **Restore this line and delete the `robots` key in layout.tsx** to go listed.
 * That pair of edits is the whole reversal.
 *
 * `/api/` stays excluded either way. It holds one POST route that answers
 * nothing useful to a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
  };
}
