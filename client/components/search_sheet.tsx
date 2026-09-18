import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { JSX as PreactJSX } from "preact";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet"; // registers m3e-bottom-sheet
import "@m3e/web/search"; // registers m3e-search-view (+ m3e-search-bar)
import "@m3e/web/list"; // registers m3e-list / m3e-list-item
import "@m3e/web/menu"; // m3e-menu / -trigger / -item-radio / -item-group
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
// redesign-spec.md §2.4, leaf V6). A modal `m3e-bottom-sheet` hosting one
// `m3e-search-view mode="docked" contained`, whose leading icon is an
// `m3e-menu-trigger` opening a 3-item mode menu (Search / Open / Run), an
// `Input` in `slot="input"`, and an `m3e-list` of `NavListRow`s below it:
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

// --- m3e JSX typing (scoped to this leaf) --------------------------------
//
// `m3e-menu-item-radio` / `m3e-menu-item-group` are not declared in the
// shared client/components/m3e-jsx.d.ts. That file is V1/V2-owned and leaf
// V7 also augments the same m3e-* JSX surface (for m3e-tabs); editing it from
// here would collide. Instead, declaration-merge the two tags this leaf needs
// into the same Preact `JSX.IntrinsicElements` interface from this file, so
// the change stays inside V6's owned file.
//
// `checked` is a real reflected property (the `Checked` mixin in
// node_modules/@m3e/web/dist/menu.js) that Preact assigns as a DOM property
// on the already-registered custom element. Exclusivity IS self-managed by
// the component (decompiled dist/menu.js: M3eMenuItemRadioElement's `updated`
// clears sibling radios in its group/menu when one becomes `checked`), but
// per spec §1.1 we still drive `checked` as a Preact-controlled prop off local
// `mode` state — our state is the source of truth and the component's own
// exclusivity merely agrees with it. `m3e-menu-item-radio` dispatches ONLY
// `click` (no `change`/`input` — verified against
// node_modules/@m3e/web/dist/custom-elements.json AND the decompiled
// dist/menu.js), so the mode switch is wired via `onClick`; `click` is a
// native GlobalEventHandlers event, so camelCase `onClick` (already provided
// by PreactJSX.HTMLAttributes) resolves correctly. Clicking a radio also
// auto-closes the menu (menu.js `_handleClick` → `this.menu?.hideAll(true)`),
// so the handler only needs to set `mode`.
type M3eMenuItemRadioAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  checked?: boolean;
  disabled?: boolean;
};
type M3eMenuItemGroupAttributes = PreactJSX.HTMLAttributes<HTMLElement>;

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      "m3e-menu-item-radio": M3eMenuItemRadioAttributes;
      "m3e-menu-item-group": M3eMenuItemGroupAttributes;
    }
  }
}
declare module "preact/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "m3e-menu-item-radio": M3eMenuItemRadioAttributes;
      "m3e-menu-item-group": M3eMenuItemGroupAttributes;
    }
  }
}

// --- mode model (spec §2.4) ----------------------------------------------

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
  useEffect(() => {
    sheetRef.current?.setAttribute("handle", "");
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

  // Reset to the default mode + empty query and focus the input each time the
  // sheet opens. Resetting mode here (rather than persisting it) is the
  // documented §2.4 limitation, carried forward deliberately.
  useEffect(() => {
    if (open) {
      setMode(DEFAULT_MODE);
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
  // Both `m3e-menu-trigger`s share `for="sb-search-mode-menu"`; each resolves
  // the menu by id and toggles it anchored to its own parent icon-button
  // (dist/menu.js `_onClick` → `this.menu?.toggle(this.parentElement)`), so a
  // shared `for` is safe.
  const modeTrigger = () => (
    <m3e-icon-button
      title="Change search mode"
      aria-label="Change search mode"
    >
      <m3e-menu-trigger for="sb-search-mode-menu">
        <m3e-icon name={MODE_ICON[mode]}></m3e-icon>
      </m3e-menu-trigger>
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
    >
      {/* `open` attribute deliberately NOT set on m3e-search-view: decompiled
          dist/search.js drives its own open state off input focus/blur/Escape,
          and a controlled `open` prop fights that state machine (verified note
          carried from the deleted nav_views/recent.tsx). The slotted m3e-list
          below renders regardless of that internal open state. */}
      <m3e-search-view mode="docked" contained class="sb-search-sheet-view">
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
        {/* The mode menu MUST render as a DOM descendant of `m3e-search-view`,
            NOT as a sibling of it inside the sheet (leaf V12 — hit-test fix).
            Root cause, confirmed by decompile + a live browser hit-test probe:
            `m3e-search-view` owns its own `InertController` (decompiled
            node_modules/@m3e/web/dist/search.js:346), and its docked-open path
            (`_openDocked`, search.js:668-669) calls `inertController.lock()`.
            That `lock()` (core.js:1007) walks up from the search-view and marks
            EVERY SIBLING inert at each ancestor level. The sheet auto-focuses
            the input on open, which drives the docked view open, so the lock
            fires immediately — and while the menu was a sibling of
            `m3e-search-view` it was marked `inert`. An `inert` `popover=manual`
            menu (menu.js:544/608) still paints in the top layer (so a
            screenshot shows it "on top"), but is not hit-testable:
            `document.elementFromPoint` at a menu item resolved to `#sb-root`
            underneath, and even a `force:true` click was hit-tested onto the
            page below — exactly the V9 diagnostic. The non-modal app-bar kebab
            (`#sb-app-bar-menu`, top_bar.tsx) works precisely because it is NOT a
            sibling of any `m3e-search-view`, so nothing inerts it. Moving the
            menu OUT of the sheet entirely (into a sheet-sibling, the first
            hypothesis) is WORSE: the sheet is itself a `modal` popover whose own
            `InertController.lock()` then inerts it — verified in a live probe.
            The one region left non-inert by BOTH locks is the search-view's own
            subtree, so the menu lives here. Trigger↔menu are linked by
            `for`/`id`, not DOM adjacency (already relied on by the duplicate-
            trigger pattern above), so the physical nesting is free to change.
            The menu is a top-layer popover, so rendering it in the results slot
            has no visual effect — it anchors to its trigger. */}
        <m3e-menu id="sb-search-mode-menu" position-y="above">
          <m3e-menu-item-group>
            {MODE_ORDER.map((m) => (
              <m3e-menu-item-radio
                key={m}
                checked={mode === m}
                onClick={() => setMode(m)}
              >
                <m3e-icon slot="icon" name={MODE_ICON[m]}></m3e-icon>
                {MODE_LABEL[m]}
              </m3e-menu-item-radio>
            ))}
          </m3e-menu-item-group>
        </m3e-menu>
      </m3e-search-view>
    </m3e-bottom-sheet>
  );
}
