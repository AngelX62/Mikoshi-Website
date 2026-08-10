"use client";

import { useEffect, useState } from "react";
import { THEME_EVENT, currentTheme, setTheme, type Theme } from "@/lib/theme";

/**
 * The ground switch.
 *
 * Two labels rather than an icon, and no track, no knob, no pill. This page has
 * exactly one register of chrome — 11px mono, uppercase, 0.22em — and a toggle
 * component borrowed from somewhere else would be the only thing on the site
 * that looks like a control rather than like instrumentation. The state is the
 * lit label; the other one is the affordance.
 *
 * A `radiogroup` and not a checkbox. There are two named grounds, neither of
 * them the absence of the other, and arrow keys moving between two visible
 * options is the behaviour that matches what is drawn.
 *
 * Mounted with `null` until the effect runs. The theme lives on the root
 * element, stamped by a script before first paint, so rendering it during SSR
 * would emit whichever value the build guessed and hydrate into a mismatch.
 */
const OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export default function Theme() {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(currentTheme());

    // Another copy of this control, or a future one, is the only thing that
    // fires this. Subscribing keeps every instance agreeing rather than each
    // holding its own idea of the state.
    const sync = (e: Event) =>
      setThemeState((e as CustomEvent<Theme>).detail ?? currentTheme());
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  function choose(next: Theme) {
    if (next === theme) return;
    setTheme(next);
    setThemeState(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      // `pointer-events-auto` because the hero's chrome layer turns them off
      // wholesale so the field underneath stays reachable by the cursor light.
      className="pointer-events-auto flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]"
    >
      {OPTIONS.map((option, i) => {
        const on = theme === option.value;
        return (
          <span key={option.value} className="flex items-center gap-3">
            {i > 0 && (
              <span aria-hidden="true" className="text-ink-faint">
                /
              </span>
            )}
            <button
              type="button"
              role="radio"
              aria-checked={on}
              // Only the selected control is tabbable, and the group is then
              // traversed with the arrow keys. Two tab stops for one setting is
              // the thing roving focus exists to avoid. Before the effect has
              // run there is no selection yet, so the first one holds the stop.
              tabIndex={on || (theme === null && i === 0) ? 0 : -1}
              onClick={() => choose(option.value)}
              onKeyDown={(e) => {
                if (
                  e.key !== "ArrowRight" &&
                  e.key !== "ArrowLeft" &&
                  e.key !== "ArrowUp" &&
                  e.key !== "ArrowDown"
                ) {
                  return;
                }
                e.preventDefault();
                const next = option.value === "dark" ? "light" : "dark";
                choose(next);
                // Focus follows selection, or the roving tabindex strands it on
                // an element that is about to become untabbable.
                e.currentTarget
                  .closest("[role=radiogroup]")
                  ?.querySelector<HTMLButtonElement>(
                    `button[data-theme-value="${next}"]`,
                  )
                  ?.focus();
              }}
              data-theme-value={option.value}
              // The unselected label is `ink-dim`, which is the dimmest token
              // that still clears 4.5:1 on either ground. `ink-faint` measures
              // 2.21:1 on the light theme and is reserved for marks that carry
              // no information; this one is the affordance.
              className={`transition-colors duration-300 ${
                on ? "text-ink-soft" : "text-ink-dim hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
