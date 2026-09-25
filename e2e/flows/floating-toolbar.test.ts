import {
  assertNoOverlap,
  closePicker,
  currentPage,
  isUpgraded,
  navInput,
} from "../fixtures/actions.ts";
import { expect, test } from "../fixtures/core.ts";

// Rewrite of fork `e2e/floating-toolbar.test.ts` (`4cfc3763`) for CS-6
// (docs/plans/2026-09-24-core-shell-decomposition.md, decision D3 §5):
// Navigation and Notifications buttons are gone; Search opens main's own
// `NavRoot` page picker (not the fork's dead search sheet), Journal runs
// "Journal: Today".

/** Today's date as YYYY-MM-DD, matching the built-in journal page name. */
function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

test.describe("Floating toolbar (client/components/floating_toolbar.tsx, CS-6)", () => {
  test("renders exactly 2 icon-buttons in .sb-floating-toolbar, in order Search/Journal, upgraded", async ({
    sbPage,
  }) => {
    await expect(isUpgraded(sbPage, ".sb-floating-toolbar")).resolves.toBe(
      true,
    );
    const buttons = sbPage.locator(".sb-floating-toolbar m3e-icon-button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveAttribute("aria-label", "Search");
    await expect(buttons.nth(1)).toHaveAttribute("aria-label", "Journal");
  });

  test("Search button opens the page picker", async ({ sbPage }) => {
    await sbPage
      .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Search"]')
      .click();
    await expect(navInput(sbPage)).toBeVisible();
    await expect(navInput(sbPage)).toHaveAttribute("placeholder", /Page/, {
      timeout: 20_000,
    });
    await closePicker(sbPage);
  });

  test('Journal button runs "Journal: Today"', async ({ sbPage }) => {
    await sbPage
      .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Journal"]')
      .click();

    await expect(currentPage(sbPage)).toHaveValue(
      new RegExp(`^Journal/${today()}$`),
    );
  });

  test(".sb-floating-toolbar does not overlap #sb-top", async ({
    sbPage,
  }) => {
    await assertNoOverlap(sbPage, ".sb-floating-toolbar", "#sb-top");
  });
});
