import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Martian_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { launch, site } from "@/content";
import "./launch.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--font-bricolage", display: "swap",
});
const mono = Martian_Mono({
  subsets: ["latin"], weight: ["400"], variable: "--font-martian-mono", display: "swap",
});
const title = `${site.name} · ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s · ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
  openGraph: { title, description: site.description, url: site.url, siteName: site.name, type: "website" },
  twitter: { card: "summary", title, description: site.description },
};
export const viewport: Viewport = { colorScheme: "light", themeColor: "#f1eee8" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <a className="launch-skip" href="#main-content">{launch.skip}</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
