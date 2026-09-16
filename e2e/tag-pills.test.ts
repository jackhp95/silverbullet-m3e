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

// codemirror/hashtag.ts's live-preview decoration replaced `.sb-hashtag`
// (a plain `<a>`) with `m3e-assist-chip` — see that file's comment for why
// `m3e-assist-chip` specifically (it carries a native `href`/`click`,
// unlike the non-interactive `m3e-chip` the spec prose named; verified
// against node_modules/@m3e/web/dist/custom-elements.json, not assumed).
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
    expect(
      await isUpgraded(
        sbPage,
        "m3e-assist-chip",
        'm3e-assist-chip[data-tag-name="task"]',
      ),
    ).toBe(true);

    // colors.scss keys the chip's outline/label color off data-tag-name;
    // "task" maps to the M3 primary role. Unlike an inline `style`
    // attribute (an unresolved `var()` reference stays literal text
    // there), a custom property read via getComputedStyle on an external
    // stylesheet rule IS fully substituted — so assert by comparing the
    // *resolved* values of the two properties instead of assuming either
    // is a literal `var(...)` string.
    const [outlineColor, primaryColor] = await chip.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.getPropertyValue("--m3e-outlined-chip-outline-color").trim(),
        style.getPropertyValue("--md-sys-color-primary").trim(),
      ];
    });
    expect(outlineColor).not.toBe("");
    expect(outlineColor).toBe(primaryColor);

    // A tag with no category entry still gets the fork's pre-existing
    // hashtag color tokens as a fallback, not an unstyled default.
    const otherChip = sbPage.locator(
      'm3e-assist-chip[data-tag-name="someothertag"]',
    );
    await otherChip.waitFor({ state: "attached", timeout: 10_000 });
    const [fallbackColor, hashtagColor] = await otherChip.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.getPropertyValue("--m3e-chip-label-text-color").trim(),
        style.getPropertyValue("--editor-hashtag-color").trim(),
      ];
    });
    expect(fallbackColor).not.toBe("");
    expect(fallbackColor).toBe(hashtagColor);
    // And the fallback must differ from the "task" category color, or the
    // palette isn't actually differentiating anything.
    expect(fallbackColor).not.toBe(primaryColor);
  });

  test("clicking a tag pill navigates to its tag page (no live filter/search action here)", async ({
    sbPage,
  }) => {
    // Verified live (not assumed): a hashtag's href/click behavior is a
    // plain SPA navigation to `tag:<name>` (client.dispatchClickEvent ->
    // syntax-tree lookup -> client.navigate), never
    // editor.filterBox()/FilterList — so `m3e-filter-chip` (toggle
    // select/deselect) would be the wrong component here; there's no
    // "live filter" affordance to preserve, only navigation.
    const chip = sbPage.locator('m3e-assist-chip[data-tag-name="task"]');
    await chip.waitFor({ state: "attached", timeout: 10_000 });
    await chip.click();
    // `encodePageURI("tag:task")` escapes the colon to `%3A`; assert
    // loosely on either representation rather than assuming which one the
    // browser's URL/history normalization settles on.
    await sbPage.waitForURL(/\/tag(%3A|:)task$/);
  });
});
