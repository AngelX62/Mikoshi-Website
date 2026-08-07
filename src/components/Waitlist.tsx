"use client";

import { useState, type FormEvent } from "react";
import { waitlist } from "@/content";
import { isValidEmail, submitWaitlist } from "@/lib/waitlist";
import { pulseField } from "./DitherField";

type Status = "idle" | "submitting" | "success" | "error";

export default function Waitlist() {
  const [email, setEmail] = useState("");
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
      await submitWaitlist(email);
      setStatus("success");
      setMessage(waitlist.success);
      setEmail("");
      // Sending an address is itself a sample — the field flares to acknowledge
      // it. Cheaper and more on-concept than a checkmark.
      pulseField();
    } catch {
      setStatus("error");
      setMessage(waitlist.errorGeneric);
    }
  }

  const isDone = status === "success";

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-3 text-xl font-medium tracking-[-0.01em] md:text-2xl">
        {waitlist.heading}
      </h2>
      <p className="mb-7 text-sm leading-relaxed text-ink-dim">{waitlist.body}</p>

      <form onSubmit={onSubmit} noValidate>
        <div className="group relative flex items-center border-b border-edge transition-colors duration-500 focus-within:border-accent">
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
            disabled={status === "submitting" || isDone}
            onChange={(e) => {
              setEmail(e.target.value);
              // Clear a stale error as soon as the user starts fixing it.
              if (status === "error") {
                setStatus("idle");
                setMessage("");
              }
            }}
            aria-invalid={status === "error"}
            aria-describedby="waitlist-status"
            className="w-full bg-transparent py-4 pr-4 text-base text-ink outline-none placeholder:text-ink-faint disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={status === "submitting" || isDone}
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
            status === "error" ? "text-accent-soft" : "text-ink-faint"
          }`}
        >
          {message}
        </p>
      </form>
    </div>
  );
}
