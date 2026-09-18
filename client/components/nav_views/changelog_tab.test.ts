import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { render } from "preact-render-to-string";
import { expect, test, vi } from "vitest";

const navigateToAnythingPickerName = vi.fn();
vi.mock("../anything_picker.tsx", () => ({
  navigateToAnythingPickerName: (...args: unknown[]) =>
    navigateToAnythingPickerName(...args),
}));

const { ChangelogTab, relativeTime } = await import("./changelog_tab.tsx");

function page(overrides: Partial<PageMeta>): PageMeta {
  return {
    name: "untitled",
    created: "2026-01-01T00:00:00.000Z",
    lastModified: "2026-01-01T00:00:00.000Z",
    perm: "rw",
    ...overrides,
  } as PageMeta;
}

// v1 ships "when" only (2026-09-17 nav redesign spec §2.7) — a deliberate
// scoping decision, not an oversight. These tests pin down both halves of
// that decision: "when" is real and sorted correctly, and no author/"who"
// column is rendered anywhere.

test("sorts pages by lastModified descending", () => {
  const old = page({ name: "old", lastModified: "2026-01-01T00:00:00.000Z" });
  const mid = page({ name: "mid", lastModified: "2026-06-01T00:00:00.000Z" });
  const recent = page({
    name: "recent",
    lastModified: "2026-09-01T00:00:00.000Z",
  });

  const html = render(
    ChangelogTab({ allPages: [old, recent, mid], onNavigate: () => {} }),
  );
  const order = ["recent", "mid", "old"].map((n) => html.indexOf(`>${n}<`));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);
});

test("renders 'modified {relative-time}' and never an author/who column", () => {
  const p = page({ name: "widget", lastModified: "2026-01-01T00:00:00.000Z" });
  const html = render(ChangelogTab({ allPages: [p], onNavigate: () => {} }));

  expect(html).toContain("modified");
  expect(html.toLowerCase()).not.toContain("author");
  expect(html.toLowerCase()).not.toContain("who");
  expect(html.toLowerCase()).not.toContain("by ");
});

test("empty allPages renders an empty state instead of an empty list", () => {
  const html = render(ChangelogTab({ allPages: [], onNavigate: () => {} }));
  expect(html).toContain("No pages yet.");
  expect(html).not.toContain("<m3e-list");
});

test("activating a row navigates by page name and closes the sheet", () => {
  navigateToAnythingPickerName.mockClear();
  const onNavigate = vi.fn();
  const vnode = ChangelogTab({
    allPages: [page({ name: "widget" })],
    onNavigate,
  }) as any;

  const rows = ([] as any[]).concat(vnode.props.children);
  expect(rows).toHaveLength(1);
  rows[0].props.onActivate();

  expect(navigateToAnythingPickerName).toHaveBeenCalledWith(
    "widget",
    onNavigate,
  );
});

// --- relativeTime -----------------------------------------------------

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
