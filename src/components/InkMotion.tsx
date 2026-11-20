"use client";

import { useEffect, useId, useRef, useState } from "react";
import { hero, launch } from "@/content";
import {
  createInkGeometry,
  getInkCanvasSize,
  getInkFrame,
  INK_COLORS,
  INK_HEIGHT,
  INK_WIDTH,
} from "@/lib/ink-motion";

const print = createInkGeometry();
const FRAME_INTERVAL = 1000 / 20;
const STILL_PLUME = "M359 238C415 220 552 267 650 319C746 370 789 443 721 521C677 574 621 636 579 650C540 662 532 622 550 579C570 534 540 489 503 447C456 394 390 374 353 329C328 298 329 257 359 238Z";

export default function InkMotion() {
  const captionId = useId();
  const patternId = `${captionId}-ink`;
  const edgeId = `${captionId}-edge`;
  const maskId = `${captionId}-mask`;
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(false);
  const synchronizeRef = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
    synchronizeRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !stage || !context) return;

    // These seven canvases are calculated once. Animation composites whole
    // printed regions; it does not regenerate thousands of grains each frame.
    let backingWidth = 0;
    let plates: { plate: HTMLCanvasElement; paint: CanvasRenderingContext2D | null }[] = [];
    const rebuild = () => {
      const size = getInkCanvasSize(stage.getBoundingClientRect().width, window.devicePixelRatio);
      if (size.width === backingWidth) return;
      backingWidth = size.width;
      const ratio = size.width / INK_WIDTH;
      plates.forEach(({ plate }) => { plate.width = 0; plate.height = 0; });
      canvas.width = size.width;
      canvas.height = size.height;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      plates = Array.from({ length: 7 }, () => {
        const plate = document.createElement("canvas");
        plate.width = size.width;
        plate.height = size.height;
        const paint = plate.getContext("2d");
        if (paint) paint.setTransform(ratio, 0, 0, ratio, 0, 0);
        return { plate, paint };
      });
      print.grains.forEach((grain) => {
        const paint = plates[grain.layer].paint;
        if (!paint) return;
        paint.fillStyle = INK_COLORS[grain.color];
        paint.globalAlpha = grain.alpha;
        paint.fillRect(grain.x, grain.y, grain.radius * 1.7, grain.radius * 1.7);
      });
    };
    rebuild();
    if (plates.some(({ paint }) => !paint)) return;

    let elapsed = 4_300;
    let requestId: number | null = null;
    let lastTime: number | null = null;
    let lastPaint = 0;
    let onScreen = true;
    let disposed = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = preference.matches;
    setReducedMotion(reduce);

    const draw = (still = false) => {
      const frame = still ? { gather: 1, drift: 0 } : getInkFrame(elapsed);
      context.clearRect(0, 0, INK_WIDTH, INK_HEIGHT);
      plates.forEach(({ plate }, index) => {
        const offsetX = frame.drift * (index === 6 ? 20 : index * 7 + 16);
        const offsetY = frame.drift * (index * 3.8 + 5);
        context.globalAlpha = index === 6
          ? 0.65 + frame.drift * 0.35
          : Math.min(1, frame.gather + index * 0.025);
        context.drawImage(plate, offsetX, offsetY, INK_WIDTH, INK_HEIGHT);
      });
      print.squares.forEach((square, index) => {
        context.fillStyle = INK_COLORS[square.color];
        context.globalAlpha = square.alpha * (0.72 + frame.gather * 0.28);
        const offset = frame.drift * (Math.max(0, index - 4) * 2.1 + 8);
        context.fillRect(square.x - offset, square.y - offset * 0.5, square.size, square.size);
      });
      context.globalAlpha = 1;
    };

    const canRun = () => !disposed && !reduce && !pausedRef.current && onScreen && !document.hidden;

    const tick = (now: number) => {
      requestId = null;
      if (!canRun()) return;
      if (lastTime !== null) elapsed += Math.min(now - lastTime, 100);
      lastTime = now;
      if (now - lastPaint >= FRAME_INTERVAL) {
        draw();
        lastPaint = now;
      }
      requestId = window.requestAnimationFrame(tick);
    };

    const synchronize = () => {
      if (requestId !== null) window.cancelAnimationFrame(requestId);
      requestId = null;
      lastTime = null;
      if (reduce) draw(true);
      if (canRun()) requestId = window.requestAnimationFrame(tick);
    };

    const changePreference = () => {
      reduce = preference.matches;
      setReducedMotion(reduce);
      synchronize();
    };
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        synchronize();
      }, { threshold: 0.05 });
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
        if (disposed) return;
        rebuild();
        draw(reduce);
      });

    draw(true);
    setReady(true);
    observer?.observe(stage);
    resizeObserver?.observe(stage);
    preference.addEventListener("change", changePreference);
    document.addEventListener("visibilitychange", synchronize);
    synchronizeRef.current = synchronize;
    synchronize();

    return () => {
      disposed = true;
      if (requestId !== null) window.cancelAnimationFrame(requestId);
      observer?.disconnect();
      resizeObserver?.disconnect();
      preference.removeEventListener("change", changePreference);
      document.removeEventListener("visibilitychange", synchronize);
      synchronizeRef.current = null;
      plates.forEach(({ plate }) => { plate.width = 0; plate.height = 0; });
    };
  }, []);

  return (
    <figure className="ink-print" aria-labelledby={captionId}>
      <div className="ink-print__stage" ref={stageRef} aria-hidden="true" data-ready={ready}>
        <div className="ink-print__still" hidden={ready}>
          <svg className="ink-print__fallback" viewBox={`0 0 ${INK_WIDTH} ${INK_HEIGHT}`} focusable="false">
            <defs>
              <pattern id={patternId} width="9" height="11" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" /><circle cx="5.5" cy="2.7" r="0.65" />
                <circle cx="3" cy="5.2" r="1" /><circle cx="7.5" cy="7.1" r="0.85" />
                <circle cx="1.3" cy="9.4" r="0.7" /><circle cx="6.4" cy="10.4" r="0.6" />
              </pattern>
              <radialGradient id={edgeId} cx="52%" cy="46%" r="64%">
                <stop offset="0" stopColor="white" /><stop offset="0.52" stopColor="white" stopOpacity="0.92" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <mask id={maskId}>
                <path d={STILL_PLUME} fill={`url(#${edgeId})`} stroke="white" strokeWidth="34" />
              </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
              <path d={STILL_PLUME} fill={INK_COLORS[1]} opacity="0.22" />
              <path d={STILL_PLUME} fill={`url(#${patternId})`} stroke={`url(#${patternId})`} strokeWidth="45" opacity="0.88" />
              <path d={STILL_PLUME} fill={INK_COLORS[0]} opacity="0.14" />
            </g>
            <ellipse cx="744" cy="568" rx="87" ry="40" transform="rotate(48 744 568)" fill={`url(#${patternId})`} opacity="0.12" />
            <ellipse cx="748" cy="610" rx="42" ry="13" transform="rotate(48 748 610)" fill={INK_COLORS[3]} opacity="0.035" />
            {print.squares.map((square, index) => (
              <rect key={index} x={square.x} y={square.y} width={square.size} height={square.size} fill={INK_COLORS[square.color]} opacity={square.alpha} />
            ))}
          </svg>
        </div>
        <canvas className="ink-print__canvas" ref={canvasRef} width={INK_WIDTH} height={INK_HEIGHT} hidden={!ready} />
      </div>
      <figcaption className="ink-print__meta">
        <span className="ink-print__caption" id={captionId}>{launch.artLabel}</span>
        <button
          className="ink-print__control"
          type="button"
          onClick={() => setPaused((current) => !current)}
          hidden={!ready || reducedMotion}
        >
          {paused ? hero.resumeMotion : hero.pauseMotion}
        </button>
      </figcaption>
    </figure>
  );
}
