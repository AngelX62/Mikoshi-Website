import Band from "@/components/Band";
import Cells from "@/components/Cells";
import Footer from "@/components/Footer";
import { evidence } from "@/content";
import { routeMetadata } from "@/lib/metadata";
import { sheetOf } from "@/lib/sheet";

export const metadata = routeMetadata({
  title: "Evidence",
  description: evidence.metaDescription,
  path: "/evidence/",
});

/**
 * Evidence: what would count, what would make us stop, and what we would run.
 *
 * ── THIS ROUTE WAS `/first-proof` AND THE RENAME IS NOT COSMETIC ─────────────
 * "First proof" promises a proof. This page describes the conditions under which
 * one could exist, which is a different and more useful thing to put in front of
 * a reader who has been shown no results. Nothing was deployed under the old
 * path, so no inbound link breaks.
 *
 * **The order is the argument.** Here is the test. Here is what would make us
 * abandon the mechanism. Only then, here is what we would actually run. A page
 * that put the experiment first would be describing a plan; this one describes a
 * standard that the plan has to meet.
 *
 * `standard` gets the tint, which is the heaviest treatment the site has. A
 * research programme naming its own stop conditions in public, before running
 * anything, is rare enough that it does more for trust than any capability claim
 * available here. That is a pre-registration, and it is the reason this page
 * exists.
 */
export default function Evidence() {
  return (
    <main className="flex flex-1 flex-col">
      <Band strip={{ left: evidence.label, right: sheetOf("/evidence") }}>
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <h1 className="display reveal text-[clamp(2rem,3.9vw,3.5rem)] leading-[1.06] text-ink">
              {evidence.heading}
            </h1>

            {/* The primary test. A premise, so it leads and is set as one. */}
            <p
              className="reveal mt-10 max-w-[30rem] text-lg leading-relaxed text-ink md:text-xl md:leading-[1.5]"
              style={{ animationDelay: "160ms" }}
            >
              {evidence.paragraphs[0]}
            </p>
          </div>

          <div className="md:col-span-5 md:col-start-8">
            {/*
              ── THE ACCOUNTING, AND IT IS THE PARAGRAPH THAT DOES THE WORK ────
              Almost every efficiency result in this field is available by not
              charging the method for its own overhead. Saying in advance that
              scoring, probing, teaching and data generation all count against us
              is what makes the primary test mean anything, so it is set as a
              claim rather than as a caveat.
            */}
            <p
              className="reveal max-w-[34rem] text-lg leading-relaxed text-ink-soft"
              style={{ animationDelay: "280ms" }}
            >
              {evidence.paragraphs[1]}
            </p>

            {/*
              The statistics, as a note under a rule.

              `qualifier` narrows the sans to `wdth` 88. This sentence sets
              conditions on how a result is read rather than claiming one, and
              the width ladder in globals.css is how the site says that before a
              word is read.
            */}
            <p
              className="qualifier reveal mt-8 max-w-[34rem] border-t border-rule pt-6 text-sm leading-relaxed text-ink-dim"
              style={{ animationDelay: "400ms" }}
            >
              {evidence.paragraphs[2]}
            </p>
          </div>
        </div>
      </Band>

      {/*
        The stop conditions, on the tint.

        Three parts, because they do three different jobs. The concession is set
        largest: conceding the thing every reader is already suspicious of,
        before they have to raise it, is what buys the rest of the page. The
        paragraph beside it limits what a good early result would be allowed to
        mean. The falsification condition runs underneath, across the full
        width.

        ── IT WAS ONE COLUMN OF THREE, AND THE LEFT ONE WAS EMPTY ─────────────
        The concession sat alone in seven columns, one line tall, while the
        paragraph and the condition stacked in the other five. In the
        2026-09-28 screenshot at 1440, the left column was empty for about
        110px under the heading, beside a column still running. The condition names four separate ways to fail, so it is four
        cells now (see content.ts), and the top row holds only the two short
        parts, which are about the same height.
      */}
      <Band tone="tint" strip={{ left: evidence.standard.label }}>
        <div className="grid gap-x-16 gap-y-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            {/*
              ── SET AT THE PAGE'S OWN HEADING SCALE, NOT THE BAND'S ───────────
              It was the `h2` clamp, which put "We have shown nothing yet." a
              step under "Same budget, better model". That ranked a description
              of the test above the admission that nothing has passed it, and
              the admission is the sentence no competitor can print.

              Same element and same place in the outline: only the size and the
              leading move, to the values the `h1` above uses. It sets two lines
              at most widths, which is why the leading comes down with it.
            */}
            <h2 className="display text-[clamp(2rem,3.9vw,3.5rem)] leading-[1.06] text-ink">
              {evidence.standard.paragraphs[0]}
            </h2>
          </div>

          <p className="max-w-[34rem] text-lg leading-relaxed text-ink-soft md:col-span-5">
            {evidence.standard.paragraphs[1]}
          </p>
        </div>

        {/*
          ── THE ONE CONDITION THE MARGIN BRACKET EXISTS FOR ──────────────────
          This says how Afterscale could be shown to be on the wrong track.
          Nothing else on the site is under test in the way this is, so if the
          rose means anything at all it has to be here. The bracket goes on the
          lead-in, once for the band, and the four cells hang under it.

          **Do not soften it.** content.ts carries the same instruction, and the
          instruction is about the practice rather than the wording: a
          falsification condition that has been made comfortable is not one.
        */}
        <p className="display under-test mt-14 text-lg leading-relaxed text-ink md:mt-20 md:text-xl md:leading-[1.5]">
          {evidence.standard.lead}
        </p>
        <Cells
          cols={2}
          md={2}
          xl={4}
          className="mt-8"
          items={evidence.standard.conditions.map((condition) => ({
            key: condition,
            title: condition,
          }))}
        />
      </Band>

      {/*
        What would actually be run.

        Last, because a plan is only worth reading once the standard it has to
        meet has been stated. Three steps: the baseline, then the one thing being
        isolated, then the expansion that happens only if the isolation
        survives.

        ── THREE STEPS, NUMBERED, BECAUSE THEY ARE A SEQUENCE ──────────────────
        They were the first paragraph at 24px in seven columns and the other two
        stacked in five, stepping down in size and ink: a ranking. But the
        three are not ranked, they are ordered, and each depends on the one
        before it. So they are three cells in an `ol`, the one place on the site
        numbers are earned (see Cells.tsx). The step-down in commitment is in
        the words already: "first", "then", "if that is convincing".

        One column below `lg`, because a third of a 688px track is too narrow
        for a paragraph.

        **The words are untouched.** The second step names four baselines, and
        rule one in content.ts says prose should not enumerate where a list can.
        That rule is about copy that already has a list beside it; this has
        none, and breaking it into items would mean choosing where each one
        begins, which is rewriting rather than setting.
      */}
      <Band titled strip={{ left: evidence.plan.label }}>
        <Cells
          as="ol"
          cols={3}
          md={1}
          underStrip
          items={evidence.plan.paragraphs.map((paragraph, i) => ({
            key: paragraph,
            label: `Step ${["one", "two", "three"][i]}`,
            body: paragraph,
          }))}
        />
      </Band>

      <Footer />
    </main>
  );
}
