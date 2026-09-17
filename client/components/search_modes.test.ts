import { expect, test } from "vitest";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { Command } from "../types/command.ts";
import {
  activateOpenOption,
  activateRunOption,
  activateSearchOption,
  findSearchDelegateCommand,
  getOpenHistory,
  getOpenResults,
  getRunHistory,
  getRunResults,
  getSearchHistory,
  getSearchResults,
  type SearchDelegateOption,
} from "./search_modes.ts";

// Safety net for the sibling delete-leaf (V3): every function here is a
// verbatim relocation of nav_views/{recent,search,run}.tsx logic (see
// search_modes.ts's own header comment for the exact line ranges). These
// tests pin down that today's inputs still produce today's outputs, so V3
// can delete the originals with confidence.

function page(overrides: Partial<PageMeta>): PageMeta {
  return {
    name: "untitled",
    created: "2026-01-01T00:00:00.000Z",
    lastModified: "2026-01-01T00:00:00.000Z",
    perm: "rw",
    ...overrides,
  } as PageMeta;
}

// --- Open mode (recent.tsx) ---------------------------------------------

test("getOpenResults: fuzzy-matches page names, unrelated pages excluded", () => {
  const widget = page({ name: "widget", lastModified: "2026-01-01T00:00:00.000Z" });
  const banana = page({ name: "banana", lastModified: "2026-01-02T00:00:00.000Z" });
  const results = getOpenResults(
    "widget",
    [widget, banana],
    [],
    new Set(),
    "current.md" as Path,
    false,
    null,
  );
  expect(results.map((r) => r.name)).toEqual(["widget"]);
});

test("getOpenResults: currently-open page is excluded from a $-anchor query the same way anchorMode routes it", () => {
  // anchorMode=true with no anchors loaded yet (anchors=null) yields no
  // page rows at all — recent.tsx:87-88's anchors-instead-of-pages branch.
  const widget = page({ name: "widget" });
  const results = getOpenResults(
    "$foo",
    [widget],
    [],
    new Set(),
    "current.md" as Path,
    true,
    null,
  );
  expect(results).toEqual([]);
});

test("getOpenHistory: excludes currentPath, caps at 10, preserves order", () => {
  const recentPaths = Array.from({ length: 12 }, (_, i) => ({
    path: `page-${i}.md` as Path,
    ts: i,
  }));
  const history = getOpenHistory(recentPaths, "page-3.md" as Path);
  expect(history).toHaveLength(10);
  expect(history.map((h) => h.name)).not.toContain("page-3");
  expect(history[0].name).toBe("page-0");
  expect(history[0].hint).toBe("Recent");
});

test("activateOpenOption: empty-query history row navigates by recentPath (ref), not by resolveAnythingPickerSelection", () => {
  const navigateRefCalls: unknown[] = [];
  const navigateCalls: unknown[] = [];
  activateOpenOption(
    getOpenHistory([{ path: "foo.md" as Path, ts: 0 }], "" as Path)[0],
    true,
    {
      onNavigate: (n) => navigateCalls.push(n),
      onNavigateRef: (r) => navigateRefCalls.push(r),
    },
  );
  expect(navigateRefCalls).toEqual([{ path: "foo.md" }]);
  expect(navigateCalls).toEqual([]);
});

// --- Search mode (search.tsx) -------------------------------------------

test("getSearchResults: no delegate command registered -> plain fuzzy results, no delegate row", () => {
  const widget = page({ name: "widget" });
  const results = getSearchResults(
    new Map<string, Command>(),
    [widget],
    new Set(),
    "current.md" as Path,
    "widget",
  );
  expect(results.map((r) => r.name)).toEqual(["widget"]);
});

test("getSearchResults: a registered /^Search/ command prepends a delegate row", () => {
  const widget = page({ name: "widget" });
  const commands = new Map<string, Command>([
    ["Search Space", { name: "Search Space" } as Command],
  ]);
  const results = getSearchResults(
    commands,
    [widget],
    new Set(),
    "current.md" as Path,
    "widget",
  );
  expect(results[0].name).toBe('Search space for "widget"');
  expect((results[0] as SearchDelegateOption).searchDelegate).toBe(true);
  expect(results[1].name).toBe("widget");
});

test("findSearchDelegateCommand: finds the first command whose name matches /^Search/", () => {
  const commands = new Map<string, Command>([
    ["Not It", { name: "Not It" } as Command],
    ["Search Space", { name: "Search Space" } as Command],
  ]);
  expect(findSearchDelegateCommand(commands)?.name).toBe("Search Space");
});

test("getSearchHistory: caps recentSearchTerms at 10, tags each with 'Recent search'", () => {
  const terms = Array.from({ length: 11 }, (_, i) => ({
    term: `term-${i}`,
    ts: i,
  }));
  const history = getSearchHistory(terms);
  expect(history).toHaveLength(10);
  expect(history[0]).toEqual({ name: "term-0", hint: "Recent search" });
});

test("activateSearchOption: empty query refills from the clicked history row instead of navigating", () => {
  const refillCalls: string[] = [];
  activateSearchOption(
    { name: "term-0", hint: "Recent search" },
    true,
    "",
    undefined,
    {
      onNavigate: () => {},
      onNavigateRef: () => {},
      onTriggerCommand: () => {},
      onClose: () => {},
      onRefillQuery: (n) => refillCalls.push(n),
    },
  );
  expect(refillCalls).toEqual(["term-0"]);
});

test("activateSearchOption: a delegate-row activation triggers the delegate command, not navigation", () => {
  (globalThis as any).client = { recordSearchTerm: () => {} };
  const triggered: unknown[] = [];
  const delegateCmd = { name: "Search Space" } as Command;
  const delegateOption: SearchDelegateOption = {
    name: 'Search space for "x"',
    searchDelegate: true,
  };
  activateSearchOption(delegateOption, false, "x", delegateCmd, {
    onNavigate: () => {
      throw new Error("should not navigate");
    },
    onNavigateRef: () => {},
    onTriggerCommand: (cmd) => triggered.push(cmd),
    onClose: () => {},
    onRefillQuery: () => {},
  });
  expect(triggered).toEqual([delegateCmd]);
});

// --- Run mode (run.tsx) --------------------------------------------------

function command(name: string, overrides: Partial<Command> = {}): Command {
  return { name, ...overrides } as Command;
}

test("getRunResults: fuzzy-matches command names", () => {
  const commands = new Map<string, Command>([
    ["widget: run", command("widget: run")],
    ["banana: peel", command("banana: peel")],
  ]);
  const results = getRunResults(commands, "widget");
  expect(results.map((r) => r.name)).toEqual(["widget: run"]);
});

test("getRunHistory: empty-query sort is by orderId (-lastRun), most-recent first, capped at 10", () => {
  const commands = new Map<string, Command>();
  for (let i = 0; i < 12; i++) {
    commands.set(`cmd-${i}`, command(`cmd-${i}`, { lastRun: i }));
  }
  const history = getRunHistory(commands);
  expect(history).toHaveLength(10);
  // Highest lastRun (11) sorts first: orderId = -lastRun is most negative.
  expect(history[0].name).toBe("cmd-11");
  expect(history[9].name).toBe("cmd-2");
});

test("activateRunOption: resolves the option back to its Command and runs it via triggerCommand", () => {
  (globalThis as any).client = {
    registerCommandRun: async () => {},
    focus: () => {},
    reportError: () => {},
  };
  const ran: string[] = [];
  const closed: boolean[] = [];
  const commands = new Map<string, Command>([
    ["do-thing", command("do-thing", { run: async () => ran.push("do-thing") })],
  ]);
  activateRunOption({ name: "do-thing" }, commands, () => closed.push(true));
  expect(closed).toEqual([true]);
});
