"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { instrument } from "@/lib/fieldState";
import { lerp, prefersReducedMotion, smoothstep } from "@/lib/motion";
// A pinned section is `position: fixed` while pinned, so measuring it gives
// where it is on screen rather than where it sits in the page: the method's
// annotation once measured 3200 where the section really begins at 1800. The
// rail's index needs the identical correction, so it lives in one place now.
import { stableTrigger } from "@/lib/scroll";

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
 * **Absence is length, not opacity.** A tick at zero length is invisible
 * without ever having faded. The readout is the one exception, because a word
 * cannot be given zero length.
 *
 * There used to be a corner bracket here as well, marking out a region of the
 * frame. It had exactly one user, the proof beat's photograph, and that beat is
 * gone (see page.tsx). Every remaining waypoint carried it at zero arm, so it
 * drew nothing on any screen; the geometry, the interpolation and the painting
 * are all removed rather than left as four dead numbers per pose.
 */

/**
 * One composition, held when its section is centred in the viewport.
 *
 * Fractions, not pixels, so a resize needs no re-measuring: `ruleY` is a
 * fraction of the viewport height and `readoutX` of its width.
 */
type Waypoint = {
  id: string;
  /**
   * Anchor this waypoint at a fraction of a named ScrollTrigger's range instead
   * of at the centre of a section.
   *
   * A section centre is the right anchor for a section that holds one
   * composition, and the wrong one for a section that holds four. The method
   * pins for 280% of a viewport and plays four shots inside that, but it had a
   * single waypoint anchored at the centre of its spacer, so the instrument's
   * method pose peaked at the halfway point of the sequence: the readout naming
   * the form on screen sat at 0.40 opacity through the first shot, reached full
   * where the field was mid-handover and holding nothing in particular, and was
   * back down to 0.38 through the last. It was also still travelling in from
   * the thesis for the whole of shot one, and already leaving for the section
   * below before shot three had begun.
   */
  trackP?: number;
  /** Height of the rule. Above 1 parks it below the frame. */
  ruleY: number;
  /** Tick length in px at rest. */
  tick: number;
  readout: number;
  /** Where the readout sits across the frame. */
  readoutX: number;
};

/**
 * The trigger the method's waypoints are anchored to. Created in Method.tsx.
 */
const METHOD_TRIGGER = "method";

const WAYPOINTS: Waypoint[] = [
  // Under the wordmark, on a scale.
  { id: "hero", ruleY: 0.62, tick: 6, readout: 0, readoutX: 0.5 },
  // High and quiet. This section is a paragraph to be read, so the instrument
  // gets out of the way rather than inventing something to point at.
  { id: "thesis", ruleY: 0.22, tick: 0, readout: 0, readoutX: 0.5 },
  // Four poses for four shots, anchored inside the pin at the middle of each.
  // The readout holds at full across all of them, because there is something
  // named on screen for the whole of the sequence; what changes is where the
  // rule sits and how much scale it carries, so the instrument reads as one
  // thing following the work rather than as one thing sliding past it.
  { id: "method", trackP: 0.13, ruleY: 0.79, tick: 7, readout: 1, readoutX: 0.74 },
  { id: "method", trackP: 0.44, ruleY: 0.83, tick: 4, readout: 1, readoutX: 0.7 },
  // The one shot boundary at which the readout's *text* changes. Dipped, so the
  // word swaps at its dimmest rather than snapping from one legible label to
  // another. There used to be a second dip at 0.26, for the source-to-engram
  // change; with the engram gone the first two shots share a readout and there
  // is nothing to hide there, so a dip would be the instrument flinching at
  // nothing.
  { id: "method", trackP: 0.52, ruleY: 0.84, tick: 3, readout: 0.12, readoutX: 0.73 },
  { id: "method", trackP: 0.7, ruleY: 0.86, tick: 4, readout: 1, readoutX: 0.76 },
  { id: "method", trackP: 0.92, ruleY: 0.88, tick: 8, readout: 1, readoutX: 0.76 },
  { id: "deployment", ruleY: 0.55, tick: 0, readout: 0, readoutX: 0.5 },
  { id: "vision", ruleY: 0.93, tick: 0, readout: 0, readoutX: 0.5 },
  // Released: the rule leaves through the bottom of the frame, so the
  // instrument exits with the page rather than resetting to the top. The footer
  // is the shortest section and the last, so its anchor is clamped to the end of
  // the scroll and gets roughly 600px rather than the 900 every other pair has;
  // anything asking for a large move here travels faster than the page does.
  { id: "site-footer", ruleY: 1.15, tick: 0, readout: 0, readoutX: 0.5 },
];

/**
 * How quickly the trailing rule catches the leading one, per frame.
 *
 * Low enough that a flick visibly separates the pair and stillness closes it.
 */
const FOLLOW_EASE = 0.055;

export default function Instrument() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let w = window.innerWidth;
    let h = window.innerHeight;
    let anchors: number[] = [];

    function resolve(a: Waypoint, b: Waypoint, t: number) {
      instrument.ruleY = lerp(a.ruleY, b.ruleY, t) * h;
      instrument.tick = lerp(a.tick, b.tick, t);
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
        // A tracked waypoint takes its position from a trigger's own range, so
        // the instrument moves on the sequence's clock rather than on the
        // section's. `getById` returns undefined below the pin threshold, where
        // the method stacks and there is no sequence to track; the section
        // centre is the right fallback there because that layout really does
        // hold one composition.
        if (wp.trackP !== undefined) {
          const st = ScrollTrigger.getById(METHOD_TRIGGER);
          if (st) {
            const at = st.start + (st.end - st.start) * wp.trackP;
            return Math.min(max, Math.max(0, at));
          }
        }
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
