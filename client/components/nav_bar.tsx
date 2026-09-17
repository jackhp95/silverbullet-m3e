import "@m3e/web/nav-bar";
import "@m3e/web/fab";
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";
import type { NavDestination } from "../types/ui.ts";

// Bottom nav bar + FAB (2026-09-17 nav-bar redesign spec, leaves N2+N3).
// Real @m3e/web `m3e-nav-bar`/`m3e-nav-item`/`m3e-fab` components (verified
// against node_modules/@m3e/web/dist/custom-elements.json — src/nav-bar/
// {NavBarElement,NavItemElement}.ts, src/fab/FabElement.ts), used exactly
// per §1.1/§1.2 of the spec. `m3e-nav-bar` supplies no fixed positioning of
// its own (`display: block; overflow: hidden`) — `.sb-nav-bar`/`.sb-fab` in
// top.scss supply it, same convention `.sb-floating-toolbar` used for
// `m3e-toolbar` (the file this replaces).
//
// Selection semantics, decompiled from the compiled `dist/nav-bar.js`
// (re-verified directly against the bundled source, not just the spec's
// restatement of it — `_M3eNavItemElement_handleClick`):
//
//   if (e.defaultPrevented) return;
//   if (this.dispatchEvent(new Event("beforeinput", { bubbles: true, cancelable: true }))) {
//     this.selected = true;
//     this.navBar?.[selectionManager].notifySelectionChange(this);
//     this.dispatchEvent(new Event("input", { bubbles: true }));
//     this.dispatchEvent(new Event("change", { bubbles: true }));
//   }
//
// `dispatchEvent` returns `false` when a listener calls `preventDefault()`
// on the (cancelable) `beforeinput` it dispatches on itself in response to
// a native click — so a synchronous `preventDefault()` inside `onBeforeInput`
// short-circuits the whole `if` block: `selected` is never set, the nav bar
// is never told about a selection change, and `change` never fires. That is
// exactly how Journal stays an action-only item that never becomes the
// selected destination (spec §1.2/§2.4) — its own `onClick` (a separate,
// un-prevented listener for the underlying native `click`) still runs.
//
// Selection itself is Preact-controlled, not component-owned: clicking
// never deselects on its own (no toggle-off inside the component), so
// `selected` is passed down from `navDestination` on every render, and
// `onChange` (fired on every click INCLUDING a re-click of the
// already-selected item, since the component always sets `selected = true`
// and re-fires `change` regardless of prior state) is where this file's
// caller decides whether that's an open-panel or close-panel signal.

export type JournalAction = {
  /** Whether "Journal: Today" is currently a registered command — same
   * guard style `readOnlyToggle` uses today (`viewState.commands.has(...)`).
   * Space-Lua-defined (libraries/Library/Std/Journal/Journal.md), so it can
   * legitimately be absent in a space without the Std library. */
  available: boolean;
  onClick: () => void;
};

const DESTINATIONS: {
  destination: NavDestination;
  icon: string;
  label: string;
}[] = [
  { destination: "recent", icon: "history", label: "Recent" },
  { destination: "search", icon: "search", label: "Search" },
  { destination: "run", icon: "terminal", label: "Run" },
  {
    destination: "notifications",
    icon: "notifications",
    label: "Notifications",
  },
];

export function NavBar({
  navDestination,
  journal,
  onSelectDestination,
  onCloseDestination,
  notificationsIcon,
}: {
  navDestination: NavDestination | null;
  journal: JournalAction;
  onSelectDestination: (destination: NavDestination) => void;
  onCloseDestination: () => void;
  /** Icon name for the Notifications item. Static ("notifications") for
   * N2 — N9 makes this reflect real push state
   * (notifications_active/notifications/notifications_off). */
  notificationsIcon?: string;
}) {
  return (
    <m3e-nav-bar className="sb-nav-bar" aria-label="Navigation">
      <m3e-nav-item
        selected={false}
        disabled-interactive={!journal.available}
        aria-label="Journal"
        onBeforeInput={(e: Event) => {
          // Gates selection (see header comment) — Journal is a one-click
          // action ("go to today's journal page"), never a selected
          // destination with its own panel (spec §2.4).
          e.preventDefault();
        }}
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          if (journal.available) {
            journal.onClick();
          }
        }}
      >
        <m3e-icon slot="icon" name="edit_calendar"></m3e-icon>
        Journal
      </m3e-nav-item>
      {DESTINATIONS.map((item) => (
        <m3e-nav-item
          key={item.destination}
          selected={navDestination === item.destination}
          aria-label={item.label}
          onChange={() => {
            if (navDestination === item.destination) {
              onCloseDestination();
            } else {
              onSelectDestination(item.destination);
            }
          }}
        >
          <m3e-icon
            slot="icon"
            name={
              item.destination === "notifications"
                ? (notificationsIcon ?? item.icon)
                : item.icon
            }
          ></m3e-icon>
          {item.label}
        </m3e-nav-item>
      ))}
    </m3e-nav-bar>
  );
}

// FAB (leaf N3) — single `m3e-fab`, deliberately NOT paired with an
// `m3e-fab-menu` (spec §2.2's fully-reasoned rejection:
// item_capture_sheet.tsx's own header comment records that a 5-item
// `m3e-fab-menu` speed-dial already existed here and was deliberately
// replaced by the capture sheet's segmented type picker — re-adding one
// would restore a duplicate 5-way picker in front of a sheet that already
// has one). `onClick` opens the same, unchanged `ItemCaptureSheet` the old
// floating toolbar's filled Add icon-button opened — same
// `aria-label="New…"` that button used (deliberately preserved, not
// renamed to e.g. "Add"), since e2e/item-capture-sheet.test.ts's own
// `[aria-label="New…"]` locator is unscoped and must keep matching this
// trigger unchanged (N3's own acceptance: that file passes with zero edits).
export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <m3e-fab
      variant="primary"
      size="large"
      className="sb-fab"
      aria-label="New…"
      title="New…"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        onClick();
      }}
    >
      <m3e-icon name="add"></m3e-icon>
    </m3e-fab>
  );
}
