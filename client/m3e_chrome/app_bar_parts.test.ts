import { h } from "preact";
import * as featherIcons from "preact-feather";
import { render } from "preact-render-to-string";
import { expect, test } from "vitest";
import { type ActionButton, TopBar } from "../components/top_bar.tsx";
import { deriveChrome } from "./chrome_model.ts";
import type { AppBarChrome } from "./app_bar_parts.tsx";

// SSR (preact-render-to-string) coverage for the app-bar parts moved out of
// top_bar.tsx into this module, exercised end-to-end through TopBar's single
// `chrome: AppBarChrome` prop (built by `deriveChrome`, not hand-rolled) --
// the breadcrumb/subtitle/kebab-item cases that used to live in
// top_bar.test.ts's `baseProps` shape.

const noop = () => {};

type ChromeFixtureOverrides = Partial<
  Omit<Parameters<typeof deriveChrome>[0], "actions">
> & { actions?: Partial<Parameters<typeof deriveChrome>[0]["actions"]> };

function fixtureChrome(overrides: ChromeFixtureOverrides = {}): AppBarChrome {
  const { actions: actionOverrides, ...rest } = overrides;
  return deriveChrome({
    pageName: "Hello",
    isReadOnly: false,
    accent: "#3569b8",
    push: { state: "not-configured", pending: false },
    lastModified: "2026-09-20T12:00:00.000Z",
    bodyText: "hello world",
    ...rest,
    actions: {
      openPageNavigator: noop,
      openConfig: noop,
      togglePush: noop,
      ...actionOverrides,
    },
  }).appBar;
}

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
  chrome: fixtureChrome(),
};

function renderTopBar(overrides: Partial<Parameters<typeof TopBar>[0]> = {}) {
  return render(h(TopBar, { ...baseProps, ...overrides } as any));
}

test("breadcrumb items render inside the app bar's leading slot", () => {
  const html = renderTopBar({
    chrome: fixtureChrome({ pageName: "Projects/Alpha" }),
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
  const html = renderTopBar({
    chrome: fixtureChrome({ lastModified: undefined }),
  } as any);
  expect(html).toMatch(/<span slot="subtitle">\d+ min read<\/span>/);
});

test("readOnlyToggle renders an m3e-icon-button labeled to enable read-only", () => {
  const toggleReadOnly = () => {};
  const html = renderTopBar({
    chrome: fixtureChrome({ isReadOnly: false, actions: { toggleReadOnly } }),
  } as any);
  expect(html).toMatch(/<m3e-icon-button[^>]*aria-label="Enable read-only"/);
});

test("readOnlyToggle active state labels itself to disable read-only", () => {
  const toggleReadOnly = () => {};
  const html = renderTopBar({
    chrome: fixtureChrome({ isReadOnly: true, actions: { toggleReadOnly } }),
  } as any);
  expect(html).toMatch(/<m3e-icon-button[^>]*aria-label="Disable read-only"/);
});

test("no readOnlyToggle action omits the toggle entirely", () => {
  const html = renderTopBar();
  expect(html).not.toContain("Enable read-only");
  expect(html).not.toContain("Disable read-only");
});

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
  const html = renderTopBar();
  expect(barHtml(html)).toMatch(
    /<m3e-icon-button slot="trailing"[^>]*aria-label="More actions"[^>]*><m3e-menu-trigger for="sb-app-bar-menu">/,
  );
  expect(html).toMatch(/<m3e-menu id="sb-app-bar-menu" position-y="below"/);
});

test("the read-only toggle precedes the kebab trigger in the trailing slot", () => {
  const toggleReadOnly = () => {};
  const html = renderTopBar({
    chrome: fixtureChrome({ actions: { toggleReadOnly } }),
  } as any);
  expect(html.indexOf('aria-label="Enable read-only"')).toBeLessThan(
    html.indexOf('aria-label="More actions"'),
  );
});

test("menu items render labels, slotted icons, tooltips and disabled state (push + Open Config)", () => {
  const menu = menuHtml(renderTopBar());
  expect(menu).toMatch(
    /<m3e-menu-item data-key="push" disabled><m3e-icon slot="icon" name="notifications_off"><\/m3e-icon><span title="Push notifications are not configured for this server" class="sb-app-bar-menu-label">Push not configured<\/span>/,
  );
  expect(menu).toMatch(
    /<m3e-menu-item data-key="open-config"><m3e-icon slot="icon" name="settings"><\/m3e-icon><span title="Open Config" class="sb-app-bar-menu-label">Open Config<\/span>/,
  );
});

test("desktop keeps action buttons as trailing icon buttons, not kebab items", () => {
  const html = renderTopBar({ actionButtons: [starButton] });
  expect(barHtml(html)).toMatch(/<m3e-icon-button[^>]*aria-label="Star"/);
  expect(menuHtml(html)).not.toContain("Star");
});

test("mobile hamburger style moves dropdown action buttons into the kebab", () => {
  const html = renderTopBar({
    mobileMenuStyle: "hamburger",
    actionButtons: [starButton],
  } as any);
  expect(barHtml(html)).not.toContain('aria-label="Star"');
  expect(menuHtml(html)).toMatch(
    /<span title="Star" class="sb-app-bar-menu-label">Star<\/span>/,
  );
});

test("mobile hamburger style keeps dropdown:false buttons and the profile avatar trailing", () => {
  const pinned = { ...starButton, description: "Pinned", dropdown: false };
  const html = renderTopBar({
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

// CS-7b hard rule: the fork's kebab supersedes upstream's hamburger
// "Open Menu" expander -- `class: "expander"` action buttons (restored
// verbatim into editor_ui.tsx for merge-tree parity) must never render, in
// either the bar or the kebab, once TopBar filters them out.
test("hamburger style drops an expander action button entirely", () => {
  const expander: ActionButton = {
    icon: featherIcons.Menu,
    description: "Open Menu",
    class: "expander",
    callback: () => {},
  };
  const html = renderTopBar({
    mobileMenuStyle: "hamburger",
    actionButtons: [expander, starButton],
  } as any);
  expect(html).not.toContain("Open Menu");
  expect(barHtml(html)).not.toMatch(/class="expander"/);
  expect(menuHtml(html)).not.toContain("Open Menu");
});
