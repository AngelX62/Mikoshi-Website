"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { method } from "@/content";
import SectionLabel from "./SectionLabel";
import { channels, fieldState, releaseChannel } from "@/lib/fieldState";
import {
  FORM_SPLIT,
  formBand,
  formUnit,
  sourceWorkPoint,
  targetWorkPoint,
} from "@/lib/forms";
import {
  SCROLL,
  clamp,
  lerp,
  norm,
  prefersReducedMotion,
  smoothstep,
} from "@/lib/motion";

/**
 * The method.
 *
 * Four ordered steps, scrubbed through one pinned viewport. The field behind
 * the copy carries the argument: it holds a working cell while the work is read
 * off it, then a different cell running the same job, then that cell being
 * checked. The text names what is happening; the field is what actually
 * happens.
 *
 * **One form becomes the next along a line.** The earlier version cross-faded
 * three independent gains, and cross-fading two silhouettes means each is at
 * half strength through the middle of the handover, which samples down to
 * noise. Backing them off far enough to avoid that opened a hole instead:
 * measured at 1920, total form gain fell to 0.17 for about 200px of scroll at
 * the handover, so step 03's copy announced a new body over an empty frame, and
 * the ground wash (suppressed by form presence) swelled into the gap.
 *
 * So a handover is a wipe. A line crosses the frame; ahead of it the old cell
 * is still standing, behind it the new one has already resolved. Presence stays
 * at one throughout, there is no hole and nothing for the wash to react to, and
 * the line finally has a job — it was previously a bright band sweeping across
 * the body copy for no reason but decoration.
 *
 * **Every shot has a light, and the light is doing something.** Reading down
 * the source, closing onto the work point, crossing from the old work point to
 * the new one, verifying the finished cell. Shots two and three once held no
 * motion at all, and shot two now carries the whole of its beat, since the
 * frame behind it holds the same silhouette as the shot before.
 *
 * Shapes are written to `fieldState`, a mutable singleton the canvas polls once
 * per frame, so scrubbing never re-renders React. The DOM writes below go
 * straight to style properties for the same reason.
 */

/**
 * The sequence, as fractions of the pinned range.
 *
 * Each shot holds one form; each sweep hands one form to the next along the
 * line. A sweep straddles the copy boundary that follows it, so the word
 * changes and then the picture follows it down the frame.
 */
const SHOTS = [
  { from: 0.0, to: 0.26 },
  { from: 0.26, to: 0.52 },
  { from: 0.52, to: 0.78 },
  { from: 0.78, to: 1.0 },
] as const;

/**
 * The one handover, at the 02/03 boundary.
 *
 * There used to be two, because there used to be three forms. The Work Engram
 * has been cut (see the note where it used to live in lib/forms.ts), so the
 * source cell holds through the reconstruct step and hands over once, when the
 * copy announces a different body.
 */
const SWEEPS = [
  { from: 0.52, to: 0.62, out: "maskSource", in: "maskTarget" },
] as const;

/**
 * The two passes in which the light reads a form rather than replacing it:
 * observing the source, and qualifying the target.
 *
 * The first runs from the start of the section to `PASS_END`, the second from
 * `PASS_START` to the end, which leaves the middle of the sequence to the
 * reconstruct hold and the handover.
 */
const PASS_END = 0.245;
const PASS_START = 0.79;

/**
 * Reduced motion holds this progress instead of scrubbing. It sits inside the
 * third shot, where the target form is fully resolved, because a single frame
 * should show the thing the sequence exists to prove.
 */
const STILL = 0.7;

/**
 * Feather half-width of the wipe line, in CSS pixels.
 *
 * Wide enough that the edge reads as a transition rather than as a cut, narrow
 * enough that the two forms are never both fully present over the same cell.
 */
const WIPE_SOFT = 90;

/**
 * Radius of the key light, as a fraction of the form box's short side.
 *
 * A core has to be smaller than the thing it is the core of. At 0.62 the lit
 * disc was 265px across a machine 205px wide, so the whole silhouette sat
 * inside the light's plateau and the top two levels stopped being sparse: they
 * are drawn as dot-matrix characters on the grounds that only the rarest cells
 * are ever hot enough to be one, and the machine came out as a solid wall of
 * digits. Smaller, the light falls off inside the form and the ramp is
 * traversed across the subject rather than around it.
 */
const LIGHT_R = 0.4;

/** Fades in over the first fifth of a window and out over the last fifth. */
function envelope(p: number, from: number, to: number): number {
  const t = norm(p, from, to);
  if (t <= 0 || t >= 1) return 0;
  return Math.min(1, Math.min(t, 1 - t) / 0.2);
}

/**
 * How long a step's copy takes to arrive and leave, as a fraction of the range.
 *
 * The panels are stacked, so their windows must not overlap: two paragraphs at
 * half opacity in the same box is not a cross-fade, it is unreadable. Each one
 * is gone exactly as the next begins, which puts a single dark instant on the
 * boundary. That instant is the edit, and the wipe that follows it is the shot
 * changing to match.
 */
const COPY_FADE = 0.045;

/** Copy opacity for one step. The outer two hold past the ends of the range. */
function copyGain(p: number, index: number, count: number): number {
  const { from, to } = SHOTS[index];
  const inGain = index === 0 ? 1 : norm(p, from, from + COPY_FADE);
  const outGain = index === count - 1 ? 1 : 1 - norm(p, to - COPY_FADE, to);
  return Math.min(inGain, outGain);
}

export default function Method() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);

  /**
   * Whether the frame is wide enough to put the copy beside the form.
   *
   * State, not a value read once inside the effect. It used to be the latter,
   * which meant the layout was decided at mount and never revisited: loading at
   * 390 and resizing to 1440 left a desktop viewport running the stacked
   * listing with no pin, and the reverse left a pin fighting touch scrolling.
   *
   * Seeded from the real width rather than from `false`, because a false seed
   * would build the listed layout on every desktop load and then tear it down
   * one tick later, which costs a pin, a layout jump and a full ScrollTrigger
   * refresh for nothing. Nothing rendered below depends on this value, only the
   * effect does, so the server and the client still emit identical markup.
   */
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth >= SCROLL.pinMinWidth,
  );

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${SCROLL.pinMinWidth}px)`);
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const steps = stepsRef.current;
    const spine = spineRef.current;
    if (!section || !steps || !spine) return;

    const panels = Array.from(
      steps.querySelectorAll<HTMLElement>("[data-step]"),
    );
    if (panels.length === 0) return;

    const reduced = prefersReducedMotion();
    const pin = !reduced && wide;

    /**
     * Whether the steps are listed instead of cross-faded.
     *
     * Cross-fading four stacked panels only works while something holds them
     * still, which is what the pin does. Without it the copy scrolls away under
     * a form that stays anchored to the middle of the viewport, and the two
     * drift apart: on a phone the heading leaves the screen while its shot is
     * still running. So wherever there is no pin the steps become a plain list
     * and the field runs behind them as atmosphere.
     */
    const listed = !pin;

    // Clear the guard on every setup. It lives on the DOM so it survives a
    // remount, but the inline styles it is guarding do not: gsap's ctx.revert()
    // wipes them on cleanup. A stale guard then convinces the new effect that
    // panels are already in the right state when they have just been reset,
    // which strands the wrong step on screen.
    delete steps.dataset.active;

    if (listed) {
      steps.classList.add("method-static");
      steps.style.minHeight = "0";
      panels.forEach((panel) => {
        panel.removeAttribute("aria-hidden");
        panel.style.opacity = "";
        panel.style.transform = "";
        panel.style.pointerEvents = "";
      });
    }

    /** Applies one progress value to the field, the copy and the spine. */
    function apply(p: number, w: number, h: number) {
      // Listed layouts put the copy directly over the form rather than beside
      // it, so the field drops back to atmosphere. At full strength it competes
      // with the text sitting on top of it.
      const g = listed ? 0.42 : 0.95;

      // Which shot is running. Published for the instrument, which annotates
      // whatever the field is holding, and assigned before the listed layout
      // returns: it used to sit below that return, so on a phone the readout
      // said SOURCE CELL beside all four steps.
      let active = 0;
      for (let i = 0; i < SHOTS.length; i++) if (p >= SHOTS[i].from) active = i;
      fieldState.shot = active;

      // The handover.
      //
      // Outside a sweep exactly one form is up at full gain, which costs the
      // draw loop a single multiply-add per cell. Inside one, both are up and
      // the line decides per cell which is visible, so their gains stay at full
      // and it is the geometry that crossfades, not the brightness.
      const sweep = SWEEPS.find((s) => p >= s.from && p < s.to);
      const ch = channels.method;
      const [bandTop, bandBottom] = formBand(w, h);

      if (sweep) {
        ch.formOut = sweep.out;
        ch.formIn = sweep.in;
        ch.outGain = g;
        ch.inGain = g;
        // The line crosses the forms, not the viewport. Run over the full
        // height it spends most of its travel above or below every silhouette
        // on screen, which turns a ten-percent sweep into a two-percent
        // handover with dead scroll either side. Starting and ending a feather
        // clear of the box still commits the frame to one form at each end.
        ch.wipeY = lerp(
          bandTop - WIPE_SOFT,
          bandBottom + WIPE_SOFT,
          norm(p, sweep.from, sweep.to),
        );
        ch.wipeSoft = WIPE_SOFT;
      } else {
        ch.formOut = null;
        ch.outGain = 0;
        ch.formIn = p < SWEEPS[0].from ? "maskSource" : "maskTarget";
        // Ramped in over the very start of the section rather than starting at
        // full: `apply` runs once at mount with whatever progress the trigger
        // reports, and the field is shared, so a form already at full gain at
        // p=0 gets painted over the hero wordmark before this section is
        // anywhere near the viewport.
        ch.inGain = g * norm(p, 0.005, 0.06);
        ch.wipeSoft = WIPE_SOFT;
      }

      // The key light. One light, four gestures, and it never teleports.
      //
      // Continuity is the whole constraint here: a light that jumps reads as a
      // cut, and the section is meant to be one take. So the segments below are
      // written to meet at shared endpoints, and the single place where the
      // light genuinely has to start a new pass from the top of the frame is
      // covered by a gain dip rather than by a jump you can see.
      const unit = formUnit(w, h);
      const [sx, sy] = sourceWorkPoint(w, h);
      const [tx, ty] = targetWorkPoint(w, h);
      /**
       * Travel of a reading pass, clear of the form at each end.
       *
       * Across the form's own band rather than the viewport's, for the same
       * reason the wipe line is: a light that spends half its travel off the
       * subject is a light that is off the subject half the time.
       */
      const passY = (t: number) =>
        lerp(bandTop - unit * 0.28, bandBottom + unit * 0.28, t);

      if (p < PASS_END) {
        // Observe. A reading head travels down the source cell: wide and
        // shallow, so it reads as a scan line crossing the machine rather than
        // as a spot moving over it.
        ch.lightX = sx;
        ch.lightY = passY(norm(p, 0, PASS_END));
        ch.lightRX = unit * LIGHT_R * 1.5;
        ch.lightRY = unit * LIGHT_R * 0.62;
      } else if (p < SWEEPS[0].from) {
        // Reconstruct. The scan that just crossed the whole machine closes down
        // onto the one place the machine does its job, and holds there.
        //
        // The step is about recovering why the work succeeds, so the gesture is
        // narrowing rather than travelling: a wide band reading everything
        // becomes a tight core sitting on the work point. It is also the only
        // way this shot can still be doing something now that the engram is
        // gone and the frame is holding the same silhouette as the step before
        // it. Without it, two consecutive shots would be one still picture.
        const close = smoothstep(norm(p, PASS_END, 0.42));
        ch.lightX = sx;
        ch.lightY = lerp(passY(1), sy, close);
        // Contracting from the shape the observe pass ended on, not starting a
        // new one. Anything else pops the light at p=0.245, where its gain is
        // still full and nothing hides the change.
        ch.lightRX = unit * lerp(LIGHT_R * 1.5, LIGHT_R * 0.5, close);
        ch.lightRY = unit * lerp(LIGHT_R * 0.62, LIGHT_R * 0.5, close);
      } else if (p < PASS_START) {
        // Re-embody. One light crossing from the old work point to the new
        // one, carrying the job into another machine. This is the section's
        // argument in a single gesture, so it is the one move given the whole
        // width of a shot to complete, and it rounds out as it goes because it
        // is travelling rather than reading.
        const t = smoothstep(norm(p, 0.56, 0.74));
        ch.lightX = lerp(sx, tx, t);
        ch.lightY = lerp(sy, ty, t);
        ch.lightRX = unit * lerp(LIGHT_R * 0.5, LIGHT_R, t);
        ch.lightRY = unit * lerp(LIGHT_R * 0.5, LIGHT_R, t);
      } else {
        // Qualify. A second pass, over the finished cell this time, and the
        // same shape as the first so the two read as one instrument.
        ch.lightX = tx;
        ch.lightY = passY(norm(p, PASS_START, 0.99));
        ch.lightRX = unit * LIGHT_R * 1.5;
        ch.lightRY = unit * LIGHT_R * 0.62;
      }

      // Full through the sequence, out at its two ends, and pinched to nothing
      // where the verify pass restarts at the top of the frame.
      ch.lightGain =
        Math.min(norm(p, 0.004, 0.05), 1 - norm(p, 0.985, 1)) *
        clamp(Math.abs(p - PASS_START) / 0.02, 0, 1) *
        (listed ? 0.45 : 1);

      // The scan band is an edge on the wipe now, not a subject of its own.
      //
      // It was a 148px stripe at 0.9 gain sweeping through y=540, which is
      // exactly where the body line and the chip row sit, and the hot levels
      // there are drawn as dot-matrix glyphs: the paragraph came out
      // overprinted with what read as random characters. At a third of that it
      // marks a line without competing with anything, and it now only appears
      // where there is a line to mark.
      if (sweep) {
        ch.bandY = ch.wipeY;
        ch.band = 0.3 * g;
      } else {
        ch.bandY = ch.lightY;
        ch.band =
          Math.max(
            envelope(p, 0, PASS_END),
            envelope(p, PASS_START, 1),
          ) *
          0.28 *
          g;
      }

      // The spine fills in every layout: beside a list it reads as progress
      // through the section just as well as it does beside a pinned sequence.
      spine!.style.transform = `scaleY(${p.toFixed(4)})`;

      // A listed layout shows every step at once, so there is no active step to
      // track. Returning here also keeps `apply` from writing inline opacity,
      // which would outrank the .method-static rule that unstacked them.
      if (listed) return;

      // The copy is scrubbed, not switched.
      //
      // It used to flip on a threshold and cross-fade over a fixed 500ms, which
      // put a time-based event inside a scroll-driven sequence: the words
      // arrived on their own clock while the field arrived on the wheel's, and
      // on a fast scroll four hard switches queued up behind each other. Driven
      // from the same `p` as the wipe, the sentence dissolves at the rate the
      // hand is moving and lands with the form it names.
      for (let i = 0; i < panels.length; i++) {
        const a = copyGain(p, i, panels.length);
        panels[i].style.opacity = a.toFixed(3);
        panels[i].style.transform = `translate3d(0, ${((1 - a) * 14).toFixed(1)}px, 0)`;
      }

      // The guard lives on the element, not in a closure variable.
      //
      // Only the two attributes that genuinely change four times are behind it;
      // opacity above is written every frame because it changes every frame. A
      // closure variable cannot do the job: React invokes effects twice in
      // development, which produces two closures with independent guards writing
      // the same DOM, and they drift apart. The dataset is shared, so both agree.
      if (steps!.dataset.active !== String(active)) {
        steps!.dataset.active = String(active);
        panels.forEach((panel, i) => {
          const on = i === active;
          panel.style.pointerEvents = on ? "auto" : "none";
          // Hidden panels are stacked underneath, so keep them out of the
          // accessibility tree as well as out of sight.
          panel.setAttribute("aria-hidden", on ? "false" : "true");
        });
      }
    }

    /** Undoes the listed layout, so a resize can rebuild into a pinned one. */
    const restore = () => {
      steps.classList.remove("method-static");
      steps.style.minHeight = "";
      releaseChannel("method");
    };

    // Reduced motion holds a single frame. The steps are already listed by the
    // block above, since `listed` is true whenever there is no pin.
    if (reduced) {
      apply(STILL, window.innerWidth, window.innerHeight);
      return restore;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        // Named so the instrument can anchor its waypoints to this range rather
        // than to the section's centre. See Instrument.tsx.
        id: "method",
        trigger: section,
        start: pin ? "top top" : "top 70%",
        // Four steps need more travel than the three-shot passage this
        // replaced, or each one goes past before it can be read.
        end: pin ? "+=280%" : "bottom 30%",
        pin,
        pinSpacing: pin,
        scrub: SCROLL.scrub,
        onUpdate: (self) =>
          apply(self.progress, window.innerWidth, window.innerHeight),
        onRefresh: (self) =>
          apply(self.progress, window.innerWidth, window.innerHeight),
        // Only this section's channel, so handing the forms back can no longer
        // take the proof's photograph down with them where the two overlap.
        onLeave: () => releaseChannel("method"),
        onLeaveBack: () => releaseChannel("method"),
      });
      apply(trigger.progress, window.innerWidth, window.innerHeight);
    }, section);

    return () => {
      ctx.revert();
      restore();
    };
  }, [wide]);

  return (
    <section
      id="method"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-32 md:py-0 md:pl-24 md:pr-10"
    >
      <SectionLabel>{method.label}</SectionLabel>

      {/*
        Full bleed above the pin threshold, capped below it.

        The copy is laid out in a flow container and the form is placed in
        viewport coordinates, and the only thing keeping them apart is that they
        agree on where the frame splits. Centring the container broke that
        agreement in a way that got worse the wider the screen: at 1920 the
        chip row ran 41px into the machine. Left-aligned, the panel's left edge
        is a constant, so the cap below is exact at every width instead of
        approximately right.

        That used to be true only above 1152, because `mx-auto` still centred it
        below. It is now true everywhere, which is both what the cap wants and
        the left edge every other section hangs off.
      */}
      <div className="flex w-full max-w-6xl flex-col gap-12 min-[1152px]:max-w-none">
        <div className="flex gap-6 md:gap-10">
          {/* The spine fills as the process advances: a progress bar that
              happens to be the section's left rule. */}
          <div
            aria-hidden="true"
            className="relative w-px shrink-0 bg-edge"
          >
            <div
              ref={spineRef}
              className="absolute inset-0 origin-top bg-accent"
              style={{ transform: "scaleY(0)" }}
            />
          </div>

          {/*
            Panels are stacked and cross-faded rather than laid out in a row.
            A row would be four cards, which is the shape that read as filler
            the last time this section existed. One step at a time is what a
            process sheet does, and it keeps the type large enough to read
            while the field is moving behind it.
          */}
          <div
            ref={stepsRef}
            className="relative min-h-[22rem] flex-1 md:min-h-[24rem] min-[1152px]:max-w-(--panel-cap)"
            // Capped against the same split the form is placed from, so the two
            // cannot drift. The 176px is the panel's own left offset plus a
            // gutter: 96 of section padding, 41 of spine and gap, 24 of air,
            // and 15 for the scrollbar.
            //
            // That last term is not padding. `vw` is the viewport including the
            // scrollbar gutter, but the canvas the form is drawn on is sized to
            // `clientWidth`, so the split the cap solves for and the split the
            // form actually lands on are different numbers on any platform with
            // a classic scrollbar. Measured at 1152 on Windows it ate 8px of the
            // 24 of air. Subtracting a full gutter costs 15px of panel where
            // there is no scrollbar and guarantees the clearance where there is.
            //
            // **Only above the pin threshold, and that is not tidiness.** The
            // cap solves for a frame with the form beside the copy, which is
            // the only layout `frame()` biases the form right for. Below 1152
            // the form centres, the steps are listed and the field drops to
            // 0.42 gain behind them, so there is nothing to clear — and the
            // expression goes catastrophically wrong down there, because it is
            // an offset in pixels subtracted from a fraction of the width.
            // Measured at 390 it computes to 26.8px, which is what the panel,
            // the heading and every chip were: one word per line, on every
            // phone, from 320 all the way to 1152.
            //
            // Applied through a custom property rather than an inline style so
            // a media query can switch it off. An inline `maxWidth` cannot be
            // overridden by a stylesheet, which is what put it at every width
            // in the first place.
            style={
              {
                "--panel-cap": `min(42rem, calc(${FORM_SPLIT * 100}vw - 176px))`,
              } as CSSProperties
            }
          >
            {method.steps.map((step) => (
              <div
                key={step.index}
                data-step
                // Visibility is a class, not an inline style. The effect writes
                // inline opacity imperatively, and declaring the same property
                // here would put React and the effect in a fight over it that
                // React can win on any re-render. `first:` also means the
                // opening step is visible before hydration, so the section is
                // never blank if the effect has not run yet.
                //
                // No transition: opacity is scrubbed from scroll position now,
                // and a duration on top of that is a second clock fighting the
                // first.
                className="absolute inset-0 opacity-0 first:opacity-100"
              >
                <div className="mb-5 flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.22em]">
                  <span className="text-accent">{step.index}</span>
                  <span className="text-ink-dim">{step.readout}</span>
                </div>

                <h2 className="mb-4 max-w-2xl text-[clamp(1.75rem,3.2vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.025em]">
                  {step.title}
                </h2>

                <p className="mb-8 max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">
                  {step.body}
                </p>

                <ul className="flex flex-wrap gap-x-3 gap-y-2">
                  {step.inputs.map((input) => (
                    <li
                      key={input}
                      className="border border-edge px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim"
                    >
                      {input}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
