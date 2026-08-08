import { horizon } from "@/content";
import Reveal from "./Reveal";

/**
 * Where this goes.
 *
 * One claim and the loop that supports it, kept short on purpose. A long
 * vision section directly after a concrete product section undoes the concrete
 * product section.
 */
export default function Horizon() {
  return (
    <section
      id="horizon"
      className="relative z-10 flex min-h-screen items-center px-6 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto w-full max-w-4xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {horizon.label}
        </span>

        <Reveal>
          <h2 className="mb-8 text-[clamp(2rem,5.4vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.025em]">
            {horizon.heading}
          </h2>

          <p className="mb-16 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
            {horizon.body}
          </p>

          {/*
            The loop reads as a sequence rather than a list: hairline rules
            between the verbs, wrapping on narrow screens. It is the same
            ordered-process device as the method spine, at a smaller scale.
          */}
          <ol className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-edge pt-8 font-mono text-[11px] uppercase tracking-[0.22em]">
            {horizon.loop.map((verb, i) => (
              <li key={verb} className="flex items-center gap-5">
                <span className="text-ink-soft">{verb}</span>
                {i < horizon.loop.length - 1 && (
                  <span aria-hidden="true" className="h-px w-6 bg-edge" />
                )}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
