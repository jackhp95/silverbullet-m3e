import type { FunctionalComponent } from "preact";
import "@m3e/web/toolbar";
import "@m3e/web/icon-button";
import "@m3e/web/fab-menu";
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

export type ActionButton = {
  icon: FunctionalComponent<any>;
  description: string;
  class?: string;
  callback: () => void;
  href?: string;
};

export type NewMenuItem = {
  iconName: string;
  label: string;
  onClick: () => void;
};

export function FloatingToolbar({
  actions,
  journal,
  newMenuItems,
}: {
  actions: ActionButton[];
  journal: { iconName: string; label: string; onClick: () => void };
  newMenuItems: NewMenuItem[];
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
        >
          <m3e-fab-menu-trigger for="sb-new-menu">
            <m3e-icon name="add"></m3e-icon>
          </m3e-fab-menu-trigger>
        </m3e-icon-button>
      </m3e-toolbar>
      <m3e-fab-menu id="sb-new-menu" variant="primary">
        {newMenuItems.map((item, i) => (
          <m3e-fab-menu-item
            key={`${item.label}-${i}`}
            onClick={item.onClick}
          >
            <m3e-icon slot="icon" name={item.iconName}></m3e-icon>
            {item.label}
          </m3e-fab-menu-item>
        ))}
      </m3e-fab-menu>
    </>
  );
}
