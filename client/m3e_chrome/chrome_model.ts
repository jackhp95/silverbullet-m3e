// Pure, DOM-free derivation of the app-bar/floating-toolbar/theme chrome from
// view state. Everything here is a small function of plain data so it can be
// unit-tested (chrome_model.test.ts) without a browser or preact-render.

import {
  CHECKING_LABEL,
  isPushActionable,
  PUSH_STATE_DETAILS,
  type PushState,
  pushMenuLabel,
} from "../lib/push_ui.ts";
import type {
  AppBarChrome,
  AppBarMenuItem,
  BreadcrumbItem,
} from "./app_bar_parts.tsx";

/** Commands the chrome wires up; a missing (`undefined`) optional means the
 * corresponding command isn't registered, and the chrome hides its surface
 * for it (e.g. no read-only toggle, no "Navigate: Home" breadcrumb root). */
export type ChromeActions = {
  navigateHome?: () => void;
  openPageNavigator: () => void;
  openConfig: () => void;
  toggleReadOnly?: () => void;
  togglePush: () => void;
  journalToday?: () => void;
};

export type ChromeInput = {
  pageName?: string;
  isReadOnly: boolean;
  darkMode?: boolean;
  accent: string;
  push: { state?: PushState; pending: boolean };
  lastModified?: string;
  bodyText: string;
  actions: ChromeActions;
};

export type FloatingToolbarProps = {
  onSearchClick: () => void;
  journal: { available: boolean; onClick: () => void };
};

export type AppChrome = {
  theme: { color: string; scheme: "auto" | "dark" | "light" };
  appBar: AppBarChrome;
  floatingToolbar: FloatingToolbarProps;
  readOnlyToggleShown: boolean;
};

/** App-bar breadcrumb: root runs "Navigate: Home" (when registered), middle
 * segments open the page navigator, the last segment is the current page. */
export function breadcrumbItems(
  pageName: string | undefined,
  actions: ChromeActions,
): BreadcrumbItem[] {
  const pathSegments = pageName
    ? pageName.split("/").filter((s) => s.length > 0)
    : [];
  return [
    {
      key: "sb-breadcrumb-root",
      label: "Space",
      current: pathSegments.length === 0,
      onClick: actions.navigateHome,
    },
    ...pathSegments.map((segment, i) => {
      const isLast = i === pathSegments.length - 1;
      return {
        key: `sb-breadcrumb-${i}`,
        label: segment,
        current: isLast,
        onClick: isLast ? undefined : actions.openPageNavigator,
      };
    }),
  ];
}

/** Same icon selection the fork's (now-deleted) `notificationsIconFor` used,
 * addressed directly by `PushState` instead of a `PushToggle` wrapper. */
export function pushMenuIcon(state?: PushState): string {
  if (state === undefined) return "notifications";
  if (!isPushActionable(state)) return "notifications_off";
  if (state === "on") return "notifications_active";
  return "notifications";
}

/** The kebab's push item: label/detail/icon/disabled derived from push
 * state + pending, matching the wording `client/lib/push_ui.ts` owns. */
export function pushMenuItem(
  push: { state?: PushState; pending: boolean },
  onClick: () => void,
): AppBarMenuItem {
  const actionable = push.state !== undefined && isPushActionable(push.state);
  return {
    key: "push",
    icon: pushMenuIcon(push.state),
    label: pushMenuLabel(push.state, push.pending),
    detail:
      push.state === undefined
        ? CHECKING_LABEL
        : PUSH_STATE_DETAILS[push.state],
    disabled: push.pending || !actionable,
    onClick,
  };
}

/** `PanelMode` is a px inset (number) or a CSS length (string); `m3e-dialog`
 * has no inset, so it becomes explicit width/max-height tokens. `panelHeight`
 * reserves ~88px for the dialog's own header row inside the height cap. */
export function plugModalSizing(inset: number | string): {
  dialogWidth: string;
  dialogHeight: string;
  panelHeight: string;
} {
  const dialogWidth =
    typeof inset === "number"
      ? `calc(100% - ${inset * 2}px)`
      : `calc(100% - 2 * (${inset}))`;
  const dialogHeight =
    typeof inset === "number"
      ? `calc(100dvh - ${inset * 2}px)`
      : `calc(100dvh - 2 * (${inset}))`;
  const panelHeight = `calc(${dialogHeight} - 88px)`;
  return { dialogWidth, dialogHeight, panelHeight };
}

/** Derives the whole app chrome from one input snapshot. Pure: same input,
 * same output, no DOM reads. */
export function deriveChrome(input: ChromeInput): AppChrome {
  const scheme: "auto" | "dark" | "light" =
    input.darkMode === undefined ? "auto" : input.darkMode ? "dark" : "light";

  const readOnlyToggle = input.actions.toggleReadOnly
    ? {
        active: input.isReadOnly,
        label: input.isReadOnly ? "Disable read-only" : "Enable read-only",
        onClick: input.actions.toggleReadOnly,
      }
    : undefined;

  const menuItems: AppBarMenuItem[] = [
    pushMenuItem(input.push, input.actions.togglePush),
    {
      key: "open-config",
      icon: "settings",
      label: "Open Config",
      onClick: input.actions.openConfig,
    },
  ];

  return {
    theme: { color: input.accent, scheme },
    appBar: {
      breadcrumbItems: breadcrumbItems(input.pageName, input.actions),
      lastModified: input.lastModified,
      bodyText: input.bodyText,
      readOnlyToggle,
      menuItems,
    },
    floatingToolbar: {
      onSearchClick: input.actions.openPageNavigator,
      journal: {
        available: input.actions.journalToday !== undefined,
        onClick: input.actions.journalToday ?? (() => {}),
      },
    },
    readOnlyToggleShown: input.actions.toggleReadOnly !== undefined,
  };
}
