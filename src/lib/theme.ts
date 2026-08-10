/**
 * Which ground the page is on, and how that survives a reload.
 *
 * Two consumers that must never disagree: the CSS tokens, keyed off
 * `data-theme` on the root element, and the dither ramp in `lib/dither.ts`,
 * which declares its colours as they should appear *already composited* onto
 * the ground. If the attribute and the ramp ever drift apart the field paints
 * for one background onto another and the whole ramp lands somewhere else.
 *
 * So this module owns the attribute, and `DitherField` subscribes to it. There
 * is no second place that writes it.
 */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "mikoshi:theme";
/** Dispatched on `window` when the theme changes. */
export const THEME_EVENT = "mikoshi:theme";

/**
 * The script that runs before first paint.
 *
 * Inlined into the document head by `layout.tsx`. This is a static export, so
 * there is no server to read a cookie and no opportunity to decide the ground
 * before the HTML is written: without this the page paints black, then swaps to
 * near-white once React has hydrated, which is a full-viewport flash on every
 * load for anyone who chose light.
 *
 * Kept to one expression and wrapped in a try, because it runs render-blocking
 * in the head and a throw there would take the page with it. Private mode can
 * make `localStorage` itself throw on access, not merely return null.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})()`;

/** The theme currently in force, read from the element the boot script stamped. */
export function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/**
 * Sets the theme, remembers it, and tells the canvas.
 *
 * The choice is stored explicitly rather than only mirrored from the system,
 * because once someone has touched the switch their preference outranks the
 * OS's. That is also why the boot script only consults `prefers-color-scheme`
 * when there is nothing stored.
 */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // A blocked or full store is not a reason to refuse to change the theme.
    // It only means the choice does not survive the reload.
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}
