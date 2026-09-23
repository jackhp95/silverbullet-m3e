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

// 2026-09-22 (jitter fix — live report: "long titles get caught in an
// infinite loop of growing/shrinking"). Root cause: the old version of this
// effect wrapped the measurement in a persistent `ResizeObserver` on the
// title slot AND measured a same-font mirror whose font cascaded from the
// bar's OWN current `size` — so setting `size="medium"` shrunk the mirror's
// measured width, which could make it fit again, flipping back to "large",
// regrowing the font, overflowing again, forever. Fixed contract: `barSize`
// is now decided exactly ONCE per page load / title change (top_bar.tsx's
// `useLayoutEffect`, keyed on `[pageName, pageNamePrefix]`, no persisting
// observer) and never re-evaluated in response to a later window resize.
// The two tests below replace the old "resize the live window and expect
// the bar to react" test, which asserted the exact reactive behavior this
// fix intentionally removes.
test("a long title's app-bar size is decided once at load, from the viewport at load time", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);
  await expect(page.locator("m3e-app-bar")).toHaveAttribute("size", "large");
});

test("a long title loaded at a narrow viewport starts medium and does NOT grow back on a later window resize", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);

  const appBar = page.locator("m3e-app-bar");
  await expect(appBar).toHaveAttribute("size", "medium");

  // The old bug: widening the window after load used to flip this back to
  // "large" (then, at the wrong measured-at-medium font, right back to
  // "medium" again — the jitter). The fixed contract only measures once,
  // at load/title-change — a later resize must never touch it again.
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.waitForTimeout(500);
  await expect(appBar).toHaveAttribute("size", "medium");
});

test("size never flip-flops after the initial decision (anti-jitter lock)", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await gotoSilverBulletPage(page, sbServer, LONG_TITLE);

  const appBar = page.locator("m3e-app-bar");
  await expect(appBar).toHaveAttribute("size", "medium");

  // Count every `size` attribute mutation over a real observation window.
  // The buggy version thrashed dozens of times a second once triggered;
  // the fixed one-shot decision produces zero further mutations once
  // settled (the initial "large" -> "medium" transition has already
  // happened by the time we start observing here).
  const mutationCount = await appBar.evaluate((el) =>
    new Promise<number>((resolve) => {
      let count = 0;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.attributeName === "size") count++;
        }
      });
      observer.observe(el, { attributes: true, attributeFilter: ["size"] });
      setTimeout(() => {
        observer.disconnect();
        resolve(count);
      }, 1000);
    })
  );
  expect(mutationCount).toBe(0);
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
