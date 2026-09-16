import type { Page } from "@playwright/test";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

/**
 * True once `tag` is a registered custom element AND the matched `selector`
 * element has actually been upgraded to an instance of it — not just present
 * in the light DOM waiting on its module. This is the cross-cutting
 * Playwright acceptance gate every m3e reskin PR adds (see docs/plans/
 * 2026-09-16-m3e-reskin-and-agentic-journal-spec.md §3): assert the m3e-*
 * element *upgrades* and renders, not just "looks right in the diff".
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

function hasAttribute(
  page: Page,
  selector: string,
  attribute: string,
): Promise<boolean> {
  return page.locator(selector).evaluate(
    (el, attribute) => el.hasAttribute(attribute),
    attribute,
  );
}

// editor_ui.tsx's `#sb-main` (the "side panels" chrome named by this branch)
// hosts the lhs/rhs Panel (panel.tsx) slots inside an m3e-drawer-container.
// This exercises the same public surface any plug uses to open a side panel
// — plug-api/syscalls/editor.ts's editor.showPanel(id, mode, html, script),
// which round-trips through client/plugos/syscalls/editor.ts into
// client.ui.viewDispatch({type: "show-panel", ...}). Only the CHROME (the
// drawer host + its close/toggle affordance) is under test here — the panel
// CONTENT is Panel's own plug-owned iframe (panel.tsx, untouched by this
// PR), so content is asserted only by reaching through the iframe boundary,
// never by reading the host's own light DOM.
test.describe("editor_ui.tsx m3e-drawer-container side-panel chrome", () => {
  test("lhs panel opens through an upgraded, toggleable m3e-drawer-container", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer);

    await sbPage.evaluate(() =>
      (globalThis as any).client.clientSystem.localSyscall(
        "editor.showPanel",
        ["lhs", 2, '<div id="e2e-panel-marker">Hello from panel</div>', ""],
      )
    );

    // Chrome: the drawer container opens its `start` drawer and upgrades.
    await expect
      .poll(() => hasAttribute(sbPage, "#sb-main", "start"))
      .toBe(true);
    expect(await isUpgraded(sbPage, "m3e-drawer-container", "#sb-main")).toBe(
      true,
    );

    const panelHost = sbPage.locator("#sb-panel-lhs");
    await expect(panelHost).toBeVisible();

    // Toggle affordance is a real m3e-drawer-toggle, upgraded, wired to this
    // drawer's slotted content.
    expect(
      await isUpgraded(
        sbPage,
        "m3e-drawer-toggle",
        "#sb-panel-lhs m3e-drawer-toggle",
      ),
    ).toBe(true);
    await expect(sbPage.locator("#sb-panel-lhs m3e-drawer-toggle")).toHaveAttribute(
      "for",
      "sb-panel-lhs",
    );

    // Content: untouched plug-owned iframe, still reachable only via its own
    // postMessage-driven document — proves the iframe/IPC boundary the
    // chrome wraps is intact.
    const frame = sbPage.frameLocator("#sb-panel-lhs iframe");
    await expect(frame.locator("#e2e-panel-marker")).toHaveText(
      "Hello from panel",
    );

    // Toggling: the close affordance dispatches hide-panel, which both
    // closes the drawer (chrome) and unmounts Panel (content) together.
    await sbPage.locator("#sb-panel-lhs .sb-panel-drawer-close").click();

    await expect
      .poll(() => hasAttribute(sbPage, "#sb-main", "start"))
      .toBe(false);
    await expect(panelHost).toHaveCount(0);
  });
});
