import { expect, mod, test } from "./fixtures.ts";

/**
 * Phase C #10 (docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-spec.md
 * §2 row 4, §3 item 10) — the CM6 autocomplete/slash-command tooltip
 * (`.cm-tooltip-autocomplete`) has no render/tag-swap hook (verified against
 * `@codemirror/autocomplete`'s `completionTooltip` source: only
 * `optionClass`/`tooltipClass`/`addToOptions` classname hooks exist, the
 * <ul>/<li> DOM itself is fixed), and both `m3e-menu`/`m3e-floating-panel`
 * (anchor to a real `HTMLElement`, not a moving caret position) and
 * `m3e-autocomplete` (`attach()` expects an `<input>`-shaped control, not
 * CM's contenteditable surface) require anchoring CM doesn't own — so this
 * PR is a token-driven CSS reskin of CM's own tooltip chrome (see
 * colors.scss/editor.scss), not an element swap. This test asserts the
 * reskin actually took: computed style pulling from `--md-sys-color-*`
 * tokens rather than CM's stock `#17c` blue / `#f5f5f5` gray.
 */
test.describe("autocomplete tooltip M3E reskin", () => {
  test("slash-command tooltip resolves container + selection colors from M3 tokens", async ({
    sbPage,
  }) => {
    const editor = sbPage.locator("#sb-editor .cm-content");
    await expect(editor).toContainText("Welcome");

    // Fresh blank page: "/" at column 0 unambiguously matches
    // slash_command.ts's `slashCommandRegexp`, and the built-in
    // `Library/Std/Slash Templates/hr.md` template (bundled into every
    // space's base_fs) guarantees a `/hr` completion exists with no
    // custom spaceFiles fixture needed.
    await sbPage.keyboard.press(`${mod}+k`);
    await sbPage.locator(".sb-modal-box input.sb-input").click();
    await sbPage.keyboard.type("Autocomplete Tooltip Test", { delay: 30 });
    await sbPage.keyboard.press("Shift+Enter");
    await expect(editor).toHaveText("");

    await editor.click();
    await sbPage.keyboard.type("/hr");

    const tooltip = sbPage.locator(".cm-tooltip-autocomplete");
    await expect(tooltip).toBeVisible();
    const option = tooltip.locator("li", { hasText: "hr" });
    await expect(option).toBeVisible();

    // Container: surface-container background + on-surface text + a real
    // rounded corner + a real elevation shadow — not CM's stock plain box.
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
    // `aria-selected` on open) must resolve to the secondary-container
    // pair, not CM's stock baseTheme `#17c`/white — and must actually win
    // over that baseTheme rule (see colors.scss's `!important` comment).
    await expect(option).toHaveAttribute("aria-selected", "true");
    const selected = await option.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        background: style.backgroundColor,
        selectedToken: style
          .getPropertyValue("--sb-autocomplete-selected-color")
          .trim(),
        onSelectedColor: style.color,
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
