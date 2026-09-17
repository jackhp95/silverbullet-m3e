import type { Locator, Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, mod, test } from "./fixtures.ts";

/**
 * True once `tag` is a registered custom element AND `locator`'s own element
 * has actually been upgraded to an instance of it — not just present in the
 * light DOM waiting on its module. Locator-scoped (rather than page.evaluate
 * + a selector, per basic-modals.test.ts's/side-panel-drawer.test.ts's
 * `isUpgraded`) because this plug's UI lives inside its own panel iframe
 * (`Panel`, client/components/panel.tsx) — a separate browsing context with
 * its own `customElements` registry — and `Locator.evaluate` runs in
 * whichever frame the locator actually resolved in, top page or iframe
 * alike. This is the same cross-cutting Playwright acceptance gate every
 * m3e reskin PR adds (see docs/plans/2026-09-16-m3e-reskin-and-agentic-
 * journal-spec.md §3): assert the m3e-* element *upgrades* and renders, not
 * just "looks right in the diff".
 */
function isUpgraded(locator: Locator, tag: string): Promise<boolean> {
  return locator.evaluate((el, tag) => {
    const ctor = customElements.get(tag);
    return !!ctor && el instanceof ctor;
  }, tag);
}

async function openConfigurationPanel(page: Page): Promise<void> {
  await page.keyboard.press(`${mod}+/`);
  const palette = page.locator(".sb-modal-box");
  await palette.waitFor({ state: "visible", timeout: 10_000 });
  await palette.locator("input.sb-input").click();
  await page.keyboard.type("Configuration: Open", { delay: 30 });
  await page.keyboard.press("Enter");
}

// plugs/configuration-manager/ui/components/app.tsx + configuration_tab.tsx,
// exercised through the real "Configuration: Open" command — deliberately a
// DIFFERENT shape of `Button`/`Input` consumer than setup-wizard.test.ts's:
// this one is a built-in *plug*, rendered inside its own panel `<iframe>`
// (Panel, client/components/panel.tsx) rather than the top-level page, and
// its search `Input` is a compact filter box (no visible `<label>` sibling)
// rather than a labeled auth-form field. Proves plug-api/ui's `Button`/
// `Input` (Phase B #8's kit-level reskin) cascade into plug UIs too, not
// just core client surfaces.
test.describe("configuration-manager plug m3e-button/m3e-form-field", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nConfiguration manager e2e test space.",
    },
  });

  test("the Configuration panel's search Input renders an upgraded m3e-form-field", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "index");
    await openConfigurationPanel(sbPage);

    const frame = sbPage.frameLocator(".sb-modal iframe");
    await expect(frame.locator("#cfg-header")).toBeVisible();

    // configuration_tab.tsx's `<Input class="cfg-search" .../>` — kit
    // `Input` in its default (non-`bare`) mode wraps in `m3e-form-field`
    // and moves the caller's `class` there (plug-api/ui/input.tsx), so the
    // layout hook now lives on the field host, not the inner `<input>`.
    const searchField = frame.locator("m3e-form-field.cfg-search");
    await expect(searchField).toBeVisible();
    expect(await isUpgraded(searchField, "m3e-form-field")).toBe(true);

    const searchInput = searchField.locator("input");
    await expect(searchInput).toHaveAttribute(
      "placeholder",
      "Filter configuration options...",
    );
    await searchInput.fill("accent");
    await expect(searchInput).toHaveValue("accent");
  });

  test("the Configuration panel's Cancel/Save buttons render as upgraded m3e-button", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "index");
    await openConfigurationPanel(sbPage);

    const frame = sbPage.frameLocator(".sb-modal iframe");
    await expect(frame.locator("#cfg-header")).toBeVisible();

    // app.tsx's SaveFooter: `<Button id="cfg-cancel" shortcut="esc">` and
    // `<Button variant="primary" id="cfg-save">` — plain `default` and
    // `primary` variants respectively, both now `m3e-button`.
    const cancel = frame.locator("#cfg-cancel");
    await expect(cancel).toBeVisible();
    expect(await isUpgraded(cancel, "m3e-button")).toBe(true);
    await expect(cancel).toHaveAttribute("variant", "outlined");
    // The keyboard-shortcut hint span survives the m3e-button swap.
    await expect(cancel.locator(".sb-kbd")).toHaveText("esc");

    const save = frame.locator("#cfg-save");
    expect(await isUpgraded(save, "m3e-button")).toBe(true);
    await expect(save).toHaveAttribute("variant", "filled");

    // Cancel actually closes the panel (editor.hidePanel("modal")) — proves
    // the m3e-button click still round-trips through the same onClick prop
    // plug-api/ui/button.tsx forwards via `{...rest}`.
    await cancel.click();
    await expect(sbPage.locator(".sb-modal")).toHaveCount(0);
  });
});
