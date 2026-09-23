import { expect, test } from "vitest";
import { relativeTime } from "./relative_time.ts";

test("relativeTime: formats seconds/minutes/hours/days/months/years ago", () => {
  const now = new Date("2026-06-15T12:00:00.000Z").getTime();
  expect(relativeTime(new Date(now - 30_000).toISOString(), now)).toBe(
    "30 seconds ago",
  );
  expect(relativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe(
    "5 minutes ago",
  );
  expect(relativeTime(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe(
    "3 hours ago",
  );
  expect(relativeTime(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe(
    "2 days ago",
  );
});

test("relativeTime returns the raw string unchanged for an unparseable timestamp", () => {
  expect(relativeTime("not-a-date")).toBe("not-a-date");
});
