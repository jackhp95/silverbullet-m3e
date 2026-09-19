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
  // The bar's leading slot holds the MODE PICKER button (the search-VIEW
  // used to supply a magnifier from its shadow tree; the bar does not, so
  // this slot is entirely ours and there is no dead space beside a built-in
  // icon — feedback #4's actual cause).
  expect(html).toContain('<m3e-icon-button slot="leading"');
});

test("mode switching is a real m3e-menu opened by the bar's leading icon button", () => {
  const html = renderSheet();
  // Jack's round-3 direction, reversing round 2: the floating bottom toolbar
  // is GONE from the search sheet (it moved to navigation_sheet.tsx, where it
  // replaced tabs), and the picker is the semantically-correct component for
  // "click an icon, get a list of options" — a real anchored m3e-menu.
  expect(html).not.toContain("m3e-toolbar");
  expect(html).not.toContain("sb-search-sheet-modes");

  // The trigger is an EMPTY m3e-menu-trigger nested in the icon button: it
  // binds its click handler to its PARENT element (verified against the
  // decompiled dist/menu.js — see search_sheet.tsx's mode-model comment), so
  // the whole button is the trigger and the icon stays a direct child of the
  // button where the button's default slot can claim it.
  expect(html).toContain('title="Change search mode"');
  expect(html).toContain(
    '<m3e-menu-trigger for="sb-search-sheet-mode-menu"></m3e-menu-trigger>',
  );
  expect(html).toContain('<m3e-menu id="sb-search-sheet-mode-menu">');

  // Exactly one radio item per mode, in MODE_ORDER, each with its icon.
  const items = [...html.matchAll(/<m3e-menu-item-radio\b[^>]*>/g)];
  expect(items).toHaveLength(3);
  for (const label of ["Search", "Open", "Run"]) {
    expect(html).toContain(`${label}</m3e-menu-item-radio>`);
  }
  for (const icon of ["search", "description", "terminal"]) {
    expect(html).toContain(`<m3e-icon slot="icon" name="${icon}"></m3e-icon>`);
  }

  // The menu is nested INSIDE the sheet, not a sibling: the modal sheet
  // inerts content outside itself, while the menu's native-popover top-layer
  // promotion makes nesting harmless.
  expect(html.indexOf("<m3e-menu ")).toBeLessThan(
    html.indexOf("</m3e-bottom-sheet>"),
  );
});

test("the ACTIVE mode is shown by the header title and the leading button's icon", () => {
  const html = renderSheet();
  // The sheet title IS the always-visible active-mode indicator (it survives
  // round 2 unchanged — only the switcher below it changed). Default is Open.
  expect(html).toContain('<span slot="header">Open</span>');
  // The leading button shows the ACTIVE mode's icon, so the picker announces
  // what it is currently set to without being opened.
  expect(html).toMatch(
    /<m3e-icon-button slot="leading"[\s\S]*?<m3e-icon name="description">/,
  );
  // Inside the menu, selection is carried by the radio item's own `checked`
  // — not a hand-painted check column.
  expect(html).toMatch(
    /<m3e-menu-item-radio checked><m3e-icon slot="icon" name="description">/,
  );
  expect(html).not.toContain('name="check"');
});

test("no leftover spacer spans in the bar's leading slots (feedback #4)", () => {
  // The two `<span slot="closed-leading">`/`slot="open-leading"` wrappers the
  // old search-VIEW-era trigger needed were themselves the "strange empty
  // space". The bar has no open/closed states, so the picker sits in the one
  // plain `slot="leading"` with no wrapper at all.
  const html = renderSheet();
  expect(html).not.toContain("closed-leading");
  expect(html).not.toContain("open-leading");
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
