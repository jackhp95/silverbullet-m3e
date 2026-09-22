import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// editor_ui.tsx sources m3e-theme's `color` seed from the space's own
// `--ui-accent-color` custom property (client/styles/_tokens.scss) rather
// than a hardcoded literal, re-reading it once the space-style override (if
// any) has actually loaded into `#custom-styles` (see the `accentColor`
// effect's own comment in editor_ui.tsx for why it can't just read at
// mount). This test overrides `--ui-accent-color` via a `Styles.md`
// space-style block — the same mechanism CONFIG.md/[[Space Style]] uses in
// a real space — and asserts the resulting Material color role
// (`--md-sys-color-primary`, set at runtime by m3e-theme) reflects the
// override rather than the default `#464cfc`.

// A saturated, unambiguous red: far from the default's blue-purple hue, so a
// green/blue-dominant vs. red-dominant channel comparison is a robust,
// algorithm-agnostic way to detect "the override propagated" without
// depending on m3e-theme's exact HCT tonal-palette math.
const OVERRIDE_ACCENT = "#ff0000";

test.use({
  spaceFiles: {
    "index.md": "# Index\nAccent color override test space.",
    "Styles.md":
      `# Styles\n\n\`\`\`space-style\nhtml {\n  --ui-accent-color: ${OVERRIDE_ACCENT};\n}\n\`\`\`\n`,
  },
});

// m3e-theme sets `--md-sys-color-*` on itself (ThemeElement.ts), not on
// `document.documentElement` — descendants pick it up via ordinary CSS
// custom-property inheritance, but the property only reads back as
// non-empty from the `<m3e-theme>` element (or one of its descendants), not
// from `html`/`body` (see `readRgb` below, which reads off it directly).

test("space-style --ui-accent-color override reshapes m3e's Material primary color role", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "index");

  // Wait for the space-style block to actually load and apply — it's
  // fetched async, well after the editor is first visible (see
  // client.ts's `loadCustomStyles`, called near the end of boot).
  await expect
    .poll(() => page.locator("#custom-styles style").count(), {
      timeout: 15_000,
    })
    .toBeGreaterThan(0);

  // 2026-09-22 (e2e regression triage): `m3e-theme` sets a real, non-empty
  // `--md-sys-color-primary` from its OWN default seed color from the very
  // first render, well before the space-style override has loaded — so
  // polling for merely "non-empty" (the previous version of this test)
  // resolves on that default and races the override. It happened to win
  // that race often enough to read as reliably green, until this branch's
  // larger client bundle (more app-bar/search-sheet/toolbar surface) pushed
  // first-paint timing past the point where the race consistently lost —
  // confirmed live (a debug probe with an extra fixed second of wait showed
  // the override DOES land correctly: docAccent, the theme's `color` prop,
  // and the resulting primary color role were all exactly right). Not an
  // application regression — the fix is polling on the actual signal this
  // test cares about (red-dominant, i.e. the override having taken effect)
  // instead of a weaker one that happens to usually correlate with it.
  function readRgb(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
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

  // A palette derived from a saturated red seed should be red-dominant —
  // the default `#464cfc` seed derives a blue-dominant primary, so this
  // alone distinguishes "override took effect" from "still on default".
  await expect.poll(async () => {
    const rgb = await readRgb(page);
    return rgb.r > rgb.b && rgb.r > rgb.g;
  }, { timeout: 10_000 }).toBe(true);
});
