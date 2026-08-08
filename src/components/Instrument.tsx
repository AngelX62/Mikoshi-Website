"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fieldReadout } from "@/content";
import { fieldState } from "@/lib/fieldState";
import {
  DURATION,
  EASE_OUT_EXPO,
  INTRO,
  lerp,
  prefersReducedMotion,
  smoothstep,
} from "@/lib/motion";

/**
 * The instrument layer.
 *
 * Thin annotation geometry over the field: a dashed rule with a scale on it,
 * ranging circles, corner brackets, a readout. A page where nothing measures
 * anything reads as flat however good the field is, and MIKOSHI's fourth step
 * is to physically qualify the result, so a company selling judgement about
 * whether work is good should look like something being measured.
 *
 * **It is one object, and it never leaves.**
 *
 * The first version was six groups, one per section, each drawing itself in on
 * enter and retracting on leave. That is six separate events with nothing
 * carrying between them, which is exactly what made the page read as a set of
 * scenes rather than one continuous shot — and it also meant two of the six had
 * to be compositions in their own right when they had nothing to compose
 * against. Now there is a single rule, a single set of circles and a single
 * bracket, whose geometry is interpolated from scroll position. Nothing
 * appears, nothing goes; one thing moves and reshapes for eight screens.
 *
 * **Absence is length, not opacity.** A tick with zero length and a bracket
 * with zero-length arms are invisible without ever having faded, which is what
 * keeps that claim honest. The readout is the one exception, because a word
 * cannot be given zero length, so it is the only thing here with an alpha.
 *
 * **Fixed, like the canvas.** The geometry annotates the *field*, and the field
 * is a fixed full-viewport canvas, so the two share a coordinate space. Content
 * scrolls through the instrument rather than carrying it along.
 *
 * Decorative throughout: the sections keep their own labels and headings, this
 * only says what the field is holding. The layer is `aria-hidden` and carries
 * nothing a reader would miss.
 */

/**
 * One composition, held when its section is centred in the viewport.
 *
 * Every value is a fraction so that a resize needs no re-measuring: `x` and
 * `ruleY` are fractions of the viewport, radii and arm lengths are fractions of
 * its short side. Fractions are also what makes interpolating honest — the SVG
 * percentages this replaced resolved `r` and `y` against different bases, so
 * lerping them moved two things at different rates.
 */
type Waypoint = {
  /** Section the waypoint is anchored to. */
  id: string;
  /** Height of the dashed rule. Above 1 parks it below the frame. */
  ruleY: number;
  /** Tick length in px. Zero is how a scale is put away. */
  tick: number;
  /** Always three. The third is the wide one that bookends the page. */
  circles: ReadonlyArray<readonly [x: number, y: number, r: number]>;
  /** Region of interest, and the arm length that reveals it. */
  bracket: readonly [x: number, y: number, w: number, h: number, arm: number];
  /** The only alpha in the layer. */
  readout: number;
};

const WAYPOINTS: Waypoint[] = [
  // The wordmark, ranged and sitting on a scale. Two circles overlap it rather
  // than sharing a centre: concentric reads as a gunsight, where the reference
  // looks like geometry struck over the image by someone working something out.
  {
    id: "hero",
    ruleY: 0.62,
    tick: 6,
    circles: [
      [0.38, 0.41, 0.14],
      [0.63, 0.54, 0.22],
      [0.5, 0.46, 0.85],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0],
    readout: 0,
  },
  // Drifting. This section is a paragraph to be read, so the instrument gets
  // out of the way rather than inventing something to point at.
  {
    id: "thesis",
    ruleY: 0.22,
    tick: 0,
    circles: [
      [0.28, 0.56, 0.19],
      [0.72, 0.4, 0.12],
      [0.5, 0.52, 0.74],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0],
    readout: 0,
  },
  // Closes on the form the field is holding, on the side the copy leaves free,
  // and names it.
  {
    id: "method",
    ruleY: 0.8,
    tick: 6,
    circles: [
      [0.74, 0.48, 0.17],
      [0.4, 0.7, 0.09],
      [0.5, 0.46, 0.7],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0],
    readout: 1,
  },
  // The photograph is the subject, so it is framed rather than ranged.
  {
    id: "proof",
    ruleY: 0.9,
    tick: 0,
    circles: [
      [0.16, 0.26, 0.05],
      [0.8, 0.72, 0.05],
      [0.5, 0.52, 0.62],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0.05],
    readout: 0,
  },
  {
    id: "deployment",
    ruleY: 0.55,
    tick: 0,
    circles: [
      [0.3, 0.4, 0.12],
      [0.66, 0.56, 0.17],
      [0.5, 0.48, 0.7],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0],
    readout: 0,
  },
  // The one place the circles share a centre, because this section's subject
  // really is something radiating from one: the field is emitting rings behind
  // it on a timer. The wide circle that has been off-frame since the hero
  // arrives here as the outer ring, so the same object bookends the page.
  {
    id: "horizon",
    ruleY: 0.93,
    tick: 0,
    circles: [
      [0.5, 0.5, 0.12],
      [0.5, 0.5, 0.21],
      [0.5, 0.5, 0.31],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0],
    readout: 0,
  },
  // Released: the rings expand outward and the rule leaves through the bottom
  // of the frame, so the instrument exits with the page rather than resetting.
  //
  // The footer is the shortest section on the page and it is the last, so its
  // anchor is clamped to the end of the scroll — roughly 600px after the
  // horizon's rather than the 900 every other pair gets. Anything that asks for
  // a large move here travels faster than the page does and reads as the
  // geometry racing away. An earlier version sent the rule off the bottom at
  // the horizon and brought it back to the top here, which is 1062px of travel
  // across 602px of scroll; this keeps it moving in one direction instead.
  {
    id: "site-footer",
    ruleY: 1.15,
    tick: 0,
    circles: [
      [0.5, 0.5, 0.24],
      [0.5, 0.5, 0.44],
      [0.5, 0.5, 0.58],
    ],
    bracket: [0.12, 0.22, 0.76, 0.56, 0],
    readout: 0,
  },
];

/** Evenly spaced marks along the rule, as fractions of the width. */
const TICKS = [
  0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88,
];

/** The four corners, as unit offsets and the direction their arms run. */
const CORNERS = [
  [0, 0, 1, 1],
  [1, 0, -1, 1],
  [0, 1, 1, -1],
  [1, 1, -1, -1],
] as const;

/**
 * The element whose position actually tracks the document.
 *
 * A pinned section is `position: fixed` for as long as it is pinned, so
 * measuring it gives where it is on screen rather than where it sits in the
 * page — the method's annotation once measured 3200 where the section really
 * begins at 1800. ScrollTrigger leaves a `.pin-spacer` in the flow holding
 * exactly that geometry, so anything pinned is measured through its spacer.
 */
function stableTrigger(section: HTMLElement): HTMLElement {
  const parent = section.parentElement;
  return parent?.classList.contains("pin-spacer") ? parent : section;
}

export default function Instrument() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const rule = svg.querySelector<SVGLineElement>("[data-rule]");
    const ticks = Array.from(svg.querySelectorAll<SVGLineElement>("[data-tick]"));
    const circles = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-circle]"));
    const arms = Array.from(svg.querySelectorAll<SVGLineElement>("[data-arm]"));
    const readout = svg.querySelector<SVGTextElement>("[data-readout]");
    if (!rule || !readout || circles.length < 3) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    /** Scroll offset at which each waypoint's section is centred. */
    let anchors: number[] = [];
    let shown = -1;

    /** Paints one interpolated composition. Allocates nothing. */
    function paint(a: Waypoint, b: Waypoint, t: number) {
      const unit = Math.min(w, h);

      const ruleY = lerp(a.ruleY, b.ruleY, t) * h;
      rule!.setAttribute("y1", `${ruleY}`);
      rule!.setAttribute("y2", `${ruleY}`);
      rule!.setAttribute("x2", `${w}`);

      const tick = lerp(a.tick, b.tick, t);
      ticks.forEach((el, i) => {
        const x = TICKS[i] * w;
        el.setAttribute("x1", `${x}`);
        el.setAttribute("x2", `${x}`);
        el.setAttribute("y1", `${ruleY}`);
        el.setAttribute("y2", `${ruleY + tick}`);
      });

      for (let i = 0; i < 3; i++) {
        const p = a.circles[i];
        const q = b.circles[i];
        circles[i].setAttribute("cx", `${lerp(p[0], q[0], t) * w}`);
        circles[i].setAttribute("cy", `${lerp(p[1], q[1], t) * h}`);
        circles[i].setAttribute("r", `${lerp(p[2], q[2], t) * unit}`);
      }

      const bx = lerp(a.bracket[0], b.bracket[0], t) * w;
      const by = lerp(a.bracket[1], b.bracket[1], t) * h;
      const bw = lerp(a.bracket[2], b.bracket[2], t) * w;
      const bh = lerp(a.bracket[3], b.bracket[3], t) * h;
      const arm = lerp(a.bracket[4], b.bracket[4], t) * unit;
      CORNERS.forEach(([cx, cy, dx, dy], i) => {
        const x = bx + cx * bw;
        const y = by + cy * bh;
        const horizontal = arms[i * 2];
        const vertical = arms[i * 2 + 1];
        horizontal.setAttribute("x1", `${x}`);
        horizontal.setAttribute("y1", `${y}`);
        horizontal.setAttribute("x2", `${x + dx * arm}`);
        horizontal.setAttribute("y2", `${y}`);
        vertical.setAttribute("x1", `${x}`);
        vertical.setAttribute("y1", `${y}`);
        vertical.setAttribute("x2", `${x}`);
        vertical.setAttribute("y2", `${y + dy * arm * 1.4}`);
      });

      // The readout rides just above the rule, wherever the rule currently is.
      readout!.setAttribute("x", `${lerp(a.circles[0][0], b.circles[0][0], t) * w}`);
      readout!.setAttribute("y", `${ruleY - 14}`);
      readout!.setAttribute("opacity", `${lerp(a.readout, b.readout, t)}`);

      // Only meaningful while the method is running, and only changes four
      // times, so it is guarded rather than written every frame.
      const shot = fieldState.shot;
      if (shot !== shown) {
        shown = shot;
        readout!.textContent = fieldReadout[shot] ?? "";
      }
    }

    /** Finds the two waypoints a scroll position falls between, and paints. */
    function apply() {
      if (anchors.length === 0) return;
      const y = window.scrollY;

      if (y <= anchors[0]) return paint(WAYPOINTS[0], WAYPOINTS[0], 0);
      const last = anchors.length - 1;
      if (y >= anchors[last]) return paint(WAYPOINTS[last], WAYPOINTS[last], 0);

      let i = 0;
      while (i < last && y > anchors[i + 1]) i++;
      const span = anchors[i + 1] - anchors[i] || 1;
      // Smoothstepped, so the instrument eases through a waypoint instead of
      // changing direction at it. Linear interpolation between six states
      // produces five visible corners.
      paint(WAYPOINTS[i], WAYPOINTS[i + 1], smoothstep((y - anchors[i]) / span));
    }

    /**
     * The scroll offset at which each section sits in the middle of the frame.
     *
     * Recomputed on every refresh rather than at mount: the method's pin adds
     * 280% of a viewport to the document, so anchors measured before it exists
     * are wrong for everything below it.
     */
    function measure() {
      w = window.innerWidth;
      h = window.innerHeight;
      const max = Math.max(0, document.documentElement.scrollHeight - h);
      anchors = WAYPOINTS.map((wp) => {
        const el = document.getElementById(wp.id);
        if (!el) return 0;
        const box = stableTrigger(el).getBoundingClientRect();
        const top = box.top + window.scrollY;
        return Math.min(max, Math.max(0, top + box.height / 2 - h / 2));
      });
      // Anchors must increase or the search below cannot bracket a position.
      // A short section can otherwise clamp to the same offset as its
      // neighbour, which would divide by a zero span.
      for (let i = 1; i < anchors.length; i++) {
        if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
      }
    }

    gsap.registerPlugin(ScrollTrigger);

    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      measure();
      apply();

      // Held at the opening composition, and never updated. The geometry is
      // still there and still legible; it simply does not track the scroll.
      if (reduced) {
        gsap.set(svg, { opacity: 1 });
        paint(WAYPOINTS[0], WAYPOINTS[0], 0);
        return;
      }

      // The one fade in the layer, and it belongs to the page load rather than
      // to any section: the instrument settles in with the hero's chrome, after
      // the field has resolved, and is never faded again.
      gsap.to(svg, {
        opacity: 1,
        duration: DURATION.slow,
        ease: EASE_OUT_EXPO,
        delay: INTRO.chrome,
      });

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        // No scrub. Lenis already smooths the scroll itself and every position
        // here is derived from it, so mapping straight through is what keeps
        // the instrument locked to the content rather than swimming behind it.
        onUpdate: apply,
        onRefresh: () => {
          measure();
          apply();
        },
      });
    }, svg);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full opacity-0"
    >
      <line
        data-rule
        x1="0"
        y1="0"
        x2="0"
        y2="0"
        stroke="var(--color-ink-faint)"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeDasharray="3 7"
      />

      {TICKS.map((t) => (
        <line
          key={t}
          data-tick
          x1="0"
          y1="0"
          x2="0"
          y2="0"
          stroke="var(--color-ink-faint)"
          strokeOpacity="0.9"
          strokeWidth="1"
        />
      ))}

      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          data-circle
          cx="0"
          cy="0"
          r="0"
          fill="none"
          stroke="var(--color-ink-faint)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
      ))}

      {/* Brackets rather than a closed rectangle: a box reads as a frame around
          a picture, corners read as a region someone has marked out. */}
      {CORNERS.map((_, i) => (
        <g key={i}>
          <line
            data-arm
            x1="0"
            y1="0"
            x2="0"
            y2="0"
            stroke="var(--color-ink-faint)"
            strokeOpacity="0.9"
            strokeWidth="1"
          />
          <line
            data-arm
            x1="0"
            y1="0"
            x2="0"
            y2="0"
            stroke="var(--color-ink-faint)"
            strokeOpacity="0.9"
            strokeWidth="1"
          />
        </g>
      ))}

      <text
        data-readout
        textAnchor="middle"
        opacity="0"
        // `ink-dim`, not the `ink-faint` the strokes use. This is text, and
        // ink-faint measures 2.74:1 on black, well under AA. The hairlines are
        // exempt as decoration; a legible word is not.
        fill="var(--color-ink-dim)"
        className="font-mono text-[10px] uppercase tracking-[0.28em]"
      />
    </svg>
  );
}
