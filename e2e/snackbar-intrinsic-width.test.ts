import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// 2026-09-22 (Task B — snackbar full-width investigation). Repro'd against
// both a fresh fixture server and the already-running live demo server: in
// both, the read-only-toggle snackbar already renders at its intrinsic
// `min-width: 344px` (SnackbarElement.d.ts's `--m3e-snackbar-min-width`
// default), not full viewport width — the bug does not currently
// reproduce. Root cause of the ORIGINAL report: the full-width toast was
// the old hand-rolled `.sb-notifications` portal-rendered <div> (see
// editor_ui.tsx's `flashNotification` comment), which the real
// `m3e-snackbar` migration (git commit e91f0119, already on this branch,
// well before this leaf) replaced — that migration fixed this as a side
// effect, but nothing locked it down with a regression test. This spec is
// that lock: it fails loudly if the snackbar's box is ever stretched to
// (or near) the viewport width again.
test("read-only-toggle snackbar sizes to its intrinsic content width, not the full viewport", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer);

  const readOnlyButton = page.locator(
    'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
  );
  await readOnlyButton.click();

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 5000 });
  await expect(snackbar).toContainText("Read-only mode enabled");

  const box = (await snackbar.boundingBox())!;
  const viewportWidth = page.viewportSize()!.width;

  // Real M3 snackbar minimum (SnackbarElement.d.ts default) — the floor,
  // not the bug. The bug would be the box stretching out to (near) the
  // full viewport width for a one-line message.
  expect(box.width).toBeGreaterThanOrEqual(300);
  expect(box.width).toBeLessThan(viewportWidth * 0.6);

  // Restore read-only state for hygiene.
  await readOnlyButton.click();
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
  // At 375px, Material's own 344px minimum legitimately fills most of the
  // width (that's spec, not the bug) — the real regression signature is
  // literally full-bleed (0 margin both sides). Assert a visible margin
  // survives on both edges.
  expect(box.x).toBeGreaterThan(4);
  expect(box.x + box.width).toBeLessThan(375 - 4);

  await readOnlyButton.click();
});
