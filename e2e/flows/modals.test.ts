import {
  expect,
  gotoSilverBulletPage,
  mod,
  test,
  waitForPersistedContent,
} from "../fixtures/core.ts";
import { isUpgraded, runCommandViaPalette } from "../fixtures/actions.ts";

// Port of the fork's e2e/basic-modals.test.ts (CS-3 add-on, per
// docs/plans/2026-09-24-core-shell-decomposition.md §4). basic_modals.tsx's
// Prompt()/Confirm() are both built on the shared AlwaysShownModal, so
// exercising either also exercises that shared m3e-dialog host. Rewritten
// against main's real command surface (`runCommandViaPalette`, not the
// fork's dead `.sb-modal-box` command-palette markup).
test.describe("basic_modals.tsx m3e-dialog surfaces", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome to the wondrous world of SilverBullet",
      "ToDelete.md": "Content to delete",
    },
  });

  test("Prompt() renders as an upgraded m3e-dialog and Ok submits the value", async ({
    sbPage,
    sbServer,
  }) => {
    await runCommandViaPalette(sbPage, "Page: Copy");

    const dialog = sbPage.locator("m3e-dialog");
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog.locator('[slot="header"]')).toHaveText(
      "Copy to page:",
    );
    expect(await isUpgraded(sbPage, "m3e-dialog")).toBe(true);
    expect(await isUpgraded(sbPage, "m3e-form-field")).toBe(true);
    expect(await isUpgraded(sbPage, "m3e-button")).toBe(true);

    const input = dialog.locator("input.sb-prompt-input");
    await expect(input).toHaveValue("index"); // defaultValue = current page
    await input.click();
    await sbPage.keyboard.press(`${mod}+a`);
    await sbPage.keyboard.type("CopiedPage");
    await sbPage.keyboard.press("Enter");

    await expect(dialog).not.toBeVisible();
    await sbPage.waitForURL(/\/CopiedPage$/);
    await waitForPersistedContent(
      sbServer,
      "CopiedPage.md",
      "Welcome to the wondrous world of SilverBullet",
    );
  });

  test("Confirm() renders as an alert m3e-dialog and Ok deletes the page", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "ToDelete");

    await runCommandViaPalette(sbPage, "Page: Delete");

    const dialog = sbPage.locator("m3e-dialog");
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog.locator('[slot="header"]')).toContainText(
      "Are you sure you would like to delete ToDelete?",
    );
    // `alert` sets the internal native <dialog>'s role via a reactive Lit
    // property (not a reflected host attribute -- no `reflect: true` on
    // `alert` in node_modules/@m3e/web/dist/dialog.js), so assert the
    // functional result; Playwright pierces shadow DOM by default.
    await expect(dialog.locator('dialog[role="alertdialog"]')).toBeAttached();
    expect(await isUpgraded(sbPage, "m3e-dialog")).toBe(true);
    expect(await isUpgraded(sbPage, "m3e-button")).toBe(true);

    // The destructive Ok action, wrapped in an m3e-dialog-action per
    // basic_modals.tsx's Confirm().
    await dialog.getByText("Ok", { exact: true }).click();

    await expect(dialog).not.toBeVisible();
    // deletePage() (plugs/editor/page.ts) does async work AFTER
    // editor.confirm() resolves -- list pages, space.deletePage(), then
    // editor.navigate() away from the now-gone page -- so the dialog
    // disappearing doesn't mean the server-side delete has landed yet.
    await sbPage.waitForURL((url) => !url.pathname.endsWith("/ToDelete"));
    const resp = await fetch(`${sbServer.url}/.fs/ToDelete.md`);
    expect(resp.status).toBe(404);
  });

  test("Confirm() Cancel leaves the page untouched", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "ToDelete");

    await runCommandViaPalette(sbPage, "Page: Delete");

    const dialog = sbPage.locator("m3e-dialog");
    await expect(dialog).toHaveAttribute("open", "");
    await dialog.getByText("Cancel", { exact: true }).click();

    await expect(dialog).not.toBeVisible();
    const resp = await fetch(`${sbServer.url}/.fs/ToDelete.md`);
    expect(resp.ok).toBe(true);
  });
});
