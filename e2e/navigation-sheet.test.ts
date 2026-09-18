import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// client/components/navigation_sheet.tsx (leaf V7, docs/plans/2026-09-17-
// vertical-toolbar-search-nav-redesign-spec.md §2.6/§2.7/§2.8/§5) is REAL,
// unit-tested (client/components/navigation_sheet.test.ts and its
// co-located History/Changelog/Sitemap tab component tests), and, as of V8,
// wired live into client/editor_ui.tsx. These are the exact
// acceptance assertions from spec §5 V7's "Accept:" bullet, now real (leaf
// V9) rather than `test.fixme`.

test.use({
  spaceFiles: {
    "Alpha.md": "# Alpha\n\nFirst page.\n",
    "Beta.md": "# Beta\n\nSecond page.\n",
    "Gamma.md": "# Gamma\n\nThird page.\n",
  },
});

async function openNavigationSheet(page: Page): Promise<void> {
  await page
    .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Navigation"]')
    .click();
  await expect(page.locator("#sb-navigation-sheet")).toHaveAttribute(
    "open",
    "",
  );
}

test.describe("Navigation bottom sheet (client/components/navigation_sheet.tsx, V7)", () => {
  test("opening the sheet shows History tab selected by default with recentPaths rows, no input box present", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await gotoSilverBulletPage(page, sbServer, "Beta");
    await gotoSilverBulletPage(page, sbServer, "Gamma");

    await openNavigationSheet(page);

    await expect(page.locator('m3e-tab[for="sb-nav-history"]')).toHaveAttribute(
      "selected",
      "",
    );

    const sheet = page.locator("#sb-navigation-sheet");
    await expect(sheet.locator("#sb-nav-history .sb-name")).toContainText([
      "Beta",
      "Alpha",
    ]);
    await expect(sheet.locator("input")).toHaveCount(0);
  });

  test("clicking Changelog shows pages sorted by lastModified descending with no 'who'/author column rendered anywhere", async ({
    sbServer,
    page,
  }) => {
    // Writing all 3 space files at space-seed time (test.use spaceFiles,
    // above) does NOT reliably produce distinct `lastModified` values —
    // verified directly: those sequential writes land within the same
    // filesystem mtime tick, so ChangelogTab's stable sort was a no-op and
    // rows came back in alphabetical (Alpha/Beta/Gamma), not seed, order.
    // An earlier version of this test also tried editing+saving Alpha live
    // in the browser via keyboard input, hoping the in-app save pipeline
    // would bump it to the top — that depends on
    // `objectIndex.getObjectByRef` resolving an enriched meta record in the
    // background before `update-current-page-meta` dispatches (a real but
    // unrelated eventual-consistency gap in SB's pre-existing
    // content_manager.ts save path, not a defect in ChangelogTab/V7 or its
    // wiring/V8), which never landed within a reasonable timeout here.
    // Sidestep both: write each page's real file content directly via the
    // same `.fs` PUT endpoint the client itself uses to save
    // (http_space_primitives.ts's `writeFile`), well-separated by a real
    // wall-clock gap so no filesystem mtime resolution can tie them, then
    // do a real full-page navigation (not SPA) so the client re-boots and
    // re-fetches the page list fresh from disk — no reliance on the
    // in-browser save/object-index-refresh pipeline at all.
    async function touch(name: string): Promise<void> {
      const res = await fetch(`${sbServer.url}/.fs/${name}.md`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: `# ${name}\n\nTouched at ${Date.now()}.\n`,
      });
      if (!res.ok) {
        throw new Error(`Failed to touch ${name}.md: ${res.status}`);
      }
    }
    await touch("Alpha");
    await new Promise((r) => setTimeout(r, 1100));
    await touch("Beta");
    await new Promise((r) => setTimeout(r, 1100));
    await touch("Gamma");

    await gotoSilverBulletPage(page, sbServer, "Gamma");

    await openNavigationSheet(page);
    await page.locator('m3e-tab[for="sb-nav-changelog"]').click();

    const panel = page.locator("#sb-nav-changelog");
    await expect(panel).toBeVisible();
    // `allPages` (and so this panel's rows) also includes the built-in Std
    // library pages, not just the 3 space files seeded above — so this
    // can't assert the full row list verbatim. Assert the *relative* order
    // among just the 3 known pages instead (same "don't assume a total,
    // check the pages you actually control" fix already applied to the
    // Sitemap test below).
    await expect
      .poll(async () => {
        const names = await panel.locator(".sb-name").allTextContents();
        return names.filter((n) => ["Gamma", "Beta", "Alpha"].includes(n));
      })
      .toEqual(["Gamma", "Beta", "Alpha"]);
    await expect(panel).not.toContainText(/author|who/i);
  });

  test("clicking Sitemap shows a row count equal to viewState.allPages.length and a 'commonly navigated' lead section ordered by lastOpened descending", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await gotoSilverBulletPage(page, sbServer, "Beta");
    await gotoSilverBulletPage(page, sbServer, "Gamma");

    await openNavigationSheet(page);
    await page.locator('m3e-tab[for="sb-nav-sitemap"]').click();

    const panel = page.locator("#sb-nav-sitemap");
    await expect(panel).toBeVisible();

    // `allPages` also includes the built-in Std library pages (Journal,
    // APIs, Slash Templates, etc.) — not just the 3 space files seeded
    // above — so the expected count can't be hardcoded to 3. Read the real
    // total the same way the app itself computes it (client.space is the
    // exact source client.ts's own allPages-population path uses), rather
    // than guessing at the library's page count.
    const expectedCount = await page.evaluate(async () => {
      const list = await (globalThis as any).client.space.fetchPageList();
      return list.length;
    });
    await expect(panel.locator(".sb-sitemap-all .sb-name")).toHaveCount(
      expectedCount,
    );
    await expect(
      panel.locator(".sb-sitemap-commonly-navigated .sb-name"),
    ).toHaveText(["Gamma", "Beta", "Alpha"]);
  });

  // §6's e2e mapping table (spec docs/plans/2026-09-17-vertical-toolbar-
  // search-nav-redesign-spec.md) maps the old nav-bar.test.ts's "Escape
  // closes the panel" to BOTH search-sheet.test.ts and
  // navigation-sheet.test.ts getting their own "Escape closes the sheet"
  // test — search-sheet.test.ts already has one; this file's original 3
  // test.fixme stubs never included the equivalent, leaving this row
  // without a real home. NavigationSheet.tsx wires
  // `onCancel={() => onClose()}` / `onClosed={() => onClose()}` directly
  // (unlike search_sheet.tsx, which documents the JSX onCancel prop as
  // unreliable and uses a ref-based listener instead) — added here to
  // close that gap.
  test("Escape closes the sheet", async ({ sbServer, page }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await openNavigationSheet(page);
    await page.keyboard.press("Escape");
    await expect(page.locator("#sb-navigation-sheet")).not.toHaveAttribute(
      "open",
      "",
    );
  });
});
