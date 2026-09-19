import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet"; // registers m3e-bottom-sheet
import "@m3e/web/search"; // registers m3e-search-view (+ m3e-search-bar)
import "@m3e/web/list"; // registers m3e-list / m3e-list-item
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
// `m3e-bottom-sheet` hosting one `m3e-search-view mode="docked" contained`,
// whose leading icon toggles a 3-item `m3e-list` mode picker (Search / Open /
// Run) in place of the results, an `Input` in `slot="input"`, and an
// `m3e-list` of `NavListRow`s below it:
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
// Mode picker (this section + the render below) is an `m3e-list` of
// `m3e-list-item`s, NOT an `m3e-menu`/`m3e-menu-item-radio` popup (Jack's
// live-testing feedback #1, superseding V6/V12's `m3e-menu`-based picker —
// see git history for that prior approach). `m3e-list-item` is inert by
// itself (spec doc's own component table notes this — "use `m3e-list-action`
// for clickable rows"), but `nav_list_row.tsx`'s `NavListRow` already drives
// click/select behavior on plain `m3e-list-item`s throughout this same
// sheet (selection + activation via `onClick`/`onMouseMove`, no
// `m3e-list-action`), so the mode-picker rows below follow that exact,
// already-proven precedent rather than introducing a second list-item
// idiom. No `PreactJSX` augmentation is needed any more (that was only for
// `m3e-menu-item-radio`/`-group`; `m3e-list`/`m3e-list-item` are already
// declared in the shared client/components/m3e-jsx.d.ts).

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
  // Whether the mode-picker `m3e-list` (Search/Open/Run) is showing in place
  // of the normal history/results list — toggled by the leading mode icon,
  // closed again on a pick (feedback #1: this replaced the old `m3e-menu`
  // popup, see the mode-model comment above).
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const searchViewRef = useRef<HTMLElement>(null);

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
  // Focus is intentionally NOT requested here (moved to the `opened`
  // listener below) — feedback #5: focusing the input immediately (the old
  // `requestAnimationFrame` here) drove `m3e-search-view` into its
  // docked-open state — which promotes its internal `.view` to a top-layer
  // popover (search.js `_openDocked`, `view.popover = "manual"` +
  // `showPopover()`) positioned via a ONE-TIME snapshot of the trigger
  // icon's `getBoundingClientRect()` — WHILE the modal `m3e-bottom-sheet`
  // was still mid-transform on its own opening transition. That snapshot
  // going stale mid-animation is exactly the reported "moves inconsistently
  // as the sheet animates open" defect (verified live: the popover's
  // computed `top`/`left` froze at the pre-transition anchor position, so
  // the promoted search bar visibly detached from the animating sheet).
  useEffect(() => {
    if (open) {
      setMode(DEFAULT_MODE);
      setModePickerOpen(false);
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

  // Two upstream `m3e-search-view` shadow-DOM behaviors have no supported
  // attribute/CSS-part escape hatch (verified against decompiled
  // node_modules/@m3e/web/dist/search.js — no `part=` anywhere in its
  // template, so neither `::part()` nor a CSS custom property can reach
  // either node from our light DOM):
  //
  // 1. Feedback #2 ("remove the back-arrow"): whenever the view's internal
  //    `open` state is true, `_renderIconOrBackButton` unconditionally
  //    swaps the leading search icon for a back-arrow `m3e-icon-button.close`
  //    (search.js:510-513) — there's no attribute (`hide-search-icon` only
  //    suppresses the icon while *closed*, search.js:511) to keep it off
  //    while open. Our own mode icon (`modeTrigger` below) already
  //    communicates + drives search/open/run, so the redundant back-arrow is
  //    hidden directly in the shadow tree.
  // 2. Feedback #5 ("search bar position: static"): docked mode promotes the
  //    view to a native top-layer popover (`view.popover = "manual"` +
  //    `showPopover()`, search.js:665/752/771) so it can escape the sheet's
  //    own stacking context — but the UA popover stylesheet's implicit
  //    `position: fixed` is exactly what let the bar visually detach from
  //    the modal `m3e-bottom-sheet`'s own open/close transform, drifting
  //    inconsistently instead of moving with the sheet. Forcing the
  //    shadow `.view` back to `position: static` keeps it in normal flow
  //    inside the sheet regardless of the popover promotion.
  //
  // Re-run on every `toggle` (search.js dispatches this after the view's
  // open state actually changes, search/SearchViewElement.ts's `@fires
  // toggle`) so the fix survives lit's per-open/close re-render of this
  // subtree, not just the initial mount.
  useEffect(() => {
    const el = searchViewRef.current;
    if (!el) {
      return;
    }
    function applyFixes() {
      const root = (el as HTMLElement).shadowRoot;
      if (!root) {
        return;
      }
      const backButton = root.querySelector<HTMLElement>(".icon .close");
      if (backButton) {
        backButton.style.display = "none";
      }
      const view = root.querySelector<HTMLElement>(".view");
      if (view) {
        view.style.position = "static";
      }
    }
    applyFixes();
    el.addEventListener("toggle", applyFixes);
    return () => el.removeEventListener("toggle", applyFixes);
  }, []);

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

  // Same trigger in both the search-view's open-leading and closed-leading
  // slots: the view renders exactly one of them at a time depending on its
  // own internal open state (decompiled dist/search.js:482 —
  // `${this.open ? <slot open-leading> : <slot closed-leading>}`), so the
  // mode trigger has to appear in both to stay visible across that toggle.
  // Clicking it toggles the `m3e-list` mode picker rendered below (feedback
  // #1), not an `m3e-menu` popup.
  const modeTrigger = () => (
    <m3e-icon-button
      title="Change search mode"
      aria-label="Change search mode"
      onClick={() => setModePickerOpen((v) => !v)}
    >
      <m3e-icon name={MODE_ICON[mode]}></m3e-icon>
    </m3e-icon-button>
  );

  return (
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
      {/* `open` attribute deliberately NOT set on m3e-search-view: decompiled
          dist/search.js drives its own open state off input focus/blur/Escape,
          and a controlled `open` prop fights that state machine (verified note
          carried from the deleted nav_views/recent.tsx). The slotted m3e-list
          below renders regardless of that internal open state. */}
      <m3e-search-view
        ref={searchViewRef}
        mode="docked"
        contained
        class="sb-search-sheet-view"
      >
        <span slot="closed-leading">{modeTrigger()}</span>
        <span slot="open-leading">{modeTrigger()}</span>
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
              // Escape backs out of the mode picker first (if it's open)
              // rather than closing the whole sheet underneath it.
              if (modePickerOpen) {
                setModePickerOpen(false);
                refocus();
              } else {
                onClose();
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((i) => Math.min(visible.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((i) => Math.max(0, i - 1));
            }
          }}
        />
        {/* Mode picker (feedback #1): an `m3e-list` of `m3e-list-item`s, not
            a floating `m3e-menu`/dropdown. Rendered in the same results slot
            the history/results list uses below — toggled by `modeTrigger`'s
            click, closed again by picking a mode. This sidesteps the
            InertController hit-test hazard V12 found for a floating popup
            menu nested here (see that fix's git history): it's normal
            slotted content, not a top-layer popover, so it was never at
            risk of being inerted by `m3e-search-view`'s own docked-open
            lock in the first place. */}
        {modePickerOpen
          ? (
            <m3e-list class="sb-search-sheet-mode-list" tabIndex={-1}>
              {MODE_ORDER.map((m) => (
                <m3e-list-item
                  key={m}
                  class={m === mode ? "sb-option sb-selected-option" : "sb-option"}
                  onClick={() => {
                    setMode(m);
                    setModePickerOpen(false);
                    refocus();
                  }}
                >
                  <m3e-icon slot="leading" name={MODE_ICON[m]}></m3e-icon>
                  {MODE_LABEL[m]}
                  {m === mode && (
                    <m3e-icon slot="trailing" name="check"></m3e-icon>
                  )}
                </m3e-list-item>
              ))}
            </m3e-list>
          )
          : visible.length === 0
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
      </m3e-search-view>
    </m3e-bottom-sheet>
  );
}
