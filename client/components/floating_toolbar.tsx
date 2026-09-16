import type { FunctionalComponent } from "preact";
import "@m3e/web/toolbar";
import "@m3e/web/icon-button";
import "@m3e/web/menu";
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";

// One floating vertical toolbar, bottom-right of the page, replacing what
// used to be two separate entry points: the app-bar's kebab/overflow menu
// (client/components/top_bar.tsx's old OverflowMenu) and the FAB speed-dial
// (client/editor_ui.tsx's old <m3e-fab>/<m3e-fab-menu>). Real @m3e/web
// `m3e-toolbar` component (verified from source:
// node_modules/@m3e/web/dist/src/toolbar/ToolbarElement.d.ts, v2.7.12 — no
// stale-OKF guessing), used exactly per its own doc example: a `vertical`,
// `elevated`, `shape="rounded"` toolbar of `m3e-icon-button`s, with one
// filled icon-button reused as the primary/"add" action — its own example
// shows precisely this composition (a wide filled icon-button for "add"
// alongside plain icon-buttons), so the "New" trigger below isn't a novel
// pattern, it's the documented one.
//
// `m3e-toolbar` is a layout/appearance primitive only — it has no built-in
// fixed-position "floating" behavior of its own (per its doc: "supports
// vertical and horizontal orientation, shape and variant customization, and
// adaptive layout via CSS custom properties" — positioning is the app's job,
// same division of responsibility @m3e/web draws for m3e-fab, see the old
// `#sb-fab` CSS this replaces). `.sb-floating-toolbar` in top.scss supplies
// the `position: fixed; right/bottom` placement.
//
// 2026-09-15 revision: the "New" button used to open an `m3e-fab-menu`
// speed-dial (`sb-new-menu`, 5 `m3e-fab-menu-item`s) anchored at the
// toolbar's own bottom-right corner — the same screen corner the toolbar
// itself is pinned to, with zero clearance between the popup and the
// toolbar's other buttons, so the fab-menu visually overlapped the
// icon-buttons above it. `m3e-fab-menu`/`m3e-menu` (MenuPosition.d.ts /
// FabMenuElement's own API) expose only `position-x`/`position-y` axis
// flags — no anchor-offset/gap custom property exists on either component
// (checked MenuElement.d.ts, MenuTriggerElement.d.ts, and the fab-menu
// family's .d.ts — none declare a `--m3e-*-gap`/offset cssprop), so there
// was no clean "nudge it a few px away" fix for a 5-item popup anchored to
// the toolbar's own corner button. Per Jack's own resolution: rather than
// chase a positioning micro-fix for a menu that structurally can't clear
// its own anchor, the "New" fab-menu is deleted outright — the filled
// "New" icon-button below now just flips Preact state (`onNewClick`) to
// open the unified item-creation bottom sheet
// (client/components/item_capture_sheet.tsx) instead of wrapping an
// `m3e-fab-menu-trigger`. The "Recently visited" `m3e-menu`
// (`sb-recent-pages-menu`) keeps its real anchored-menu positioning API,
// just now explicit about `position-y="above"` (see below) instead of
// relying on the component's default/auto-flip, since it's the toolbar's
// own last remaining anchored popup and needed a real clearance fix, not a
// removal.

export type ActionButton = {
  icon: FunctionalComponent<any>;
  description: string;
  class?: string;
  callback: () => void;
  href?: string;
};

export type RecentPageItem = {
  key: string;
  label: string;
  onClick: () => void;
};

export function FloatingToolbar({
  actions,
  journal,
  onNewClick,
  recentPages,
  readOnlyToggle,
}: {
  actions: ActionButton[];
  journal: { iconName: string; label: string; onClick: () => void };
  onNewClick: () => void;
  recentPages: { label: string; items: RecentPageItem[] };
  readOnlyToggle?: { active: boolean; label: string; onClick: () => void };
}) {
  return (
    <>
      <m3e-toolbar
        vertical
        shape="rounded"
        elevated
        className="sb-floating-toolbar"
        aria-label="Toolbar"
      >
        {actions.map((action, i) => (
          <m3e-icon-button
            key={`${action.description}-${i}`}
            title={action.description}
            aria-label={action.description}
            href={action.href || undefined}
            className={action.class}
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              action.callback();
            }}
          >
            <action.icon />
          </m3e-icon-button>
        ))}
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
          title={recentPages.label}
          aria-label={recentPages.label}
        >
          <m3e-menu-trigger for="sb-recent-pages-menu">
            <m3e-icon name="history"></m3e-icon>
          </m3e-menu-trigger>
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
      {
        // `position-y="above"` is explicit here (component default is
        // "below", MenuPosition.d.ts) because the toolbar it's anchored to
        // sits fixed at the bottom-right corner of the viewport
        // (.sb-floating-toolbar, top.scss) — a menu opening "below" its
        // trigger there has nowhere on-screen to render and either clips
        // against the viewport edge or (depending on the browser's own
        // collision handling) auto-flips unpredictably. Forcing "above"
        // makes it open into the toolbar's own clear space every time,
        // rather than overlapping the toolbar's other buttons the way the
        // old default did. `position-x="before"` (unchanged) keeps it
        // opening leftward, away from the screen's right edge.
      }
      <m3e-menu id="sb-recent-pages-menu" position-x="before" position-y="above">
        {recentPages.items.length === 0
          ? <m3e-menu-item disabled>No recently visited pages yet</m3e-menu-item>
          : recentPages.items.map((item) => (
            <m3e-menu-item key={item.key} onClick={item.onClick}>
              {item.label}
            </m3e-menu-item>
          ))}
      </m3e-menu>
    </>
  );
}
