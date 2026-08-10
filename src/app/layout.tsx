import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { site } from "@/content";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Grain from "@/components/Grain";
import Instrument from "@/components/Instrument";
import ScrollRail from "@/components/ScrollRail";
import Vignette from "@/components/Vignette";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * IBM Plex, self-hosted at build time by next/font so the static export carries
 * no third-party font requests.
 *
 * Weight 600 is not optional: sampleTextMask draws the hero wordmark at
 * `600 ${size}px`, and without the real cut the browser synthesises a bold that
 * turns to mush once it is reduced to dots.
 */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
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

export const viewport: Viewport = {
  // Both grounds, so the browser chrome matches whichever one is on rather
  // than framing a near-white page in black.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ece8e0" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Stamps `data-theme` before the first paint. This is a static export,
          so nothing on a server can decide the ground: without this the page
          paints black and then swaps to near-white once React hydrates, which
          is a full-viewport flash on every load for anyone who chose light.
          Render-blocking on purpose, and tiny. See lib/theme.ts.

          `THEME_BOOT_SCRIPT` is a module constant assembled entirely from
          string literals at build time. Nothing from a request, a URL, a store
          or a user reaches it, so there is no interpolation point to inject
          into. The value it *reads* at runtime, `localStorage`, never leaves
          the script: it is compared against two literals and discarded unless
          it matches one of them.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-ground antialiased">
        <SmoothScroll />
        {children}
        {/* Sits above the field and below the copy. Mounted here rather than
            per section because it is one fixed coordinate space shared with the
            canvas, not a decoration each section owns. */}
        <Instrument />
        <Vignette />
        <ScrollRail />
        <Grain />
        <Cursor />
      </body>
    </html>
  );
}
