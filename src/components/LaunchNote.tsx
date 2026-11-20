import type { ReactNode } from "react";
import Link from "next/link";

type LaunchNoteProps = {
  label: string;
  heading: string;
  paragraphs: readonly string[];
  next?: { href: string; label: string };
  className?: string;
  children?: ReactNode;
};

/** One short editorial page. The root layout owns the header and footer. */
export default function LaunchNote({
  label,
  heading,
  paragraphs,
  next,
  className = "",
  children,
}: LaunchNoteProps) {
  return (
    <main id="main-content" className={`launch-shell launch-note ${className}`.trim()}>
      {/* Home's light gone cold: field and echoes, no warm core. See .trace. */}
      <div className="trace" aria-hidden="true">
        <div className="trace__cloud trace__cloud--1" />
        <div className="trace__cloud trace__cloud--2" />
        <div className="trace__cloud trace__cloud--3" />
        <div className="trace__cloud trace__ember" />
        <div className="exposure__blob trace__echo trace__echo--1" />
        <div className="exposure__blob trace__echo trace__echo--2" />
        <div className="trace__grain" />
      </div>
      <article aria-labelledby="page-heading">
        <header className="launch-note__header">
          <p className="launch-note__label">{label}</p>
          <h1 id="page-heading" className="display">{heading}</h1>
          <p className="launch-note__intro">{paragraphs[0]}</p>
        </header>

        {paragraphs.length > 1 ? (
          <div className="launch-note__section">
            {paragraphs.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {children}

        {next ? (
          <p className="launch-note__next">
            <Link href={next.href} prefetch={false}>
              {next.label}
            </Link>
          </p>
        ) : null}
      </article>
    </main>
  );
}
