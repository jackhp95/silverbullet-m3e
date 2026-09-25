import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { readPushState, registerPushCommands, togglePush } from "./push_toggle.ts";
import * as pushSubscribe from "./lib/push_subscribe.ts";
import { PUSH_TOGGLE_COMMAND } from "./push_toggle.ts";
import type { BootConfig } from "./types/ui.ts";

const configuredBoot = {
  vapidPublicKey: "key",
  pushSidecarUrl: "https://sidecar.example",
} as BootConfig;

function stubPushEnv(opts: {
  permission?: NotificationPermission;
  registration?: unknown;
}) {
  vi.stubGlobal("Notification", { permission: opts.permission ?? "granted" });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("navigator", {
    serviceWorker: {
      getRegistration: async () => opts.registration,
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("readPushState: unsupported when the Push API isn't present at all", async () => {
  vi.unstubAllGlobals();
  expect(await readPushState(configuredBoot)).toBe("unsupported");
});

test("readPushState: not-configured when the bundle has no push config", async () => {
  stubPushEnv({});
  expect(await readPushState({} as BootConfig)).toBe("not-configured");
});

test("readPushState: denied when Notification.permission is denied", async () => {
  stubPushEnv({ permission: "denied" });
  expect(await readPushState(configuredBoot)).toBe("denied");
});

test("readPushState: no-service-worker when no active registration exists", async () => {
  stubPushEnv({ registration: undefined });
  expect(await readPushState(configuredBoot)).toBe("no-service-worker");
});

test("readPushState: off/on follow the registration's real subscription state", async () => {
  const noSub = {
    active: true,
    pushManager: { getSubscription: async () => null },
  };
  stubPushEnv({ registration: noSub });
  expect(await readPushState(configuredBoot)).toBe("off");

  const withSub = {
    active: true,
    pushManager: { getSubscription: async () => ({}) },
  };
  stubPushEnv({ registration: withSub });
  expect(await readPushState(configuredBoot)).toBe("on");
});

function makeDeps() {
  const flashed: Array<{ message: string; type?: string }> = [];
  return {
    flashed,
    deps: {
      bootConfig: configuredBoot,
      ui: {
        flashNotification: (message: string, type?: string) => {
          flashed.push({ message, type });
        },
      },
    },
  };
}

test("togglePush: off -> on calls subscribeToPush and flashes success", async () => {
  const registration = {
    active: true,
    pushManager: { getSubscription: async () => null },
  };
  stubPushEnv({ registration });
  const subscribeSpy = vi
    .spyOn(pushSubscribe, "subscribeToPush")
    .mockResolvedValue({ ok: true });

  const { deps, flashed } = makeDeps();
  const notice = await togglePush(deps);

  expect(subscribeSpy).toHaveBeenCalledWith(registration, {
    vapidPublicKey: "key",
    sidecarUrl: "https://sidecar.example",
  });
  expect(notice).toEqual({ message: "Push notifications enabled", type: "info" });
  expect(flashed).toEqual([{ message: "Push notifications enabled", type: "info" }]);
});

test("togglePush: on -> off calls unsubscribeFromPush and flashes success", async () => {
  const registration = {
    active: true,
    pushManager: { getSubscription: async () => ({}) },
  };
  stubPushEnv({ registration });
  const unsubscribeSpy = vi
    .spyOn(pushSubscribe, "unsubscribeFromPush")
    .mockResolvedValue(true);

  const { deps } = makeDeps();
  const notice = await togglePush(deps);

  expect(unsubscribeSpy).toHaveBeenCalledWith(registration);
  expect(notice).toEqual({ message: "Push notifications turned off", type: "info" });
});

test("togglePush: a subscribe failure surfaces as a typed error notice, never throws", async () => {
  const registration = {
    active: true,
    pushManager: { getSubscription: async () => null },
  };
  stubPushEnv({ registration });
  vi.spyOn(pushSubscribe, "subscribeToPush").mockResolvedValue({
    ok: false,
    reason: "subscribe-failed",
    detail: "boom",
  });

  const { deps } = makeDeps();
  const notice = await togglePush(deps);
  expect(notice).toEqual({
    message: "Could not enable push notifications: boom",
    type: "error",
  });
});

test("togglePush: a dead-end state (e.g. denied) flashes its explanation and never calls subscribe/unsubscribe", async () => {
  stubPushEnv({ permission: "denied" });
  const subscribeSpy = vi.spyOn(pushSubscribe, "subscribeToPush");
  const unsubscribeSpy = vi.spyOn(pushSubscribe, "unsubscribeFromPush");

  const { deps } = makeDeps();
  const notice = await togglePush(deps);

  expect(subscribeSpy).not.toHaveBeenCalled();
  expect(unsubscribeSpy).not.toHaveBeenCalled();
  expect(notice.type).toBe("error");
});

test("registerPushCommands: registers the toggle under its documented command name", () => {
  const registered: Array<{ name: string; run: () => unknown }> = [];
  const hook = {
    registerCommand: (command: { name: string; run: () => unknown }) => {
      registered.push(command);
    },
  };
  const { deps } = makeDeps();
  registerPushCommands(deps, hook as never);
  expect(registered).toHaveLength(1);
  expect(registered[0].name).toBe(PUSH_TOGGLE_COMMAND);
});
