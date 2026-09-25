/**
 * Pure, DOM-free normalization of a CSS color string into the `#rrggbb` hex
 * shape `<m3e-theme color>` requires. Space styles can set `--ui-accent-color`
 * to anything CSS accepts (`#abc`, `#aabbcc`, `rgb(...)`, a named color, …);
 * `m3e-theme` only understands hex, so anything else falls back.
 */

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#[0-9a-f]{6}$/i;
const RGB = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

function clampByteToHex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

/** Normalizes `computed` to `#rrggbb`; falls back to `fallback` if it can't. */
export function accentSeed(computed: string, fallback: string): string {
  const value = computed.trim();

  const hex3 = value.match(HEX3);
  if (hex3) {
    const [, r, g, b] = hex3;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  if (HEX6.test(value)) {
    return value.toLowerCase();
  }

  const rgb = value.match(RGB);
  if (rgb) {
    const [, r, g, b] = rgb;
    return `#${clampByteToHex(Number(r))}${clampByteToHex(Number(g))}${clampByteToHex(Number(b))}`;
  }

  return fallback;
}
