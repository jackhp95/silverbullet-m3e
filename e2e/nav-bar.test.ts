import { expect, test } from "./fixtures.ts";

// Exercises client/components/nav_bar.tsx + client/editor_ui.tsx's panel
// host (2026-09-17 nav-bar redesign spec, leaves N1-N4 — view state, the
// nav-bar shell + 5 destination items, the FAB, and the non-modal panel
// host). Destination-specific view content (Recent/Search/Run/Notifications)
// is placeholder-only here — real content lands in leaves N5-N9, each with
// its own e2e coverage. This file supersedes none of e2e/floating-toolbar
// .test.ts or e2e/search-sheet.test.ts yet (those are ported test-by-test
// across N5, N7, N10, then deleted in N11 — see the spec's §5.1 table);
// both are expected to fail in the interim, since floating_toolbar.tsx is
// deleted (N2) and the old search_sheet.tsx is unmounted (N1's retarget of
// client.startSearchSheet()/"Navigate: Search Sheet").

/** Today's date as YYYY-MM-DD, matching the default journal page name. */
function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type Rect = { x: number; y: number; width: number; height: number };

function bottom(r: Rect): number {
  return r.y + r.height;
}
function right(r: Rect): number {
  return r.x + r.width;
}

test.describe("Nav bar shell + FAB + panel host (N2-N4)", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Welcome",
    },
  });

  test("renders exactly 5 nav items in order: Journal, Recent, Search, Run, Notifications", async ({
    sbPage,
  }) => {
    const items = sbPage.locator(".sb-nav-bar m3e-nav-item");
    await expect(items).toHaveCount(5);
    const labels = (await items.allTextContents()).map((t) => t.trim());
    expect(labels).toEqual([
      "Journal",
      "Recent",
      "Search",
      "Run",
      "Notifications",
    ]);
  });

  test("nav bar is fixed, flush to the viewport bottom, and full width", async ({
    sbPage,
  }) => {
    const viewport = sbPage.viewportSize();
    expect(viewport).not.toBeNull();
    const rect = await sbPage.locator(".sb-nav-bar").boundingBox();
    expect(rect).not.toBeNull();
    // Flush to the bottom edge and spanning the full viewport width — a few
    // px tolerance for subpixel layout, not scrollbar/margin slop.
    expect(Math.abs(bottom(rect!) - viewport!.height)).toBeLessThan(2);
    expect(Math.abs(rect!.x)).toBeLessThan(2);
    expect(Math.abs(right(rect!) - viewport!.width)).toBeLessThan(2);
  });

  test("clicking Recent selects only Recent; clicking it again clears the selection", async ({
    sbPage,
  }) => {
    const selected = sbPage.locator(".sb-nav-bar m3e-nav-item[selected]");
    await expect(selected).toHaveCount(0);

    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]')
      .click();
    await expect(selected).toHaveCount(1);
    expect((await selected.allTextContents())[0].trim()).toBe("Recent");

    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]')
      .click();
    await expect(selected).toHaveCount(0);
  });

  // Load-bearing: `m3e-nav-item`'s own click handler dispatches a cancelable
  // `beforeinput` before setting `this.selected = true`
  // (dist/nav-bar.js's `_M3eNavItemElement_handleClick`, re-verified
  // directly against the compiled source, not just the spec's restatement
  // of it). Journal's `onBeforeInput` calls `preventDefault()`, which makes
  // that `dispatchEvent` call return `false`, short-circuiting selection
  // entirely — this is what a regression in that wiring (or in the
  // component's own internals) would break.
  test("clicking Journal never selects any nav item (beforeinput preventDefault)", async ({
    sbPage,
  }) => {
    const selected = sbPage.locator(".sb-nav-bar m3e-nav-item[selected]");
    await expect(selected).toHaveCount(0);

    const journal = sbPage.locator(
      '.sb-nav-bar m3e-nav-item[aria-label="Journal"]',
    );
    const pageNameInput = sbPage.locator("#sb-current-page input.sb-input");
    const expectedPage = `Journal/${today()}`;

    // "Journal: Today" (libraries/Library/Std/Journal/Journal.md) is a
    // space-lua command that can still be registering for a moment after
    // the editor reports ready — retry the click rather than assume it's
    // already registered (same reasoning as the old
    // e2e/floating-toolbar.test.ts's own Journal test).
    await expect
      .poll(
        async () => {
          await journal.click();
          return await pageNameInput.inputValue();
        },
        { timeout: 15_000 },
      )
      .toBe(expectedPage);

    // The navigation happened (asserted above) but no nav item — Journal
    // included — ever became selected.
    await expect(selected).toHaveCount(0);
  });

  test("clicking Journal while another destination is selected leaves it selected, and Journal unselected", async ({
    sbPage,
  }) => {
    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]')
      .click();
    await expect(
      sbPage.locator(".sb-nav-bar m3e-nav-item[selected]"),
    ).toHaveCount(1);

    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Journal"]')
      .click();

    const selected = sbPage.locator(".sb-nav-bar m3e-nav-item[selected]");
    await expect(selected).toHaveCount(1);
    expect((await selected.allTextContents())[0].trim()).toBe("Recent");
  });

  test("exactly one m3e-fab exists", async ({ sbPage }) => {
    await expect(sbPage.locator("m3e-fab")).toHaveCount(1);
  });

  test("FAB sits entirely above the nav bar and inside the viewport", async ({
    sbPage,
  }) => {
    const viewport = sbPage.viewportSize()!;
    const fabRect = (await sbPage.locator(".sb-fab").boundingBox())!;
    const barRect = (await sbPage.locator(".sb-nav-bar").boundingBox())!;

    expect(bottom(fabRect)).toBeLessThanOrEqual(barRect.y + 1);
    expect(fabRect.x).toBeGreaterThanOrEqual(0);
    expect(fabRect.y).toBeGreaterThanOrEqual(0);
    expect(right(fabRect)).toBeLessThanOrEqual(viewport.width + 1);
    expect(bottom(fabRect)).toBeLessThanOrEqual(viewport.height + 1);
  });

  test("clicking the FAB opens the item-capture sheet with its 5-way picker", async ({
    sbPage,
  }) => {
    const sheet = sbPage.locator("#sb-item-capture-sheet");
    await expect(sheet).not.toBeVisible();

    await sbPage.locator(".sb-fab").click();

    await expect(sheet).toBeVisible();
    await expect(sbPage.getByRole("radio")).toHaveCount(5);
  });

  test("with Recent selected, the panel sits directly above the nav bar with no gap or overlap", async ({
    sbPage,
  }) => {
    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]')
      .click();

    const panel = sbPage.locator(".sb-nav-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Recent");

    const panelRect = (await panel.boundingBox())!;
    const barRect = (await sbPage.locator(".sb-nav-bar").boundingBox())!;
    expect(Math.abs(bottom(panelRect) - barRect.y)).toBeLessThan(2);
  });

  // The single assertion proving the non-modal design works: a `modal`
  // `m3e-bottom-sheet` sets `popover="manual"` + `inertController.lock()`
  // (dist/bottom-sheet.js, spec §1.3), which would make every element
  // outside it — including the nav bar — unclickable. A plain fixed
  // `.sb-nav-panel` div has none of that, so the nav bar stays live while
  // its own panel is showing.
  test("nav bar stays clickable while its panel is open — switching destination swaps the panel content", async ({
    sbPage,
  }) => {
    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]')
      .click();
    const panel = sbPage.locator(".sb-nav-panel");
    await expect(panel).toContainText("Recent");

    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Search"]')
      .click();

    await expect(panel).toContainText("Search");
    await expect(
      sbPage.locator('.sb-nav-bar m3e-nav-item[aria-label="Search"]'),
    ).toHaveAttribute("selected", "");
    await expect(
      sbPage.locator('.sb-nav-bar m3e-nav-item[aria-label="Recent"]'),
    ).not.toHaveAttribute("selected", "");
  });

  test("Escape closes the panel", async ({ sbPage }) => {
    await sbPage.locator('.sb-nav-bar m3e-nav-item[aria-label="Run"]').click();
    await expect(sbPage.locator(".sb-nav-panel")).toBeVisible();

    await sbPage.keyboard.press("Escape");

    await expect(sbPage.locator(".sb-nav-panel")).toHaveCount(0);
    await expect(
      sbPage.locator(".sb-nav-bar m3e-nav-item[selected]"),
    ).toHaveCount(0);
  });
});
