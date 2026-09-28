"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  AlreadySubscribed,
  CELL_MAX,
  TRAP_FIELD,
  WaitlistUnconfigured,
  isValidEmail,
  submitWaitlist,
  type SubscribeSource,
} from "@/lib/waitlist";

/**
 * Fields on hairlines, and a form that cannot claim a success it did not have.
 *
 * **This was `Waitlist.tsx` and served one page.** It serves two now, because
 * home grew a second ask aimed at a different audience, and two copies of a
 * status machine is two chances for only one of them to keep telling the truth.
 * What varies between the two is a tag, a cell line and some words. What does
 * not vary is the part that matters.
 *
 * **`unconfigured` is a status, not an error.** If the server cannot deliver,
 * the honest response is to say so rather than to show the generic failure,
 * which would imply the form is fine and the network was not. See the note at
 * the top of lib/waitlist.ts for the stub that lied and why this exists.
 *
 * **A duplicate is a success.** An address that is already subscribed comes
 * back as `AlreadySubscribed` and is shown in the ordinary ink, not the accent.
 * Telling somebody that something went wrong because they already signed up is
 * both false and the most irritating answer available.
 */

export type SubscribeCopy = {
  placeholder: string;
  cta: string;
  success: string;
  already: string;
  errorInvalid: string;
  errorGeneric: string;
  errorUnconfigured: string;
  cellPlaceholder?: string;
  cellLabel?: string;
};

/**
 * `invalid` is split from `error`, and the split is what `aria-invalid` needs.
 *
 * Both render identically: the accent, and a line of copy. They are not the
 * same claim. `invalid` says the address is wrong, `error` says the send
 * failed, and the field used to carry `aria-invalid` for both. A dropped
 * connection or a 502 from Buttondown therefore told assistive tech that a
 * perfectly good email address was malformed, which sends the reader looking
 * for a typo that is not there.
 */
type Status =
  | "idle"
  | "submitting"
  | "success"
  | "invalid"
  | "error"
  | "unconfigured";

export default function SubscribeForm({
  source,
  copy,
  /**
   * The optional cell line, and only /contact asks for it.
   *
   * It is what the copy beside that form asks about, and an address alone is a
   * lead nobody can prioritise. Home does not ask: its band asks for nothing
   * but an address, so its fast path is one field and a button.
   */
  withCell = false,
  idPrefix = "subscribe",
}: {
  source: SubscribeSource;
  copy: SubscribeCopy;
  withCell?: boolean;
  /** Both forms can appear in one document, so the ids have to differ. */
  idPrefix?: string;
}) {
  const [email, setEmail] = useState("");
  const [cell, setCell] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  /**
   * The honeypot, read from the DOM rather than held in state, **and the
   * difference is the whole point of it.**
   *
   * Every other field here is controlled, because every other field is typed by
   * a person and React's synthetic `onChange` sees it. A form-filler often is
   * not a person typing: the cheap ones assign `input.value` directly and click
   * submit, which fires no React change event at all. A controlled honeypot
   * would read back as empty for exactly the traffic it exists to catch.
   *
   * A ref reads whatever is in the element at the moment of submit, however it
   * got there, which covers both the scripted assignment and the headless
   * browser that really types.
   */
  const trapRef = useRef<HTMLInputElement>(null);

  const emailId = `${idPrefix}-email`;
  const cellId = `${idPrefix}-cell`;
  const statusId = `${idPrefix}-status`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    if (!isValidEmail(email)) {
      setStatus("invalid");
      setMessage(copy.errorInvalid);
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      await submitWaitlist(
        email,
        withCell ? cell : "",
        source,
        trapRef.current?.value ?? "",
      );
      setStatus("success");
      setMessage(copy.success);
      setEmail("");
      setCell("");
    } catch (err) {
      if (err instanceof AlreadySubscribed) {
        // Not an error. They are on the list, which is what they wanted.
        setStatus("success");
        setMessage(copy.already);
        setEmail("");
        setCell("");
      } else if (err instanceof WaitlistUnconfigured) {
        setStatus("unconfigured");
        setMessage(copy.errorUnconfigured);
      } else {
        setStatus("error");
        setMessage(copy.errorGeneric);
      }
    }
  }

  const isDone = status === "success";
  const sending = status === "submitting";
  const failed =
    status === "invalid" || status === "error" || status === "unconfigured";

  /**
   * Clears a stale result the moment the reader starts changing the input.
   *
   * **Success clears too, now that a success no longer disables the form.**
   * Otherwise typing a second address would leave "Sent" on the button and the
   * previous confirmation under it while a different address sat in the field,
   * which is the form claiming something it has not done yet.
   */
  const touched = () => {
    if (status !== "idle" && status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
  };

  /**
   * **The row wraps, and it has to.**
   *
   * The button does not shrink, by design: `Start a conversation` is 184px of
   * tracked mono and squeezing chrome out of its one register site-wide to make
   * a row fit is the wrong trade. So the input took whatever was left, and on
   * /contact that was 112.8px at 360 and 136px at 768 against a placeholder
   * needing 141.9. `you@company.com` rendered as `you@compan`, which reads as a
   * broken field rather than as a tight one.
   *
   * `flex-wrap` with a floor under the input fixes it without touching either
   * type size. When the two cannot share a line the button drops to its own,
   * still right-aligned by `ml-auto` so it sits where it sits on a wide screen,
   * and the hairline runs under both because they are still one row.
   *
   * `min-w-0` matters as much as the basis: a flex item's default `min-width:
   * auto` refuses to go below its content, which is what let the input push
   * past its share in the first place.
   */
  const row =
    "flex flex-wrap items-center border-b border-rule transition-colors duration-500 focus-within:border-accent";

  /**
   * **`outline-none` was here and it took the site's focus indicator with it.**
   *
   * globals.css sets a 2px accent ring on `:focus-visible` and argues the case
   * at length: it is the one mark that has to survive being looked for rather
   * than looked at, which is what WCAG 2.2's focus appearance minimum is about.
   * `outline-none` cancelled that on both inputs.
   *
   * What stood in for it was `focus-within:border-accent` on `row`, and that
   * row wraps **the email field and the submit button together**. So tabbing
   * from one to the other lit the same hairline both times and moved nothing:
   * the indicator could not say which control had focus, which is the only
   * thing a focus indicator is for. It is also 1px against the required 2.
   *
   * The row's hairline stays, because a field lighting up as you enter it is
   * good and costs nothing. It is no longer the indicator.
   */
  const field =
    "min-w-0 flex-1 basis-40 bg-transparent py-4 pr-4 text-base text-ink placeholder:text-ink-dim disabled:opacity-50";

  /**
   * ── NOTHING IS DISABLED ANY MORE, AND THAT IS THE ACCESSIBLE VERSION ─────────
   * Both inputs and the button carried `disabled={submitting || success}`.
   * Two defects came out of one line.
   *
   * **Disabling the control you just used throws focus away.** A disabled
   * element cannot hold focus, so pressing Enter in the email field or clicking
   * Send moved focus to `<body>` for the length of the request. Measured: after
   * a submit, `document.activeElement` was `BODY`. A keyboard or screen reader
   * user is then at the top of the document with no way back to where they
   * were, at the exact moment the form is about to say something.
   *
   * **And `success` never cleared**, so after one send every control on the
   * form stayed disabled for the life of the page. Adding a colleague's address
   * meant reloading.
   *
   * A double submit was the thing `disabled` was buying, and `onSubmit` already
   * returns early while one is in flight, so it was buying nothing that was not
   * already paid for. `aria-busy` says the same thing to assistive tech without
   * taking anything away, and the button's own label carries it visually.
   *
   * The fields stay editable while sending on purpose: the request already has
   * the value it was given, so typing into them can affect nothing.
   */
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={sending}
      // `relative` anchors the honeypot below. Without it the absolute div
      // resolves against whatever ancestor happens to be positioned, which on
      // home is the hero section and is not something this component should be
      // depending on.
      className="relative w-full"
    >
      {/*
        ── THE HONEYPOT. NOBODY SEES THIS AND NOBODY CAN REACH IT ──────────────
        Off-screen rather than `display: none`, because a form-filler worth
        catching skips a field the browser reports as having no box. Off-screen
        it is a normal, fillable input to anything reading the DOM, and invisible
        to anything reading the page.

        Off-screen alone would leave it reachable, so three attributes take it
        back out: `aria-hidden` keeps it off the accessibility tree,
        `tabIndex={-1}` takes it out of the tab order, and `autoComplete="off"`
        stops a password manager helpfully filling it in and getting a real
        reader silently discarded. All three are load-bearing.

        `left` is negative, so this cannot extend the document's scroll width.
        A positive offset here would give every page carrying a form a
        horizontal scrollbar.
      */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <input
          ref={trapRef}
          type="text"
          name={TRAP_FIELD}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {withCell && (
        /* The answer to the question the copy beside this just asked. */
        <div className={row}>
          <label htmlFor={cellId} className="sr-only">
            {copy.cellLabel}
          </label>
          <input
            id={cellId}
            type="text"
            name="cell"
            maxLength={CELL_MAX}
            placeholder={copy.cellPlaceholder}
            value={cell}
            onChange={(e) => {
              setCell(e.target.value);
              touched();
            }}
            className={field}
          />
        </div>
      )}

      <div className={`${row} ${withCell ? "mt-3" : ""}`}>
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={copy.placeholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            touched();
          }}
          aria-invalid={status === "invalid"}
          aria-describedby={statusId}
          className={field}
        />

        {/* `opacity-60` while sending rather than `disabled:opacity-40`: the
            button is still focusable, so it still has to be legible. */}
        <button
          type="submit"
          className={`ml-auto shrink-0 whitespace-nowrap py-4 font-mono text-[11px] uppercase leading-none tracking-[0.22em] text-ink transition-colors duration-300 hover:text-accent focus-visible:text-accent ${
            sending ? "opacity-60" : ""
          }`}
        >
          {sending ? "Sending" : isDone ? "Sent" : copy.cta}
        </button>
      </div>

      {/*
        Reserved height, so the layout does not shift when a message appears.
        `role="status"` announces the result without stealing focus.
      */}
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`mt-4 min-h-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] ${
          failed ? "text-accent" : "text-ink-dim"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
