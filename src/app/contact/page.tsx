import Link from "next/link";
import Band from "@/components/Band";
import Footer from "@/components/Footer";
import SubscribeForm from "@/components/SubscribeForm";
import { waitlist } from "@/content";
import { routeMetadata } from "@/lib/metadata";
import { sheetOf } from "@/lib/sheet";

export const metadata = routeMetadata({
  title: "Contact",
  description: waitlist.body,
  path: "/contact/",
});

/**
 * Contact: the commercial door, and one of two on the site.
 *
 * The other is the band at the foot of home, which asks engineers who want to
 * follow the work for an address and opens no conversation at all. Same
 * construction, different room. See `updates` in content.ts.
 *
 * **The mailto beside the form is gone.** It printed an address on a domain the
 * project does not own, so the one alternative offered to somebody who would
 * rather write than fill in a field went nowhere. The form delivers now, which
 * is the better fix than a second path that does not. Put it back the moment an
 * address actually receives mail, and put back the Contact pair in the colophon
 * at the same time.
 *
 * **It was the thinnest page on the site and it is the page that has to convert.**
 * Measured: a heading, one line of body, two fields, and a colophon taking about
 * 40% of the route. It asked a stranger to describe a production cell and said
 * nothing about where that goes or whether anybody would read it.
 *
 * Two sentences fix that, and neither is decoration. One says what happens after
 * the button, one points at the terms. **Each sits in the column that raises
 * it**, which is a composition decision as much as an editorial one: the band's
 * two columns used to end at about the same depth, and adding both to the copy
 * side would have tipped it. One each keeps them level.
 *
 * They are `text-sm text-ink-dim` against the body's `text-lg text-ink-soft`, so
 * the band reads heading, then ask, then the terms of the ask. Two short
 * paragraphs, not a labelled block and not a list, because rule one in
 * content.ts has already decided that argument.
 *
 * A halftone field was considered here and declined, on the grounds that this
 * band is a two-column grid that fills, so a picture behind a form would be
 * decoration competing with the one thing on the page that has a job. That
 * reasoning outlived the field itself: it is gone from every route now, for a
 * version of the same argument. See the note in Band.tsx.
 */
export default function Contact() {
  return (
    <main className="flex flex-1 flex-col">
      <Band size="tall" strip={{ left: waitlist.label, right: sheetOf("/contact") }}>
        <div className="grid gap-x-16 gap-y-14 md:grid-cols-12">
          <div className="md:col-span-6">
            {/* 1.02, because this heading sets two lines at every width and the
                two must not touch. The value is face-specific and was re-measured
                for Archivo and again for Bricolage; the
                one it replaced was derived for Bodoni, which is not in the
                build any more. See globals.css. */}
            <h1 className="display reveal text-[clamp(2rem,3.9vw,3.5rem)] leading-[1.06] text-ink">
              {waitlist.heading}
            </h1>
            <p className="reveal mt-8 max-w-[30rem] text-lg leading-relaxed text-ink-soft">
              {waitlist.body}
            </p>
            {/*
              The two roles, dimmer than the first ask.

              The heading and `body` speak to one reader, somebody who has
              trained models and can say where the idea breaks. This names the
              two roles the brief says come first, and it is set a step back so
              the column still opens on one clear invitation rather than on a
              list of audiences.

              A research programme needs adversaries more than it needs
              customers, which is why "skeptical is useful" is in the copy at
              all. See content.ts.
            */}
            <p
              className="reveal mt-6 max-w-[30rem] text-lg leading-relaxed text-ink-soft"
              style={{ animationDelay: "120ms" }}
            >
              {waitlist.bodyMore}
            </p>

            {/*
              The stop conditions, under the ask that raises them.

              Set below the body and dimmer than it, so the column reads as the
              ask and then the terms of the ask rather than as two paragraphs of
              equal weight. The link is the sentence's whole purpose: somebody
              being invited to attack the method should be shown where we have
              already said it would fail, and that lives on another route where a
              reader hesitating over the form has not been.
            */}
            <p
              className="reveal mt-10 max-w-[26rem] text-sm leading-relaxed text-ink-dim"
              style={{ animationDelay: "160ms" }}
            >
              {waitlist.dataLead}
              <Link
                href="/evidence"
                prefetch={false}
                className="inline-flex min-h-6 items-center text-ink-dim underline decoration-rule underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
              >
                {waitlist.dataLink}
              </Link>
            </p>
          </div>

          <div className="md:col-span-6">
            <SubscribeForm
              source="contact"
              copy={waitlist}
              withCell
              idPrefix="waitlist"
            />

            {/*
              What happens after the button, directly under the button.

              It is the question pressing submit raises, so it belongs here and
              not in the copy column. It also lands the two columns at roughly
              the same depth, which the band did not do before: the left column
              gains the data sentence and the right gains this one.
            */}
            <p
              className="reveal mt-10 max-w-[26rem] text-sm leading-relaxed text-ink-dim"
              style={{ animationDelay: "160ms" }}
            >
              {waitlist.afterSending}
            </p>

            {/*
              Where the address goes, under the field that takes it.

              Set in the qualifier width and the dimmest ink that is still text,
              which is the register globals.css reserves for a limit on what is
              above it. That is exactly what this is: the form asks, and this
              says what the asking costs the reader.

              It is the last thing in the column on purpose. A disclosure placed
              above the button is an obstacle; placed under it, it is the answer
              to the question pressing the button raises, next to
              `afterSending`, which answers the other half.
            */}
            <p className="qualifier reveal mt-6 max-w-[26rem] border-t border-rule pt-6 text-sm leading-relaxed text-ink-dim">
              {waitlist.dataNote}
            </p>
          </div>
        </div>
      </Band>

      <Footer />
    </main>
  );
}
