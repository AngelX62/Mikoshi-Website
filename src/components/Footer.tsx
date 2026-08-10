import { footer, site, waitlist as waitlistCopy } from "@/content";
import Wipe from "./Wipe";
import Waitlist from "./Waitlist";

export default function Footer() {
  return (
    <footer
      id="site-footer"
      // Same gutter as every section above it. The footer used to set its own
      // (`md:px-10`, centred on its own measure), which put its left edge in a
      // third place and made the last thing on the page the one block that did
      // not belong to the sheet.
      //
      // `ink-faint/40` rather than `border-edge`. Edge is #1e1b30, which is
      // 1.3% luminance against a black ground and disappears entirely under the
      // field's texture, so the page's last two rules were rules nobody could
      // see. The vision's loop directly above already uses `ink-faint` for the
      // same reason, and matching it ties the bottom of the page together.
      className="relative z-10 border-t border-ink-faint/40 px-6 py-20 md:py-28 md:pl-24 md:pr-10"
    >
      {/*
        Full width, like the vision's loop, and not `max-w-6xl`.

        The measure put the contact block at x 1248 on a 1920 screen: not beside
        the form, not at the page's right gutter where the rail and the loop's
        last verb sit, but at a third place that is simply where a 1152px
        container ran out. That is what made the space between the two columns
        read as 680px of dead frame rather than as composition — the gap is
        where the field re-condenses the wordmark, which is the closing image of
        the whole page and the one thing that should be allowed to occupy it.

        Spread to the same gutters as every other section, the block lands on
        the page's own right edge and the watermark gets the middle.
      */}
      <div>
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {waitlistCopy.label}
        </span>

        <Wipe stagger className="flex flex-col justify-between gap-16 md:flex-row md:gap-12">
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
        </Wipe>

        <div className="mt-20 flex flex-col gap-2 border-t border-ink-faint/40 pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim md:flex-row md:justify-between">
          <span>{footer.copyright}</span>
          <span>{site.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
