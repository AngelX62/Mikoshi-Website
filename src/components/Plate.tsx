import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";

/**
 * A photographic plate: unnumbered, uncaptioned, atmosphere only.
 *
 * ── WHY THIS IS NOT `FigureFrame` ────────────────────────────────────────────
 * Drawings.tsx exports a frame that binds every figure on the site into one
 * numbered series, and the instruction at the foot of that file is explicit:
 * **do not add figure numbering back to a page before there is a figure on it**,
 * and the next real figure has to show a mechanism rather than a measurement.
 *
 * A photograph is neither. Putting one into the FIG. series would make the
 * series mean "picture" instead of "drawn argument", which is the whole thing
 * the numbering was being held back to protect. So a plate sits outside it and
 * has no number to give.
 *
 * ── THE GRAIN IS DOING WORK HERE ─────────────────────────────────────────────
 * Grain.tsx multiplies a fixed noise layer over the whole viewport at 0.14. Over
 * type and rules it is texture. Over a photograph it is the thing that welds the
 * plate into the sheet: the same grain crosses the picture and the paper around
 * it, so the two are one surface rather than an image sitting on a page.
 *
 * ── `alt` DEFAULTS TO EMPTY ──────────────────────────────────────────────────
 * The picture is decoration and carries no information, so a reader who cannot
 * see it misses nothing. Pass `alt` explicitly the moment a plate is ever used
 * to show something.
 */
export default function Plate({
  src,
  alt = "",
  className = "",
  style,
}: {
  src: StaticImageData;
  alt?: string;
  className?: string;
  /** For the `.reveal` stagger, which is set per call site. */
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <Image
        src={src}
        alt={alt}
        /**
         * The plate caps at 47.5rem and goes full width below `md`. Without this
         * Next assumes 100vw everywhere and ships a 3840px candidate to fill a
         * 760px slot.
         */
        sizes="(max-width: 768px) 100vw, 47.5rem"
        /**
         * 90, which is the only value next.config.ts allows and the reason that
         * list exists. Not the default 75: a duotone is a smooth two-colour ramp
         * rather than a photograph full of detail, and it bands at 75 in exactly
         * the gradients this picture is mostly made of.
         */
        quality={90}
        className="block h-auto w-full"
      />
    </div>
  );
}
