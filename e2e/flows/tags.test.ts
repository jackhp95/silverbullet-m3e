import { isUpgraded } from "../fixtures/actions.ts";
import { expect, test } from "../fixtures/core.ts";

// Port of fork `tag-pills.test.ts` (4cfc3763). A hashtag renders as an
// href-less m3e-assist-chip; editor_state.ts's `closest("a, [data-tag-name]")`
// click intercept routes it through `page:click` (in-app navigation).

test.describe("hashtag tag pills (m3e-assist-chip)", () => {
  test.use({
    spaceFiles: {
      "index.md": "Some notes #task here and a #someothertag too.",
    },
  });

  test("renders an upgraded m3e-assist-chip for a hashtag, colored by its data-tag-name category", async ({
    sbPage,
  }) => {
    const chip = sbPage.locator('m3e-assist-chip[data-tag-name="task"]');
    await chip.waitFor({ state: "attached", timeout: 10_000 });
    await expect(chip).toContainText("#task");
    expect(await isUpgraded(sbPage, 'm3e-assist-chip[data-tag-name="task"]')).toBe(
      true,
    );

    // colors.scss keys the "task" chip's outline/label color off the M3
    // primary role (client/styles/colors.scss:275-279).
    const [outlineColor, primaryColor] = await chip.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.getPropertyValue("--m3e-outlined-chip-outline-color").trim(),
        style.getPropertyValue("--md-sys-color-primary").trim(),
      ];
    });
    expect(outlineColor).not.toBe("");
    expect(outlineColor).toBe(primaryColor);

    // A tag with no category entry falls back to `--root-color` (main's
    // theme-aware body text), not the unreadable `--editor-hashtag-color`
    // (colors.scss:262-272 -- changed in orchestrator review of 6-styles).
    const otherChip = sbPage.locator(
      'm3e-assist-chip[data-tag-name="someothertag"]',
    );
    await otherChip.waitFor({ state: "attached", timeout: 10_000 });
    const [fallbackColor, rootColor] = await otherChip.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.getPropertyValue("--m3e-chip-label-text-color").trim(),
        style.getPropertyValue("--root-color").trim(),
      ];
    });
    expect(fallbackColor).not.toBe("");
    expect(fallbackColor).toBe(rootColor);
    // And the fallback must differ from the "task" category color, or the
    // palette isn't actually differentiating anything.
    expect(fallbackColor).not.toBe(primaryColor);
  });

  test("clicking a tag pill navigates to its tag page", async ({ sbPage }) => {
    const chip = sbPage.locator('m3e-assist-chip[data-tag-name="task"]');
    await chip.waitFor({ state: "attached", timeout: 10_000 });
    await chip.click();
    // encodePageURI("tag:task") escapes the colon to %3A; accept either
    // representation rather than assuming browser URL normalization.
    await sbPage.waitForURL(/\/tag(%3A|:)task$/);
  });

  test("clicking a tag pill navigates in-app, not via a full page load", async ({
    sbPage,
  }) => {
    // editor_state.ts treats `[data-tag-name]` like a link: it cancels the
    // chip's native href and dispatches `page:click`. Without that, the
    // browser follows the href and reloads the page, dropping this marker.
    await sbPage.evaluate(() => {
      (globalThis as any).__tagClickMarker = true;
    });
    const chip = sbPage.locator('m3e-assist-chip[data-tag-name="task"]');
    await chip.waitFor({ state: "attached", timeout: 10_000 });
    await chip.click();
    await sbPage.waitForURL(/\/tag(%3A|:)task$/);
    expect(
      await sbPage.evaluate(() => (globalThis as any).__tagClickMarker),
    ).toBe(true);
  });
});
