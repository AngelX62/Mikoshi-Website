import type { Metadata } from "next";
import Band from "@/components/Band";
import Footer from "@/components/Footer";
import { method, thesis } from "@/content";

export const metadata: Metadata = {
  title: "Technology",
  description: thesis.lines.join(" "),
};

/**
 * Technology: the claim, then the mechanism.
 *
 * The thesis opens because the method is only credible after it. Four steps in
 * a numbered order arrive as a procedure if the reader has not first been told
 * what the procedure is for.
 *
 * **The four steps alternate tone**, bone, plate, bone, plate. That is the
 * reference sheet's composition: a stack of letterboxed frames with hard edges
 * and no gutters, where the cut between two frames is the only separator. It
 * also does something the old site needed 2520px of pinned scroll to do, which
 * is make it obvious at a glance that these are four of one thing.
 *
 * **`inputs` stays a list and the prose stays out of it.** Rule one in
 * content.ts: the chips enumerate, so the body underneath says the thing the
 * chips cannot. Setting them as a grid rather than a row is what keeps six
 * items legible next to two.
 */
export default function Technology() {
  return (
    <main className="flex flex-1 flex-col">
      {/*
        No spelled position on this strip, and none on any band outside the
        method. The right-hand half of a strip states where you are in a
        numbered set; the method is the only numbered set on the site, so
        everywhere else it would be a label invented to fill the slot.
      */}
      <Band size="tall" strip={{ left: thesis.label }}>
        {/*
          Seven hand-set lines, kept hand-set. They were short because each one
          used to sit inside a mask that clipped overflow; the mask is gone and
          the shape is the reason now. See the note in content.ts.
        */}
        <h1 className="reveal max-w-4xl text-[clamp(1.75rem,4.6vw,3.5rem)] font-medium leading-[1.12] tracking-[-0.025em] text-ink">
          {thesis.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
      </Band>

      {/*
        The four steps are grouped, and the group is named for anything that
        cannot see the design.

        Sighted readers get the grouping for free: the bands alternate tone,
        each strip is numbered, and each says which sheet of four it is. None
        of that reaches a screen reader, which would otherwise meet four
        unrelated headings in a row with no indication that they are one
        procedure in a fixed order. The heading is hidden rather than drawn
        because the visual design already says it, and a second visible label
        over four already-labelled bands is furniture.
      */}
      <section aria-labelledby="method-heading">
        <h2 id="method-heading" className="sr-only">
          {method.label}
        </h2>

        {method.steps.map((step, i) => (
          <Band
            key={step.index}
            tone={i % 2 === 0 ? "bone" : "plate"}
            strip={{ left: `${step.index} · ${step.readout}`, right: step.sheet }}
          >
            <div className="grid gap-x-16 gap-y-10 md:grid-cols-12">
              <div className="md:col-span-7">
                <h3 className="text-[clamp(1.5rem,3.2vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-ink-soft md:text-lg">
                  {step.body}
                </p>
              </div>

              <div className="md:col-span-5">
                <ul className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-dim">
                  {step.inputs.map((input) => (
                    <li
                      key={input}
                      className="border-t border-rule pt-3 text-balance"
                    >
                      {input}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Band>
        ))}
      </section>

      <Footer />
    </main>
  );
}
