import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// 2026-09-22 (Task C, cards/tailwind audit): the search sheet's Open and Run
// modes — and the whole mode-picker (leading icon button, m3e-list/
// m3e-divider popup, ARIA, roving-focus keyboard nav) that switched between
// them — are DELETED, not reskinned. Both destinations were redundant here:
// "Open page" is the always-available page picker (Cmd/Ctrl-K) and the
// History tab; "Run command" is the command palette (Cmd/Ctrl-Shift-P). This
// file replaces the old mode-picker-driven e2e/search-sheet.test.ts wholesale
// — none of the mode-switching assertions survive, since the code they
// exercised no longer exists.
//
// The statically-checkable half (the sheet's fixed structure, the
// load-bearing NEGATIVE `no m3e-autocomplete`/`no mode picker` assertions) is
// already covered, green, by the co-located node/vitest render test
// client/components/search_sheet.test.ts. These e2e tests exercise the parts
// that genuinely need a live DOM: opening the sheet, live typed-query
// updates, and real persistence-then-reopen behavior.

test.use({
  spaceFiles: {
    "Alpha.md": "# Alpha\n\nFirst page.\n",
    "Widget.md": "# Widget\n\nA page named Widget.\n",
  },
});

async function openSearchSheet(sbPage: Page): Promise<void> {
  await sbPage
    .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Search"]')
    .click();
  await expect(sbPage.locator("#sb-search-sheet")).toHaveAttribute("open", "");
}

test.describe("Search sheet (client/components/search_sheet.tsx) — search-only", () => {
  test("opens with the Search header, placeholder, and no mode picker at all", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await openSearchSheet(sbPage);

    await expect(sbPage.locator('#sb-search-sheet [slot="header"]')).toHaveText(
      "Search",
    );
    await expect(sbPage.locator("#sb-search-sheet-input")).toHaveAttribute(
      "placeholder",
      "Find in space",
    );

    // The mode-picker trigger, popup, and every earlier attempt's chrome
    // (menu, floating toolbar) are all structurally absent — this is the
    // load-bearing negative assertion for Task C.
    await expect(
      sbPage.locator('#sb-search-sheet m3e-icon-button[title="Change search mode"]'),
    ).toHaveCount(0);
    await expect(sbPage.locator("#sb-search-sheet-mode-list")).toHaveCount(0);
    await expect(sbPage.locator("#sb-search-sheet m3e-menu")).toHaveCount(0);
    await expect(sbPage.locator("#sb-search-sheet m3e-toolbar")).toHaveCount(0);
    await expect(sbPage.locator("#sb-search-sheet m3e-divider")).toHaveCount(
      0,
    );
  });

  test("typing updates the m3e-list with ZERO m3e-autocomplete elements in the DOM", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await openSearchSheet(sbPage);
    await sbPage.locator("#sb-search-sheet-input").fill("Widget");

    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-name"),
    ).toContainText(["Widget"]);
    // The whole point of the original redesign, still true post-Task-C: no
    // dropdown/autocomplete overlay exists anywhere on the page while
    // results are live.
    await expect(sbPage.locator("m3e-autocomplete")).toHaveCount(0);
  });

  test("submitting a search term calls recordSearchTerm and it resurfaces as history on reopen", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await openSearchSheet(sbPage);

    // A term that matches no seeded page, so activateSearchOption's
    // opt-undefined branch closes the sheet deterministically after
    // recording the term (search_modes.ts's activateSearchOption).
    await sbPage.locator("#sb-search-sheet-input").fill("zzzznosuchpage");
    await sbPage.locator("#sb-search-sheet-input").press("Enter");
    await expect(sbPage.locator("#sb-search-sheet")).not.toHaveAttribute(
      "open",
      "",
    );

    await openSearchSheet(sbPage);
    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-name"),
    ).toContainText(["zzzznosuchpage"]);
    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-hint"),
    ).toContainText(["Recent search"]);
  });

  test("Escape closes the sheet", async ({ sbPage, sbServer }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await openSearchSheet(sbPage);
    await sbPage.locator("#sb-search-sheet-input").press("Escape");
    await expect(sbPage.locator("#sb-search-sheet")).not.toHaveAttribute(
      "open",
      "",
    );
  });

  // Feedback #3: the sheet OPENS at ~50vh (detent index 0 of
  // `["half", "full"]`) rather than expanding to full height.
  test("the sheet opens at roughly 50% of the viewport", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await openSearchSheet(sbPage);

    const viewportHeight = sbPage.viewportSize()?.height ?? 0;
    const sheetHeight = await sbPage
      .locator("#sb-search-sheet")
      .evaluate((el) => el.getBoundingClientRect().height);

    expect(sheetHeight).toBeGreaterThan(0);
    expect(sheetHeight).toBeLessThanOrEqual(viewportHeight * 0.6);
  });

  // Task C's other half: the search field inside the drawer goes edge to
  // edge horizontally (only vertical spacing survives). Measured directly
  // against the drawer's own content box rather than a hardcoded pixel
  // margin, so it tracks whatever the sheet's real inset happens to be.
  test("the search bar spans the drawer's full width (no horizontal margin)", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await openSearchSheet(sbPage);

    const sheetBox = await sbPage
      .locator("#sb-search-sheet")
      .evaluate((el) => el.getBoundingClientRect());
    const barBox = await sbPage
      .locator(".sb-search-sheet-bar")
      .evaluate((el) => el.getBoundingClientRect());

    // Within a hair of the sheet's own edges — not the old 16px inset.
    expect(barBox.x - sheetBox.x).toBeLessThan(2);
    expect((sheetBox.x + sheetBox.width) - (barBox.x + barBox.width))
      .toBeLessThan(2);
  });
});
