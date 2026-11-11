import type { Page } from "@playwright/test";
import { openPicker, runCommandViaPalette } from "../fixtures/actions.ts";
import { expect, gotoSilverBulletPage, mod, test } from "../fixtures/core.ts";

// APPS-2 (nix-homelab docs/design/2026-11-10-m3e-apps-triage.md): the app
// chrome follows the m3e theme at both reference viewports -- one surface
// role under the app bar and the editor, links from the theme's primary
// role (and not told apart by colour alone), the floating toolbar clear of
// text, named controls, `main` + a zoomable viewport, and a navigator
// header that keeps its filter usable.

const VIEWPORTS = [
  { name: "phone 411x761", width: 411, height: 761 },
  { name: "desktop 1280x720", width: 1280, height: 720 },
] as const;

const LONG_PAGE = [
  "# Long page",
  "",
  "Intro with a [[link target]] in the middle of a sentence.",
  ...Array.from(
    { length: 80 },
    (_, i) => `Line ${i} of filler text that wraps on a phone-width screen.`,
  ),
].join("\n");

/** Resolves a theme role to the rgb() the browser paints, in the theme root's
 * scope (`<m3e-theme>` publishes `--md-sys-color-*` on itself, not `html`). */
function resolveRole(page: Page, role: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${name})`;
    document.querySelector("m3e-theme")!.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, role);
}

const bg = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

for (const viewport of VIEWPORTS) {
  test.describe(`app chrome follows the m3e theme (${viewport.name})`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      spaceFiles: {
        "index.md": "# Index\n\nBody text.\n",
        "Long.md": LONG_PAGE,
        "link target.md": "# Target\n",
      },
    });

    test("app bar, editor and the page beside the dock share the surface role", async ({
      sbServer,
      page,
    }) => {
      await gotoSilverBulletPage(page, sbServer, "Long");
      const surface = await resolveRole(page, "--md-sys-color-surface");
      expect(await bg(page, "#sb-top")).toBe(surface);
      expect(await bg(page, "#sb-main")).toBe(surface);
      const border = await resolveRole(page, "--md-sys-color-outline-variant");
      expect(
        await page
          .locator("#sb-top")
          .evaluate((el) => getComputedStyle(el).borderBottomColor),
      ).toBe(border);
    });

    test("wiki links use the primary role and are underlined", async ({
      sbServer,
      page,
    }) => {
      await gotoSilverBulletPage(page, sbServer, "Long");
      const link = page.locator(".cm-content a.sb-wiki-link").first();
      await expect(link).toBeVisible();
      const style = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return { color: s.color, decoration: s.textDecorationLine };
      });
      expect(style.color).toBe(
        await resolveRole(page, "--md-sys-color-primary"),
      );
      expect(style.decoration).toBe("underline");
    });

    test("the floating toolbar never covers visible text, at rest or scrolled", async ({
      sbServer,
      page,
    }) => {
      await gotoSilverBulletPage(page, sbServer, "Long");
      const overlapping = () =>
        page.evaluate(() => {
          const bar = document
            .querySelector(".sb-floating-toolbar")!
            .getBoundingClientRect();
          const view = document
            .querySelector(".cm-scroller")!
            .getBoundingClientRect();
          // Only the part of a line the scroller shows can be covered.
          return [...document.querySelectorAll(".cm-line")].filter((line) => {
            const r = line.getBoundingClientRect();
            const bottom = Math.min(r.bottom, view.bottom);
            return (
              (line.textContent ?? "").trim() !== "" &&
              r.top < view.bottom &&
              bottom > view.top &&
              r.left < bar.right &&
              r.right > bar.left &&
              r.top < bar.bottom &&
              bottom > bar.top
            );
          }).length;
        });
      expect(await overlapping()).toBe(0);
      await page.locator(".cm-scroller").evaluate((el) => {
        el.scrollTop = el.scrollHeight / 2;
      });
      await expect.poll(overlapping).toBe(0);
    });

    test("page name and page content have accessible names; main landmark; zoomable viewport", async ({
      sbServer,
      page,
    }) => {
      await gotoSilverBulletPage(page, sbServer, "Long");
      await expect(
        page.getByRole("textbox", { name: "Page name" }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Page content" }),
      ).toBeVisible();
      await expect(page.locator("main#sb-main")).toHaveCount(1);
      const viewportMeta = await page
        .locator('meta[name="viewport"]')
        .getAttribute("content");
      expect(viewportMeta).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/);
    });

    test("the page picker's title sits on its filter's row, and its filter is named", async ({
      sbServer,
      page,
    }) => {
      await gotoSilverBulletPage(page, sbServer, "index");
      const frame = await openPicker(page, `${mod}+k`, "Page");
      const title = await frame.locator(".sb-nav-title").boundingBox();
      const bar = await frame.locator(".sb-nav-search-bar").boundingBox();
      expect(title).not.toBeNull();
      expect(bar).not.toBeNull();
      const centreGap = Math.abs(
        title!.y + title!.height / 2 - (bar!.y + bar!.height / 2),
      );
      expect(centreGap).toBeLessThan(4);
      // `m3e-search-bar` re-roles the slotted input, so assert the name on
      // the element itself rather than through a role query.
      await expect(frame.locator("input.sb-nav-input")).toHaveAttribute(
        "aria-label",
        "Page",
      );
    });
  });
}

test.describe("navigator dock header at a docked-sidebar width", () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    spaceFiles: { "index.md": "# Home\n", "Projects/Alpha.md": "# Alpha" },
  });

  test("the filter keeps (nearly) the whole dock width instead of a stub", async ({
    sbPage,
  }) => {
    await runCommandViaPalette(sbPage, "Navigate: Tree");
    const dock = sbPage.locator(".sb-nav-root-lhs");
    await expect(dock).toBeVisible({ timeout: 20_000 });
    const dockBox = await dock.boundingBox();
    const barBox = await dock.locator(".sb-nav-search-bar").boundingBox();
    expect(barBox!.width).toBeGreaterThan(dockBox!.width * 0.8);
  });
});
