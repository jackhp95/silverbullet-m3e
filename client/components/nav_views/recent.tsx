import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/search"; // registers m3e-search-view (+ m3e-search-bar)
import "@m3e/web/list";
import "../m3e-jsx.d.ts";

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
import { fuzzySearchAndSort } from "../../lib/fuzzy_search.ts";
import {
  buildAnythingPickerOptions,
  resolveAnythingPickerSelection,
  stripHashtags,
  useAnchorOptions,
} from "../anything_picker.tsx";

// Recent nav-bar destination (2026-09-17 nav-bar redesign spec §2.5/§3/§5
// leaf N6) — the "jump to a page" destination: a RELOCATION of
// search_sheet.tsx's "open" mode chrome (`:167-185` results, `:228-240`
// history, `:288-293` activate) onto a docked `m3e-search-view`
// (`node_modules/@m3e/web/dist/src/search/SearchViewElement.d.ts` — its own
// documented example is `<m3e-search-view mode="docked" contained>` with a
// plain `<input slot="input">` + slotted `m3e-list`, spec §2.1). None of the
// option-building/navigate logic is rewritten (spec §4.3) —
// buildAnythingPickerOptions/resolveAnythingPickerSelection/stripHashtags/
// useAnchorOptions/fuzzySearchAndSort are reused verbatim from
// anything_picker.tsx / lib/fuzzy_search.ts, same as search_sheet.tsx always
// did.
//
// `open`/closed lifecycle is NOT Preact-controlled here (unlike
// `m3e-nav-item`'s `selected` in nav_bar.tsx) — decompiled `dist/search.js`
// shows `M3eSearchViewElement` drives its own `open` state entirely off
// input focus/blur/pointerdown/Escape (`_handleInputFocus` sets
// `open = true`, `_handleFocusChange` clears + closes on blur in docked
// mode, `_handleInputKeyDown`/`_handleKeyDown` close on Escape). Passing a
// controlled `open` prop would fight that internal state machine, so this
// component leaves the attribute unset entirely, exactly matching the
// spec's own `§2.1` code sample (no `open` attribute in it either).
//
// On selection, this component calls the `onNavigate`/`onNavigateRef`
// handlers its caller supplies — same convention `editor_ui.tsx` already
// uses for `AnythingPicker` (wrapping them with
// `navigateToAnythingPickerName`/`navigateToAnythingPickerRef`, whose
// `close` callback dispatches `close-nav-panel`), so panel-closing-on-select
// is inherited for free rather than reimplemented here.

type RecentPathOption = FilterOption & { recentPath: Path };

export function RecentView({
  allPages,
  allDocuments,
  extensions,
  currentPath,
  recentPaths,
  onNavigate,
  onNavigateRef,
}: {
  allPages: PageMeta[];
  allDocuments: DocumentMeta[];
  extensions: Set<string>;
  currentPath: Path;
  recentPaths: { path: Path; ts: number }[];
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery === "";

  // `$`-prefix anchor sub-mode — identical trigger to search_sheet.tsx's
  // "open" mode / AnythingPicker (both: `query.startsWith("$")`).
  const anchorMode = query.startsWith("$");
  const anchors = useAnchorOptions(anchorMode);

  const results: FilterOption[] = useMemo(() => {
    if (isEmpty) {
      return [];
    }
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
  }, [
    isEmpty,
    query,
    allPages,
    allDocuments,
    extensions,
    currentPath,
    anchorMode,
    anchors,
  ]);

  // Empty-query history is specifically `client.recentPaths` (passed down
  // as `recentPaths`), not "all pages sorted by lastOpened" —
  // search_sheet.tsx `:232-240`'s exact behavior, ported verbatim.
  const history: FilterOption[] = useMemo(() => {
    if (!isEmpty) {
      return [];
    }
    return recentPaths
      .filter((p) => p.path !== currentPath)
      .slice(0, 10)
      .map((p): RecentPathOption => ({
        name: getNameFromPath(p.path),
        hint: "Recent",
        recentPath: p.path,
      }));
  }, [isEmpty, recentPaths, currentPath]);

  const visible = isEmpty ? history : results;

  function activate(opt: FilterOption | undefined) {
    if (isEmpty && opt && (opt as RecentPathOption).recentPath) {
      onNavigateRef({ path: (opt as RecentPathOption).recentPath });
      return;
    }
    resolveAnythingPickerSelection(opt, { onNavigate, onNavigateRef });
  }

  return (
    <m3e-search-view mode="docked" contained class="sb-nav-recent-view">
      <span slot="closed-leading" class="sb-nav-panel-title">
        Recent
      </span>
      <Input
        bare
        slot="input"
        id="sb-nav-recent-input"
        inputRef={inputRef}
        value={query}
        placeholder="Jump to a page, document, tag, or $anchor"
        onInput={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.isComposing) {
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            activate(visible[selectedIndex]);
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
          <div class="sb-nav-panel-empty">
            {isEmpty ? "No recently visited pages yet" : "No results"}
          </div>
        )
        : (
          <m3e-list tabIndex={-1}>
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
  );
}
