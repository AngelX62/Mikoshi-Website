import { footer, site, waitlist as waitlistCopy } from "@/content";
import Reveal from "./Reveal";
import Waitlist from "./Waitlist";

export default function Footer() {
  return (
    <footer
      id="site-footer"
      className="relative z-10 border-t border-edge px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {waitlistCopy.label}
        </span>

        <Reveal className="flex flex-col justify-between gap-16 md:flex-row md:gap-12">
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
              className="text-sm text-ink-dim transition-colors duration-300 hover:text-accent"
            >
              <span className="swap">
                <span>{footer.email}</span>
                <span aria-hidden="true">{footer.email}</span>
              </span>
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
        </Reveal>

        <div className="mt-20 flex flex-col gap-2 border-t border-edge pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim md:flex-row md:justify-between">
          <span>{footer.copyright}</span>
          <span>{site.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
