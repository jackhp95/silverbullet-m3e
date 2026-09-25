import { currentPage, isUpgraded } from "../fixtures/actions.ts";
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
