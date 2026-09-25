import type { Page, Worker } from "@playwright/test";
import { runCommandViaPalette } from "../fixtures/actions.ts";
import { expect, test } from "../fixtures/offline.ts";

/**
 * Web Push client e2e (spec §5, §5.1).
 *
 * The sidecar (a Node service in the separate `knowledge-substrate` repo,
 * built in parallel by a sibling leaf) implements `POST /push/subscribe` —
 * it is not available to test against here, so this suite mocks/stubs it:
 *
 * - `PushManager.prototype.subscribe` is stubbed via `page.addInitScript`.
 *   The real Push API needs a live push service (FCM et al.) and a real
 *   VAPID key; neither exists in a sandboxed test run, and hitting a real
 *   push service from CI would be flaky/networked regardless. Stubbing it
 *   still exercises every line of `client/lib/push_subscribe.ts` that
 *   matters here: the permission check, the subscribe call shape, and the
 *   POST to the sidecar.
 * - `Notification.permission`/`requestPermission` are stubbed the same
 *   way, for the same class of reason: headless Chromium hard-codes
 *   `Notification.permission` to `"denied"` regardless of
 *   `browserContext.grantPermissions(["notifications"])` (verified against
 *   this repo's actual headless run — `--headed` does honor the grant, so
 *   this is a headless-mode limitation, not a bug in the subscribe flow).
 * - The `/push/subscribe` POST is intercepted by stubbing `window.fetch`
 *   itself via `page.addInitScript`, NOT `page.route()`/`context.route()`.
 *   This repo's own service worker (`client/service_worker/proxy_router.ts`)
 *   intercepts every fetch from a controlled page — even a cross-origin one
 *   like the sidecar call — and passes it through with a plain
 *   `fetch(request)` re-issued from inside the SW's own `respondWith`
 *   handler. Playwright's network interception documents that it "will not
 *   intercept requests intercepted by Service Worker"
 *   (microsoft/playwright#1090) — verified here: `page.route()` +
 *   `Access-Control-Allow-Origin: *` genuinely could not catch this call, it
 *   surfaced to the app as "Failed to fetch" every time. Stubbing
 *   `window.fetch` runs before the SW or the network stack is ever
 *   involved, so it's the one layer this repo's own architecture leaves
 *   available.
 * - The `push`/`notificationclick` service worker events are synthesized
 *   with a `self.dispatchEvent(new ExtendableEvent(...))` shim: a real
 *   `PushEvent`/`NotificationEvent` can't be constructed from test code —
 *   their `.data`/`.notification` are browser-internal — but
 *   `ExtendableEvent` provides the same `waitUntil()` the real handlers use,
 *   and `self.addEventListener("push", ...)` matches purely on
 *   `event.type`, so it can't tell the difference.
 *
 * ENVIRONMENT DEPENDENCY: the subscribe test requires the client bundle
 * under test to have been BUILT with a non-empty `VAPID_PUBLIC_KEY` /
 * `PUSH_SIDECAR_URL` (see `patchPushConfig` in `build/build_client.ts` —
 * these are build-time text substitutions, not runtime settings, so they
 * cannot be stubbed from the test). Without them the toggle correctly
 * resolves to `"not-configured"` (see `client/lib/push_ui.ts`'s
 * `PushState`), which is the right production behavior for an unset env
 * var but isn't what's under test. That case is detected at runtime by
 * `readPushBuildConfig` below and SKIPPED with the reason and the exact
 * rebuild command — it is not a failure, and a red result here would say
 * nothing about the client code. The other two tests in this suite (the
 * synthetic `push` event and the `notificationclick` handler) exercise the
 * service worker only and have no such dependency — they run
 * unconditionally.
 *
 * Ported from m3e-fork `36487be8`/`40c6c1a1` (`e2e/push-notifications.test.ts`).
 * The subscribe test is rewritten, not just re-selectored: the fork's UI
 * surface for the toggle (an app-bar kebab `m3e-menu-item`, and before that
 * the floating toolbar's `#sb-push-toggle`) doesn't exist on `main` — the
 * core-shell slice (app bar / floating toolbar) hasn't landed yet, so per
 * this reconciliation's builder brief the toggle is exposed only as the
 * "Push Notifications: Toggle" command for now (`client/push_toggle.ts`).
 * This test drives it via `runCommandViaPalette` instead of clicking a
 * button, and reads the outcome off the flashed `.sb-notification-*`
 * (`client/components/top_bar.tsx`'s `NotificationList`) rather than a menu
 * item's label. A future core-shell leaf that binds an app-bar button to
 * `readPushState`/`togglePush` should add a UI-level test alongside it
 * without needing to touch this one.
 */

const FAKE_SUBSCRIPTION = {
  endpoint: "https://push.example/fake-endpoint",
  keys: { p256dh: "fake-p256dh-key", auth: "fake-auth-secret" },
};

/**
 * Stub the three browser APIs `client/lib/push_subscribe.ts` calls that
 * either can't work in a sandboxed headless run (real Push API, real
 * Notification permission prompt) or can't be reached by Playwright's own
 * network interception (the sidecar POST — see file header). Populates
 * `window.__subscribeRequests` with every intercepted `/push/subscribe`
 * call for the test to read back via `page.evaluate`.
 */
async function stubPushClientApis(page: Page): Promise<void> {
  await page.addInitScript((subscription) => {
    // deno-lint-ignore no-explicit-any
    const win = window as any;
    // Headless Chromium hard-codes Notification.permission to "denied"
    // regardless of browserContext.grantPermissions — see file header.
    // "permission" is a getter-only static; defineProperty is required.
    Object.defineProperty(win.Notification, "permission", {
      value: "granted",
      configurable: true,
    });
    win.Notification.requestPermission = async () => "granted";

    if (win.PushManager) {
      win.PushManager.prototype.subscribe = async () => ({
        endpoint: subscription.endpoint,
        toJSON: () => subscription,
        unsubscribe: async () => true,
      });
    }

    win.__subscribeRequests = [] as Array<{ url: string; body: string }>;
    const realFetch = win.fetch.bind(win);
    win.fetch = async (input: unknown, init?: { body?: string }) => {
      const url = typeof input === "string"
        ? input
        : (input as { url?: string })?.url;
      if (typeof url === "string" && url.endsWith("/push/subscribe")) {
        win.__subscribeRequests.push({ url, body: init?.body ?? "" });
        return new win.Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return realFetch(input, init);
    };
  }, FAKE_SUBSCRIPTION);
}

/**
 * Read the push configuration the client bundle under test was actually
 * BUILT with.
 *
 * `BootConfig.vapidPublicKey` / `pushSidecarUrl` are not runtime settings:
 * `client/boot.ts` stamps the literal placeholders `{{VAPID_PUBLIC_KEY}}` /
 * `{{PUSH_SIDECAR_URL}}` into BootConfig, and `patchPushConfig()` in
 * `build/build_client.ts` text-substitutes them from the `VAPID_PUBLIC_KEY`
 * / `PUSH_SIDECAR_URL` env vars *at build time*, defaulting to `""`. So no
 * amount of test-side stubbing can turn an unconfigured bundle into a
 * configured one — with both empty, `client/push_toggle.ts` correctly and
 * deliberately resolves `pushState` to `"not-configured"`. That is the
 * intended production behavior for an unset env var, not a defect, which is
 * exactly why the subscribe test below skips rather than fails when it sees
 * it.
 *
 * Read via `globalThis.client`, the handle `client/boot.ts` always assigns
 * (same access pattern e2e's own sync-progress e2e already uses).
 */
async function readPushBuildConfig(
  page: Page,
): Promise<{ vapidPublicKey: string; pushSidecarUrl: string }> {
  return await page.evaluate(() => {
    // deno-lint-ignore no-explicit-any
    const boot = (globalThis as any).client?.bootConfig ?? {};
    return {
      vapidPublicKey: boot.vapidPublicKey ?? "",
      pushSidecarUrl: boot.pushSidecarUrl ?? "",
    };
  });
}

/** The active service worker for this page, once it's controlling. */
async function getActiveServiceWorker(page: Page): Promise<Worker> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const context = page.context();
  const existing = context.serviceWorkers();
  if (existing.length > 0) return existing[0];
  return context.waitForEvent("serviceworker");
}

test.describe("Web Push client (spec §5)", () => {
  // Service worker + PushManager e2e only runs on Chromium — same
  // constraint pwa-update-single-reload.test.ts documents for SW e2e.
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Service worker + PushManager e2e only runs on Chromium",
  );

  test.use({ disableServiceWorker: false });

  test("the 'Push Notifications: Toggle' command subscribes and POSTs the subscription to the sidecar", async ({
    sbServer,
    page,
  }) => {
    await stubPushClientApis(page);

    await page.goto(sbServer.url);
    await page.locator("#sb-editor .cm-content").waitFor({
      state: "visible",
      timeout: 30_000,
    });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);

    // Environment gate, not a correctness gate. This assertion chain only
    // means anything against a bundle built with real push config; against
    // an unconfigured build the command correctly resolves to
    // "not-configured" and flashes an explanatory notice instead of
    // subscribing. Skip loudly with the reason and the fix rather than
    // leaving a red test whose failure says nothing about the code.
    const pushConfig = await readPushBuildConfig(page);
    test.skip(
      !pushConfig.vapidPublicKey || !pushConfig.pushSidecarUrl,
      "Client bundle was built without VAPID_PUBLIC_KEY / PUSH_SIDECAR_URL, " +
        "so the toggle is correctly in its disabled \"not configured\" state. " +
        "Rebuild with e.g. `VAPID_PUBLIC_KEY=<base64url-key> " +
        "PUSH_SIDECAR_URL=http://localhost:9999 npm run build:client` to " +
        "exercise this test (the sidecar itself is stubbed — the URL only " +
        "has to match the assertion below).",
    );

    await runCommandViaPalette(page, "Push Notifications: Toggle");

    await expect(
      page.locator(".sb-notification-info", { hasText: "enabled" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect
      .poll(
        () => page.evaluate(() => (window as any).__subscribeRequests.length),
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0);

    const [request] = await page.evaluate(() =>
      (window as any).__subscribeRequests
    );
    expect(request.url).toBe("http://localhost:9999/push/subscribe");
    expect(JSON.parse(request.body)).toEqual(FAKE_SUBSCRIPTION);

    // And a second toggle turns it back off.
    await runCommandViaPalette(page, "Push Notifications: Toggle");
    await expect(
      page.locator(".sb-notification-info", { hasText: "turned off" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("a synthetic push event shows a notification with the payload's title/body/url", async ({
    sbServer,
    page,
  }) => {
    await page.goto(sbServer.url);
    await page.locator("#sb-editor .cm-content").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const worker = await getActiveServiceWorker(page);

    // Spy on showNotification inside the SW's own realm before dispatching.
    await worker.evaluate(() => {
      // deno-lint-ignore no-explicit-any
      const w = self as any;
      w.__notifications = [];
      w.registration.showNotification = (title: string, options: unknown) => {
        w.__notifications.push({ title, options });
        return Promise.resolve();
      };
    });

    await worker.evaluate((payload) => {
      // deno-lint-ignore no-explicit-any
      const w = self as any;
      const evt = new w.ExtendableEvent("push");
      evt.data = { json: () => payload };
      self.dispatchEvent(evt);
    }, {
      title: "New journal reply",
      body: "Someone replied to your entry",
      url: "/journal/2026-09-16",
    });

    await expect
      .poll(
        () => worker.evaluate(() => (self as any).__notifications),
        { timeout: 10_000 },
      )
      .toEqual([
        {
          title: "New journal reply",
          options: {
            body: "Someone replied to your entry",
            data: { url: "/journal/2026-09-16" },
          },
        },
      ]);
  });

  test("clicking the notification opens a window at the payload's url when none is already open", async ({
    sbServer,
    page,
  }) => {
    await page.goto(sbServer.url);
    await page.locator("#sb-editor .cm-content").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const worker = await getActiveServiceWorker(page);

    await worker.evaluate(() => {
      // deno-lint-ignore no-explicit-any
      const w = self as any;
      w.__opened = [];
      w.clients.matchAll = () => Promise.resolve([]);
      w.clients.openWindow = (url: string) => {
        w.__opened.push(url);
        return Promise.resolve(null);
      };
    });

    await worker.evaluate((url) => {
      // deno-lint-ignore no-explicit-any
      const w = self as any;
      const evt = new w.ExtendableEvent("notificationclick");
      evt.notification = { data: { url }, close: () => {} };
      self.dispatchEvent(evt);
    }, "/journal/2026-09-16");

    await expect
      .poll(() => worker.evaluate(() => (self as any).__opened), {
        timeout: 10_000,
      })
      .toEqual(["/journal/2026-09-16"]);
  });

  test("clicking the notification focuses an already-open client instead of opening a new window", async ({
    sbServer,
    page,
  }) => {
    await page.goto(sbServer.url);
    await page.locator("#sb-editor .cm-content").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const worker = await getActiveServiceWorker(page);
    const targetHref = `${sbServer.url}/journal/2026-09-16`;

    await worker.evaluate((targetHref) => {
      // deno-lint-ignore no-explicit-any
      const w = self as any;
      w.__focused = [];
      w.__opened = [];
      const fakeClient = {
        url: targetHref,
        focus: () => {
          w.__focused.push(targetHref);
          return Promise.resolve(fakeClient);
        },
      };
      w.clients.matchAll = () => Promise.resolve([fakeClient]);
      w.clients.openWindow = (url: string) => {
        w.__opened.push(url);
        return Promise.resolve(null);
      };
    }, targetHref);

    await worker.evaluate((url) => {
      // deno-lint-ignore no-explicit-any
      const w = self as any;
      const evt = new w.ExtendableEvent("notificationclick");
      evt.notification = { data: { url }, close: () => {} };
      self.dispatchEvent(evt);
    }, "/journal/2026-09-16");

    await expect
      .poll(() => worker.evaluate(() => (self as any).__focused), {
        timeout: 10_000,
      })
      .toEqual([targetHref]);
    expect(await worker.evaluate(() => (self as any).__opened)).toEqual([]);
  });
});
