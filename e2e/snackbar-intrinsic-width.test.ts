import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// 2026-09-22 (Jack, live report — snackbar wider than its content). Prior
// version of this spec locked in `--m3e-snackbar-min-width: 344px`
// (client/styles/top.scss) as "the real M3 minimum" — that was wrong. 344px
// is just the vendor's unstyled-fallback default (`var(--m3e-snackbar-min-
// width, 344px)`, node_modules/@m3e/web/dist/snackbar.js's `:host` CSS), and
// pinning the app's own CSS var to that same value forced every short
// message onto a 344px floor instead of letting the `:host { display:
// inline-flex }` box hug its text. The fix sets `--m3e-snackbar-min-width:
// 0` so nothing stops the host from shrinking to content width; `--m3e-
// snackbar-max-width` is unchanged, so long messages still cap and wrap.
// This spec now asserts CONTENT-HUGGING (width scales with message length,
// stays well under the old 344px floor) instead of the floor itself.

test("short-message snackbar hugs its content width, not a fixed floor", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer);

  // A very short message, opened directly via the vendor's own documented
  // imperative API (Snackbar.d.ts `M3eSnackbar.open(message, options)`) —
  // the same call `editor_ui.tsx`'s `flashNotification` makes internally,
  // just with full control over message text/length for this assertion.
  await page.evaluate(() => {
    globalThis.M3eSnackbar.open("Hi", { duration: 0 });
  });

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 5000 });
  await expect(snackbar).toContainText("Hi");

  const shortBox = (await snackbar.boundingBox())!;

  // No app-side floor left: verify the CSS var itself, not just the visual
  // effect — fails if a future edit reintroduces a pinned min-width.
  const minWidth = await snackbar.evaluate((el) => getComputedStyle(el).minWidth);
  expect(minWidth).toBe("0px");

  // Clearly under the old 344px floor this bug produced.
  expect(shortBox.width).toBeLessThan(200);

  await page.evaluate(() => globalThis.M3eSnackbar.dismiss());

  // A longer (but still one-line) message via the app's real production
  // path (editor.ui.flashNotification, exercised through the read-only
  // toggle) must render WIDER than the 2-character message above — proof
  // the box scales with content instead of sitting on a shared floor.
  const readOnlyButton = page.locator(
    'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
  );
  await readOnlyButton.click();

  await snackbar.waitFor({ state: "attached", timeout: 5000 });
  await expect(snackbar).toContainText("Read-only mode enabled");

  const longerShortBox = (await snackbar.boundingBox())!;

  expect(longerShortBox.width).toBeGreaterThan(shortBox.width);
  // Still clearly under the old fixed floor.
  expect(longerShortBox.width).toBeLessThan(344);

  // Restore read-only state for hygiene.
  await readOnlyButton.click();
});

test("long-message snackbar caps at max-width and wraps instead of growing unbounded", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer);

  const longMessage =
    "This is a deliberately long snackbar message intended to exceed the " +
    "672 pixel maximum width so the box must cap out and the supporting " +
    "text must wrap onto a second line instead of growing past the cap.";

  await page.evaluate((msg) => {
    globalThis.M3eSnackbar.open(msg, { duration: 0 });
  }, longMessage);

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 5000 });
  await expect(snackbar).toContainText("deliberately long");

  const box = (await snackbar.boundingBox())!;

  // Hard cap from `--m3e-snackbar-max-width: min(672px, 100% - 48px)`.
  expect(box.width).toBeLessThanOrEqual(672);

  const maxWidth = await snackbar.evaluate((el) => getComputedStyle(el).maxWidth);
  expect(maxWidth).toContain("672px");

  // Wrapped: `.supporting-text` (line-clamp: 2) must be taller than a
  // single text line for a message this long.
  const supportingText = snackbar.locator(".supporting-text");
  const textBox = (await supportingText.boundingBox())!;
  const lineHeight = await supportingText.evaluate((el) =>
    parseFloat(getComputedStyle(el).lineHeight)
  );
  expect(textBox.height).toBeGreaterThan(lineHeight * 1.3);

  await page.evaluate(() => globalThis.M3eSnackbar.dismiss());
});

test("read-only-toggle snackbar stays content-sized even on a narrow (mobile-width) viewport", async ({
  sbServer,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await gotoSilverBulletPage(page, sbServer);

  const readOnlyButton = page.locator(
    'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
  );
  await readOnlyButton.click();

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 5000 });

  const box = (await snackbar.boundingBox())!;
  // Content-hugging box for this short message must sit well inside a
  // 375px viewport with visible margin on both edges — the regression
  // signature would be literally full-bleed (0 margin both sides) or
  // pinned to the old 344px floor.
  expect(box.x).toBeGreaterThan(4);
  expect(box.x + box.width).toBeLessThan(375 - 4);
  expect(box.width).toBeLessThan(344);

  await readOnlyButton.click();
});
