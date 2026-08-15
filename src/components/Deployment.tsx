"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { deployment, ownership, photograph } from "@/content";
import { channels, releaseChannel } from "@/lib/fieldState";
import { SCROLL, norm, prefersReducedMotion } from "@/lib/motion";
import SectionLabel from "./SectionLabel";
import Wipe from "./Wipe";

/**
 * The first product.
 *
 * Deliberately the most concrete block on the page. Everything above it is
 * mechanism, which is only worth reading if something ships, so this names the
 * cell, the operator and the payer without hedging. The commercial pair is the
 * part most sites leave out and the part an integrator reads first.
 *
 * Holds the photograph at low gain behind the copy, and is now the only section
 * that does. There was a proof beat above it showing a real cell full frame,
 * which is where the image belonged; that beat is gone because there is no
 * photograph and a schematic drawing cannot be evidence (see page.tsx). Until a
 * file exists this channel drives an empty buffer and the section is copy over
 * the plain field, which costs nothing and asserts nothing.
 */
/**
 * One party or thing in the model: a marker and a name.
 *
 * The marker is a 8px square rather than a circle, because the page already
 * spends its circles on the instrument's leader landings and two round things
 * meaning two different things is one more than this register can carry. The
 * subject's marker is filled and its name is `text-ink`, so the eye finds the
 * cell first and reads the two parties as facts about it.
 */
function Node({ label, subject = false }: { label: string; subject?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`block h-2 w-2 shrink-0 border ${
          subject ? "border-ink bg-ink" : "border-ink-dim"
        }`}
      />
      <span
        className={`whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em] ${
          subject ? "text-ink" : "text-ink-soft"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * The line between two nodes, carrying the relation.
 *
 * The same device as the vision's disclosure and the loop: a mono label sitting
 * *on* a rule rather than above one, with the rule taking the slack either side.
 * Dashed, to match the instrument's leader on the canvas, since both are saying
 * the same kind of thing about the same kind of drawing.
 *
 * It takes the `1fr` columns, so the frame's spare width goes into the relations
 * rather than into the gaps, and the diagram stretches to whatever the section
 * is given.
 */
function Relation({ word }: { word: string }) {
  return (
    <div className="flex items-center gap-3 md:px-5">
      <span className="flex-1 border-t border-dashed border-ink-faint/45" />
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
        {word}
      </span>
      <span className="flex-1 border-t border-dashed border-ink-faint/45" />
    </div>
  );
}

export default function Deployment() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = prefersReducedMotion();

    function apply(p: number) {
      // Deliberately low: the photograph is behind copy here rather than being
      // the subject, so it stays atmosphere. Sized for a real photograph, which
      // carries far more coverage at the same gain than any drawing would, and
      // this is the only place on the page where type sits over an image.
      channels.deployment.photo =
        Math.min(norm(p, 0.05, 0.28), 1 - norm(p, 0.7, 0.95)) * 0.5;
    }

    if (reduced) {
      apply(0.5);
      return () => releaseChannel("deployment");
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: SCROLL.scrub,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
        onLeave: () => releaseChannel("deployment"),
        onLeaveBack: () => releaseChannel("deployment"),
      });
      apply(trigger.progress);
    }, section);

    return () => {
      ctx.revert();
      releaseChannel("deployment");
    };
  }, []);

  return (
    <section
      id="deployment"
      ref={sectionRef}
      // See the note in Thesis.tsx: `flex-col` below `md` keeps the static
      // section label out of the row. This section was the worse of the two,
      // because "FIRST DEPLOYMENT" wraps to two lines and took 100px of a 342px
      // box at 390, leaving the copy 227px.
      // `md:justify-start` for the same reason as Thesis.tsx: the main axis
      // flips at the breakpoint and `justify-center` would re-centre the copy.
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-32 md:flex-row md:items-center md:justify-start md:py-48 md:pl-24 md:pr-10"
    >
      <SectionLabel>{deployment.label}</SectionLabel>

      {/*
        The photograph is drawn on canvas, which is invisible to search engines
        and screen readers, so its description lives here. It moved with the
        image when the proof beat was removed; renders nothing until a real file
        exists, since describing an empty buffer would be describing nothing.
      */}
      {photograph.src && <p className="sr-only">{photograph.alt}</p>}

      {/*
        Full width, and the copy takes a measure inside it rather than the
        container taking one. The section funnels and then opens, the same shape
        the vision uses: a measure for the argument, the whole frame for the
        thing being argued about.
      */}
      <div className="w-full">
        {/*
          One wipe for the section, staggering the three blocks. `space-y` sits
          on the wipe masks rather than on the paragraphs, so the gaps stay
          outside the clipped boxes and do not travel with the type as it lands.

          One column, where this used to be two. The right column held a
          key/value list of the commercial pair, and that pair is now the
          diagram below, which is the only place it can say the thing that
          matters: that both facts are about the same cell.
        */}
        <Wipe stagger className="w-full space-y-6 md:space-y-8">
          <h2 className="max-w-4xl text-[clamp(2.25rem,7vw,5rem)] font-medium leading-[1.0] tracking-[-0.03em]">
            {deployment.heading}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
            {deployment.body}
          </p>
          {/*
            `ink-soft`, not `ink-dim`. It clears AA either way, but this is the
            one sentence on the page that states the commercial argument, and it
            sits over a form the section is deliberately holding at low gain
            behind its copy. Measured against flat ground it passes; measured
            against a moving halftone it is the hardest line here to read, and a
            ratio computed against an average is not what an eye does with
            texture.
          */}
          <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
            {deployment.rationale}
          </p>

          {/*
            Ownership, and the reason it sits in this section.

            The objection forms one section earlier, where step 01 names what
            gets ingested, and it is the thing most likely to close the tab for
            the exact reader this page is written for. It is answered here
            because this is where the terms of the deal already live: who
            operates, who pays, and now who owns.

            A flat record, not a diagram, and that is the opposite of the
            decision taken for the commercial pair below. Those two facts are
            about the same cell, so a list could not say the thing that
            mattered. These three are independent facts about three different
            parties, and a record is exactly what they are.
          */}
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
              {ownership.label}
            </span>

            <p className="mb-5 text-base leading-snug text-ink">
              {ownership.lead}
            </p>

            <dl className="border-t border-edge">
              {ownership.rights.map((right) => (
                <div
                  key={right.party}
                  className="flex items-baseline justify-between gap-6 border-b border-edge py-2.5"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
                    {right.party}
                  </dt>
                  <dd className="text-right text-sm text-ink-soft">
                    {right.holds}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              {ownership.licence}
            </p>
          </div>
        </Wipe>

        {/*
          The commercial model, drawn.

          The second of the page's full-frame breakouts, after the vision's
          closing pair. Used once that device is a flourish; used across the
          section that names the product and the section that names the
          destination, it is the page's structure.

          The whole point is the middle node. Two rows of a key/value list put
          the integrator and the manufacturer side by side as unrelated facts;
          spread across the frame with the cell between them, they become one
          statement about one thing, which is what the positioning has always
          said and what the page had never shown.

          Read left to right it is a sentence: the integrator operates the cell,
          paid for by the manufacturer. That is why one relation is active and
          the other passive, and why there are no arrowheads: the words already
          carry the direction, and an arrow would be a mark this page does not
          otherwise own.
        */}
        <div className="mt-14 w-full md:mt-20">
          <p className="sr-only">{deployment.model.spoken}</p>

          <div
            aria-hidden="true"
            className="
              flex flex-col gap-5
              md:grid md:grid-cols-[auto_1fr_auto_1fr_auto] md:items-center md:gap-0
            "
          >
            <Node label={deployment.model.operator} />
            <Relation word={deployment.model.operates} />
            {/* The subject, and the only filled marker, because it is the thing
                the other two are facts about. */}
            <Node label={deployment.model.subject} subject />
            <Relation word={deployment.model.paidBy} />
            <Node label={deployment.model.payer} />
          </div>
        </div>
      </div>
    </section>
  );
}
