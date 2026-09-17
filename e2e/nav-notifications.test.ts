import { expect, test } from "./fixtures.ts";

// Exercises client/components/nav_views/notifications.tsx +
// client/editor_ui.tsx's wiring of it into the nav-bar panel host
// (2026-09-17 nav-bar redesign spec §2.6, leaf N9). Ports
// e2e/app-bar-leading-trailing.test.ts's "trailing kebab shows the Web
// Push toggle with its current state" test (READ-ONLY reference, left
// unmodified there — see this leaf's own completion report for how that
// file's push-specific test was updated to assert absence instead) to the
// Notifications destination, plus a new assertion that the kebab
// (`#sb-app-bar-menu`) no longer carries any push/notifications item at
// all — the no-duplication half of R5e/spec §2.6, "the part easiest to
// forget."
//
// Same env-dependence the original test documents: this suite doesn't stub
// Notification.permission/PushManager (unlike e2e/push-notifications.test
// .ts), so which of editor_ui.tsx's 8 PUSH_TOGGLE_LABELS states is
// reachable depends on how the bundle under test was built:
//  - no VAPID_PUBLIC_KEY/PUSH_SIDECAR_URL at build time -> "not-configured"
//  - both set, but headless Chromium hard-codes Notification.permission to
//    "denied" regardless of the real OS/browser state -> "denied"
// Both are the `unavailable: true` branch of `pushToggle`, so both are
// covered by one env-aware assertion below rather than two branches, same
// as the original.
//
// NOT ported here: an e2e assertion of the "checking" pushState (spec's
// own new requirement over the kebab, which simply omitted that state) —
// `isPushSupported()` (client/lib/push_subscribe.ts) is a synchronous
// check of `"serviceWorker"/"PushManager"/"Notification" in
// globalThis`, true in headless Chromium regardless of server-side SW
// config, and the very next synchronous check inside the same effect
// (`Notification.permission === "denied"`) is *always* true in headless
// Chromium too (verified fact, documented in
// e2e/push-notifications.test.ts's own header comment) — so the mount
// effect that starts every page load in `pushState: "checking"` always
// resolves out of it on the same microtask, before any `await` boundary,
// in every reachable headless configuration. There is no stub-level hook
// (unlike the sidecar POST or PushManager.subscribe) that holds it open
// long enough for a Playwright assertion to land on it without invasive,
// out-of-scope changes to editor_ui.tsx itself. The "render disabled, not
// omitted" behavior for that state is implemented in notifications.tsx
// (`disabled = pushToggle === undefined || ...`) and is code-reviewable
// there; this is a documented gap, not an oversight.

test.describe("Notifications destination (N9)", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Welcome",
      // Same `config.set("actionButtons", {...})` pattern
      // app-bar-leading-trailing.test.ts's own test.use uses, and for the
      // same documented reason: it's a last-write-wins setter, so it makes
      // the kebab's actionButtons list deterministic instead of depending
      // on whether the Std library's own default home/book/terminal
      // buttons are present (they are, by default — a bare space with no
      // CONFIG.md override still yields more than just `configLinkItem`,
      // which is what the exact-count assertion below needs pinned down).
      "CONFIG.md": [
        "```space-lua",
        'config.set("actionButtons", {',
        "  {",
        '    icon = "activity",',
        '    description = "Test Action",',
        '    command = "Navigate: Home",',
        "  },",
        "})",
        "```",
        "",
      ].join("\n"),
    },
  });

  test("Notifications destination shows the push switch, disabled, with its current state as supporting text", async ({
    sbPage,
  }) => {
    await sbPage
      .locator('.sb-nav-bar m3e-nav-item[aria-label="Notifications"]')
      .click();

    const panel = sbPage.locator(".sb-nav-panel");
    await expect(panel).toBeVisible();

    const bootConfig = await sbPage.evaluate(() => {
      // deno-lint-ignore no-explicit-any
      const c = (globalThis as any).client;
      return {
        configured: !!(c?.bootConfig?.vapidPublicKey &&
          c?.bootConfig?.pushSidecarUrl),
      };
    });
    const expectedLabel = bootConfig.configured
      ? "Notification permission was denied — enable it in your browser settings"
      : "Push notifications are not configured for this server";

    await expect(panel).toContainText(expectedLabel);

    const toggle = panel.locator("m3e-switch");
    await expect(toggle).toHaveCount(1);
    // `disabled` is NOT a reflected attribute on m3e-switch (unlike
    // `checked`, which IS — verified live: the rendered element carries
    // `aria-disabled="true"` but no `disabled=""` attribute at all; only
    // `checked` has `reflects: true` in custom-elements.json). Assert the
    // live JS property instead, same convention
    // app-bar-leading-trailing.test.ts's own asterisk-icon `name` check
    // uses for an unreflected property.
    await expect(toggle).toHaveJSProperty("disabled", true);
    await expect(toggle).not.toHaveAttribute("checked", "");
    await expect(toggle).toHaveAttribute("aria-label", expectedLabel);

    // `unavailable: true` (both "not-configured" and "denied" set it) ->
    // the leading icon is "notifications_off", same mapping the deleted
    // kebab `pushMenuItem` used — verified via the m3e-icon child's `name`
    // JS property (a plain Lit reactive property, not a reflected
    // attribute, same reasoning app-bar-leading-trailing.test.ts's own
    // asterisk-icon assertion documents).
    await expect(panel.locator("m3e-icon[slot='leading']")).toHaveJSProperty(
      "name",
      "notifications_off",
    );

    // The nav item's own icon reflects the same state (spec's "wire the
    // nav item's icon dynamically" requirement, N1-N4 left it static).
    await expect(
      sbPage.locator(
        '.sb-nav-bar m3e-nav-item[aria-label="Notifications"] m3e-icon[slot="icon"]',
      ),
    ).toHaveJSProperty("name", "notifications_off");
  });

  test("the app-bar kebab no longer contains a push/notifications item", async ({
    sbPage,
  }) => {
    const kebab = sbPage.locator(
      'm3e-app-bar m3e-icon-button[title="More actions"]',
    );
    await kebab.click();

    const menu = sbPage.locator("#sb-app-bar-menu");
    await expect
      .poll(() => menu.evaluate((el: any) => el.isOpen))
      .toBe(true);

    // No duplication (spec §2.6's explicit call-out): none of the three
    // icons the push toggle ever used remain anywhere in the kebab.
    await expect(
      menu.locator(
        'm3e-icon[name="notifications_active"], m3e-icon[name="notifications"], m3e-icon[name="notifications_off"]',
      ),
    ).toHaveCount(0);

    // CONFIG.md (test.use above) pins `actionButtons` to exactly one entry,
    // so the kebab's `menuItems` (editor_ui.tsx) is now deterministically
    // `[configLinkItem, testActionItem]` — push deleted, read-only not yet
    // added (that's N10, separate leaf).
    await expect(menu.locator("m3e-menu-item")).toHaveCount(2);
    await expect(
      menu.locator("m3e-menu-item").filter({ hasText: "Open Config" }),
    ).toHaveCount(1);
    await expect(
      menu.locator("m3e-menu-item").filter({ hasText: "Test Action" }),
    ).toHaveCount(1);
  });
});
