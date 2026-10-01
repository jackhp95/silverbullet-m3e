import { expect, gotoSilverBulletPage, test } from "../fixtures/core.ts";
import { isUpgraded } from "../fixtures/actions.ts";

// Characterization coverage for the W1-sb `client/m3e_chrome` extraction
// (docs/plans/2026-09-30-arch-review-fixes.md, Wave 1b/1c/1d "W1-sb"
// section): all three cases must pass on `m3e-fork` BEFORE the refactor
// (the theme root, the plug modal, and the mobile hamburger overflow are
// pre-existing behaviors this module must not change) and AFTER it.

test.describe("app chrome: single theme root, layout ancestry", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nApp chrome characterization test space.\n",
    },
  });

  test("exactly one #sb-root > m3e-theme, ancestor of #sb-top/.sb-floating-toolbar/#sb-main, display: contents", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    const theme = page.locator("m3e-theme");
    await expect(theme).toHaveCount(1);
    expect(await isUpgraded(page, "m3e-theme")).toBe(true);

    const result = await page.evaluate(() => {
      const root = document.querySelector("#sb-root");
      const themeEl = root?.querySelector(":scope > m3e-theme");
      return {
        isDirectChild: !!themeEl && themeEl.parentElement === root,
        ancestorOfTop: !!themeEl?.contains(
          document.querySelector("#sb-top"),
        ),
        ancestorOfFloatingToolbar: !!themeEl?.contains(
          document.querySelector(".sb-floating-toolbar"),
        ),
        ancestorOfMain: !!themeEl?.contains(document.querySelector("#sb-main")),
        display: themeEl
          ? getComputedStyle(themeEl as Element).display
          : undefined,
      };
    });

    expect(result.isDirectChild).toBe(true);
    expect(result.ancestorOfTop).toBe(true);
    expect(result.ancestorOfFloatingToolbar).toBe(true);
    expect(result.ancestorOfMain).toBe(true);
    expect(result.display).toBe("contents");
  });
});

test.describe("app chrome: plug modal", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nApp chrome characterization test space.\n",
    },
  });

  test("showPanel('modal') opens an upgraded m3e-dialog containing .sb-modal, and backdrop click closes it", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    await page.evaluate(async () => {
      await (globalThis as any).client.clientSystem.localSyscall(
        "editor.showPanel",
        ["modal", 24, "<p>Plug modal content</p>", ""],
      );
    });

    const dialog = page.locator("m3e-dialog[open]");
    await expect(dialog).toHaveCount(1);
    expect(await isUpgraded(page, "m3e-dialog")).toBe(true);
    await expect(dialog.locator(".sb-modal")).toBeVisible();
    await expect(dialog.locator(".sb-modal iframe")).toBeVisible();

    // Backdrop click (m3e-dialog's own `@click` handler, not disabled since
    // `disable-close` defaults false) -- one `closed` event -> one
    // `hide-panel`, same as the design's "Escape/backdrop close" comment on
    // the plug modal block. Escape itself isn't asserted here: with only
    // inert text + a cross-origin iframe inside (no real focusable
    // descendant for the dialog's internal focus trap to land on),
    // `document.activeElement` stays outside the dialog's composed tree,
    // so the key never bubbles to the dialog's own `@keydown` listener --
    // an artifact of this fixture's bare content, not of production usage
    // (a real plug panel's own focusable content lands the trap inside the
    // dialog, as extensions.test.ts's "closes on Escape" case exercises).
    await page.mouse.click(2, 2);
    await expect(page.locator("m3e-dialog[open]")).toHaveCount(0);
  });
});

test.describe("app chrome: mobile hamburger overflow drops the expander", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nApp chrome characterization test space.\n",
    },
  });

  test("at 411x761 with hamburger style, #sb-top has no .expander and no kebab 'Open Menu' item", async ({
    sbServer,
    page,
  }) => {
    // isMobileDevice() (client/lib/mobile.ts) gates on `(pointer: fine)`,
    // not viewport width -- force a coarse pointer (app-bar.test.ts does
    // the same for its hamburger-overflow case).
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
    await gotoSilverBulletPage(page, sbServer, "index");

    await expect(page.locator("#sb-top .expander")).toHaveCount(0);

    const kebab = page.locator(
      '#sb-top m3e-icon-button[aria-label="More actions"]',
    );
    await kebab.click();
    const menu = page.locator("m3e-menu#sb-app-bar-menu");
    await expect
      .poll(() => menu.evaluate((el: any) => el.isOpen))
      .toBe(true);
    await expect(
      menu.locator("m3e-menu-item", { hasText: "Open Menu" }),
    ).toHaveCount(0);
  });
});
