import "@m3e/web/toolbar";
import "@m3e/web/icon-button";
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";

// Floating vertical toolbar, bottom-right of the page. Real @m3e/web
// `m3e-toolbar` component (verified from source:
// node_modules/@m3e/web/dist/src/toolbar/ToolbarElement.d.ts, v2.7.12), used
// exactly per its own doc example: a `vertical`, `elevated`,
// `shape="rounded"` toolbar of `m3e-icon-button`s, with one filled
// icon-button reused as the primary/"add" action.
//
// `m3e-toolbar` is a layout/appearance primitive only — it has no built-in
// fixed-position "floating" behavior of its own; `.sb-floating-toolbar` in
// top.scss supplies the `position: fixed; right/bottom` placement.
//
// 2026-09-16 revision (spec §2 items 2+12, plan leaf L13 — the final leaf of
// today's toolbar/search-feedback batch): reduced to Jack's exact 4-item
// list — Journal, Add, Search, Read-only toggle. Everything else that used
// to live here is gone, not lost:
//  - CONFIG `actionButtons` (was `actions` prop, dynamic buttons) → now only
//    the app-bar's trailing kebab menu (top_bar.tsx's `sb-app-bar-menu`,
//    populated by editor_ui.tsx's `configMenuItems`, merged today's L8).
//  - the push/notifications bell (`pushToggle` prop) → same kebab, as its
//    `pushMenuItem` entry (editor_ui.tsx, also L8).
//  - the "Recently visited" history menu (`recentPages` prop, its own
//    `m3e-menu`) → subsumed by the new consolidated search_sheet.tsx's
//    "Open" mode, whose empty-query state IS `client.recentPaths` history
//    (see search_sheet.tsx's `RecentPathOption`/L12).
// "Search" here is new: it opens that same search_sheet.tsx (defaults to
// its "Open" mode on open, per the sheet's own mount effect), giving one
// button access to open/run/search instead of a dedicated picker trigger.
export function FloatingToolbar({
  journal,
  onNewClick,
  search,
  readOnlyToggle,
}: {
  journal: { iconName: string; label: string; onClick: () => void };
  onNewClick: () => void;
  search: { label: string; onClick: () => void };
  readOnlyToggle?: { active: boolean; label: string; onClick: () => void };
}) {
  return (
    <m3e-toolbar
      vertical
      shape="rounded"
      elevated
      className="sb-floating-toolbar"
      aria-label="Toolbar"
    >
      {readOnlyToggle && (
        <m3e-icon-button
          title={readOnlyToggle.label}
          aria-label={readOnlyToggle.label}
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            readOnlyToggle.onClick();
          }}
        >
          <m3e-icon name={readOnlyToggle.active ? "lock" : "lock_open"}>
          </m3e-icon>
        </m3e-icon-button>
      )}
      <m3e-icon-button
        title={search.label}
        aria-label={search.label}
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          search.onClick();
        }}
      >
        <m3e-icon name="search"></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button
        title={journal.label}
        aria-label={journal.label}
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          journal.onClick();
        }}
      >
        <m3e-icon name={journal.iconName}></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button
        variant="filled"
        title="New…"
        aria-label="New…"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          onNewClick();
        }}
      >
        <m3e-icon name="add"></m3e-icon>
      </m3e-icon-button>
    </m3e-toolbar>
  );
}
