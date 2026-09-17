// Small, pure, unit-testable core of the "most-recent-first, deduped,
// capped" list shape used by both `Client.recentPaths` (recently-visited
// pages/documents) and `Client.recentSearchTerms` (search-sheet history,
// see search_sheet.tsx). Extracted out of client.ts's `recordRecentPath` so
// the two recency lists share one implementation instead of two copies of
// the same slice/filter/spread dance, and so the behavior is testable
// without booting the full (DOM/IndexedDB-dependent) Client class.
export function pushRecent<T>(
  list: readonly T[],
  entry: T,
  isSame: (a: T, b: T) => boolean,
  cap = 20,
): T[] {
  return [entry, ...list.filter((item) => !isSame(item, entry))].slice(
    0,
    cap,
  );
}
