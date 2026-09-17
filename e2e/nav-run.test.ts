import { expect, test } from "./fixtures.ts";

// Exercises client/components/nav_views/run.tsx (2026-09-17 nav-bar redesign
// spec §5, leaf N8) — the Run destination panel, reached via the nav bar
// instead of search_sheet.tsx's old "run" segment. Ports
// e2e/search-sheet.test.ts's run-mode test (`:71`, READ-ONLY reference, not
// edited) minus the segment-switching half: there's no segmented button to
// switch anymore (spec §2.3 — the nav bar itself is the mode picker), Run is
// its own destination reached by clicking the nav item directly. Same
// coverage otherwise: typing a command name filters via the same
// `buildCommandPaletteOptions`/`fuzzySearchAndSort` pipeline, Enter runs it
// via the same `triggerCommand`, and the run is recorded (`orderId`
// encodes `-lastRun`) so it resurfaces as the first empty-query history row
// on reopen.
test.describe("Run destination (N8)", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome to the wondrous world of SilverBullet",
    },
  });

  test("typed query filters commands and Enter runs the selected one, closing the panel", async ({
    sbPage,
  }) => {
    const editor = sbPage.locator("#sb-editor .cm-content");
    await expect(editor).toContainText("Welcome");

    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Run"]')
      .click();
    const panel = sbPage.locator(".sb-nav-panel");
    await expect(panel).toBeVisible();

    const input = panel.locator("input.sb-input");
    await expect(input).toHaveAttribute("placeholder", "Command");
    await input.click();
    await sbPage.keyboard.type("Stats: Show", { delay: 30 });
    await expect(
      panel.locator(".sb-option .sb-name", { hasText: "Stats: Show" }),
    ).toBeVisible();

    await sbPage.keyboard.press("Enter");

    // triggerCommand's `close` runs before the command itself (its own doc
    // comment) — the panel closes and no nav item stays selected.
    await expect(panel).toHaveCount(0);
    await expect(
      sbPage.locator(".sb-nav-bar m3e-nav-item[selected]"),
    ).toHaveCount(0);
  });

  test("running a command registers its recency, visible as history on reopen", async ({
    sbPage,
  }) => {
    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Run"]')
      .click();
    let panel = sbPage.locator(".sb-nav-panel");
    const input = panel.locator("input.sb-input");
    await input.click();
    await sbPage.keyboard.type("Stats: Show", { delay: 30 });
    await expect(
      panel.locator(".sb-option .sb-name", { hasText: "Stats: Show" }),
    ).toBeVisible();
    await sbPage.keyboard.press("Enter");
    await expect(panel).toHaveCount(0);

    // Reopen with an empty query — commands sorted by recency
    // (buildCommandPaletteOptions' own orderId = -lastRun) should surface
    // the command just run as the first (only) history row.
    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Run"]')
      .click();
    panel = sbPage.locator(".sb-nav-panel");
    await expect(panel).toBeVisible();
    await expect(
      panel.locator(".sb-option .sb-name").first(),
    ).toHaveText("Stats: Show");
  });
});
