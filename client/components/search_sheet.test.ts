import { expect, test } from "vitest";
import { render } from "preact-render-to-string";
import { h } from "preact";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { Command } from "../types/command.ts";
import {
  type SearchSheetData,
  SearchSheet,
  selectRows,
} from "./search_sheet.tsx";

// This repo's e2e suite (e2e/*.test.ts, Playwright) has no pattern for
// mounting a single component in isolation — every fixture in e2e/fixtures.ts
// boots the full SilverBullet server + app shell — and this repo's vitest runs
// in a plain node environment (no DOM), so a component's live Preact state
// transitions / custom-element behavior cannot be exercised here. Two things
// ARE checkable without a DOM, and this file covers both:
//   1. `selectRows`, the pure source dispatch this leaf owns (its wiring over
//      search_modes.ts's already-tested pure Search functions).
//   2. The static rendered structure via preact-render-to-string — including
//      the load-bearing NEGATIVE assertion that no `m3e-autocomplete`/dropdown
//      exists anywhere in the composition, AND (Task C, 2026-09-22) that the
//      Open/Run modes and their mode-picker chrome are gone entirely.
//
// 2026-09-22 (Task C): this sheet dropped its Open and Run modes — search
// should be solely for searching (both destinations are already reachable
// elsewhere: the always-available page picker + the History tab for Open,
// the command palette for Run). This file was rewritten to match; the old
// per-mode/mode-picker assertions (DEFAULT_MODE, MODE_PLACEHOLDER, the
// picker's ARIA/list/divider structure) are gone along with the code they
// tested, not left as dead skips.

function page(overrides: Partial<PageMeta>): PageMeta {
  return {
    name: "untitled",
    created: "2026-01-01T00:00:00.000Z",
    lastModified: "2026-01-01T00:00:00.000Z",
    perm: "rw",
    ...overrides,
  } as PageMeta;
}

function data(overrides: Partial<SearchSheetData> = {}): SearchSheetData {
  return {
    allPages: [],
    extensions: new Set<string>(),
    currentPath: "current.md" as Path,
    commands: new Map<string, Command>(),
    recentSearchTerms: [],
    ...overrides,
  };
}

const noopProps = {
  onClose: () => {},
  onNavigate: () => {},
  onNavigateRef: () => {},
  onTriggerCommand: () => {},
};

// --- selectRows: search-only source wiring --------------------------------

test("selectRows: empty query returns recentSearchTerms history", () => {
  const rows = selectRows(
    "",
    data({
      recentSearchTerms: [
        { term: "foo", ts: 2 },
        { term: "bar", ts: 1 },
      ],
    }),
  );
  expect(rows.map((r) => r.name)).toEqual(["foo", "bar"]);
  expect(rows.every((r) => r.hint === "Recent search")).toBe(true);
});

test("selectRows: typed query returns page fuzzy results", () => {
  const rows = selectRows(
    "widget",
    data({ allPages: [page({ name: "widget" }), page({ name: "banana" })] }),
  );
  expect(rows.map((r) => r.name)).toEqual(["widget"]);
});

test("selectRows: typed query with a real Search command prepends the delegate row", () => {
  const commands = new Map<string, Command>([
    ["Search: Space", { name: "Search: Space" } as Command],
  ]);
  const rows = selectRows(
    "widget",
    data({
      commands,
      allPages: [page({ name: "widget" })],
    }),
  );
  expect(rows[0].name).toBe('Search space for "widget"');
});

// --- static rendered structure (preact-render-to-string) -----------------

function renderSheet(overrides: Partial<SearchSheetData> = {}) {
  return render(
    h(SearchSheet, {
      open: true,
      ...noopProps,
      ...data(overrides),
    }),
  );
}

test("renders a modal m3e-bottom-sheet with an m3e-search-bar inside", () => {
  const html = renderSheet();
  expect(html).toContain('id="sb-search-sheet"');
  expect(html).toContain("m3e-bottom-sheet");
  // `m3e-search-bar`, NOT `m3e-search-view mode="docked"`. The search-view
  // owns an internal focus-driven open/closed state machine and only reveals
  // its results region while open — live-measured against the running app,
  // it never opened here, so its shadow `.results` stayed 0x0 and NO result
  // row was ever visible even with rows correctly slotted into it. The bar
  // has no such state machine, and the results list is a sibling in the
  // sheet (the container the spec actually describes) instead.
  expect(html).toContain("m3e-search-bar");
  expect(html).not.toContain("m3e-search-view");
  expect(html).not.toContain('mode="docked"');
  // The list is a direct child of the sheet, after the bar.
  expect(html).toContain('class="sb-search-sheet-body"');
  expect(html.indexOf("sb-search-sheet-body")).toBeGreaterThan(
    html.indexOf("sb-search-sheet-bar"),
  );
});

test("Task C: no mode picker — search-only, no Open/Run chrome", () => {
  const html = renderSheet();
  // The mode-picker trigger button, its ARIA, and its popup list/dividers are
  // all gone — this sheet has exactly one thing to do now.
  expect(html).not.toContain("Change search mode");
  expect(html).not.toContain("sb-search-sheet-mode-list");
  expect(html).not.toContain('role="listbox"');
  expect(html).not.toContain('role="option"');
  expect(html).not.toContain("m3e-divider");
  // Nor either of the earlier attempts' chrome (a floating toolbar / an
  // m3e-menu) — asserted so a partial revert can't slip either back in.
  expect(html).not.toContain("m3e-toolbar");
  expect(html).not.toContain("m3e-menu");
  // The header is a fixed "Search" title, not a mode-driven one.
  expect(html).toContain('<span slot="header">Search</span>');
  // The bar's only leading content is a plain search icon now.
  expect(html).toContain('<m3e-icon slot="leading" name="search">');
});

test("NO m3e-autocomplete / dropdown anywhere in the composition (spec §2.4)", () => {
  const html = renderSheet({
    allPages: [page({ name: "widget" })],
  });
  expect(html).not.toContain("m3e-autocomplete");
  expect(html).not.toContain("m3e-option");
});

test("empty-query render shows recentSearchTerms history rows", () => {
  const html = renderSheet({
    recentSearchTerms: [
      { term: "foo", ts: 2 },
      { term: "bar", ts: 1 },
    ],
  });
  expect(html).toContain("foo");
  expect(html).toContain("bar");
  // Rows live in the sheet's own slotted m3e-list, not a floating overlay.
  expect(html).toContain("m3e-list");
});

test("placeholder is the honestly-scoped search placeholder", () => {
  const html = renderSheet();
  expect(html).toContain("Find in space");
});
