// Extracted from the nav sheet's Changelog tab (2026-09-17 nav redesign spec
// §2.7) into `client/lib/` so a second consumer (the app-bar subtitle, V5b
// plan L1) doesn't have to import through a nav-view leaf file — this is a
// generic ISO-timestamp formatter with no nav-sheet-specific behavior.
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const diffMs = now - then;
  const sign = diffMs >= 0 ? -1 : 1; // past -> negative delta for RelativeTimeFormat
  const absSec = Math.round(Math.abs(diffMs) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Infinity, "year"],
  ];

  let value = absSec;
  for (const [span, unit] of units) {
    if (value < span || span === Infinity) {
      return rtf.format(sign * Math.round(value), unit);
    }
    value = value / span;
  }
  // Unreachable — the last unit's span is Infinity, which always returns above.
  return rtf.format(sign * Math.round(value), "year");
}
