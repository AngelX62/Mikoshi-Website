import { capabilities } from "@/content";
import Reveal from "./Reveal";

export default function Capabilities() {
  return (
    <section className="relative z-10 bg-void px-6 pb-24 md:px-10 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          {capabilities.label}
        </span>

        <Reveal
          target="[data-card]"
          className="grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge md:grid-cols-3"
        >
          {capabilities.items.map((item) => (
            <article
              key={item.index}
              data-card
              data-cursor-grow
              className="group relative flex min-h-[19rem] flex-col justify-between bg-surface p-8 opacity-0 transition-colors duration-500 hover:bg-[#0f0f11] md:p-10"
            >
              <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
                <span className="transition-colors duration-500 group-hover:text-accent">
                  {item.index}
                </span>
                <span>{item.key}</span>
              </div>

              <div>
                <h3 className="mb-3 text-2xl font-medium tracking-[-0.01em] md:text-3xl">
                  {item.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-ink-dim">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
