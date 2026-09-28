import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { site } from "@/content";

/**
 * The preview card, named explicitly because declaring `openGraph` here breaks
 * the file convention that used to supply it.
 *
 * `src/app/opengraph-image.png` is attached to the root segment and Next hands
 * it to every route **that has not declared an `openGraph` object of its own**.
 * These routes now do, to say their own title, and the first version of this
 * helper therefore shipped four routes with a correct title and **no image at
 * all**, which is a different way of being wrong about the same tag. Caught by
 * grepping the rendered HTML rather than by reasoning about it.
 *
 * The hashed query Next appends is a cache-buster, not part of the route: the
 * plain path serves the same 1200x630 PNG, verified 200 image/png.
 *
 * The dimensions are stated because a card without them makes some clients
 * fetch the image before they can lay the card out, and one of them is 400KB.
 */
const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  /**
   * Read from the file the root route already uses, so the description of the
   * picture cannot drift from the picture in one place and not the other.
   *
   * `readFileSync` at module scope is safe here and only here: this module is
   * imported by `generateMetadata`-equivalent exports on statically prerendered
   * pages, so it runs at build time on the server and never reaches a bundle.
   */
  alt: readFileSync(
    join(process.cwd(), "src/app/opengraph-image.alt.txt"),
    "utf8",
  ).trim(),
} as const;

/**
 * A route's metadata, built once so four pages cannot describe themselves four
 * different ways.
 *
 * ── EVERY ROUTE'S SOCIAL CARD ADVERTISED THE HOME PAGE ───────────────────────
 * The four routes each exported `{ title, description }` and nothing else, and
 * `layout.tsx` exported a full `openGraph` object. **Next merges `openGraph` as
 * a whole object from the nearest ancestor that declares one, and does not
 * backfill it from a child's `title` or `description`.** So every route emitted
 * home's card:
 *
 *     <meta property="og:title" content="MIKOSHI · Machines that learn by ...">
 *     <meta property="og:description" content="MIKOSHI is building software ...">
 *     <meta property="og:url" content="https://.../">
 *
 * Pasted into Slack, LinkedIn or a mail client, /vision, /technology,
 * /first-proof and /contact were all indistinguishable from home. That is the
 * exact failure `content.ts` created its per-route `metaDescription` fields to
 * prevent, and those fields were reaching `<meta name="description">` and
 * stopping there.
 *
 * **`og:url` was the worse half.** Pointing every route at `/` tells any
 * platform that honours it that /technology *is* the home page, so a share of a
 * deep link collapses onto the front door and its engagement goes with it.
 *
 * ── AND NOTHING DECLARED A CANONICAL ─────────────────────────────────────────
 * There was no `<link rel="canonical">` anywhere on the site. With
 * `trailingSlash: true` both `/vision` and `/vision/` answer, and a Vercel
 * deployment is reachable on its own hostname as well as on the production
 * alias, so the same page had several honest addresses and no stated preferred
 * one. `alternates.canonical` is relative here and `metadataBase` resolves it,
 * which means it follows `NEXT_PUBLIC_SITE_URL` rather than being written down
 * twice. See `resolveSiteUrl` in content.ts.
 *
 * **`path` must carry its trailing slash**, matching `trailingSlash: true` and
 * `sitemap.ts`. A canonical without one names a URL that redirects, which is a
 * canonical pointing at a 308.
 *
 * Home does not use this: `layout.tsx` owns the root metadata, and a route that
 * called this with "/" would restate what the layout already says.
 */
export function routeMetadata({
  title,
  description,
  path,
}: {
  /** The route's own title, without the site suffix. `layout.tsx` templates it. */
  title: string;
  /** The route's `metaDescription` from content.ts. One string, three tags. */
  description: string;
  /** Absolute path with a trailing slash, e.g. `/vision/`. */
  path: `/${string}/`;
}): Metadata {
  // The title as it appears in a card, where there is no template to apply it.
  const full = `${title} · ${site.name}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: full,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description,
      images: [OG_IMAGE],
    },
  };
}
