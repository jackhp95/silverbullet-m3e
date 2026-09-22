// Ported from plugs/editor/stats.ts's statsCommand formula — same constant
// (225 wpm), so the app-bar subtitle and the "Editor: Stats" command never
// silently disagree about what "N min read" means for the same page.
export function countWords(text: string): number {
  const matches = text.match(/[\w\d'-]+/gi);
  return matches ? matches.length : 0;
}

// Deliberate, small deviation from plugs/editor/stats.ts's original formula
// (which can report 0 minutes for a near-empty page): a subtitle string
// like "3 min read" reads better with a floor of 1 than "0 min read".
export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 225));
}
