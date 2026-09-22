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

  // 2026-09-22 V5b: the leading slot is now the breadcrumb itself
  // (`<m3e-breadcrumb slot="leading">`), not a standalone icon-button — the
  // asterisk/home affordance is the breadcrumb's own first item.
  const homeButton = page.locator(
    'm3e-app-bar m3e-breadcrumb[slot="leading"] m3e-breadcrumb-item:first-child',
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

  const kebab = page.locator(
    'm3e-app-bar m3e-icon-button[title="More actions"]',
  );
  await expect(kebab).toHaveCount(1);
  await expect(kebab).toBeVisible();

  const menu = page.locator("#sb-app-bar-menu");
  await expect(menu).toHaveAttribute("position-y", "below");
  await expect(menu.evaluate((el: any) => el.isOpen)).resolves.toBe(false);

  const kebabBox = (await kebab.boundingBox())!;
  await kebab.click();

  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);

  // L8 wires real content in now — the empty-state placeholder is gone.
  // Item-level content is covered by the dedicated tests below; this test
  // stays focused on open/position/close mechanics.
  await expect(menu.getByText("No actions yet")).toHaveCount(0);
  await expect(menu.locator("m3e-menu-item")).not.toHaveCount(0);

  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.y).toBeGreaterThan(kebabBox.y);

  // Clicking outside the menu should close it.
  await page.mouse.click(10, 10);
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(false);
});

test("trailing kebab contains the push toggle", async ({ sbServer, page }) => {
  // 2026-09-17 vertical-toolbar/nav redesign spec §2.10 / R9 / leaf V8:
  // reverses the 2026-09-17 nav-bar spec's own N9 move (which had pulled the
  // Web Push toggle out into a dedicated Notifications nav-bar destination).
  // With Notifications now an action-only toolbar button (a page-nav
  // shortcut, not a settings panel), the push toggle has nowhere else to
  // live and is restored to the app-bar kebab — symmetric to the read-only
  // toggle's own placement decision (§2.2). §6's e2e mapping table records
  // this as "Reversed": the old "kebab no longer shows a Web Push toggle"
  // assertion becomes this positive one.
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const kebab = page.locator(
    'm3e-app-bar m3e-icon-button[title="More actions"]',
  );
  await kebab.click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);

  // `name` is a plain Lit reactive property on m3e-icon, not a reflected
  // attribute (same fact this file's own leading-asterisk test already
  // documents) — a CSS attribute selector like `m3e-icon[name="..."]` can
  // never match it. Read the live JS property on every icon in the menu
  // instead. (The pre-existing negative-assertion version of this test used
  // the attribute-selector form and always resolved to 0 elements regardless
  // of the real push item — a vacuous test that happened to still be
  // correct-looking as a negative assertion. Fixed here now that it's load-
  // bearing as a positive assertion.)
  const iconNames = await menu
    .locator("m3e-icon")
    .evaluateAll((els) => els.map((el: any) => el.name));
  expect(
    iconNames.filter(
      (n) =>
        n === "notifications_active" ||
        n === "notifications" ||
        n === "notifications_off",
    ),
  ).toHaveLength(1);
});

test("kebab menu icons land in m3e-menu-item's dedicated `icon` slot", async ({
  sbServer,
  page,
}) => {
  // m3e-menu-item documents a leading-icon slot: `icon` ("Renders an icon
  // before the item's label"), alongside `trailing-icon` and the DEFAULT slot
  // — and the default slot is the LABEL. The icons here previously carried no
  // `slot` at all, so they were assigned to that default/label slot and
  // rendered inline inside the label text, losing the component's own icon
  // region, spacing and alignment (measured before the fix: assignedSlot.name
  // === "", i.e. the default slot).
  //
  // Asserting `assignedSlot.name` rather than just the attribute is the
  // load-bearing check — it proves the browser actually placed the icon in the
  // shadow slot, not merely that we wrote an attribute.
  await gotoSilverBulletPage(page, sbServer, "Some Page");
  await page.locator('m3e-icon-button[title="More actions"]').click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);

  const slots = await menu.locator("m3e-menu-item m3e-icon").evaluateAll((
    els,
  ) => els.map((el: any) => el.assignedSlot?.name ?? null));

  expect(slots.length).toBeGreaterThan(0);
  for (const s of slots) {
    expect(s).toBe("icon");
  }
});

test("read-only trailing icon-button reflects state, before the kebab trigger", async ({
  sbServer,
  page,
}) => {
  // 2026-09-17 vertical-toolbar/nav redesign spec §2.2 / leaf V5: the
  // read-only toggle's old floating-toolbar-era home (deleted by N2) moves
  // to the app-bar trailing slot, rendered before the kebab trigger
  // (readOnlyToggle then the kebab icon-button, in that JSX order). §6's e2e
  // mapping table records this as "moved surfaces, not deleted."
  //
  // Scoped to the app bar itself rather than a wrapper element: each trailing
  // item now carries `slot="trailing"` directly, as the app-bar component
  // documents, so the `span.sb-trailing` wrapper this used to select is gone.
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const trailing = page.locator("m3e-app-bar");
  const readOnlyButton = trailing.locator(
    'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
  );
  const kebab = trailing.locator('m3e-icon-button[title="More actions"]');

  await expect(readOnlyButton).toHaveCount(1);
  await expect(readOnlyButton).toBeVisible();
  await expect(readOnlyButton).toHaveAttribute("title", "Enable read-only");
  await expect(readOnlyButton.locator("m3e-icon")).toHaveJSProperty(
    "name",
    "lock_open",
  );

  // DOM order: the read-only button must precede the kebab trigger.
  const order = await trailing.evaluate(
    (el, [roSel, kebabSel]) => {
      const ro = el.querySelector(roSel)!;
      const kb = el.querySelector(kebabSel)!;
      return ro.compareDocumentPosition(kb) & Node.DOCUMENT_POSITION_FOLLOWING
        ? "before"
        : "after";
    },
    [
      'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
      'm3e-icon-button[title="More actions"]',
    ],
  );
  expect(order).toBe("before");

  await readOnlyButton.click();

  await expect(readOnlyButton).toHaveAttribute("title", "Disable read-only");
  await expect(readOnlyButton.locator("m3e-icon")).toHaveJSProperty(
    "name",
    "lock",
  );
  await expect(kebab).toHaveCount(1);
});

test("trailing kebab's config link navigates to the CONFIG page", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Some Page");

  const kebab = page.locator(
    'm3e-app-bar m3e-icon-button[title="More actions"]',
  );
  await kebab.click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);

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

  const kebab = page.locator(
    'm3e-app-bar m3e-icon-button[title="More actions"]',
  );
  await kebab.click();

  const menu = page.locator("#sb-app-bar-menu");
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);

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
