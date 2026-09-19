import { expect, test } from "vitest";
import { render } from "preact-render-to-string";
import { h } from "preact";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { Command } from "../types/command.ts";
import {
  DEFAULT_MODE,
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
  // The bar carries its own leading magnifier (the search-VIEW used to
  // supply one from its shadow tree; the bar does not).
  expect(html).toContain('<m3e-icon slot="leading" name="search"></m3e-icon>');
});

test("mode switching is a floating bottom toolbar, NOT a picker popup", () => {
  const html = renderSheet();
  // Round-2 replacement of every prior mode-picker attempt (m3e-menu popup,
  // inline m3e-list, anchored popover m3e-list): one always-visible
  // icon-only `m3e-toolbar` with a button per mode. No popup of any kind.
  expect(html).toContain('class="sb-search-sheet-modes"');
  expect(html).toContain("m3e-toolbar");
  expect(html).not.toContain("sb-search-sheet-mode-list");
  expect(html).not.toContain("popover");
  // One icon-only button per mode, in MODE_ORDER, each labelled but with no
  // text label in the button body (icon-only is the stated design).
  for (const label of ["Search", "Open", "Run"]) {
    expect(html).toContain(`aria-label="${label}"`);
  }
  for (const icon of ["search", "description", "terminal"]) {
    expect(html).toContain(`<m3e-icon name="${icon}"></m3e-icon>`);
  }
  // The toolbar is a direct child of the sheet (so it can be pinned to the
  // sheet's bottom edge), NOT nested inside the search-view's results slot.
  expect(html.indexOf("sb-search-sheet-modes")).toBeGreaterThan(
    html.indexOf("</m3e-search-view>"),
  );
});

test("the ACTIVE mode is named in the sheet's header title, not by a check row", () => {
  // Jack's round-2 direction: the sheet/drawer title IS the active-mode
  // indicator. Default mode is Open, and the active button is the only one
  // rendered as `variant="filled"`.
  const html = renderSheet();
  expect(html).toContain('<span slot="header">Open</span>');
  expect(html).toContain('variant="filled" title="Open"');
  expect(html).toContain('variant="standard" title="Search"');
  expect(html).toContain('variant="standard" title="Run"');
  // No check-mark affordance survived from the old picker list.
  expect(html).not.toContain('name="check"');
});

test("the search bar's leading slots are empty (no mode trigger, no spacer span)", () => {
  // Feedback #4 ("strange empty space before the leading icon button"): the
  // two `<span slot="closed-leading">`/`slot="open-leading"` wrappers around
  // the old mode trigger were themselves the dead space. Both are gone, so
  // the only leading content is the search-view's own built-in magnifier.
  const html = renderSheet();
  expect(html).not.toContain("closed-leading");
  expect(html).not.toContain("open-leading");
  expect(html).not.toContain("Change search mode");
});

test("NO m3e-menu / m3e-menu-item-radio anywhere in the composition (feedback #1: m3e-list, not a dropdown menu)", () => {
  const html = renderSheet();
  expect(html).not.toContain("m3e-menu");
  expect(html).not.toContain("m3e-menu-item-radio");
  expect(html).not.toContain("m3e-menu-trigger");
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
