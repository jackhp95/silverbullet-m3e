import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "../fixtures/offline.ts";

/**
 * Regression test for "takes 2 reloads to see the latest deploy".
 *
 * Root cause: `client/service_worker.ts` already calls `self.skipWaiting()`
 * (install handler, and again via the "skip-waiting" message from
 * `client/boot.ts`'s `updatefound` handler) and `clients.claim()` (activate
 * handler), so a new worker activates and claims all open tabs quickly in the
 * background. But nothing listened for the moment that claim actually lands
 * on THIS tab (`navigator.serviceWorker.controllerchange`), so the reload
 * that would show the new version was always still the user's *next* manual
 * reload — the tab that was open at deploy time needed a second reload
 * before it showed anything new. `client/boot.ts` now listens for
 * `controllerchange` and reloads exactly once, guarded so a completely fresh
 * first-ever install (no prior controller) does not spuriously reload.
 *
 * Rather than unit-testing that guard in isolation, this drives a real
 * update cycle end to end: build "version A" (the repo's normal `npm run
 * build` output, already on disk), serve it, register the SW, then swap
 * `client_bundle/client/service_worker.js` on disk to a "version B" that
 * embeds a different `CACHE_NAME` (the same kind of version string the real
 * build stamps in via `cache-${Date.now()}` — see `build/build_client.ts`'s
 * `patchServiceWorker()`). The debug server binary's `rust-embed` reads that
 * directory straight off disk in a debug build (no `debug-embed` feature —
 * see `bin/silverbullet/src/embed.rs`), so this swap is visible to an
 * already-running server without a rebuild — verified by hand before writing
 * this test.
 *
 * `CACHE_NAME` is a solid version marker to assert on: it names the Cache
 * Storage entry the SW's own `install`/`activate` handlers create and prune
 * (service_worker.ts), so by the time this tab is actually controlled by the
 * new worker, `caches.keys()` can only contain the new name — the old one is
 * deleted during `activate`, before `clients.claim()` runs.
 *
 * Ported from m3e-fork `4675fab0` (`e2e/pwa-update-single-reload.test.ts`),
 * unchanged in substance — only the fixture import moved to this repo's
 * `e2e/fixtures/offline.ts` (which already extends the base fixtures with
 * `disableServiceWorker: false`, same as this file's own `test.use` below
 * redundantly re-asserts for clarity).
 */

const CLIENT_BUNDLE_SW_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "client_bundle",
  "client",
  "service_worker.js",
);

/** Wait for the service worker to be active and controlling the page. */
async function waitForServiceWorkerReady(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        );
        if (navigator.serviceWorker.controller) resolve();
      });
    }
    return reg.active?.state;
  });
}

test.describe("PWA single-reload update", () => {
  // Same restriction as the other SW-lifecycle e2e suites: Firefox's
  // Playwright implementation doesn't fully support SW + reload interplay.
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Service worker update-lifecycle tests only run on Chromium",
  );
  test.describe.configure({ retries: 2 });

  test.use({
    disableServiceWorker: false,
    spaceFiles: {
      "index.md": "# Update Test Space\nContent for the SW update test.",
    },
  });

  test("a deploy mid-session shows the new version after exactly one reload", async ({
    sbServer,
    page,
  }) => {
    await page.goto(sbServer.url);
    const editor = page.locator("#sb-editor .cm-content");
    await editor.waitFor({ state: "visible", timeout: 30_000 });
    await waitForServiceWorkerReady(page);

    // Confirm "version A" (the real build output) is what's actually active
    // before we touch anything on disk.
    const versionA = await page.evaluate(async () => (await caches.keys())[0]);
    expect(versionA).toMatch(/^cache-\d+$/);

    const originalSw = await readFile(CLIENT_BUNDLE_SW_PATH, "utf-8");
    expect(originalSw).toContain(versionA);

    const versionB = "cache-e2e-test-version-b";
    // `split`/`join` replaces every occurrence of the exact original
    // cache-name literal, however many times the minifier inlined it — a
    // plain single-occurrence replace risked leaving a stale copy behind.
    const patchedSw = originalSw.split(versionA).join(versionB);
    expect(patchedSw).not.toBe(originalSw);

    let loadCount = 0;
    page.on("load", () => loadCount++);

    // Registered before we trigger the update, so we can't miss the load
    // event it causes. `client/boot.ts`'s controllerchange listener is the
    // ONLY thing in this test that ever navigates this page — we never call
    // `page.reload()` or `page.goto()` ourselves from here on.
    const reloadEvent = page.waitForEvent("load", { timeout: 30_000 });

    await writeFile(CLIENT_BUNDLE_SW_PATH, patchedSw, "utf-8");
    try {
      // Trigger an update check the same way the browser does periodically —
      // per MDN, `registration.update()` forces a fetch + byte-compare of
      // the SW script, which is what starts the real install/activate cycle
      // we're testing.
      await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.ready;
        await reg.update();
      });

      // Wait for the actual reload client/boot.ts's controllerchange
      // listener triggers once the new worker claims this tab.
      await reloadEvent;

      // Exactly one reload happened — the one client/boot.ts's
      // `controllerchange` listener triggered.
      expect(loadCount).toBe(1);

      // Give a would-be second (looping) reload a chance to happen, then
      // confirm none did.
      await page.waitForTimeout(2000);
      expect(loadCount).toBe(1);

      // The reloaded tab is genuinely controlled by, and precached under,
      // version B — not just mid-transition. Activate's cache cleanup runs
      // before clients.claim() (service_worker.ts), and claim() landing is
      // what fires controllerchange, so this is already true by the time our
      // reload happens — polled defensively in case of a scheduling hiccup.
      await expect
        .poll(() => page.evaluate(() => caches.keys()), { timeout: 5_000 })
        .toEqual([versionB]);
    } finally {
      // Restore the shared build output only now, after every assertion —
      // NOT right after the reload. The reloaded page's own fresh boot.ts
      // run calls `navigator.serviceWorker.register()` again, which per spec
      // does its own implicit update-check against whatever's on disk. An
      // earlier version of this test restored the original file immediately
      // after the reload's `load` event and was flaky under load: that
      // re-register sometimes ran against the now-reverted "version A"
      // bytes, saw a byte-diff against the installed "version B" worker, and
      // triggered a second — individually correct, but here spurious —
      // update+reload cycle, intermittently doubling `loadCount`. Keeping
      // "version B" on disk until we're done observing this page removes
      // that race; later specs (and re-runs) still see the real,
      // unmodified version A build once this restores.
      await writeFile(CLIENT_BUNDLE_SW_PATH, originalSw, "utf-8");
    }
  });

  test("a completely fresh first load does not trigger a spurious reload", async ({
    sbServer,
    page,
  }) => {
    // No prior service worker exists for this brand-new browser context, so
    // `navigator.serviceWorker.controller` starts null. This is exactly the
    // case client/boot.ts's `hadControllerAtBoot` guard exists for: the SW's
    // own `activate` handler calls `clients.claim()` unconditionally (even
    // on a first-ever install), so an unguarded controllerchange listener
    // would reload here too — spuriously, since there's no "old version"
    // this tab was showing.
    let loadCount = 0;
    page.on("load", () => loadCount++);

    await page.goto(sbServer.url);
    const editor = page.locator("#sb-editor .cm-content");
    await editor.waitFor({ state: "visible", timeout: 30_000 });
    await waitForServiceWorkerReady(page);

    // Give a spurious reload a chance to happen.
    await page.waitForTimeout(2000);

    // Only the initial navigation's load fired.
    expect(loadCount).toBe(1);
  });
});
