import { expect, test } from "./fixtures.ts";

// The pre-existing version of this file (2026-09-16 toolbar-search-feedback
// spec, leaf L13) tested a since-deleted 4-item toolbar (read-only/search/
// journal/add) that no longer exists — that design was itself superseded by
// the nav-bar redesign (N2 deleted floating_toolbar.tsx outright), which is
// in turn reverted by docs/plans/2026-09-17-vertical-toolbar-search-nav-
// redesign-spec.md (this plan). Both prior versions are stale; there is no
// carry-forward content here.
//
// This plan's `client/components/floating_toolbar.tsx` (leaf V4, spec §2.1)
// is REAL and unit-tested (client/components/floating_toolbar.test.ts, a
// Preact render test) AND, as of V8, wired live into `client/editor_ui.tsx`.
// These are now real e2e assertions against the live app (leaf V9, spec §5
// P3) — no longer `test.fixme`.

/** Today's date as YYYY-MM-DD, matching the built-in journal page name. */
function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

test.describe("Floating toolbar (client/components/floating_toolbar.tsx, V4)", () => {
  test("renders exactly 4 icon-buttons in .sb-floating-toolbar, in order Search/Navigation/Journal/Notifications", async ({
    sbPage,
  }) => {
    const buttons = sbPage.locator(".sb-floating-toolbar m3e-icon-button");
    await expect(buttons).toHaveCount(4);
    await expect(buttons.nth(0)).toHaveAttribute("aria-label", "Search");
    await expect(buttons.nth(1)).toHaveAttribute("aria-label", "Navigation");
    await expect(buttons.nth(2)).toHaveAttribute("aria-label", "Journal");
    await expect(buttons.nth(3)).toHaveAttribute("aria-label", "Notifications");
  });

  test("Search button opens the search sheet", async ({ sbPage }) => {
    await sbPage
      .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Search"]')
      .click();
    await expect(sbPage.locator("#sb-search-sheet")).toHaveAttribute(
      "open",
      "",
    );
  });

  test('Journal button runs "Journal: Today"', async ({ sbPage }) => {
    await sbPage
      .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Journal"]')
      .click();

    const expectedPage = `Journal/${today()}`;
    await expect(sbPage.locator("#sb-current-page input.sb-input")).toHaveValue(
      expectedPage,
    );
  });
});
