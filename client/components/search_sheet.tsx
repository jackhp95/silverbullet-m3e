import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet"; // registers m3e-bottom-sheet
import "@m3e/web/search"; // registers m3e-search-bar (+ m3e-search-view)
import "@m3e/web/list"; // registers m3e-list / m3e-list-item
import "@m3e/web/toolbar"; // registers m3e-toolbar (mode switcher)
import "@m3e/web/icon-button"; // registers m3e-icon-button
import "@m3e/web/icon"; // registers m3e-icon
import "./m3e-jsx.d.ts";

import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type {
  DocumentMeta,
  PageMeta,
} from "@silverbulletmd/silverbullet/type/index";
import type { Path, Ref } from "@silverbulletmd/silverbullet/lib/ref";
import type { Command } from "../types/command.ts";
import type { AnchorObject } from "./anchor_options.ts";
import { useAnchorOptions } from "./anything_picker.tsx";
import { NavListRow } from "./nav_list_row.tsx";
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
  type NavHandlers,
} from "./search_modes.ts";

// Search bottom sheet (spec docs/plans/2026-09-17-vertical-toolbar-search-nav-
// redesign-spec.md §2.4, leaf V6; mode-picker superseded post-spec by Jack's
// live-testing feedback — see the mode-model comment below). A modal
// `m3e-bottom-sheet` hosting, as three direct children: a title in
// `slot="header"` naming the active mode, an `m3e-search-bar` (with an
// `Input` in its `slot="input"`), an `m3e-list` of `NavListRow`s, and a
// floating icon-only `m3e-toolbar` mode switcher pinned to its bottom edge:
// query-empty renders per-mode history, a typed query renders per-mode live
// results. THE WHOLE POINT of the redesign is that results live inside the
// sheet — there is NO `m3e-autocomplete`/dropdown anywhere in this
// composition (that was the exact defect class prior attempts shipped, §1.4).
//
// Mode logic is NOT reimplemented here — it is imported from
// client/components/search_modes.ts (leaf V2, already merged), the single
// home for the Open/Search/Run result-building + history-building + activate
// behavior extracted verbatim from the deleted nav_views/{recent,search,run}
// .tsx. Rows render through client/components/nav_list_row.tsx (also V2).
//
// This component is intentionally NOT wired into client/editor_ui.tsx here —
// that is leaf V8 (a later, separate worktree). Its interactive acceptance
// assertions therefore live as `test.fixme` stubs in e2e/search-sheet.test.ts
// (this repo's e2e fixtures only boot the full app shell — there is no
// isolated-component-mount pattern, and this repo's vitest runs in a plain
// node environment with no DOM, so Preact state transitions / custom-element
// behavior cannot be exercised in a unit test); the statically-checkable
// structure is covered by the co-located search_sheet.test.ts render test.

// --- mode model (spec §2.4) ----------------------------------------------
//
// There is NO mode *picker* any more. Three successive attempts at one — an
// `m3e-menu`/`m3e-menu-item-radio` popup (V6/V12), an inline `m3e-list` in
// the results slot (feedback #1), and a `popover="auto"` anchored
// `m3e-list` with dividers — all failed the same live-testing bar: each
// still read as a dropdown/menu rather than a plain divided list, and each
// needed a leading trigger icon in the search bar that left dead space
// beside the search-view's own built-in magnifier.
//
// Replaced (Jack's round-2 direction) by a mode SWITCHER with no popup at
// all: a floating icon-only `m3e-toolbar` pinned to the bottom of the
// sheet, one icon-button per mode, with the ACTIVE mode named in the
// sheet's own `slot="header"` title rather than by a check-mark row. All
// three modes are therefore always one click away and always visible —
// strictly fewer interaction steps than any of the pickers, and no
// anchored-popup positioning machinery to get wrong. See the render below.

export type SearchMode = "search" | "open" | "run";

// Menu order top-to-bottom, matching spec §2.4's shell (Search / Open / Run).
export const MODE_ORDER: readonly SearchMode[] = ["search", "open", "run"];

// Default mode when the sheet opens. Mode does NOT persist across opens — a
// deliberate, documented limitation (spec §2.4, carried forward from the old
// segmented-button design), reset in the `open` effect below rather than
// silently "fixed".
export const DEFAULT_MODE: SearchMode = "open";

export const MODE_LABEL: Record<SearchMode, string> = {
  search: "Search",
  open: "Open",
  run: "Run",
};

export const MODE_ICON: Record<SearchMode, string> = {
  search: "search",
  open: "description",
  run: "terminal",
};

export const MODE_PLACEHOLDER: Record<SearchMode, string> = {
  // "Search" is honestly scoped: no core FTS backend exists in this repo, so
  // this is name/tag fuzzy match (+ an optional delegate row when a real
  // `/^Search/` command is installed) — same honest wording the deleted
  // nav_views/search.tsx used, not a fake full-text claim (spec §2.4).
  search: "Find in space",
  open: "Jump to a page, document, tag, or $anchor",
  run: "Run a command",
};

const MODE_EMPTY_MESSAGE: Record<SearchMode, string> = {
  search: "No recent searches",
  open: "No recently visited pages yet",
  run: "No commands",
};

export type SearchSheetData = {
  allPages: PageMeta[];
  allDocuments: DocumentMeta[];
  extensions: Set<string>;
  currentPath: Path;
  commands: Map<string, Command>;
  recentPaths: { path: Path; ts: number }[];
  recentSearchTerms: { term: string; ts: number }[];
};

/**
 * Rows to show for a given mode + query: per-mode history when the query is
 * empty, per-mode live results when typed. One dispatch point over
 * search_modes.ts's pure functions (spec §2.4's mode-semantics table). Kept
 * pure + side-effect-free so V6's mode→source wiring is unit-testable without
 * a DOM.
 */
export function selectRows(
  mode: SearchMode,
  query: string,
  data: SearchSheetData,
  anchorMode: boolean,
  anchors: AnchorObject[] | null,
): FilterOption[] {
  const isEmpty = query.trim() === "";
  switch (mode) {
    case "open":
      return isEmpty
        ? getOpenHistory(data.recentPaths, data.currentPath)
        : getOpenResults(
          query,
          data.allPages,
          data.allDocuments,
          data.extensions,
          data.currentPath,
          anchorMode,
          anchors,
        );
    case "search":
      return isEmpty
        ? getSearchHistory(data.recentSearchTerms)
        : getSearchResults(
          data.commands,
          data.allPages,
          data.extensions,
          data.currentPath,
          query,
        );
    case "run":
      return isEmpty
        ? getRunHistory(data.commands)
        : getRunResults(data.commands, query);
  }
}

// --- component -----------------------------------------------------------

export function SearchSheet({
  open,
  onClose,
  allPages,
  allDocuments,
  extensions,
  currentPath,
  commands,
  recentPaths,
  recentSearchTerms,
  onNavigate,
  onNavigateRef,
  onTriggerCommand,
}: {
  open: boolean;
  /** Dispatches `hide-search-sheet` (spec §5 V1). */
  onClose: () => void;
  allPages: PageMeta[];
  allDocuments: DocumentMeta[];
  extensions: Set<string>;
  currentPath: Path;
  commands: Map<string, Command>;
  recentPaths: { path: Path; ts: number }[];
  recentSearchTerms: { term: string; ts: number }[];
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
  onTriggerCommand: (cmd: Command | undefined) => void;
}) {
  const [mode, setMode] = useState<SearchMode>(DEFAULT_MODE);
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
  // height — the sheet was opening to ~48px, not ~50vh (caught by a live
  // Playwright rect check while diagnosing feedback #3, not visible from
  // source alone). Fix: assign the real array directly on the element via
  // this ref effect instead of the JSX attribute.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) {
      return;
    }
    el.setAttribute("handle", "");
    (el as unknown as { detents: string[] }).detents = ["half"];
  }, []);

  // The sheet dispatches a native `cancel` event on Escape, scrim click and
  // swipe-dismiss (decompiled node_modules/@m3e/web/dist/bottom-sheet.js:
  // 476/483/485). Sync our controlled `open` state off that via a real
  // listener rather than the JSX `onCancel` prop — the shared m3e-jsx.d.ts
  // notes camelCase custom-element handlers can silently fail to bind, and a
  // ref listener is unconditionally correct. This is what closes the sheet on
  // Escape (spec §5 V6 accept).
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) {
      return;
    }
    const handler = () => onClose();
    el.addEventListener("cancel", handler);
    return () => el.removeEventListener("cancel", handler);
  }, [onClose]);

  // Reset to the default mode + empty query each time the sheet opens.
  // Resetting mode here (rather than persisting it) is the documented §2.4
  // limitation, carried forward deliberately.
  //
  // Focus is still deferred to the transition-settled effect below rather
  // than requested here. The original reason (feedback #5 — focusing early
  // drove `m3e-search-view` into its docked-open state, promoting its
  // internal `.view` to a top-layer popover anchored to a stale, mid-
  // animation `getBoundingClientRect()` snapshot) no longer applies now
  // that `m3e-search-bar` replaced the search-view and there is no docked
  // state machine left to trip. Deferring is kept anyway because focusing
  // an input inside a sheet that is still mid-`translateY` transition also
  // makes the browser scroll-anchor to a moving target.
  useEffect(() => {
    if (open) {
      setMode(DEFAULT_MODE);
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
  // transition) is the real "animation settled" signal. This is what
  // actually fixes feedback #5 — see the effect above for why focusing
  // early caused the drift.
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
  }, [mode, query]);


  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery === "";

  // `$`-anchor sub-mode is Open-only (spec §2.4 mode table). The hook runs
  // unconditionally (rules of hooks); `anchorMode` gates the actual load.
  const anchorMode = mode === "open" && query.startsWith("$");
  const anchors = useAnchorOptions(anchorMode);

  // Only meaningful in Search mode, but computed once here so both the
  // results memo (indirectly, via selectRows→getSearchResults) and
  // `activate` see the same delegate command.
  const delegateSearchCommand = useMemo(
    () => findSearchDelegateCommand(commands),
    [commands],
  );

  const visible = useMemo(
    () =>
      selectRows(
        mode,
        query,
        {
          allPages,
          allDocuments,
          extensions,
          currentPath,
          commands,
          recentPaths,
          recentSearchTerms,
        },
        anchorMode,
        anchors,
      ),
    [
      mode,
      query,
      allPages,
      allDocuments,
      extensions,
      currentPath,
      commands,
      recentPaths,
      recentSearchTerms,
      anchorMode,
      anchors,
    ],
  );

  function refocus() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function activate(opt: FilterOption | undefined) {
    const handlers: NavHandlers = { onNavigate, onNavigateRef };
    switch (mode) {
      case "open":
        // onNavigate/onNavigateRef (caller-wired in V8) close the sheet on a
        // real navigation — same "closing inherited from the nav handlers"
        // convention nav_views/recent.tsx relied on.
        activateOpenOption(opt, isEmpty, handlers);
        return;
      case "search":
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
        return;
      case "run":
        activateRunOption(opt, commands, onClose);
        return;
    }
  }

  return (
    <>
    <m3e-bottom-sheet
      id="sb-search-sheet"
      ref={sheetRef}
      modal
      hideable
      open={open}
      class="sb-search-sheet"
      // Feedback #3: cap the sheet at ~50vh instead of full height, leaving
      // visible content behind it. `detents=["half"]` (assigned via the ref
      // effect above, NOT this JSX attribute — see that effect's comment)
      // is the component's own supported sizing lever (not custom CSS) —
      // decompiled node_modules/@m3e/web/dist/bottom-sheet.js's
      // `_computeDetentHeight("half")` resolves to exactly
      // `_computeMaxHeight() * 0.5`, i.e. 50% of the viewport height minus
      // the sheet's own top inset, so it tracks real viewport height instead
      // of a hardcoded `50vh` that would drift from the component's own
      // metrics.
    >
      {/* The sheet's own `slot="header"` title IS the active-mode indicator
          (replacing the removed mode-picker list's check-mark row): picking a
          mode in the bottom toolbar below retitles the sheet Search/Open/Run.
          The header region is gated behind the sheet's `[handle]` CSS
          attribute selector, which the ref effect above already forces on. */}
      <span slot="header">{MODE_LABEL[mode]}</span>
      {/* `m3e-search-bar`, NOT `m3e-search-view mode="docked" contained`.
          The search-view was the wrong primitive here and was silently
          breaking the whole feature: it owns an internal open/closed state
          machine driven by input focus, and it only reveals its results
          region while open. Live-measured against the running app: `sv.open`
          stayed `false` and the shadow `.results` div measured 0x0 even with
          10 real rows slotted into it, so NO result or history row was ever
          visible in this sheet — the one thing the redesign exists to do
          (spec §1.4/§2.4: "results live inside the sheet").

          `m3e-search-bar` is that same bar with no state machine at all —
          just `leading`/`input`/`trailing` slots (verified against the m3e
          search card + this repo's custom-elements.json). The results list
          is therefore a direct child of the SHEET, which is the actual
          container the spec describes, instead of being slotted into a
          collapsed shadow region.

          This also deletes, rather than works around, both prior
          shadow-DOM hacks: the forced `.view { position: static }` and the
          hidden `.icon .close` back-arrow only ever existed because docked
          mode promotes itself to a top-layer popover and swaps its leading
          icon while open. No docked mode, no popover promotion, no drift,
          no back-arrow — so no shadow patching. */}
      <m3e-search-bar class="sb-search-sheet-bar">
        {/* The bar has no built-in leading icon of its own (that was the
            search-VIEW's), so the magnifier is ours now, slotted explicitly.
            Nothing else is in this slot: the mode switcher is the bottom
            toolbar below, not a leading trigger. The old trigger's wrapping
            `<span slot="closed-leading">`/`slot="open-leading"` boxes were
            themselves the "strange empty space before the leading icon
            button" (feedback #4) — both are gone. */}
        <m3e-icon slot="leading" name="search"></m3e-icon>
        <Input
          bare
          slot="input"
          id="sb-search-sheet-input"
          inputRef={inputRef}
          value={query}
          placeholder={MODE_PLACEHOLDER[mode]}
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
              // Nothing to back out of any more (the mode picker was a
              // popover that swallowed the first Escape) — Escape now always
              // closes the sheet, matching the sheet's own `cancel` event.
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
      {/* Results / history — a direct child of the sheet (see the bar's
          comment above for why this is no longer slotted into the
          search-view's collapsed results region). `.sb-search-sheet-body`
          is the scroll container. */}
      <div class="sb-search-sheet-body">
        {visible.length === 0
          ? (
            <div class="sb-search-sheet-empty">
              {isEmpty ? MODE_EMPTY_MESSAGE[mode] : "No results"}
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
      {/* Mode switcher: a floating, icon-only `m3e-toolbar` pinned to the
          bottom of the sheet, REPLACING the mode-picker popover entirely
          (Jack's live-testing round 2 — the popover still read as a
          dropdown/menu rather than a plain divided list, and its trigger
          left dead space in the search bar's leading slot). Same
          `m3e-toolbar shape="rounded" elevated` + bare `m3e-icon-button`
          idiom `floating_toolbar.tsx` already uses for the app's vertical
          toolbar, so the two floating toolbars are visually consistent.

          `m3e-toolbar` has no selection-manager concept (verified in
          floating_toolbar.tsx against custom-elements.json: no `selected`
          attribute, no `change` event), so the active mode is driven by us.
          Active mode is communicated two ways: the sheet's `slot="header"`
          title above (the primary indicator — Search/Open/Run) and the
          active button's `variant="filled"` (m3e-icon-button's own
          documented appearance variant — NOT custom CSS, and not
          `selected`, which the card scopes to `toggle` buttons; these are
          mutually exclusive radio-like modes, not independent toggles). */}
      <m3e-toolbar
        shape="rounded"
        elevated
        class="sb-search-sheet-modes"
        aria-label="Search mode"
      >
        {MODE_ORDER.map((m) => (
          <m3e-icon-button
            key={m}
            variant={m === mode ? "filled" : "standard"}
            title={MODE_LABEL[m]}
            aria-label={MODE_LABEL[m]}
            aria-pressed={m === mode ? "true" : "false"}
            onClick={() => {
              setMode(m);
              refocus();
            }}
          >
            <m3e-icon name={MODE_ICON[m]}></m3e-icon>
          </m3e-icon-button>
        ))}
      </m3e-toolbar>
    </m3e-bottom-sheet>
    </>
  );
}
