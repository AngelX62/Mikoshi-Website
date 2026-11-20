"use client";

import { useState, useSyncExternalStore } from "react";
import type { review } from "./_copy";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

export function PreviewUpdates({copy:u}:{copy:typeof review.updates}) {
  const ready = useSyncExternalStore(subscribe, client, server);
  const [done, setDone] = useState(false);
  return <section className="ar-updates ar-reading" id="updates" aria-labelledby="updates-title" tabIndex={-1}>
    <h2 id="updates-title">{u.title}</h2>
    <form action="#updates" onSubmit={e => {
      e.preventDefault();
      e.currentTarget.reset();
      setDone(true);
    }}>
      <label htmlFor="preview-email">{u.label}</label>
      <div className="ar-email-line">
        {/* No name, endpoint, storage or network callback. In static HTML both controls are disabled. */}
        <input id="preview-email" type="email" required autoComplete="off" disabled={!ready}
          aria-describedby="preview-notice" onChange={() => setDone(false)} />
        <button type="submit" disabled={!ready}>{u.button}</button>
      </div>
      <p id="preview-notice" role="status">{done ? u.confirm : u.note}</p>
    </form>
  </section>;
}
