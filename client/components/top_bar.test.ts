import { h } from "preact";
import * as featherIcons from "preact-feather";
import { render } from "preact-render-to-string";
import { expect, test } from "vitest";
import { deriveChrome } from "../m3e_chrome/chrome_model.ts";
import { type ActionButton, TopBar } from "./top_bar.tsx";

// SSR (preact-render-to-string) coverage for CS-5's small `m3e-app-bar`
// reskin — no `@m3e/web` import in top_bar.tsx itself (see this file's
// sibling status, scripts/reconcile/builder-common.md hazard 1), so these
// custom-element tags render as plain, inert HTML strings under vitest's
// DOM-less `node` environment; that's exactly what's being asserted here
// (upgrade behavior is the e2e suite's job, e2e/flows/app-bar.test.ts).
//
// The breadcrumb/subtitle/read-only-toggle/kebab-menu cases that used to
// live here moved to `client/m3e_chrome/app_bar_parts.test.ts`, which
// exercises those parts through TopBar's single `chrome: AppBarChrome` prop
// end-to-end via `deriveChrome`. This file keeps the cases that are about
// TopBar's own remaining render body: the bar shell, sync progress, the
// offline chip, and action-button placement.

const noop = () => {};

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
  chrome: deriveChrome({
    pageName: "Hello",
    isReadOnly: false,
    accent: "#3569b8",
    push: { state: "not-configured", pending: false },
    lastModified: "2026-09-20T12:00:00.000Z",
    bodyText: "hello world",
    actions: {
      openPageNavigator: noop,
      openConfig: noop,
      togglePush: noop,
    },
  }).appBar,
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
