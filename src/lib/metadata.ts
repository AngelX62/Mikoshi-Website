import type { Metadata } from "next";
import { site } from "@/content";

/** Prelaunch shares are text-only. Never advertise an old training result or a raster preview. */
export function routeMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: `/${string}/`;
}): Metadata {
  const full = `${title} · ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: full, description, url: path, siteName: site.name, type: "website" },
    twitter: { card: "summary", title: full, description },
  };
}
