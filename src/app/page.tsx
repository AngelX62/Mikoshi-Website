import Link from "next/link";
import Band from "@/components/Band";
import Cells from "@/components/Cells";
import Footer from "@/components/Footer";
import LivingHero from "@/components/LivingHero";
import SubscribeForm from "@/components/SubscribeForm";
import {
  evidence,
  hero,
  research,
  routes,
  standing,
  updates,
  vision,
  waitlist,
} from "@/content";
import "./home.css";

/** The mission and living illustration lead into the open research question. */
export default function Home() {
  /**
   * Counted, never typed.
   *
   * The figure at the head of the record has to agree with the rows beside it,
   * and the only way to guarantee that is to derive it. It also means the number
   * goes stale in the one honest direction: the day a dataset is chosen, the row
   * closes and the figure drops itself. See the note on `standing` in content.ts.
   */
  const openCount = standing.rows.filter((row) => row.open).length;

  return (
    <main className="flex flex-1 flex-col">
      <section className="home-hero" aria-labelledby="home-headline">
        <div className="home-hero__inner track">
          <div className="home-hero__copy">
            <h1 id="home-headline" className="display home-hero__headline" aria-label={hero.headline}>
              <span className="home-hero__full-headline">{hero.headline}</span>
              {hero.headlineLines.map((line) => (
                <span key={line} className="home-hero__line" aria-hidden="true">{line}</span>
              ))}
            </h1>
            <p className="home-hero__introduction">
              {hero.introduction}
            </p>
            <div className="home-hero__actions">
              <Link
                href="/research"
                prefetch={false}
                className="home-hero__link"
              >
                {hero.ctaResearch}
                <span aria-hidden="true">
                  &rarr;
                </span>
              </Link>
              <Link
                href="/contact"
                prefetch={false}
                className="home-hero__link"
              >
                {hero.ctaPartner}
                <span aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
            <p className="under-test home-hero__stage">{hero.stage}</p>
          </div>
          <LivingHero />
        </div>
      </section>

      {/*
        ── THE RECORD, PROMOTED OUT OF A SIDE COLUMN ──────────────────────────
        This was the right-hand column of the band below: 13px mono, below the
        fold, composed exactly like the spec table on any product site. It is the
        single most unusual block on the site, and a reader skimming for four
        seconds never reached it.

        **The problem it fixes is rank, not material.** Every rare sentence here
        was set smaller than the ordinary ones: this table at 13px, /vision's
        limit at 14px dim and narrowed, the stage and status lines at 10px, while
        the display sizes went to mission prose any lab could run. Nothing new is
        claimed by moving it. What moves is position and size.

        `titled` makes the strip's own label the band's `h2`, which is what it is
        for, so there is no second heading to write. See Band.tsx.
      */}
      <Band titled className="home-standing" strip={{ left: standing.label }}>
        {/*
          ── THE FIGURE STANDS OVER THE RECORD NOW, NOT BESIDE IT ─────────────
          It had the left three columns from `lg`, with the six rows as a ruled
          table in the other nine. The figure is two lines tall and the table is
          six rows, so the left column was empty for most of the band's depth,
          which is the dead-column problem the 2026-09-28 layout pass was about.
          See `.cells` in globals.css.

          The figure is the loud element, and it is a count rather than a
          sentence: a number is the one thing a four-second skim reliably reads.
          The open half takes the accent because that is exactly what the rose
          means, and the total stays quiet so the eye lands on what is unsettled
          rather than on the arithmetic.

          Hidden from the accessibility tree and replaced by the sentence beside
          it, because "4/6" announces as "four slash six".
        */}
        <span className="sr-only">
          {`${openCount} of ${standing.rows.length} ${standing.openLabel}`}
        </span>
        <div aria-hidden="true" className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <p className="display text-[clamp(2rem,3.9vw,3.5rem)] leading-none tracking-[-0.02em]">
            <span className="text-accent">{openCount}</span>
            <span className="text-ink-dim">/{standing.rows.length}</span>
          </p>
          <p className="font-mono text-[11px] uppercase leading-[1.6] tracking-[0.22em] text-ink-dim">
            {standing.openLabel}
          </p>
        </div>

        {/*
          Six decisions as six cells, three to a row from `lg` and two from
          `md`, so neither breakpoint leaves an orphan. The rose square and its
          shared gutter moved into Cells.tsx with them.

          **"Training-efficient intelligence" wraps below about 1440, and that
          is accepted.** It needs about 400px in 17px mono and a cell is 272 at
          1024. The table this replaced was widened a column to stop the same
          wrap, because there one wrapped row among five single lines read as a
          setting error. A cell is its own box, and it breaks cleanly at the
          hyphen.
        */}
        <Cells
          as="dl"
          face="data"
          cols={3}
          md={2}
          className="mt-10 md:mt-12"
          items={standing.rows.map((row) => ({
            key: row.item,
            label: row.item,
            title: row.value,
            open: row.open,
          }))}
        />
      </Band>

      {/*
        The question over its argument, rather than beside it.

        It was the claim in five columns on the left and the two paragraphs
        stacked in six on the right. The question is one line at 1440, so the
        left column was empty for about 150px under the status line, while the
        right one ran on. Now the question and its status take the full width,
        and the two paragraphs sit side by side under it at the same measure:
        what we want to know, then the failure we expect.
      */}
      <Band id="research-intro" className="home-research" strip={{ left: hero.researchLabel }}>
        <h2 className="display text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.14] text-ink">
          {research.heading}
        </h2>
        <p className="under-test mt-8 font-mono text-[11px] uppercase leading-[1.6] tracking-[0.22em] text-accent">
          {hero.status}
        </p>
        <div className="mt-10 grid gap-x-16 gap-y-5 text-lg leading-relaxed text-ink-soft md:grid-cols-2 md:mt-12">
          <p className="max-w-[34rem]">{hero.paragraphs[1]}</p>
          <p className="max-w-[34rem]">{research.paragraphs[2]}</p>
        </div>
      </Band>

      {/*
        ── THE REST OF THE ARGUMENT, AS A ROW ───────────────────────────────────
        Home used to end its argument at the question, with Vision and Evidence
        reachable only from the header. together.ai puts a panel of what is
        inside directly on its home page, and this is that job done with the
        site's own material: each cell is the page's own heading, over the
        sentence already written to describe it in `metaDescription`. **Nothing
        in it is new copy** except the strip's two words.

        Research is left out on purpose. The band above is its question, and
        the hero already links to it: a cell here would print "What should a
        model learn next?" twice on one page. Contact takes its place, under its
        own heading, which is the hero's second link word for word.

        On the tint, which is the site's one change of ground short of the
        footer. It stays light by decision: see the note on `.tint`.

        `titled`, because nothing in the band is a heading of its own: the cell
        titles are other pages' headings, quoted.
      */}
      <Band titled tone="tint" strip={{ left: routes.label }}>
        <Cells
          cols={3}
          md={3}
          underStrip
          items={[
            {
              key: "vision",
              label: "Vision",
              title: vision.heading.join(" "),
              body: vision.metaDescription,
              href: "/vision",
            },
            {
              key: "evidence",
              label: "Evidence",
              title: evidence.heading,
              body: evidence.metaDescription,
              href: "/evidence",
            },
            {
              key: "contact",
              label: "Contact",
              title: waitlist.heading,
              body: waitlist.body,
              href: "/contact",
            },
          ]}
        />
      </Band>

      <Band id="updates" strip={{ left: updates.label }}>
        <div className="grid gap-x-16 gap-y-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <h2 className="display text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.14] text-ink">
              {updates.heading}
            </h2>
            <p className="mt-8 max-w-[30rem] text-lg leading-relaxed text-ink-soft">
              {updates.body}
            </p>
          </div>
          <div className="md:col-span-6">
            <SubscribeForm source="home" copy={updates} idPrefix="updates" />
            {/* The same disclosure /contact carries, in the same register.
                Shorter, because this form asks for one field. See content.ts.

                It had its own `border-t` and `pt-6`, which put a second, shorter
                rule 116px under the field's. Two stacked hairlines under an
                input read as a second empty field. */}
            <p className="qualifier mt-6 max-w-[26rem] text-sm leading-relaxed text-ink-dim">
              {updates.dataNote}
            </p>
          </div>
        </div>
      </Band>
      <Footer />
    </main>
  );
}
