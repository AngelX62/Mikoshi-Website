"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import { hero, nav } from "@/content";

/** Shared static navigation. Below md it gets its own row; links have 44px hit areas. */
/**
 * Prefetch is off on every internal link.
 *
 * **It used to be off to dodge a bug, and that bug no longer applies.** Under
 * `output: "export"` Next 16 asked for each link's RSC payload at a path the
 * export did not write, so the nav's four links produced four 404s on every
 * page load: the client requested
 * `/technology/__next.technology.__PAGE__.txt` while the export contained
 * `/technology/__next.technology/__PAGE__.txt`. The static export is gone, for
 * reasons that have nothing to do with this, so that mismatch is gone with it.
 *
 * It stays off on the other half of the original reasoning, which was never
 * about the bug. Five routes, every one a few kilobytes of prerendered HTML on
 * the same host, and the saving prefetch is meant to buy is not measurable
 * against that. Turn it on if the site grows a page heavy enough to want it.
 */
const NAV_PREFETCH = false;

export default function Header() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  /** Publish the measured height for any layout that needs it. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /**
     * `ceil` plus one, and the plus one is not padding.
     *
     * **`100svh` can resolve larger than `innerHeight`.** Measured at 1680x1050
     * on a 1.25 dpr display: the card's computed `min-height` came out 980.4
     * against a `calc(100svh - 70px)` that should give 980, because the browser
     * rounds the viewport to whole device pixels and back, 1050 x 1.25 = 1312.5,
     * up to 1313, back to 1050.4. So `svh` overshoots by up to 0.4px on any
     * fractional-dpr display.
     *
     * An older header absorbed that by accident. It measured 71.3 and published
     * 72, so `ceil` left 0.7px of overhead and the overshoot fitted inside it.
     * The drawn wordmark took the header to 69.8, `ceil` left 0.2, and the card
     * ended 0.2px past the fold: the one direction the whole publishing
     * mechanism exists to prevent. At 76.8 `ceil` leaves 0.2 again, so this is
     * not a fixed problem, it is a problem that recurs at every header height
     * whose fraction happens to be small.
     *
     * Adding a pixel makes the overhead [1, 2) instead of [0, 1), which covers a
     * sub-pixel overshoot at any header height rather than at the heights that
     * happened to round favourably. It costs up to 2px of card, which is the
     * harmless direction: short can never put a scrollbar on the page.
     */
    const publish = () => {
      const h = Math.ceil(el.getBoundingClientRect().height) + 1;
      document.documentElement.style.setProperty("--header-h", `${h}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      // Hand it back to the stylesheet rather than leaving a stale inline value.
      document.documentElement.style.removeProperty("--header-h");
    };
  }, []);

  return (
    <header
      ref={ref}
      className="relative z-30 w-full border-b border-rule bg-ground"
    >
      {/* `track` is the site's one content edge. See globals.css. */}
      <div className="track flex flex-col items-center gap-3 py-6 md:flex-row md:justify-between md:gap-8">
        <Link
          href="/"
          prefetch={NAV_PREFETCH}
          aria-label={`${hero.wordmark}, home`}
          // `text-ink hover:text-accent` still drives the logo, because it fills
          // and strokes in `currentColor`. That is the whole reason the paths are
          // inlined rather than loaded as an image.
          className="-my-1 block py-2 text-ink transition-colors duration-300 hover:text-accent"
        >
          {/* A larger wordmark balances the new hero and readable navigation. */}
          <Logo size={20} />
        </Link>

        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] leading-none tracking-[0.06em] sm:gap-x-7 sm:text-xs sm:tracking-[0.08em] lg:text-sm">
            {nav.map((item) => {
              // `startsWith` rather than equality: `trailingSlash` is on, so
              // every route resolves to a path with a trailing slash and a
              // strict compare against the href would never match.
              const on = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    // See the note on NAV_PREFETCH below.
                    prefetch={NAV_PREFETCH}
                    aria-current={on ? "page" : undefined}
                    className={`flex min-h-11 items-center py-2 transition-colors duration-300 hover:text-accent ${
                      on ? "text-ink" : "text-ink-dim"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
