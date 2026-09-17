// Push-toggle presentation logic, extracted from
// nav_views/notifications.tsx:26-60 (single source of truth). Fixes the
// documented duplication wart between that file's `CHECKING_LABEL` and
// editor_ui.tsx's own private `PUSH_TOGGLE_LABELS.checking` (editor_ui.tsx
// is read-only in this leaf — it still owns its own literal copy for now;
// this extraction just gives the string one canonical home for whichever
// later leaf wires editor_ui.tsx up to it).

/** Mirrors the shape of editor_ui.tsx's `pushToggle` object exactly — not
 * re-derived, just given a name so callers can type their prop. */
export type PushToggle = {
  active: boolean;
  unavailable: boolean;
  pending: boolean;
  label: string;
  onClick: () => void;
};

/** editor_ui.tsx's `PUSH_TOGGLE_LABELS.checking`, verbatim — the one-time
 * label shown while `pushToggle` is still `undefined`. */
export const CHECKING_LABEL = "Checking push notification support…";

/** Same icon selection editor_ui.tsx's (now-deleted) `pushMenuItem` used,
 * plus a `checking` (`pushToggle === undefined`) branch the kebab never
 * needed since it simply omitted the item for that state. */
export function notificationsIconFor(
  pushToggle: PushToggle | undefined,
): string {
  if (pushToggle === undefined) return "notifications";
  if (pushToggle.unavailable) return "notifications_off";
  if (pushToggle.active) return "notifications_active";
  return "notifications";
}
