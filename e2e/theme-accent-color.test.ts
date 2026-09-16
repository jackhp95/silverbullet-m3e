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
// from `html`/`body`.
function readPrimaryColor(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const el = document.querySelector("m3e-theme");
    return el
      ? getComputedStyle(el).getPropertyValue("--md-sys-color-primary").trim()
      : "";
  });
}

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

  // `m3e-theme` re-derives --md-sys-color-* only after its `color` prop
  // actually changes, which happens on the render following the
  // space-style load — poll rather than reading once immediately after the
  // style tag appears.
  await expect.poll(() => readPrimaryColor(page), {
    timeout: 10_000,
  }).not.toBe("");

  const rgb = await page.evaluate(() => {
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

  // A palette derived from a saturated red seed should be red-dominant —
  // the default `#464cfc` seed derives a blue-dominant primary, so this
  // alone distinguishes "override took effect" from "still on default".
  expect(rgb.r).toBeGreaterThan(rgb.b);
  expect(rgb.r).toBeGreaterThan(rgb.g);
});
