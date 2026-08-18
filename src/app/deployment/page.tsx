import type { Metadata } from "next";
import Band from "@/components/Band";
import Footer from "@/components/Footer";
import { deployment, ownership } from "@/content";

export const metadata: Metadata = {
  title: "Deployment",
  description: deployment.body,
};

/**
 * Deployment: the first product, who pays for it, and what happens to the data.
 *
 * The order is the order a reader raises the questions. Here is the thing, here
 * is the commercial shape of it, here is what MIKOSHI may and may not do with
 * what you hand over. Ownership has no route of its own because read alone it
 * is a footnote hunting for the argument it belongs to. See content.ts.
 *
 * **The commercial pair is a diagram, not a list.** It reads integrator,
 * operates, the cell, paid for by, manufacturer, which is one sentence laid
 * across the frame in the order the eye takes it. Two facts about the same cell
 * from opposite sides. A key/value list cannot say "the same cell" and a row
 * can, which is the whole reason it is drawn.
 *
 * It is `aria-hidden` and `model.spoken` carries the same claim as one
 * sentence, because five labels and two rules read aloud in sequence is not a
 * sentence.
 */
export default function Deployment() {
  return (
    <main className="flex flex-1 flex-col">
      <Band size="tall" strip={{ left: deployment.label }}>
        <h1 className="reveal text-[clamp(2rem,5.4vw,4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-ink">
          {deployment.heading}
        </h1>
        <p className="reveal mt-8 max-w-[38rem] text-lg leading-relaxed text-ink-soft md:text-xl">
          {deployment.body}
        </p>
        {/* Set off by a rule rather than by the accent. The accent's one
            appearance on this page is the subject of the diagram below, and
            spending it twice would stop it meaning anything. */}
        <p className="reveal mt-10 max-w-[34rem] border-l border-ink-faint pl-5 text-base leading-relaxed text-ink md:text-lg">
          {deployment.rationale}
        </p>
      </Band>

      <Band tone="plate" strip={{ left: deployment.model.label }}>
        <p className="sr-only">{deployment.model.spoken}</p>

        <div
          aria-hidden="true"
          className="grid items-center gap-y-8 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-x-6"
        >
          <span className="text-center text-xl font-medium tracking-[-0.01em] text-ink md:text-2xl">
            {deployment.model.operator}
          </span>

          <Relation label={deployment.model.operates} />

          <span className="text-center text-2xl font-medium tracking-[-0.02em] text-accent md:text-3xl">
            {deployment.model.subject}
          </span>

          <Relation label={deployment.model.paidBy} flip />

          <span className="text-center text-xl font-medium tracking-[-0.01em] text-ink md:text-2xl">
            {deployment.model.payer}
          </span>
        </div>
      </Band>

      <Band strip={{ left: ownership.label }}>
        {/*
          A record, and a flat one: three independent facts about three
          different parties. The diagram above is a diagram for the opposite
          reason, that its two facts are about the same cell.
        */}
        <dl className="border-t border-rule">
          {ownership.rights.map((right) => (
            <div
              key={right.party}
              className="grid gap-y-1 border-b border-rule py-5 md:grid-cols-12 md:gap-x-8"
            >
              <dt className="font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim md:col-span-4 md:pt-1">
                {right.party}
              </dt>
              <dd className="text-lg leading-snug text-ink md:col-span-8">
                {right.holds}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-12">
          <p className="max-w-[34rem] text-base leading-relaxed text-ink-soft md:col-span-7 md:text-lg">
            {ownership.terms}
          </p>
          {/* MIKOSHI's own words, and the best sentence in the brief. It gets
              the position it earns rather than a paragraph in the middle. */}
          <p className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-ink md:col-span-5">
            {ownership.promise}
          </p>
        </div>
      </Band>

      <Footer />
    </main>
  );
}

/**
 * One relation in the commercial diagram: a rule with its verb sitting in the
 * break, which is how a dimension line carries its figure and the reason this
 * reads as drawn rather than as a caption under an arrow.
 *
 * **Both arrowheads point at the cell**, which is the entire argument. The
 * integrator operates the cell; the cell is paid for by the manufacturer. Two
 * parties, opposite sides, one subject. `flip` moves the head to the left end
 * for the second relation, because the head belongs on whichever end faces the
 * middle rather than on whichever end the text happens to finish at.
 *
 * One relation is active and one passive so the row reads as a sentence in the
 * order the eye takes it. Swapping either to match the other grammatically
 * would make the row say something false.
 *
 * Below `lg` the row stacks, so the horizontal rules become vertical ones. A
 * horizontal rule between two things sitting one above the other points at
 * nothing.
 *
 * **The breakpoint is `lg` and was `md`, which was measured and wrong.** Laid
 * out in a row the assembly wants about 874px: three labels at 20 to 30px plus
 * two relations each carrying two 40px rules, a tracked mono verb and an
 * arrowhead. `md` is 768, so at exactly that width it pushed the document 121px
 * sideways. Nothing here shrinks, by design, since a dimension line whose rules
 * collapse to nothing stops being a dimension line, so the row has to stack
 * before it runs out of room rather than compress.
 */
function Relation({ label, flip = false }: { label: string; flip?: boolean }) {
  const head = (
    <span aria-hidden="true" className="hidden leading-none lg:inline">
      {flip ? "←" : "→"}
    </span>
  );

  return (
    <span className="flex flex-col items-center justify-center gap-2 font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim lg:flex-row lg:gap-3">
      <span aria-hidden="true" className="h-6 w-px bg-rule lg:h-px lg:w-10" />
      {flip && head}
      <span className="whitespace-nowrap">{label}</span>
      {!flip && head}
      <span aria-hidden="true" className="h-6 w-px bg-rule lg:h-px lg:w-10" />
    </span>
  );
}
