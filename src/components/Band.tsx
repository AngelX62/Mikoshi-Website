import type { ReactNode } from "react";
import Strip from "./Strip";

/**
 * A full-bleed horizontal section, and the unit the whole site is built from.
 *
 * The reference sheet this site is drawn from is a stack of letterboxed frames:
 * hard edges, no gutters between them, no rounded corners, no shadows, nothing
 * floating. A band is that frame. Pages are made by stacking them and choosing
 * a tone for each, and that is nearly the whole layout system.
 *
 * **`tone="tint"` is a place, not a mode.** The tint class in globals.css
 * redefines tokens inside its own subtree, so a heading, a rule or a link
 * inside one never has to know which ground it is standing on. That is the one
 * idea worth keeping from the two-theme system this replaced: the ground
 * announces itself downward, and nothing reads it upward.
 *
 * **`"plate"` was the second tone and it was near black.** Every route ran
 * bone, bone, black, bone, black, which is a site with two grounds rather than
 * one, and on home a bone header sat directly on the black title card. The tone
 * is a two-step tint of the same paper now. Emphasis by tinting is what a press
 * does; emphasis by inverting is what a screen does, and this site is a sheet.
 *
 * **The strip is a prop rather than a child** so it cannot be put anywhere
 * except across the top of the band it annotates. Making it a child would make
 * its position a decision, and it should be a rule.
 *
 * ── THE BAND NAMES ITSELF FROM ITS STRIP, AND IT USED TO SAY IT TWICE ────────
 * There was a `heading` prop that rendered `<h2 class="sr-only">` above the
 * strip, on the reasoning that the strip already said it on screen so a second
 * visible title would be furniture. That is right about the design and wrong
 * about the delivery: **a screen reader reads the strip too.** Where the two
 * strings matched, the section title was announced twice in a row, verbatim,
 * which happened on three of /first-proof's four bands. /technology was worse
 * and rendered "Work Engrams" as an `h2` twice, once hidden and once visible,
 * breaking a rule vision/page.tsx had already written down.
 *
 * So the strip *is* the accessible name: `aria-labelledby` points at the span
 * the reader can see, which is what `aria-labelledby` is for, and there is no
 * hidden copy of anything. Every band with a strip is a named landmark, which
 * is more than the old prop managed, since only four of nine passed it.
 *
 * `titled` then decides whether that same span is also an `h2`. See below.
 */

type Tone = "bone" | "tint";

/**
 * An id for the band's accessible name, derived from the strip's own label.
 *
 * Derived rather than generated because this is a server component and cannot
 * hold a `useId`, and derived rather than counted because a counter would
 * renumber every band on the page the moment one was inserted above it.
 *
 * **The requirement is that two bands in one document never carry the same
 * `strip.left`.** Nothing enforces it. Today nothing comes close: the longest
 * document is /first-proof, whose four are "First proof", "The evidence
 * standard", "Commercial value" and "Operating principles".
 */
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Vertical air. `tall` is for a band that has to hold a screen on its own. */
type Size = "regular" | "tall" | "flush";

const PAD: Record<Size, string> = {
  regular: "py-20 md:py-28",
  tall: "py-28 md:py-40",
  // For a band that centres itself in whatever height is left, which is how
  // home fills exactly one screen and no more.
  flush: "py-0",
};

export default function Band({
  tone = "bone",
  size = "regular",
  id,
  titled = false,
  strip,
  bleed = false,
  className = "",
  children,
}: {
  tone?: Tone;
  size?: Size;
  /**
   * An anchor target, for a band something on the same page points at.
   *
   * Only home uses it, for the cue on the bottom edge of the title card. The
   * header is static rather than sticky, so an anchor needs no scroll offset:
   * nothing is floating above the band to land underneath.
   */
  id?: string;
  /**
   * Whether the strip's label is also this band's heading.
   *
   * **The `Strip` is this site's section title.** A reader looking at
   * /first-proof sees four titled frames; a reader navigating by heading used
   * to find the two whose content happened to open on an `h2` and nothing at
   * all for the other two, because the strip is 10px mono in a `<span>` and
   * none of the grouping the design states visually reached the outline.
   *
   * On, the strip's left half is rendered as the `h2` it already behaves like.
   * Nothing moves and nothing is added to the page: it is the same words in the
   * same place, promoted.
   *
   * **Off wherever the band's content carries its own visible heading**, which
   * is most of them. Two `h2`s for one band is what the deleted `heading` prop
   * produced on /technology, and one of them being real does not make it two
   * sections. The band is still a named landmark either way, from the same
   * span.
   *
   * **Off on a band whose first child is the page's `h1`.** An `h2` above an
   * `h1` is a worse outline than the gap it closes. That is the opening band of
   * every route.
   */
  titled?: boolean;
  /** Left and right halves of the annotation row. Omit for no strip. */
  strip?: { left: string; right?: string };
  /**
   * Let the children run the full width of the band instead of the 86rem
   * measure. The strip stays inside the measure either way.
   *
   * **This is not the `field` slot coming back.** That one parked a generated
   * canvas *behind* a band's copy to fill a frame nobody had content for, and
   * the note further down records why every version of it failed. This puts a
   * band's own content edge to edge, which is what the section element already
   * does for every rule and every change of ground on this site.
   *
   * One caller: home's illustration, which is drawn running off both its edges
   * and would read as a flow that stops in mid air if it were held inside the
   * measure with bone either side of it.
   */
  bleed?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const labelId = strip ? `band-${slug(strip.left)}` : undefined;

  return (
    // `flex flex-col` is left over from the halftone field, which sat after the
    // copy below `lg` and was absolutely positioned above it. There is no field
    // (see the note further down), so this is now just a column: the strip, then
    // the children, centred by `mx-auto` on the inner track.
    <section
      id={id}
      aria-labelledby={labelId}
      className={`relative flex w-full flex-col ${
        tone === "tint" ? "tint" : "bg-ground"
      } ${PAD[size]} ${className}`}
    >
      {/*
        ── THE PLATE'S OWN GRAIN LAYER WAS HERE ────────────────────────────────
        A plate screened a copy of the site noise back out of itself, because
        the site-wide overlay in Grain.tsx multiplies and multiplying into near
        black is near black.

        A tint block is paper, so the site-wide multiply reaches it exactly as
        it reaches every other band, and a second layer here would be the grain
        applied twice. Deleted rather than adapted.
      */}

      {/*
        ── THE REGISTRATION TICKS WERE HERE, AND THEY WERE COSTUME ─────────────
        Four hairline corner marks at the band's own bounds, on tint blocks only,
        drawn in the accent at hairline value. Lifted from technical sheets,
        where a printing plate carries the marks a press used to line it up.

        They were earned while the subject was physical apparatus. They stopped
        being earned the moment the company became an AI research programme:
        **a press mark on a document about training runs is borrowed authority**,
        and the site was already spending one metaphor it had to justify.

        What a pre-registered protocol actually carries is a version and a date.
        That is in the colophon now, where it says which revision of the research
        direction the site was built from. See Footer.tsx.

        Note for anyone restoring these: they cost no layout, they were
        `hidden sm:block` because at 390 they sit inside the copy's own margin
        and read as specks, and `--color-accent-rule` is the one furniture token
        allowed to carry the annotation hue.
        ───────────────────────────────────────────────────────────────────────
      */}

      {/*
        ── THERE WAS A HALFTONE FIELD HERE, AND IT IS GONE ──────────────────────
        A `field` slot took a canvas that ran full bleed behind the band at `xl`
        and became a strip under the copy below it. Four routes carried one.

        It went through three forms and none of them worked. A displacement
        lattice with a lens in it, which only two of the five modes used, so the
        other two routes drew dotted contour outlines instead and the site read
        as two unrelated pictures. Then a blurred plume, which had no silhouette
        on any side and so got read as a dropdown caret on home, a low-poly gem
        on technology and Pac-Man on deployment, and which measured 68.9% violet
        against 3.5% ink, making it the largest and palest colour event on a site
        whose accent is meant to be a hairline. Then a machined raster of
        parallel passes with a displaced block: that fixed the colour decisively,
        measuring 70.6% ink, and it was still wrong, because an evenly hatched
        field at 1425px wide is wallpaper, and hatching run under a headline with
        rectangular windows punched out for each line looks like damage.

        **The argument for it was always that the frames were half empty**, and
        that was true: technology filled 46.8% of its band, deployment 43.3%,
        vision 62.7%. The right answer to a band holding 560px of content in a
        788px frame is to stop the band being 788px deep, which is what every
        opening band does now. It is not to park a picture in the gap.

        What survives is the vocabulary that was already load-bearing: full-bleed
        rules, the strip, corner registration ticks, and a change of ground for
        the band that matters. Those are what the reference sheets are actually
        made of.
        ─────────────────────────────────────────────────────────────────────────
      */}

      {/* `track`, the edge the header and every other band share. It was a
          hand-written 86rem here, 24px inside the header's at 1440. */}
      <div className="track relative z-10">
        {strip && (
          <Strip
            left={strip.left}
            right={strip.right}
            leftId={labelId}
            as={titled ? "h2" : undefined}
          />
        )}
        {!bleed && children}
      </div>
      {bleed && children}
    </section>
  );
}
