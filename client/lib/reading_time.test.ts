import { expect, test } from "vitest";
import { countWords, readingTimeMinutes } from "./reading_time.ts";

test("countWords/readingTimeMinutes on an empty string", () => {
  expect(countWords("")).toBe(0);
  expect(readingTimeMinutes(0)).toBe(1); // floored at 1, not "0 min read"
});

test("countWords/readingTimeMinutes on a 450-word fixture", () => {
  const fixture = Array.from({ length: 450 }, (_, i) => `word${i}`).join(" ");
  expect(countWords(fixture)).toBe(450);
  expect(readingTimeMinutes(450)).toBe(2); // ceil(450 / 225)
});
