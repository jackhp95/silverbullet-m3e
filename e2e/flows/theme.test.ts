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

    const { colorAttr, computedAccent, display } = await page.evaluate(() => {
      const el = document.querySelector("m3e-theme")!;
      return {
        colorAttr: el.getAttribute("color"),
        computedAccent: getComputedStyle(document.documentElement)
          .getPropertyValue("--ui-accent-color")
          .trim(),
        display: getComputedStyle(el).display,
      };
    });
    expect(colorAttr?.toLowerCase()).toBe(computedAccent.toLowerCase());
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

// Minimal port of fork `e2e/linked-mentions-card.test.ts`: proves the
// registration fix actually upgrades the Linked Mentions widget in
// production, rather than just checking `customElements.get`.
test.describe("theme foundation: linked mentions card", () => {
  test.use({
    spaceFiles: {
      "A.md": "# A\nThe page B links to.\n",
      "B.md": "# B\nSee [[A]].\n",
    },
  });

  test("Linked Mentions renders as an upgraded m3e-card with an m3e-app-bar title", async ({
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
