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

test("the mode picker is NOT an m3e-menu and NOT a floating toolbar", () => {
  const html = renderSheet();
  // Round 2's floating bottom toolbar is gone (it moved to
  // navigation_sheet.tsx, where it replaced tabs)...
  expect(html).not.toContain("m3e-toolbar");
  expect(html).not.toContain("sb-search-sheet-modes");
  // ...and so is round 3's m3e-menu. Jack's round-4 direction is an m3e-list
  // of m3e-list-items split by m3e-dividers, citing
  // https://matraic.github.io/m3e/#/components/list.html. Assert the whole
  // menu family is absent so a partial revert can't slip back in.
  expect(html).not.toContain("m3e-menu");
  expect(html).not.toContain("m3e-menu-item-radio");
  expect(html).not.toContain("m3e-menu-trigger");
});

test("the leading icon button is the picker trigger, with listbox ARIA", () => {
  const html = renderSheet();
  expect(html).toContain('title="Change search mode"');
  // Round 3 got these three attributes for free from m3e-menu-trigger's
  // `attach()`. A hand-driven list popup has no such helper, so they are set
  // explicitly — and `haspopup="listbox"` must agree with the `role="listbox"`
  // the popup itself carries.
  expect(html).toContain('aria-haspopup="listbox"');
  expect(html).toContain('aria-controls="sb-search-sheet-mode-list"');
  // Collapsed while closed — the e2e suite asserts this flips to "true" on a
  // real click, which a static render cannot exercise.
  expect(html).toContain('aria-expanded="false"');
});

test("the mode picker popup is NOT rendered while closed", () => {
  // This is the structural fix for round 1's live-verified defect, where the
  // permanently-rendered popover was VISIBLE while closed because m3e-list's
  // author-origin `:host { display: flex }` out-cascaded the UA popover
  // stylesheet's `display: none`. The element simply does not exist now, so
  // there is no cascade to lose — asserted here rather than left to a CSS
  // counter-rule that a future refactor could silently drop.
  const html = renderSheet();
  // Match the ELEMENT, not the bare id — the id legitimately still appears in
  // the trigger's `aria-controls`, which points at the popup it *would* open.
  expect(html).not.toContain('<m3e-list id="sb-search-sheet-mode-list"');
  expect(html).not.toContain("m3e-divider");
  expect(html).not.toContain('role="listbox"');
  expect(html).not.toContain('role="option"');
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
  // The picker itself is closed (and therefore unrendered) by default, so the
  // active-row marking inside it is an e2e concern, not a static one. What IS
  // statically guaranteed: with the popup closed, the only check-style icon in
  // the tree would have to come from a row that should not exist yet.
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
