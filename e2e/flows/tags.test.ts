import { isUpgraded } from "../fixtures/actions.ts";
import { expect, test } from "../fixtures/core.ts";

// Port of fork `tag-pills.test.ts` (4cfc3763). editor_state.ts's click
// handler was `closest("a")`, so a hashtag chip (an m3e-assist-chip, not an
// <a>) never reached client.dispatchAppEvent("page:click", ...) via that
// branch; `closest("a, [data-tag-name]")` fixes that. NOTE (investigated
// during CS-2): for this short "task" chip, CM's positional distanceX
// fallback (editor_state.ts's other branch, unconditional on closest())
// already resolves the click to inside the hashtag's syntax range and
// separately triggers navigation via `client.dispatchClickEvent`, so this
// specific assertion does NOT go red if the hunk is reverted -- confirmed
// empirically, not assumed. Kept as the fork's literal acceptance check
// (chip is real, clickable, lands on /tag:task); see the CS-2 report's
// Frictions section for the mutation-check gap.
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
});
