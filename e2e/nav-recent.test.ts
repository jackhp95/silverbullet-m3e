import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// Exercises client/components/nav_views/recent.tsx (2026-09-17 nav-bar
// redesign spec §2.5/§3/§5 leaf N6) — the "jump to a page" nav-bar
// destination. A RELOCATION of search_sheet.tsx's "open" mode chrome onto a
// docked `m3e-search-view` (§2.1); none of the option-building/navigate
// logic changed, so these are direct ports of that suite's own coverage:
// - "open mode: typing a page name and pressing Enter navigates to it"
//   (e2e/search-sheet.test.ts:50)
// - "open mode's empty-query history is client.recentPaths, not the default
//   page order" (e2e/search-sheet.test.ts:132)
// plus one new assertion the spec's leaf N6 acceptance criteria adds:
// typing "$" enters the anchor sub-mode (ported from the established
// anchor-mode pattern in e2e/page-picker.test.ts's "Page picker anchor
// mode" describe block, which exercises the exact same
// buildAnythingPickerOptions/useAnchorOptions codepath this view reuses).

function recentNavItem(sbPage: import("@playwright/test").Page) {
  return sbPage.locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]');
}

test.describe("Recent nav destination", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome to the wondrous world of SilverBullet",
      "Fruit Apple.md": "apple",
      "Fruit Banana.md": "banana",
      "Fruit Cherry.md": "cherry",
    },
  });

  test("typing a page name and pressing Enter navigates to it", async ({
    sbPage,
  }) => {
    const panel = sbPage.locator(".sb-nav-panel");
    await recentNavItem(sbPage).click();
    await expect(panel).toBeVisible();

    const input = sbPage.locator("#sb-nav-recent-input");
    await input.click();
    await sbPage.keyboard.type("Fruit Cherry", { delay: 30 });
    await expect(
      panel.locator(".sb-option .sb-name", { hasText: "Fruit Cherry" }),
    ).toBeVisible();

    await sbPage.keyboard.press("Enter");
    // Selecting a result closes the nav panel (navigateToAnythingPickerName's
    // close callback dispatches close-nav-panel) — the whole `.sb-nav-panel`
    // div unmounts, same assertion shape as e2e/nav-bar.test.ts's own
    // "Escape closes the panel" test.
    await expect(panel).toHaveCount(0);
    await expect(sbPage.locator("#sb-current-page input.sb-input"))
      .toHaveValue("Fruit Cherry");
  });

  test("empty-query history is client.recentPaths, not the default page order", async ({
    sbPage,
    sbServer,
  }) => {
    // Visit a page first so it lands in recentPaths.
    await gotoSilverBulletPage(sbPage, sbServer, "Fruit Apple");

    const panel = sbPage.locator(".sb-nav-panel");
    await recentNavItem(sbPage).click();
    await expect(panel).toBeVisible();

    // The docked search-view only shows its results/history list once
    // opened (focusing the input opens it) — same real-user flow as typing.
    const input = sbPage.locator("#sb-nav-recent-input");
    await input.click();

    // Empty query -> history, filtered to recentPaths (current page
    // excluded) — recent.tsx's history builder, ported verbatim from
    // search_sheet.tsx's "open" mode.
    await expect(
      panel.locator(".sb-option .sb-hint", { hasText: "Recent" }).first(),
    ).toBeVisible();
  });
});

test.describe("Recent nav destination anchor mode", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome to the wondrous world of SilverBullet",
      "Finances.md": "- [ ] $rent Pay rent by the 1st\n",
      "Ideas.md": "A paragraph holding $spark in it.\n",
    },
  });

  test("typing $ switches to anchor mode", async ({ sbPage }) => {
    const panel = sbPage.locator(".sb-nav-panel");
    await recentNavItem(sbPage).click();
    await expect(panel).toBeVisible();

    const input = sbPage.locator("#sb-nav-recent-input");
    await input.click();
    await sbPage.keyboard.type("$", { delay: 30 });

    // Anchors are indexed asynchronously on first load, so lean on
    // Playwright's auto-retry here rather than a fixed wait (same reasoning
    // as e2e/page-picker.test.ts's own anchor-mode test).
    const names = panel.locator(".sb-option .sb-name");
    await expect(names.filter({ hasText: "$rent" })).toBeVisible();
    await expect(names.filter({ hasText: "$spark" })).toBeVisible();

    // Pages must be gone while in anchor mode.
    await expect(names.filter({ hasText: "Finances" })).toHaveCount(0);
  });
});
