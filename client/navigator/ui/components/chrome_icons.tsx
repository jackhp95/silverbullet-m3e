import type { JSX } from "preact";

export const CHROME_ICON_PROPS = {
  width: "16",
  height: "16",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.5",
  "aria-hidden": "true",
} as const;

export function CopyIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" {...CHROME_ICON_PROPS}>
      <rect x="6" y="6" width="8.5" height="8.5" rx="1.5" />
      <path d="M3.5 10H3A1.5 1.5 0 0 1 1.5 8.5V3A1.5 1.5 0 0 1 3 1.5h5.5A1.5 1.5 0 0 1 10 3v.5" />
    </svg>
  );
}

export function CloseIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" {...CHROME_ICON_PROPS} stroke-linecap="round">
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </svg>
  );
}

// The filter field's leading glyph, in `<m3e-search-bar>`'s `leading` slot
// (nav_root.tsx). Deliberately a hand-drawn svg like the two above rather
// than `<m3e-icon name="search">`: `m3e-icon` renders Material Symbols
// ligature text and depends on the consumer loading that variable font via
// its own `<link>` (see the m3e skill's icon concept doc) -- this repo
// doesn't load it anywhere yet, so `m3e-icon` renders as raw fallback text
// ("search"), not a glyph. Fixing that is a separate, repo-wide font-loading
// decision outside this slice's scope; this keeps the search bar's icon
// looking correct today.
export function SearchIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" {...CHROME_ICON_PROPS} stroke-linecap="round">
      <circle cx="6.75" cy="6.75" r="4.25" />
      <path d="M10 10l3.5 3.5" />
    </svg>
  );
}
