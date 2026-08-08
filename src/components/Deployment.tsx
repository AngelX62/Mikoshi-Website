import { deployment } from "@/content";
import Reveal from "./Reveal";

/**
 * The first product.
 *
 * Deliberately the most concrete block on the page. Everything above it is
 * mechanism, which is only worth reading if something ships, so this names the
 * cell, the operator and the payer without hedging. The commercial pair is the
 * part most sites leave out and the part an integrator reads first.
 */
export default function Deployment() {
  return (
    <section
      id="deployment"
      className="relative z-10 flex min-h-screen items-center px-6 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto w-full max-w-6xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {deployment.label}
        </span>

        <Reveal className="grid gap-14 md:grid-cols-[1.4fr_1fr] md:gap-20">
          <div>
            <h2 className="mb-6 text-[clamp(2rem,5vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.025em]">
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

            <p className="mt-8 text-sm leading-relaxed text-ink-dim">
              {deployment.rationale}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
