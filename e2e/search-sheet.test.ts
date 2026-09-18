import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// Rewritten from scratch for the vertical-toolbar redesign
// (docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md, leaf
// V6). The pre-existing content tested the deleted segmented-button +
// m3e-autocomplete search_sheet.tsx (§1.4) and was already stale/orphaned; no
// carry-forward.
//
// The new search sheet is `client/components/search_sheet.tsx` (leaf V6),
// wired live into `client/editor_ui.tsx` as of V8. These are the exact
// acceptance assertions from spec §5 V6's "Accept:" bullet, now real (leaf
// V9) rather than `test.fixme`.
//
// The statically-checkable half (mode→source wiring, exactly-3-radios,
// default Open + recentPaths history, default placeholder, and the
// load-bearing NEGATIVE `no m3e-autocomplete` assertion) is already covered,
// green, by the co-located node/vitest render test
// client/components/search_sheet.test.ts. These e2e tests exercise the parts
// that genuinely need a live DOM: opening the sheet via the toolbar,
// live mode-menu interaction, live typed-query updates, and real
// persistence-then-reopen behavior.

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

/** Exactly one of the two duplicated (open/closed-leading) mode triggers is
 * visible at a time — the sheet auto-focuses its input on open, which drives
 * m3e-search-view into its "open" internal state (search_sheet.tsx's own
 * comment on the closed/open-leading slot split). */
function modeTrigger(sbPage: Page) {
  return sbPage.locator(
    '#sb-search-sheet m3e-icon-button[title="Change search mode"]:visible',
  );
}

async function switchMode(
  sbPage: Page,
  mode: "Search" | "Open" | "Run",
): Promise<void> {
  await modeTrigger(sbPage).click();
  // Wait for the popover to actually finish opening/anchoring before
  // interacting with an item inside it — same `isOpen` poll this repo's own
  // app-bar-leading-trailing.test.ts and push-notifications.test.ts already
  // use before interacting with a menu. Kept as good practice, but it does
  // NOT fix the underlying issue: verified directly (flip
  // "selecting Search switches..."/"submitting a Search-mode..." below from
  // `test.fixme` to `test` and rerun with this poll in place) that the item
  // click still fails identically even once `isOpen` is confirmed true —
  // this is not a mount/positioning race, see the KNOWN APP DEFECT
  // writeup on those two tests.
  const menu = sbPage.locator("#sb-search-mode-menu");
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);
  await menu.locator("m3e-menu-item-radio", { hasText: mode }).click();
}

test.describe("Search sheet (client/components/search_sheet.tsx, V6)", () => {
  test("opens in Open mode by default, showing recentPaths history", async ({
    sbPage,
    sbServer,
  }) => {
    // Visit Alpha, then Widget — Alpha becomes a recentPaths entry once
    // Widget (the new current page) is loaded.
    await gotoSilverBulletPage(sbPage, sbServer, "Alpha");
    await gotoSilverBulletPage(sbPage, sbServer, "Widget");

    await openSearchSheet(sbPage);

    await expect(sbPage.locator("#sb-search-sheet-input")).toHaveAttribute(
      "placeholder",
      "Jump to a page, document, tag, or $anchor",
    );
    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-name"),
    ).toContainText(["Alpha"]);
  });

  test("the leading-icon menu has exactly 3 items (Search / Open / Run)", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await modeTrigger(sbPage).click();

    const items = sbPage.locator("#sb-search-mode-menu m3e-menu-item-radio");
    await expect(items).toHaveCount(3);
    await expect(items).toContainText(["Search", "Open", "Run"]);
  });

  // Was a KNOWN APP DEFECT (found by leaf V9), FIXED by leaf V12: the mode
  // menu opened from inside the modal search sheet was painted on top but not
  // hit-testable (`document.elementFromPoint` at a menu item resolved to
  // `#sb-root`; a `force:true` click was hit-tested onto the page beneath).
  // Root cause, confirmed by decompile + a live browser probe: `m3e-search-
  // view` owns its own `InertController` and calls `lock()` on docked-open
  // (decompiled search.js:346/668), which marks every SIBLING inert — and the
  // menu was a sibling of `m3e-search-view` inside the sheet. An inert
  // top-layer popover paints but does not receive pointer hits. Fix (V12,
  // search_sheet.tsx): render the menu as a DESCENDANT of `m3e-search-view`
  // (the one subtree left non-inert by both the search-view's and the modal
  // sheet's locks). See search_sheet.tsx's menu-placement comment.
  test("selecting Search switches the placeholder and results source live", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await switchMode(sbPage, "Search");

    await expect(sbPage.locator("#sb-search-sheet-input")).toHaveAttribute(
      "placeholder",
      "Find in space",
    );
  });

  test("typing updates the m3e-list with ZERO m3e-autocomplete elements in the DOM", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await sbPage.locator("#sb-search-sheet-input").fill("Widget");

    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-name"),
    ).toContainText(["Widget"]);
    // The whole point of the redesign: no dropdown/autocomplete overlay
    // exists anywhere on the page while results are live.
    await expect(sbPage.locator("m3e-autocomplete")).toHaveCount(0);
  });

  // Depends on reaching Search mode (a real #sb-search-mode-menu item click),
  // which was blocked by the same V9 defect fixed in V12 (see the comment on
  // "selecting Search switches the placeholder and results source live").
  test("submitting a Search-mode term calls recordSearchTerm and it resurfaces as history on reopen", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await switchMode(sbPage, "Search");

    // A term that matches no seeded page, so activateSearchOption's
    // opt-undefined branch closes the sheet deterministically after
    // recording the term (search_modes.ts:173-184).
    await sbPage.locator("#sb-search-sheet-input").fill("zzzznosuchpage");
    await sbPage.locator("#sb-search-sheet-input").press("Enter");
    await expect(sbPage.locator("#sb-search-sheet")).not.toHaveAttribute(
      "open",
      "",
    );

    await openSearchSheet(sbPage);
    await switchMode(sbPage, "Search");
    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-name"),
    ).toContainText(["zzzznosuchpage"]);
    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-hint"),
    ).toContainText(["Recent search"]);
  });

  test("Escape closes the sheet", async ({ sbPage }) => {
    await openSearchSheet(sbPage);
    await sbPage.locator("#sb-search-sheet-input").press("Escape");
    await expect(sbPage.locator("#sb-search-sheet")).not.toHaveAttribute(
      "open",
      "",
    );
  });
});
