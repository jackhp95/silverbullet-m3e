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

// ---------------------------------------------------------------------------
// Push state + messages, shared by the "Push Notifications: Toggle" command
// (client/push_toggle.ts) and whichever app-bar surface later mounts a
// visible toggle. Pure: no DOM, no browser APIs — the effectful reads live in
// client/push_toggle.ts.

/** The two build-time settings a subscribe needs (see `patchPushConfig()`). */
export type PushConfig = { vapidPublicKey: string; sidecarUrl: string };

/**
 * Where push stands for this client. The first four are dead ends the user
 * can't fix from inside the app; `off`/`on` are the actionable pair.
 */
export type PushState =
  | "unsupported"
  | "no-service-worker"
  | "not-configured"
  | "denied"
  | "off"
  | "on";

/** Whether toggling from `state` can do anything at all. */
export const isPushActionable = (state: PushState): boolean =>
  state === "off" || state === "on";

/**
 * The push config baked into this bundle, or `undefined` when either half is
 * missing — an empty string is how `patchPushConfig()` spells "unset".
 */
export function pushConfigFrom(bootConfig: {
  vapidPublicKey?: string;
  pushSidecarUrl?: string;
}): PushConfig | undefined {
  const vapidPublicKey = bootConfig.vapidPublicKey ?? "";
  const sidecarUrl = bootConfig.pushSidecarUrl ?? "";
  return vapidPublicKey && sidecarUrl
    ? { vapidPublicKey, sidecarUrl }
    : undefined;
}

/** Full-sentence explanation of each state, for notifications and tooltips. */
export const PUSH_STATE_DETAILS: Record<PushState, string> = {
  unsupported: "Push notifications are not supported in this browser",
  "no-service-worker":
    "Push notifications need the service worker, which is not active",
  "not-configured": "Push notifications are not configured for this server",
  denied:
    "Notification permission was denied — enable it in your browser settings",
  off: "Enable push notifications",
  on: "Push notifications are on — click to turn off",
};

/** A notification to flash after a toggle attempt. */
export type PushNotice = { message: string; type: "info" | "error" };

/** What a toggle attempt ended in: a resting state, or a failed transition. */
export type PushOutcome =
  | { kind: "state"; state: PushState }
  | { kind: "failed"; action: "enable" | "disable"; detail: string };

/** The notice to flash for a toggle outcome. */
export function pushNoticeFor(outcome: PushOutcome): PushNotice {
  if (outcome.kind === "failed") {
    return {
      message: `Could not ${outcome.action} push notifications: ${outcome.detail}`,
      type: "error",
    };
  }
  switch (outcome.state) {
    case "on":
      return { message: "Push notifications enabled", type: "info" };
    case "off":
      return { message: "Push notifications turned off", type: "info" };
    default:
      return { message: PUSH_STATE_DETAILS[outcome.state], type: "error" };
  }
}

/**
 * Terse labels for the app-bar kebab's push item (`#sb-app-bar-menu`), each
 * ≤ 30 characters so they fit a menu item without ellipsizing (fork
 * `fa3d075a`). The full sentence stays in `PUSH_STATE_DETAILS`, surfaced as
 * the item's tooltip.
 */
export const PUSH_MENU_LABELS: Record<PushState, string> = {
  unsupported: "Push not supported",
  "no-service-worker": "Push needs service worker",
  "not-configured": "Push not configured",
  denied: "Push permission denied",
  off: "Enable push notifications",
  on: "Disable push notifications",
};

/** Kebab label while the push state is still being read. */
export const PUSH_MENU_CHECKING_LABEL = "Checking push support…";

/** Kebab label while a toggle is in flight. */
export const PUSH_MENU_PENDING_LABEL = "Updating push…";

/** The kebab push item's label: `undefined` state = still checking. */
export function pushMenuLabel(
  state: PushState | undefined,
  pending = false,
): string {
  if (pending) return PUSH_MENU_PENDING_LABEL;
  return state === undefined
    ? PUSH_MENU_CHECKING_LABEL
    : PUSH_MENU_LABELS[state];
}
