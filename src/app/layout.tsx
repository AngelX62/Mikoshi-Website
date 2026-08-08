import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { site } from "@/content";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Grain from "@/components/Grain";
import Instrument from "@/components/Instrument";
import ScrollRail from "@/components/ScrollRail";
import Vignette from "@/components/Vignette";
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
  themeColor: "#000000",
  colorScheme: "dark",
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
      <body className="bg-void antialiased">
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
