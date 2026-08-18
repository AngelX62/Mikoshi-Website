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
 * The escalation, one step per beat.
 *
 * Each beat is larger and brighter than the one above it, so the argument has a
 * shape before it has been read: a problem stated quietly, the claim the site
 * has been making all along, the turn, and then the thing this section exists
 * for, set larger than any other body text on the page.
 *
 * The scale is the argument, which is why it is not a fallback when the section
 * runs long. Flattening the fourth beat would buy about thirty pixels and cost
 * the reason the section was rewritten.
 *
 * Indexed against `vision.beats`, so the two are edited together or not at all.
 */
const BEAT = [
  "text-base leading-relaxed text-ink-dim",
  "text-base leading-relaxed text-ink-soft md:text-lg",
  "text-lg leading-snug text-ink md:text-xl",
  "text-xl font-medium leading-snug tracking-[-0.01em] text-ink md:text-2xl",
];

/**
 * The two rows that close the page, and the one class they share.
 *
 * `flex flex-wrap` on a phone and a true five-column grid from `md`. The grid
 * is what makes the closing pair work: five verbs above five words, aligned
 * cell for cell, so Notice sits over Machines and Keep over next. It used to be
 * `justify-between`, which spreads items to the edges but gives no columns, so
 * the correspondence would have been approximate. Approximate is worse than
 * absent here, because a near-miss reads as a mistake.
 *
 * The pairing is half found and half made. `vision.loop` came out of the copy
 * intact, five steps of the discovery cycle in the order the prose runs them.
 * `BOOKEND` was compressed to five words to meet it, because the sentence it
 * comes from is fourteen. The old pair was wholly found, which was luck; see
 * the note on `BOOKEND` in content.ts for what was traded and why.
 *
 * Below `md` the correspondence is dropped rather than faked. Five items do not
 * fit one line at 390, and a spread wrapped row leaves the last two marooned at
 * opposite edges with a hole between them.
 */
const CLOSING_ROW = `
  flex w-full flex-wrap items-center gap-x-6 gap-y-3
  border-t border-dashed border-ink-faint/45 pt-6
  font-mono text-[11px] uppercase tracking-[0.22em]
  md:grid md:grid-cols-5 md:gap-x-4 md:tracking-[0.3em]
`;

/**
 * Where this goes, and the page's closing movement.
 *
 * This was the Horizon: one claim, one paragraph, and the loop. Its docblock
 * argued that a long vision section directly after a concrete product section
 * undoes the concrete product section, and that argument still holds, which is
 * why the manifesto is not simply appended here.
 *
 * **The claims are on screen. The argument is behind a control.** Collapsed,
 * the heading, the four beats and the control fit one viewport. The eleven
 * paragraphs that support them sit inside a disclosure and cost a reader
 * nothing until asked for. The page was 7,622px with a third of that inside one
 * pin before this section existed, and it is 7,622px after. Somebody who wants
 * the full argument opens it; somebody who wants the pitch has already had it,
 * and the Deployment section above is still the last thing they read at full
 * attention.
 *
 * **The section opens on the ambition and closes on the imperative.** It used
 * to say one sentence twice, in display type at the top and in 11px mono at the
 * bottom. It cannot now: the heading is the title of the argument and the
 * closer is fourteen words across two sentences, so the echo moved into the
 * panel, where the long form is the last paragraph and the mono row is its
 * spine. The loop and the bookend are still the last two rows on the page, and
 * below them the field re-condenses the wordmark for the footer.
 *
 * **The instrument works here now.** This section's waypoint was a bare rule
 * with no scale and no readout, which was tolerable while the section argued
 * transfer and is not while it argues discovery. The trailing rule is held
 * open across the section and closes at the bookend, so the gap between what
 * was expected and what was measured is on screen for as long as the argument
 * is. See the vision waypoints in Instrument.tsx.
 *
 * **One ring, on arrival, and one on opening.** The metronome that used to live
 * here is gone and is not coming back: a `setInterval` fired a ring every 2.6
 * seconds for as long as the section was on screen, which made it the only
 * thing on the page moving while you stood still trying to read. Both rings now
 * answer something the reader did. There is deliberately no third source for
 * the bookend; `RIPPLE_SLOTS` is 4 and a ring nobody asked for is the metronome
 * coming back in a new shape.
 */
export default function Vision() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  /**
   * The arrival ring, fired from the heading rather than from the middle of the
   * frame.
   *
   * It used to originate at `innerHeight * 0.5`, which is a place nothing is.
   * The wave now comes out of the line it belongs to, so the type and the field
   * read as one instrument. Falls back to the old centre if the heading has not
   * mounted, which cannot happen from a ScrollTrigger on its own section but
   * costs one expression to rule out.
   */
  const rippleFromHeading = useCallback(() => {
    const box = headingRef.current?.getBoundingClientRect();
    rippleField(box ? box.top + box.height / 2 : window.innerHeight * 0.5);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        // Named so the instrument can anchor its three waypoints to this range
        // rather than to the section's centre, the same way the method's are
        // named. A section centre gives one pose, and this section needs three:
        // open the gap between the rules, hold it, close it. See Instrument.tsx.
        //
        // Sharing the ripple's trigger rather than adding a second one, because
        // the range is the one the instrument wants anyway. It starts as the
        // section arrives and ends as it leaves, which is exactly the span over
        // which the residual should open and resolve.
        id: "vision",
        trigger: section,
        start: "top 70%",
        end: "bottom 30%",
        // Both directions, so coming back up the page is an arrival too. Not
        // `once`: the ring is what marks entering this section, and a reader who
        // scrolls past and returns has entered it again.
        onEnter: rippleFromHeading,
        onEnterBack: rippleFromHeading,
      });
    }, section);

    return () => ctx.revert();
  }, [rippleFromHeading]);

  /**
   * Tell ScrollTrigger the document just changed length.
   *
   * Opening this adds roughly 1,700px below the fold. Two things cache
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
      // `md:py-32` is measured rather than chosen. What has to clear the fold
      // is the heading, the four beats and the control; the loop and the
      // bookend sit below it by design, since reaching them is the reward for
      // pressing past the control rather than something to be seen at once.
      className="relative z-10 flex min-h-screen flex-col justify-start px-6 py-24 md:py-32 md:pl-24 md:pr-10"
    >
      <SectionLabel>{vision.label}</SectionLabel>

      {/*
        One heading, hand-set lines, all wiping together rather than in
        sequence. The breaks are authored in content.ts, which owns the reason
        for them; mapped rather than indexed because the line count is now the
        copy's decision and used to be two.

        Every line lives inside the one `h2` and none is hidden. An earlier
        draft split them into two headings and marked the second `aria-hidden`
        to keep the outline clean, which handed anyone using a screen reader
        half a sentence.

        `max-w-4xl` and the 4.75rem cap both stand, which was worth measuring
        rather than assuming. The new heading is three lines where the old was
        two, and the longest, "Machines that can discover", was estimated to
        land a few pixels over the 896px measure. It sets at 873px at the cap,
        so it clears by 23. The measure was briefly widened to `max-w-5xl` on
        that estimate and the change did nothing at all; it is reverted here so
        the page keeps one measure for its display type.
      */}
      <Wipe className="w-full">
        <h2
          ref={headingRef}
          className="max-w-4xl text-[clamp(2.25rem,6.4vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.035em]"
        >
          {vision.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
      </Wipe>

      {/*
        The four beats, staggered, so the escalation arrives in the order it
        argues in. `space-y-6` sits on the wipe masks rather than on the
        paragraphs, so the gaps stay outside the clipped boxes and do not travel
        with the type as it lands.
      */}
      <Wipe stagger className="mt-10 w-full max-w-2xl space-y-6 md:mt-12">
        {vision.beats.map((beat, i) => (
          <p key={beat} className={BEAT[i]}>
            {beat}
          </p>
        ))}
      </Wipe>

      {/*
        The disclosure.

        Full width, like the two rows below it, because it is the same device: a
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

          **The ceiling is 240rem and it used to be 100rem, which would now
          clip.** It was set against 516px of prose on a desktop measure and
          786px at 390. The statement is about 340 words: at 390 that is roughly
          48 lines at 29px plus ten paragraph gaps, near 1,700px against a
          1,600px ceiling, so the last paragraph would have been cut off on a
          phone with nothing reporting it. A ceiling this loose costs only that
          the transition keeps travelling after the content has finished
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
          nothing. Removing `transition-property` resolved it in the same frame.
          So the reduced-motion path takes no transition at all, and the panel's
          height stops depending on an animation ever running.

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
          style={{ maxHeight: open ? "240rem" : 0 }}
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
        The close: five above five.

        Both rows break out of the measure the rest of the section lives in and
        span the full frame, so the section funnels through its middle and opens
        again at the bottom. Two dashed rules rather than one, because rule, row,
        rule, row is a table with a header, which is what this is; one rule would
        leave the bookend floating under the loop instead of bound to it.

        The loop is the one place the reference's device is quoted directly, and
        it lands here because this is the section whose subject is a cycle.
      */}
      <ol className={`mt-14 text-ink-soft md:mt-16 ${CLOSING_ROW}`}>
        {vision.loop.map((verb) => (
          <li key={verb}>{verb}</li>
        ))}
      </ol>

      {/*
        The same sentence as the heading, in the smallest type on the page.

        Five words in five cells, one under each verb. It is `text-ink` against
        the loop's `text-ink-soft` so the weight sits on the promise rather than
        on the mechanism, and it is the last type before the footer, where the
        field re-condenses the wordmark.

        A paragraph of spans rather than a list: the words are a sentence, and
        anything reading this aloud should get the sentence. That it is the same
        sentence as the h2 is the design, not a duplication to be suppressed.
      */}
      <p className={`mt-6 text-ink ${CLOSING_ROW}`}>
        {vision.bookend.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </p>
    </section>
  );
}
