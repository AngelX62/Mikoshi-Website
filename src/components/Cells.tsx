import Link from "next/link";
import type { CSSProperties } from "react";

/**
 * Parallel items as one ruled figure: a row, or rows, of equal cells.
 *
 * The drawing and the reason it exists are in globals.css under `.cells`. In
 * short: every band on the site used to share one composition, and the content
 * had structure it was not showing. This is for content that is **already** a
 * set of parallel items. It is not a way to fill a band. A single paragraph
 * chopped into cells is the SaaS card kit this site has spent its history
 * avoiding.
 *
 * ── NUMBERS ONLY FOR A SEQUENCE ──────────────────────────────────────────────
 * `as="ol"` is for items whose order is the content: /evidence's three steps,
 * each of which happens only if the one before it survives. Pass the numeral as
 * `label` there and it is hidden from the accessibility tree, because the list
 * already announces its own numbers. Nothing else on the site gets a number.
 *
 * ── THE SQUARE MEANS WHAT IT MEANS EVERYWHERE ELSE ────────────────────────────
 * `open` draws the 7px rose square `.under-test` carries: not settled. When any
 * item passes `open`, every title gets the same `pl-5` gutter so the settled
 * ones do not start 20px to the left of the open ones. That is the rule the
 * home record's rows used, moved here with them.
 */

export type Cell = {
  key: string;
  label?: string;
  /** Optional: a cell that holds a paragraph, such as a step, has only a body. */
  title?: string;
  body?: string;
  /** Draws the rose square. `false` still reserves the gutter. */
  open?: boolean;
  /** Makes the whole cell one link. */
  href?: string;
};

type Cols = 2 | 3 | 4;

// Written out in full so Tailwind can see every class.
const MD: Record<1 | Cols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};
const LG: Record<Cols, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};
const XL: Record<Cols, string> = {
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
};

/** `data` sets the title in the mono value register; `sans` as a short claim. */
type Face = "data" | "sans";

export default function Cells({
  items,
  cols,
  md = 2,
  xl,
  as = "ul",
  face = "sans",
  lead = false,
  underStrip = false,
  className = "",
  style,
}: {
  /** For `.reveal`'s `animationDelay`, where the cells join a page's entrance. */
  style?: CSSProperties;
  /**
   * Set bodies in the lead register, 20px in full ink, for cells that carry a
   * page's argument rather than a note about an item. /vision's opening pair.
   */
  lead?: boolean;
  /**
   * For cells that come directly under a band's strip, with nothing between.
   *
   * Otherwise the strip's hairline and the cells' top rule run in parallel,
   * 48 to 64px apart with nothing between them, which is the double rule that
   * was taken out from under home's email field. This pulls the figure up by
   * the strip's own bottom margin (`mb-12 md:mb-16` in Strip.tsx; change both
   * together) plus 1px, so the strip's rule *is* the figure's top edge and the
   * cells' vertical rules hang from it.
   */
  underStrip?: boolean;
  items: readonly Cell[];
  /** Columns from `lg`. */
  cols: Cols;
  /**
   * Columns from `md` to `lg`. Pick the value that leaves no orphan in the last
   * row for this item count, or 1 where the cells hold paragraphs: at 768 the
   * track is 688px, and three columns of body text are 200px wide.
   */
  md?: 1 | Cols;
  /**
   * Columns from `xl`, where a row needs more width than `lg` gives it. Four
   * cells at 1024 are 194px each, which is five lines for a 17px mono title;
   * at 1280 they are 258.
   */
  xl?: Cols;
  /** `dl` pairs label and title as term and value. */
  as?: "ul" | "ol" | "dl";
  face?: Face;
  className?: string;
}) {
  const gutter = items.some((item) => item.open !== undefined);
  const grid = `cells grid-cols-1 ${MD[md]} ${LG[cols]} ${xl ? XL[xl] : ""} ${
    underStrip ? "-mt-[calc(3rem+1px)] md:-mt-[calc(4rem+1px)]" : ""
  } ${className}`;

  const titleClass =
    face === "data"
      ? "data text-[1.0625rem]"
      : "display text-xl leading-[1.35] md:text-2xl";

  const body = (item: Cell) => {
    const Label = as === "dl" ? "dt" : "p";
    const Value = as === "dl" ? "dd" : "p";
    return (
      <>
        {item.label && (
          <Label
            aria-hidden={as === "ol" ? true : undefined}
            className="mb-3 flex items-center justify-between gap-4 font-mono md:mb-4 text-[11px] uppercase leading-[1.6] tracking-[0.22em] text-ink-dim"
          >
            {item.label}
            {item.href && (
              <span
                aria-hidden="true"
                className="text-ink transition-transform duration-300 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            )}
          </Label>
        )}
        {item.title && (
          <Value
            className={`${titleClass} relative ${gutter ? "pl-5" : ""} ${
              item.open ? "text-accent" : "text-ink"
            } ${
              item.href
                ? "transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent"
                : ""
            }`}
          >
            {item.open && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.5em] h-[7px] w-[7px] bg-accent"
              />
            )}
            {item.title}
          </Value>
        )}
        {item.body && (
          <Value
            className={`${item.title ? "mt-3" : ""} max-w-[34rem] ${
              lead
                ? "text-lg leading-relaxed text-ink md:text-xl md:leading-[1.5]"
                : "text-lg leading-relaxed text-ink-soft"
            }`}
          >
            {item.body}
          </Value>
        )}
      </>
    );
  };

  if (as === "dl") {
    return (
      <dl className={grid} style={style}>
        {items.map((item) => (
          <div key={item.key}>{body(item)}</div>
        ))}
      </dl>
    );
  }

  const List = as;
  return (
    <List className={grid} style={style}>
      {items.map((item) =>
        item.href ? (
          // The cell is the link, so the padding moves from the item onto it
          // and the whole cell is the hit area.
          <li key={item.key} className="py-0">
            <Link
              href={item.href}
              prefetch={false}
              className="group block h-full pb-6 pt-5 md:pb-8 md:pt-6"
            >
              {body(item)}
            </Link>
          </li>
        ) : (
          <li key={item.key}>{body(item)}</li>
        ),
      )}
    </List>
  );
}
