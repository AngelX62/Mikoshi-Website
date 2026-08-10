/**
 * Jumping to a section.
 *
 * Shared by the hero's scroll cue and the rail's index, because both have the
 * same trap to avoid and neither should be the place it is solved.
 *
 * **A pinned section cannot be measured.** ScrollTrigger makes the method
 * `position: fixed` for as long as it is pinned, so `getBoundingClientRect`
 * returns where it is on the screen rather than where it sits in the document,
 * and a jump computed from that lands wherever the viewport happened to be.
 * ScrollTrigger leaves a `.pin-spacer` in the flow holding exactly the geometry
 * that was taken out, so anything pinned is measured through its spacer.
 * `Instrument.tsx` needs the same thing for its waypoint anchors and solves it
 * the same way.
 *
 * `scrollIntoView` is not used. Lenis runs in native-scroll mode, so
 * `window.scrollTo` is authoritative and takes a number, which is what lets the
 * offset above be corrected before the scroll rather than after it.
 */

import { prefersReducedMotion } from "./motion";

/**
 * The element that actually tracks the document.
 *
 * A pinned section's `.pin-spacer` parent, or the section itself when there is
 * no pin. Below `SCROLL.pinMinWidth` the method is not pinned at all, so this
 * has to keep working with no spacer present.
 */
export function stableTrigger(section: HTMLElement): HTMLElement {
  const parent = section.parentElement;
  return parent?.classList.contains("pin-spacer") ? parent : section;
}

/** Where a section begins, in document pixels, whether or not it is pinned. */
export function sectionTop(id: string): number | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const box = stableTrigger(el).getBoundingClientRect();
  return box.top + window.scrollY;
}

export function scrollToSection(id: string): void {
  const top = sectionTop(id);
  if (top === null) return;

  const max = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  window.scrollTo({
    top: Math.min(top, max),
    // Smooth scrolling is motion, and a long one: the method's pin alone is
    // 280% of a viewport, so a jump past it animates for a distance nobody
    // asked to travel. Reduced motion gets there instantly.
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
