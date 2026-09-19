import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// V10 — visual verification (docs/plans/2026-09-17-vertical-toolbar-search-
// nav-redesign-spec.md §5 P3). The 8 numbered checks below are the spec's own
// acceptance list verbatim; the offline-chip check is a V11 bonus (added
// mid-gauntlet by Jack, not in the original spec's 8 points). Screenshots are
// saved to test-results/v10-visual/ (gitignored, same as Playwright's own
// default artifact dir) via plain `page.screenshot({ path })` — this repo has
// no `toHaveScreenshot()` visual-snapshot convention anywhere else in e2e/.

const SHOT_DIR = "test-results/v10-visual";

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
} as const;

const SPACE_FILES = {
  "Alpha.md": "# Alpha\n\nFirst page.\n",
  "Beta.md": "# Beta\n\nSecond page.\n",
  "Gamma.md": "# Gamma\n\nThird page.\n",
  "Delta.md": "# Delta\n\nFourth page.\n",
  "Epsilon.md": "# Epsilon\n\nFifth page, current.\n",
};

/**
 * Fails if any two (visible, non-zero-size) elements matching `selectors`
 * visually overlap. Scoped to sibling interactive controls that must not
 * collide (toolbar buttons, app-bar trailing icons, menu items, tabs) — not
 * a literal DOM-wide pairwise scan, since parent/child containment (e.g. the
 * app bar containing its own buttons) is expected and would make a naive
 * whole-page scan vacuously fail on every page. This is the spec's own N12-
 * carried-forward "no overlap" convention (§5 V10 check 8); no existing e2e
 * spec in this repo has a reusable helper for it (grepped, none found), so
 * this one is new.
 */
async function assertNoOverlap(
  page: Page,
  selectors: string[],
  label: string,
): Promise<void> {
  const boxes: {
    name: string;
    box: { x: number; y: number; width: number; height: number };
  }[] = [];
  for (const sel of selectors) {
    const loc = page.locator(sel);
    const count = await loc.count();
    for (let i = 0; i < count; i++) {
      const el = loc.nth(i);
      const box = await el.boundingBox();
      if (!box || box.width === 0 || box.height === 0) continue;
      boxes.push({ name: `${sel} #${i}`, box });
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].box;
      const b = boxes[j].box;
      const overlaps =
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
      expect(
        overlaps,
        `${label}: "${boxes[i].name}" overlaps "${boxes[j].name}"`,
      ).toBe(false);
    }
  }
}

async function openSearchSheet(page: Page): Promise<void> {
  await page
    .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Search"]')
    .click();
  await expect(page.locator("#sb-search-sheet")).toHaveAttribute("open", "");
}

function modeTrigger(page: Page) {
  return page.locator(
    '#sb-search-sheet m3e-icon-button[title="Change search mode"]:visible',
  );
}

async function switchMode(
  page: Page,
  mode: "Search" | "Open" | "Run",
): Promise<void> {
  await modeTrigger(page).click();
  const menu = page.locator("#sb-search-mode-menu");
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);
  await menu.locator("m3e-menu-item-radio", { hasText: mode }).click();
}

async function openNavigationSheet(page: Page): Promise<void> {
  await page
    .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Navigation"]')
    .click();
  await expect(page.locator("#sb-navigation-sheet")).toHaveAttribute(
    "open",
    "",
  );
}

/** Real navigation across several pages + one recorded search term, so
 * recentPaths/recentSearchTerms/allPages are all non-empty before any
 * screenshot — same seeding pattern search-sheet.test.ts/navigation-
 * sheet.test.ts already use. */
async function seedLiveState(page: Page, sbServer: { url: string }) {
  await gotoSilverBulletPage(page, sbServer as any, "Alpha");
  await gotoSilverBulletPage(page, sbServer as any, "Beta");
  await gotoSilverBulletPage(page, sbServer as any, "Gamma");
  await gotoSilverBulletPage(page, sbServer as any, "Delta");
  await gotoSilverBulletPage(page, sbServer as any, "Epsilon");

  await openSearchSheet(page);
  await switchMode(page, "Search");
  // A term matching no seeded page — activateSearchOption's opt-undefined
  // branch records the term then closes the sheet deterministically (same
  // technique search-sheet.test.ts's own recordSearchTerm test uses).
  await page.locator("#sb-search-sheet-input").fill("myrecordedvisualterm");
  await page.locator("#sb-search-sheet-input").press("Enter");
  await expect(page.locator("#sb-search-sheet")).not.toHaveAttribute(
    "open",
    "",
  );
}

test.use({ spaceFiles: SPACE_FILES });

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test(`${name} (${viewport.width}x${viewport.height}): V10 visual verification, all 8 spec checks`, async ({
    page,
    sbServer,
  }) => {
    await page.setViewportSize(viewport);
    const dir = `${SHOT_DIR}/${name}`;
    await seedLiveState(page, sbServer);

    await test.step("1. toolbar closed: 4 icon-buttons, floating pill (not full-width)", async () => {
      const toolbar = page.locator(".sb-floating-toolbar");
      const buttons = toolbar.locator("m3e-icon-button");
      await expect(buttons).toHaveCount(4);
      await expect(buttons.nth(0)).toHaveAttribute("aria-label", "Search");
      await expect(buttons.nth(1)).toHaveAttribute("aria-label", "Navigation");
      await expect(buttons.nth(2)).toHaveAttribute("aria-label", "Journal");
      await expect(buttons.nth(3)).toHaveAttribute(
        "aria-label",
        "Notifications",
      );

      const box = (await toolbar.boundingBox())!;
      // A vertical 4-icon-button column is ~50-60px wide. Threshold of 150px
      // is a generous upper bound that still clearly rejects the old
      // full-width nav-bar (390px on mobile, 1440px on desktop) it replaced.
      expect(
        box.width,
        "toolbar must be a small floating pill, not full-width",
      ).toBeLessThan(150);

      await page.screenshot({ path: `${dir}/01-toolbar-closed.png` });
      await assertNoOverlap(
        page,
        [".sb-floating-toolbar m3e-icon-button"],
        "toolbar buttons",
      );
    });

    await test.step("2. search sheet + mode menu: 3 radios, checked reflects mode, live row-count update", async () => {
      await openSearchSheet(page);
      const rows = page.locator(
        "#sb-search-sheet .sb-search-sheet-list .sb-name",
      );
      const historyCount = await rows.count();
      expect(
        historyCount,
        "Open-mode history should be seeded/non-empty",
      ).toBeGreaterThan(0);
      await page.screenshot({ path: `${dir}/02a-search-sheet-history.png` });

      await modeTrigger(page).click();
      const menu = page.locator("#sb-search-mode-menu");
      await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);

      const radios = menu.locator("m3e-menu-item-radio");
      await expect(radios).toHaveCount(3);
      await expect(radios).toContainText(["Search", "Open", "Run"]);
      // Default mode is Open (search_sheet.tsx's DEFAULT_MODE) — its radio
      // must carry the reflected `checked` attribute, the others must not.
      await expect(radios.filter({ hasText: "Open" })).toHaveAttribute(
        "checked",
        "",
      );
      await expect(radios.filter({ hasText: "Search" })).not.toHaveAttribute(
        "checked",
        "",
      );
      await expect(radios.filter({ hasText: "Run" })).not.toHaveAttribute(
        "checked",
        "",
      );

      await page.screenshot({ path: `${dir}/02b-mode-menu-open.png` });
      await assertNoOverlap(
        page,
        ["#sb-search-mode-menu m3e-menu-item-radio"],
        "mode menu items",
      );

      // Dismiss the popover by clicking the input (outside the menu), then
      // type — proving the list live-updates, not a static snapshot.
      await page.locator("#sb-search-sheet-input").click();
      await page.locator("#sb-search-sheet-input").fill("Alpha");
      const typedCount = await rows.count();
      expect(
        typedCount,
        "row count must differ between history and typed-query results",
      ).not.toBe(historyCount);
      await page.screenshot({
        path: `${dir}/02c-search-sheet-query-typed.png`,
      });
    });

    await test.step("3. search sheet: zero m3e-autocomplete elements in the DOM", async () => {
      const autocompleteCount = await page.locator("m3e-autocomplete").count();
      expect(autocompleteCount).toBe(0);
      await page.screenshot({ path: `${dir}/03-no-autocomplete.png` });
    });

    // Close the search sheet before opening the navigation sheet.
    await page.locator("#sb-search-sheet-input").press("Escape");
    await expect(page.locator("#sb-search-sheet")).not.toHaveAttribute(
      "open",
      "",
    );

    await test.step("4. navigation sheet, History section: 3 switcher buttons, History active, list populated", async () => {
      await openNavigationSheet(page);
      const buttons = page.locator(
        "#sb-navigation-sheet .sb-sheet-section-toolbar m3e-icon-button",
      );
      await expect(buttons).toHaveCount(3);
      // Active section is named in the sheet's header title and filled in the
      // switcher — there are no tabs any more.
      await expect(
        page.locator('#sb-navigation-sheet [slot="header"]'),
      ).toHaveText("History");
      await expect(buttons.nth(0)).toHaveAttribute("variant", "filled");

      const historyRows = page.locator(
        "#sb-navigation-sheet .sb-navigation-sheet-body .sb-name",
      );
      const historyCount = await historyRows.count();
      expect(historyCount, "History section must be populated")
        .toBeGreaterThan(0);

      await page.screenshot({ path: `${dir}/04-navigation-history.png` });
      await assertNoOverlap(
        page,
        ["#sb-navigation-sheet .sb-sheet-section-toolbar m3e-icon-button"],
        "navigation sheet section switcher",
      );
    });

    await test.step("5. navigation sheet, Changelog section: pages + timestamps, no author column", async () => {
      await page
        .locator('#sb-navigation-sheet m3e-icon-button[aria-label="Changelog"]')
        .click();
      const panel = page.locator(
        "#sb-navigation-sheet .sb-navigation-sheet-body",
      );
      await expect(panel).toBeVisible();

      const nameCount = await panel.locator(".sb-name").count();
      expect(nameCount, "Changelog must list pages").toBeGreaterThan(0);
      // Every row's hint is "modified {relative-time}" (changelog_tab.tsx) —
      // confirms timestamps are actually rendered, not just page names.
      await expect(panel.locator(".sb-hint").first()).toContainText("modified");
      await expect(panel).not.toContainText(/author|who/i);

      await page.screenshot({ path: `${dir}/05-navigation-changelog.png` });
    });

    await test.step("6. navigation sheet, Sitemap section: row count matches viewState.allPages.length", async () => {
      await page
        .locator('#sb-navigation-sheet m3e-icon-button[aria-label="Sitemap"]')
        .click();
      const panel = page.locator(
        "#sb-navigation-sheet .sb-navigation-sheet-body",
      );
      await expect(panel).toBeVisible();

      // Read the total the same way the app itself computes allPages — the
      // exact pattern navigation-sheet.test.ts's own Sitemap test uses,
      // rather than guessing at the Std library's page count.
      const expectedCount = await page.evaluate(async () => {
        const list = await (globalThis as any).client.space.fetchPageList();
        return list.length;
      });
      await expect(panel.locator(".sb-sitemap-all .sb-name")).toHaveCount(
        expectedCount,
      );

      await page.screenshot({ path: `${dir}/06-navigation-sitemap.png` });
    });

    // Close the navigation sheet before checking the app bar.
    await page.keyboard.press("Escape");
    await expect(page.locator("#sb-navigation-sheet")).not.toHaveAttribute(
      "open",
      "",
    );

    await test.step("7. app bar: read-only icon-button visible in trailing slot, before the kebab trigger", async () => {
      const trailing = page.locator("m3e-app-bar span.sb-trailing");
      const readOnlyButton = trailing.locator(
        'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
      );
      const kebab = trailing.locator('m3e-icon-button[title="More actions"]');

      await expect(readOnlyButton).toHaveCount(1);
      await expect(readOnlyButton).toBeVisible();
      await expect(kebab).toHaveCount(1);

      const order = await trailing.evaluate(
        (el, [roSel, kebabSel]) => {
          const ro = el.querySelector(roSel)!;
          const kb = el.querySelector(kebabSel)!;
          return ro.compareDocumentPosition(kb) &
            Node.DOCUMENT_POSITION_FOLLOWING
            ? "before"
            : "after";
        },
        [
          'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
          'm3e-icon-button[title="More actions"]',
        ],
      );
      expect(order).toBe("before");

      await page.screenshot({ path: `${dir}/07-app-bar-trailing.png` });
    });

    await test.step("8. no element's getBoundingClientRect() overlaps another's (base state: toolbar + app-bar trailing)", async () => {
      await assertNoOverlap(
        page,
        [
          ".sb-floating-toolbar m3e-icon-button",
          "m3e-app-bar span.sb-trailing > *",
        ],
        `base state (${name})`,
      );
    });
  });
}

// --- Offline chip (V11 bonus, added mid-gauntlet, not in the original spec's
// 8-point list) -------------------------------------------------------------
//
// Uses the real online/offline detection path (client/service_worker/
// proxy_router.ts's checkOnline(), pinging the server every `pingInterval`ms
// = 5000ms per plug-api/constants.ts), driven by the actual Playwright
// `context().setOffline()` API — same mechanism e2e/pwa-offline.test.ts
// already uses — not a fake CSS-only screenshot. Requires the service worker
// enabled and a completed initial sync (checkOnline() no-ops until
// `syncEngine` is configured), so this needs its own `disableServiceWorker:
// false` fixture, separate from the main describe above (which relies on the
// default SW-disabled fast path).

/** Wait for the service worker to be active and controlling the page — same
 * helper pwa-offline.test.ts uses. */
async function waitForServiceWorkerReady(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        );
        if (navigator.serviceWorker.controller) resolve();
      });
    }
    return reg.active?.state;
  });
}

/** Wait for the initial sync to complete, so checkOnline()'s syncEngine ping
 * path is actually wired up — same helper pwa-offline.test.ts uses. */
async function waitForSyncComplete(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener(
        "message",
        function handler(event: MessageEvent) {
          if (event.data?.type === "space-sync-complete") {
            navigator.serviceWorker.removeEventListener("message", handler);
            resolve();
          }
        },
      );
    });
  });
}

test.describe("Offline chip (V11 bonus check)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "SW + setOffline interplay is Chromium-only, same restriction pwa-offline.test.ts documents",
  );
  test.describe.configure({ retries: 2 });

  test.use({
    disableServiceWorker: false,
    spaceFiles: {
      "index.md":
        "# Offline Visual Check\nContent for the V10/V11 offline screenshot.",
    },
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`${name} (${viewport.width}x${viewport.height}): offline chip visible in app-bar trailing slot`, async ({
      page,
      sbServer,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(sbServer.url);
      const editor = page.locator("#sb-editor .cm-content");
      await editor.waitFor({ state: "visible", timeout: 30_000 });

      await waitForServiceWorkerReady(page);
      await expect(editor).toContainText("Content for the V10/V11", {
        timeout: 30_000,
      });
      await waitForSyncComplete(page);

      const chip = page.locator(".sb-offline-chip");
      await expect(chip).toHaveCount(0);

      await page.context().setOffline(true);

      // checkOnline() pings every 5000ms (pingTimeout 2000ms) — the chip
      // should appear within one or two cycles of going offline.
      await expect(chip).toBeVisible({ timeout: 15_000 });
      await expect(chip).toHaveAttribute("aria-label", "Offline");
      await expect(chip).toContainText("Offline");

      await page.screenshot({
        path: `${SHOT_DIR}/${name}/09-offline-chip.png`,
      });

      await page.context().setOffline(false);
    });
  }
});

// --- HISTORICAL DEFECT, now structurally impossible (found by V10, worked
// around by V13, ELIMINATED in the round-3 nav redesign).
//
// The defect: switching Navigation-sheet TABS left the previously active
// `m3e-tab-panel`'s content `visibility: visible`, overlapping the
// newly-selected panel at the same screen position — garbled overlapping
// text, e.g. Changelog's "modified N seconds ago" hints bleeding through the
// Sitemap panel underneath.
//
// Root cause (direct decompile + live getComputedStyle probe, reproduced with
// two independent tab sequences): `M3eTabsElement`'s own stylesheet has
//   `.tabs.sliding ::slotted([slot="panel"]) {
//      visibility: var(--_tabs-slide-visibility, "hidden"); }`
// whose fallback is the STRING `"hidden"` (with literal quote characters),
// which is not a valid CSS `visibility` keyword. The browser therefore drops
// the whole declaration whenever the custom property is unset, and
// `visibility` falls back to `visible` on every panel the JS has not
// explicitly marked during an active swipe gesture. `m3e-tab-panel` has no
// other hiding path (`m3e-tabs` never sets `hidden` on panels anywhere in the
// file — grepped). An upstream `@m3e/web@2.7.12` library bug, not an app bug.
//
// V13 worked around it by driving the `hidden` attribute on each non-active
// panel from `navigation_sheet.tsx`'s own tracked selection state. The
// round-3 redesign removed the workaround along with its cause: there are no
// tabs and no panels at all now — the sheet renders ONLY the active section,
// so there is no second panel that could fail to hide.
//
// This test is kept, retargeted at the invariant that actually matters and
// that now holds by construction: after switching sections, the previous
// section's content is GONE, not merely visually hidden.
test.describe("Navigation sheet renders only the active section (no panel overlap)", () => {
  test.use({
    spaceFiles: {
      "Alpha.md": "# Alpha\n\nFirst page.\n",
      "Beta.md": "# Beta\n\nSecond page.\n",
    },
  });

  test("switching from Changelog to Sitemap removes the Changelog content entirely", async ({
    page,
    sbServer,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await gotoSilverBulletPage(page, sbServer, "Beta");
    await openNavigationSheet(page);

    const body = page.locator(
      "#sb-navigation-sheet .sb-navigation-sheet-body",
    );
    const title = page.locator('#sb-navigation-sheet [slot="header"]');

    await page
      .locator('#sb-navigation-sheet m3e-icon-button[aria-label="Changelog"]')
      .click();
    await expect(title).toHaveText("Changelog");
    // Changelog rows are the ones carrying a "modified ..." hint.
    await expect(body.locator(".sb-hint").first()).toContainText("modified");

    await page
      .locator('#sb-navigation-sheet m3e-icon-button[aria-label="Sitemap"]')
      .click();
    await expect(title).toHaveText("Sitemap");

    // The Changelog section is not in the DOM at all any more — the stronger
    // form of the old `not.toBeVisible()` assertion.
    await expect(body.locator(".sb-sitemap-all")).toHaveCount(1);
    await expect(body.getByText("modified", { exact: false })).toHaveCount(0);
  });
});
