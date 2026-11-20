"use client";

import { useId, useState, useSyncExternalStore } from "react";
import type { review } from "./_copy";

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function FirstTokenPrint({ copy }: { copy: typeof review.print }) {
  const id = useId();
  const [impression, reprint] = useState(0);
  const canReplay = useSyncExternalStore(subscribe, onClient, onServer);
  const glyph = id + "-glyph";
  const glaze = id + "-edge";

  return (
    <figure className="ar-print" aria-labelledby={id+"-title"} aria-describedby={id+"-caption"}>
      <div className="ar-print-heading">
        <span className="ar-print-number" aria-hidden="true">{copy.number}</span>
        <span id={id+"-title"}>{copy.title}</span>
      </div>
      <span className="ar-print-transcript">{copy.prompt} {copy.token}</span>
      {/* All three impressions use the same glyph and a fixed sheet. Only ink
          moves; the usable final print is already present in the HTML. */}
      <svg className="ar-print-sheet" viewBox="0 0 520 155" width="520" height="155"
        aria-hidden="true" focusable="false">
        <defs>
          <text id={glyph} className="ar-print-word" x="306" y="104"
            textLength="180" lengthAdjust="spacingAndGlyphs">{copy.token}</text>
          <linearGradient id={glaze} x1="0%" y1="85%" x2="100%" y2="15%">
            <stop stopColor="#86253d"/><stop offset=".68" stopColor="#962a45"/>
            <stop offset=".79" stopColor="#b9676f"/><stop offset=".94" stopColor="#962a45"/>
          </linearGradient>
        </defs>
        <g className="ar-print-guides" fill="none" strokeWidth="1">
          <path d="M3 103.5h7 M502 103.5h7 M305.5 20v7 M305.5 129v7"/>
        </g>
        <text className="ar-print-prompt" x="19" y="104" textLength="264"
          lengthAdjust="spacingAndGlyphs">{copy.prompt}</text>
        <g key={impression}>
          <use href={"#"+glyph} className="ar-print-plate ar-plate-a" fill="#59414a"/>
          <use href={"#"+glyph} className="ar-print-plate ar-plate-b" fill="#af606b"/>
          <use href={"#"+glyph} className="ar-print-plate ar-plate-c" fill={"url(#"+glaze+")"}/>
          <use href={"#"+glyph} className="ar-print-solid"/>
        </g>
      </svg>
      <figcaption>
        <span id={id+"-caption"}>{copy.caption}</span>
        <button type="button" className="ar-print-replay" disabled={!canReplay}
          onClick={() => reprint(n => n + 1)}>
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor"
            strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M3.1 6.3a5.1 5.1 0 1 1 .45 4.3M3 2.5v4.1h4.1"/>
          </svg>{copy.replay}
        </button>
      </figcaption>
    </figure>
  );
}
