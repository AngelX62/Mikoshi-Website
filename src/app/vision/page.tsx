import type { Metadata } from "next";
import Band from "@/components/Band";
import Footer from "@/components/Footer";
import { vision } from "@/content";

export const metadata: Metadata = {
  title: "Vision",
  description: vision.statement.paragraphs[1],
};

/**
 * The beats escalate, so their type does too.
 *
 * `beats` walks from the failure to the claim to what gets kept to the horizon,
 * and the order is load-bearing. Setting each one larger and brighter than the
 * last makes the argument legible as a shape before a word of it is read, which
 * is the one thing a reader who skims this page will take from it.
 */
const BEAT = [
  "text-[clamp(1.125rem,2vw,1.5rem)] text-ink-dim",
  "text-[clamp(1.25rem,2.6vw,1.875rem)] text-ink-dim",
  "text-[clamp(1.5rem,3.2vw,2.25rem)] text-ink-soft",
  "text-[clamp(1.75rem,4vw,2.75rem)] text-ink",
];

/**
 * Vision: the page whose argument used to be hidden.
 *
 * **The disclosure panel is gone.** These fourteen paragraphs sat behind a
 * control reading "Read the full vision", because the section was one stop on a
 * single long scroll and dropping 430 words into that scroll would have buried
 * the two sections after it. Vision is its own route now, so the argument is
 * simply the page. A control that opens a panel on a page whose entire job is
 * that panel would be furniture.
 *
 * **The closing plate is the best moment on the site**, which is why it gets a
 * plate. Five verbs of the discovery cycle over five words of the bookend,
 * aligned cell for cell:
 *
 *     NOTICE   EXPLAIN   TEST    REVISE   KEEP
 *     ────────────────────────────────────────
 *     Machines discover  what    comes    next.
 *
 * Five against five is half found and half engineered. `loop` came out of the
 * copy intact; `bookend` was compressed to meet it. Changing the length of
 * either list breaks the other, so do not add a sixth word to either.
 */
export default function Vision() {
  return (
    <main className="flex flex-1 flex-col">
      <Band size="tall" strip={{ left: vision.label }}>
        <h1 className="reveal max-w-4xl text-[clamp(2.25rem,6.4vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-ink">
          {vision.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        {/*
          Wide enough that all four beats set on one line at 1440, measured.
          At 46rem the first and third wrapped and the second and fourth did
          not, so the escalation read as an accident of the measure rather than
          as four steps up. The longest is beat one at 73 characters, which
          needs about 61rem at its size; 62 clears it without letting the
          shortest float in the middle of an empty frame.
        */}
        <div className="mt-16 flex max-w-[62rem] flex-col gap-7 md:mt-24">
          {vision.beats.map((beat, i) => (
            <p
              key={beat}
              className={`reveal leading-snug tracking-[-0.015em] ${BEAT[i]}`}
              style={{ animationDelay: `${240 + i * 120}ms` }}
            >
              {beat}
            </p>
          ))}
        </div>
      </Band>

      <Band strip={{ left: vision.statement.label }}>
        {/*
          Two columns at `lg` and one below it. Fourteen paragraphs in a single
          column on a wide screen is either a 40em ribbon down the left of an
          empty frame or a measure nobody can read; two columns of about 34em
          is the setting a document of this length actually wants.
        */}
        <div className="columns-1 gap-x-16 lg:columns-2">
          {vision.statement.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="mb-6 break-inside-avoid text-base leading-relaxed text-ink-soft"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </Band>

      <Band tone="plate" strip={{ left: vision.loopLabel }}>
        {/*
          Five columns at `md` and up, so each bookend word sits under its verb.
          Below that it wraps to a grid of two or three, where the alignment
          claim cannot be made and is not attempted: the two rows simply become
          two lists.
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-5 md:gap-x-4">
          {vision.loop.map((verb, i) => (
            <div key={verb} className="flex flex-col gap-4">
              <span className="font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim">
                {verb}
              </span>
              <span aria-hidden="true" className="h-px w-full bg-rule" />
              <span className="text-[clamp(1.125rem,2.2vw,1.75rem)] font-medium leading-none tracking-[-0.02em] text-ink">
                {vision.bookend[i]}
              </span>
            </div>
          ))}
        </div>
      </Band>

      <Footer />
    </main>
  );
}
