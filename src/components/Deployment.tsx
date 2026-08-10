"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { deployment, photograph } from "@/content";
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

      {/* A measure, not a centring device. See the note in Thesis.tsx. */}
      <div className="w-full max-w-6xl">

        {/*
          One wipe for the section, staggering the two columns. The heading used
          to carry a second, nested wipe of its own, which meant the block and
          the line inside it arrived by two separate animations.
        */}
        <Wipe stagger className="grid gap-14 md:grid-cols-[1.4fr_1fr] md:gap-20">
          <div>
            <h2 className="mb-6 text-[clamp(2.25rem,7vw,5rem)] font-medium leading-[1.0] tracking-[-0.03em]">
              {deployment.heading}
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
              {deployment.body}
            </p>
          </div>

          <div>
            {/*
              A definition list, not a card. These are two facts about who does
              what, and the flat key/value rows keep them reading as record
              rather than as a pricing tier.
            */}
            <dl className="border-t border-edge">
              {deployment.facts.map((fact) => (
                <div
                  key={fact.key}
                  className="flex items-baseline justify-between gap-6 border-b border-edge py-4"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
                    {fact.key}
                  </dt>
                  <dd className="text-right text-sm text-ink md:text-base">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/*
              `ink-soft`, not `ink-dim`. It clears AA either way, but this is
              the one sentence on the page that states the commercial argument,
              and it sits over a form the section is deliberately holding at low
              gain behind its copy. Measured against flat ground it passes;
              measured against a moving halftone it is the hardest line here to
              read, and a ratio computed against an average is not what an eye
              does with texture.
            */}
            <p className="mt-8 text-sm leading-relaxed text-ink-soft">
              {deployment.rationale}
            </p>
          </div>
        </Wipe>
      </div>
    </section>
  );
}
