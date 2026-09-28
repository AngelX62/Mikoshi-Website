/**
 * Subscription, from the browser's side.
 *
 * **This used to be a stub that lied.** It waited 900ms, resolved, and the form
 * above it said "Received. We will be in touch." Nothing was stored and nothing
 * was sent, so every address ever typed into the only conversion path on the
 * site was discarded while the person who typed it was told otherwise. A form
 * that cannot deliver has exactly two honest options, and pretending is not one
 * of them: deliver, or say it cannot. That principle is the reason this file
 * exists and it has survived two rewrites of what sits under it.
 *
 * ── WHAT CHANGED, AND WHY IT HAD TO ──────────────────────────────────────────
 * It posted straight from the browser to a hosted form endpoint named by
 * `NEXT_PUBLIC_WAITLIST_ENDPOINT`. That worked for Formspree and its kind, and
 * it does not work for Buttondown, which is where the list actually lives now.
 *
 * Buttondown cannot be reached from a page. Their embed endpoint has to be the
 * action of a native HTML form and their docs say in as many words not to call
 * it with `fetch`, because a subscriber sometimes has to follow the response to
 * clear a CAPTCHA or correct a validation error. Their API refuses cross-origin
 * browser requests and points you at a server-side proxy instead.
 *
 * So the browser now posts to this site's own `/api/subscribe/`, which holds the
 * key and talks to Buttondown out of view. Two things fall out of that, both
 * good: the key is a server secret rather than a value inlined into the bundle,
 * and the reader never leaves the site to a page that is not ours.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Which form an address came from.
 *
 * Passed through to Buttondown as a tag so the two lists can be told apart in
 * one account. Shared with the route handler, which validates against it rather
 * than forwarding whatever arrives: this is a public endpoint now and the tag
 * ends up written into somebody else's system.
 */
export type SubscribeSource = "home" | "contact";

export const SOURCES: readonly SubscribeSource[] = ["home", "contact"] as const;

/** Thrown when the server cannot deliver, so the UI can say something true. */
export class WaitlistUnconfigured extends Error {
  constructor() {
    super("No subscribe endpoint configured");
    this.name = "WaitlistUnconfigured";
  }
}

/**
 * Thrown when the address is already subscribed.
 *
 * Its own class because it is **not a failure** and must not be shown as one.
 * Telling somebody "something went wrong" because they are already on the list
 * is both false and the most annoying possible response. See the collision note
 * in api/subscribe/route.ts.
 */
export class AlreadySubscribed extends Error {
  constructor() {
    super("Already subscribed");
    this.name = "AlreadySubscribed";
  }
}

/**
 * Pragmatic email check: catches typos without rejecting valid-but-unusual
 * addresses. Real validation is confirming the address receives mail.
 *
 * Used on both sides now. The component runs it so a typo costs no round trip;
 * the route runs it because the endpoint is reachable by things that are not
 * the form.
 */
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (value.length < 6 || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * How much of the cell description to accept.
 *
 * Long enough for a real sentence about a real cell, short enough that the field
 * cannot be used to post a payload at whatever service is on the other end.
 */
export const CELL_MAX = 280;

/**
 * The site's own endpoint.
 *
 * **The trailing slash is not optional.** `trailingSlash: true` is set in
 * next.config.ts, so posting to `/api/subscribe` earns a 307 to
 * `/api/subscribe/` on every single submission. The redirect does preserve the
 * method, so it would work and quietly cost a round trip forever.
 */
const ENDPOINT = "/api/subscribe/";

/**
 * The honeypot's field name, shared so the form and the route cannot disagree.
 *
 * It has to read like a field a form would plausibly carry, because a bot that
 * recognises it as a trap simply leaves it alone. "Company" is the most ordinary
 * thing missing from a form that already asks for an address.
 */
export const TRAP_FIELD = "company";

export async function submitWaitlist(
  email: string,
  cell: string = "",
  source: SubscribeSource = "contact",
  trap: string = "",
): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      // Named rather than sent as a bare second field, so whatever inbox this
      // lands in shows a question and an answer instead of two loose strings.
      cell: cell.trim().slice(0, CELL_MAX),
      source,
      [TRAP_FIELD]: trap,
    }),
  });

  if (res.ok) return;
  if (res.status === 409) throw new AlreadySubscribed();
  if (res.status === 503) throw new WaitlistUnconfigured();
  throw new Error(`Submission failed: ${res.status}`);
}
