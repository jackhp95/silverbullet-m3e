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

/**
 * The mode picker is the search bar's single leading icon button. There is
 * exactly one of them now — the open/closed-leading slot split existed only
 * for `m3e-search-view`'s internal open/closed states, and the search-view is
 * gone (replaced by the stateless `m3e-search-bar`), so no `:visible`
 * disambiguation is needed.
 */
function modeTrigger(sbPage: Page) {
  return sbPage.locator(
    '#sb-search-sheet m3e-icon-button[title="Change search mode"]',
  );
}

/**
 * The mode picker is a real `m3e-menu` again (Jack's round-3 direction).
 * It works nested inside the sheet now for two reasons that previously did
 * not hold: the search-view's InertController — which used to inert the whole
 * subtree while docked-open — no longer exists, and the menu promotes itself
 * to the top layer via the native popover API, so the modal sheet's own
 * scrim/inert handling does not reach it.
 *
 * Switching mode is: click the leading button, click the target radio item.
 */
async function switchMode(
  sbPage: Page,
  mode: "Search" | "Open" | "Run",
): Promise<void> {
  await modeTrigger(sbPage).click();
  const menu = sbPage.locator("#sb-search-sheet-mode-menu");
  await expect(menu).toBeVisible();
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

  // Jack's round-3 direction: the leading icon button opens a REAL
  // `m3e-menu` of the three modes, and the floating bottom toolbar that
  // round 2 put here is gone (it moved to the navigation sheet, where it
  // replaced tabs — see e2e/navigation-sheet.test.ts).
  //
  // This test is no longer skipped. The two reasons it used to be are both
  // resolved, not worked around: the `m3e-search-view` InertController that
  // locked the picker's subtree is gone with the search-view itself, and the
  // second-sheet click interception the old skip note suspected does not
  // occur because the menu is top-layer promoted (native popover), which
  // puts it above any other sheet in the DOM regardless of stacking.
  test("the mode picker is an m3e-menu with exactly 3 radio items (Search / Open / Run)", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);

    // The button advertises its popup before being clicked — m3e-menu-trigger
    // sets this on its PARENT element, which is how we know the empty-trigger
    // composition actually bound to the icon button.
    await expect(modeTrigger(sbPage)).toHaveAttribute("aria-haspopup", "menu");
    await expect(modeTrigger(sbPage)).toHaveAttribute("aria-expanded", "false");

    await modeTrigger(sbPage).click();

    const menu = sbPage.locator("#sb-search-sheet-mode-menu");
    await expect(menu).toBeVisible();
    await expect(modeTrigger(sbPage)).toHaveAttribute("aria-expanded", "true");

    const items = menu.locator("m3e-menu-item-radio");
    await expect(items).toHaveCount(3);
    await expect(items).toContainText(["Search", "Open", "Run"]);

    // Selection is carried by the radio role, not a painted check column.
    await expect(items.nth(1)).toHaveAttribute("role", "menuitemradio");
    await expect(items.nth(1)).toHaveAttribute("aria-checked", "true");
    await expect(items.nth(0)).toHaveAttribute("aria-checked", "false");
    await expect(items.nth(2)).toHaveAttribute("aria-checked", "false");
  });

  // The floating bottom toolbar belongs to the navigation sheet now. This is
  // the load-bearing negative assertion for that reversal.
  test("NO floating mode toolbar remains in the search sheet", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await expect(sbPage.locator("#sb-search-sheet m3e-toolbar")).toHaveCount(0);
    await expect(
      sbPage.locator("#sb-search-sheet .sb-search-sheet-modes"),
    ).toHaveCount(0);
  });

  // Feedback #3: the sheet OPENS at ~50vh (detent index 0 of
  // `["half", "full"]`) rather than expanding to full height. It can still be
  // dragged up to `full` — the second detent is what makes the handle
  // draggable at all (see navigation-sheet.test.ts's drag test).
  test("the sheet opens at roughly 50% of the viewport", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);

    const viewportHeight = sbPage.viewportSize()?.height ?? 0;
    const sheetHeight = await sbPage
      .locator("#sb-search-sheet")
      .evaluate((el) => el.getBoundingClientRect().height);

    expect(sheetHeight).toBeGreaterThan(0);
    // Generous tolerance (detent math includes a top-inset subtraction) —
    // the load-bearing assertion is "well under full height", not exact px.
    expect(sheetHeight).toBeLessThanOrEqual(viewportHeight * 0.6);
  });

  // Feedback #2 ("no back-arrow in the search bar") and feedback #5 ("the
  // search bar drifts as the sheet animates") were both artifacts of
  // `m3e-search-view`'s docked-open state machine: the back-arrow was its
  // built-in `_renderIconOrBackButton`, and the drift came from its
  // mid-animation promotion of the bar into the top layer. The two e2e tests
  // that guarded them poked at `.sb-search-sheet-view`'s shadow root and are
  // DELETED rather than rewritten — that element no longer exists in the
  // composition, so there is no shadow root left to assert against, and both
  // defects are now structurally impossible rather than merely fixed. The
  // plain `m3e-search-bar` that replaced it has no open/closed states, no
  // back-arrow, and no top-layer promotion at all.

  test("selecting Search switches the placeholder and the header title live", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await switchMode(sbPage, "Search");

    await expect(sbPage.locator("#sb-search-sheet-input")).toHaveAttribute(
      "placeholder",
      "Find in space",
    );
    // The active mode is reflected in the sheet's own header title, which is
    // what makes the icon-only leading button legible.
    await expect(sbPage.locator('#sb-search-sheet [slot="header"]')).toHaveText(
      "Search",
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

  // No longer skipped: switchMode() drives the real m3e-menu now, and the
  // click interception the old skip note blamed does not occur (the menu is
  // top-layer promoted via the native popover API).
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
