"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hero, nav } from "@/content";

/**
 * The site's one navigation, repeated in the footer.
 *
 * **Static, not sticky.** A sticky header on this site would have to invert
 * every time a plate band passed under it, which is either a scroll listener
 * watching for band boundaries or a header that goes illegible over half the
 * page. No route is long enough to earn that: the longest is the vision at
 * roughly three screens, and the footer carries the same nav for anyone who
 * gets to the bottom of it.
 *
 * Home is not in the list. The wordmark goes there, which is the convention
 * every visitor already knows, and it lets the wordmark carry the one piece of
 * information a header always owes: where you are.
 *
 * Below `sm` the nav drops to its own centred row. Four items in tracked mono
 * caps do not fit beside a wordmark at 390, and shrinking the tracking to make
 * them fit would take the chrome out of the one register it holds everywhere
 * else on the site.
 */
/**
 * Prefetch is off on every internal link, and it has to be.
 *
 * Next 16 prefetches an RSC payload per link, and under `output: "export"` it
 * asks for that payload at a path it did not write. The nav's four links
 * produced four 404s on every single page load, measured: the client requests
 * `/technology/__next.technology.__PAGE__.txt` while the export contains
 * `/technology/__next.technology/__PAGE__.txt`. Navigation still worked, since
 * a failed prefetch falls back to a full load, so the only symptom was a
 * console full of errors on a site whose whole pitch is engineering judgement.
 *
 * Turning it off is not a workaround here, it is the right setting. Five static
 * routes, every one a few kilobytes of HTML already on the same host, and the
 * saving prefetch is meant to buy is not measurable against that. Revisit if a
 * future Next fixes the path and the site has grown pages worth prefetching.
 */
const NAV_PREFETCH = false;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="relative z-30 w-full border-b border-rule bg-ground">
      <div className="mx-auto flex w-full max-w-[86rem] flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between sm:gap-8 md:px-10 lg:px-16">
        <Link
          href="/"
          prefetch={NAV_PREFETCH}
          aria-label={`${hero.wordmark}, home`}
          className="wordmark text-[15px] text-ink transition-colors duration-300 hover:text-accent"
        >
          {hero.wordmark}
        </Link>

        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase leading-none tracking-[0.18em] sm:gap-x-7 sm:tracking-[0.22em]">
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
                    className={`transition-colors duration-300 hover:text-accent ${
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
