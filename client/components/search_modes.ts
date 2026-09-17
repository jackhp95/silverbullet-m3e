import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type {
  DocumentMeta,
  PageMeta,
} from "@silverbulletmd/silverbullet/type/index";
import {
  getNameFromPath,
  type Path,
  type Ref,
} from "@silverbulletmd/silverbullet/lib/ref";
import { fuzzySearchAndSort } from "../lib/fuzzy_search.ts";
import type { Command } from "../types/command.ts";
import type { AnchorObject } from "./anchor_options.ts";
import {
  buildAnythingPickerOptions,
  resolveAnythingPickerSelection,
  stripHashtags,
} from "./anything_picker.tsx";
import {
  buildCommandPaletteOptions,
  commandFromOption,
  triggerCommand,
} from "./command_palette.tsx";

// Pure mode logic for the nav bar's three search-shaped destinations
// (Open/"Recent", Search, Run) — extracted verbatim from
// nav_views/recent.tsx:87-133, nav_views/search.tsx:86-135,154 and
// nav_views/run.tsx:58-115 so it has exactly one home instead of three
// near-identical copies. The views keep all Preact state/effects
// (query/selectedIndex/focus/anchor-loading) and just call these functions;
// nothing here is rewritten behavior, only relocated.

export type NavHandlers = {
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
};

// --- Open mode (recent.tsx) -------------------------------------------

export type RecentPathOption = FilterOption & { recentPath: Path };

/** Typed-query results — recent.tsx:90-116 verbatim. */
export function getOpenResults(
  query: string,
  allPages: PageMeta[],
  allDocuments: DocumentMeta[],
  extensions: Set<string>,
  currentPath: Path,
  anchorMode: boolean,
  anchors: AnchorObject[] | null,
): FilterOption[] {
  const options = buildAnythingPickerOptions({
    mode: "all",
    allPages,
    allDocuments,
    extensions,
    currentPath,
    anchorMode,
    anchors,
  });
  return fuzzySearchAndSort(
    options,
    anchorMode ? query : stripHashtags(query),
  );
}

/** Empty-query history — client.recentPaths, recent.tsx:121-133 verbatim. */
export function getOpenHistory(
  recentPaths: { path: Path; ts: number }[],
  currentPath: Path,
): RecentPathOption[] {
  return recentPaths
    .filter((p) => p.path !== currentPath)
    .slice(0, 10)
    .map((p): RecentPathOption => ({
      name: getNameFromPath(p.path),
      hint: "Recent",
      recentPath: p.path,
    }));
}

/** recent.tsx:137-143 verbatim. */
export function activateOpenOption(
  opt: FilterOption | undefined,
  isEmpty: boolean,
  handlers: NavHandlers,
) {
  if (isEmpty && opt && (opt as RecentPathOption).recentPath) {
    handlers.onNavigateRef({ path: (opt as RecentPathOption).recentPath });
    return;
  }
  resolveAnythingPickerSelection(opt, handlers);
}

// --- Search mode (search.tsx) ------------------------------------------

export type SearchDelegateOption = FilterOption & { searchDelegate: true };

/** search.tsx:86-89's delegate lookup, split out so getSearchResults and
 * activateSearchOption's callers can share one computation instead of
 * re-deriving it. */
export function findSearchDelegateCommand(
  commands: Map<string, Command>,
): Command | undefined {
  return Array.from(commands.values()).find((c) => /^Search/.test(c.name));
}

/** Typed-query results — search.tsx:91-125 verbatim. */
export function getSearchResults(
  commands: Map<string, Command>,
  allPages: PageMeta[],
  extensions: Set<string>,
  currentPath: Path,
  query: string,
): FilterOption[] {
  const trimmedQuery = query.trim();
  const delegateSearchCommand = findSearchDelegateCommand(commands);
  const pageOptions = buildAnythingPickerOptions({
    mode: "page",
    allPages,
    allDocuments: [],
    extensions,
    currentPath,
    anchorMode: false,
    anchors: null,
  });
  const scored = fuzzySearchAndSort(pageOptions, stripHashtags(query));
  if (!delegateSearchCommand) {
    return scored;
  }
  const delegateOption: SearchDelegateOption = {
    name: `Search space for "${trimmedQuery}"`,
    hint: delegateSearchCommand.name,
    orderId: -Infinity,
    searchDelegate: true,
  };
  return [delegateOption, ...scored];
}

/** Empty-query history — client.recentSearchTerms, search.tsx:127-135
 * verbatim (spec §2.5 — recent-searches already solved). */
export function getSearchHistory(
  recentSearchTerms: { term: string; ts: number }[],
): FilterOption[] {
  return recentSearchTerms.slice(0, 10).map((t) => ({
    name: t.term,
    hint: "Recent search",
  }));
}

/** search.tsx:139-165 verbatim, minus the `setQuery`/refocus side effect
 * (kept in the view as `onRefillQuery`) and `onClose` (kept as a handler,
 * same as the view already threads it). Relies on the ambient `client`
 * global for `recordSearchTerm`, same convention command_palette.tsx's
 * `triggerCommand` already uses. */
export function activateSearchOption(
  opt: FilterOption | undefined,
  isEmpty: boolean,
  trimmedQuery: string,
  delegateSearchCommand: Command | undefined,
  handlers: NavHandlers & {
    onTriggerCommand: (cmd: Command | undefined) => void;
    onClose: () => void;
    onRefillQuery: (name: string) => void;
  },
) {
  if (isEmpty) {
    if (opt) {
      handlers.onRefillQuery(opt.name);
    }
    return;
  }
  if (trimmedQuery) {
    client.recordSearchTerm(trimmedQuery);
  }
  if (opt && (opt as SearchDelegateOption).searchDelegate) {
    handlers.onTriggerCommand(delegateSearchCommand);
    return;
  }
  if (opt) {
    resolveAnythingPickerSelection(opt, handlers);
  } else {
    handlers.onClose();
  }
}

// --- Run mode (run.tsx) -------------------------------------------------

/** Typed-query results — run.tsx:87-93 verbatim. */
export function getRunResults(
  commands: Map<string, Command>,
  query: string,
): FilterOption[] {
  return fuzzySearchAndSort(buildCommandPaletteOptions(commands), query);
}

/** Empty-query history (recency-sorted via `orderId`) — run.tsx:99-106
 * verbatim. */
export function getRunHistory(commands: Map<string, Command>): FilterOption[] {
  return fuzzySearchAndSort(buildCommandPaletteOptions(commands), "")
    .slice(0, 10);
}

/** run.tsx:110-115 verbatim. */
export function activateRunOption(
  opt: FilterOption | undefined,
  commands: Map<string, Command>,
  onClose: () => void,
) {
  triggerCommand(commandFromOption(opt, commands), onClose);
}
