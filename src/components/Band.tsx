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
 * **`tone="plate"` is a place, not a mode.** The plate class in globals.css
 * redefines the ink tokens inside its own subtree, so a heading, a rule or a
 * link inside a plate never has to know which ground it is standing on. That is
 * the one idea worth keeping from the two-theme system this replaced: the
 * ground announces itself downward, and nothing reads it upward.
 *
 * **The strip is a prop rather than a child** so it cannot be put anywhere
 * except across the top of the band it annotates. Making it a child would make
 * its position a decision, and it should be a rule.
 */

type Tone = "bone" | "plate";

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
  strip,
  className = "",
  children,
}: {
  tone?: Tone;
  size?: Size;
  /** Left and right halves of the annotation row. Omit for no strip. */
  strip?: { left: string; right?: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`relative w-full ${
        tone === "plate" ? "plate" : "bg-ground"
      } ${PAD[size]} ${className}`}
    >
      {/*
        The plate carries its own grain.

        The site-wide overlay in Grain.tsx multiplies, which is correct over
        bone and does nothing whatsoever over a near-black ground: multiplying
        into black is black. Both references are heavily grained and the plates
        are where that texture matters most, so a plate screens its own noise
        back out instead. Same image, opposite operation, because it is standing
        on the opposite ground.
      */}
      {tone === "plate" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] mix-blend-screen [background-image:var(--noise)] [background-size:180px_180px]"
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-[86rem] px-6 md:px-10 lg:px-16">
        {strip && <Strip left={strip.left} right={strip.right} />}
        {children}
      </div>
    </section>
  );
}
