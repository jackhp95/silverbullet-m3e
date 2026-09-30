import { expect, test } from "vitest";
import {
  breadcrumbItems,
  deriveChrome,
  plugModalSizing,
  pushMenuIcon,
  pushMenuItem,
  type ChromeActions,
} from "./chrome_model.ts";
import {
  CHECKING_LABEL,
  PUSH_MENU_CHECKING_LABEL,
  PUSH_MENU_PENDING_LABEL,
  PUSH_STATE_DETAILS,
  PUSH_MENU_LABELS,
  type PushState,
} from "../lib/push_ui.ts";

const noop = () => {};
const baseActions: ChromeActions = {
  openPageNavigator: noop,
  openConfig: noop,
  togglePush: noop,
};

// --- breadcrumbItems --------------------------------------------------

test("breadcrumbItems: empty page name is just the root, current", () => {
  expect(breadcrumbItems("", baseActions)).toEqual([
    {
      key: "sb-breadcrumb-root",
      label: "Space",
      current: true,
      onClick: undefined,
    },
  ]);
});

test("breadcrumbItems: root has no onClick without Navigate: Home", () => {
  const items = breadcrumbItems("A", baseActions);
  expect(items[0].onClick).toBeUndefined();
});

test("breadcrumbItems: root onClick is navigateHome when registered", () => {
  const navigateHome = () => {};
  const items = breadcrumbItems("A", { ...baseActions, navigateHome });
  expect(items[0].onClick).toBe(navigateHome);
});

test("breadcrumbItems: 'A' is one segment, current, no onClick", () => {
  const items = breadcrumbItems("A", baseActions);
  expect(items).toHaveLength(2);
  expect(items[0].current).toBe(false);
  expect(items[1]).toEqual({
    key: "sb-breadcrumb-0",
    label: "A",
    current: true,
    onClick: undefined,
  });
});

test("breadcrumbItems: 'A/B/C' has 3 segments, only the last current", () => {
  const items = breadcrumbItems("A/B/C", baseActions);
  expect(items).toHaveLength(4);
  const [root, a, b, c] = items;
  expect(root.current).toBe(false);
  expect(a).toEqual({
    key: "sb-breadcrumb-0",
    label: "A",
    current: false,
    onClick: baseActions.openPageNavigator,
  });
  expect(b).toEqual({
    key: "sb-breadcrumb-1",
    label: "B",
    current: false,
    onClick: baseActions.openPageNavigator,
  });
  expect(c).toEqual({
    key: "sb-breadcrumb-2",
    label: "C",
    current: true,
    onClick: undefined,
  });
});

// --- pushMenuIcon / pushMenuItem ---------------------------------------

const allStates: PushState[] = [
  "unsupported",
  "no-service-worker",
  "not-configured",
  "denied",
  "off",
  "on",
];

test("pushMenuIcon: undefined state shows the default bell", () => {
  expect(pushMenuIcon(undefined)).toBe("notifications");
});

test("pushMenuIcon: dead-end states show the off bell", () => {
  for (const state of allStates.filter((s) => s !== "off" && s !== "on")) {
    expect(pushMenuIcon(state)).toBe("notifications_off");
  }
});

test("pushMenuIcon: 'on' shows the active bell, 'off' the default bell", () => {
  expect(pushMenuIcon("on")).toBe("notifications_active");
  expect(pushMenuIcon("off")).toBe("notifications");
});

test("pushMenuItem: undefined state is checking, disabled", () => {
  const item = pushMenuItem({ state: undefined, pending: false }, noop);
  expect(item).toMatchObject({
    key: "push",
    icon: "notifications",
    label: PUSH_MENU_CHECKING_LABEL,
    detail: CHECKING_LABEL,
    disabled: true,
  });
});

test("pushMenuItem: pending overrides the label and disables regardless of state", () => {
  const item = pushMenuItem({ state: "off", pending: true }, noop);
  expect(item.label).toBe(PUSH_MENU_PENDING_LABEL);
  expect(item.disabled).toBe(true);
});

test.each(allStates)("pushMenuItem: resting state %s", (state) => {
  const actionable = state === "off" || state === "on";
  const item = pushMenuItem({ state, pending: false }, noop);
  expect(item).toMatchObject({
    key: "push",
    icon: pushMenuIcon(state),
    label: PUSH_MENU_LABELS[state],
    detail: PUSH_STATE_DETAILS[state],
    disabled: !actionable,
  });
});

// --- deriveChrome: scheme mapping + read-only toggle visibility --------

const baseInput = {
  pageName: undefined,
  isReadOnly: false,
  accent: "#3569b8",
  push: { state: undefined, pending: false },
  bodyText: "",
  actions: baseActions,
};

test("deriveChrome: darkMode undefined maps to 'auto'", () => {
  expect(deriveChrome(baseInput).theme.scheme).toBe("auto");
});

test("deriveChrome: darkMode true maps to 'dark', false to 'light'", () => {
  expect(deriveChrome({ ...baseInput, darkMode: true }).theme.scheme).toBe(
    "dark",
  );
  expect(deriveChrome({ ...baseInput, darkMode: false }).theme.scheme).toBe(
    "light",
  );
});

test("deriveChrome: no toggleReadOnly action hides the toggle entirely", () => {
  const chrome = deriveChrome(baseInput);
  expect(chrome.readOnlyToggleShown).toBe(false);
  expect(chrome.appBar.readOnlyToggle).toBeUndefined();
});

test("deriveChrome: toggleReadOnly action shows the toggle, labeled by isReadOnly", () => {
  const toggleReadOnly = () => {};
  const chrome = deriveChrome({
    ...baseInput,
    isReadOnly: true,
    actions: { ...baseActions, toggleReadOnly },
  });
  expect(chrome.readOnlyToggleShown).toBe(true);
  expect(chrome.appBar.readOnlyToggle).toEqual({
    active: true,
    label: "Disable read-only",
    onClick: toggleReadOnly,
  });
});

// --- plugModalSizing -----------------------------------------------------

test("plugModalSizing: number inset produces px arithmetic", () => {
  expect(plugModalSizing(24)).toEqual({
    dialogWidth: "calc(100% - 48px)",
    dialogHeight: "calc(100dvh - 48px)",
    panelHeight: "calc(calc(100dvh - 48px) - 88px)",
  });
});

test("plugModalSizing: string inset produces a 2x() CSS expression", () => {
  expect(plugModalSizing("2rem")).toEqual({
    dialogWidth: "calc(100% - 2 * (2rem))",
    dialogHeight: "calc(100dvh - 2 * (2rem))",
    panelHeight: "calc(calc(100dvh - 2 * (2rem)) - 88px)",
  });
});
