/**
 * Web Push subscribe/unsubscribe toggle (spec §5.1), exposed as the
 * "Push Notifications: Toggle" command.
 *
 * This is the effectful edge: it reads the browser's real push state
 * (`Notification.permission`, the service worker registration, the current
 * `PushManager` subscription) and drives `client/lib/push_subscribe.ts`. The
 * wording and state vocabulary are pure and live in `client/lib/push_ui.ts`.
 *
 * The config is read from `bootConfig` on every run rather than captured at
 * registration, so a build-time `VAPID_PUBLIC_KEY`/`PUSH_SIDECAR_URL` (see
 * `patchPushConfig()` in `build/build_client.ts`) is picked up the same way a
 * test-injected one is.
 *
 * A visible toggle in the app bar can reuse `readPushState` (to render the
 * current state and `notificationsIconFor`) and `togglePush` (as its click
 * handler) — the command is the one place the flow itself is implemented.
 */
import type { NotificationType } from "@silverbulletmd/silverbullet/type/client";
import {
  getPushSubscriptionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "./lib/push_subscribe.ts";
import {
  type PushConfig,
  type PushNotice,
  type PushState,
  pushConfigFrom,
  pushNoticeFor,
} from "./lib/push_ui.ts";
import type { CommandHook } from "./plugos/hooks/command.ts";
import type { BootConfig } from "./types/ui.ts";

export const PUSH_TOGGLE_COMMAND = "Push Notifications: Toggle";

/** The slice of `Client` the toggle needs — kept narrow on purpose. */
export type PushToggleDeps = {
  bootConfig: BootConfig;
  ui: {
    flashNotification(message: string, type?: NotificationType): unknown;
  };
};

type Actionable = {
  state: "off" | "on";
  registration: ServiceWorkerRegistration;
  config: PushConfig;
};

/** Either a dead end, or everything needed to actually toggle. */
type PushReadiness = { state: Exclude<PushState, "off" | "on"> } | Actionable;

async function readPushReadiness(
  bootConfig: BootConfig,
): Promise<PushReadiness> {
  if (!isPushSupported()) return { state: "unsupported" };
  const config = pushConfigFrom(bootConfig);
  if (!config) return { state: "not-configured" };
  if (Notification.permission === "denied") return { state: "denied" };
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) return { state: "no-service-worker" };
  const subscribed =
    (await getPushSubscriptionState(registration)) === "subscribed";
  return { state: subscribed ? "on" : "off", registration, config };
}

/** Where push currently stands for this client. */
export async function readPushState(bootConfig: BootConfig): Promise<PushState> {
  return (await readPushReadiness(bootConfig)).state;
}

async function turnOff(registration: ServiceWorkerRegistration) {
  try {
    await unsubscribeFromPush(registration);
    return pushNoticeFor({ kind: "state", state: "off" });
  } catch (e: any) {
    return pushNoticeFor({
      kind: "failed",
      action: "disable",
      detail: e?.message ?? String(e),
    });
  }
}

async function turnOn({ registration, config }: Actionable) {
  const result = await subscribeToPush(registration, config);
  if (result.ok) return pushNoticeFor({ kind: "state", state: "on" });
  if (result.reason === "subscribe-failed" || result.reason === "post-failed") {
    return pushNoticeFor({
      kind: "failed",
      action: "enable",
      detail: result.detail ?? result.reason,
    });
  }
  return pushNoticeFor({ kind: "state", state: result.reason });
}

/**
 * Flip the subscription (or explain why it can't be flipped), flash the
 * outcome, and return it. Never throws.
 */
export async function togglePush(deps: PushToggleDeps): Promise<PushNotice> {
  const readiness = await readPushReadiness(deps.bootConfig);
  const notice =
    readiness.state === "on"
      ? await turnOff(readiness.registration)
      : readiness.state === "off"
        ? await turnOn(readiness)
        : pushNoticeFor({ kind: "state", state: readiness.state });
  deps.ui.flashNotification(notice.message, notice.type);
  return notice;
}

export function registerPushCommands(
  deps: PushToggleDeps,
  hook: CommandHook,
): void {
  hook.registerCommand({
    name: PUSH_TOGGLE_COMMAND,
    run: async () => {
      await togglePush(deps);
    },
  });
}
