"use client";

import { useEffect, useRef, useState } from "react";
import { hero } from "@/content";
import { createHeroField } from "@/lib/hero-field";

export default function LivingHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlRef = useRef<((paused: boolean) => void) | null>(null);
  const pausedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const styles = getComputedStyle(root);
    const color = (token: string): [number, number, number] => {
      const hex = styles.getPropertyValue(token).trim();
      return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255) as [number, number, number];
    };
    const renderer = createHeroField(canvas, color("--color-ink"), color("--color-accent"));
    if (!renderer) { root.dataset.motion = "unavailable"; return; }

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let prefersReduced = preference.matches;
    let userPaused = pausedRef.current;
    let visible = false;
    let contextLost = false;
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    setReduced(prefersReduced);
    setReady(renderer.animated);

    const shouldRun = () => renderer.animated && visible && !prefersReduced && !userPaused && !document.hidden && !contextLost;
    const draw = () => { if (!contextLost) renderer.draw(elapsed, x, y); };
    const tick = (now: number) => {
      frame = 0;
      if (!shouldRun()) return;
      if (!lastFrame || now - lastFrame >= 1000 / 30) {
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : 0;
        elapsed += delta;
        const smoothing = 1 - Math.exp(-delta * 3.5);
        x += (targetX - x) * smoothing;
        y += (targetY - y) * smoothing;
        draw();
        lastFrame = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      root.dataset.motion = contextLost ? "unavailable" : !renderer.animated ? "still" : prefersReduced ? "reduced" : userPaused ? "paused" : shouldRun() ? "running" : "idle";
      if (shouldRun()) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height || contextLost) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5, 1600 / bounds.width);
      renderer.resize(bounds.width, bounds.height, ratio);
      draw();
    };
    const updatePreference = () => {
      prefersReduced = preference.matches;
      setReduced(prefersReduced);
      elapsed = 0;
      x = y = targetX = targetY = 0;
      draw();
      sync();
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType === "touch" || !shouldRun()) return;
      const bounds = root.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, (0.5 - (event.clientY - bounds.top) / bounds.height) * 2));
    };
    const leave = () => { targetX = targetY = 0; };
    const loseContext = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      setReady(false);
      sync();
    };
    const restoreContext = () => setGeneration(value => value + 1);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.01 });
    const sizeObserver = new ResizeObserver(resize);
    intersection.observe(root);
    sizeObserver.observe(canvas);
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", sync);
    canvas.addEventListener("webglcontextlost", loseContext);
    canvas.addEventListener("webglcontextrestored", restoreContext);
    const heroElement = root.closest("section");
    heroElement?.addEventListener("pointermove", move);
    heroElement?.addEventListener("pointerleave", leave);
    controlRef.current = value => { userPaused = value; sync(); };
    resize();

    return () => {
      cancelAnimationFrame(frame);
      controlRef.current = null;
      intersection.disconnect();
      sizeObserver.disconnect();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", loseContext);
      canvas.removeEventListener("webglcontextrestored", restoreContext);
      heroElement?.removeEventListener("pointermove", move);
      heroElement?.removeEventListener("pointerleave", leave);
      renderer.dispose();
    };
  }, [generation]);

  const toggleMotion = () => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
    controlRef.current?.(next);
  };

  return (
    <div ref={rootRef} className="living-hero">
      <div className="living-hero__surface" aria-hidden="true">
        <canvas ref={canvasRef} className="living-hero__canvas" />
      </div>
      <div className="living-hero__controls">
        {ready && !reduced && (
          <button type="button" className="living-hero__toggle" onClick={toggleMotion} aria-pressed={paused}>
            {paused ? hero.resumeMotion : hero.pauseMotion}
          </button>
        )}
      </div>
    </div>
  );
}

