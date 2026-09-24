import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../fixtures/core.ts";
import { runCommandViaPalette } from "../fixtures/actions.ts";

/**
 * True once `tag` is a registered custom element AND `locator`'s own element
 * has actually been upgraded to an instance of it -- not just present in the
 * light DOM waiting on its module. Locator-scoped rather than
 * `page.evaluate` + a selector because this plug's UI lives inside its own
 * panel iframe (`editor.showPanel`) -- a separate browsing context with its
 * own `customElements` registry -- and `Locator.evaluate` runs in whichever
 * frame the locator actually resolved in, top page or iframe alike.
 */
function isUpgraded(locator: Locator, tag: string): Promise<boolean> {
  return locator.evaluate((el, tag) => {
    const ctor = customElements.get(tag);
    return !!ctor && el instanceof ctor;
  }, tag);
}

async function openConfigurationPanel(page: Page): Promise<void> {
  await runCommandViaPalette(page, "Configuration: Open");
}

// Ported from fork 4cfc3763's e2e/configuration-manager-m3e.test.ts onto
// main's real markup (reconcile slice-plugui): the fork's spec only covered
// Button/Input (already landed on main via slice 6b); this port adds Tabs
// coverage for plug-api/ui/tabs.tsx's tablist-mode m3e-tabs/m3e-tab swap and
// takes the screenshots this slice's brief requires.
test.describe("configuration-manager plug m3e components", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nConfiguration manager e2e test space.",
    },
  });

  test("the Configuration panel's search Input renders an upgraded m3e-form-field", async ({
    sbPage,
  }) => {
    await openConfigurationPanel(sbPage);

    const frame = sbPage.frameLocator(".sb-modal iframe");
    await expect(frame.locator("#cfg-header")).toBeVisible();

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
  }) => {
    await openConfigurationPanel(sbPage);

    const frame = sbPage.frameLocator(".sb-modal iframe");
    await expect(frame.locator("#cfg-header")).toBeVisible();

    const cancel = frame.locator("#cfg-cancel");
    await expect(cancel).toBeVisible();
    expect(await isUpgraded(cancel, "m3e-button")).toBe(true);
    await expect(cancel).toHaveAttribute("variant", "outlined");

    const save = frame.locator("#cfg-save");
    expect(await isUpgraded(save, "m3e-button")).toBe(true);
    await expect(save).toHaveAttribute("variant", "filled");

    await cancel.click();
    await expect(sbPage.locator(".sb-modal")).toBeHidden();
  });

  test("the Header's tabs render as upgraded m3e-tabs/m3e-tab and switch panels", async ({
    sbPage,
  }) => {
    await openConfigurationPanel(sbPage);

    const frame = sbPage.frameLocator(".sb-modal iframe");
    const tabs = frame.locator("m3e-tabs");
    await expect(tabs).toBeVisible();
    expect(await isUpgraded(tabs, "m3e-tabs")).toBe(true);

    const configurationTab = frame.locator("m3e-tab", {
      hasText: "Configuration",
    });
    const librariesTab = frame.locator("m3e-tab", { hasText: "Libraries" });
    expect(await isUpgraded(librariesTab, "m3e-tab")).toBe(true);
    expect(await configurationTab.evaluate((el) => (el as any).selected)).toBe(
      true,
    );

    // Clicking a tab switches the visible panel content -- LibrariesTab
    // renders an "Installed" section header the ConfigurationTab doesn't.
    await librariesTab.click();
    expect(await librariesTab.evaluate((el) => (el as any).selected)).toBe(
      true,
    );
    await expect(
      frame.locator(".lib-section-header", { hasText: "Installed" }),
    ).toBeVisible();
  });

  test("screenshots the configuration manager at mobile and desktop widths", async ({
    sbPage,
  }) => {
    await openConfigurationPanel(sbPage);
    const frame = sbPage.frameLocator(".sb-modal iframe");
    await expect(frame.locator("#cfg-header")).toBeVisible();

    await sbPage.setViewportSize({ width: 411, height: 761 });
    await sbPage.screenshot({
      path: "/tmp/slice-plugui-shots/configuration-manager-mobile.png",
    });

    await sbPage.setViewportSize({ width: 1280, height: 800 });
    await sbPage.screenshot({
      path: "/tmp/slice-plugui-shots/configuration-manager-desktop.png",
    });

    const librariesTab = frame.locator("m3e-tab", { hasText: "Libraries" });
    await librariesTab.click();
    await expect(
      frame.locator(".lib-section-header", { hasText: "Installed" }),
    ).toBeVisible();
    await sbPage.screenshot({
      path: "/tmp/slice-plugui-shots/configuration-manager-libraries-desktop.png",
    });
  });
});

test.describe("object-graph plug m3e components", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nLinks to [[Other]].",
      "Other.md": "# Other\n",
    },
  });

  test("screenshots the object graph panel at mobile and desktop widths", async ({
    sbPage,
  }) => {
    await runCommandViaPalette(sbPage, "Graph: Global Page Map");
    const frame = sbPage.frameLocator(".sb-modal iframe");
    await expect(frame.locator(".graph-root-inner")).toBeVisible();

    await sbPage.setViewportSize({ width: 411, height: 761 });
    await sbPage.screenshot({
      path: "/tmp/slice-plugui-shots/object-graph-mobile.png",
    });

    await sbPage.setViewportSize({ width: 1280, height: 800 });
    await sbPage.screenshot({
      path: "/tmp/slice-plugui-shots/object-graph-desktop.png",
    });
  });
});
