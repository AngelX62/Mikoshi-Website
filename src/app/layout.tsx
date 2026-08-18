import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { site } from "@/content";
import Header from "@/components/Header";
import Grain from "@/components/Grain";
import "./globals.css";

/**
 * Archivo, variable on both weight and width.
 *
 * `axes: ["wdth"]` is not optional. next/font ships only the default axes
 * unless the others are asked for by name, and the width axis is the whole
 * reason this family was chosen: the wordmark is set at `wdth` 125 and the body
 * copy at 100, so one family does the job a display face and a text face would
 * otherwise split between them. Without the axis the wordmark silently sets at
 * normal width and the site loses its one typographic signature.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: TITLE,
    template: `%s · ${site.name}`,
  },
  description: site.description,
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
 * chances for it to drift. It is static rather than sticky: a sticky header
 * would have to invert every time a plate band passed under it, and no route is
 * long enough to need it.
 *
 * **The footer is composed by each route instead**, because home must not
 * scroll and a full colophon under a full-screen lockup would put it below the
 * fold, which is the one thing this rebuild exists to stop. Home ends on a
 * single-line strip of its own; the other four end on `Footer`. Four repeated
 * imports is a smaller price than a layout that reads the current route to
 * decide what to render, and it keeps every page a server component.
 *
 * `min-h-screen` with `flex-1` on the content is what lets home centre itself
 * in exactly the height the header leaves behind.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${martianMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-ground antialiased">
        <Header />
        {children}
        <Grain />
      </body>
    </html>
  );
}
