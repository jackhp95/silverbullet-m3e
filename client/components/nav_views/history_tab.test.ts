import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import { render } from "preact-render-to-string";
import { expect, test, vi } from "vitest";

// HistoryTab calls the existing, proven `navigateToAnythingPickerRef` from
// anything_picker.tsx (self-contained via the ambient `client` global, which
// isn't set up in this unit-test environment) — mocked here so these tests
// exercise HistoryTab's own row-building/render logic without needing a full
// Client stub, same boundary search_modes.test.ts draws around
// `activateOpenOption`'s handlers.
const navigateToAnythingPickerRef = vi.fn();
vi.mock("../anything_picker.tsx", () => ({
  navigateToAnythingPickerRef: (...args: unknown[]) =>
    navigateToAnythingPickerRef(...args),
}));

const { HistoryTab } = await import("./history_tab.tsx");

// Component-level render test — HistoryTab is not yet wired into
// client/editor_ui.tsx (that's leaf V8, a later worktree, per
// docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md §5 P2),
// same rationale floating_toolbar.test.ts already documents.

test("renders one row per recentPaths entry, excludes currentPath, no input box", () => {
  const recentPaths = [
    { path: "a.md" as Path, ts: 3 },
    { path: "b.md" as Path, ts: 2 },
    { path: "current.md" as Path, ts: 1 },
  ];
  const html = render(
    HistoryTab({
      recentPaths,
      currentPath: "current.md" as Path,
      onNavigate: () => {},
    }),
  );
  expect(html).toContain(">a<");
  expect(html).toContain(">b<");
  expect(html).not.toContain(">current<");
  // No search input anywhere — typed jump-to-page lives exclusively in the
  // Search sheet's Open mode, not here.
  expect(html).not.toMatch(/<input/);
  expect(html).toContain("<m3e-list");
});

test("empty recentPaths renders an empty state instead of an empty list", () => {
  const html = render(
    HistoryTab({
      recentPaths: [],
      currentPath: "x.md" as Path,
      onNavigate: () => {},
    }),
  );
  expect(html).toContain("No recently visited pages yet.");
  expect(html).not.toContain("<m3e-list");
});

test("activating a row navigates by ref and closes the sheet", () => {
  navigateToAnythingPickerRef.mockClear();
  const onNavigate = vi.fn();
  const vnode = HistoryTab({
    recentPaths: [{ path: "a.md" as Path, ts: 1 }],
    currentPath: "" as Path,
    onNavigate,
  }) as any;

  const rows = ([] as any[]).concat(vnode.props.children);
  expect(rows).toHaveLength(1);
  rows[0].props.onActivate();

  expect(navigateToAnythingPickerRef).toHaveBeenCalledOnce();
  expect(navigateToAnythingPickerRef.mock.calls[0][0]).toEqual({
    path: "a.md",
  });
  expect(navigateToAnythingPickerRef.mock.calls[0][1]).toBe(onNavigate);
});
