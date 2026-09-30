import { expect, test } from "vitest";
import {
  isPushActionable,
  PUSH_MENU_CHECKING_LABEL,
  PUSH_MENU_LABELS,
  PUSH_MENU_PENDING_LABEL,
  pushConfigFrom,
  pushMenuLabel,
  pushNoticeFor,
  type PushState,
} from "./push_ui.ts";

// `notificationsIconFor`'s cases moved to
// `client/m3e_chrome/chrome_model.test.ts` (as `pushMenuIcon`), alongside
// `chrome_model.ts` which replaced it as the kebab icon's sole caller.

test("isPushActionable is true only for off/on", () => {
  const states: PushState[] = [
    "unsupported",
    "no-service-worker",
    "not-configured",
    "denied",
    "off",
    "on",
  ];
  expect(states.map(isPushActionable)).toEqual([
    false,
    false,
    false,
    false,
    true,
    true,
  ]);
});

test("pushConfigFrom: both fields present returns a config", () => {
  expect(
    pushConfigFrom({
      vapidPublicKey: "key",
      pushSidecarUrl: "https://sidecar.example",
    }),
  ).toEqual({ vapidPublicKey: "key", sidecarUrl: "https://sidecar.example" });
});

test("pushConfigFrom: either field missing/empty returns undefined", () => {
  expect(pushConfigFrom({})).toBeUndefined();
  expect(pushConfigFrom({ vapidPublicKey: "" })).toBeUndefined();
  expect(pushConfigFrom({ vapidPublicKey: "key" })).toBeUndefined();
  expect(pushConfigFrom({ pushSidecarUrl: "url" })).toBeUndefined();
});

test("pushNoticeFor: failed outcome names the action and detail", () => {
  expect(
    pushNoticeFor({ kind: "failed", action: "enable", detail: "boom" }),
  ).toEqual({
    message: "Could not enable push notifications: boom",
    type: "error",
  });
});

test("pushNoticeFor: on/off states are info, dead-end states are error", () => {
  expect(pushNoticeFor({ kind: "state", state: "on" })).toEqual({
    message: "Push notifications enabled",
    type: "info",
  });
  expect(pushNoticeFor({ kind: "state", state: "off" })).toEqual({
    message: "Push notifications turned off",
    type: "info",
  });
  expect(pushNoticeFor({ kind: "state", state: "denied" }).type).toBe(
    "error",
  );
  expect(pushNoticeFor({ kind: "state", state: "unsupported" }).type).toBe(
    "error",
  );
});

test("pushMenuLabel: every label fits a kebab menu item (≤ 30 chars)", () => {
  const states: (PushState | undefined)[] = [
    undefined,
    "unsupported",
    "no-service-worker",
    "not-configured",
    "denied",
    "off",
    "on",
  ];
  for (const state of states) {
    expect(pushMenuLabel(state).length).toBeLessThanOrEqual(30);
  }
  expect(pushMenuLabel("off", true).length).toBeLessThanOrEqual(30);
});

test("pushMenuLabel: checking, pending and resting states", () => {
  expect(pushMenuLabel(undefined)).toBe(PUSH_MENU_CHECKING_LABEL);
  expect(pushMenuLabel("on", true)).toBe(PUSH_MENU_PENDING_LABEL);
  expect(pushMenuLabel("off")).toBe(PUSH_MENU_LABELS.off);
  expect(pushMenuLabel("no-service-worker")).toBe(
    PUSH_MENU_LABELS["no-service-worker"],
  );
});
