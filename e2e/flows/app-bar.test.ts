import type { Page } from "@playwright/test";
import {
  isPushActionable,
  PUSH_STATE_DETAILS,
  type PushState,
  pushMenuLabel,
} from "../../client/lib/push_ui.ts";
import {
  currentPage,
  isUpgraded,
  runCommandViaPalette,
} from "../fixtures/actions.ts";
import { gotoSilverBulletPage, mod } from "../fixtures/core.ts";
// Single `test` for the whole file (rather than mixing core.ts's and
// offline.ts's fixture objects across describes): offline.ts's `test` is
// just core.ts's `test.extend({ disableServiceWorker: false })`, so every
// fixture the non-offline specs use (page/context/sbServer/spaceFiles) is
// still there — and the offline-chip spec needs a real, enabled service
// worker (core.ts defaults `disableServiceWorker` to `true`).
import { expect, openLivePage, test } from "../fixtures/offline.ts";

// CS-5: TopBar -> m3e-app-bar (pinned, small) + sync ring + offline chip +
// read-only toggle. See docs/plans/2026-09-24-core-shell-decomposition.md
// CS-5 row.

test.describe("app bar: upgraded shell, sync ring, offline chip, RO toggle", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nApp bar reconciliation test space.\n",
    },
  });

  test("the small app bar is a live, upgraded m3e-app-bar", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    await expect(page.locator("#sb-top m3e-app-bar")).toHaveCount(1);
    expect(await isUpgraded(page, "#sb-top m3e-app-bar")).toBe(true);
  });

  test("showProgress renders a determinate ring, then an indeterminate one for NaN", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    await page.evaluate(() => {
      (globalThis as any).client.ui.showProgress("sync", 42);
    });
    const ring = page.locator("#sb-top m3e-circular-progress-indicator");
    await expect(ring).toHaveCount(1);
    await expect.poll(() => ring.evaluate((el: any) => el.value)).toBe(42);
    await expect(page.locator("#sb-top .progress-wrapper")).toHaveAttribute(
      "title",
      "sync progress: 42%",
    );

    await page.evaluate(() => {
      (globalThis as any).client.ui.showProgress("sync", NaN);
    });
    await expect
      .poll(() => ring.evaluate((el: any) => el.indeterminate))
      .toBe(true);
  });

  test("read-only toggle flips forcedROMode and relabels itself", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    const toggle = page.locator(
      '#sb-top m3e-icon-button[aria-label="Enable read-only"]',
    );
    await expect(toggle).toHaveCount(1);
    await toggle.click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (globalThis as any).client.ui.viewState.uiOptions.forcedROMode,
        ),
      )
      .toBe(true);
    await expect(
      page.locator('#sb-top m3e-icon-button[aria-label="Disable read-only"]'),
    ).toHaveCount(1);
  });
});

// CS-7a: large app bar -> breadcrumb leading slot, subtitle, wrapping
// <textarea> title. See docs/plans/2026-09-24-core-shell-decomposition.md
// CS-7a row.

test.describe("app bar: medium size, breadcrumb leading slot, subtitle, wrapping title", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nCore shell test space.\n",
      "Projects/Alpha.md": "# Alpha\nAlpha project notes.\n",
    },
  });

  test("the app bar is size medium", async ({ sbServer, page }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    await expect(page.locator("#sb-top m3e-app-bar")).toHaveAttribute(
      "size",
      "medium",
    );
  });

  test("breadcrumb reflects the page path, last item current", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Projects/Alpha");
    const items = page.locator(
      '#sb-top m3e-breadcrumb[slot="leading"] m3e-breadcrumb-item',
    );
    await expect(items).toHaveCount(3);
    await expect(items.last()).toHaveAttribute("current", "page");
  });

  test("clicking the first breadcrumb item navigates to the index page", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Projects/Alpha");
    const items = page.locator(
      '#sb-top m3e-breadcrumb[slot="leading"] m3e-breadcrumb-item',
    );
    await items.first().click();
    await expect(currentPage(page)).toHaveValue("index");
  });

  test("subtitle shows 'Edited ... · N min read'", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    await expect(page.locator('#sb-top span[slot="subtitle"]')).toHaveText(
      /^Edited .+ · \d+ min read$/,
    );
  });

  test("a long title wraps the textarea onto multiple lines without resizing the bar", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    const title = currentPage(page);
    await expect(title).toBeVisible();
    const singleLineHeight = await title.evaluate(
      (el: HTMLTextAreaElement) => el.offsetHeight,
    );

    const longTitle = "A".repeat(120);
    await title.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.insertText(longTitle);

    await expect(title).toBeVisible();
    await expect
      .poll(() => title.evaluate((el: HTMLTextAreaElement) => el.offsetHeight))
      .toBeGreaterThan(singleLineHeight);

    const sizes = new Set<string>();
    for (let i = 0; i < 5; i++) {
      sizes.add(
        (await page
          .locator("#sb-top m3e-app-bar")
          .getAttribute("size")) ?? "",
      );
      await page.waitForTimeout(200);
    }
    expect(sizes.size).toBe(1);
    expect(sizes.has("medium")).toBe(true);
  });

  test("renaming via the title textarea + Enter navigates to the new URL", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    const title = currentPage(page);
    await title.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.insertText("Renamed");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/Renamed$/);
  });
});

test.describe("app bar: offline chip (real service worker)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Playwright offline service-worker emulation is validated in Chromium",
  );
  test.use({
    spaceFiles: { "index.md": "Offline app-bar test\n" },
  });

  test("the offline chip appears while offline and clears on reconnect", async ({
    page,
    context,
    sbServer,
  }) => {
    await openLivePage(page, sbServer.url, "Offline app-bar test");
    const chip = page.locator("#sb-top .sb-offline-chip");
    await expect(chip).toBeHidden();

    await context.setOffline(true);
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute("aria-label", "Offline");
    await expect(page.locator("#sb-top")).toHaveClass(/sb-sync-error/);

    await context.setOffline(false);
    await expect(chip).toBeHidden();
    await expect(page.locator("#sb-top")).not.toHaveClass(/sb-sync-error/);
  });
});

// CS-7b: trailing kebab menu (`#sb-app-bar-menu`) + push toggle item +
// mobile hamburger overflow. See docs/plans/2026-09-24-core-shell-
// decomposition.md CS-7b row and D2.

const KEBAB = '#sb-top m3e-icon-button[aria-label="More actions"]';
const MENU = "m3e-menu#sb-app-bar-menu";

async function openKebab(page: Page) {
  await page.locator(KEBAB).click();
  await expect
    .poll(() => page.locator(MENU).evaluate((el: any) => el.isOpen))
    .toBe(true);
  return page.locator(MENU);
}

// `config.set` (not the Std `actionButton.define` wrapper) so the list is
// exactly this one entry, independent of whether Std is loaded.
const kebabSpace = {
  "index.md": "# Index\nKebab test space.\n",
  "Some Page.md": "# Some Page\nContent.\n",
  "CONFIG.md": [
    "```space-lua",
    'config.set("mobileMenuStyle", "hamburger")',
    'config.set("actionButtons", {',
    '  { icon = "activity", description = "Test Action", command = "Navigate: Home" },',
    "})",
    "```",
    "",
  ].join("\n"),
};

test.describe("app bar: kebab menu", () => {
  test.use({ spaceFiles: kebabSpace });

  test("the kebab is an upgraded trailing icon button that opens the menu below it, after the RO toggle", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Some Page");
    expect(await isUpgraded(page, KEBAB)).toBe(true);
    expect(await isUpgraded(page, MENU)).toBe(true);
    await expect(page.locator(MENU)).toHaveAttribute("position-y", "below");

    const roToggle = page.locator(
      '#sb-top m3e-icon-button[aria-label="Enable read-only"]',
    );
    await expect(roToggle).toHaveCount(1);
    const order = await page.locator("#sb-top m3e-app-bar").evaluate((bar) => {
      const ro = bar.querySelector('m3e-icon-button[aria-label$="read-only"]')!;
      const kebab = bar.querySelector(
        'm3e-icon-button[aria-label="More actions"]',
      )!;
      return !!(
        ro.compareDocumentPosition(kebab) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    expect(order).toBe(true);

    const kebabBox = (await page.locator(KEBAB).boundingBox())!;
    const menu = await openKebab(page);
    const firstItem = menu.locator("m3e-menu-item").first();
    await expect(firstItem).toBeVisible();
    expect((await firstItem.boundingBox())!.y).toBeGreaterThan(kebabBox.y);
  });

  test("the push item shows push_ui's label for the real push state and is disabled under the no-SW fixture", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Some Page");

    // Resolve the in-page push state through the real readPushState path:
    // the toggle command re-reads it and, for a dead-end state, flashes
    // exactly PUSH_STATE_DETAILS[state].
    await runCommandViaPalette(page, "Push Notifications: Toggle");
    const notice = await page
      .locator(".sb-notification-error .sb-notification-message")
      .first()
      .textContent();
    const state = (Object.keys(PUSH_STATE_DETAILS) as PushState[]).find(
      (s) => PUSH_STATE_DETAILS[s] === notice,
    );
    expect(state, `unrecognised push notice: ${notice}`).toBeDefined();
    expect(isPushActionable(state!)).toBe(false);

    const menu = await openKebab(page);
    const pushItem = menu.locator('m3e-menu-item[data-key="push"]');
    await expect(pushItem).toHaveCount(1);
    await expect(pushItem.locator(".sb-app-bar-menu-label")).toHaveText(
      pushMenuLabel(state),
    );
    await expect(pushItem).toHaveAttribute("disabled", "");
  });

  test("'Open Config' navigates to the CONFIG page", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Some Page");
    const menu = await openKebab(page);
    await menu.locator("m3e-menu-item", { hasText: "Open Config" }).click();
    await expect(currentPage(page)).toHaveValue("CONFIG");
  });

  test("desktop keeps CONFIG actionButtons as trailing icon buttons (D2)", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Some Page");
    await expect(
      page.locator('#sb-top m3e-icon-button[aria-label^="Test Action"]'),
    ).toHaveCount(1);
    const menu = await openKebab(page);
    await expect(
      menu.locator("m3e-menu-item", { hasText: "Test Action" }),
    ).toHaveCount(0);
  });

  test("mobile hamburger style moves CONFIG actionButtons into the kebab at 411x761", async ({
    sbServer,
    page,
  }) => {
    // isMobileDevice() (client/lib/mobile.ts) gates on `(pointer: fine)`,
    // not viewport width — force a coarse pointer (as filterbox.test.ts does).
    await page.addInitScript(() => {
      const realMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query: string) =>
        query === "(pointer: fine)"
          ? realMatchMedia("not all")
          : query === "(pointer: coarse)"
            ? realMatchMedia("all")
            : realMatchMedia(query);
    });
    await page.setViewportSize({ width: 411, height: 761 });
    await gotoSilverBulletPage(page, sbServer, "Some Page");

    await expect(
      page.locator('#sb-top m3e-icon-button[aria-label^="Test Action"]'),
    ).toHaveCount(0);
    await expect(page.locator("#sb-top .sb-actions.hamburger")).toHaveCount(0);
    const menu = await openKebab(page);
    const item = menu.locator("m3e-menu-item", { hasText: "Test Action" });
    await expect(item).toHaveCount(1);
    await item.click();
    await expect(currentPage(page)).toHaveValue("index");
  });
});
