import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// m3e-snackbar (node_modules/@m3e/web/dist/src/snackbar/SnackbarElement.d.ts)
// has no `type`/severity attribute of its own — client/editor_ui.tsx's
// `flashNotification` drives severity through the documented
// `--m3e-snackbar-container-color` cssprop instead (SEVERITY_CONTAINER_COLOR
// there). Per playwright-e2e-conventions, assert the inline `style`
// attribute rather than a resolved `getComputedStyle` value: an unresolved
// `var()` reference still appears in `style` even when the computed value
// has already fallen back to a default, so it's the more direct signal that
// *our* code set the property, not a coincidental theme default.

test("info notification leaves the snackbar's container color at the library default", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer);

  await page.evaluate(() =>
    (globalThis as any).client.ui.flashNotification("Syncing space...", "info"),
  );

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 10_000 });
  await expect(snackbar).toContainText("Syncing space...");
  const style = await snackbar.getAttribute("style");
  expect(style ?? "").not.toContain("--m3e-snackbar-container-color");
});

test("error notification sets the snackbar's container color to the M3 error token", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer);

  await page.evaluate(() =>
    (globalThis as any).client.ui.flashNotification("Something broke", "error"),
  );

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 10_000 });
  await expect(snackbar).toContainText("Error: Something broke");
  const style = await snackbar.getAttribute("style");
  expect(style).toContain(
    "--m3e-snackbar-container-color: var(--md-sys-color-error)",
  );
});

test("warning notification sets the snackbar's container color to the M3 tertiary token", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer);

  await page.evaluate(() =>
    (globalThis as any).client.ui.flashNotification(
      "Update available",
      "warning",
    ),
  );

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 10_000 });
  await expect(snackbar).toContainText("Warning: Update available");
  const style = await snackbar.getAttribute("style");
  expect(style).toContain(
    "--m3e-snackbar-container-color: var(--md-sys-color-tertiary)",
  );
});
