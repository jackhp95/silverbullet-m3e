// Vertical floating toolbar, bottom-right — spec
// docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md §2.1
// (V4 leaf), wired live by CS-6
// (docs/plans/2026-09-24-core-shell-decomposition.md §3 CS-6 row, decision
// D3 §5). Resurrects-and-rewrites the pre-nav-bar `floating_toolbar.tsx`
// (`git show 39d96047~1:client/components/floating_toolbar.tsx`). Unlike
// `m3e-nav-bar`, `m3e-toolbar` has no selection-manager concept (verified
// against node_modules/@m3e/web/dist/custom-elements.json: no `selected`
// attribute, no `beforeinput`/`change` events) — every button below is a
// plain, stateless `onClick` icon-button.
//
// D3 dropped the fork's Navigation and Notifications buttons (main has no
// dead sheet for Navigation to open, and Notifications duplicates
// `.sb-notifications`'s own overlay) — Search and Journal only, shown on
// every viewport. Search delegates to main's own page picker
// (`client.startPageNavigate("page")`, the `NavRoot` UI), not the fork's
// dead search sheet. Journal runs the "Journal: Today" Std command; the
// caller guards `journal.available` on whether that command is currently
// registered (a space can disable the Journal plug), same pattern main's
// own read-only toggle uses for "Editor: Toggle Read Only Mode"
// (client/editor_ui.tsx).
//
// The three `@m3e/web/{toolbar,icon-button,icon}` side-effect imports moved
// to `client/editor_ui.tsx`'s registration block — this file has a vitest
// sibling (`floating_toolbar.test.ts`) and must stay `@m3e/web`-free (see
// `scripts/reconcile/builder-common.md` hazard 1).
//
// Icon provenance (client/fonts/MaterialSymbolsOutlined.woff2, decompiled
// via fontTools `ttx`, same method top_bar.tsx used for "asterisk"):
// "search" and "edit_calendar" are already proven live elsewhere in this
// fork.

export function FloatingToolbar({
  onSearchClick,
  journal,
}: {
  onSearchClick: () => void;
  journal: { available: boolean; onClick: () => void };
}) {
  return (
    <m3e-toolbar
      vertical
      shape="rounded"
      elevated
      className="sb-floating-toolbar"
      aria-label="Toolbar"
    >
      <m3e-icon-button
        title="Search"
        aria-label="Search"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          onSearchClick();
        }}
      >
        <m3e-icon name="search"></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button
        title="Journal"
        aria-label="Journal"
        disabled-interactive={!journal.available}
        onClick={journal.available
          ? (e: MouseEvent) => {
            e.preventDefault();
            journal.onClick();
          }
          : undefined}
      >
        <m3e-icon name="edit_calendar"></m3e-icon>
      </m3e-icon-button>
    </m3e-toolbar>
  );
}
