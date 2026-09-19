import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet"; // registers m3e-bottom-sheet
import "@m3e/web/search"; // registers m3e-search-bar (+ m3e-search-view)
import "@m3e/web/list"; // registers m3e-list / m3e-list-item
import "@m3e/web/menu"; // registers m3e-menu / m3e-menu-item-radio / m3e-menu-trigger
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
// `m3e-bottom-sheet` hosting, as direct children: a title in `slot="header"`
// naming the active mode, an `m3e-search-bar` (with an `Input` in its
// `slot="input"` and the mode-picker icon button in its `slot="leading"`), an
// `m3e-list` of `NavListRow`s, and the `m3e-menu` that picker opens:
// query-empty renders per-mode history, a typed query renders per-mode live
// results. THE WHOLE POINT of the redesign is that RESULTS live inside the
// sheet — there is NO `m3e-autocomplete`/result-dropdown anywhere in this
// composition (that was the exact defect class prior attempts shipped, §1.4).
// The mode MENU is not that defect and not an exception to it: it is a
// three-item mode picker that the user opens deliberately, never an
// auto-opening list of search results.
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
// The mode picker is the search bar's LEADING ICON BUTTON, which opens a real
// `m3e-menu` of the three modes (Jack's round-3 direction, reversing round 2's
// floating bottom toolbar — that toolbar idiom moved to `navigation_sheet.tsx`,
// where it replaced tabs, which is what it was actually wanted for).
//
// Why the real `m3e-menu` works now, where V6/V12's attempt did not: back then
// the bar was `m3e-search-view mode="docked"`, whose InertController marks its
// whole subtree inert while docked-open, so a nested menu was unclickable and
// prior rounds reached for a `popover="auto"` `m3e-list` hack instead. The
// search-view is gone (replaced by `m3e-search-bar`, which has no state machine
// and no inerting), so the semantically-correct component is available again
// and the hack is deleted rather than carried.
//
// Composition, verified against the decompiled
// node_modules/@m3e/web/dist/menu.js rather than assumed:
//   * `M3eMenuTriggerElement` extends `ActionElementBase`, whose
//     `connectedCallback` binds its click handler to `this.parentElement` — NOT
//     to itself. An EMPTY `<m3e-menu-trigger>` nested in the icon-button
//     therefore makes the whole button the trigger, and `_onClick` calls
//     `menu.toggle(this.parentElement)`, anchoring the menu to the button.
//   * That empty-trigger form matters: the trigger renders `<slot>`, so an
//     `<m3e-icon>` placed INSIDE it would be a grandchild of the icon-button
//     and would never be assigned to the button's own default slot. The icon is
//     a separate direct child of the button for that reason.
//   * `attach()` sets `aria-haspopup="menu"` / `aria-expanded` / `aria-controls`
//     on the parent button for us — no hand-rolled ARIA here.
//   * The menu promotes itself to the top layer via the native popover API
//     (`showPopover`, dist/menu.js:608), so it is nested inside the sheet —
//     a sibling would be inerted by the modal sheet's own scrim/inert handling,
//     while a top-layer popover is unaffected by being nested.
//
// The ACTIVE mode is shown two ways, neither of them a check-mark-only
// affordance: the sheet's own `slot="header"` title (Search/Open/Run) and the
// leading button's icon, which is the active mode's icon. Inside the menu,
// `m3e-menu-item-radio checked` carries the selection semantically — these are
// mutually exclusive modes, which is exactly what the radio item variant is
// for.

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
  //
  // Re-verified live (Playwright, against the running app): the blame here is
  // PREACT's property branch, not Lit's converter. An imperative
  // `el.setAttribute("detents", "half full")` on the live element yields a
  // real `["half", "full"]` array — Lit's attribute-to-array converter works
  // fine. It is only the JSX route that never reaches it. So either
  // imperative form is correct; the direct array assignment below is kept as
  // the more direct of the two.
  //
  // MULTI-DETENT (Jack's feedback: "stuck at half height, can't drag"). The
  // root cause was NOT a missing `handle` — `handle` is forced below and the
  // shadow root really does render `#handle[role=button]` — it was that a
  // ONE-entry `detents` array gives the drag gesture nowhere to land: the
  // component snaps to the nearest detent on release, and with a single
  // detent the nearest is always the one you started on, so the sheet
  // rubber-bands straight back and reads as immovable.
  //
  // `["half", "full"]` rather than the docs' `fit half full`: index 0 must
  // stay `half`, because opening at ~50vh (leaving content visible behind the
  // sheet) is the explicit requirement from feedback #3.
  //
  // `fit` is deliberately omitted, and this was RE-TESTED live rather than
  // re-reasoned (2026-09-19). Measured at 390x844 with the real page open, a
  // real query typed, and the component's own cycle() driven directly:
  //
  //   detents ["fit","half","full"], query "e" (a result list, content
  //   scrollHeight 428px, header 68px):
  //     fit  = 504px   <- header + content + body padding
  //     half = 386px   <- maxHeight(772) * 0.5
  //     full = 772px
  //   tap sequence on the drag handle: 504 -> 386 -> 772
  //
  // So the FIRST tap on the handle SHRINKS the sheet by 118px. That is not a
  // "snap to nearest" problem — #getClosestDetent() in BottomSheetElement.ts
  // picks by absolute height distance and is genuinely order-independent, so
  // the original note was wrong about the mechanism. The real order-dependent
  // surface is cycle(), which is strictly INDEX ordered
  // (`if (activeDetent < detents.length - 1) activeDetent++`), so a
  // non-monotonic array makes tap-to-cycle move the sheet the wrong way. With
  // an empty result list fit is 204px and the order is fine (204 -> 386 ->
  // 772) — which is exactly the problem: the ordering flips based on how many
  // results the query happens to return.
  //
  // Adding `fit` also has a second, non-obvious effect: #computeMinHeight()
  // returns the FIT height whenever "fit" is present and "collapsed" is not,
  // so `fit` would also raise the sheet's minimum drag height and its
  // hideable threshold in proportion to the result count.
  //
  // Verdict: the concern was real, not overcautious. Two monotonic, distinct
  // detents stay.
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
      // Feedback #3: OPEN the sheet at ~50vh instead of full height, leaving
      // visible content behind it — `half` is detent index 0, and the user
      // can still drag the handle up to `full`.
      // `detents=["half", "full"]` (assigned via the ref
      // effect above, NOT this JSX attribute — see that effect's comment)
      // is the component's own supported sizing lever (not custom CSS) —
      // decompiled node_modules/@m3e/web/dist/bottom-sheet.js's
      // `_computeDetentHeight("half")` resolves to exactly
      // `_computeMaxHeight() * 0.5`, i.e. 50% of the viewport height minus
      // the sheet's own top inset, so it tracks real viewport height instead
      // of a hardcoded `50vh` that would drift from the component's own
      // metrics.
    >
      {/* The sheet's own `slot="header"` title is the always-visible
          active-mode indicator: picking a mode in the leading button's menu
          retitles the sheet Search/Open/Run, so the current mode is legible
          without reopening the menu. The header region is gated behind the
          sheet's `[handle]` CSS attribute selector, which the ref effect above
          already forces on. */}
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
        {/* Mode picker. The bar has no built-in leading icon of its own (that
            was the search-VIEW's), so this slot is entirely ours — there is no
            second, built-in magnifier to sit beside and no dead space (the old
            `slot="closed-leading"`/`slot="open-leading"` wrapper spans that
            caused feedback #4 are gone with the search-view).

            The empty `m3e-menu-trigger` is deliberate, not a stub: it binds to
            its PARENT for clicks and anchoring — see the mode-model comment at
            the top of this file for the decompiled-source justification of this
            exact shape. The icon is a sibling of the trigger so that it lands
            in the icon-button's default slot. */}
        <m3e-icon-button
          slot="leading"
          title="Change search mode"
          aria-label="Change search mode"
        >
          <m3e-menu-trigger for="sb-search-sheet-mode-menu">
          </m3e-menu-trigger>
          <m3e-icon name={MODE_ICON[mode]}></m3e-icon>
        </m3e-icon-button>
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
              // Escape here always closes the sheet, matching the sheet's own
              // `cancel` event.
              //
              // MEASURED, not assumed: with the mode menu open, one Escape
              // closes BOTH the menu and the sheet (live-checked at 1280x900
              // and 390x844 — the menu's native-popover light-dismiss and the
              // modal sheet's own `cancel` both fire for the same keypress).
              // Left as-is deliberately: Escape-closes-everything is the
              // behavior the sheet already had, no keystroke is swallowed, and
              // suppressing the sheet's `cancel` for one frame after a menu
              // dismiss would mean racing two components' internal event
              // ordering to buy a distinction nobody asked for. Noted here so
              // the next reader doesn't rediscover it as a bug.
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
      {/* The mode menu itself, opened by the search bar's leading icon button
          above. Nested inside the sheet on purpose (the modal sheet inerts
          content outside itself; a top-layer popover is unaffected by being
          nested) — see the mode-model comment at the top of this file.

          `m3e-menu-item-radio` rather than plain `m3e-menu-item`: the three
          modes are mutually exclusive, so the radio variant is the component
          that carries that meaning (and the matching `role="menuitemradio"` +
          `aria-checked`) instead of us painting a check column by hand.
          `checked` is driven off our own `mode` state, which is the single
          source of truth — the menu is a view of it, never the owner. */}
      <m3e-menu id="sb-search-sheet-mode-menu">
        {MODE_ORDER.map((m) => (
          <m3e-menu-item-radio
            key={m}
            checked={m === mode}
            onClick={() => {
              setMode(m);
              refocus();
            }}
          >
            <m3e-icon slot="icon" name={MODE_ICON[m]}></m3e-icon>
            {MODE_LABEL[m]}
          </m3e-menu-item-radio>
        ))}
      </m3e-menu>
    </m3e-bottom-sheet>
    </>
  );
}
