"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { vision } from "@/content";
import { rippleField } from "@/lib/fieldState";
import { prefersReducedMotion } from "@/lib/motion";
import SectionLabel from "./SectionLabel";
import Wipe from "./Wipe";

/**
 * Where this goes, and the page's closing movement.
 *
 * This was the Horizon: one claim, one paragraph, and the loop. Its docblock
 * argued that a long vision section directly after a concrete product section
 * undoes the concrete product section, and that argument still holds, which is
 * why the manifesto is not simply appended here.
 *
 * **The claims are on screen. The argument is behind a control.** Collapsed,
 * this is one viewport: the heading, the belief, the three bodies, the kicker,
 * the loop. The five paragraphs that support them sit inside a disclosure and
 * cost a reader nothing until asked for. The page was 7,622px with a third of
 * that inside one pin before this section existed, and it is 7,622px after.
 * Somebody who wants the full argument opens it; somebody who wants the pitch
 * has already had it, and the Deployment section above is still the last thing
 * they read at full attention.
 *
 * **One ring, on arrival, and one on opening.** The metronome that used to live
 * here is gone and is not coming back: a `setInterval` fired a ring every 2.6
 * seconds for as long as the section was on screen, which made it the only
 * thing on the page moving while you stood still trying to read. Both rings now
 * answer something the reader did.
 */
export default function Vision() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        end: "bottom 30%",
        // Both directions, so coming back up the page is an arrival too. Not
        // `once`: the ring is what marks entering this section, and a reader who
        // scrolls past and returns has entered it again.
        onEnter: () => rippleField(window.innerHeight * 0.5),
        onEnterBack: () => rippleField(window.innerHeight * 0.5),
      });
    }, section);

    return () => ctx.revert();
  }, []);

  /**
   * Tell ScrollTrigger the document just changed length.
   *
   * Opening this adds roughly 1,400px below the fold. Two things cache
   * measurements and re-measure on this event and on nothing else: the rail
   * caches the scrollable maximum and every section's offset, and the
   * instrument caches its waypoint anchors. Without this the rail reports a
   * percentage of the wrong document and marks the wrong section for the rest
   * of the visit, and the instrument's rule drifts out of step with the
   * content it is annotating.
   *
   * Called twice on purpose. `transitionend` is the correct moment, since
   * measuring mid-animation measures a height nothing will ever have, but the
   * reduced-motion rule in globals.css collapses every transition to 0.01ms and
   * the event ordering around a duration that short is not worth depending on.
   * A refresh is idempotent.
   */
  const remeasure = useCallback(() => ScrollTrigger.refresh(), []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === "max-height") remeasure();
    };
    panel.addEventListener("transitionend", onEnd);
    return () => panel.removeEventListener("transitionend", onEnd);
  }, [remeasure]);

  function toggle() {
    const next = !open;
    setOpen(next);
    remeasure();
    // The same gesture the thesis uses when its last line lands: the type and
    // the field are one instrument, so opening the argument pushes a wave
    // through the substrate it is printed on. Fired from the control's own
    // position rather than from the middle of the frame, because this one has a
    // source the reader can see.
    if (next && !prefersReducedMotion()) {
      const box = buttonRef.current?.getBoundingClientRect();
      if (box) rippleField(box.top + box.height / 2);
    }
  }

  return (
    <section
      id="vision"
      ref={sectionRef}
      // `justify-start`, not `justify-center`, and that is the disclosure's
      // doing. With the content centred in a `min-h-screen` box, expanding it
      // past the viewport moves the centre: the heading jumps upward by the
      // difference at the exact moment the reader clicks, so the line they were
      // looking at leaves. Top-anchored, the section can only ever grow
      // downward.
      //
      // `md:py-32` is measured rather than chosen. The collapsed section has a
      // one-viewport budget and at `py-40` the loop's bottom edge landed at
      // 802px against an 800px fold at 1280x800, which is a miss by two pixels
      // and still a miss. This clears it by 32 and reads closer to centred at
      // 1440 as well, where the content block is about 640 tall in 900.
      className="relative z-10 flex min-h-screen flex-col justify-start px-6 py-24 md:py-32 md:pl-24 md:pr-10"
    >
      <SectionLabel>{vision.label}</SectionLabel>

      <div className="w-full max-w-4xl">
        <Wipe stagger>
          {/*
            One heading, two hand-set lines. The break is authored rather than
            left to the measure, because the turn is the sentence: the first
            line concedes and the second refuses, and a break landing anywhere
            else throws that away.

            Both lines live inside the one `h2` and neither is hidden. An
            earlier draft split them into two headings and marked the second
            `aria-hidden` to keep the outline clean, which handed anyone using a
            screen reader half a sentence. The stagger is not worth that, so the
            pair arrives together and the sequencing happens between the heading
            and the line under it.
          */}
          <h2 className="mb-8 max-w-4xl text-[clamp(2.25rem,6.4vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.035em]">
            <span className="block">{vision.heading[0]}</span>
            <span className="block">{vision.heading[1]}</span>
          </h2>

          <p className="max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
            {vision.belief}
          </p>
        </Wipe>

        {/*
          The three bodies. One line, not three: at display scale they took a
          third of the collapsed viewport and this section has a one-screen
          budget to keep. The note under them is `text-ink` because it is the
          half that argues; the bodies themselves are only the setup.
        */}
        <div className="mt-12 max-w-2xl md:mt-14">
          <p className="text-lg leading-snug text-ink-soft md:text-xl">
            {vision.bodies}
          </p>
          <p className="mt-2 text-lg leading-snug text-ink md:text-xl">
            {vision.bodiesNote}
          </p>
        </div>
      </div>

      {/*
        The disclosure.

        Full width, like the loop below it, because it is the same device: a
        mono label sitting on a dashed rule. The page has exactly one register
        of chrome and a component that looked like a general-purpose accordion
        would be the only thing on the site that reads as a widget.
      */}
      <div className="mt-14 w-full md:mt-16">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="
            group flex w-full items-center gap-4
            border-t border-dashed border-ink-faint/45 pt-6
            text-left font-mono text-[11px] uppercase tracking-[0.22em]
            text-ink-dim transition-colors duration-300
            hover:text-ink focus-visible:text-ink
          "
        >
          {/*
            A cross that is a plus until it is opened. Rotation rather than a
            swapped glyph, so the state change is one continuous thing and not
            two characters trading places. Built from two rules because a `+`
            in this typeface sits optically high in its box and would not spin
            around its own centre.
          */}
          <span
            aria-hidden="true"
            className={`relative block h-3 w-3 shrink-0 transition-transform duration-500 ease-out-expo ${
              open ? "rotate-45" : ""
            }`}
          >
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
          </span>

          <span>{open ? vision.more.close : vision.more.cta}</span>

          {/* Takes the rest of the width, so the label sits *on* a rule rather
              than above one. Brightens with the label on hover. */}
          <span
            aria-hidden="true"
            className="h-px flex-1 bg-ink-faint/45 transition-colors duration-300 group-hover:bg-ink-faint"
          />
        </button>

        {/*
          Absence is length, not opacity. Same rule the rail's labels work to:
          a panel at zero height has not faded, it simply is not there, and it
          costs the collapsed frame nothing.

          `max-height` and not the `grid-template-rows: 0fr -> 1fr` technique
          that is the usual answer to animating an unknown height. Either works;
          this one matches what `ScrollRail` already does to reveal its labels,
          so the page has one way of saying "absent" rather than two.

          The ceiling is deliberately far above any height the prose reaches, so
          it never clips: measured at 516px on a desktop measure and around
          786px at 390, against 1,600px here. The cost of a ceiling that loose
          is that the transition keeps travelling after the content has finished
          appearing, which is why the easing is the symmetric one rather than
          `ease-out-expo`. Nothing is visible past the point where max-height
          passes the content.

          **`motion-reduce:transition-none`, and it is not decoration.** The
          reduced-motion rule in globals.css collapses every transition to
          0.01ms rather than removing it, so this property was still animated,
          just very fast. A transition that has started holds the property at
          its start value until it advances, and it only advances on a rendering
          step. Measured with a 0.01ms duration: `getAnimations()` reported the
          max-height transition `running` at `currentTime: 0`, the computed
          value pinned to `0px`, and the panel 0 tall while `aria-expanded` said
          true, which is a control that reports opening something and opens
          nothing. Removing `transition-property` resolved it to 1600px in the
          same frame. So the reduced-motion path takes no transition at all, and
          the panel's height stops depending on an animation ever running.

          `inert` while collapsed: the prose stays in the DOM, so it is in the
          static export for crawlers, but neither Tab nor a screen reader
          reaches text a sighted reader cannot see.
        */}
        <div
          id={panelId}
          ref={panelRef}
          aria-label={vision.more.label}
          role="region"
          inert={!open}
          style={{ maxHeight: open ? "100rem" : 0 }}
          className="overflow-hidden transition-[max-height] duration-700 ease-in-out-soft motion-reduce:transition-none"
        >
          <div className="max-w-2xl space-y-6 pt-10 text-base leading-relaxed text-ink-soft md:text-lg">
            {vision.more.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      {/*
        The kicker. `text-ink` and larger than the body, because it is the last
        assertion the page makes before the contact form.
      */}
      <p className="mt-14 max-w-3xl text-xl font-medium leading-snug tracking-[-0.01em] text-ink md:mt-16 md:text-2xl">
        {vision.kicker}
      </p>

      {/*
        The loop breaks out of the container the rest of the page lives in.
        Full width, spread edge to edge on a dashed rule, it stops being a list
        under a paragraph and becomes a scale the section is measured against.
        This is the one place the reference's device is quoted directly, and it
        lands here because this is the one section whose subject is a cycle
        rather than a step.

        `justify-between` rather than gaps: what carries the idea is that the
        verbs are distributed across the whole frame, not that they are near
        each other. Only from `md`, though. Five verbs do not fit on one line on
        a phone, and spreading a wrapped row leaves the last two marooned at
        opposite edges with a hole between them, which reads as broken rather
        than as distributed.
      */}
      <ol
        className="
          mt-14 flex w-full flex-wrap items-center gap-x-6 gap-y-3
          border-t border-dashed border-ink-faint/45 pt-6
          font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft
          md:mt-16 md:justify-between md:gap-x-4 md:tracking-[0.3em]
        "
      >
        {vision.loop.map((verb) => (
          <li key={verb}>{verb}</li>
        ))}
      </ol>
    </section>
  );
}
