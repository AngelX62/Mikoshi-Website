import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "./journal.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return <div className="ar-scope">{children}</div>;
}
