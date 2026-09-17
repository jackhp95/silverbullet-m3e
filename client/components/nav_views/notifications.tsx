import "@m3e/web/list";
import "@m3e/web/switch";
import "@m3e/web/icon";
import "../m3e-jsx.d.ts";

// Notifications destination panel (2026-09-17 nav-bar redesign spec §2.6,
// leaf N9) — the push enable/disable control, relocated out of the app-bar
// kebab's now-deleted `pushMenuItem` (client/editor_ui.tsx) into its own
// nav-bar destination. Renders the SAME `pushToggle` object the kebab used
// (constructed once in editor_ui.tsx from `pushState`/`PUSH_TOGGLE_LABELS`,
// all 8 `pushState` labels preserved verbatim) — only the chrome around it
// changes: an `m3e-switch` + status text row instead of a menu item.
//
// `m3e-switch` verified against
// node_modules/@m3e/web/dist/custom-elements.json (src/switch/
// SwitchElement.ts) + the compiled dist/switch.js — see m3e-jsx.d.ts's
// `M3eSwitchAttributes` header comment for the full verification note.
// Load-bearing fact from that verification: the switch's own `icons`
// attribute only toggles a built-in check/x glyph, NOT an arbitrary
// Material Symbols name — so the three pushToggle icons
// (`notifications_active`/`notifications`/`notifications_off`) are
// rendered as the surrounding `m3e-list-item`'s `leading` icon instead,
// same slot convention search_sheet.tsx/UsersView.tsx already use for
// list-item leading/supporting-text/trailing content.
//
// `pushToggle` is `undefined` during the one-time "checking" pushState —
// the exact same shape the kebab's own `pushToggle && {...}` guard used
// (editor_ui.tsx). The kebab simply omitted the item for that state; spec
// §2.6 is explicit that a nav *destination* can't vanish the same way, so
// this view renders the row disabled instead, with the same "checking"
// label editor_ui.tsx's (private, unexported) `PUSH_TOGGLE_LABELS` map
// carries. That map is local to editor_ui.tsx's component function, so the
// string is duplicated here verbatim rather than adding an export surface
// for one string — see editor_ui.tsx's `PUSH_TOGGLE_LABELS.checking` for
// the source of truth; keep both in sync if it ever changes.
const CHECKING_LABEL = "Checking push notification support…";

/** Mirrors the shape of editor_ui.tsx's `pushToggle` object exactly — not
 * re-derived, just given a name so this file can type its prop. */
export type PushToggle = {
  active: boolean;
  unavailable: boolean;
  pending: boolean;
  label: string;
  onClick: () => void;
};

/** Same icon selection editor_ui.tsx's (now-deleted) `pushMenuItem` used,
 * plus a `checking` (`pushToggle === undefined`) branch the kebab never
 * needed since it simply omitted the item for that state. Exported so
 * nav_bar.tsx's `notificationsIcon` prop (editor_ui.tsx wiring) can reuse
 * the identical mapping instead of a second, potentially-drifting copy. */
export function notificationsIconFor(
  pushToggle: PushToggle | undefined,
): string {
  if (pushToggle === undefined) return "notifications";
  if (pushToggle.unavailable) return "notifications_off";
  if (pushToggle.active) return "notifications_active";
  return "notifications";
}

export function NotificationsView(
  { pushToggle }: { pushToggle: PushToggle | undefined },
) {
  // Preserved verbatim (spec's explicit constraint) PLUS the checking case
  // spec §2.6 calls out as this view's own addition over the kebab's
  // omit-on-checking behavior.
  const disabled = pushToggle === undefined || pushToggle.unavailable ||
    pushToggle.pending;
  const icon = notificationsIconFor(pushToggle);
  const label = pushToggle?.label ?? CHECKING_LABEL;
  const checked = pushToggle?.active ?? false;

  return (
    <m3e-list class="sb-notifications-view">
      <m3e-list-item aria-label={label}>
        <m3e-icon slot="leading" name={icon}></m3e-icon>
        Push notifications
        <span slot="supporting-text">{label}</span>
        <m3e-switch
          slot="trailing"
          checked={checked}
          disabled={disabled}
          aria-label={label}
          onChange={() => pushToggle?.onClick()}
        >
        </m3e-switch>
      </m3e-list-item>
    </m3e-list>
  );
}
