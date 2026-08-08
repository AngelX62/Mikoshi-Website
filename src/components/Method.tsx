"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { method } from "@/content";
import { fieldState, resetFieldShapes } from "@/lib/fieldState";
import { SCROLL, clamp, norm, prefersReducedMotion } from "@/lib/motion";

/**
 * The method.
 *
 * Four ordered steps, scrubbed through one pinned viewport. The field behind
 * the copy carries the argument: it holds a working cell, dissolves it into the
 * structure underneath, rebuilds that structure as a different cell, then
 * sweeps the result to qualify it. The text names what is happening; the field
 * is what actually happens.
 *
 * Shapes are written to `fieldState`, a mutable singleton the canvas polls once
 * per frame, so scrubbing never re-renders React. The DOM writes below go
 * straight to style properties for the same reason.
 */

/** Shot windows as fractions of the pinned range, one per step. */
const SHOTS = [
  { from: 0.0, to: 0.26 },
  { from: 0.26, to: 0.52 },
  { from: 0.52, to: 0.78 },
  { from: 0.78, to: 1.0 },
] as const;

/**
 * Reduced motion holds this progress instead of scrubbing. It sits inside the
 * third shot, where the target form is fully resolved, because a single frame
 * should show the thing the sequence exists to prove.
 */
const STILL = 0.66;

/** Fades in over the first fifth of a window and out over the last fifth. */
function envelope(p: number, from: number, to: number): number {
  const t = norm(p, from, to);
  if (t <= 0 || t >= 1) return 0;
  return Math.min(1, Math.min(t, 1 - t) / 0.2);
}

export default function Method() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const steps = stepsRef.current;
    const spine = spineRef.current;
    const readout = readoutRef.current;
    if (!section || !steps || !spine || !readout) return;

    const panels = Array.from(
      steps.querySelectorAll<HTMLElement>("[data-step]"),
    );
    if (panels.length === 0) return;

    const reduced = prefersReducedMotion();
    const pin = !reduced && window.innerWidth >= SCROLL.pinMinWidth;

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
      panels.forEach((panel) => panel.removeAttribute("aria-hidden"));
    }

    /** Applies one progress value to the field, the copy and the spine. */
    function apply(p: number, height: number) {
      // The forms cross-fade rather than cut, but the overlap is deliberately
      // short. Two silhouettes held at half strength together sample down to
      // noise, so each one is most of the way out before the next arrives. The
      // target stays up through qualification: the point of the last step is
      // that the new body is still standing there working.
      //
      // The source ramps in rather than starting at full. `apply` runs once at
      // mount with whatever progress the trigger reports, and the field is
      // shared, so a form already at full gain at p=0 gets painted over the
      // hero wordmark before this section is anywhere near the viewport.
      // Listed layouts put the copy directly over the form rather than beside
      // it, so the forms drop back to atmosphere. At full strength they compete
      // with the text sitting on top of them.
      const g = listed ? 0.42 : 0.95;

      fieldState.sourceGain =
        norm(p, 0.01, 0.1) * clamp(1 - norm(p, 0.2, 0.34), 0, 1) * g;
      fieldState.engramGain =
        Math.min(norm(p, 0.3, 0.42), 1 - norm(p, 0.5, 0.6)) * g;
      fieldState.targetGain = norm(p, 0.58, 0.7) * g;

      // Two scan passes: one reading the source in shot one, one verifying the
      // target in shot four. Same instrument, opposite ends of the process.
      const observe = envelope(p, SHOTS[0].from, SHOTS[0].to);
      const qualify = envelope(p, SHOTS[3].from, SHOTS[3].to);
      const sweep = observe > qualify ? norm(p, 0.0, 0.26) : norm(p, 0.78, 1.0);
      fieldState.bandY = -80 + sweep * (height + 160);
      fieldState.bandGain = Math.max(observe, qualify) * 0.9;

      // The spine fills in every layout: beside a list it reads as progress
      // through the section just as well as it does beside a pinned sequence.
      spine!.style.transform = `scaleY(${p.toFixed(4)})`;

      // A listed layout shows every step at once, so there is no active step to
      // track. Returning here also keeps `apply` from writing inline opacity,
      // which would outrank the .method-static rule that unstacked them.
      if (listed) return;

      // Active step. Panels cross-fade so only one is legible at a time.
      let active = 0;
      for (let i = 0; i < SHOTS.length; i++) if (p >= SHOTS[i].from) active = i;

      // The guard lives on the element, not in a closure variable.
      //
      // `apply` runs on every scrub frame but the active step only changes four
      // times, so without a guard the same values are written to four elements
      // sixty times a second. A closure variable cannot do the job: React
      // invokes effects twice in development, which produces two closures with
      // independent guards writing the same DOM, and they drift apart. The
      // dataset is shared, so both agree.
      if (steps!.dataset.active !== String(active)) {
        steps!.dataset.active = String(active);
        panels.forEach((panel, i) => {
          const on = i === active;
          panel.style.opacity = on ? "1" : "0";
          panel.style.transform = `translate3d(0, ${on ? 0 : 14}px, 0)`;
          panel.style.pointerEvents = on ? "auto" : "none";
          // Hidden panels are stacked underneath, so keep them out of the
          // accessibility tree as well as out of sight.
          panel.setAttribute("aria-hidden", on ? "false" : "true");
        });
        readout!.textContent = method.steps[active].readout;
      }
    }

    /** Undoes the listed layout, so a resize can rebuild into a pinned one. */
    const restore = () => {
      steps.classList.remove("method-static");
      steps.style.minHeight = "";
      resetFieldShapes();
    };

    // Reduced motion holds a single frame. The steps are already listed by the
    // block above, since `listed` is true whenever there is no pin.
    if (reduced) {
      apply(STILL, window.innerHeight);
      return restore;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: pin ? "top top" : "top 70%",
        // Four steps need more travel than the three-shot passage this
        // replaced, or each one goes past before it can be read.
        end: pin ? "+=280%" : "bottom 30%",
        pin,
        pinSpacing: pin,
        scrub: SCROLL.scrub,
        onUpdate: (self) => apply(self.progress, window.innerHeight),
        onRefresh: (self) => apply(self.progress, window.innerHeight),
        // The field is shared, so the method hands it back on the way out.
        // Without this the target cell would hang over the deployment section.
        onLeave: () => resetFieldShapes(),
        onLeaveBack: () => resetFieldShapes(),
      });
      apply(trigger.progress, window.innerHeight);
    }, section);

    return () => {
      ctx.revert();
      restore();
    };
  }, []);

  return (
    <section
      id="method"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-32 md:px-10 md:py-0"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim">
          {method.label}
        </span>

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
          {/*
            Capped in viewport units because that is what the form is measured
            in: `frame()` in lib/forms.ts places it starting at 52vw. A cap in
            rem or a bare `flex-1` lets the chip row run under the form, which
            is what it did before this.
          */}
          <div
            ref={stepsRef}
            className="relative min-h-[22rem] flex-1 md:min-h-[20rem] md:max-w-[42vw]"
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
                className="absolute inset-0 opacity-0 transition-[opacity,transform] duration-500 ease-out first:opacity-100"
              >
                <div className="mb-5 flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.22em]">
                  <span className="text-accent">{step.index}</span>
                  <span className="text-ink-dim">{step.readout}</span>
                </div>

                <h2 className="mb-4 max-w-2xl text-[clamp(1.75rem,4.4vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.025em]">
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

        {/* Instrumentation, matching the readout the field is running. */}
        <div
          aria-hidden="true"
          className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim"
        >
          <span ref={readoutRef} className="w-24 shrink-0">
            {method.steps[0].readout}
          </span>
          <div className="h-px flex-1 bg-edge" />
          <span>
            {method.steps.length} steps
          </span>
        </div>
      </div>
    </section>
  );
}
