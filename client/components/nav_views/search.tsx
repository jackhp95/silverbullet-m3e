import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/search"; // registers m3e-search-view (+ m3e-search-bar)
import "@m3e/web/list";
import "../m3e-jsx.d.ts";

import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import type { Path, Ref } from "@silverbulletmd/silverbullet/lib/ref";
import { fuzzySearchAndSort } from "../../lib/fuzzy_search.ts";
import type { Command } from "../../types/command.ts";
import {
  buildAnythingPickerOptions,
  resolveAnythingPickerSelection,
  stripHashtags,
} from "../anything_picker.tsx";

// The nav bar's "Search" destination panel (2026-09-17 nav-bar redesign
// spec §5 leaf N7), replacing editor_ui.tsx's NAV_PANEL_PLACEHOLDERS
// "search" entry. This is a RELOCATION of search_sheet.tsx's "search" mode
// (client/components/search_sheet.tsx, untouched/read-only) into the
// `m3e-search-view mode="docked" contained` chrome spec §2.1 calls for
// (verified against node_modules/@m3e/web/dist/src/search/
// SearchViewElement.d.ts's own doc-comment example, which this markup
// matches near-verbatim) — the option-building / fuzzy-match / delegate /
// recordSearchTerm LOGIC below is unchanged from that file's "search"
// branch, only its surrounding chrome differs (no segmented mode switcher —
// this view IS the search mode, "open"/"run" stay search_sheet.tsx's own;
// no m3e-autocomplete — the spec's docked/contained composition doesn't use
// one, see filter.tsx's own m3e-search-view usage for the same plain
// `<input slot="input">` + `m3e-list` precedent).
//
// Honest scope, carried forward verbatim from search_sheet.tsx: this is NOT
// full-text search. No core FTS backend exists in this repo — the fallback
// is plain name/tag fuzzy matching over
// `buildAnythingPickerOptions({mode:"page"})`, plus an optional "Search
// space for ..." delegate row that only appears when a real `/^Search/`
// command (e.g. an installed FTS plug like silversearch) is registered in
// this space.

type SearchDelegateOption = FilterOption & { searchDelegate: true };

export function SearchView({
  allPages,
  extensions,
  currentPath,
  commands,
  recentSearchTerms,
  onNavigate,
  onNavigateRef,
  onTriggerCommand,
  onClose,
}: {
  allPages: PageMeta[];
  extensions: Set<string>;
  currentPath: Path;
  commands: Map<string, Command>;
  recentSearchTerms: { term: string; ts: number }[];
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
  onTriggerCommand: (cmd: Command | undefined) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // This panel IS search_sheet.tsx's "open" state — it's only mounted while
  // `viewState.navDestination === "search"` (editor_ui.tsx's panel host),
  // so there's no separate visibility toggle to key an autofocus effect off
  // of; focus once, on mount.
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery === "";

  // Optional delegate command — ONLY if a real `/^Search/` command exists
  // in this space (i.e. an FTS plug like silversearch is actually
  // installed). See the module doc comment on scope.
  const delegateSearchCommand = useMemo(
    () => Array.from(commands.values()).find((c) => /^Search/.test(c.name)),
    [commands],
  );

  const results: FilterOption[] = useMemo(() => {
    if (isEmpty) {
      return [];
    }
    // Fuzzy match over page names/tags (via the shared fuzzySearchAndSort
    // helper) plus an optional top-row FTS delegate.
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
  }, [
    isEmpty,
    query,
    trimmedQuery,
    allPages,
    extensions,
    currentPath,
    delegateSearchCommand,
  ]);

  const history: FilterOption[] = useMemo(() => {
    if (!isEmpty) {
      return [];
    }
    return recentSearchTerms.slice(0, 10).map((t) => ({
      name: t.term,
      hint: "Recent search",
    }));
  }, [isEmpty, recentSearchTerms]);

  const visible = isEmpty ? history : results;

  function activate(opt: FilterOption | undefined) {
    if (isEmpty) {
      // A bare recent-term history row isn't a resolved action — refill
      // the query and let the user re-run/refine it, same as
      // search_sheet.tsx's history-row click.
      if (opt) {
        setQuery(opt.name);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      return;
    }
    // Fires regardless of whether a delegate exists or what (if anything)
    // gets activated next — same unconditional placement as
    // search_sheet.tsx's own "search" branch.
    if (trimmedQuery) {
      client.recordSearchTerm(trimmedQuery);
    }
    if (opt && (opt as SearchDelegateOption).searchDelegate) {
      onTriggerCommand(delegateSearchCommand);
      return;
    }
    if (opt) {
      resolveAnythingPickerSelection(opt, { onNavigate, onNavigateRef });
    } else {
      onClose();
    }
  }

  return (
    <div class="sb-nav-search-view">
      <span class="sb-nav-panel-title">Search</span>
      <m3e-search-view mode="docked" contained>
        <Input
          // m3e-search-view's "input" slot contract requires a plain
          // <input> — see plug-api/ui/input.tsx's `bare` doc comment (same
          // pattern client/components/filter.tsx already uses for its own
          // m3e-search-view).
          bare
          slot="input"
          id="sb-nav-search-input"
          inputRef={inputRef}
          value={query}
          placeholder="Find in space"
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.isComposing) {
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              activate(visible[selectedIndex]);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((i) => Math.min(visible.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((i) => Math.max(0, i - 1));
            }
          }}
        />
        {visible.length === 0
          ? (
            <div class="sb-nav-search-empty">
              {isEmpty ? "No recent searches" : "No results"}
            </div>
          )
          : (
            <m3e-list class="sb-nav-search-result-list" tabIndex={-1}>
              {visible.map((opt, i) => (
                <m3e-list-item
                  key={`${isEmpty ? "h" : "r"}-${i}-${opt.name}`}
                  class={i === selectedIndex
                    ? "sb-option sb-selected-option"
                    : "sb-option"}
                  onMouseMove={() => {
                    if (selectedIndex !== i) {
                      setSelectedIndex(i);
                    }
                  }}
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    activate(opt);
                  }}
                >
                  <span class="sb-name">{opt.name}</span>
                  {opt.hint && (
                    <span slot="trailing" class="sb-hint">{opt.hint}</span>
                  )}
                  {opt.description && (
                    <span slot="supporting-text" class="sb-description">
                      {opt.description}
                    </span>
                  )}
                </m3e-list-item>
              ))}
            </m3e-list>
          )}
      </m3e-search-view>
    </div>
  );
}
