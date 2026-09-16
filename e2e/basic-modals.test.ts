import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, mod, test } from "./fixtures.ts";

/**
 * True once `tag` is a registered custom element AND the matched `selector`
 * element has actually been upgraded to an instance of it — not just present
 * in the light DOM waiting on its module. This is the cross-cutting
 * Playwright acceptance gate every m3e reskin PR adds (see docs/plans/
 * 2026-09-16-m3e-reskin-and-agentic-journal-spec.md §3): assert the m3e-*
 * element *upgrades* and renders, not just "looks right in the diff".
 */
function isUpgraded(
  page: Page,
  tag: string,
  selector: string = tag,
): Promise<boolean> {
  return page.evaluate(
    ({ tag, selector }: { tag: string; selector: string }) => {
      const ctor = customElements.get(tag);
      const el = document.querySelector(selector);
      return !!ctor && !!el && el instanceof ctor;
    },
    { tag, selector },
  );
}

// basic_modals.tsx's Prompt()/Confirm() are both built on the shared
// AlwaysShownModal, so exercising either one also exercises the third named
// surface (AlwaysShownModal itself is not a standalone user-triggerable
// surface — it's the m3e-dialog host both of the below mount into).
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
    await gotoSilverBulletPage(sbPage, sbServer, "index");

    // "Page: Copy" (plugs/editor/page.ts:copyPage) calls editor.prompt(),
    // which round-trips through client/plugos/syscalls/editor.ts into
    // client.ui.prompt() -> viewDispatch({type: "show-prompt", ...}) ->
    // <Prompt> in editor_ui.tsx.
    await sbPage.keyboard.press(`${mod}+/`);
    const palette = sbPage.locator(".sb-modal-box");
    await palette.locator("input.sb-input").click();
    await sbPage.keyboard.type("Page: Copy", { delay: 30 });
    await sbPage.keyboard.press("Enter");

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
    const resp = await fetch(`${sbServer.url}/.fs/CopiedPage.md`);
    expect(resp.ok).toBe(true);
  });

  test("Confirm() renders as an alert m3e-dialog and Ok deletes the page", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "ToDelete");

    // "Page: Delete" (plugs/editor/page.ts:deletePage) calls
    // editor.confirm(msg, {destructive: true}) -> <Confirm destructive>.
    await sbPage.keyboard.press(`${mod}+/`);
    const palette = sbPage.locator(".sb-modal-box");
    await palette.locator("input.sb-input").click();
    await sbPage.keyboard.type("Page: Delete", { delay: 30 });
    await sbPage.keyboard.press("Enter");

    const dialog = sbPage.locator("m3e-dialog");
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog.locator('[slot="header"]')).toContainText(
      "Are you sure you would like to delete ToDelete?",
    );
    // `alert` sets the internal native <dialog>'s role via a reactive Lit
    // property (not a reflected host attribute — verified against
    // node_modules/@m3e/web/dist/dialog.js, no `reflect: true` on `alert`),
    // so assert the functional result: Playwright pierces shadow DOM by
    // default, so this reaches the shadow-rendered role.
    await expect(
      dialog.locator('dialog[role="alertdialog"]'),
    ).toBeAttached();
    expect(await isUpgraded(sbPage, "m3e-dialog")).toBe(true);
    expect(await isUpgraded(sbPage, "m3e-button")).toBe(true);

    // The destructive Ok action, wrapped in an m3e-dialog-action per
    // basic_modals.tsx's Confirm().
    await dialog.getByText("Ok", { exact: true }).click();

    await expect(dialog).not.toBeVisible();
    const resp = await fetch(`${sbServer.url}/.fs/ToDelete.md`);
    expect(resp.status).toBe(404);
  });

  test("Confirm() Cancel leaves the page untouched", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "ToDelete");

    await sbPage.keyboard.press(`${mod}+/`);
    const palette = sbPage.locator(".sb-modal-box");
    await palette.locator("input.sb-input").click();
    await sbPage.keyboard.type("Page: Delete", { delay: 30 });
    await sbPage.keyboard.press("Enter");

    const dialog = sbPage.locator("m3e-dialog");
    await expect(dialog).toHaveAttribute("open", "");
    await dialog.getByText("Cancel", { exact: true }).click();

    await expect(dialog).not.toBeVisible();
    const resp = await fetch(`${sbServer.url}/.fs/ToDelete.md`);
    expect(resp.ok).toBe(true);
  });
});
