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

/**
 * The section switcher is a floating icon-only `m3e-toolbar` pinned to the
 * sheet's bottom edge (Jack's round-3 direction — it replaced `m3e-tabs`).
 * Sections are identified by the buttons' `aria-label`, since they carry no
 * visible text; the ACTIVE one is named in the sheet's header title.
 */
function sectionButton(page: Page, label: string) {
  return page.locator(
    `#sb-navigation-sheet .sb-sheet-section-toolbar m3e-icon-button[aria-label="${label}"]`,
  );
}

function sheetTitle(page: Page) {
  return page.locator('#sb-navigation-sheet [slot="header"]');
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

test.describe("Navigation bottom sheet (client/components/navigation_sheet.tsx, V7)", () => {
  test("opening the sheet shows the History section by default with recentPaths rows, no input box present", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await gotoSilverBulletPage(page, sbServer, "Beta");
    await gotoSilverBulletPage(page, sbServer, "Gamma");

    await openNavigationSheet(page);

    // Active section is shown by the header title + the filled button, not
    // by a selected tab.
    await expect(sheetTitle(page)).toHaveText("History");
    await expect(sectionButton(page, "History")).toHaveAttribute(
      "variant",
      "filled",
    );

    const sheet = page.locator("#sb-navigation-sheet");
    await expect(
      sheet.locator(".sb-navigation-sheet-body .sb-name"),
    ).toContainText(["Beta", "Alpha"]);
    await expect(sheet.locator("input")).toHaveCount(0);
  });

  // Load-bearing negative assertion for the round-3 reversal: the tabs are
  // gone, replaced by the same floating icon-only toolbar idiom the search
  // sheet briefly wore. Removing m3e-tabs also removes the @m3e/web
  // tab-panel visibility bug the old V13 workaround existed to paper over.
  test("NO tabs remain — the section switcher is a floating icon-only toolbar", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await openNavigationSheet(page);

    await expect(page.locator("#sb-navigation-sheet m3e-tabs")).toHaveCount(0);
    await expect(page.locator("#sb-navigation-sheet m3e-tab-panel")).toHaveCount(
      0,
    );

    const toolbar = page.locator(
      "#sb-navigation-sheet .sb-sheet-section-toolbar",
    );
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator("m3e-icon-button")).toHaveCount(3);

    // Icon-only: the switcher carries no section LABEL text. Asserted
    // against the light DOM specifically, because Playwright's text matchers
    // pierce open shadow roots and `m3e-icon` renders its glyph NAME as
    // ligature text ("history"/"update"/"account_tree") inside its own shadow
    // root — that ligature is how the Material Symbols font draws the glyph,
    // not a visible word, so a naive `toHaveText("")` here fails on correct
    // markup. The labels survive only as `title`/`aria-label`, which is what
    // makes the sheet's header title the sole visible indicator.
    const lightDomText = await toolbar.evaluate((el) =>
      el.textContent?.trim() ?? "",
    );
    expect(lightDomText).toBe("");
    for (const label of ["History", "Changelog", "Sitemap"]) {
      await expect(toolbar.getByText(label, { exact: true })).toHaveCount(0);
    }

    // Pinned to the sheet's bottom edge, inside the sheet's own bounds.
    const [toolbarBox, sheetBox] = await Promise.all([
      toolbar.boundingBox(),
      page.locator("#sb-navigation-sheet").boundingBox(),
    ]);
    expect(toolbarBox).not.toBeNull();
    expect(sheetBox).not.toBeNull();
    expect(toolbarBox!.y).toBeGreaterThan(sheetBox!.y + sheetBox!.height / 2);
    expect(toolbarBox!.y + toolbarBox!.height).toBeLessThanOrEqual(
      sheetBox!.y + sheetBox!.height + 1,
    );
  });

  // The sheet is sized ONLY by m3e-bottom-sheet's own `detents` API — no vh,
  // no px height anywhere in navigation_sheet.tsx or its stylesheet. Before
  // this round it declared no detents at all and collapsed to its content
  // height (live-measured at 19% of the viewport), which left the floating
  // switcher nothing stable to pin to.
  // It OPENS at `half` (detent index 0) and can be dragged up to `full` — a
  // single-entry detents array is what made it feel stuck (see the drag test
  // below), so "capped" here means "opens at", not "cannot exceed".
  test("the sheet opens at roughly 50% of the viewport via detents", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await openNavigationSheet(page);

    const viewportHeight = page.viewportSize()?.height ?? 0;
    const sheetHeight = await page
      .locator("#sb-navigation-sheet")
      .evaluate((el) => el.getBoundingClientRect().height);

    expect(sheetHeight).toBeGreaterThan(viewportHeight * 0.3);
    expect(sheetHeight).toBeLessThanOrEqual(viewportHeight * 0.6);

    // `detents` is a real array, not the string a raw JSX attribute would
    // leave behind (the Preact/Lit interop trap search_sheet.tsx documents).
    const detents = await page
      .locator("#sb-navigation-sheet")
      .evaluate((el) => (el as unknown as { detents: string[] }).detents);
    expect(detents).toEqual(["half", "full"]);
  });

  // Jack's feedback: the sheet was "stuck at half height, can't drag". The
  // cause was NOT a missing `handle` (it was already forced on, and the
  // shadow root renders `#handle[role=button]`) — it was that a ONE-entry
  // `detents` array leaves the drag gesture nowhere to snap to, so every
  // drag rubber-banded back. Measured before the fix: a 220px upward drag
  // moved the sheet from 324px to 347px (pure overshoot) and stayed there.
  // This test drives the real pointer gesture on the real handle.
  test("dragging the handle upward snaps the sheet to the `full` detent, and back down to `half`", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Alpha");
    await openNavigationSheet(page);
    await page.waitForTimeout(900);

    const sheet = page.locator("#sb-navigation-sheet");
    const height = () =>
      sheet.evaluate((el) => Math.round(el.getBoundingClientRect().height));

    // The handle lives in the sheet's shadow root, so its coordinates come
    // from an evaluate; the gesture itself is a real page.mouse drag, which
    // emits the pointerdown/pointermove/pointerup the component listens for.
    const handleCenter = () =>
      sheet.evaluate((el) => {
        const h = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot
          .querySelector("#handle")!;
        const r = h.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });

    async function drag(dy: number) {
      const c = await handleCenter();
      await page.mouse.move(c.x, c.y);
      await page.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(c.x, c.y + (i * dy) / 12);
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      await page.waitForTimeout(900);
    }

    const atHalf = await height();
    expect(atHalf).toBeGreaterThan(0);

    await drag(-220);
    const atFull = await height();
    // Distinct detents: `full` is materially taller than `half`, not the few
    // px of overshoot the single-detent version produced.
    expect(atFull).toBeGreaterThan(atHalf * 1.5);

    await drag(220);
    const backToHalf = await height();
    expect(backToHalf).toBeLessThan(atFull);
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
    await sectionButton(page, "Changelog").click();

    await expect(sheetTitle(page)).toHaveText("Changelog");
    const panel = page.locator("#sb-navigation-sheet .sb-navigation-sheet-body");
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
    await sectionButton(page, "Sitemap").click();

    await expect(sheetTitle(page)).toHaveText("Sitemap");
    const panel = page.locator("#sb-navigation-sheet .sb-navigation-sheet-body");
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
