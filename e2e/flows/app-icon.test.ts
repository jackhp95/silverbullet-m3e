import { expect, gotoSilverBulletPage, test } from "../fixtures/core.ts";

// App identity icon = Material Symbols `asterisk` (scripts/icons/build-app-icons.sh),
// not the SilverBullet logo. Hermetic: only talks to the per-test server.

type ManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
};

test.describe("app icon: material asterisk", () => {
  test.use({
    spaceFiles: { "index.md": "# Index\nApp icon test space.\n" },
  });

  test("manifest lists any + maskable asterisk icons that resolve as PNGs", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    const manifestUrl = new URL(manifestHref ?? "", page.url()).href;
    const manifest = await (await page.request.get(manifestUrl)).json();
    const icons: ManifestIcon[] = manifest.icons;

    expect(icons.map((i) => `${i.purpose}:${i.sizes}`).sort()).toEqual([
      "any:192x192",
      "any:512x512",
      "maskable:192x192",
      "maskable:512x512",
    ]);

    for (const icon of icons) {
      const res = await page.request.get(new URL(icon.src, manifestUrl).href);
      expect(res.status(), icon.src).toBe(200);
      expect(res.headers()["content-type"], icon.src).toBe(icon.type);
      expect((await res.body()).length, icon.src).toBeGreaterThan(500);
    }
  });

  test("favicon + apple-touch-icon links resolve", async ({
    sbServer,
    page,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "index");

    const hrefs = await page
      .locator('link[rel~="icon"], link[rel="apple-touch-icon"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLLinkElement).href));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);

    for (const href of hrefs) {
      const res = await page.request.get(href);
      expect(res.status(), href).toBe(200);
    }

    // The SVG favicon is the vendored asterisk path, not the SB logo raster.
    const svgHref = hrefs.find((h) => h.endsWith("favicon.svg"));
    const svg = await (await page.request.get(svgHref ?? "")).text();
    expect(svg).toContain("M11 21v-6.6");
    expect(svg).not.toContain("<image");
  });
});
