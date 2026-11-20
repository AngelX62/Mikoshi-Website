import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import { launch, site } from "@/content";
import { previewHref, reviewRoot } from "../_copy";
import { SplitLens } from "./SplitLens";
import "./lens.css";

const lens = {
  name: "Split Lens",
  category: "AI-native compute cloud",
  question: "When a customer’s model goes quiet, can we spend less keeping it ready without making the next person wait longer?",
  updates: "Launch updates",
  compare: "Compare previews",
} as const;

export const metadata: Metadata = { title: lens.name };

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20">
    <path d={diagonal ? "M5 15 15 5M6 5h9v9" : "M2 10h15m-6-6 6 6-6 6"} fill="none" stroke="currentColor" strokeWidth="1.45" />
  </svg>;
}

export default function LensHome() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <div className="lens-page">
    <header className="lens-mast">
      <a className="lens-brand" href="/design-review/lens/" aria-label={site.name + ", home"}><Logo size="1.1rem" accent /></a>
      <span className="lens-status">{launch.status}</span>
    </header>
    <main className="lens-main" id="main-content" tabIndex={-1}>
      <div className="lens-copy">
        <p className="lens-category">{lens.category}</p>
        <h1>{launch.headline.map((part,i) => <span key={part}>{i > 0 ? " " : ""}{part}</span>)}</h1>
        <p className="lens-question">{lens.question}</p>
        <a className="lens-primary" href={previewHref("paper","research")}><span>{launch.focusLink}</span><Arrow /></a>
      </div>
      <div className="lens-art" aria-hidden="true"><SplitLens /></div>
    </main>
    <footer className="lens-foot">
      <a href={previewHref("paper") + "#updates"}>{lens.updates}<Arrow diagonal /></a>
      <a href={reviewRoot}>{lens.compare}</a>
    </footer>
  </div>;
}
