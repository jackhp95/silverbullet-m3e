// `Fragment` is imported explicitly (rather than written as `<>`) because each
// mode row emits TWO siblings — an optional divider plus the item — and the
// pair needs a stable `key`, which shorthand fragments cannot carry.
import { Fragment } from "preact";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet"; // registers m3e-bottom-sheet
import "@m3e/web/search"; // registers m3e-search-bar (+ m3e-search-view)
import "@m3e/web/list"; // registers m3e-list / m3e-list-item
import "@m3e/web/divider"; // registers m3e-divider (mode-picker row separators)
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
// `m3e-list` of `NavListRow`s, and the `m3e-list` mode picker that button
// opens:
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
// The mode picker is the search bar's LEADING ICON BUTTON, which opens an
// `m3e-list` of the three modes, its rows separated by `m3e-divider`s (Jack's
// round-4 direction, citing the component docs at
// https://matraic.github.io/m3e/#/components/list.html — explicitly a divided
// LIST, NOT the `m3e-menu` round 3 shipped and NOT the floating bottom toolbar
// round 2 shipped; that toolbar idiom lives on in `navigation_sheet.tsx`, where
// it replaced tabs, which is what it was actually wanted for).
//
// This is the third distinct attempt at this one interaction, so the two
// mechanical defects the earlier rounds hit are called out here by name, along
// with what structurally prevents each from recurring:
//
//  (1) The closed popup was VISIBLE. Round 1 rendered the list permanently and
//      toggled it with `popover="auto"`. `M3eListElement.styles` sets
//      `:host { display: flex }` (dist/list.js L362) — AUTHOR-origin CSS, which
//      outranks the UA popover stylesheet's `[popover]:not(:popover-open) {
//      display: none }`, so the closed popover rendered unpositioned at the top
//      of the flow. Round 1 patched that with a counter-rule in modals.scss.
//      Here the list is CONDITIONALLY RENDERED instead: while the picker is
//      closed the element does not exist, so there is no closed-state styling
//      to lose a cascade fight over and the counter-rule stays deleted.
//
//  (2) Clicks on the rows timed out in e2e. Round 1 blamed
//      `m3e-search-view`'s InertController; round 1's own follow-up disproved
//      that and blamed a second dialog in the fixture. Both are now moot: the
//      search-view is gone (replaced by the stateless `m3e-search-bar`), and
//      the popup is promoted to the TOP LAYER via the native popover API, so
//      nothing in the sheet or elsewhere in the document can cover it.
//
// Composition + a11y, verified against the decompiled
// node_modules/@m3e/web/dist/list.js (v2.7.12 — the version actually installed
// here), not assumed and not taken from the prose README:
//
//   * DIVIDERS ARE A FIRST-CLASS LIST CHILD. `M3eListElement.styles` maps
//     `--m3e-list-divider-inset-start-size` / `-end-size` onto the divider's own
//     `--m3e-divider-inset-*-size` on `:host` (L362), i.e. the list exists to
//     supply inset values to `m3e-divider` children. Dividers go BETWEEN rows
//     and never after the last one.
//
//   * PLAIN `m3e-list-item` IS NOT SELECTABLE, and this is the load-bearing
//     finding. `M3eListItemElement extends ReconnectedCallback(AttachInternals(
//     Role(LitElement, "listitem")))` (L106) — no `selected` property, no
//     `Focusable`, no `KeyboardClick`, and its `_renderBase()` emits only slots:
//     no `m3e-state-layer`, no `m3e-ripple`, no `m3e-focus-ring`. The natively
//     selectable form is the SUBCLASS pair `m3e-selection-list` /
//     `m3e-list-option` (`M3eListOptionElement extends KeyboardClick(Focusable(
//     Selected(Disabled(AttachInternals(Role(M3eListItemElement, "option"))))))`,
//     L933; `M3eSelectionListElement extends ... Role(M3eListElement, "listbox")`,
//     L1059), which would give single-select, roving focus and a radio indicator
//     for free. Jack asked for `m3e-list`/`m3e-list-item` by name, so this file
//     drives selection MANUALLY — the "picker built from a list" pattern — and
//     pays for it explicitly below (click + keydown handlers, roving tabindex,
//     `aria-selected`, and an active-row fill). That trade is deliberate and
//     documented rather than silently swapped for the subclass pair.
//
//   * OVERRIDING `role` IS SUPPORTED, NOT A HACK. The `Role` mixin is
//     `this.role = this.role || role` (dist/core.js L3971-3979) — the component
//     ships `list`/`listitem` as a DEFAULT that an author-set attribute wins
//     over. So `role="listbox"` + `role="option"` here is the component's own
//     documented opt-out, not an invented role bolted onto an element that
//     fights it. Those are also the roles the subclass pair sets, so the
//     accessibility tree is identical to the native pattern's.
//
//   * The active row's fill comes from `--m3e-list-item-container-color` (read
//     by `.base`'s `background-color`, L~200), routed through this repo's
//     existing `.sb-option`/`.sb-selected-option` modal tokens — the same
//     mechanism the results list already uses. No ad-hoc palette, no custom
//     Material surface.
//
// The ACTIVE mode is shown three ways: the sheet's own `slot="header"` title
// (Search/Open/Run), the leading button's icon, and — inside the open picker —
// the selected row's fill + trailing check + `aria-selected="true"`.

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
  // The mode picker's open state + the two elements the open effect needs: the
  // leading icon button it anchors to, and the popup list itself. The list is
  // conditionally rendered (see the mode-model comment's defect (1)), so
  // `modeListRef` is null whenever `modePickerOpen` is false.
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const modeTriggerRef = useRef<HTMLElement | null>(null);
  const modeListRef = useRef<HTMLElement | null>(null);

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
  //
  // ALSO listen for `closed` (found live, 2026-09-21, chasing the identical
  // defect that broke navigation_sheet.tsx's reopen-after-detent-close — see
  // that file's matching comment). `cancel` alone misses one real dismiss
  // path: tapping the drag handle to cycle detents. Decompiled
  // dist/bottom-sheet.js: `_handleDragHandleClick` -> `cycle()`, and once
  // `cycle()` is past the last detent its `hideable` branch calls
  // `this.hide()` DIRECTLY — no `cancel` event, cancelable or otherwise, is
  // ever dispatched on that path. `closed`, by contrast, is dispatched
  // unconditionally by `updated()` whenever `open` flips to false, whether
  // that came from `cancel`-triggered `hide()`, `cycle()`-triggered `hide()`,
  // or a direct `hide()` call — so it's the one event that can't miss a
  // dismiss path. Without it, closing via the drag handle left
  // `searchSheetOpen` stuck `true` (this sheet's `cancel`-only listener never
  // fired), so the search icon couldn't reopen it until a full page refresh —
  // same symptom, same fix shape, as navigation_sheet.tsx.
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

  // Never leave the mode picker open across a sheet close/reopen — the sheet
  // resets mode and query on open, so a stale open popup would be showing a
  // selection that no longer matches.
  useEffect(() => {
    if (!open) {
      setModePickerOpen(false);
    }
  }, [open]);

  // Opening the mode picker: position it under the leading icon button, promote
  // it to the top layer, and move focus into the active row.
  //
  // `useLayoutEffect`, not `useEffect`, and the top/left are written
  // IMPERATIVELY rather than being routed through render state: the list is
  // conditionally rendered, so it mounts unpositioned, and positioning it in a
  // committed-but-pre-paint phase is what keeps the user from seeing one frame
  // of the popup at the document origin. (A `pickerPos` state round-trip would
  // guarantee that frame.) Everything except `top`/`left` is in modals.scss —
  // only the trigger-dependent numbers are set here.
  //
  // `popover="auto"` gives light-dismiss (outside click + Escape) and top-layer
  // promotion from the platform. The `toggle` event is the only reliable signal
  // for a light-dismiss, since it bypasses our own handlers entirely — sync
  // `modePickerOpen` off it so the trigger's `aria-expanded` cannot drift from
  // the popup's real state.
  useLayoutEffect(() => {
    const listEl = modeListRef.current;
    if (!modePickerOpen || !listEl) {
      return;
    }
    const handleToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") {
        setModePickerOpen(false);
      }
    };
    listEl.addEventListener("toggle", handleToggle);
    // Shown BEFORE measuring, deliberately: the popup must be in its final
    // (top-layer) state for `offsetWidth`/`offsetHeight` to be trustworthy.
    // Both steps are inside this one layout effect, so no paint happens
    // between them and the user never sees the pre-positioned frame.
    //
    // Feature-detected rather than assumed: without popover support the list
    // still renders and still works as a fixed-position picker, just without
    // top-layer promotion or free light-dismiss.
    if (listEl.hasAttribute("popover")) {
      (listEl as unknown as { showPopover: () => void }).showPopover();
    }
    // Anchor under the trigger, then CLAMP into the viewport. The clamp is not
    // hypothetical: at 390x664 (iPhone 13, sheet open) the unclamped popup ran
    // ~6px past the bottom edge and cut the "Run" row off. A plain clamp rather
    // than a flip-above, because the popup is short enough to always fit once
    // clamped, and clamping keeps it adjacent to its trigger instead of jumping
    // to the other side of it.
    //
    // Placement runs on every SIZE CHANGE, not on a guessed delay. The popup's
    // height is not knowable synchronously here: its `m3e-list-item` children
    // are custom elements that upgrade and render (Lit, asynchronously) after
    // this effect, so an immediate measurement reads 0 and the clamp silently
    // no-ops. That was live-measured twice — the mobile overflow survived both
    // a synchronous clamp and a one-frame-deferred clamp, because neither
    // frame had the real height yet.
    //
    // A ResizeObserver removes the guess entirely: whatever frame the rows
    // actually land in is the frame that re-places the popup. The synchronous
    // call below still runs first so the popup is never painted at the
    // document origin.
    const place = () => {
      const trigger = modeTriggerRef.current;
      if (!trigger) {
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const gap = 4;
      const margin = 8;
      const { offsetWidth: w, offsetHeight: h } = listEl;
      listEl.style.top = `${
        Math.max(
          margin,
          Math.min(rect.bottom + gap, globalThis.innerHeight - h - margin),
        )
      }px`;
      listEl.style.left = `${
        Math.max(
          margin,
          Math.min(rect.left, globalThis.innerWidth - w - margin),
        )
      }px`;
    };
    place();
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(listEl);
    // Focus the active row so the picker is immediately keyboard-operable.
    // `m3e-list-item` is not focusable on its own (it has no `Focusable`
    // mixin — see the mode-model comment), which is exactly why the rows carry
    // an explicit roving `tabindex` in the render below.
    //
    // Deferred by one frame, and that is LOAD-BEARING rather than defensive:
    // focusing synchronously here was live-measured as a no-op (focus stayed on
    // the trigger icon-button, so arrow keys did nothing and Enter merely
    // re-toggled the trigger), because the click that opened the picker is
    // still settling focus onto that button. A one-frame defer lands after it —
    // the same rAF pattern `refocus()` already uses to hand focus back to the
    // input.
    const focusFrame = requestAnimationFrame(() => {
      listEl.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    });
    return () => {
      cancelAnimationFrame(focusFrame);
      resizeObserver.disconnect();
      listEl.removeEventListener("toggle", handleToggle);
    };
  }, [modePickerOpen]);


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

  // Picking a mode is one operation with three parts, so it lives in one place
  // rather than being repeated across the rows' click and keydown handlers:
  // set the mode (which retitles the sheet and re-placeholders the input),
  // close the picker, and hand focus back to the query input.
  function selectMode(m: SearchMode) {
    setMode(m);
    setModePickerOpen(false);
    refocus();
  }

  // Roving-focus keyboard nav for the mode picker. This is hand-written
  // because plain `m3e-list-item` ships no `KeyboardClick`/`Focusable` mixin —
  // the documented cost of building the picker from `m3e-list`/`m3e-list-item`
  // rather than the natively-selectable `m3e-selection-list`/`m3e-list-option`
  // subclass pair (see the mode-model comment at the top of this file).
  // Escape is deliberately NOT handled here: `popover="auto"`'s own
  // light-dismiss already closes the popup on Escape, and the `toggle`
  // listener syncs our state off that.
  function onModeListKeyDown(e: KeyboardEvent) {
    const delta = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (delta !== 0) {
      e.preventDefault();
      const rows = Array.from(
        modeListRef.current?.querySelectorAll<HTMLElement>("m3e-list-item") ??
          [],
      );
      const from = rows.indexOf(e.target as HTMLElement);
      // Wraps at both ends, matching the listbox pattern the roles declare.
      rows[(from + delta + rows.length) % rows.length]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const m = (e.target as HTMLElement).dataset.mode as SearchMode | undefined;
      if (m) {
        selectMode(m);
      }
    }
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

            The button shows the ACTIVE mode's icon, so the picker announces the
            current mode without being opened.

            The ARIA is set here rather than being inherited from a component:
            round 3's `m3e-menu-trigger` set `aria-haspopup`/`aria-expanded`/
            `aria-controls` on its parent for us, but a hand-driven list popup
            has no such helper. These three are the standard attributes for
            "button that opens a listbox" — `haspopup="listbox"` matches the
            `role="listbox"` actually on the popup below, so the two agree. */}
        <m3e-icon-button
          slot="leading"
          ref={(el: HTMLElement | null) => {
            modeTriggerRef.current = el;
          }}
          title="Change search mode"
          aria-label="Change search mode"
          aria-haspopup="listbox"
          aria-expanded={modePickerOpen ? "true" : "false"}
          aria-controls="sb-search-sheet-mode-list"
          onClick={() => setModePickerOpen((v) => !v)}
        >
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
              // MEASURED, not assumed, and RE-measured for the m3e-list
              // picker that replaced the menu: with the picker open, one
              // Escape closes BOTH the picker and the sheet (the picker's
              // `popover="auto"` light-dismiss and the modal sheet's own
              // `cancel` both fire for the same keypress). e2e/search-sheet
              // .test.ts asserts this explicitly so it stays a known, chosen
              // behavior rather than a surprise.
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
      {/* The mode picker: an `m3e-list` of `m3e-list-item`s separated by
          `m3e-divider`s, opened by the search bar's leading icon button above.
          Nested inside the sheet on purpose (the modal sheet inerts content
          outside itself; a top-layer popover is unaffected by being nested).

          Rendered ONLY while open — that is what structurally prevents round
          1's "closed popup is visible" defect, since `m3e-list`'s own
          `:host { display: flex }` can no longer out-cascade the UA popover
          stylesheet's closed-state `display: none` for an element that does not
          exist. See the mode-model comment at the top of this file.

          `role`/`aria-selected` are set explicitly: they are the `Role` mixin's
          documented author override (`this.role || role`), and they are the
          same roles `m3e-selection-list`/`m3e-list-option` would have set, so
          the accessibility tree matches the native selectable pattern even
          though the selection itself is driven by us. */}
      {modePickerOpen && (
        <m3e-list
          id="sb-search-sheet-mode-list"
          ref={modeListRef}
          popover="auto"
          role="listbox"
          aria-label="Search mode"
          class="sb-search-sheet-mode-list"
          onKeyDown={onModeListKeyDown}
        >
          {MODE_ORDER.map((m, i) => (
            <Fragment key={m}>
              {/* BETWEEN rows only — never after the last one. `inset-start`
                  aligns the rule with the row labels rather than the icons,
                  using the inset size `m3e-list` itself feeds the divider. */}
              {i > 0 && <m3e-divider inset-start></m3e-divider>}
              <m3e-list-item
                role="option"
                aria-selected={m === mode ? "true" : "false"}
                data-mode={m}
                // Roving tabindex: only the active row is in the tab order, and
                // the open effect focuses it. Arrow keys move between rows.
                tabIndex={m === mode ? 0 : -1}
                class={m === mode
                  ? "sb-option sb-selected-option"
                  : "sb-option"}
                onClick={() => selectMode(m)}
              >
                <m3e-icon slot="leading" name={MODE_ICON[m]}></m3e-icon>
                {MODE_LABEL[m]}
                {m === mode && (
                  <m3e-icon slot="trailing" name="check"></m3e-icon>
                )}
              </m3e-list-item>
            </Fragment>
          ))}
        </m3e-list>
      )}
    </m3e-bottom-sheet>
    </>
  );
}
