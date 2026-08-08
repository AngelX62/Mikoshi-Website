"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fieldReadout } from "@/content";
import { fieldState } from "@/lib/fieldState";
import { DURATION, EASE_OUT_EXPO, prefersReducedMotion } from "@/lib/motion";

/**
 * The instrument layer.
 *
 * Thin annotation geometry drawn over the field: a dashed rule with a scale on
 * it, ranging circles, corner brackets. It is the thing the page was missing.
 * Every section was a heading and a paragraph centred in a box, with a field
 * behind it that nothing acknowledged, and a page where nothing measures
 * anything reads as flat however good the field is.
 *
 * It is also not decoration for its own sake. MIKOSHI's fourth step is to
 * physically qualify the result, and a company that sells judgement about
 * whether work is good should look like something being measured.
 *
 * **Fixed, like the canvas.** The geometry annotates the *field*, not the copy,
 * and the field is a fixed full-viewport canvas, so the two have to share a
 * coordinate space. Content scrolls through the instrument rather than carrying
 * it along.
 *
 * **Decorative, and only decorative.** No text here duplicates or replaces
 * anything in the document: the sections keep their own labels and headings,
 * this adds readouts that say what the field is doing. The whole layer is
 * `aria-hidden` and carries no information a reader would miss.
 */

/**
 * Positions are viewport percentages, which is what lets a fixed SVG stay
 * correct at any size without measuring anything. SVG resolves a percentage
 * radius against the normalised diagonal, so circles stay circular rather than
 * stretching with the aspect ratio.
 */
type Group = {
  /** Section whose scroll range switches this group on. */
  id: string;
  /** Height of the dashed rule, if there is one. */
  ruleY?: number;
  /** Ranging circles, drawn on as the group arrives. */
  reticle?: { x: number; y: number; r: number }[];
  /** Corner brackets around a region. */
  bracket?: { x: number; y: number; w: number; h: number };
  /** Tick marks along the rule. */
  ticks?: boolean;
};

const GROUPS: Group[] = [
  // The wordmark, ranged and sitting on a scale. Overlapping rather than
  // concentric, and one of them running off the frame: two circles sharing a
  // centre read as a gunsight, which is a different and much more literal
  // picture than the reference's, where the geometry looks like it was struck
  // over the image afterwards by someone working something out.
  {
    id: "hero",
    ruleY: 62,
    ticks: true,
    reticle: [
      { x: 38, y: 41, r: 11 },
      { x: 63, y: 54, r: 17 },
    ],
  },
  { id: "thesis", ruleY: 14, reticle: [{ x: 84, y: 74, r: 8 }] },
  // Sits over the form the method holds, on the side the copy leaves free.
  {
    id: "method",
    ruleY: 86,
    ticks: true,
    reticle: [{ x: 74, y: 48, r: 13 }],
  },
  // The photograph is the subject here, so it gets framed rather than ranged.
  {
    id: "proof",
    bracket: { x: 12, y: 22, w: 76, h: 56 },
    reticle: [{ x: 12, y: 22, r: 4 }],
  },
  // Low enough to pass under the copy block rather than through the display
  // type. The instrument is fixed and the content scrolls, so a rule will cross
  // something eventually; what it must not do is cut a headline in half.
  { id: "deployment", ruleY: 42, ticks: true },
  {
    id: "horizon",
    // Concentric here, unlike the hero, because this section's subject really
    // is something radiating from a centre: the field is emitting rings behind
    // it on a timer, and the geometry is drawing the same picture.
    reticle: [
      { x: 50, y: 50, r: 9 },
      { x: 50, y: 50, r: 16 },
      { x: 50, y: 50, r: 23 },
    ],
  },
];

/** Evenly spaced marks along a rule, as viewport percentages. */
const TICKS = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88];

/**
 * The element whose position actually tracks the document.
 *
 * A pinned section is `position: fixed` for the whole time it is pinned, so
 * measuring it gives where it is on screen rather than where it sits in the
 * page. A second ScrollTrigger reading that gets a start and end that follow
 * the viewport around, which is why the method's annotation never appeared: its
 * trigger measured 3200 where the section really begins at 1800.
 *
 * ScrollTrigger leaves a `.pin-spacer` behind in the flow holding exactly that
 * geometry, so anything pinned is measured through its spacer instead. Sections
 * that are not pinned have no spacer and are measured directly.
 */
function stableTrigger(section: HTMLElement): HTMLElement {
  const parent = section.parentElement;
  return parent?.classList.contains("pin-spacer") ? parent : section;
}

/**
 * A dashed rule across the frame, optionally carrying a scale.
 *
 * The one device lifted most directly from the reference: a hairline running
 * the full width with marks on it, which turns a background into something with
 * a measured horizon.
 */
function Rule({ y, ticks }: { y: number; ticks?: boolean }) {
  return (
    <g data-rule>
      <line
        x1="0"
        x2="100%"
        y1={`${y}%`}
        y2={`${y}%`}
        stroke="var(--color-ink-faint)"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeDasharray="3 7"
      />
      {ticks &&
        TICKS.map((t) => (
          <line
            key={t}
            x1={`${t}%`}
            x2={`${t}%`}
            y1={`${y}%`}
            y2={`${y + 0.7}%`}
            stroke="var(--color-ink-faint)"
            strokeOpacity="0.9"
            strokeWidth="1"
          />
        ))}
    </g>
  );
}

export default function Instrument() {
  const ref = useRef<SVGSVGElement>(null);
  const readoutRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    gsap.registerPlugin(ScrollTrigger);

    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      GROUPS.forEach((spec) => {
        const group = svg.querySelector<SVGGElement>(`[data-group="${spec.id}"]`);
        const section = document.getElementById(spec.id);
        if (!group || !section) return;

        // Arrays, not NodeLists: not every group has both kinds of geometry,
        // and GSAP warns on an empty target rather than ignoring it.
        const drawn = Array.from(
          group.querySelectorAll<SVGGeometryElement>("[data-draw]"),
        );
        // The rule keeps its dash pattern, so it cannot also use the dash
        // offset to arrive. It scales out from its left edge instead.
        const rules = Array.from(
          group.querySelectorAll<SVGGElement>("[data-rule]"),
        );

        if (reduced) {
          gsap.set(group, { opacity: 1 });
          if (drawn.length) gsap.set(drawn, { strokeDashoffset: 0 });
          if (rules.length) gsap.set(rules, { scaleX: 1 });
          return;
        }

        gsap.set(group, { opacity: 0 });
        if (drawn.length) gsap.set(drawn, { strokeDashoffset: 1 });
        if (rules.length) {
          gsap.set(rules, { scaleX: 0, transformOrigin: "left center" });
        }

        const tl = gsap.timeline({ paused: true });
        tl.to(group, { opacity: 1, duration: DURATION.base });
        if (rules.length) {
          tl.to(
            rules,
            { scaleX: 1, duration: DURATION.cinematic, ease: EASE_OUT_EXPO },
            0,
          );
        }
        if (drawn.length) {
          tl.to(
            drawn,
            {
              strokeDashoffset: 0,
              duration: DURATION.cinematic,
              ease: EASE_OUT_EXPO,
              stagger: 0.09,
            },
            0.1,
          );
        }

        const trigger = ScrollTrigger.create({
          trigger: stableTrigger(section),
          start: "top 65%",
          end: "bottom 35%",
          onEnter: () => tl.play(),
          onEnterBack: () => tl.play(),
          // Reversed rather than cut, so the geometry retracts the way it drew.
          onLeave: () => tl.reverse(),
          onLeaveBack: () => tl.reverse(),
        });

        // A trigger created while already inside its own range never fires
        // `onEnter`, because nothing crossed. Without this, anyone who reloads
        // part-way down the page or arrives on a link to a section gets no
        // instrument at all: every group sits at zero for the rest of the
        // visit. Jumped rather than played, since the geometry should already
        // be in place by the time they got here, not arriving late.
        if (trigger.isActive) tl.progress(1).pause();
      });

      // The method's readout follows the shot the field is holding. It reads
      // the same mutable singleton the canvas does rather than taking a prop,
      // because this changes on every scrub frame and must not render React.
      const readout = readoutRef.current;
      const methodSection = document.getElementById("method");
      if (readout && methodSection) {
        let shown = -1;
        const sync = () => {
          const i = fieldState.shot;
          if (i === shown) return;
          shown = i;
          readout.textContent = fieldReadout[i] ?? "";
        };
        sync();
        ScrollTrigger.create({
          trigger: stableTrigger(methodSection),
          start: "top bottom",
          end: "bottom top",
          onUpdate: sync,
        });
      }
    }, svg);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
    >
      {GROUPS.map((spec) => (
        <g key={spec.id} data-group={spec.id} opacity="0">
          {spec.ruleY !== undefined && (
            <Rule y={spec.ruleY} ticks={spec.ticks} />
          )}

          {spec.reticle?.map((circle, i) => (
            <circle
              key={i}
              data-draw
              cx={`${circle.x}%`}
              cy={`${circle.y}%`}
              r={`${circle.r}%`}
              fill="none"
              stroke="var(--color-ink-faint)"
              strokeOpacity="0.5"
              strokeWidth="1"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          ))}

          {spec.bracket &&
            /* Four corners, each two strokes. Brackets rather than a full
               rectangle: a closed box reads as a frame around a picture, and
               corners read as a region someone has marked out. */
            (
              [
                [0, 0, 1, 1],
                [1, 0, -1, 1],
                [0, 1, 1, -1],
                [1, 1, -1, -1],
              ] as const
            ).map(([cx, cy, dx, dy], i) => {
              const x = spec.bracket!.x + cx * spec.bracket!.w;
              const y = spec.bracket!.y + cy * spec.bracket!.h;
              return (
                <g key={i}>
                  <line
                    data-draw
                    x1={`${x}%`}
                    y1={`${y}%`}
                    x2={`${x + dx * 4}%`}
                    y2={`${y}%`}
                    stroke="var(--color-ink-faint)"
                    strokeOpacity="0.9"
                    strokeWidth="1"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset="1"
                  />
                  <line
                    data-draw
                    x1={`${x}%`}
                    y1={`${y}%`}
                    x2={`${x}%`}
                    y2={`${y + dy * 6}%`}
                    stroke="var(--color-ink-faint)"
                    strokeOpacity="0.9"
                    strokeWidth="1"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset="1"
                  />
                </g>
              );
            })}

          {spec.id === "method" && (
            <text
              ref={readoutRef}
              x="74%"
              y="86%"
              dy="-10"
              textAnchor="middle"
              // `ink-dim`, not the `ink-faint` the strokes use. This is text,
              // and ink-faint measures 2.74:1 on black, well under AA. The
              // hairlines are exempt as decoration; a legible word is not.
              fill="var(--color-ink-dim)"
              className="font-mono text-[10px] uppercase tracking-[0.28em]"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
