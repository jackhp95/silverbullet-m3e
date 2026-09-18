import { test } from "./fixtures.ts";

// client/components/navigation_sheet.tsx (leaf V7, docs/plans/2026-09-17-
// vertical-toolbar-search-nav-redesign-spec.md §2.6/§2.7/§2.8/§5) is REAL and
// unit-tested today — see the co-located, currently-passing
// client/components/navigation_sheet.test.ts and
// client/components/nav_views/{history,changelog,sitemap}_tab.test.ts (Preact
// render tests via preact-render-to-string, same rationale
// e2e/floating-toolbar.test.ts already documents: this repo's e2e fixtures
// (e2e/fixtures.ts's sbServer/sbPage) only know how to boot the full
// SilverBullet app shell, and there is no pattern anywhere in e2e/ for
// mounting a single component in isolation).
//
// But the component is NOT yet wired into the live app
// (client/editor_ui.tsx doesn't render it — that's leaf V8, a later, separate
// worktree, per the spec's §5 P2/§5.1, same pattern V4/V5/V6 already used). A
// real sbPage today has no #sb-navigation-sheet in its DOM at all, so any
// assertion here would either vacuously fail or assert on nothing.
//
// `test.fixme` below records the exact acceptance assertions from the spec's
// §5 V7 "Accept:" bullet, verbatim, for V9 (e2e reconciliation, once V8 wires
// NavigationSheet into editor_ui.tsx) to un-skip (or supersede, if V8's
// wiring changes the details) and run for real.

test.describe("Navigation bottom sheet (client/components/navigation_sheet.tsx, V7)", () => {
  test.fixme("opening the sheet shows History tab selected by default with recentPaths rows, no input box present, once V8 wires NavigationSheet into editor_ui.tsx", async ({
    sbPage,
  }) => {
    const sheet = sbPage.locator("#sb-navigation-sheet");
    // await sbPage.getByRole("button", { name: "Navigation" }).click();
    // await expect(sheet).toBeVisible();
    // await expect(sbPage.getByRole("tab", { name: "History" })).toHaveAttribute("selected", "");
    // await expect(sheet.locator("m3e-tab-panel#sb-nav-history m3e-list-item")).toHaveCount(...recentPaths length);
    // await expect(sheet.locator("input")).toHaveCount(0);
    void sheet;
  });

  test.fixme("clicking Changelog shows pages sorted by lastModified descending with no 'who'/author column rendered anywhere (proves the honest v1 scoping, not a silent omission)", async ({
    sbPage,
  }) => {
    const sheet = sbPage.locator("#sb-navigation-sheet");
    // await sbPage.getByRole("tab", { name: "Changelog" }).click();
    // const rows = sheet.locator("m3e-tab-panel#sb-nav-changelog m3e-list-item");
    // ... assert row order matches pages sorted by lastModified descending ...
    // await expect(sheet.locator("m3e-tab-panel#sb-nav-changelog")).not.toContainText(/author|who/i);
    void sheet;
  });

  test.fixme("clicking Sitemap shows a row count equal to viewState.allPages.length and a 'commonly navigated' lead section ordered by lastOpened descending", async ({
    sbPage,
  }) => {
    const sheet = sbPage.locator("#sb-navigation-sheet");
    // await sbPage.getByRole("tab", { name: "Sitemap" }).click();
    // const allRows = sheet.locator("m3e-tab-panel#sb-nav-sitemap .sb-sitemap-all m3e-list-item");
    // await expect(allRows).toHaveCount(<viewState.allPages.length>);
    // const leadRows = sheet.locator("m3e-tab-panel#sb-nav-sitemap .sb-sitemap-commonly-navigated m3e-list-item");
    // ... assert leadRows order matches pages with lastOpened sorted descending ...
    void sheet;
  });
});
