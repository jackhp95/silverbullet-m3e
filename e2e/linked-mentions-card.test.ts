// Linked Mentions bottom widget chrome (toolbar-search-feedback spec, item 7
// / leaves L14-L15): the TOP/BOTTOM array-widget path (`!opts.inPage` in
// `client/codemirror/lua_widget.ts`'s `wrapHtml()`) now renders a real
// `m3e-card variant="outlined"` with an `m3e-app-bar` header instead of the
// old hand-built `.button-bar` + background-hacked `<h1>`. This test proves:
//   - the widget upgrades to `m3e-card` with a header reading "Linked
//     Mentions" (hoisted from the rendered markdown's leading `<h1>`, which
//     is removed from the body so it isn't shown twice);
//   - the leading icon-button collapses/expands the content region;
//   - the two trailing icon-buttons are real `m3e-icon-button`/`m3e-icon`
//     elements (not the old feather `<svg>` buttons) and still wire to the
//     same Reload/Copy backend calls as before.

import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

test.describe("Linked Mentions card chrome", () => {
  test.use({
    spaceFiles: {
      "Target.md": "# Target\nThe page other pages link to.\n",
      "Source.md": "# Source\nSee [[Target]] for details.\n",
    },
  });

  test("renders as an m3e-card with a collapsible app-bar header and working reload/copy", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Target");
    const editor = page.locator("#sb-editor .cm-content");
    await expect(editor).toContainText("Target");

    // Spy on the syscall dispatcher before interacting, so Reload/Copy
    // clicks can be verified against the exact backend calls the old
    // hand-built buttons used to make.
    await page.waitForFunction(() => !!(globalThis as any).client, undefined, {
      timeout: 10_000,
    });
    await page.evaluate(() => {
      const client = (globalThis as any).client;
      (globalThis as any).__syscallCalls = [];
      const orig = client.clientSystem.localSyscall.bind(client.clientSystem);
      client.clientSystem.localSyscall = (...args: unknown[]) => {
        (globalThis as any).__syscallCalls.push(args);
        return orig(...args);
      };
    });

    // ── The widget upgraded to a real m3e-card ────────────────────────────
    const card = editor.locator("m3e-card.sb-lua-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toHaveAttribute("variant", "outlined");

    // Old chrome is gone for this path.
    await expect(card.locator(".button-bar")).toHaveCount(0);

    // ── Header title hoisted from the leading <h1>, and not duplicated ────
    const appBar = card.locator("m3e-app-bar");
    await expect(appBar).toHaveCount(1);
    const title = appBar.locator('span[slot="title"]');
    await expect(title).toHaveText("Linked Mentions");
    await expect(card.locator("h1")).toHaveCount(0);

    const content = card.locator(".sb-lua-card-content");
    await expect(content).toContainText("Source");

    // ── Trailing icon-buttons are real Material icon-buttons ─────────────
    const trailingButtons = appBar.locator('m3e-icon-button[slot="trailing"]');
    await expect(trailingButtons).toHaveCount(2);

    const reloadButton = appBar.locator(
      'm3e-icon-button[data-button="reload"]',
    );
    await expect(reloadButton).toHaveCount(1);
    await expect(reloadButton.locator('m3e-icon[name="refresh"]')).toHaveCount(
      1,
    );

    const copyButton = appBar.locator('m3e-icon-button[data-button="copy"]');
    await expect(copyButton).toHaveCount(1);
    await expect(
      copyButton.locator('m3e-icon[name="content_copy"]'),
    ).toHaveCount(1);

    // No hand-rolled feather SVGs left in the header.
    await expect(appBar.locator("svg")).toHaveCount(0);

    // ── Leading icon-button collapses/expands the content region ─────────
    const collapseButton = appBar.locator('m3e-icon-button[slot="leading"]');
    await expect(collapseButton).toHaveCount(1);
    await expect(
      collapseButton.locator('m3e-icon[name="expand_less"]'),
    ).toHaveCount(1);
    await expect(content).toBeVisible();

    await collapseButton.click();
    await expect(content).toBeHidden();
    await expect(
      collapseButton.locator('m3e-icon[name="expand_more"]'),
    ).toHaveCount(1);

    await collapseButton.click();
    await expect(content).toBeVisible();
    await expect(
      collapseButton.locator('m3e-icon[name="expand_less"]'),
    ).toHaveCount(1);

    // ── Reload still calls the same backend function as before ───────────
    await reloadButton.click();
    await page.waitForFunction(
      () =>
        ((globalThis as any).__syscallCalls as unknown[][]).some(
          (call) =>
            call[0] === "system.invokeFunction" &&
            Array.isArray(call[1]) &&
            (call[1] as unknown[])[0] === "index.refreshWidgets",
        ),
      undefined,
      { timeout: 5_000 },
    );

    // ── Copy still copies the same clean markdown as before ───────────────
    await copyButton.click();
    await page.waitForFunction(
      () =>
        ((globalThis as any).__syscallCalls as unknown[][]).some(
          (call) => call[0] === "editor.copyToClipboard",
        ),
      undefined,
      { timeout: 5_000 },
    );
    const copyCall = await page.evaluate(() =>
      ((globalThis as any).__syscallCalls as unknown[][]).find(
        (call) => call[0] === "editor.copyToClipboard",
      ),
    );
    expect(copyCall).toBeTruthy();
    const copiedText = (copyCall as unknown[])[1] as unknown[];
    expect(String(copiedText[0])).toContain("Source");
  });

  test("in-page block widgets keep the old button-bar chrome (regression)", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "Source");
    const editor = page.locator("#sb-editor .cm-content");

    // A directly-typed ${} directive is an in-page widget: it must keep the
    // hand-built button-bar, not the new card chrome.
    await page.evaluate(() => {
      const view = (globalThis as any).client.editorView;
      const end = view.state.doc.length;
      view.dispatch({
        changes: {
          from: end,
          insert: '\n\n${ { {name = "a"}, {name = "b"} } }\n',
        },
      });
    });

    const widget = editor.locator(".sb-lua-directive-block").first();
    await widget.waitFor({ state: "visible", timeout: 10_000 });
    await widget.hover();
    await expect(
      widget.locator('.button-bar button[data-button="reload"]'),
    ).toHaveCount(1);
    await expect(widget.locator("m3e-card")).toHaveCount(0);
  });
});
