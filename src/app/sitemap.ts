import type { MetadataRoute } from "next";
import { nav, site } from "@/content";

/**
 * Five routes: home, plus the four in `nav`.
 *
 * Built from `nav` rather than typed out again, for the same reason the header
 * and the footer share it. A sixth route added to the nav appears here without
 * anybody remembering to come back, and a sitemap that has drifted from the
 * site is worse than none.
 *
 * Home is not in `nav` on purpose, since the wordmark goes there, so it is
 * added explicitly and given the higher priority.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${site.url}/`, lastModified: now, priority: 1 },
    ...nav.map((item) => ({
      url: `${site.url}${item.href}/`,
      lastModified: now,
      priority: 0.8,
    })),
  ];
}
