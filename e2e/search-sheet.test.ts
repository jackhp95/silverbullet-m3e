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
// The statically-checkable half (mode→source wiring, the trigger's ARIA,
// default Open + recentPaths history, default placeholder, and the
// load-bearing NEGATIVE `no m3e-autocomplete` assertion) is already covered,
// green, by the co-located node/vitest render test
// client/components/search_sheet.test.ts. These e2e tests exercise the parts
// that genuinely need a live DOM: opening the sheet via the toolbar, live
// mode-picker interaction, live typed-query updates, and real
// persistence-then-reopen behavior.
//
// The mode picker's own structure is necessarily an E2E concern now, not a
// static one: the picker is rendered only while open, so a static render of a
// freshly-opened sheet contains no popup at all.

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
 * The mode picker popup: an `m3e-list` of `m3e-list-item`s separated by
 * `m3e-divider`s (Jack's round-4 direction, citing
 * https://matraic.github.io/m3e/#/components/list.html). It is rendered ONLY
 * while open, so this locator resolving to zero elements is the assertion that
 * the picker is closed.
 */
function modeList(sbPage: Page) {
  return sbPage.locator("#sb-search-sheet-mode-list");
}

/**
 * Switching mode is: click the leading button, click the target row.
 *
 * The popup works nested inside the modal sheet for the same reason round 3's
 * menu did — it is promoted to the TOP LAYER by `popover="auto"`, so neither
 * the sheet's own scrim/inert handling nor any other sheet in the DOM can
 * cover it. (The search-view's InertController, blamed by the original skip
 * notes on these tests, is gone entirely along with the search-view.)
 */
async function switchMode(
  sbPage: Page,
  mode: "Search" | "Open" | "Run",
): Promise<void> {
  await modeTrigger(sbPage).click();
  await expect(modeList(sbPage)).toBeVisible();
  await modeList(sbPage).locator("m3e-list-item", { hasText: mode }).click();
  // Picking a mode closes the picker, which UNMOUNTS it — wait for that before
  // returning so a caller's next click can't race the popup's teardown.
  await expect(modeList(sbPage)).toHaveCount(0);
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

  // Jack's round-4 direction: the leading icon button opens an `m3e-list` of
  // `m3e-list-item`s separated by `m3e-divider`s — NOT round 3's `m3e-menu`
  // and NOT round 2's floating bottom toolbar (which moved to the navigation
  // sheet, where it replaced tabs — see e2e/navigation-sheet.test.ts).
  //
  // This is the load-bearing structural test for that reversal, and it asserts
  // the divider placement explicitly (2 dividers for 3 rows, i.e. BETWEEN rows
  // and never after the last one) because that is the exact detail the real
  // component docs specify and that a careless refactor gets wrong.
  test("the mode picker is an m3e-list: 3 m3e-list-items, 2 m3e-dividers between them", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);

    // Advertised before being clicked. `listbox` must agree with the popup's
    // own role — these are set by us, since a plain list has no trigger
    // component to set them the way m3e-menu-trigger did.
    await expect(modeTrigger(sbPage)).toHaveAttribute(
      "aria-haspopup",
      "listbox",
    );
    await expect(modeTrigger(sbPage)).toHaveAttribute("aria-expanded", "false");
    // Closed means UNMOUNTED — this is the structural guard against round 1's
    // "closed popup was visible" cascade defect.
    await expect(modeList(sbPage)).toHaveCount(0);

    await modeTrigger(sbPage).click();

    await expect(modeList(sbPage)).toBeVisible();
    await expect(modeTrigger(sbPage)).toHaveAttribute("aria-expanded", "true");

    // It is an m3e-list, and emphatically not an m3e-menu.
    await expect(modeList(sbPage)).toHaveJSProperty("tagName", "M3E-LIST");
    await expect(sbPage.locator("#sb-search-sheet m3e-menu")).toHaveCount(0);

    const items = modeList(sbPage).locator("m3e-list-item");
    await expect(items).toHaveCount(3);
    await expect(items).toContainText(["Search", "Open", "Run"]);
    await expect(modeList(sbPage).locator("m3e-divider")).toHaveCount(2);

    // Dividers sit BETWEEN the rows: the last child is a row, not a rule.
    const lastChildTag = await modeList(sbPage).evaluate(
      (el) => el.lastElementChild?.tagName,
    );
    expect(lastChildTag).toBe("M3E-LIST-ITEM");

    // Selection is carried by listbox/option ARIA — the same roles
    // m3e-selection-list/m3e-list-option would set, driven by us because plain
    // m3e-list-item has no selection of its own (see search_sheet.tsx's
    // mode-model comment). Open is the default mode.
    await expect(modeList(sbPage)).toHaveAttribute("role", "listbox");
    await expect(items.nth(1)).toHaveAttribute("role", "option");
    await expect(items.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(items.nth(0)).toHaveAttribute("aria-selected", "false");
    await expect(items.nth(2)).toHaveAttribute("aria-selected", "false");
  });

  // Picking a row must close the picker as well as switch the mode. Round 1's
  // picker had no reliable close path at all, so this is asserted on its own
  // rather than only implied by switchMode()'s internals.
  test("picking a mode switches the sheet title and closes the picker", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await expect(sbPage.locator("#sb-search-sheet [slot=header]")).toHaveText(
      "Open",
    );

    await switchMode(sbPage, "Run");

    await expect(sbPage.locator("#sb-search-sheet [slot=header]")).toHaveText(
      "Run",
    );
    await expect(modeList(sbPage)).toHaveCount(0);
    await expect(modeTrigger(sbPage)).toHaveAttribute("aria-expanded", "false");
  });

  // Keyboard operability is NOT free here. `m3e-list-item` ships no
  // `Focusable`/`KeyboardClick` mixin (that is what the `m3e-list-option`
  // subclass adds), so building the picker from plain list items means the
  // roving tabindex, the arrow-key handler and the open-focus are all ours —
  // and all regressable. This test exists because the first cut of exactly
  // that code was live-measured as broken: focus stayed on the trigger button,
  // so arrows did nothing and Enter merely re-toggled the popup.
  test("the mode picker is keyboard operable: arrows roam, Enter selects", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await modeTrigger(sbPage).click();
    await expect(modeList(sbPage)).toBeVisible();

    const focusedMode = () =>
      sbPage.evaluate(() =>
        (document.activeElement as HTMLElement | null)?.dataset?.mode ?? null
      );

    // Opening moves focus to the ACTIVE row (Open is the default mode).
    await expect.poll(focusedMode).toBe("open");

    // Arrows roam and wrap at both ends, per the listbox pattern the roles
    // declare.
    await sbPage.keyboard.press("ArrowDown");
    await expect.poll(focusedMode).toBe("run");
    await sbPage.keyboard.press("ArrowDown");
    await expect.poll(focusedMode).toBe("search");
    await sbPage.keyboard.press("ArrowUp");
    await expect.poll(focusedMode).toBe("run");

    // Enter commits the focused row, closes the picker, and hands focus back
    // to the query input so typing continues uninterrupted.
    await sbPage.keyboard.press("Enter");
    await expect(modeList(sbPage)).toHaveCount(0);
    await expect(sbPage.locator("#sb-search-sheet [slot=header]")).toHaveText(
      "Run",
    );
    await expect(sbPage.locator("#sb-search-sheet-input")).toBeFocused();
  });

  // Escape with the picker open closes BOTH the picker and the sheet. This is
  // asserted, not merely tolerated, because it is the one behavior a reader
  // would most reasonably expect to have changed with the picker rewrite — and
  // it did not. It is carried forward unchanged from the m3e-menu round, whose
  // own comment measured the same thing: the picker's `popover="auto"`
  // light-dismiss and the modal sheet's `cancel` both fire for the one
  // keypress. Left as-is deliberately (search_sheet.tsx's Escape branch
  // explains why suppressing one would mean racing two components' internal
  // event ordering for a distinction nobody asked for).
  //
  // Recorded here after a first pass wrongly claimed the sheet survived — that
  // claim came from asserting element COUNT, which stays 1 for a closed sheet
  // because the element remains mounted and only loses its `open` attribute.
  test("Escape closes the mode picker AND the sheet (measured, not aspirational)", async ({
    sbPage,
  }) => {
    await openSearchSheet(sbPage);
    await modeTrigger(sbPage).click();
    await expect(modeList(sbPage)).toBeVisible();

    await sbPage.keyboard.press("Escape");

    await expect(modeList(sbPage)).toHaveCount(0);
    await expect(sbPage.locator("#sb-search-sheet")).not.toHaveAttribute(
      "open",
      "",
    );
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

  // No longer skipped: switchMode() drives the real mode picker, and the click
  // interception the old skip note blamed does not occur (the picker is
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
