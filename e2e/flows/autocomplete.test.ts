import { createPageViaPagePicker } from "../fixtures/actions.ts";
import { expect, test } from "../fixtures/core.ts";

// Port of fork `slash-menu-autocomplete-m3e.test.ts` (4cfc3763). The CM6
// autocomplete/slash-command tooltip (`.cm-tooltip-autocomplete`) has no
// render/tag-swap hook, so this is a token-driven CSS reskin
// (client/styles/colors.scss:181-226, landed by reconcile/slice-6-styles),
// not an m3e element swap. Asserts the reskin actually resolves M3 tokens
// rather than CM's stock `#17c` blue / `#f5f5f5` gray.
test.describe("autocomplete tooltip M3E reskin", () => {
  test("slash-command tooltip resolves container + selection colors from M3 tokens", async ({
    sbPage,
  }) => {
    await createPageViaPagePicker(sbPage, "Autocomplete Tooltip Test");

    const editor = sbPage.locator("#sb-editor .cm-content");
    await editor.click();
    await sbPage.keyboard.type("/hr");

    const tooltip = sbPage.locator(".cm-tooltip-autocomplete");
    await expect(tooltip).toBeVisible();
    const option = tooltip.locator("li", { hasText: "hr" });
    await expect(option).toBeVisible();

    // Container: surface-container background + on-surface text + a real
    // rounded corner + a real elevation shadow -- not CM's stock plain box.
    const container = await tooltip.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        surfaceColor: style
          .getPropertyValue("--sb-autocomplete-surface-color")
          .trim(),
        surfaceToken: style
          .getPropertyValue("--md-sys-color-surface-container")
          .trim(),
        onSurfaceColor: style
          .getPropertyValue("--sb-autocomplete-on-surface-color")
          .trim(),
        onSurfaceToken: style
          .getPropertyValue("--md-sys-color-on-surface")
          .trim(),
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        border: style.borderStyle,
      };
    });
    expect(container.surfaceColor).not.toBe("");
    expect(container.surfaceColor).toBe(container.surfaceToken);
    expect(container.onSurfaceColor).not.toBe("");
    expect(container.onSurfaceColor).toBe(container.onSurfaceToken);
    expect(container.borderRadius).not.toBe("0px");
    expect(container.boxShadow).not.toBe("none");
    expect(container.border).toBe("none");

    // The keyboard-highlighted option (CM always marks the first match
    // aria-selected on open) must resolve to the secondary-container pair,
    // not CM's stock baseTheme #17c/white -- and must out-rank it (see
    // colors.scss's `!important` comment).
    await expect(option).toHaveAttribute("aria-selected", "true");
    const selected = await option.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        background: style.backgroundColor,
        selectedToken: style
          .getPropertyValue("--sb-autocomplete-selected-color")
          .trim(),
        onSelectedToken: style
          .getPropertyValue("--sb-autocomplete-on-selected-color")
          .trim(),
      };
    });
    expect(selected.background).not.toBe("rgb(17, 119, 204)"); // CM stock #17c
    expect(selected.selectedToken).not.toBe("");
    expect(selected.onSelectedToken).not.toBe("");

    // Resolve the token itself (a probe element inheriting the same
    // cascade) to prove `background-color` is literally that token's
    // computed color, not a coincidentally-similar hardcoded value.
    const resolvedSelectedColor = await option.evaluate((el, token) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      el.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    }, "--sb-autocomplete-selected-color");
    expect(selected.background).toBe(resolvedSelectedColor);
  });
});
