import {
  expect,
  gotoSilverBulletPage,
  test,
} from "./fixtures.ts";

// 2026-09-22 (app-bar title wrap task). Confirms two independent things
// against a long page title:
//  1. The title never visually escapes the app bar's own box — no part of
//     the title's bounding box sits outside `m3e-app-bar`'s box (the "hangs
//     off the edge" bug). A native `<input>` can't wrap (see
//     top_bar.tsx's PageNameEditor comment for why a wrapping dual-mode was
//     tried and reverted — it broke ~15 other e2e specs relying on
//     `#sb-current-page input.sb-input` always being present/clickable), so
//     containment here means truncated-with-ellipsis, not multi-line.
//  2. At a narrow viewport, the responsive size-shrink effect (top_bar.tsx's
//     `barSize` state) actually flips `m3e-app-bar` from `size="large"` to
//     the real, m3e-supported `size="medium"` (AppBarSize.d.ts) once the
//     title would overflow the available width at the large size.
const LONG_TITLE =
  "An Extremely Long Page Title That Would Definitely Overflow A Narrow App Bar If Nothing Were Done About It At All";

test.use({
  spaceFiles: {
    [`${LONG_TITLE}.md`]: "Body content.\n",
    "ShortPage.md": "Short page body.\n",
  },
});

test("long title stays contained inside the app bar's box, not overflowing it", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);

  const appBar = page.locator("m3e-app-bar");
  const titleInput = page.locator("#sb-current-page input.sb-input");
  await expect(titleInput).toHaveValue(LONG_TITLE);

  const barBox = (await appBar.boundingBox())!;
  const inputBox = (await titleInput.boundingBox())!;

  // The input's box (however much of the title is visible/truncated) must
  // sit entirely within the app bar's own box — the concrete "hangs off the
  // edge" regression this task fixes.
  expect(inputBox.x).toBeGreaterThanOrEqual(barBox.x - 1);
  expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(
    barBox.x + barBox.width + 1,
  );

  // No horizontal scrollbar/overflow was introduced on the bar itself.
  const barScrollWidth = await appBar.evaluate((el) => el.scrollWidth);
  const barClientWidth = await appBar.evaluate((el) => el.clientWidth);
  expect(barScrollWidth).toBeLessThanOrEqual(barClientWidth + 1);
});

test("narrow viewport drops a long-titled app bar from size large to size medium", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);

  const appBar = page.locator("m3e-app-bar");
  await expect(appBar).toHaveAttribute("size", "large");

  // Shrinking the viewport reduces the space available for the title at
  // the large-size (Display Small) font, past the point it fits — the
  // ResizeObserver-driven effect must flip the real `size` attribute.
  await page.setViewportSize({ width: 480, height: 800 });
  await expect(appBar).toHaveAttribute("size", "medium", { timeout: 10_000 });

  // Widening back out restores it — this isn't a one-way/sticky flag.
  await page.setViewportSize({ width: 1920, height: 900 });
  await expect(appBar).toHaveAttribute("size", "large", { timeout: 10_000 });
});

test("a short title keeps the large app bar even at a narrow viewport", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, "ShortPage");

  const appBar = page.locator("m3e-app-bar");
  await expect(appBar).toHaveAttribute("size", "large");
});
