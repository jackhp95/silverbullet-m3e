import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

/**
 * True once `tag` is a registered custom element AND the matched `selector`
 * element has actually been upgraded to an instance of it — see
 * basic-modals.test.ts for the identical helper and its rationale (this is
 * the cross-cutting Playwright acceptance gate every m3e reskin PR adds,
 * per docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-spec.md §3).
 */
function isUpgraded(
  page: Page,
  tag: string,
  selector: string = tag,
): Promise<boolean> {
  return page.evaluate(
    ({ tag, selector }: { tag: string; selector: string }) => {
      const ctor = customElements.get(tag);
      const el = document.querySelector(selector);
      return !!ctor && !!el && el instanceof ctor;
    },
    { tag, selector },
  );
}

/**
 * Drives `MainUI.showProgress` (client/editor_ui.tsx) directly via the
 * `globalThis.client` handle `client/boot.ts` always assigns — the same
 * "poke the live client instance" idiom index-upgrade.test.ts uses for
 * `$indexVersion`. `editor.showProgress` (plugs/sync/sync.ts,
 * plugs/index/queue.ts) is itself just a plugos syscall wrapper around this
 * same call, so this exercises the identical prop-flow TopBar's
 * SyncProgressIndicator renders from — without depending on a real sync/
 * index run's timing (this suite runs with the service worker disabled, the
 * default `sbPage` fixture, for determinism).
 */
function showProgress(
  page: Page,
  percentage?: number,
  type?: "sync" | "index",
): Promise<void> {
  return page.evaluate(
    ({ percentage, type }: { percentage?: number; type?: string }) => {
      (globalThis as any).client.ui.showProgress(percentage, type);
    },
    { percentage, type },
  );
}

/** Drives the same `online-status-change` action client.ts's real
 * "online-status" service-worker message dispatches (client.ts:1114) —
 * bypassing the SW so the offline chip can be asserted deterministically
 * without real network-failure timing. */
function setOnlineStatus(page: Page, isOnline: boolean): Promise<void> {
  return page.evaluate((isOnline: boolean) => {
    (globalThis as any).client.ui.viewDispatch({
      type: "online-status-change",
      isOnline,
    });
  }, isOnline);
}

test.describe("sync/status indicator (m3e-circular-progress-indicator)", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nSync indicator test space.",
    },
  });

  test("determinate sync progress renders an upgraded, valued m3e-circular-progress-indicator", async ({
    sbPage,
  }) => {
    await showProgress(sbPage, 42, "sync");

    const indicator = sbPage.locator("m3e-circular-progress-indicator");
    await indicator.waitFor({ state: "attached", timeout: 10_000 });

    expect(await isUpgraded(sbPage, "m3e-circular-progress-indicator")).toBe(
      true,
    );

    const [value, indeterminate] = await indicator.evaluate((el: any) => [
      el.value,
      el.indeterminate,
    ]);
    expect(value).toBe(42);
    expect(indeterminate).toBe(false);

    await expect(sbPage.locator(".progress-wrapper.progress-sync")).toHaveAttribute(
      "title",
      "sync progress: 42%",
    );

    // Hiding progress (the no-arg `showProgress()` call plugs/sync/sync.ts
    // and plugs/index/queue.ts both use once a run completes) must remove
    // the indicator entirely, not just zero it out.
    await showProgress(sbPage);
    await expect(indicator).toHaveCount(0);
  });

  test("NaN percentage (zero-file sync edge case) falls back to indeterminate mode instead of a bogus value", async ({
    sbPage,
  }) => {
    // plugs/sync/sync.ts's `updateSyncStatus` divides filesProcessed by
    // totalFiles — totalFiles === 0 produces NaN, the one case where a
    // "defined" percentage still isn't a usable number.
    await showProgress(sbPage, NaN, "sync");

    const indicator = sbPage.locator("m3e-circular-progress-indicator");
    await indicator.waitFor({ state: "attached", timeout: 10_000 });
    expect(await isUpgraded(sbPage, "m3e-circular-progress-indicator")).toBe(
      true,
    );

    const indeterminate = await indicator.evaluate((el: any) =>
      el.indeterminate
    );
    expect(indeterminate).toBe(true);

    await expect(sbPage.locator(".progress-wrapper.progress-sync")).toHaveAttribute(
      "title",
      "sync in progress",
    );

    await showProgress(sbPage);
  });

  test("index-type progress uses the index wrapper class (distinct color token from sync)", async ({
    sbPage,
  }) => {
    await showProgress(sbPage, 10, "index");
    const indicator = sbPage.locator("m3e-circular-progress-indicator");
    await indicator.waitFor({ state: "attached", timeout: 10_000 });
    await expect(sbPage.locator(".progress-wrapper.progress-index")).toHaveCount(
      1,
    );
    await showProgress(sbPage);
  });
});

test.describe("offline state marker (m3e-chip)", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nOffline marker test space.",
    },
  });

  // 2026-09-17 vertical-toolbar/nav redesign spec, leaf V11 (added
  // mid-gauntlet by Jack, not in the original spec doc): the offline marker
  // moved from a small `m3e-badge` dot anchored to the page title to a
  // persistent, labeled `m3e-chip` in the app-bar trailing slot (before the
  // kebab trigger) — easier to notice, same underlying `isOnline` state.
  // This test previously asserted the old badge; updated here to match
  // (`e2e/visual-verification.test.ts`'s "Offline chip" describe block
  // covers the same chip via the heavier real-service-worker
  // `context().setOffline()` path — this one keeps the lighter
  // `setOnlineStatus()` fixture-level toggle for a fast, focused check).
  test("going offline preserves the whole-bar error tint and shows the offline m3e-chip in the app-bar trailing slot", async ({
    sbPage,
  }) => {
    const topBar = sbPage.locator("#sb-top");
    await expect(topBar).not.toHaveClass(/sb-sync-error/);
    await expect(sbPage.locator(".sb-offline-chip")).toHaveCount(0);

    await setOnlineStatus(sbPage, false);

    // Existing whole-bar signal (colors.scss's `#sb-top.sb-sync-error`)
    // must still be there — this is additive, not a replacement.
    await expect(topBar).toHaveClass(/sb-sync-error/);

    const chip = sbPage.locator(".sb-offline-chip");
    await chip.waitFor({ state: "attached", timeout: 10_000 });
    await expect(chip).toBeVisible();
    await expect(chip).toContainText("Offline");
    expect(await isUpgraded(sbPage, "m3e-chip", ".sb-offline-chip")).toBe(
      true,
    );

    await setOnlineStatus(sbPage, true);
    await expect(topBar).not.toHaveClass(/sb-sync-error/);
    await expect(sbPage.locator(".sb-offline-chip")).toHaveCount(0);
  });
});
