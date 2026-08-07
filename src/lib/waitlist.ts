/**
 * Waitlist submission.
 *
 * ── STUB ─────────────────────────────────────────────────────────────────────
 * There is no backend yet, so this resolves after a short delay and logs the
 * address. Nothing is stored or sent anywhere.
 *
 * To make it real, replace the body of `submitWaitlist` with a single fetch —
 * the calling component already handles the loading, success and error states,
 * so no UI changes are needed. For example, with Formspree:
 *
 *   const res = await fetch("https://formspree.io/f/<your-id>", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", Accept: "application/json" },
 *     body: JSON.stringify({ email }),
 *   });
 *   if (!res.ok) throw new Error("Request failed");
 *
 * Because the site is a static export, anything requiring a secret key needs to
 * go through a hosted form service or a serverless function — never inline the
 * key here, since this file ships to the browser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Pragmatic email check: catches typos without rejecting valid-but-unusual
 * addresses. Real validation is confirming the address receives mail.
 */
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (value.length < 6 || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export async function submitWaitlist(email: string): Promise<void> {
  // TODO: replace with a real endpoint. See the note above.
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (process.env.NODE_ENV === "development") {
    console.info("[waitlist stub] would submit:", email.trim());
  }
}
