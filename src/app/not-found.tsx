import Link from "next/link";
import Band from "@/components/Band";
import Footer from "@/components/Footer";
import { nav, site } from "@/content";

/**
 * The 404, and there was not one.
 *
 * ── WHAT A MISSING ROUTE USED TO LOOK LIKE ───────────────────────────────────
 * Next's built-in stub, rendered inside this site's `layout`. So the page came
 * out with **two `<title>` elements**, home's from the layout and "404: This
 * page could not be found." from the stub; an `h1` in Next's own inline styles,
 * which is neither of this site's faces; the site header above it; and no
 * `<main>`, no footer and no way out except the browser's back button.
 *
 * A wrong URL is a normal thing to arrive at from a stale link or a typed
 * address, and a site that answers it with a styled fragment of somebody else's
 * error page is a site that looks broken rather than one that lost a page.
 *
 * **It is composed exactly like every other route**, from `Band` and `Footer`,
 * which is the whole point: the reader should not be able to tell that this one
 * is an error state rather than a page. The nav is repeated in the copy because
 * the four destinations are the useful thing to offer somebody who asked for a
 * fifth, and because the header's own nav is 10px mono that a reader who has
 * just hit a dead end should not have to hunt for.
 *
 * **No `metadata` export, and that is not an omission.** `not-found.tsx` cannot
 * carry one. Next emits `<meta name="robots" content="noindex">` for it
 * automatically, which is the tag that actually matters here, and the title
 * falls back to the layout's. The competing stub title is gone with the stub.
 *
 * Not `titled` on the band: the `h1` is inside it.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <Band size="tall" strip={{ left: "Not found", right: "No such sheet" }}>
        <div className="grid gap-x-16 gap-y-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="display reveal text-[clamp(2rem,3.9vw,3.5rem)] leading-[1.06] text-ink">
              This page does not exist.
            </h1>

            <p
              className="reveal mt-8 max-w-[30rem] text-lg leading-relaxed text-ink-soft"
              style={{ animationDelay: "120ms" }}
            >
              The address you asked for is not part of this site. It may have
              been renamed, or the link that brought you here may be out of
              date.
            </p>

            {/*
              Two addresses are known to have moved and both are worth naming
              rather than leaving a reader to guess.

              `/technology` became `/research` because the page describes an open
              question rather than a technology anybody has, and `/first-proof`
              became `/evidence` because "first proof" promises a proof the page
              does not contain. The older `/deployment` is deliberately not
              listed: it is two renames back and nothing has linked to it for a
              long time. **Prune this list rather than growing it**, or the 404
              becomes a changelog.

              `qualifier` narrows the sans to `wdth` 88. This is a note about the
              site rather than a claim by it, which is what the width ladder in
              globals.css is for.
            */}
            <p
              className="qualifier reveal mt-6 max-w-[30rem] text-sm leading-relaxed text-ink-dim"
              style={{ animationDelay: "160ms" }}
            >
              Two pages moved with the change of direction: /technology is now{" "}
              <Link
                href="/research"
                prefetch={false}
                className="inline-flex min-h-6 items-center text-ink-dim underline decoration-rule underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
              >
                Research
              </Link>
              , and /first-proof is now{" "}
              <Link
                href="/evidence"
                prefetch={false}
                className="inline-flex min-h-6 items-center text-ink-dim underline decoration-rule underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
              >
                Evidence
              </Link>
              .
            </p>
          </div>

          {/*
            The four destinations, set as a record rather than as a nav.

            It is deliberately not a second `<nav>` landmark: the header and the
            footer already carry one each, and a third would make three lists of
            the same four links on one short page. These are content here, which
            is what a reader who has lost their way is actually being offered.
          */}
          <div className="md:col-span-4 md:col-start-9">
            <p className="font-mono text-[11px] uppercase leading-none tracking-[0.22em] text-ink-dim">
              {site.name}
            </p>
            <ul className="mt-6 border-t border-rule">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="group flex items-center justify-between gap-4 border-b border-rule py-4 text-lg text-ink transition-colors duration-300 hover:text-accent"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <Footer />
    </main>
  );
}
