import { test } from "./fixtures.ts";

// Rewritten from scratch for the vertical-toolbar redesign
// (docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md, leaf
// V6). The pre-existing content tested the deleted segmented-button +
// m3e-autocomplete search_sheet.tsx (§1.4) and was already stale/orphaned; no
// carry-forward.
//
// The new search sheet is `client/components/search_sheet.tsx` (leaf V6):
// a modal m3e-bottom-sheet hosting one `m3e-search-view mode="docked"
// contained`, a leading-icon m3e-menu-trigger opening a 3-item Search/Open/Run
// mode menu (m3e-menu-item-radio in an m3e-menu-item-group), an Input in
// slot="input", and an m3e-list of NavListRow rows below — query-empty shows
// per-mode history, a typed query shows per-mode live results, and there is NO
// m3e-autocomplete/dropdown anywhere in the composition (the whole point of
// the redesign, §2.4).
//
// This component is NOT yet wired into the live app (client/editor_ui.tsx) —
// that is leaf V8, a later, separate worktree (same pattern V4/V5/V7 used). A
// real `sbPage` today therefore has no `#sb-search-sheet` in its DOM at all,
// so the interactive assertions below would assert on nothing. They are left
// as `test.fixme` (visible-but-skipped in the runner summary, not silently
// deleted) recording the EXACT acceptance criteria from spec §5 V6's "Accept:"
// bullet; leaf V9 (e2e reconciliation, §5 P3) un-skips them — or supersedes
// them if V8's wiring changes the selectors — and runs them for real once the
// toolbar's Search button opens the sheet in the live app.
//
// The statically-checkable half (mode→source wiring, exactly-3-radios,
// default Open + recentPaths history, default placeholder, and the
// load-bearing NEGATIVE `no m3e-autocomplete` assertion) is already covered,
// green, today by the co-located node/vitest render test
// client/components/search_sheet.test.ts.

test.describe("Search sheet (client/components/search_sheet.tsx, V6)", () => {
  test.fixme(
    "opens in Open mode by default, showing recentPaths history (once V8 wires the toolbar Search button)",
    async ({ sbPage }) => {
      // Open the sheet via the floating toolbar's Search button (V4/V8).
      // const sheet = sbPage.locator("#sb-search-sheet");
      // await expect(sheet).toHaveAttribute("open", "");
      // Default placeholder is the Open-mode placeholder.
      // await expect(sbPage.locator("#sb-search-sheet-input")).toHaveAttribute(
      //   "placeholder",
      //   "Jump to a page, document, tag, or $anchor",
      // );
      // Empty query -> recentPaths history rows in the sheet's own m3e-list.
      // await expect(
      //   sheet.locator(".sb-search-sheet-list .sb-name"),
      // ).toContainText(["<a recent page name>"]);
      void sbPage;
    },
  );

  test.fixme(
    "the leading-icon menu has exactly 3 items (Search / Open / Run)",
    async ({ sbPage }) => {
      // await sbPage.locator("#sb-search-sheet m3e-menu-trigger").first().click();
      // const items = sbPage.locator("#sb-search-mode-menu m3e-menu-item-radio");
      // await expect(items).toHaveCount(3);
      // await expect(items).toContainText(["Search", "Open", "Run"]);
      void sbPage;
    },
  );

  test.fixme(
    "selecting Search switches the placeholder and results source live",
    async ({ sbPage }) => {
      // Open the menu, click the "Search" radio.
      // await sbPage.locator("#sb-search-sheet m3e-menu-trigger").first().click();
      // await sbPage.locator("#sb-search-mode-menu m3e-menu-item-radio", {
      //   hasText: "Search",
      // }).click();
      // Placeholder flips to the Search-mode placeholder immediately.
      // await expect(sbPage.locator("#sb-search-sheet-input")).toHaveAttribute(
      //   "placeholder",
      //   "Find in space",
      // );
      // Empty-query history source is now recentSearchTerms, not recentPaths.
      void sbPage;
    },
  );

  test.fixme(
    "typing updates the m3e-list with ZERO m3e-autocomplete elements in the DOM",
    async ({ sbPage }) => {
      // await sbPage.locator("#sb-search-sheet-input").fill("wid");
      // Results render inside the sheet's own slotted list...
      // await expect(
      //   sbPage.locator("#sb-search-sheet .sb-search-sheet-list .sb-name"),
      // ).not.toHaveCount(0);
      // ...and crucially, NO dropdown/autocomplete overlay exists anywhere —
      // this is the exact defect class prior attempts shipped (§2.4).
      // await expect(sbPage.locator("m3e-autocomplete")).toHaveCount(0);
      void sbPage;
    },
  );

  test.fixme(
    "submitting a Search-mode term calls recordSearchTerm and it resurfaces as history on reopen",
    async ({ sbPage }) => {
      // Switch to Search mode, type a term, press Enter (or activate a row).
      // Reopen the sheet in Search mode -> the term is now a "Recent search"
      // history row (client.recordSearchTerm persisted it).
      void sbPage;
    },
  );

  test.fixme("Escape closes the sheet", async ({ sbPage }) => {
    // await sbPage.locator("#sb-search-sheet-input").press("Escape");
    // await expect(sbPage.locator("#sb-search-sheet")).not.toHaveAttribute(
    //   "open",
    //   "",
    // );
    void sbPage;
  });
});
