"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { instrument } from "@/lib/fieldState";
import { lerp, prefersReducedMotion, smoothstep } from "@/lib/motion";

/**
 * The instrument's scroll maths. Renders nothing.
 *
 * It owns the waypoints, the anchors and the interpolation, and writes resolved
 * geometry into the shared singleton that `DitherField` paints from. The
 * painting lives in `lib/instrument.ts`; the layer it used to occupy is gone.
 *
 * **It is one object, and it never leaves.** The first version was six SVG
 * groups, one per section, each drawing itself in on enter and retracting on
 * leave: six separate events with nothing carrying between them, which is what
 * made the page read as a set of scenes rather than one continuous shot. The
 * geometry is interpolated from scroll position instead, so nothing appears and
 * nothing goes — one thing moves and reshapes for eight screens.
 *
 * **Absence is length, not opacity.** A tick or a bracket arm at zero length is
 * invisible without ever having faded. The readout is the one exception,
 * because a word cannot be given zero length.
 */

/**
 * One composition, held when its section is centred in the viewport.
 *
 * Fractions, not pixels, so a resize needs no re-measuring: `ruleY` and the
 * bracket are fractions of the viewport, `arm` is a fraction of its short side.
 */
type Waypoint = {
  id: string;
  /** Height of the rule. Above 1 parks it below the frame. */
  ruleY: number;
  /** Tick length in px at rest. */
  tick: number;
  /** Region of interest, and the arm length that reveals it. */
  bracket: readonly [x: number, y: number, w: number, h: number, arm: number];
  readout: number;
  /** Where the readout sits across the frame. */
  readoutX: number;
};

const NO_BRACKET = [0.12, 0.22, 0.76, 0.56, 0] as const;

const WAYPOINTS: Waypoint[] = [
  // Under the wordmark, on a scale.
  { id: "hero", ruleY: 0.62, tick: 6, bracket: NO_BRACKET, readout: 0, readoutX: 0.5 },
  // High and quiet. This section is a paragraph to be read, so the instrument
  // gets out of the way rather than inventing something to point at.
  { id: "thesis", ruleY: 0.22, tick: 0, bracket: NO_BRACKET, readout: 0, readoutX: 0.5 },
  // Below the copy, naming the form the field is holding.
  { id: "method", ruleY: 0.8, tick: 6, bracket: NO_BRACKET, readout: 1, readoutX: 0.74 },
  // The photograph is the subject, so it gets framed.
  {
    id: "proof",
    ruleY: 0.9,
    tick: 0,
    bracket: [0.12, 0.22, 0.76, 0.56, 0.05],
    readout: 0,
    readoutX: 0.5,
  },
  { id: "deployment", ruleY: 0.55, tick: 0, bracket: NO_BRACKET, readout: 0, readoutX: 0.5 },
  { id: "horizon", ruleY: 0.93, tick: 0, bracket: NO_BRACKET, readout: 0, readoutX: 0.5 },
  // Released: the rule leaves through the bottom of the frame, so the
  // instrument exits with the page rather than resetting to the top. The footer
  // is the shortest section and the last, so its anchor is clamped to the end of
  // the scroll and gets roughly 600px rather than the 900 every other pair has;
  // anything asking for a large move here travels faster than the page does.
  { id: "site-footer", ruleY: 1.15, tick: 0, bracket: NO_BRACKET, readout: 0, readoutX: 0.5 },
];

/**
 * How quickly the trailing rule catches the leading one, per frame.
 *
 * Low enough that a flick visibly separates the pair and stillness closes it.
 */
const FOLLOW_EASE = 0.055;

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
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let w = window.innerWidth;
    let h = window.innerHeight;
    let anchors: number[] = [];

    function resolve(a: Waypoint, b: Waypoint, t: number) {
      const unit = Math.min(w, h);
      instrument.ruleY = lerp(a.ruleY, b.ruleY, t) * h;
      instrument.tick = lerp(a.tick, b.tick, t);
      instrument.bracketX = lerp(a.bracket[0], b.bracket[0], t) * w;
      instrument.bracketY = lerp(a.bracket[1], b.bracket[1], t) * h;
      instrument.bracketW = lerp(a.bracket[2], b.bracket[2], t) * w;
      instrument.bracketH = lerp(a.bracket[3], b.bracket[3], t) * h;
      instrument.arm = lerp(a.bracket[4], b.bracket[4], t) * unit;
      instrument.readout = lerp(a.readout, b.readout, t);
      instrument.readoutX = lerp(a.readoutX, b.readoutX, t) * w;
    }

    /** Finds the two waypoints a scroll position falls between. */
    function apply() {
      if (anchors.length === 0) return;
      const y = window.scrollY;
      const last = anchors.length - 1;

      if (y <= anchors[0]) return resolve(WAYPOINTS[0], WAYPOINTS[0], 0);
      if (y >= anchors[last]) {
        return resolve(WAYPOINTS[last], WAYPOINTS[last], 0);
      }

      let i = 0;
      while (i < last && y > anchors[i + 1]) i++;
      const span = anchors[i + 1] - anchors[i] || 1;
      // Smoothstepped, so the instrument eases through a waypoint instead of
      // changing direction at it. Linear interpolation between seven states
      // produces six visible corners.
      resolve(WAYPOINTS[i], WAYPOINTS[i + 1], smoothstep((y - anchors[i]) / span));
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
      // Anchors must increase or the search above cannot bracket a position: a
      // short section can otherwise clamp onto its neighbour and divide by zero.
      for (let i = 1; i < anchors.length; i++) {
        if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
      }
    }

    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      measure();
      apply();
      instrument.followY = instrument.ruleY;

      // Held at the opening composition and never updated. The geometry is
      // still drawn and still legible; it simply does not track the scroll.
      if (reduced) return;

      // The trailing rule is a clock, not a scroll position, so it runs on the
      // ticker the whole page already shares rather than on its own loop.
      const follow = () => {
        instrument.followY += (instrument.ruleY - instrument.followY) * FOLLOW_EASE;
      };
      gsap.ticker.add(follow);

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        // No scrub. Lenis already smooths the scroll and every position here is
        // derived from it, so mapping straight through is what keeps the
        // instrument locked to the content rather than swimming behind it.
        onUpdate: apply,
        onRefresh: () => {
          measure();
          apply();
        },
      });

      return () => gsap.ticker.remove(follow);
    });

    return () => ctx.revert();
  }, []);

  return null;
}
