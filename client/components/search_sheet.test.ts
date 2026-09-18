import { expect, test } from "vitest";
import { render } from "preact-render-to-string";
import { h } from "preact";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { Command } from "../types/command.ts";
import {
  DEFAULT_MODE,
  MODE_ORDER,
  MODE_PLACEHOLDER,
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
//   1. `selectRows`, the pure mode→source dispatch this leaf owns (its wiring
//      over search_modes.ts's already-tested pure functions).
//   2. The static rendered structure via preact-render-to-string — including
//      the load-bearing NEGATIVE assertion that no `m3e-autocomplete`/dropdown
//      exists anywhere in the composition (the exact defect class prior
//      attempts shipped, spec §1.4/§2.4).
// The interactive acceptance assertions (mode switch live-updates placeholder +
// results, typing updates the list, submitting a Search term records it and
// resurfaces on reopen, Escape closes) live as `test.fixme` stubs in
// e2e/search-sheet.test.ts for leaf V9 to un-skip once V8 wires this component
// into the live app.

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
    allDocuments: [],
    extensions: new Set<string>(),
    currentPath: "current.md" as Path,
    commands: new Map<string, Command>(),
    recentPaths: [],
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

// --- selectRows: per-mode source wiring (spec §2.4 mode table) -----------

test("selectRows: Open mode empty query returns recentPaths history (default on open)", () => {
  expect(DEFAULT_MODE).toBe("open");
  const rows = selectRows(
    "open",
    "",
    data({
      recentPaths: [
        { path: "alpha.md" as Path, ts: 2 },
        { path: "beta.md" as Path, ts: 1 },
      ],
    }),
    false,
    null,
  );
  expect(rows.map((r) => r.name)).toEqual(["alpha", "beta"]);
  expect(rows.every((r) => r.hint === "Recent")).toBe(true);
});

test("selectRows: Open mode typed query returns fuzzy page results, not history", () => {
  const rows = selectRows(
    "open",
    "widget",
    data({
      allPages: [page({ name: "widget" }), page({ name: "banana" })],
      recentPaths: [{ path: "alpha.md" as Path, ts: 1 }],
    }),
    false,
    null,
  );
  expect(rows.map((r) => r.name)).toEqual(["widget"]);
});

test("selectRows: Search mode empty query returns recentSearchTerms history", () => {
  const rows = selectRows(
    "search",
    "",
    data({
      recentSearchTerms: [
        { term: "foo", ts: 2 },
        { term: "bar", ts: 1 },
      ],
    }),
    false,
    null,
  );
  expect(rows.map((r) => r.name)).toEqual(["foo", "bar"]);
  expect(rows.every((r) => r.hint === "Recent search")).toBe(true);
});

test("selectRows: Search mode typed query returns page fuzzy results", () => {
  const rows = selectRows(
    "search",
    "widget",
    data({ allPages: [page({ name: "widget" }), page({ name: "banana" })] }),
    false,
    null,
  );
  expect(rows.map((r) => r.name)).toEqual(["widget"]);
});

test("selectRows: Run mode empty query returns recency-sorted command history", () => {
  const commands = new Map<string, Command>([
    ["cmd-a", { name: "cmd-a", lastRun: 1 } as Command],
    ["cmd-b", { name: "cmd-b", lastRun: 5 } as Command],
  ]);
  const rows = selectRows("run", "", data({ commands }), false, null);
  // Highest lastRun sorts first (orderId = -lastRun).
  expect(rows.map((r) => r.name)).toEqual(["cmd-b", "cmd-a"]);
});

test("selectRows: Run mode typed query fuzzy-matches command names", () => {
  const commands = new Map<string, Command>([
    ["widget: run", { name: "widget: run" } as Command],
    ["banana: peel", { name: "banana: peel" } as Command],
  ]);
  const rows = selectRows("run", "widget", data({ commands }), false, null);
  expect(rows.map((r) => r.name)).toEqual(["widget: run"]);
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

test("renders a modal m3e-bottom-sheet with the search-view inside", () => {
  const html = renderSheet();
  expect(html).toContain('id="sb-search-sheet"');
  expect(html).toContain("m3e-bottom-sheet");
  expect(html).toContain('mode="docked"');
  expect(html).toContain("m3e-search-view");
});

test("the mode menu has exactly 3 radio items: Search / Open / Run", () => {
  const html = renderSheet();
  const radioCount = (html.match(/<m3e-menu-item-radio/g) ?? []).length;
  expect(radioCount).toBe(3);
  expect(MODE_ORDER).toEqual(["search", "open", "run"]);
  expect(html).toContain(">Search</m3e-menu-item-radio>");
  expect(html).toContain(">Open</m3e-menu-item-radio>");
  expect(html).toContain(">Run</m3e-menu-item-radio>");
});

test("exactly one radio is checked, and it is the default Open mode", () => {
  const html = renderSheet();
  const checkedCount = (html.match(/checked/g) ?? []).length;
  expect(checkedCount).toBe(1);
  // The checked marker sits on the Open radio's opening tag.
  expect(html).toMatch(/<m3e-menu-item-radio[^>]*checked[^>]*>[\s\S]*?>Open</);
});

test("NO m3e-autocomplete / dropdown anywhere in the composition (spec §2.4)", () => {
  const html = renderSheet({
    recentPaths: [{ path: "alpha.md" as Path, ts: 1 }],
    allPages: [page({ name: "widget" })],
  });
  expect(html).not.toContain("m3e-autocomplete");
  expect(html).not.toContain("m3e-option");
});

test("default (Open, empty query) render shows recentPaths history rows", () => {
  const html = renderSheet({
    recentPaths: [
      { path: "alpha.md" as Path, ts: 2 },
      { path: "beta.md" as Path, ts: 1 },
    ],
  });
  expect(html).toContain("alpha");
  expect(html).toContain("beta");
  // Rows live in the sheet's own slotted m3e-list, not a floating overlay.
  expect(html).toContain("m3e-list");
});

test("default placeholder is the Open-mode placeholder", () => {
  const html = renderSheet();
  expect(html).toContain(MODE_PLACEHOLDER.open);
  expect(MODE_PLACEHOLDER.open).toBe("Jump to a page, document, tag, or $anchor");
});
