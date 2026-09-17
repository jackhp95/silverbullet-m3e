import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/search"; // registers m3e-search-view (see filter.tsx's own import)
import "@m3e/web/list";
import "../m3e-jsx.d.ts";

import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import { fuzzySearchAndSort } from "../../lib/fuzzy_search.ts";
import type { Command } from "../../types/command.ts";
import {
  buildCommandPaletteOptions,
  commandFromOption,
  triggerCommand,
} from "../command_palette.tsx";

// Run destination panel (2026-09-17 nav-bar redesign spec §5, leaf N8) —
// relocates search_sheet.tsx's "run" mode (READ-ONLY reference, not edited)
// onto its own m3e-nav-bar destination. `buildCommandPaletteOptions`,
// `commandFromOption`, `triggerCommand` and `keyboardHint` (baked into
// `buildCommandPaletteOptions`'s own `hint` field) all come verbatim from
// command_palette.tsx (spec §4.3) — nothing about "what does running a
// command do" or "how are options built/sorted" is re-derived here.
//
// `<m3e-search-view mode="docked" contained>` + plain `<input slot="input">`
// + slotted `m3e-list` is the component's own documented shape (spec §2.1),
// verified against node_modules/@m3e/web/dist/custom-elements.json
// (attributes: contained/mode/open; slots: (default)/input). `filter.tsx` is
// this codebase's only other m3e-search-view consumer and is READ-ONLY here
// — its `<Input bare slot="input">` convention (plain <input>, no
// m3e-form-field wrapper — the slot contract demands a bare <input>) is
// followed rather than re-derived.
export function RunView({
  commands,
  onClose,
}: {
  commands: Map<string, Command>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // search_sheet.tsx's run-mode history was always fresh because its ONE
  // shared entry point (client.startSearchSheet()) awaited
  // `commandAugmenter.augmentObjectMap` before ever rendering the sheet —
  // same pattern client.ts's `startCommandPalette()` uses for the standalone
  // CommandPalette modal. The nav bar's Run destination has no equivalent
  // open-time chokepoint (its `m3e-nav-item` dispatches
  // `select-nav-destination` directly from editor_ui.tsx, which this leaf
  // must not touch beyond the panel-host wiring), so this view re-runs the
  // same augmentation itself on every mount (i.e. every time the panel
  // opens) via the same `client.commandAugmenter` instance — reusing it, not
  // reimplementing it. `augmentObjectMap` mutates the Command objects in
  // place (client/data/data_augmenter.ts), so bumping `refreshedAt` after it
  // resolves is what forces the memos below to recompute against the fresh
  // `lastRun` values.
  const [refreshedAt, setRefreshedAt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    client.commandAugmenter.augmentObjectMap(commands).then(() => {
      if (!cancelled) {
        setRefreshedAt(Date.now());
      }
    });
    return () => {
      cancelled = true;
    };
    // Intentionally mount-only: this view is only ever mounted while its
    // destination panel is open (editor_ui.tsx), so "on mount" already means
    // "every time the Run panel opens".
    // deno-lint-ignore react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery === "";

  // Typed query: fuzzy-matched over the same option list CommandPalette
  // builds (search_sheet.tsx's run-mode results, `:186-188`).
  const results: FilterOption[] = useMemo(() => {
    if (isEmpty) {
      return [];
    }
    return fuzzySearchAndSort(buildCommandPaletteOptions(commands), query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, query, commands, refreshedAt]);

  // Empty query: commands sorted by recency. `buildCommandPaletteOptions`'s
  // own `orderId` already encodes `-lastRun`, so an empty-query
  // `fuzzySearchAndSort` call just sorts by orderId for free — identical to
  // search_sheet.tsx's run-mode empty-state (`:242-248` there).
  const history: FilterOption[] = useMemo(() => {
    if (!isEmpty) {
      return [];
    }
    return fuzzySearchAndSort(buildCommandPaletteOptions(commands), "")
      .slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, commands, refreshedAt]);

  const visible = isEmpty ? history : results;

  function activate(opt: FilterOption | undefined) {
    // `triggerCommand`'s own doc comment: `close` runs first, matching the
    // original CommandPalette/search_sheet ordering — closing the nav panel
    // is this call site's `close`.
    triggerCommand(commandFromOption(opt, commands), onClose);
  }

  return (
    <m3e-search-view mode="docked" contained open class="sb-run-view">
      <Input
        bare
        slot="input"
        inputRef={inputRef}
        value={query}
        placeholder="Command"
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
          // Escape is deliberately not handled here — editor_ui.tsx already
          // attaches a document-level Escape listener while any nav
          // destination panel is open (N4) and dispatches `close-nav-panel`;
          // duplicating it here would just double-dispatch.
        }}
      />
      {visible.length === 0
        ? (
          <div class="sb-nav-panel-empty">
            {isEmpty ? "No commands run yet" : "No results"}
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
              </m3e-list-item>
            ))}
          </m3e-list>
        )}
    </m3e-search-view>
  );
}
