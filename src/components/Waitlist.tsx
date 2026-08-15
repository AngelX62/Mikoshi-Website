"use client";

import { useState, type FormEvent } from "react";
import { footer, waitlist } from "@/content";
import {
  CELL_MAX,
  WaitlistUnconfigured,
  isValidEmail,
  submitWaitlist,
} from "@/lib/waitlist";
import { pulseField } from "./DitherField";

type Status = "idle" | "submitting" | "success" | "error" | "unconfigured";

/**
 * Two fields on two hairlines, and a form that cannot claim success it did not
 * have.
 *
 * **The cell line comes first**, because it is what the copy above actually
 * asks for and because an address alone is a lead nobody can prioritise. It is
 * optional, so the fast path is still one field and a button.
 *
 * **`unconfigured` is a status, not an error.** With no endpoint configured the
 * submission cannot go anywhere, and the honest response is to say so and give
 * the reader the address in the footer rather than to show them the generic
 * failure, which would imply the form is fine and the network was not. See the
 * note at the top of lib/waitlist.ts.
 */
export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [cell, setCell] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage(waitlist.errorInvalid);
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      await submitWaitlist(email, cell);
      setStatus("success");
      setMessage(waitlist.success);
      setEmail("");
      setCell("");
      // Sending an address is itself a sample — the field flares to acknowledge
      // it. Cheaper and more on-concept than a checkmark.
      pulseField();
    } catch (err) {
      if (err instanceof WaitlistUnconfigured) {
        setStatus("unconfigured");
        setMessage(waitlist.errorUnconfigured);
      } else {
        setStatus("error");
        setMessage(waitlist.errorGeneric);
      }
    }
  }

  const isDone = status === "success";
  const locked = status === "submitting" || isDone;

  /** Clears a stale result the moment the reader starts changing the input. */
  const touched = () => {
    if (status === "error" || status === "unconfigured") {
      setStatus("idle");
      setMessage("");
    }
  };

  const row =
    "group relative flex items-center border-b border-edge transition-colors duration-500 focus-within:border-accent";

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-3 text-xl font-medium tracking-[-0.01em] md:text-2xl">
        {waitlist.heading}
      </h2>
      {/* See the note in Deployment.tsx. This one sits over the footer's
          re-condensing wordmark, which is the busiest ground on the page. */}
      <p className="mb-7 text-sm leading-relaxed text-ink-soft">{waitlist.body}</p>

      <form onSubmit={onSubmit} noValidate>
        {/* The answer to the question the copy just asked. */}
        <div className={row}>
          <label htmlFor="waitlist-cell" className="sr-only">
            {waitlist.cellLabel}
          </label>
          <input
            id="waitlist-cell"
            type="text"
            name="cell"
            maxLength={CELL_MAX}
            placeholder={waitlist.cellPlaceholder}
            value={cell}
            disabled={locked}
            onChange={(e) => {
              setCell(e.target.value);
              touched();
            }}
            className="w-full bg-transparent py-4 pr-4 text-base text-ink outline-none placeholder:text-ink-dim disabled:opacity-50"
          />
        </div>

        <div className={`${row} mt-2`}>
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>

          <input
            id="waitlist-email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder={waitlist.placeholder}
            value={email}
            disabled={locked}
            onChange={(e) => {
              setEmail(e.target.value);
              touched();
            }}
            aria-invalid={status === "error"}
            aria-describedby="waitlist-status"
            className="w-full bg-transparent py-4 pr-4 text-base text-ink outline-none placeholder:text-ink-dim disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={locked}
            className="shrink-0 whitespace-nowrap py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim transition-colors duration-300 hover:text-accent focus-visible:text-accent disabled:opacity-40"
          >
            {status === "submitting" || isDone ? (
              status === "submitting" ? (
                "Sending"
              ) : (
                "Sent"
              )
            ) : (
              // Idle only: the swap needs a stable label on both faces, and the
              // transient states replace the text outright.
              <span className="swap">
                <span>{waitlist.cta}</span>
                <span aria-hidden="true">{waitlist.cta}</span>
              </span>
            )}
          </button>
        </div>

        {/*
          Reserved height, so the layout doesn't shift when a message appears.
          `role="status"` announces the result without stealing focus.
        */}
        <p
          id="waitlist-status"
          role="status"
          aria-live="polite"
          className={`mt-3 min-h-5 font-mono text-[11px] uppercase tracking-[0.16em] ${
            status === "error" || status === "unconfigured"
              ? "text-accent-soft"
              : "text-ink-dim"
          }`}
        >
          {message}
          {status === "unconfigured" && (
            <>
              {" "}
              <a
                href={`mailto:${footer.email}`}
                className="underline underline-offset-4 transition-colors duration-300 hover:text-ink"
              >
                {footer.email}
              </a>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
