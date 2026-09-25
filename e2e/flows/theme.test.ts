import { expect, gotoSilverBulletPage, test } from "../fixtures/core.ts";
import { isUpgraded } from "../fixtures/actions.ts";

// CS-1: `<m3e-theme>` becomes MainUI's root element (client/editor_ui.tsx),
// seeded from `--ui-accent-color`, and the registrations that were missing
// for `client/codemirror/lua_widget.ts`'s Linked Mentions card
// (`@m3e/web/{card,app-bar,icon}`) land alongside it. See
// docs/plans/2026-09-24-core-shell-decomposition.md CS-1 row.

test.describe("theme foundation: registrations + layout", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Index\nTheme foundation test space.\n",
    },
  });

  test("m3e-theme/card/app-bar/icon are all registered custom elements", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    const registered = await page.evaluate(() =>
      ["m3e-theme", "m3e-card", "m3e-app-bar", "m3e-icon"].every(
        (tag) => !!customElements.get(tag),
      )
    );
    expect(registered).toBe(true);
  });

  test("m3e-theme's color attribute mirrors the computed --ui-accent-color, and it lays out as display: contents", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");
    const themeEl = page.locator("m3e-theme").first();
    await expect(themeEl).toHaveCount(1);
    expect(await isUpgraded(page, "m3e-theme")).toBe(true);

    // Preact sets `color`/`scheme` as element *properties* here (Lit's
    // `color` accessor isn't attribute-reflecting -- confirmed live:
    // `getAttribute("color")` stays null while the `.color` property holds
    // the real value), so read the property, not the attribute. Poll: it's
    // set by a `useEffect` that runs after first paint (it re-reads the
    // computed custom property once mounted).
    await expect
      .poll(() =>
        page.evaluate(() => (document.querySelector("m3e-theme") as any)?.color)
      , { timeout: 15_000 })
      .toMatch(/^#[0-9a-f]{6}$/);

    const { colorProp, computedAccent, display } = await page.evaluate(() => {
      const el = document.querySelector("m3e-theme") as any;
      return {
        colorProp: el.color as string,
        computedAccent: getComputedStyle(document.documentElement)
          .getPropertyValue("--ui-accent-color")
          .trim(),
        display: getComputedStyle(el).display,
      };
    });
    expect(colorProp.toLowerCase()).toBe(computedAccent.toLowerCase());
    expect(display).toBe("contents");
  });
});

// Port of fork `e2e/theme-accent-color.test.ts` -- same mechanism (a
// `space-style` Lua object override), same red-dominant heuristic (avoids
// depending on m3e-theme's exact HCT tonal-palette math).
test.describe("theme foundation: space-style accent override", () => {
  const OVERRIDE_ACCENT = "#ff0000";

  test.use({
    spaceFiles: {
      "index.md": "# Index\nAccent color override test space.\n",
      "Styles.md":
        `# Styles\n\n\`\`\`space-style\nhtml {\n  --ui-accent-color: ${OVERRIDE_ACCENT};\n}\n\`\`\`\n`,
    },
  });

  test("space-style --ui-accent-color override reshapes m3e's Material primary color role", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    // The space-style block loads asynchronously, well after first paint
    // (client.ts's `loadCustomStyles`, called near the end of boot).
    await expect
      .poll(() => page.locator("#custom-styles style").count(), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    function readPrimaryRgb(p: typeof page) {
      return p.evaluate(() => {
        const themeEl = document.querySelector("m3e-theme")!;
        const probe = document.createElement("span");
        probe.style.color = getComputedStyle(themeEl)
          .getPropertyValue("--md-sys-color-primary")
          .trim();
        document.body.appendChild(probe);
        const [r, g, b] = getComputedStyle(probe)
          .color.match(/\d+/g)!
          .map(Number);
        probe.remove();
        return { r, g, b };
      });
    }

    await expect
      .poll(
        async () => {
          const rgb = await readPrimaryRgb(page);
          return rgb.r > rgb.b && rgb.r > rgb.g;
        },
        { timeout: 10_000 },
      )
      .toBe(true);
  });
});

// Premise correction (see builder report): the plan's acceptance test
// assumed main's built-in "Linked Mentions" navigator feature renders
// through `client/codemirror/lua_widget.ts`'s TOP/BOTTOM array-widget path
// (`wrapHtmlAsCard`, gated on `!inPage`) -- the same path fork commit
// `3f6ba829` reskinned into `m3e-card`/`m3e-app-bar`. Verified live (see
// report): on main today, the built-in feature actually renders through a
// completely different, already-fully-registered system (
// `client/navigator/ui/components/page_widget_frame.tsx` +
// `content_view.tsx`, driven by `NavPageSlotWidget`/`pageSlotViews`), not
// `lua_widget.ts` at all. `lua_widget.ts`'s array-widget path is reached
// only by a plug/space-lua listener on the `hooks:renderTopWidgets` /
// `hooks:renderBottomWidgets` app events (`client/codemirror/
// top_bottom_panels.ts`'s `ArrayWidget`) -- comment there literally calls
// it "the legacy Lua top and bottom widgets" -- and nothing in a stock
// space registers one. This test exercises that path directly via a
// `space-lua` `event.listen` block, which is exactly how a real widget
// (Linked Mentions/TOC/Linked Tasks equivalent) would reach it, to prove
// the missing `@m3e/web/{card,app-bar,icon}` registrations actually fixed
// the "inert HTML" bug finding #1 described, rather than asserting against
// a feature that never exercised the broken path in the first place.
test.describe("theme foundation: legacy Lua top/bottom array widget card", () => {
  test.use({
    spaceFiles: {
      "A.md": "# A\nThe page B links to.\n",
      "B.md": "# B\nSee [[A]].\n",
      "Widget.md": [
        "# Widget",
        "",
        "```space-lua",
        "event.listen {",
        '  name = "hooks:renderBottomWidgets",',
        "  run = function(e)",
        "    return {",
        "      _isWidget = true,",
        '      markdown = "# Linked Mentions\\n\\nSee [[A]].",',
        '      display = "block"',
        "    }",
        "  end",
        "}",
        "```",
        "",
      ].join("\n"),
    },
  });

  test("renders as an upgraded m3e-card with an m3e-app-bar title, hoisted from the leading heading", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "A");
    const card = page.locator("#sb-editor m3e-card.sb-lua-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    expect(await isUpgraded(page, "#sb-editor m3e-card.sb-lua-card")).toBe(
      true,
    );
    await expect(
      card.locator('m3e-app-bar span[slot="title"]'),
    ).toHaveText("Linked Mentions");
  });
});
