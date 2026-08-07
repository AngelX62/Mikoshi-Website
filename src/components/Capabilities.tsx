import { capabilities } from "@/content";
import CapabilityCard from "./CapabilityCard";
import Reveal from "./Reveal";

export default function Capabilities() {
  return (
    <section id="capability" className="relative z-10 px-6 pb-24 md:px-10 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <span className="mb-12 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          {capabilities.label}
        </span>

        <Reveal
          target="[data-card]"
          className="grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge md:grid-cols-3"
        >
          {capabilities.items.map((item) => (
            <CapabilityCard
              key={item.index}
              index={item.index}
              capabilityKey={item.key}
              title={item.title}
              body={item.body}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
