import {
  CELL_MAX,
  SOURCES,
  TRAP_FIELD,
  isValidEmail,
  type SubscribeSource,
} from "@/lib/waitlist";

/**
 * The one server route on the site, and the reason `output: "export"` is gone.
 *
 * It exists because Buttondown cannot be reached from a browser. Their embed
 * endpoint has to be the action of a native HTML form and their docs say not to
 * call it with `fetch`, since a subscriber sometimes has to follow the response
 * to clear a CAPTCHA. Their API refuses cross-origin browser requests outright
 * and directs you to a server-side proxy. This is that proxy.
 *
 * Two things it buys beyond working at all. The API key is a server secret
 * rather than a `NEXT_PUBLIC_` value inlined into every visitor's bundle. And
 * the reader stays on the site at the moment they convert, instead of being
 * thrown to a page with somebody else's branding on it.
 *
 * ── THE RULE THIS FILE INHERITS ──────────────────────────────────────────────
 * lib/waitlist.ts exists because the form once lied: it resolved after 900ms
 * and said "Received" while discarding the address. Everything below is written
 * so that the page can only ever say something true. Each Buttondown outcome
 * maps to exactly one status, and the ambiguous cases resolve toward not
 * claiming a success.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BUTTONDOWN = "https://api.buttondown.com/v1/subscribers";

/**
 * Read at call time, not at module scope.
 *
 * At module scope this would be captured during the build, where the key is
 * legitimately absent, and the route would answer 503 forever no matter what
 * the running environment held.
 */
const keyOf = () => process.env.BUTTONDOWN_API_KEY ?? "";

type Payload = {
  email_address: string;
  tags?: string[];
  metadata?: Record<string, string>;
};

async function postToButtondown(key: string, payload: Payload) {
  return fetch(BUTTONDOWN, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Whether a 400 is "this address is already subscribed" rather than a fault.
 *
 * Buttondown returns 400 both for a collision and for a suppressed address, and
 * the two are told apart by the body. Read it rather than assuming, because the
 * two answers the reader gets are opposite: one is a success in different words
 * and the other must not be reported as one.
 */
function isCollision(body: string): boolean {
  return /already|exists|collision|duplicate/i.test(body);
}

/**
 * Whether this request came from a form on this site.
 *
 * ── WHAT THIS IS AND, MORE IMPORTANTLY, WHAT IT IS NOT ───────────────────────
 * The Fetch standard requires an `Origin` header on every POST, including a
 * same-origin one, so a request from either of this site's forms always carries
 * it and a request missing it never came from a browser. That makes this a
 * cheap, exact filter against scripted signups, which is the traffic a public
 * unauthenticated endpoint actually attracts.
 *
 * **It is not a security control and must not be written down as one.** An
 * `Origin` header is one line in any HTTP client, so anyone who reads this file
 * defeats it in a minute. What it buys is the removal of the effortless case.
 *
 * A real defence is a rate limit, and a rate limit needs state that outlives one
 * request: Vercel KV or Upstash, keyed on IP. That is a follow-up, and until it
 * exists the honest description of this endpoint is that it is gated, not
 * protected.
 *
 * `host` is compared rather than a hardcoded domain, so this keeps working on a
 * preview deployment, on the production alias and on localhost without carrying
 * a list of hostnames that would go stale the moment a domain is bought.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // Checked before the key, so a scripted probe learns nothing about whether
  // the site is wired up.
  if (!sameOrigin(request)) return new Response(null, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;

  /**
   * The honeypot, and **it answers 204 rather than an error on purpose.**
   *
   * A human never sees this field, so a value in it is a form-filler working
   * down the DOM. Returning 403 would tell whoever wrote it exactly which field
   * to leave alone next time, and the run would come back corrected. A 204 is
   * indistinguishable from a successful signup, so the address is discarded and
   * the bot has no signal that anything went wrong.
   *
   * Nothing is sent to Buttondown and nothing is logged, which also means a
   * human who somehow reaches this branch is told their message was received
   * when it was not. That is the one place on this site where the form does not
   * say something strictly true, and it is accepted because the field is
   * `aria-hidden` and removed from the tab order: reaching it by accident is not
   * a path that exists. See SubscribeForm.tsx.
   */
  if (typeof input[TRAP_FIELD] === "string" && input[TRAP_FIELD].trim()) {
    return new Response(null, { status: 204 });
  }

  /**
   * ── THE KEY CHECK IS BELOW THE TRAP, AND IT USED TO BE ABOVE IT ─────────────
   * Nothing to deliver to. Say so plainly and let the form tell the truth, which
   * is the whole reason `WaitlistUnconfigured` exists.
   *
   * It was the first thing this function did, which made the honeypot
   * unreachable whenever the key was absent: a trap that only works once the
   * site is fully configured is a trap with a hole in it, and the hole is
   * exactly the window between the first deploy and somebody remembering to set
   * the variable. It also answered a scripted probe with a 503, which tells it
   * more about this deployment than a discarded signup does.
   *
   * Nothing above this line contacts Buttondown or needs a key, so the check
   * belongs here rather than at the top.
   */
  const key = keyOf();
  if (!key) return new Response(null, { status: 503 });

  const email = typeof input.email === "string" ? input.email.trim() : "";
  const cell = typeof input.cell === "string" ? input.cell.trim().slice(0, CELL_MAX) : "";
  const raw = typeof input.source === "string" ? input.source : "";

  // Validated here as well as in the component. The component's copy of this
  // check is a courtesy that saves a round trip on a typo; this one is the
  // real one, because a public endpoint is reachable by things that are not
  // the form.
  if (!isValidEmail(email)) return new Response(null, { status: 400 });

  // Never forward an unrecognised tag. It gets written into someone else's
  // system, so it comes from a fixed list rather than from the request.
  const source: SubscribeSource = SOURCES.includes(raw as SubscribeSource)
    ? (raw as SubscribeSource)
    : "contact";

  const full: Payload = {
    email_address: email,
    tags: [source],
    ...(cell ? { metadata: { cell } } : {}),
  };

  /** One attempt, resolved down to the two facts the caller needs. */
  const attempt = async (payload: Payload) => {
    const res = await postToButtondown(key, payload);
    // Read once. A Response body is a stream and can only be consumed the one
    // time, and every branch below needs to know what it said.
    const text = res.ok ? "" : await res.text();
    return { status: res.status, ok: res.ok, text };
  };

  let result: { status: number; ok: boolean; text: string };
  try {
    result = await attempt(full);

    /**
     * **The retry is the most important thing in this file.**
     *
     * Tagging is gated on Buttondown's plan and answers 403 when it is off, and
     * a rejected or unknown field answers 4xx too. Without this, a free account
     * would fail every single signup while the page showed a generic error, and
     * the address would be gone.
     *
     * The address is the thing worth having. The tag and the cell line are
     * conveniences. So anything that is neither a collision nor a server fault
     * gets one more attempt carrying nothing but the address.
     */
    const collided = result.status === 400 && isCollision(result.text);
    const worthRetrying =
      !result.ok && !collided && result.status >= 400 && result.status < 500;

    if (worthRetrying) result = await attempt({ email_address: email });
  } catch {
    // Buttondown unreachable. Not the reader's fault and not a success.
    return new Response(null, { status: 502 });
  }

  if (result.ok) return new Response(null, { status: 204 });

  // 409 rather than passing the 400 through, so the client has one unambiguous
  // signal for "already on the list" and can show it as the success it is.
  if (result.status === 400 && isCollision(result.text)) {
    return new Response(null, { status: 409 });
  }

  return new Response(null, { status: 502 });
}
