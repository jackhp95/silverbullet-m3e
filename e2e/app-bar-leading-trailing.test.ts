import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// L6/L7 (docs/plans/2026-09-16-toolbar-search-feedback-spec.md §2 "Items
// 6+11", §4 "L6/L7") — two new entry points on `m3e-app-bar`
// (client/components/top_bar.tsx):
//
//  - leading slot: an asterisk icon-button that runs the exact same
//    "Navigate: Home" command the breadcrumb's root "Space" segment already
//    runs (breadcrumbItems[0].onClick, reused rather than re-wired).
//  - trailing slot: a kebab (`more_vert`) icon-button + `m3e-menu-trigger`
//    opening `m3e-menu#sb-app-bar-menu`, `position-y="below"` since this
//    anchor sits at the TOP of the viewport (unlike floating_toolbar.tsx's
//    bottom-anchored `sb-recent-pages-menu`, which is explicitly "above").
//    This leaf only builds the menu shell — content is an empty-state
//    placeholder until the follow-up leaf (L8) wires real items in via the
//    `menuItems` prop.

test.use({
  spaceFiles: {
    "Some Page.md": "# Some Page\n\nContent to navigate away from home.\n",
  },
});

test("leading asterisk icon-button reuses the breadcrumb root's Home navigation", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const homeButton = page.locator(
    'm3e-app-bar m3e-icon-button[slot="leading"]',
  );
  await expect(homeButton).toHaveCount(1);
  await expect(homeButton).toBeVisible();
  await expect(homeButton).not.toHaveAttribute("disabled", "");
  // `name` is a plain Lit reactive property, not a reflected attribute (per
  // IconElement.d.ts — no `reflect: true`), so Preact sets it as a live DOM
  // property rather than an HTML attribute; assert the property directly.
  await expect(homeButton.locator("m3e-icon")).toHaveJSProperty(
    "name",
    "asterisk",
  );

  const pageNameInput = page.locator("#sb-current-page input.sb-input");
  await expect(pageNameInput).toHaveValue("Some Page");

  await homeButton.click();

  // "Navigate: Home" (plugs/editor/editor.plug.yaml's navigateHome) targets
  // `page: ""` — the same root the breadcrumb's "Space" segment navigates
  // to — which `parseToRef`/`normalizePath` (plug-api/lib/ref.ts) resolve
  // to the space's default "index" page, back at the server's root URL.
  await expect(pageNameInput).toHaveValue("index");
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("trailing kebab opens sb-app-bar-menu positioned below the app bar", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const kebab = page.locator('m3e-app-bar m3e-icon-button[title="More actions"]');
  await expect(kebab).toHaveCount(1);
  await expect(kebab).toBeVisible();

  const menu = page.locator("#sb-app-bar-menu");
  await expect(menu).toHaveAttribute("position-y", "below");
  await expect(menu.evaluate((el: any) => el.isOpen)).resolves.toBe(false);

  const kebabBox = (await kebab.boundingBox())!;
  await kebab.click();

  await expect
    .poll(() => menu.evaluate((el: any) => el.isOpen))
    .toBe(true);

  // This leaf ships the menu shell with a placeholder — real items (Web
  // Push toggle, CONFIG link, etc.) land in a follow-up leaf (L8).
  await expect(menu).toContainText("No actions yet");

  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.y).toBeGreaterThan(kebabBox.y);

  // Clicking the placeholder item (disabled) must not close/error the menu;
  // clicking elsewhere should close it.
  await page.mouse.click(10, 10);
  await expect
    .poll(() => menu.evaluate((el: any) => el.isOpen))
    .toBe(false);
});
