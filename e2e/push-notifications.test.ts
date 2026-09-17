import type { Page, Worker } from "@playwright/test";
import { expect, test } from "./fixtures.ts";

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
 *   `--headed` isn't an option here since `npx playwright test` (this
 *   task's required verbatim command) runs headless by this repo's own
 *   `playwright.config.ts` defaults.
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
 *   with a `self.dispatchEvent(new ExtendableEvent(...))` shim (explicitly
 *   sanctioned by the task this spec was written against): a real
 *   `PushEvent`/`NotificationEvent` can't be constructed from test code —
 *   their `.data`/`.notification` are browser-internal — but
 *   `ExtendableEvent` provides the same `waitUntil()` the real handlers use,
 *   and `self.addEventListener("push", ...)` matches purely on
 *   `event.type`, so it can't tell the difference.
 *
 * Requires the client bundle under test to have been built with a
 * non-empty `VAPID_PUBLIC_KEY` / `PUSH_SIDECAR_URL` (see
 * `build/build_client.ts`) — otherwise the toggle correctly renders
 * "not configured" and disabled, which is the right production behavior
 * for an unset env var but isn't what's under test here. See this task's
 * completion report for the exact env vars and how this suite was built.
 *
 * 2026-09-16 (L13, docs/plans/2026-09-16-toolbar-search-feedback-spec.md):
 * the toggle itself moved from the floating toolbar's `#sb-push-toggle`
 * icon-button to an `m3e-menu-item` inside the app-bar's trailing kebab
 * (`#sb-app-bar-menu`, wired in client/editor_ui.tsx's `pushMenuItem`,
 * L8) — same `PUSH_TOGGLE_LABELS`/state machine, different render target.
 * The first test below opens the kebab and matches the item by its label
 * text (same pattern e2e/app-bar-leading-trailing.test.ts's own kebab
 * tests already use), since a plain `m3e-menu-item` carries no stable id.
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
  // constraint pwa-offline.test.ts documents for SW + offline emulation.
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Service worker + PushManager e2e only runs on Chromium",
  );

  test.use({ disableServiceWorker: false });

  test("the subscribe toggle exists, is clickable, and POSTs the subscription to the sidecar", async ({
    sbServer,
    page,
  }) => {
    await stubPushClientApis(page);

    await page.goto(sbServer.url);
    await page.locator("#sb-editor .cm-content").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const kebab = page.locator(
      'm3e-app-bar m3e-icon-button[title="More actions"]',
    );
    const menu = page.locator("#sb-app-bar-menu");
    async function ensureMenuOpen() {
      if (!(await menu.evaluate((el: any) => el.isOpen))) {
        await kebab.click();
        await expect
          .poll(() => menu.evaluate((el: any) => el.isOpen))
          .toBe(true);
      }
    }

    await ensureMenuOpen();
    let toggle = menu.locator("m3e-menu-item").filter({
      hasText: "Enable push notifications",
    });
    await expect(toggle).toHaveCount(1);
    // Not disabled — this build has a configured VAPID key + sidecar URL,
    // so the toggle must be a real, clickable control (not the
    // "unsupported"/"not configured" disabled state).
    await expect(toggle).not.toHaveAttribute("disabled", "");

    await toggle.click();

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

    // And the toggle reflects the now-active subscription.
    await ensureMenuOpen();
    toggle = menu.locator("m3e-menu-item").filter({
      hasText: "Push notifications are on — click to turn off",
    });
    await expect(toggle).toHaveCount(1);
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
