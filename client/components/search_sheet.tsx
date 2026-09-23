import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet"; // registers m3e-bottom-sheet
import "@m3e/web/search"; // registers m3e-search-bar (+ m3e-search-view)
import "@m3e/web/list"; // registers m3e-list / m3e-list-item
import "@m3e/web/icon"; // registers m3e-icon
import "./m3e-jsx.d.ts";

import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import type { Path, Ref } from "@silverbulletmd/silverbullet/lib/ref";
import type { Command } from "../types/command.ts";
import { NavListRow } from "./nav_list_row.tsx";
import {
  activateSearchOption,
  findSearchDelegateCommand,
  getSearchHistory,
  getSearchResults,
  type NavHandlers,
} from "./search_modes.ts";

// Search bottom sheet (spec docs/plans/2026-09-17-vertical-toolbar-search-nav-
// redesign-spec.md §2.4, leaf V6; mode picker later superseded post-spec by
// Jack's live-testing feedback, and then — 2026-09-22, Task C of the
// cards/tailwind audit — the Open/Run modes themselves removed entirely).
//
// This sheet is SEARCH-ONLY now. "Open page" and "Run command" were the
// other two of the three original modes (search_modes.ts's Open/Run
// sections still hold their pure logic — `getOpenHistory` is still live,
// reused by `nav_views/history_tab.tsx`'s History tab — but this sheet no
// longer surfaces them as a mode). Both destinations are already reachable
// elsewhere: page navigation via the always-available page picker
// (`client.startPageNavigate("page")`, Cmd/Ctrl-K) and the History tab
// (`navigation_sheet.tsx`), and commands via the command palette
// (Cmd/Ctrl-Shift-P) — the exact same `buildAnythingPickerOptions`/
// `buildCommandPaletteOptions` builders `search_modes.ts`'s now-unused-here
// `getOpenResults`/`getRunResults` themselves delegated to. Having the same
// two destinations ALSO living as modes inside the nominally single-purpose
// search sheet was the redundancy Jack asked to cut — search should be
// solely for searching.
//
// Consequently: no more mode picker (the search bar's leading icon button,
// the `m3e-list`/`m3e-divider` popup, and all the roving-focus/positioning
// machinery that came with it — see this file's git history, commit
// e5417f84 onward, for that now-deleted mode-model), no more `SearchMode`
// union, and the sheet's header is a static "Search" title rather than a
// mode-driven one.
//
// A modal `m3e-bottom-sheet` hosting, as direct children: a static
// `slot="header"` title, an `m3e-search-bar` (with an `Input` in its
// `slot="input"`), and an `m3e-list` of `NavListRow`s. query-empty renders
// recent-search history, a typed query renders live page-name/tag results
// (+ an optional "Search space for ..." delegate row when a real
// `/^Search/` command is installed) — RESULTS live inside the sheet, no
// `m3e-autocomplete`/result-dropdown anywhere in this composition.
//
// This component is intentionally NOT wired into client/editor_ui.tsx here —
// that is leaf V8 (a later, separate worktree). Its interactive acceptance
// assertions therefore live as `test.fixme` stubs in e2e/search-sheet.test.ts
// (this repo's e2e fixtures only boot the full app shell — there is no
// isolated-component-mount pattern, and this repo's vitest runs in a plain
// node environment with no DOM, so Preact state transitions / custom-element
// behavior cannot be exercised in a unit test); the statically-checkable
// structure is covered by the co-located search_sheet.test.ts render test.

const SEARCH_PLACEHOLDER =
  // Honestly scoped: no core FTS backend exists in this repo, so this is
  // name/tag fuzzy match (+ an optional delegate row when a real `/^Search/`
  // command is installed) — same honest wording the deleted
  // nav_views/search.tsx used, not a fake full-text claim (spec §2.4).
  "Find in space";

export type SearchSheetData = {
  allPages: PageMeta[];
  extensions: Set<string>;
  currentPath: Path;
  commands: Map<string, Command>;
  recentSearchTerms: { term: string; ts: number }[];
};

/**
 * Rows to show for the current query: recent-search history when the query
 * is empty, live page results (+ delegate row) when typed. One dispatch
 * point over search_modes.ts's pure Search functions, kept pure +
 * side-effect-free so it's unit-testable without a DOM.
 */
export function selectRows(
  query: string,
  data: SearchSheetData,
): FilterOption[] {
  const isEmpty = query.trim() === "";
  return isEmpty
    ? getSearchHistory(data.recentSearchTerms)
    : getSearchResults(
      data.commands,
      data.allPages,
      data.extensions,
      data.currentPath,
      query,
    );
}

// --- component -----------------------------------------------------------

export function SearchSheet({
  open,
  onClose,
  allPages,
  extensions,
  currentPath,
  commands,
  recentSearchTerms,
  onNavigate,
  onNavigateRef,
  onTriggerCommand,
}: {
  open: boolean;
  /** Dispatches `hide-search-sheet` (spec §5 V1). */
  onClose: () => void;
  allPages: PageMeta[];
  extensions: Set<string>;
  currentPath: Path;
  commands: Map<string, Command>;
  recentSearchTerms: { term: string; ts: number }[];
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
  onTriggerCommand: (cmd: Command | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  // Same m3e-bottom-sheet `handle` workaround item_capture_sheet.tsx
  // documented + verified: `handle` gates the drag dimple + slot="header" via
  // a CSS *attribute* selector but is not a reflecting property, so Preact's
  // boolean-property assignment alone never adds the HTML attribute. Force it
  // once the element exists.
  //
  // `detents` needs its own, DIFFERENT workaround, live-verified: Preact sets
  // it as a raw property assignment (the `detents` instance field already
  // exists on the element post-construction, so Preact's custom-element diff
  // takes the property branch, not `setAttribute`) — bypassing Lit's
  // attribute-to-array converter entirely. A plain JSX `detents="half"`
  // therefore left `el.detents` as the STRING `"half"`, not `["half"]`;
  // `this.detents[this.activeDetent]` (bottom-sheet.js) then indexed the
  // string by position (`"half"[0]` === `"h"`), which matched none of
  // `_computeDetentHeight`'s cases and silently fell back to peek/collapsed
  // height — the sheet was opening to ~48px, not ~50vh. Fix: assign the real
  // array directly on the element via this ref effect instead of the JSX
  // attribute.
  //
  // `["half", "full"]`: index 0 must stay `half` (opening at ~50vh, leaving
  // visible content behind the sheet, is the explicit requirement from
  // feedback #3), and a second, distinct detent is required for the drag
  // gesture to have somewhere to land (a one-entry array rubber-bands back to
  // itself on release — see the deleted mode-picker era's comment, git
  // history, for the fuller live-measured writeup of why `fit` stays
  // omitted).
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) {
      return;
    }
    el.setAttribute("handle", "");
    (el as unknown as { detents: string[] }).detents = ["half", "full"];
  }, []);

  // The sheet dispatches a native `cancel` event on Escape, scrim click and
  // swipe-dismiss (decompiled node_modules/@m3e/web/dist/bottom-sheet.js:
  // 476/483/485). Sync our controlled `open` state off that via a real
  // listener rather than the JSX `onCancel` prop — the shared m3e-jsx.d.ts
  // notes camelCase custom-element handlers can silently fail to bind, and a
  // ref listener is unconditionally correct.
  //
  // ALSO listen for `closed` (found live, chasing the identical defect that
  // broke navigation_sheet.tsx's reopen-after-detent-close). `cancel` alone
  // misses one real dismiss path: tapping the drag handle to cycle detents,
  // whose `hideable` branch calls `this.hide()` directly with no `cancel`
  // event. `closed` is dispatched unconditionally by `updated()` whenever
  // `open` flips to false, whichever path caused it.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) {
      return;
    }
    const handler = () => onClose();
    el.addEventListener("cancel", handler);
    el.addEventListener("closed", handler);
    return () => {
      el.removeEventListener("cancel", handler);
      el.removeEventListener("closed", handler);
    };
  }, [onClose]);

  // Reset the query each time the sheet opens.
  //
  // Focus is still deferred to the transition-settled effect below rather
  // than requested here — focusing an input inside a sheet that is still
  // mid-`translateY` transition makes the browser scroll-anchor to a moving
  // target.
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Focus the input only once the sheet's own slide-up CSS transition has
  // actually finished — NOT on the `opened` event, which (verified against
  // decompiled bottom-sheet.js's `updated()`) dispatches synchronously the
  // instant `open` flips, before the `transform: translateY(...)` transition
  // that animates the sheet into place has even started. `transitionend`
  // (filtered to the `transform` property, since border-radius/backdrop also
  // transition) is the real "animation settled" signal.
  useEffect(() => {
    const el = sheetRef.current;
    if (!open || !el) {
      return;
    }
    let focused = false;
    function focusOnce() {
      if (!focused) {
        focused = true;
        inputRef.current?.focus();
      }
    }
    const handler = (e: TransitionEvent) => {
      if (e.propertyName === "transform") {
        focusOnce();
      }
    };
    el.addEventListener("transitionend", handler);
    // Fallback for `prefers-reduced-motion` (bottom-sheet.js's own `@media
    // (prefers-reduced-motion)` block sets `transition: none`, so
    // `transitionend` never fires there) — matches the host's own
    // `medium2` transition duration as an upper bound.
    const fallback = window.setTimeout(focusOnce, 400);
    return () => {
      el.removeEventListener("transitionend", handler);
      window.clearTimeout(fallback);
    };
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery === "";

  const delegateSearchCommand = useMemo(
    () => findSearchDelegateCommand(commands),
    [commands],
  );

  const visible = useMemo(
    () =>
      selectRows(query, {
        allPages,
        extensions,
        currentPath,
        commands,
        recentSearchTerms,
      }),
    [query, allPages, extensions, currentPath, commands, recentSearchTerms],
  );

  function refocus() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function activate(opt: FilterOption | undefined) {
    const handlers: NavHandlers = { onNavigate, onNavigateRef };
    activateSearchOption(
      opt,
      isEmpty,
      trimmedQuery,
      delegateSearchCommand,
      {
        ...handlers,
        onTriggerCommand,
        onClose,
        onRefillQuery: (name) => {
          setQuery(name);
          refocus();
        },
      },
    );
  }

  return (
    <m3e-bottom-sheet
      id="sb-search-sheet"
      ref={sheetRef}
      modal
      hideable
      open={open}
      class="sb-search-sheet"
      // Feedback #3: OPEN the sheet at ~50vh instead of full height, leaving
      // visible content behind it — `half` is detent index 0, and the user
      // can still drag the handle up to `full`.
      // `detents=["half", "full"]` (assigned via the ref effect above, NOT
      // this JSX attribute — see that effect's comment) is the component's
      // own supported sizing lever (not custom CSS) — decompiled
      // node_modules/@m3e/web/dist/bottom-sheet.js's
      // `_computeDetentHeight("half")` resolves to exactly
      // `_computeMaxHeight() * 0.5`, i.e. 50% of the viewport height minus
      // the sheet's own top inset, so it tracks real viewport height instead
      // of a hardcoded `50vh` that would drift from the component's own
      // metrics.
    >
      {/* Static title — no more mode to name. The header region is gated
          behind the sheet's `[handle]` CSS attribute selector, which the ref
          effect above already forces on. */}
      <span slot="header">Search</span>
      {/* `m3e-search-bar`, NOT `m3e-search-view mode="docked" contained` — see
          this file's header comment (git history, pre-Task-C, for the fuller
          live-measured writeup of why `m3e-search-view` was the wrong
          primitive here). `m3e-search-bar` has no state machine and no
          built-in leading icon, so the input is its only slotted content now
          that the mode-picker button is gone. */}
      <m3e-search-bar class="sb-search-sheet-bar sticky top-0 z-[1] pb-3">
        <m3e-icon slot="leading" name="search"></m3e-icon>
        <Input
          bare
          slot="input"
          id="sb-search-sheet-input"
          inputRef={inputRef}
          value={query}
          placeholder={SEARCH_PLACEHOLDER}
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
              // Escape here always closes the sheet, matching the sheet's own
              // `cancel` event. e2e/search-sheet.test.ts asserts this
              // explicitly so it stays a known, chosen behavior.
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
      {/* Results / history — a direct child of the sheet.
          `.sb-search-sheet-body` is the scroll container. */}
      <div class="sb-search-sheet-body">
        {visible.length === 0
          ? (
            <div class="sb-search-sheet-empty">
              {isEmpty ? "No recent searches" : "No results"}
            </div>
          )
          : (
            <m3e-list class="sb-search-sheet-list" tabIndex={-1}>
              {visible.map((opt, i) => (
                <NavListRow
                  key={`${isEmpty ? "h" : "r"}-${i}-${opt.name}`}
                  option={opt}
                  selected={i === selectedIndex}
                  onSelect={() => {
                    if (selectedIndex !== i) {
                      setSelectedIndex(i);
                    }
                  }}
                  onActivate={activate}
                />
              ))}
            </m3e-list>
          )}
      </div>
    </m3e-bottom-sheet>
  );
}
