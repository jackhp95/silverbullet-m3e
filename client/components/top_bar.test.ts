import { h } from "preact";
import * as featherIcons from "preact-feather";
import { render } from "preact-render-to-string";
import { expect, test } from "vitest";
import { type ActionButton, TopBar } from "./top_bar.tsx";

// SSR (preact-render-to-string) coverage for CS-5's small `m3e-app-bar`
// reskin — no `@m3e/web` import in top_bar.tsx itself (see this file's
// sibling status, scripts/reconcile/builder-common.md hazard 1), so these
// custom-element tags render as plain, inert HTML strings under vitest's
// DOM-less `node` environment; that's exactly what's being asserted here
// (upgrade behavior is the e2e suite's job, e2e/flows/app-bar.test.ts).

const baseProps = {
  pageName: "Hello",
  unsavedChanges: false,
  isOnline: true,
  isLoading: false,
  notifications: [],
  onRename: async () => {},
  onDismissNotification: () => {},
  actionButtons: [] as ActionButton[],
  readOnly: false,
  breadcrumbItems: [
    { key: "sb-breadcrumb-root", label: "Space", current: true },
  ],
  lastModified: "2026-09-20T12:00:00.000Z",
  bodyText: "hello world",
};

function renderTopBar(overrides: Partial<Parameters<typeof TopBar>[0]> = {}) {
  return render(h(TopBar, { ...baseProps, ...overrides } as any));
}

test("renders the medium m3e-app-bar shell with the wrapping-textarea page name editor", () => {
  const html = renderTopBar();
  expect(html).toContain("<m3e-app-bar");
  expect(html).toMatch(/<m3e-app-bar[^>]*size="medium"/);
  expect(html).toContain('id="sb-current-page"');
  expect(html).toMatch(/<textarea[^>]*class="[^"]*\bsb-input\b/);
});

test("breadcrumb items render inside the app bar's leading slot", () => {
  const html = renderTopBar({
    breadcrumbItems: [
      { key: "sb-breadcrumb-root", label: "Space", current: false },
      { key: "sb-breadcrumb-0", label: "Projects", current: false },
      { key: "sb-breadcrumb-1", label: "Alpha", current: true },
    ],
  } as any);
  expect(html).toMatch(/<m3e-breadcrumb slot="leading"/);
  const itemCount = (html.match(/<m3e-breadcrumb-item/g) ?? []).length;
  expect(itemCount).toBe(3);
  expect(html).toMatch(/<m3e-breadcrumb-item[^>]*current="page"[^>]*>Alpha/);
});

test("subtitle renders the 'Edited ... · N min read' string", () => {
  const html = renderTopBar();
  expect(html).toMatch(
    /<span slot="subtitle">Edited .+ · \d+ min read<\/span>/,
  );
});

test("subtitle omits the 'Edited' segment before page meta has loaded", () => {
  const html = renderTopBar({ lastModified: undefined });
  expect(html).toMatch(/<span slot="subtitle">\d+ min read<\/span>/);
});

test("determinate sync progress renders a valued circular indicator", () => {
  const html = renderTopBar({
    progressPercentage: 42,
    progressType: "sync",
  } as any);
  expect(html).toMatch(
    /class="progress-wrapper progress-sync"[\s\S]*?<m3e-circular-progress-indicator[^>]*value="42"/,
  );
});

test("NaN percentage renders indeterminate, not a bogus value", () => {
  const html = renderTopBar({
    progressPercentage: NaN,
    progressType: "sync",
  } as any);
  expect(html).toContain("indeterminate");
});

test("offline renders the offline chip; online does not", () => {
  const offline = renderTopBar({ isOnline: false });
  expect(offline).toContain("sb-offline-chip");

  const online = renderTopBar({ isOnline: true });
  expect(online).not.toContain("sb-offline-chip");
});

test("readOnlyToggle renders an m3e-icon-button labeled to enable read-only", () => {
  const html = renderTopBar({
    readOnlyToggle: {
      active: false,
      label: "Enable read-only",
      onClick: () => {},
    },
  } as any);
  expect(html).toMatch(/<m3e-icon-button[^>]*aria-label="Enable read-only"/);
});

test("readOnlyToggle active state labels itself to disable read-only", () => {
  const html = renderTopBar({
    readOnlyToggle: {
      active: true,
      label: "Disable read-only",
      onClick: () => {},
    },
  } as any);
  expect(html).toMatch(/<m3e-icon-button[^>]*aria-label="Disable read-only"/);
});

test("a native action button (e.g. the profile avatar) renders a real <button>", () => {
  const html = renderTopBar({
    actionButtons: [
      {
        icon: featherIcons.User,
        description: "Account",
        callback: () => {},
        native: true,
      },
    ],
  });
  expect(html).toMatch(/<button[^>]*>/);
});

test("a non-native action button renders m3e-icon-button, not a native button", () => {
  const html = renderTopBar({
    actionButtons: [
      {
        icon: featherIcons.Star,
        description: "Star",
        callback: () => {},
      },
    ],
  });
  expect(html).toContain("<m3e-icon-button");
});

// CS-7b: trailing kebab menu (`#sb-app-bar-menu`) + mobile hamburger
// overflow (D2).

const kebabItems = [
  {
    key: "push",
    icon: "notifications_off",
    label: "Push not configured",
    detail: "Push notifications are not configured for this server",
    disabled: true,
    onClick: () => {},
  },
  {
    key: "open-config",
    icon: "settings",
    label: "Open Config",
    onClick: () => {},
  },
];

const starButton: ActionButton = {
  icon: featherIcons.Star,
  description: "Star",
  callback: () => {},
};
const profileButton: ActionButton = {
  icon: featherIcons.User,
  description: "Account",
  callback: () => {},
  native: true,
};

/** The `#sb-app-bar-menu` markup only (the menu is rendered after the bar). */
function menuHtml(html: string): string {
  const start = html.indexOf('<m3e-menu id="sb-app-bar-menu"');
  expect(start).toBeGreaterThanOrEqual(0);
  return html.slice(start, html.indexOf("</m3e-menu>", start));
}

/** The `m3e-app-bar` markup only. */
function barHtml(html: string): string {
  return html.slice(
    html.indexOf("<m3e-app-bar"),
    html.indexOf("</m3e-app-bar>"),
  );
}

test("the kebab trigger is a trailing 'More actions' icon button bound to #sb-app-bar-menu, opening below", () => {
  const html = renderTopBar({ menuItems: kebabItems } as any);
  expect(barHtml(html)).toMatch(
    /<m3e-icon-button slot="trailing"[^>]*aria-label="More actions"[^>]*><m3e-menu-trigger for="sb-app-bar-menu">/,
  );
  expect(html).toMatch(/<m3e-menu id="sb-app-bar-menu" position-y="below"/);
});

test("the read-only toggle precedes the kebab trigger in the trailing slot", () => {
  const html = renderTopBar({
    menuItems: kebabItems,
    readOnlyToggle: {
      active: false,
      label: "Enable read-only",
      onClick: () => {},
    },
  } as any);
  expect(html.indexOf('aria-label="Enable read-only"')).toBeLessThan(
    html.indexOf('aria-label="More actions"'),
  );
});

test("menu items render labels, slotted icons, tooltips and disabled state", () => {
  const menu = menuHtml(renderTopBar({ menuItems: kebabItems } as any));
  expect(menu).toMatch(
    /<m3e-menu-item data-key="push" disabled><m3e-icon slot="icon" name="notifications_off"><\/m3e-icon><span title="Push notifications are not configured for this server" class="sb-app-bar-menu-label">Push not configured<\/span>/,
  );
  expect(menu).toMatch(
    /<m3e-menu-item data-key="open-config"><m3e-icon slot="icon" name="settings"><\/m3e-icon><span title="Open Config" class="sb-app-bar-menu-label">Open Config<\/span>/,
  );
});

test("desktop keeps action buttons as trailing icon buttons, not kebab items", () => {
  const html = renderTopBar({
    menuItems: kebabItems,
    actionButtons: [starButton],
  } as any);
  expect(barHtml(html)).toMatch(/<m3e-icon-button[^>]*aria-label="Star"/);
  expect(menuHtml(html)).not.toContain("Star");
});

test("mobile hamburger style moves dropdown action buttons into the kebab", () => {
  const html = renderTopBar({
    menuItems: kebabItems,
    mobileMenuStyle: "hamburger",
    actionButtons: [starButton],
  } as any);
  expect(barHtml(html)).not.toContain('aria-label="Star"');
  expect(menuHtml(html)).toMatch(
    /<span title="Star" class="sb-app-bar-menu-label">Star<\/span>/,
  );
  // No hamburger expander/fly-out any more.
  expect(html).not.toContain("hamburger");
});

test("mobile hamburger style keeps dropdown:false buttons and the profile avatar trailing", () => {
  const pinned = { ...starButton, description: "Pinned", dropdown: false };
  const html = renderTopBar({
    menuItems: kebabItems,
    mobileMenuStyle: "hamburger",
    actionButtons: [pinned, profileButton],
  } as any);
  const bar = barHtml(html);
  expect(bar).toMatch(/<m3e-icon-button[^>]*aria-label="Pinned"/);
  expect(bar).toMatch(/<button[^>]*title="Account"/);
  const menu = menuHtml(html);
  expect(menu).not.toContain("Pinned");
  expect(menu).not.toContain("Account");
});
