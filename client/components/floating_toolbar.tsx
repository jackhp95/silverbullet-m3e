import "@m3e/web/toolbar";
import "@m3e/web/icon-button";
import "@m3e/web/icon";

// Vertical floating toolbar, bottom-right — spec
// docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md §2.1
// (V4 leaf). Resurrects-and-rewrites the pre-nav-bar `floating_toolbar.tsx`
// (`git show 39d96047~1:client/components/floating_toolbar.tsx`). Unlike
// `m3e-nav-bar`, `m3e-toolbar` has no selection-manager concept (verified
// against node_modules/@m3e/web/dist/custom-elements.json: no `selected`
// attribute, no `beforeinput`/`change` events) — every button below is a
// plain, stateless `onClick` icon-button, no Preact-controlled `selected`
// state, no cancel dance for Journal.
//
// Icon provenance (client/fonts/MaterialSymbolsOutlined.woff2, decompiled
// via fontTools `ttx`, same method top_bar.tsx used for "asterisk"):
// "search" and "edit_calendar" are already proven live elsewhere in this
// fork. "explore" (Navigation) was unverified per spec §2.1 and has now been
// confirmed present in the bundled subset — GlyphID id="354" name="explore",
// hmtx entry, cmap `<map code="0xe87a" name="explore"/>` in all 4 cmap
// subtables, a real `TTGlyph` outline, and a `post` table `psName` entry.
// No fallback (`map`/`alt_route`) is needed. Notifications' icon is not
// hardcoded — it's `notifications.iconName`, resolved by the caller via
// `notificationsIconFor()` (client/lib/push_ui.ts).
//
// NOT wired into the live app in this leaf — `editor_ui.tsx` doesn't render
// this component yet (that's V8, a later, separate leaf/worktree).

export function FloatingToolbar({
  onSearchClick,
  onNavigationClick,
  journal,
  notifications,
}: {
  onSearchClick: () => void;
  onNavigationClick: () => void;
  journal: { available: boolean; onClick: () => void };
  notifications: { iconName: string; onClick: () => void };
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
        title="Navigation"
        aria-label="Navigation"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          onNavigationClick();
        }}
      >
        <m3e-icon name="explore"></m3e-icon>
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
      <m3e-icon-button
        title="Notifications"
        aria-label="Notifications"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          notifications.onClick();
        }}
      >
        <m3e-icon name={notifications.iconName}></m3e-icon>
      </m3e-icon-button>
    </m3e-toolbar>
  );
}
