import { expect, test } from "./fixtures.ts";

// Exercises client/components/floating_toolbar.tsx's reduced 4-item state
// (spec §2 items 2+12, plan leaf L13 — the final leaf of
// docs/plans/2026-09-16-toolbar-search-feedback-spec.md): Journal, Add,
// Search, Read-only toggle, and nothing else. CONFIG actionButtons and the
// push toggle moved to the app-bar kebab (see
// e2e/app-bar-leading-trailing.test.ts, e2e/push-notifications.test.ts); the
// recent-pages menu is subsumed by search_sheet.tsx's own "Open" mode
// history (e2e/search-sheet.test.ts) — this file only covers the toolbar's
// own 4 buttons, not those other entry points' full behavior.

/** Today's date as YYYY-MM-DD, matching the default journal page name. */
function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

test.describe("Floating toolbar (reduced to 4 items)", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Welcome",
    },
  });

  test("renders exactly 4 icon-buttons: read-only toggle, search, journal, add", async ({
    sbPage,
  }) => {
    const buttons = sbPage.locator(".sb-floating-toolbar m3e-icon-button");
    await expect(buttons).toHaveCount(4);

    await expect(
      sbPage.locator(
        '.sb-floating-toolbar m3e-icon-button[aria-label="Read-only mode is off — click to turn on"]',
      ),
    ).toHaveCount(1);
    await expect(
      sbPage.locator('.sb-floating-toolbar m3e-icon-button[aria-label="Search"]'),
    ).toHaveCount(1);
    await expect(
      sbPage.locator(
        '.sb-floating-toolbar m3e-icon-button[aria-label="New journal entry"]',
      ),
    ).toHaveCount(1);
    await expect(
      sbPage.locator('.sb-floating-toolbar m3e-icon-button[aria-label="New…"]'),
    ).toHaveCount(1);
  });

  test("Add opens the item-capture bottom sheet", async ({ sbPage }) => {
    const sheet = sbPage.locator("#sb-item-capture-sheet");
    await expect(sheet).not.toBeVisible();

    await sbPage.locator('.sb-floating-toolbar [aria-label="New…"]').click();

    await expect(sheet).toBeVisible();
  });

  test("Search opens the consolidated search sheet, defaulting to Open mode", async ({
    sbPage,
  }) => {
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).not.toBeVisible();

    await sbPage.locator('.sb-floating-toolbar [aria-label="Search"]').click();

    await expect(sheet).toBeVisible();
    await expect(sbPage.getByRole("radio", { name: "Open" })).toBeChecked();
  });

  test("Journal jumps straight to today's journal page", async ({ sbPage }) => {
    // "Journal: Today" (libraries/Library/Std/Journal/Journal.md) is a
    // space-lua command evaluated from a library page, not a core
    // editor_commands.ts registration — it can still be registering for a
    // moment after the editor itself reports ready (same reason
    // e2e/guide-journaling.test.ts's own helper waits for the command to
    // appear in the palette before invoking it). Retry the click rather than
    // assume it's already registered the instant the page loads.
    const journalButton = sbPage.locator(
      '.sb-floating-toolbar [aria-label="New journal entry"]',
    );
    const pageNameInput = sbPage.locator("#sb-current-page input.sb-input");
    const expectedPage = `Journal/${today()}`;

    await expect
      .poll(
        async () => {
          await journalButton.click();
          return await pageNameInput.inputValue();
        },
        { timeout: 15_000 },
      )
      .toBe(expectedPage);
  });

  test("Read-only toggle flips read-only mode", async ({ sbPage }) => {
    const toggle = sbPage.locator(
      '.sb-floating-toolbar [aria-label="Read-only mode is off — click to turn on"]',
    );
    await expect(toggle).toHaveCount(1);
    await expect(
      sbPage.evaluate(() => document.documentElement.dataset.readOnly),
    ).resolves.toBe("off");

    await toggle.click();

    // `document.documentElement.dataset.readOnly` (client/editor_ui.tsx) is
    // the real effect the toggle drives, not just a label swap.
    await expect
      .poll(() =>
        sbPage.evaluate(() => document.documentElement.dataset.readOnly)
      )
      .toBe("on");
    await expect(
      sbPage.locator(
        '.sb-floating-toolbar [aria-label="Read-only mode is on — click to turn off"]',
      ),
    ).toHaveCount(1);

    // And back off again, for good measure.
    await sbPage
      .locator(
        '.sb-floating-toolbar [aria-label="Read-only mode is on — click to turn off"]',
      )
      .click();
    await expect
      .poll(() =>
        sbPage.evaluate(() => document.documentElement.dataset.readOnly)
      )
      .toBe("off");
  });
});
