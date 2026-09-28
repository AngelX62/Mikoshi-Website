import { nav } from "@/content";

/**
 * The right half of an opening strip: which sheet this is, in words.
 *
 * Strip.tsx was built to state an identifier twice, once as a symbol on the
 * left and once spelled out on the right, and for the whole life of the site
 * the right half went unused: every opening band passed a label and nothing
 * else, so the strip was a caption with half its register missing.
 *
 * "Sheet two of four" is true information rather than furniture. The count and
 * the order come from `nav`, so renaming or reordering a route renumbers every
 * sheet without anything else being touched, and the number can never disagree
 * with the header. Home is not a sheet: it is the title card, and the nav does
 * not list it.
 *
 * Spelled rather than numeric because the reference frame this is lifted from
 * spells its identifier on the right, `LETTER "A" FORWARD SLASH ZERO ZERO ONE`,
 * and because "02 / 04" in 10px mono at the far end of a rule reads as a page
 * number, which is a smaller claim than the strip is making.
 */
const WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight"];

export function sheetOf(href: string): string | undefined {
  const i = nav.findIndex((item) => item.href === href);
  if (i === -1) return undefined;
  const n = WORDS[i] ?? String(i + 1);
  const of = WORDS[nav.length - 1] ?? String(nav.length);
  return `Sheet ${n} of ${of}`;
}
