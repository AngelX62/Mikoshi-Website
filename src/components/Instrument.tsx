"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { instrument } from "@/lib/fieldState";
import {
  formBand,
  formSpan,
  sourceWorkPoint,
  targetWorkPoint,
} from "@/lib/forms";
import { SCROLL, lerp, prefersReducedMotion, smoothstep } from "@/lib/motion";
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
  /**
   * Which registered trigger `trackP` is a fraction of. Defaults to the method.
   *
   * This exists because tracking is the only way to give one section more than
   * one pose. `measure` resolves an untracked waypoint to its section's centre,
   * so two waypoints sharing an id would resolve to the *same* scroll offset
   * and then be forced 1px apart by the monotonic clamp below, turning what
   * should be a section-long interpolation into a snap.
   */
  track?: string;
  /** Height of the rule. Above 1 parks it below the frame. */
  ruleY: number;
  /**
   * How far to hold the trailing rule off this one, in px. See
   * `instrument.followOffset`, which explains why the vision has one and
   * nothing else does.
   */
  followOffset?: number;
  /** Tick length in px at rest. */
  tick: number;
  readout: number;
  /** Where the readout sits across the frame. */
  readoutX: number;
  /**
   * Which form's work point the leader lands on, and how present it is.
   *
   * A name rather than a coordinate, because the coordinate depends on the
   * viewport and these poses do not. `resolve` turns the name into pixels
   * through the same functions the key light uses, so the leader points exactly
   * where the light is lit.
   *
   * Interpolating between a waypoint that names the source and one that names
   * the target sweeps the landing point from one form to the other, which is
   * the retract-and-redraw a shot change wants and costs nothing to get.
   */
  leader?: "source" | "target";
  leaderGain?: number;
  /** The dimension line across the target. Only the qualifying shot draws one. */
  spanGain?: number;
};

/**
 * The trigger the method's waypoints are anchored to. Created in Method.tsx.
 */
const METHOD_TRIGGER = "method";

/**
 * The trigger the vision's waypoints are anchored to. Created in Vision.tsx.
 *
 * The vision needs three poses rather than one, so like the method it has to
 * track a range instead of resolving to a section centre. Unlike the method it
 * is not pinned, so the trigger is just the section's own passage through the
 * viewport and exists for no other reason than this.
 */
const VISION_TRIGGER = "vision";

/**
 * How far apart the vision holds its two rules, in px, and which way.
 *
 * Large enough to read as two lines at a glance rather than as one line drawn
 * badly, small enough to read as a discrepancy rather than as two unrelated
 * rules. The trailing rule is drawn fainter than the leading one, which is what
 * makes the pair an expectation and a measurement rather than a pair of equals.
 *
 * **Negative, so the trailing rule sits above.** Positive was tried first and
 * costs 48px of clear field: 14 for the readout hanging above the leading rule,
 * then 34 down to the trailing one. The only clear band at the hold pose is the
 * 64px between the last beat and the disclosure control, which left 8px of
 * slack at each end, and measurement put the trailing rule at 511 against the
 * control's own dashed rule at 510. One pixel apart is the worst available
 * answer: two near-parallel dashed lines a few pixels apart read as a mistake
 * rather than as a drawing.
 *
 * Inverted, the whole assembly is 34px tall instead of 48 and the readout falls
 * *inside* the gap rather than above it, which is where a residual's label
 * belongs anyway. It is also the right way round: the expectation sits above
 * the measurement that failed to meet it.
 */
const RESIDUAL = -34;

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
  // The leader rides with the readout. Where the word names a form, the line
  // says which part of it, so the pair reads as one annotation rather than as a
  // caption floating near a picture.
  { id: "method", trackP: 0.13, ruleY: 0.79, tick: 7, readout: 1, readoutX: 0.74, leader: "source", leaderGain: 0.9 },
  { id: "method", trackP: 0.44, ruleY: 0.83, tick: 4, readout: 1, readoutX: 0.7, leader: "source", leaderGain: 1 },
  // The one shot boundary at which the readout's *text* changes. Dipped, so the
  // word swaps at its dimmest rather than snapping from one legible label to
  // another. There used to be a second dip at 0.26, for the source-to-engram
  // change; with the engram gone the first two shots share a readout and there
  // is nothing to hide there, so a dip would be the instrument flinching at
  // nothing.
  // The leader dips with the word and names the target on the far side of the
  // dip, so the landing point sweeps from one form to the other underneath the
  // one moment both are at their faintest. The handover happens where nobody is
  // reading, which is the same reason the dip exists at all.
  { id: "method", trackP: 0.52, ruleY: 0.84, tick: 3, readout: 0.12, readoutX: 0.73, leader: "target", leaderGain: 0.1 },
  { id: "method", trackP: 0.7, ruleY: 0.86, tick: 4, readout: 1, readoutX: 0.76, leader: "target", leaderGain: 1 },
  // Qualify. The instrument stops pointing and measures: a dimension line across
  // the cell it has just watched being built, reading what the step is actually
  // about. Everything below this waypoint carries no span, so it fades out with
  // the section rather than being switched off.
  { id: "method", trackP: 0.92, ruleY: 0.88, tick: 8, readout: 1, readoutX: 0.76, leader: "target", leaderGain: 1, spanGain: 1 },
  { id: "deployment", ruleY: 0.55, tick: 0, readout: 0, readoutX: 0.5 },
  // The vision, and the one place the pair of rules means something.
  //
  // This was a single bare hairline at 0.93 with no scale and no word: present,
  // and measuring nothing. That was survivable while the section argued that
  // proven work moves to a new body. It is not now that it argues discovery,
  // because the new thesis *is* a gap. A machine that notices reality has
  // stopped matching what it expected is an expectation and a measurement that
  // disagree, which is the oldest thing an instrument draws, and this one has
  // owned two rules all along.
  //
  // So the trailing rule is held off the leading one instead of easing shut,
  // the scale comes back, and the word on the gap is `fieldResidual`. Three
  // poses: open it, hold it while the argument is read, close it at the
  // bookend, where the copy reaches "It finds the edge of what is known, and
  // learns what comes next."
  //
  // Holding is the part that matters. Everywhere else the second rule is an
  // artifact of scrolling and vanishes the moment you stop, so reading a
  // section means looking at one line. Here, standing still and reading means
  // looking at an unresolved measurement for as long as the argument takes.
  // Heights measured against the hold pose rather than chosen, because the hold
  // pose is the one a reader stops at. At 1440x900 the last beat ends at 446 and
  // the disclosure's rule sits at 510, so the clear band is those 64px and the
  // 34px assembly centres in it at 0.55: trailing rule 461, readout 481, leading
  // rule 495, with 15px of air at each end.
  //
  // 0.34 was measured first and put the trailing rule straight through "A robot
  // that meets something it was not taught fails without knowing why." A hairline
  // across a line of body copy reads as a strikethrough on the one sentence a
  // reader is most likely to be looking at.
  { id: "vision", track: VISION_TRIGGER, trackP: 0.1, ruleY: 0.51, followOffset: RESIDUAL, tick: 5, readout: 1, readoutX: 0.76 },
  { id: "vision", track: VISION_TRIGGER, trackP: 0.55, ruleY: 0.55, followOffset: RESIDUAL, tick: 5, readout: 1, readoutX: 0.78 },
  // Resolved. `readout` and `followOffset` reach zero from this same pair
  // through the same smoothstep, which is what lets DitherField pick the word
  // off the offset without the method's stale label flashing on the way out.
  { id: "vision", track: VISION_TRIGGER, trackP: 0.95, ruleY: 0.6, followOffset: 0, tick: 3, readout: 0, readoutX: 0.78 },
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
      // **Annotation only where the copy is beside the form.**
      //
      // `frame` puts the form in the right-hand pane above the pin threshold and
      // centres it below, where the copy sits on top of it. A leader drawn into
      // a centred form would cross body text on its way, and a dimension line
      // would run under a paragraph. Both are off in that layout, so the
      // narrow arrangement loses an annotation rather than gaining a mess.
      const wide = w >= SCROLL.pinMinWidth;

      instrument.ruleY = lerp(a.ruleY, b.ruleY, t) * h;

      // The residual, and the same rule applies to it for the same reason.
      //
      // Its readout sits at 0.78 of the width, which is clear air at 1440 where
      // the vision's copy takes a left column, and straight through the copy at
      // 390 where the copy takes the frame. Measured on a phone: UNEXPLAINED
      // landed on top of "MIKOSHI is building machines that".
      //
      // The two rules themselves are harmless at any width, since a full-width
      // hairline behind type is what every other section already draws. It is
      // the word that collides, and a labelled gap is the whole point, so the
      // pair goes with it rather than standing there unexplained in the other
      // sense. Narrow screens keep the single bare rule this section used to
      // have everywhere.
      //
      // In pixels rather than a fraction of the height, because this is a gap
      // between two lines and not a position in the frame. A residual that grew
      // with the viewport would read as a different measurement on a taller
      // screen, which is the opposite of what an instrument does.
      const residualA = a.followOffset ?? 0;
      const residualB = b.followOffset ?? 0;
      instrument.followOffset = wide ? lerp(residualA, residualB, t) : 0;

      instrument.tick = lerp(a.tick, b.tick, t);
      // A pose carrying a residual owns its readout, so the readout goes when
      // the residual does. Without this the word falls back to whatever the
      // field last named, and the vision captions its own rule "Target cell".
      const carriesResidual = residualA !== 0 || residualB !== 0;
      instrument.readout =
        carriesResidual && !wide ? 0 : lerp(a.readout, b.readout, t);
      instrument.readoutX = lerp(a.readoutX, b.readoutX, t) * w;

      // Recomputed per resolve rather than cached against the viewport: this is
      // four multiplies inside a function that already interpolates five values,
      // and a cache here would be one more thing to invalidate on resize.
      const source = sourceWorkPoint(w, h);
      const target = targetWorkPoint(w, h);
      const landing = (wp: Waypoint) =>
        wp.leader === "target" ? target : source;
      const from = landing(a);
      const to = landing(b);

      instrument.leaderX = lerp(from[0], to[0], t);
      instrument.leaderY = lerp(from[1], to[1], t);
      instrument.leaderGain = wide
        ? lerp(a.leaderGain ?? 0, b.leaderGain ?? 0, t)
        : 0;

      const [left, right] = formSpan(w, h);
      instrument.spanX0 = left;
      instrument.spanX1 = right;
      // Above the part, not below it. Below, the run would cross the leader on
      // its way up from the rule, and two dashed things crossing at a shallow
      // angle reads as a mistake rather than as a drawing.
      instrument.spanY = formBand(w, h)[0] - 26;
      instrument.spanGain = wide
        ? lerp(a.spanGain ?? 0, b.spanGain ?? 0, t)
        : 0;
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
          const st = ScrollTrigger.getById(wp.track ?? METHOD_TRIGGER);
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
      // Seeded at the target rather than at `ruleY`, so a reload partway down
      // the page opens with the pair already where it belongs instead of easing
      // apart over the first forty frames of a composition the reader did not
      // scroll to.
      instrument.followY = instrument.ruleY + instrument.followOffset;

      // Held at the opening composition and never updated. The geometry is
      // still drawn and still legible; it simply does not track the scroll.
      if (reduced) return;

      // The trailing rule is a clock, not a scroll position, so it runs on the
      // ticker the whole page already shares rather than on its own loop.
      //
      // It chases `ruleY + followOffset`, which is `ruleY` everywhere except
      // the vision. That one addition is the difference between a lag and a
      // residual: with a target of `ruleY` the pair can only ever be apart
      // while the page is moving, and the vision needs it apart while the page
      // is still. It also means the gap opens and shuts on the easing that is
      // already here, over roughly forty frames, rather than on a new tween.
      const follow = () => {
        const target = instrument.ruleY + instrument.followOffset;
        instrument.followY += (target - instrument.followY) * FOLLOW_EASE;
      };
      gsap.ticker.add(follow);

      ScrollTrigger.create({
        // **Refreshes last, and it has to.**
        //
        // `measure` reads `start` and `end` off the method's and the vision's
        // triggers to place their tracked waypoints. ScrollTrigger refreshes in
        // priority order, so at the default 0 this can run before those two have
        // recalculated and read their previous layout's numbers.
        //
        // The failure is not subtle. Reproduced by loading at 1064 wide and
        // resizing to 1440: the vision's anchors came back from the old, shorter
        // document at roughly 3300 to 4200, landing *before* the freshly measured
        // deployment anchor at 5286. The monotonic clamp below then squashed all
        // three vision poses into 5287, 5288, 5289, so anywhere in the vision
        // resolved to the pose after them and the instrument went dead: no
        // readout, no scale, no rules. Measured at the hold pose, the two rules
        // dropped from 15.81 and 15.05 to 0 and 2.29.
        //
        // A negative priority puts this after every default-priority trigger,
        // which is all of them.
        refreshPriority: -1,
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
