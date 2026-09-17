import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// Regression test for a live bug (flagged 2026-09-16): the breadcrumb row
// (`.sb-breadcrumb-row`, top.scss) collapses on scroll via
// `#sb-top[data-scrolled="on"]`, but the collapse relied on `max-height`/
// `opacity` alone — some browsers still let a sliver of the row's (shadow-
// DOM) content sub-pixel-render past that zero-height box, peaking above or
// behind the sticky `m3e-app-bar`. The fix (top.scss): `#sb-top{overflow:
// hidden}` for a hard clip, an explicit `z-index` on `m3e-app-bar` so it
// definitively paints over the row, and a `visibility: hidden` terminal
// state (delayed to land only once the max-height/opacity transition
// finishes) so the collapsed row is genuinely non-painting, not just
// zero-size.
//
// This asserts the *outcome*, not the mechanism: once scrolled, the
// breadcrumb row must report zero height (or be hidden), and nothing that
// was part of it may render above the app bar's own top edge.

const LONG_PAGE = Array.from(
  { length: 400 },
  (_, i) => `Line ${i}: enough content to make the editor scroll.`,
).join("\n");

test.use({
  spaceFiles: {
    "Folder/Long Page.md": LONG_PAGE,
  },
});

test("breadcrumb row fully collapses (non-painting) once scrolled, never peaking above the app bar", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Folder/Long Page");

  const scroller = page.locator("#sb-editor-scroller");
  await expect(scroller).toHaveCount(1);

  const topBar = page.locator("#sb-top");
  const breadcrumbRow = page.locator(".sb-breadcrumb-row");
  const appBar = page.locator("m3e-app-bar");

  await expect(topBar).toHaveAttribute("data-scrolled", "off");

  // Sanity check: before scrolling, the row is actually expanded (nonzero
  // height) — otherwise the collapsed-state assertions below would be
  // vacuously true.
  const expandedBox = await breadcrumbRow.boundingBox();
  expect(expandedBox).not.toBeNull();
  expect(expandedBox!.height).toBeGreaterThan(0);

  await scroller.evaluate((el) => {
    el.scrollTop = 2000;
  });
  await expect(topBar).toHaveAttribute("data-scrolled", "on", {
    timeout: 10_000,
  });

  // Let the 0.2s max-height / 0.15s opacity / delayed-visibility transition
  // finish so we're asserting the terminal state, not a mid-transition frame.
  await page.waitForTimeout(400);

  const collapsedBox = await breadcrumbRow.boundingBox();
  // Playwright's boundingBox() returns null for a `visibility: hidden` (or
  // display: none) element — either that, or a real zero-height rect, both
  // satisfy "not visually present".
  if (collapsedBox !== null) {
    expect(collapsedBox.height).toBe(0);
  }

  const collapsedVisibility = await breadcrumbRow.evaluate(
    (el) => getComputedStyle(el).visibility,
  );
  expect(collapsedVisibility).toBe("hidden");

  // The core regression check: nothing that was part of the collapsed
  // breadcrumb row may *visually* have a `top` coordinate above the app
  // bar's own top edge. Scoped to descendants whose own `computedStyle
  // .visibility === "visible"` — i.e. ones that actually escape the row's
  // inherited `visibility: hidden` and could paint. Unscoped, this over-
  // fires: Material's internal button parts (m3e-breadcrumb-item-button's
  // shadow DOM) include a `div.touch` 48px touch-target hitbox deliberately
  // inset -4px beyond its 40px visual button (verified live via a headless-
  // Chrome DOM dump — standard Material a11y padding, present whether the
  // row is collapsed or not) — it never paints (visibility: hidden,
  // inherited and unoverridden), so it isn't the bug this test guards
  // against; asserting on its raw geometry would be a false positive.
  // Playwright's `boundingBox()` returns `{x, y, width, height}` (viewport-
  // relative), not a DOM `DOMRect` — `y` is the top-edge coordinate here,
  // there is no `.top`.
  const appBarTop = (await appBar.boundingBox())!.y;

  const visibleDescendantTops: number[] = await breadcrumbRow.evaluate(
    (row) => {
      const rects: number[] = [];
      const collect = (root: Element | ShadowRoot) => {
        for (const child of root.children) {
          if (getComputedStyle(child).visibility === "visible") {
            rects.push(child.getBoundingClientRect().top);
          }
          if (child.shadowRoot) collect(child.shadowRoot);
          collect(child);
        }
      };
      if (getComputedStyle(row).visibility === "visible") {
        rects.push(row.getBoundingClientRect().top);
      }
      collect(row);
      return rects;
    },
  );

  for (const top of visibleDescendantTops) {
    expect(top).toBeGreaterThanOrEqual(appBarTop);
  }

  // Scrolling back to the top restores the expanded, painting state.
  await scroller.evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(topBar).toHaveAttribute("data-scrolled", "off", {
    timeout: 10_000,
  });
  await page.waitForTimeout(400);
  const restoredVisibility = await breadcrumbRow.evaluate(
    (el) => getComputedStyle(el).visibility,
  );
  expect(restoredVisibility).toBe("visible");
  const restoredBox = await breadcrumbRow.boundingBox();
  expect(restoredBox).not.toBeNull();
  expect(restoredBox!.height).toBeGreaterThan(0);
});
