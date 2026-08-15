/**
 * Contact submission.
 *
 * **This used to be a stub that lied.** It waited 900ms, resolved, and the form
 * above it said "Received. We will be in touch." Nothing was stored and nothing
 * was sent, so every address ever typed into the only conversion path on the
 * site was discarded while the person who typed it was told otherwise. A form
 * that cannot deliver has exactly two honest options, and pretending is not one
 * of them: deliver, or say it cannot.
 *
 * It now does both. With an endpoint configured it posts. Without one it fails
 * loudly with `WaitlistUnconfigured`, and the form tells the reader to email
 * instead rather than thanking them for nothing.
 *
 * ── CONFIGURING IT ───────────────────────────────────────────────────────────
 * Set `NEXT_PUBLIC_WAITLIST_ENDPOINT` at build time to a hosted form endpoint
 * that accepts a JSON POST and needs no secret. Formspree, Formcarry, Basin and
 * Buttondown all do. For example, in `.env.local`:
 *
 *   NEXT_PUBLIC_WAITLIST_ENDPOINT=https://formspree.io/f/xxxxxxxx
 *
 * The variable must be `NEXT_PUBLIC_`, because this file ships to the browser
 * and the value is inlined at build time. That is also why the endpoint must be
 * one that is safe to publish: **never put a key with write access to anything
 * behind it here.** The site is a static export, so anything needing a real
 * secret has to move to a serverless function.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Thrown when no endpoint is configured, so the UI can say something true. */
export class WaitlistUnconfigured extends Error {
  constructor() {
    super("No waitlist endpoint configured");
    this.name = "WaitlistUnconfigured";
  }
}

/**
 * Inlined at build time. Read once here rather than at the call site so there is
 * a single place that knows whether the form can deliver.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT ?? "";

/** Whether the form can actually send. Read by the component to pick its copy. */
export const isWaitlistLive = ENDPOINT.length > 0;

/**
 * Pragmatic email check: catches typos without rejecting valid-but-unusual
 * addresses. Real validation is confirming the address receives mail.
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

export async function submitWaitlist(
  email: string,
  cell: string = "",
): Promise<void> {
  if (!isWaitlistLive) throw new WaitlistUnconfigured();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      // Named rather than sent as a bare second field, so whatever inbox this
      // lands in shows a question and an answer instead of two loose strings.
      cell: cell.trim().slice(0, CELL_MAX),
    }),
  });

  if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
}
