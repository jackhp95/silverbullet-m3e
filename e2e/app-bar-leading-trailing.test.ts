import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// L6/L7/L8 (docs/plans/2026-09-16-toolbar-search-feedback-spec.md §2 "Items
// 6+11", §4 "L6/L7/L8") — two new entry points on `m3e-app-bar`
// (client/components/top_bar.tsx):
//
//  - leading slot: an asterisk icon-button that runs the exact same
//    "Navigate: Home" command the breadcrumb's root "Space" segment already
//    runs (breadcrumbItems[0].onClick, reused rather than re-wired).
//  - trailing slot: a kebab (`more_vert`) icon-button + `m3e-menu-trigger`
//    opening `m3e-menu#sb-app-bar-menu`, `position-y="below"` since this
//    anchor sits at the TOP of the viewport (unlike floating_toolbar.tsx's
//    bottom-anchored `sb-recent-pages-menu`, which is explicitly "above").
//    L6/L7 shipped only the menu shell (an empty-state placeholder); L8
//    (client/editor_ui.tsx) wires real `menuItems` in: the Web Push toggle,
//    a CONFIG-page link, then every CONFIG-defined actionButton — see the
//    tests below.
//
// CONFIG.md here deliberately calls `config.set("actionButtons", {...})`
// directly (the same raw primitive libraries/Library/Std/Config.md's own
// "Default values" block uses) rather than the `actionButton.define`
// convenience wrapper (libraries/Library/Std/APIs/Action Button.md) — that
// wrapper depends on the Std library being loaded into the space, which a
// bare e2e temp space doesn't guarantee; `config.set` has no such
// dependency and, being a last-write-wins setter, also makes the resulting
// `actionButtons` list deterministic (exactly the one entry below) instead
// of depending on whether Std's own default home/book/terminal buttons are
// present.
test.use({
  spaceFiles: {
    "Some Page.md": "# Some Page\n\nContent to navigate away from home.\n",
    "CONFIG.md": [
      "```space-lua",
      'config.set("actionButtons", {',
      "  {",
      '    icon = "activity",',
      '    description = "Test Action",',
      '    command = "Navigate: Home",',
      "  },",
      "})",
      "```",
      "",
    ].join("\n"),
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

  // L8 wires real content in now — the empty-state placeholder is gone.
  // Item-level content is covered by the dedicated tests below; this test
  // stays focused on open/position/close mechanics.
  await expect(menu.getByText("No actions yet")).toHaveCount(0);
  await expect(menu.locator("m3e-menu-item")).not.toHaveCount(0);

  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.y).toBeGreaterThan(kebabBox.y);

  // Clicking outside the menu should close it.
  await page.mouse.click(10, 10);
  await expect
    .poll(() => menu.evaluate((el: any) => el.isOpen))
    .toBe(false);
});

test("trailing kebab shows the Web Push toggle with its current state", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const kebab = page.locator('m3e-app-bar m3e-icon-button[title="More actions"]');
  await kebab.click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect
    .poll(() => menu.evaluate((el: any) => el.isOpen))
    .toBe(true);

  // This e2e bundle is built with no VAPID_PUBLIC_KEY/PUSH_SIDECAR_URL (see
  // e2e/push-notifications.test.ts's own header comment for why that's the
  // deterministic default here) — `pushState` resolves to "not-configured",
  // one of the 8 states client/editor_ui.tsx's PUSH_TOGGLE_LABELS preserves
  // verbatim from the floating toolbar's pre-existing push toggle.
  const pushItem = menu.locator("m3e-menu-item").filter({
    hasText: "Push notifications are not configured for this server",
  });
  await expect(pushItem).toHaveCount(1);
  await expect(pushItem).toHaveAttribute("disabled", "");
});

test("trailing kebab's config link navigates to the CONFIG page", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const kebab = page.locator('m3e-app-bar m3e-icon-button[title="More actions"]');
  await kebab.click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect
    .poll(() => menu.evaluate((el: any) => el.isOpen))
    .toBe(true);

  const configItem = menu.locator("m3e-menu-item").filter({
    hasText: "Open Config",
  });
  await expect(configItem).toHaveCount(1);
  await configItem.click();

  const pageNameInput = page.locator("#sb-current-page input.sb-input");
  await expect(pageNameInput).toHaveValue("CONFIG");
});

test("trailing kebab includes every CONFIG-defined actionButton", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const kebab = page.locator('m3e-app-bar m3e-icon-button[title="More actions"]');
  await kebab.click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect
    .poll(() => menu.evaluate((el: any) => el.isOpen))
    .toBe(true);

  // CONFIG.md (test.use above) defines exactly one actionButton — "Test
  // Action", bound to the real "Navigate: Home" command — via the raw
  // `config.set("actionButtons", {...})` primitive.
  const actionItem = menu.locator("m3e-menu-item").filter({
    hasText: "Test Action",
  });
  await expect(actionItem).toHaveCount(1);
  await actionItem.click();

  const pageNameInput = page.locator("#sb-current-page input.sb-input");
  await expect(pageNameInput).toHaveValue("index");
  await expect(page).toHaveURL((url) => url.pathname === "/");
});
