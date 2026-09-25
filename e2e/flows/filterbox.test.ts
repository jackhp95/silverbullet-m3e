import { expect, gotoSilverBulletPage, test } from "../fixtures/core.ts";
import { isUpgraded } from "../fixtures/actions.ts";
import { adminApi, test as authenticatedTest } from "../fixtures/authenticated.ts";

// CS-4: FilterList (client/components/filter.tsx) reskinned onto
// `m3e-search-view` + `m3e-list`/`m3e-list-item`. filter.tsx has zero prior
// e2e coverage, so this spec is the only guard against `.sb-filter-input`
// being dropped or Enter/Escape handling breaking. Consumers exercised:
// the `editor.filterBox` syscall path (client/plugos/syscalls/editor.ts)
// directly via `client.ui.filterBox`, and the mobile profile menu
// (client/editor_ui.tsx, callback around L630) which also routes through it.
// See docs/plans/2026-09-24-core-shell-decomposition.md CS-4 row.

test.describe("filter box: m3e-search-view", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nFilter box test space.\n",
    },
  });

  test("filters, resolves on Enter, resolves undefined on Escape", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    // Fire-and-forget: the promise only resolves once the user picks or
    // cancels below, so we stash it on globalThis rather than awaiting the
    // evaluate() call itself.
    await page.evaluate(() => {
      (globalThis as any).__fb = (globalThis as any).client.ui.filterBox(
        "Pick one",
        [{ name: "Alpha" }, { name: "Beta" }],
      );
    });

    const searchView = page.locator("m3e-search-view");
    await expect(searchView).toBeVisible();
    expect(await isUpgraded(page, "m3e-search-view")).toBe(true);

    const input = page.locator(".sb-filter-input");
    await input.fill("bet");
    const items = page.locator("m3e-list-item");
    await expect(items).toHaveCount(1);
    await expect(items).toHaveText(/Beta/);

    await input.press("Enter");
    const selected = await page.evaluate(() => (globalThis as any).__fb);
    expect(selected).toMatchObject({ name: "Beta" });
    await expect(searchView).toHaveCount(0);

    // Second call: Escape resolves undefined.
    await page.evaluate(() => {
      (globalThis as any).__fb2 = (globalThis as any).client.ui.filterBox(
        "Pick one",
        [{ name: "Alpha" }, { name: "Beta" }],
      );
    });
    await expect(page.locator("m3e-search-view")).toBeVisible();
    await page.locator(".sb-filter-input").press("Escape");
    const cancelled = await page.evaluate(() => (globalThis as any).__fb2);
    expect(cancelled).toBeUndefined();
    await expect(page.locator("m3e-search-view")).toHaveCount(0);
  });

});

// Separate describe: the profile avatar action button only renders when the
// server is account-managed (multi-space "spaces" mode, `accountManaged:
// true` in ActionButtonContext) -- the plain single-space fixture above
// never shows it (default `actionButtons` config is `[]`; the profile entry
// comes from the Std library's Config.md, gated `accountManaged = true`).
authenticatedTest.describe("filter box: mobile profile menu", () => {
  authenticatedTest(
    "opens a working FilterList at 411x761",
    async ({ adminPage: page, sbServer }) => {
      await adminApi(page, sbServer, "POST", "spaces", {
        name: "Mobile",
        binding: { prefix: "/mobile" },
      });

      // isMobileDevice() (client/lib/mobile.ts) gates on `(pointer: fine)`,
      // not viewport width -- a desktop-Chrome Playwright project reports a
      // fine pointer regardless of viewport size, so the mobile branch
      // (client/editor_ui.tsx's profile-button callback routing through
      // client.ui.filterBox instead of the anchored menu) needs a forced
      // coarse-pointer override, not just a resize.
      await page.addInitScript(() => {
        const coarsePointerQuery = "(pointer: coarse)";
        const finePointerQuery = "(pointer: fine)";
        const realMatchMedia = window.matchMedia.bind(window);
        window.matchMedia = (query: string) => {
          if (query === finePointerQuery) {
            return realMatchMedia("not all");
          }
          if (query === coarsePointerQuery) {
            return realMatchMedia("all");
          }
          return realMatchMedia(query);
        };
      });
      await page.setViewportSize({ width: 411, height: 761 });
      await gotoSilverBulletPage(
        page,
        { ...sbServer, url: `${sbServer.url}/mobile` },
        "index",
      );

      await page.locator("#sb-top button:has(.sb-profile-avatar)").click();

      const searchView = page.locator("m3e-search-view");
      await expect(searchView).toBeVisible();
      expect(await isUpgraded(page, "m3e-search-view")).toBe(true);
      expect(await isUpgraded(page, "m3e-list")).toBe(true);

      await page.locator(".sb-filter-input").press("Escape");
      await expect(searchView).toHaveCount(0);
    },
  );
});
