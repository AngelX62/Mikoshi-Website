import { footer, site, waitlist as waitlistCopy } from "@/content";
import Waitlist from "./Waitlist";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-edge bg-void px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          {waitlistCopy.label}
        </span>

        <div className="flex flex-col justify-between gap-16 md:flex-row md:gap-12">
          <Waitlist />

          <div className="flex flex-col items-start gap-6 md:items-end">
            <div
              aria-hidden="true"
              className="font-mono text-sm uppercase tracking-[0.34em] text-ink-soft"
            >
              {site.name}
            </div>

            <a
              href={`mailto:${footer.email}`}
              className="text-sm text-ink-dim underline-offset-4 transition-colors duration-300 hover:text-accent hover:underline"
            >
              {footer.email}
            </a>

            {footer.links.length > 0 && (
              <nav className="flex gap-6">
                {footer.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim transition-colors duration-300 hover:text-accent"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-2 border-t border-edge pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint md:flex-row md:justify-between">
          <span>{footer.copyright}</span>
          <span>{site.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
