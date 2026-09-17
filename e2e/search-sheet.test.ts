import { expect, gotoSilverBulletPage, mod, test } from "./fixtures.ts";

// Exercises search_sheet.tsx (spec §2 items 3+4+5, plan leaves L9-L12): the
// consolidated open/run/search bottom sheet. Opened here via its own
// keybinding (Ctrl-Shift-/ / Cmd-Shift-/, client/editor_commands.ts's
// "Navigate: Search Sheet") — the floating toolbar's "Search" button (L13,
// e2e/floating-toolbar.test.ts) calls the exact same `client.startSearchSheet()`
// this command runs, so this suite's coverage of the sheet's own behavior
// (modes, history, Escape/backdrop close, etc.) applies regardless of which
// trigger opened it. The older AnythingPicker/CommandPalette modals stay
// independently reachable (see e2e/command-palette.test.ts,
// e2e/page-picker.test.ts) since this sheet reuses their
// option-building/navigate/trigger logic rather than replacing them.
test.describe("Consolidated search sheet", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome to the wondrous world of SilverBullet",
      "Fruit Apple.md": "apple",
      "Fruit Banana.md": "banana",
      "Fruit Cherry.md": "cherry",
    },
  });

  test("opens via keybinding, defaults to Open mode, and closes via Escape", async ({
    sbPage,
  }) => {
    const editor = sbPage.locator("#sb-editor .cm-content");
    await expect(editor).toContainText("Welcome");

    await sbPage.keyboard.press(`${mod}+Shift+/`);
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).toBeVisible();
    await expect(sbPage.getByRole("radio", { name: "Open" })).toBeChecked();

    await sbPage.keyboard.press("Escape");
    await expect(sheet).not.toBeVisible();
  });

  test("closes via backdrop click", async ({ sbPage }) => {
    await sbPage.keyboard.press(`${mod}+Shift+/`);
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).toBeVisible();

    // `modal` renders a real ::backdrop covering the viewport — click a
    // corner far from the sheet's own content box.
    await sbPage.mouse.click(5, 5);
    await expect(sheet).not.toBeVisible();
  });

  test("open mode: typing a page name and pressing Enter navigates to it", async ({
    sbPage,
  }) => {
    await sbPage.keyboard.press(`${mod}+Shift+/`);
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).toBeVisible();

    const input = sbPage.locator("#sb-search-sheet-input");
    await input.click();
    await sbPage.keyboard.type("Fruit Cherry", { delay: 30 });
    await expect(
      sheet.locator(".sb-option .sb-name", { hasText: "Fruit Cherry" }),
    ).toBeVisible();

    await sbPage.keyboard.press("Enter");
    await expect(sheet).not.toBeVisible();
    await expect(sbPage.locator("#sb-current-page input.sb-input")).toHaveValue(
      "Fruit Cherry",
    );
  });

  test("run mode: switching segments, running a command, and registering its recency in history", async ({
    sbPage,
  }) => {
    await sbPage.keyboard.press(`${mod}+Shift+/`);
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).toBeVisible();

    await sbPage.getByRole("radio", { name: "Run" }).click();
    const input = sbPage.locator("#sb-search-sheet-input");
    await input.click();
    await sbPage.keyboard.type("Stats: Show", { delay: 30 });
    await expect(
      sheet.locator(".sb-option .sb-name", { hasText: "Stats: Show" }),
    ).toBeVisible();

    await sbPage.keyboard.press("Enter");
    await expect(sheet).not.toBeVisible();

    // L12: run-mode's empty-query history is commands sorted by
    // def.lastRun — the command just run should now be the first (only)
    // row when reopening in Run mode with an empty query.
    await sbPage.keyboard.press(`${mod}+Shift+/`);
    await expect(sheet).toBeVisible();
    await sbPage.getByRole("radio", { name: "Run" }).click();
    await expect(
      sheet.locator(".sb-option .sb-name").first(),
    ).toHaveText("Stats: Show");
    await sbPage.keyboard.press("Escape");
  });

  test("search mode: submitting a term records it, and it resurfaces as history on reopen", async ({
    sbPage,
  }) => {
    await sbPage.keyboard.press(`${mod}+Shift+/`);
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).toBeVisible();

    await sbPage.getByRole("radio", { name: "Search" }).click();
    const input = sbPage.locator("#sb-search-sheet-input");
    await input.click();
    await sbPage.keyboard.type("banana", { delay: 30 });
    // Search mode fuzzy-matches page names too, so "Fruit Banana" should
    // show up as a candidate result underneath.
    await expect(
      sheet.locator(".sb-option .sb-name", { hasText: "Fruit Banana" }),
    ).toBeVisible();

    await sbPage.keyboard.press("Enter");
    await expect(sheet).not.toBeVisible();

    // L9/L12: the submitted term is recorded into recentSearchTerms and
    // resurfaces as Search-mode's empty-query history on reopen.
    await sbPage.keyboard.press(`${mod}+Shift+/`);
    await expect(sheet).toBeVisible();
    await sbPage.getByRole("radio", { name: "Search" }).click();
    await expect(
      sheet.locator(".sb-option .sb-name", { hasText: "banana" }),
    ).toBeVisible();
    await sbPage.keyboard.press("Escape");
  });

  test("open mode's empty-query history is client.recentPaths, not the default page order", async ({
    sbPage,
    sbServer,
  }) => {
    // Visit a page first so it lands in recentPaths.
    await gotoSilverBulletPage(sbPage, sbServer, "Fruit Apple");

    await sbPage.keyboard.press(`${mod}+Shift+/`);
    const sheet = sbPage.locator("#sb-search-sheet");
    await expect(sheet).toBeVisible();
    await expect(sbPage.getByRole("radio", { name: "Open" })).toBeChecked();

    // Empty query -> history, filtered to recentPaths (current page
    // excluded — see search_sheet.tsx's history builder).
    await expect(
      sheet.locator(".sb-option .sb-hint", { hasText: "Recent" }).first(),
    ).toBeVisible();
    await sbPage.keyboard.press("Escape");
  });
});
