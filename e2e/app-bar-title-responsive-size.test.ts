import {
  expect,
  gotoSilverBulletPage,
  test,
} from "./fixtures.ts";

// 2026-09-22 (app-bar title wrap task — textarea leaf, superseding the
// original `barSize` shrink-to-"medium" approach this file used to test).
// Live report: "still doesn't appear that the title text wraps" — the old
// approach never actually wrapped anything (couldn't: a single-line
// `<input>` structurally can't, MDN), it just shrank the font and ellipsized.
// The real fix (confirmed with Jack) swaps the title editor for a
// `<textarea>` (top_bar.tsx's PageNameEditor) — textareas wrap natively.
// `m3e-app-bar` is a fixed `size="large"` now; there is no more responsive
// shrink-to-"medium" state to test (that whole effect/ResizeObserver/mirror
// subsystem — and the infinite grow/shrink jitter bug that lived in it —
// was deleted along with the `<input>`, not patched again).
const LONG_TITLE =
  "An Extremely Long Page Title That Would Definitely Overflow A Narrow App Bar If Nothing Were Done About It At All";
const SHORT_TITLE = "ShortPage";

test.use({
  spaceFiles: {
    [`${LONG_TITLE}.md`]: "Body content.\n",
    [`${SHORT_TITLE}.md`]: "Short page body.\n",
  },
});

test("long title stays contained inside the app bar's box, not overflowing it", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);

  const appBar = page.locator("m3e-app-bar");
  const titleInput = page.locator("#sb-current-page textarea.sb-input");
  await expect(titleInput).toHaveValue(LONG_TITLE);

  const barBox = (await appBar.boundingBox())!;
  const inputBox = (await titleInput.boundingBox())!;

  // The textarea's box (wrapped across however many lines it needs, up to
  // the 2-line cap) must sit entirely within the app bar's own box
  // horizontally — the "hangs off the edge" regression this task fixes.
  expect(inputBox.x).toBeGreaterThanOrEqual(barBox.x - 1);
  expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(
    barBox.x + barBox.width + 1,
  );

  // No horizontal scrollbar/overflow was introduced on the bar itself.
  const barScrollWidth = await appBar.evaluate((el) => el.scrollWidth);
  const barClientWidth = await appBar.evaluate((el) => el.clientWidth);
  expect(barScrollWidth).toBeLessThanOrEqual(barClientWidth + 1);
});

test("app bar stays size=\"large\" regardless of title length or viewport width", async ({
  sbServer,
  page,
}) => {
  // The old behavior (removed): shrink to size="medium" for a long title at
  // a narrow viewport. Wrapping replaced that entirely — there is no size
  // state left to react to title length or viewport at all.
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);
  await expect(page.locator("m3e-app-bar")).toHaveAttribute("size", "large");
});

test("a long title actually wraps onto a second line, taller than a short one-line title", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);

  const longBox = (await page.locator("#sb-current-page textarea.sb-input")
    .boundingBox())!;

  await gotoSilverBulletPage(page, sbServer, SHORT_TITLE);
  const shortBox = (await page.locator("#sb-current-page textarea.sb-input")
    .boundingBox())!;

  // This is the concrete "does it actually wrap" assertion the live report
  // was about: a title long enough to need 2 lines must render measurably
  // taller than a title that fits on 1 — real multi-line wrapping, not a
  // font-size shrink (which wouldn't change the number of lines at all).
  expect(longBox.height).toBeGreaterThan(shortBox.height * 1.3);
});

test("title height never exceeds the 2-line cap even for a title long enough to need 3+ lines", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, SHORT_TITLE);

  const titleInput = page.locator("#sb-current-page textarea.sb-input");
  const oneLineBox = (await titleInput.boundingBox())!;

  // Rename in place (rather than navigating to a new page) to a title long
  // enough to need 3+ lines at this narrow viewport, without needing to
  // pre-register another file via `test.use({ spaceFiles })`.
  const veryLongTitle = Array.from(
    { length: 12 },
    (_, i) => `ReallyQuiteLongWord${i}`,
  ).join(" ");
  await titleInput.click();
  await titleInput.press("Meta+a");
  await titleInput.fill(veryLongTitle);
  await titleInput.press("Enter");
  await expect(titleInput).toHaveValue(veryLongTitle);

  const cappedBox = (await titleInput.boundingBox())!;

  // The app bar's own vendor CSS line-clamps the slotted title to 2 lines
  // by default (--m3e-app-bar-large-title-max-lines); this textarea's own
  // `max-block-size: 2lh` (top.scss) is meant to match that cap rather than
  // grow past it and fight the outer clamp for space. A 3rd-line-worthy
  // title should still cap out around 2x the 1-line height, not 3x+.
  expect(cappedBox.height).toBeLessThanOrEqual(oneLineBox.height * 2.5);
});

test("a short title stays compact (single line height)", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, SHORT_TITLE);

  const appBar = page.locator("m3e-app-bar");
  await expect(appBar).toHaveAttribute("size", "large");
});
