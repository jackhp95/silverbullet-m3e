import { expect, test } from "./fixtures.ts";

// Exercises client/components/nav_views/search.tsx (2026-09-17 nav-bar
// redesign spec §5, leaf N7) — the nav bar's "Search" destination panel.
// Ported from e2e/search-sheet.test.ts's "search mode: submitting a term
// records it, and it resurfaces as history on reopen" test (that file's own
// coverage of search_sheet.tsx's "search" mode, the logic this leaf
// relocates — see that file, left untouched, for the "open"/"run" modes
// this leaf does NOT touch). Opened here via the nav bar's "Search" item
// (nav_bar.tsx) instead of the old Ctrl/Cmd-Shift-/ sheet keybinding.
test.describe("Nav bar Search panel (N7)", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome to the wondrous world of SilverBullet",
      "Fruit Apple.md": "apple",
      "Fruit Banana.md": "banana",
      "Fruit Cherry.md": "cherry",
    },
  });

  test("submitting a term records it via recordSearchTerm, and it resurfaces as history on reopen", async ({
    sbPage,
  }) => {
    const searchNavItem = sbPage.locator(
      '.sb-nav-bar m3e-nav-item[aria-label="Search"]',
    );
    const panel = sbPage.locator(".sb-nav-panel");
    const input = sbPage.locator("#sb-nav-search-input");

    await searchNavItem.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Search");

    await input.click();
    await sbPage.keyboard.type("banana", { delay: 30 });
    // Search mode fuzzy-matches page names too, so "Fruit Banana" should
    // show up as a candidate result underneath.
    await expect(
      panel.locator(".sb-option .sb-name", { hasText: "Fruit Banana" }),
    ).toBeVisible();

    await sbPage.keyboard.press("Enter");
    // Selecting/submitting closes the nav panel (N1's close-nav-panel
    // action — see editor_ui.tsx's SearchView wiring).
    await expect(sbPage.locator(".sb-nav-panel")).toHaveCount(0);

    // The submitted term is recorded into client.recentSearchTerms and
    // resurfaces as the Search panel's empty-query history on reopen.
    await searchNavItem.click();
    await expect(panel).toBeVisible();
    await expect(
      panel.locator(".sb-option .sb-name", { hasText: "banana" }),
    ).toBeVisible();
  });

  test("empty query placeholder reads \"Find in space\", and honestly scopes to name/tag matching (no full-text search)", async ({
    sbPage,
  }) => {
    const searchNavItem = sbPage.locator(
      '.sb-nav-bar m3e-nav-item[aria-label="Search"]',
    );
    const input = sbPage.locator("#sb-nav-search-input");

    await searchNavItem.click();
    await expect(input).toHaveAttribute("placeholder", "Find in space");

    // "apple"/"banana"/"cherry" are only in each page's BODY text, not its
    // name/tags — this fallback is name/tag fuzzy matching only, so a
    // page-body-only term should surface no result rows.
    await input.click();
    await sbPage.keyboard.type("wondrous", { delay: 30 });
    await expect(sbPage.locator(".sb-nav-panel .sb-option")).toHaveCount(0);
  });
});
