import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet";
import "@m3e/web/segmented-button";
import "@m3e/web/search"; // registers m3e-search-bar (and m3e-search-view, unused here)
import "@m3e/web/autocomplete"; // registers m3e-autocomplete + m3e-option
import "@m3e/web/list";
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";

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
import {
  buildAnythingPickerOptions,
  resolveAnythingPickerSelection,
  stripHashtags,
  useAnchorOptions,
} from "./anything_picker.tsx";
import {
  buildCommandPaletteOptions,
  commandFromOption,
} from "./command_palette.tsx";

// ONE consolidated search entry point replacing the separate page-picker /
// command-palette / search-view chrome (spec §2 items 3+4+5, plan leaves
// L9-L12) — NOT a replacement for those modals, which stay reachable via
// their own keybindings (AnythingPicker/CommandPalette/filter.tsx). This is
// an *additional* entry point layered on top of the exact same option-
// building + navigate/trigger logic they already use (imports above), so
// there is exactly one implementation of "what does selecting a page vs a
// command do" in this codebase, not two diverging ones.
//
// Real m3e-bottom-sheet, same composition as item_capture_sheet.tsx
// (`modal handle hideable open={}`), including the same live-verified
// `handle` quirk: `handle` must be forced on as a real DOM ATTRIBUTE via a
// ref, not just the JSX boolean prop, or M3eBottomSheetElement's compiled
// `:host(:not([handle])) .header { display:none }` rule hides the header
// slot (title) and the drag dimple — see the `useEffect` below and
// item_capture_sheet.tsx's identical comment for the full explanation.

export type SearchMode = "open" | "run" | "search";

const MODES: ReadonlyArray<{
  mode: SearchMode;
  label: string;
  icon: string;
  placeholder: string;
  emptyHistoryLabel: string;
}> = [
  {
    mode: "open",
    label: "Open",
    icon: "description",
    placeholder: "Page, document, tag, or $anchor",
    emptyHistoryLabel: "No recently visited pages yet",
  },
  {
    mode: "run",
    label: "Run",
    icon: "terminal",
    placeholder: "Command",
    emptyHistoryLabel: "No commands run yet",
  },
  {
    mode: "search",
    label: "Search",
    icon: "search",
    placeholder: "Search pages and tags",
    emptyHistoryLabel: "No recent searches",
  },
];

// A synthetic (non-page, non-command) result row: search mode's "Search
// space for «query»" delegate action — see the module doc comment on scope
// (spec §2 item 3+4+5's honest FTS-out-of-scope call).
type SearchDelegateOption = FilterOption & { searchDelegate: true };

// A synthetic open-mode history row, built from `client.recentPaths` rather
// than the regular page/document option-building — see L12: open-mode's
// empty-query history is specifically `client.recentPaths`, not "all pages
// sorted by lastOpened" (buildAnythingPickerOptions's own default order).
type RecentPathOption = FilterOption & { recentPath: Path };

export function SearchSheet({
  open,
  onClose,
  darkMode: _darkMode,
  allPages,
  allDocuments,
  extensions,
  currentPath,
  recentPaths,
  commands,
  recentSearchTerms,
  onNavigate,
  onNavigateRef,
  onTriggerCommand,
}: {
  open: boolean;
  onClose: () => void;
  darkMode?: boolean;
  allPages: PageMeta[];
  allDocuments: DocumentMeta[];
  extensions: Set<string>;
  currentPath: Path;
  recentPaths: { path: Path; ts: number }[];
  commands: Map<string, Command>;
  recentSearchTerms: { term: string; ts: number }[];
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
  onTriggerCommand: (cmd: Command | undefined) => void;
}) {
  const [mode, setMode] = useState<SearchMode>("open");
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sheetRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = "sb-search-sheet-input";

  // Same live-verified quirk as item_capture_sheet.tsx — see module doc
  // comment above.
  useEffect(() => {
    sheetRef.current?.setAttribute("handle", "");
  }, []);

  useEffect(() => {
    if (open) {
      setMode("open");
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mode, query]);

  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery === "";

  // "open" mode's own $-anchor search, exactly like AnythingPicker.
  const anchorMode = mode === "open" && query.startsWith("$");
  const anchors = useAnchorOptions(anchorMode);

  // search mode's optional delegate command — ONLY if a real `/^Search/`
  // command exists in this space (i.e. an FTS plug like silversearch is
  // actually installed). No core full-text search exists in this repo, so
  // this is search mode's one honest way to reach real FTS when available —
  // see the module doc comment.
  const delegateSearchCommand = useMemo(
    () =>
      Array.from(commands.values()).find((c) => /^Search/.test(c.name)),
    [commands],
  );

  const results: FilterOption[] = useMemo(() => {
    if (isEmpty) {
      return [];
    }
    if (mode === "open") {
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
    if (mode === "run") {
      return fuzzySearchAndSort(buildCommandPaletteOptions(commands), query);
    }
    // search: fuzzy match over page names/tags (via the shared
    // fuzzySearchAndSort helper — see its own scoring fields for the
    // "tags" caveat noted in the completion report) plus an optional
    // top-row FTS delegate.
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
    mode,
    query,
    trimmedQuery,
    allPages,
    allDocuments,
    extensions,
    currentPath,
    anchorMode,
    anchors,
    commands,
    delegateSearchCommand,
  ]);

  const history: FilterOption[] = useMemo(() => {
    if (!isEmpty) {
      return [];
    }
    if (mode === "open") {
      return recentPaths
        .filter((p) => p.path !== currentPath)
        .slice(0, 10)
        .map((p): RecentPathOption => ({
          name: getNameFromPath(p.path),
          hint: "Recent",
          recentPath: p.path,
        }));
    }
    if (mode === "run") {
      // Commands sorted by def.lastRun — buildCommandPaletteOptions already
      // encodes recency into orderId (most-recently-run = most negative),
      // and fuzzySearchAndSort("") just sorts by orderId — see that
      // function's own doc comment.
      return fuzzySearchAndSort(buildCommandPaletteOptions(commands), "")
        .slice(0, 10);
    }
    return recentSearchTerms.slice(0, 10).map((t) => ({
      name: t.term,
      hint: "Recent search",
    }));
  }, [isEmpty, mode, recentPaths, currentPath, commands, recentSearchTerms]);

  const visible = isEmpty ? history : results;

  function activate(opt: FilterOption | undefined) {
    if (mode === "run") {
      onTriggerCommand(commandFromOption(opt, commands));
      return;
    }
    if (mode === "search") {
      if (isEmpty) {
        // A bare recent-term history row isn't a resolved action — refill
        // the query and let the user re-run/refine it, same as clicking a
        // recent search suggestion anywhere else.
        if (opt) {
          setQuery(opt.name);
          requestAnimationFrame(() => inputRef.current?.focus());
        }
        return;
      }
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
      return;
    }
    // open
    if (isEmpty && opt && (opt as RecentPathOption).recentPath) {
      onNavigateRef({ path: (opt as RecentPathOption).recentPath });
      return;
    }
    resolveAnythingPickerSelection(opt, { onNavigate, onNavigateRef });
  }

  const current = MODES.find((m) => m.mode === mode)!;

  return (
    <m3e-bottom-sheet
      id="sb-search-sheet"
      ref={sheetRef}
      modal
      handle
      hideable
      open={open}
      onCancel={() => onClose()}
      onClosed={() => onClose()}
    >
      <span slot="header">{current.label}</span>
      <div class="sb-search-sheet-body">
        <m3e-segmented-button
          aria-label="Search mode"
          onInput={(e: Event) => {
            const target = e.currentTarget as unknown as {
              value: string | readonly string[] | null;
            };
            const value = Array.isArray(target.value)
              ? target.value[0]
              : target.value;
            if (value && value !== mode) {
              setMode(value as SearchMode);
              setQuery("");
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
        >
          {MODES.map((m) => (
            <m3e-button-segment
              key={m.mode}
              value={m.mode}
              checked={m.mode === mode}
            >
              <m3e-icon slot="icon" name={m.icon}></m3e-icon>
              {m.label}
            </m3e-button-segment>
          ))}
        </m3e-segmented-button>
        <m3e-search-bar clearable onclear={() => setQuery("")}>
          <Input
            bare
            slot="input"
            id={inputId}
            inputRef={inputRef}
            value={query}
            placeholder={current.placeholder}
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
        </m3e-search-bar>
        <m3e-autocomplete for={inputId} filter="none" hide-no-data>
          {visible.map((opt, i) => (
            <m3e-option key={`${mode}-${isEmpty ? "h" : "r"}-${i}`} value={opt.name}>
              {opt.name}
            </m3e-option>
          ))}
        </m3e-autocomplete>
        {visible.length === 0
          ? (
            <div class="sb-search-sheet-empty">
              {isEmpty ? current.emptyHistoryLabel : "No results"}
            </div>
          )
          : (
            <m3e-list class="sb-search-sheet-result-list" tabIndex={-1}>
              {visible.map((opt, i) => (
                <m3e-list-item
                  key={`${mode}-${isEmpty ? "h" : "r"}-${i}-${opt.name}`}
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
      </div>
    </m3e-bottom-sheet>
  );
}
