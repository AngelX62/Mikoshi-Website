import Link from "next/link";
import Band from "@/components/Band";
import Cells from "@/components/Cells";
import Footer from "@/components/Footer";
import { vision } from "@/content";
import { routeMetadata } from "@/lib/metadata";
import { sheetOf } from "@/lib/sheet";

export const metadata = routeMetadata({
  title: "Vision",
  description: vision.metaDescription,
  path: "/vision/",
});

/**
 * Vision: why training efficiency is worth a company.
 *
 * **The page is short and that is the composition, not a gap.** Two paragraphs,
 * a mission and a limit is what a vision page has to say once the question is
 * argued on /research and the standard is argued on /evidence. Anything added
 * here to make it feel longer would be filling a page rather than making a
 * point, which is rule one in content.ts.
 *
 * **Short still stands; the half-empty frames did not.** The 2026-09-28 layout
 * pass added nothing to this page. It moved what was here so neither band has
 * a column standing empty beside a full one: the opening pair became two ruled
 * cells under the headline, and the mission statement spans its band over the
 * two halves of what follows it.
 *
 * **`limits` is the reason this route is not just optimism.** "Efficiency"
 * invites three claims Afterscale cannot make, and a reader will make all three
 * unprompted. The page states the ambition and then says plainly what the
 * ambition would not establish, which is the opposite of how a vision page
 * usually closes and the only reason to believe the rest of it.
 */
export default function Vision() {
  return (
    <main className="flex flex-1 flex-col">
      <Band strip={{ left: vision.label, right: sheetOf("/vision") }}>
        {/*
          Three hand-set lines. The break falls after "Powerful AI" and after
          "within reach of", so the last line carries the point and no line ends
          on a preposition looking for its object.

          `aria-label` carries the joined sentence, because three `block` spans
          are three lines to a screen reader and one sentence to everyone else.
        */}
        <h1
          aria-label={vision.heading.join(" ")}
          className="display reveal max-w-[72rem] text-[clamp(2rem,3.9vw,3.5rem)] leading-[1.06] text-ink"
        >
          {vision.heading.map((line) => (
            <span key={line} aria-hidden="true" className="block">
              {line}
            </span>
          ))}
        </h1>

        {/*
          ── TWO CELLS, AND THEY POINT IN OPPOSITE DIRECTIONS ───────────────────
          The first paragraph is the access argument, which is the one people
          find sympathetic. The second is the frontier argument, which is the one
          that makes this a research problem rather than a charitable one. A
          method that only helped small teams would be a good thing and a weak
          thesis, so the two are set at the same weight and the same width.

          They were offset to opposite edges of the frame, six columns and five,
          with a 216px gutter between them at 1440: two statements, but so far
          apart that the pair stopped reading as a pair. A ruled pair keeps them
          separate with a line instead of a gap, so they read as the two sides
          of one argument. See `.cells` in globals.css.
        */}
        <Cells
          cols={2}
          md={2}
          lead
          className="reveal mt-14 md:mt-20"
          style={{ animationDelay: "240ms" }}
          items={vision.paragraphs.map((paragraph) => ({
            key: paragraph,
            body: paragraph,
          }))}
        />

      </Band>

      {/*
        The mission, and the site's established split between a label and a
        heading: `label` goes on the strip, the claim is the h2. A band whose h2
        read "Our mission" would spend the largest type in the frame on a filing
        category.

        No `titled`, because this h2 is visible. The strip's "Our mission" names
        the section on its own. See Band.tsx.
      */}
      {/*
        ── THE STATEMENT OVER ITS TWO HALVES, NOT BESIDE THEM ──────────────────
        The mission statement had seven columns to itself and set two lines;
        the paragraphs, the limit and the link stacked in the other five. At
        1440 that left the left column empty for about 350px, the worst dead
        zone the 2026-09-28 layout pass measured on the site.

        The statement spans the frame now, and the two halves of what follows
        sit side by side under it: what we do and aim for on the left, what it
        would not establish on the right. The limit gets a column of its own
        rather than the foot of someone else's, which is the rank it has
        been argued up to in the note below.
      */}
      <Band tone="tint" strip={{ left: vision.mission.label }}>
        <h2 className="display max-w-[56rem] text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.14] text-ink">
          {vision.mission.statement}
        </h2>

        <div className="mt-12 grid gap-x-16 gap-y-10 md:mt-16 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            {vision.mission.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-[34rem] text-lg leading-relaxed text-ink-soft"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex flex-col">
            {/*
              ── WHAT THIS WOULD NOT ESTABLISH ─────────────────────────────────
              **Do not delete this and do not soften it.** Cheaper training
              implies cheaper inference and lower energy use to almost every
              reader, and neither has been measured by anybody here. A site that
              lets a reader make those inferences unchallenged has overclaimed by
              omission, which is the only kind of overclaiming that is hard to
              catch in review.

              ── IT CARRIED THREE DEMOTIONS AND ONLY ONE WAS EARNED ────────────
              It was `text-sm`, `text-ink-dim` and the qualifier width, under a
              rule, at the foot of the column: the rarest paragraph on the route
              set as the smallest and faintest thing on it. A limit a reader
              cannot see is a limit that was not stated.

              The narrowed width stays, because that is the site's register for
              a sentence that qualifies rather than claims and it says so before
              a word is read. The size and the ink come back up, and the bracket
              replaces the hairline: this is a claim under test, which is what
              the rose means, and one separator is enough. A grey rule above a
              rose rule down the side would also have set the text 20px in from
              a line spanning the full column.
            */}
            <p className="qualifier under-test max-w-[34rem] text-lg leading-relaxed text-ink-soft">
              {vision.limits}
            </p>

            {/*
              The page's one action, at the foot rather than repeated at the top:
              this page has to state its ambition before it is entitled to ask
              for anything.

              **`pt-2` is a hit target, not spacing.** 10px type with
              `leading-none` over an 8px `pb-2` and a hairline measures 19px
              tall, under the 24px WCAG 2.5.8 floor the nav links were raised to.
              Padding the top rather than the bottom buys the 8px without moving
              the underline off the baseline it belongs on. `mt-10` is the 40px
              the column's `gap-6` and the old `mt-4` added up to, now that the
              link shares a column only with the limit.
            */}
            <Link
              href="/contact"
              prefetch={false}
              className="group mt-10 inline-flex items-center gap-3 self-start border-b border-ink-faint pb-2 pt-2 font-mono text-[11px] uppercase leading-none tracking-[0.22em] text-ink transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              {vision.cta}
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </Band>

      <Footer />
    </main>
  );
}
