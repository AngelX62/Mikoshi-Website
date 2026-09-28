import researchPlate from "@/assets/research-plate.webp";
import Band from "@/components/Band";
import Cells from "@/components/Cells";
import Footer from "@/components/Footer";
import Plate from "@/components/Plate";
import { research } from "@/content";
import { routeMetadata } from "@/lib/metadata";
import { sheetOf } from "@/lib/sheet";

export const metadata = routeMetadata({
  title: "Research",
  description: research.metaDescription,
  path: "/research/",
});

/**
 * Research: the question, and the work it has to improve on.
 *
 * ── THE HEADING IS A QUESTION, AND THAT IS THE WHOLE POSITION ────────────────
 * This route used to open on a named method set at display size, on the sound
 * argument that a term introduced inside a paragraph is a term nobody remembers.
 * That was right for a company that had a method.
 *
 * Afterscale does not. The brief says so twice: "the first candidate problem,
 * not a proven mechanism" and "the signal itself remains to be designed". So the
 * largest type on the page is a question, and naming a method here would be the
 * single most dishonest thing the site could do. A reader who arrives expecting
 * a product name and finds a question has learned the most important fact about
 * this company in about two seconds.
 *
 * **The second band is the prior art, and it is the reason to trust the first.**
 * Four published pieces of work already do parts of this. A site that omitted
 * them would be read, correctly, as either ignorant of its field or hoping the
 * reader is. Naming them costs nothing anybody should want to keep.
 */
export default function Research() {
  return (
    <main className="flex flex-1 flex-col">
      <Band strip={{ left: research.label, right: sheetOf("/research") }}>
        {/*
          ── A QUESTION, LAID OUT AS ONE ────────────────────────────────────────
          The question on the left holding its own column, the argument beside
          it. That uses the width the page actually has, and it stops this band
          composing like the other two routes, which were all a very large
          heading over a single column of prose with half the frame left empty.

          The question wraps to two or three lines in a six-column track, which
          is the right setting for it rather than a compromise: a question set on
          one line reads as a headline, and set over three it reads as something
          being asked.
        */}
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <h1 className="display reveal text-[clamp(2rem,3.9vw,3.5rem)] leading-[1.06] tracking-[-0.03em] text-ink">
              {research.heading}
            </h1>

            {/*
              The plain-language premise, under the question and set larger than
              the argument beside it.

              It states the ordinary version of the problem before claiming
              anything with it. Keeping it in this column rather than at the head
              of the other one is what makes the pair read as question then gloss
              instead of as two columns of prose.
            */}
            <p
              className="reveal mt-10 max-w-[30rem] text-xl leading-[1.5] text-ink md:text-2xl md:leading-[1.35]"
              style={{ animationDelay: "160ms" }}
            >
              {research.paragraphs[0]}
            </p>
          </div>

          {/*
            The argument. Offset by a column so the two blocks are not simply
            halves of the frame, and capped at 34rem so the measure stays
            readable rather than running to the full track.

            ── THE LAST PARAGRAPH IS RENDERED ON ITS OWN ───────────────────────
            It used to come out of the same `.map`, picked out by
            `i === research.paragraphs.length - 2`, which is an off-by-one puzzle
            written to survive a `.slice(1)`: correct, and unreadable. Writing it
            out puts the paragraph that differs next to the comment saying why,
            which is worth more than the two lines it costs.
          */}
          <div className="flex flex-col gap-6 md:col-span-5 md:col-start-8">
            {research.paragraphs.slice(1, -1).map((paragraph, i) => (
              <p
                key={paragraph}
                className="reveal max-w-[34rem] text-lg leading-relaxed text-ink-soft"
                style={{ animationDelay: `${280 + i * 120}ms` }}
              >
                {paragraph}
              </p>
            ))}

            {/*
              The bar a contribution has to clear, and it ends by saying we do
              not have one. That is the sentence the rest of the page is measured
              against, so it takes the margin bracket: under the rule in
              globals.css the rose marks what is under test, and this is the
              claim being tested.
            */}
            <p
              className="display under-test reveal mt-2 max-w-[34rem] text-lg leading-relaxed text-ink md:text-xl md:leading-[1.5]"
              style={{ animationDelay: "520ms" }}
            >
              {research.paragraphs[research.paragraphs.length - 1]}
            </p>
          </div>
        </div>

        {/*
          ── THE ONE PICTURE ON THIS ROUTE, AND IT IS ATMOSPHERE ───────────────
          A motion-blurred field with a single light resolved out of it. It is
          not a diagram of the selection question and does not claim to be one,
          which is why it takes no figure number. See Plate.tsx.

          ── IT WAS INSIDE THE RIGHT-HAND COLUMN AND THAT WAS THE WRONG PLACE ──
          It sat between the argument prose and the bracketed claim, 483px wide,
          competing with both: too small to be a picture and too large to be
          furniture, and it made a column that was already the longer of the two
          longer still. A picture that has to be sequenced against a paragraph is
          in the wrong container.

          Out here it is a centred block under the whole grid, at 760px, and it
          has nothing to negotiate with. The band's own bottom padding carries it
          into the tint band below.

          **Still inside this band rather than in a band of its own.** Band.tsx
          carries a long note about the deleted `field` slot whose conclusion was
          that the answer to a frame with too little in it is to stop the frame
          being that deep, not to park a picture in the gap. A band containing
          nothing but a decorative photograph is that mistake with a new name. A
          `<section>` carrying no accessible name is not a landmark either, so it
          would buy no structure to offset it.
        */}
        <Plate
          src={researchPlate}
          className="reveal mx-auto mt-24 w-full max-w-[47.5rem]"
          style={{ animationDelay: "640ms" }}
        />
      </Band>

      {/*
        The prior art: the concession over the four papers it concedes to.

        It was prose in the left five columns and the citations as a ruled
        table in the right six. The layout pass of 2026-09-28 turned the papers
        into a row, which is how together.ai sets its own research: four equal
        units side by side, so the eye counts them before it reads them. Four
        pieces of work somebody else did, given the band's full width, is the
        strongest statement on this route that we know the field.

        `titled`, because the strip and a visible h2 under it both said "What
        we must improve on", about 90px apart. That read as a mistake, and to a
        screen reader it was the same section named twice. The strip's own label
        is the h2 now, as it is on home's record. See Band.tsx.
      */}
      <Band titled tone="tint" strip={{ left: research.priorArt.label }}>
        {/*
          The concession is set as the claim it is. The second paragraph
          qualifies how the comparison has to be run, so it takes the qualifier
          width. See globals.css. Side by side at the same measure, so neither
          column runs on while the other stops.
        */}
        <div className="grid gap-x-16 gap-y-6 md:grid-cols-2">
          <p className="display max-w-[34rem] text-lg leading-relaxed text-ink md:text-xl md:leading-[1.5]">
            {research.priorArt.paragraphs[0]}
          </p>
          <p className="qualifier max-w-[34rem] text-lg leading-relaxed text-ink-soft">
            {research.priorArt.paragraphs[1]}
          </p>
        </div>

        {/*
          ── THE CITATIONS, AS A ROW ───────────────────────────────────────────
          Four real papers, named exactly, with what each one establishes.

          **This is the site's second voice.** Prose states the argument and a
          citation is a record in the strictest sense: nothing here is ours, and
          every cell is checkable by somebody who knows the field better than we
          do. So the work is set in the mono data register, not the sans.

          The authors are the cell's label now. The table kept "Rho-1, Lin et
          al." together as one term; in a cell the label sits directly on the
          title, so it still reads as one byline.

          Four across only from `xl`: at 1024 a quarter of the track is 194px,
          five lines for "Practical Efficiency of Muon for Pretraining".
        */}
        <Cells
          cols={2}
          md={2}
          xl={4}
          face="data"
          className="mt-12 md:mt-16"
          items={research.priorArt.citations.map((citation) => ({
            key: citation.work,
            label: citation.authors,
            title: citation.work,
            body: citation.note,
          }))}
        />
      </Band>

      <Footer />
    </main>
  );
}
