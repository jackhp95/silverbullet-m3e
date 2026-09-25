import {
  currentPage,
  isUpgraded,
  navFrame,
  navInput,
  runCommandViaPalette,
} from "../fixtures/actions.ts";
import { expect, test } from "../fixtures/core.ts";

const viewConfig = `# Route view
\`\`\`space-lua
view.define {
  name = "fixture.routes",
  title = "Routes",
  command = "Fixture: Open Routes",
  dock = "modal",
  presentation = { mode = "list" },
  source = function()
    return js.importFromSpace("routes.js").rows()
  end,
  onSelect = function(item) editor.navigate(item.ref) end,
}
\`\`\`
`;

test.describe("Lua-defined views", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome",
      "CONFIG.md": viewConfig,
      "routes.js": `export function rows() {
        return new Promise(resolve => {
          globalThis.finishRoutes = () => resolve([{ name: "Open Destination", ref: "Destination" }]);
        });
      }`,
      "Destination.md": "# Destination",
    },
  });

  test("a Space Lua view runs its source and selection handlers", async ({
    sbPage,
  }) => {
    await runCommandViaPalette(sbPage, "Fixture: Open Routes");
    const frame = navFrame(sbPage);
    await expect(frame.getByRole("status", { name: "Loading" })).toBeVisible();
    await navInput(sbPage).fill("Destination");
    await sbPage.evaluate(() => (globalThis as any).finishRoutes());
    await expect(frame.locator(".sb-nav-title")).toHaveText("Routes");
    await expect(navInput(sbPage)).toHaveValue("Destination");
    await expect(frame.getByRole("status", { name: "Loading" })).toHaveCount(0);
    await frame.locator(".sb-nav-row", { hasText: "Open Destination" }).click();

    await expect(currentPage(sbPage)).toHaveValue("Destination");
    await expect(sbPage.locator(".sb-modal")).toBeHidden();
  });
});

const pickConfig = `# Pick command
\`\`\`space-lua
command.define {
  name = "Fixture: Pick Produce",
  run = function()
    local item = navigator.pick {
      title = "Choose Produce",
      placeholder = "Produce",
      source = function()
        return {
          { name = "Pear", value = "pear" },
          { name = "Plum", value = "plum" },
        }
      end,
    }
    return item and item.value or nil
  end,
}
\`\`\`
`;

test.describe("Lua picker", () => {
  test.use({
    spaceFiles: {
      "index.md": "Welcome",
      "CONFIG.md": pickConfig,
    },
  });

  test("selecting a row returns its full object to the suspended Lua command", async ({
    sbPage,
  }) => {
    const result = sbPage.evaluate(() =>
      (globalThis as any).sbRuntime.evalLua(
        'editor.invokeCommand("Fixture: Pick Produce")',
      ),
    );
    await expect(navInput(sbPage)).toHaveAttribute("placeholder", "Produce", {
      timeout: 20_000,
    });
    await navFrame(sbPage).locator(".sb-nav-row", { hasText: "Plum" }).click();

    await expect(sbPage.locator(".sb-modal")).toBeHidden();
    expect(await result).toBe("plum");
  });
});

test.describe("configuration extension", () => {
  test.use({ spaceFiles: { "index.md": "Workspace text" } });

  test("configuration tabs work inside the iframe without replacing the editor", async ({
    sbPage,
  }) => {
    const before = await sbPage.evaluate(() =>
      (globalThis as any).client.editorView.state.doc.toString(),
    );
    await runCommandViaPalette(sbPage, "Configuration: Open");

    // CS-3: the plug modal's chrome is now a real <m3e-dialog> (was a
    // hand-rolled .sb-modal-backdrop/.sb-modal pair) -- the plug content
    // itself still lives in the inner .sb-modal iframe below, unchanged.
    await expect(
      sbPage.locator("m3e-dialog[open] .sb-modal iframe"),
    ).toBeVisible();
    expect(await isUpgraded(sbPage, "m3e-dialog")).toBe(true);

    // plug-api/ui/tabs.tsx's tablist mode now renders <m3e-tabs>/<m3e-tab>
    // (reconcile slice-plugui, fork 664a4d53). m3e-tab DOES set an
    // accessible role of "tab" (verified: TabElement extends
    // `Role(..., "tab")` via ElementInternals -- getByRole still resolves
    // it), but its activation model differs from main's old plain-button
    // Tabs: arrow keys only move the ListKeyManager's roving focus (manual
    // activation), they don't select -- `aria-selected` (and the `selected`
    // IDL property) only flips on an explicit click/Enter/Space, not on
    // arrow movement alone (verified against @m3e/web's tabs.js
    // handleClick). `aria-selected` also isn't a literal DOM attribute here
    // (internals-reflected), so read the `selected` property instead.
    const frame = sbPage.frameLocator(".sb-modal iframe");
    const configuration = frame.getByRole("tab", {
      name: "Configuration",
      exact: true,
    });
    await expect(configuration).toBeVisible();
    await configuration.focus();
    await sbPage.keyboard.press("ArrowRight");
    const shortcuts = frame.getByRole("tab", {
      name: "Keyboard Shortcuts",
      exact: true,
    });
    await expect(shortcuts).toBeFocused();
    await sbPage.keyboard.press("Enter");
    expect(await shortcuts.evaluate((el) => (el as any).selected)).toBe(true);
    await sbPage.keyboard.press("Home");
    await sbPage.keyboard.press("Enter");
    expect(await configuration.evaluate((el) => (el as any).selected)).toBe(
      true,
    );

    expect(
      await sbPage.evaluate(() =>
        (globalThis as any).client.editorView.state.doc.toString(),
      ),
    ).toBe(before);
  });

  test("plug modal (m3e-dialog) closes on Escape and can reopen", async ({
    sbPage,
  }) => {
    await runCommandViaPalette(sbPage, "Configuration: Open");
    await expect(
      sbPage.locator("m3e-dialog[open] .sb-modal iframe"),
    ).toBeVisible();

    // Escape closes it (m3e-dialog's own dismissible handling, routed back
    // to `hide-panel` via onclosed -- see editor_ui.tsx's comment). Pressed
    // before anything shifts keyboard focus into the plug's iframe (its own
    // document), which native <dialog> Escape handling can't see.
    await sbPage.keyboard.press("Escape");
    await expect(sbPage.locator("m3e-dialog[open]")).toHaveCount(0);
    await expect(sbPage.locator(".sb-modal")).toBeHidden();

    // Reopening works -- state was actually cleared, not just visually
    // hidden.
    await runCommandViaPalette(sbPage, "Configuration: Open");
    await expect(
      sbPage.locator("m3e-dialog[open] .sb-modal iframe"),
    ).toBeVisible();
  });
});
