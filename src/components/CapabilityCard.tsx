"use client";

import { useRef, type PointerEvent } from "react";

type Props = {
  index: string;
  capabilityKey: string;
  title: string;
  body: string;
};

/**
 * A capability panel with a cursor spotlight.
 *
 * The pointer handler only writes two custom properties; the gradient itself is
 * static CSS (`.spotlight` in globals.css) that reads them. So there's no
 * per-frame JS and no React re-render on move — the style write is direct.
 *
 * Deliberately no 3D tilt. It's the most over-used hover effect of the last few
 * years and would undercut the restraint everything else here is built on.
 */
export default function CapabilityCard({
  index,
  capabilityKey,
  title,
  body,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  function onMove(e: PointerEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <article
      ref={ref}
      data-card
      data-cursor-grow
      onPointerMove={onMove}
      className="spotlight group relative flex min-h-[19rem] flex-col justify-between overflow-hidden bg-surface p-8 opacity-0 transition-colors duration-500 hover:bg-[#0f0f11] md:p-10"
    >
      <div className="relative z-10 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
        <span className="transition-colors duration-500 group-hover:text-accent">
          {index}
        </span>
        <span>{capabilityKey}</span>
      </div>

      <div className="relative z-10">
        <h3 className="mb-3 text-2xl font-medium tracking-[-0.01em] md:text-3xl">
          {title}
        </h3>
        <p className="max-w-xs text-sm leading-relaxed text-ink-dim">{body}</p>
      </div>
    </article>
  );
}
