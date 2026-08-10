"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp } from "@/lib/motion";
import { scrollToSection, sectionTop } from "@/lib/scroll";

/**
 * The progress rail on the right edge, and the page's only navigation.
 *
 * It was a hairline and a percentage, which encodes something true and reads as
 * instrumentation, and that was the whole of it. The page is 8500px with 2520
 * of that inside one pin, so a first-time visitor could not tell how long it
 * was, could not see what was coming, could not skip and could not get back.
 * Worse, during the pin the scrollbar keeps moving while the content does not,
 * which reads as a broken page rather than as a held shot.
 *
 * So the rail carries destinations now. Same hairline, same readout, same 24px
 * of the frame: what is added is a tick per section and a label per tick, and
 * the labels only exist on hover or focus. Nothing is added to the resting
 * frame, and the one decorative element on the page starts carrying
 * information.
 *
 * It writes a transform and a text node from a passive scroll listener. No rAF
 * loop, no layout reads beyond the cached document height and the anchors.
 */

/**
 * The destinations, in page order.
 *
 * `id` matches the section elements. The hero is deliberately absent: the rail
 * is for going forward through an argument, and "back to the top" is what the
 * browser's own Home key is for.
 */
const STOPS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "thesis", label: "Thesis" },
  { id: "method", label: "Method" },
  { id: "deployment", label: "Deployment" },
  { id: "vision", label: "Vision" },
  { id: "site-footer", label: "Contact" },
];

export default function ScrollRail() {
  const fillRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    const readout = readoutRef.current;
    const list = listRef.current;
    if (!fill || !readout || !list) return;

    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-stop]"));

    let max = 1;
    let last = -1;
    let lastActive = -1;
    /** Document offset of each stop, in the order of `STOPS`. */
    let anchors: number[] = [];

    /**
     * The document's scrollable length, and where each section starts.
     *
     * Re-measured on ScrollTrigger's refresh as well as on resize, because the
     * pins set both numbers and they are not in place at mount: the method
     * alone adds 280% of a viewport. A rail measured once reports a percentage
     * of the wrong document, and an index measured once marks the wrong section
     * for the whole bottom half of the page.
     *
     * **Nothing here re-measures from the scroll handler**, and that is
     * deliberate. `scrollHeight` is a layout-forcing read, and putting one in a
     * handler that fires on every scroll event costs a style recalculation per
     * frame on a page that spends its whole budget on the canvas. The refresh
     * event is the correct signal and it is sufficient; `DitherField` measures
     * the footer off the same one.
     */
    function measure() {
      max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      anchors = STOPS.map((stop) => sectionTop(stop.id) ?? 0);
      update();
    }

    function update() {
      const y = window.scrollY;
      const p = clamp(y / max, 0, 1);
      fill!.style.transform = `scaleY(${p.toFixed(4)})`;

      // Only touch the DOM when the rounded value actually changes.
      const pct = Math.round(p * 100);
      if (pct !== last) {
        last = pct;
        readout!.textContent = String(pct).padStart(2, "0");
      }

      // Which section is in force. Marked rather than merely reported, because
      // this is the part that answers "the scrollbar is moving and the content
      // is not" while the method holds its pin.
      //
      // Biased by a third of a viewport so a section counts as current once it
      // is genuinely the subject, not the instant its top edge crosses the
      // bottom of the screen.
      const at = y + window.innerHeight * 0.34;
      let active = -1;
      for (let i = 0; i < anchors.length; i++) if (at >= anchors[i]) active = i;
      if (active !== lastActive) {
        lastActive = active;
        items.forEach((item, i) => {
          item.dataset.active = i === active ? "true" : "false";
          const link = item.querySelector("a");
          // `aria-current` and not `aria-selected`: these are links to places
          // on the page, and one of them is where you are.
          if (link) {
            if (i === active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          }
        });
      }
    }

    measure();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    ScrollTrigger.addEventListener("refresh", measure);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      ScrollTrigger.removeEventListener("refresh", measure);
    };
  }, []);

  return (
    <nav
      aria-label="Sections"
      // `group` so one hover anywhere on the rail reveals every label at once.
      // Revealing only the label under the pointer would make finding a
      // destination a search rather than a glance.
      className="group pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex"
    >
      <ul ref={listRef} className="pointer-events-auto flex flex-col items-end">
        {STOPS.map((stop) => (
          <li key={stop.id} data-stop data-active="false" className="group/stop">
            <a
              href={`#${stop.id}`}
              onClick={(e) => {
                // The href is the fallback and the semantics; this is the
                // behaviour. `scrollToSection` corrects for the pin, which a
                // fragment jump cannot: the method is `position: fixed` while
                // pinned, so the browser's own anchor scroll lands wherever the
                // viewport happened to be.
                e.preventDefault();
                scrollToSection(stop.id);
              }}
              // `ink-dim`, not `ink-faint`. One hover reveals all five labels
              // at once and only the hovered one lifts, so four of them are on
              // screen in whatever the resting colour is: `ink-faint` measures
              // 2.21:1 on the light ground and 2.91:1 on the dark one, and
              // these are destinations, not decoration. The tick below keeps
              // `ink-faint` explicitly, so the resting frame is unchanged.
              className="
                flex items-center justify-end gap-2 py-1.5 pl-6
                font-mono text-[10px] uppercase tracking-[0.18em]
                text-ink-dim transition-colors duration-300
                hover:text-ink focus-visible:text-ink
              "
            >
              {/*
                Absence is length, not opacity, which is the rule the instrument
                layer already works to. A label at zero width has not faded, it
                simply is not there, and it costs the resting frame nothing.
              */}
              <span
                className="
                  max-w-0 overflow-hidden whitespace-nowrap opacity-0
                  transition-[max-width,opacity] duration-500 ease-out-expo
                  group-hover:max-w-[9rem] group-hover:opacity-100
                  group-focus-within:max-w-[9rem] group-focus-within:opacity-100
                "
              >
                {stop.label}
              </span>

              {/* The tick. Longer and brighter for the section in force, which
                  is the only always-visible state change on the rail. */}
              <span
                aria-hidden="true"
                className="
                  block h-px w-2 bg-ink-faint transition-all duration-300
                  group-data-[active=true]/stop:w-5
                  group-data-[active=true]/stop:bg-ink-dim
                  group-hover/stop:bg-ink
                "
              />
            </a>
          </li>
        ))}
      </ul>

      <div aria-hidden="true" className="relative h-24 w-px bg-edge">
        <div
          ref={fillRef}
          className="absolute inset-0 origin-top bg-ink-dim"
          style={{ transform: "scaleY(0)" }}
        />
      </div>

      <span
        ref={readoutRef}
        aria-hidden="true"
        className="font-mono text-[10px] tabular-nums tracking-[0.18em] text-ink-dim"
      >
        00
      </span>
    </nav>
  );
}
