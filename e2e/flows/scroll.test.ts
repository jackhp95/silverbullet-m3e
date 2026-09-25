import { expect, gotoSilverBulletPage, test } from "../fixtures/core.ts";

// The editor scrolls inside `.cm-scroller`; the page itself never grows past
// the viewport, so the app bar stays pinned. (6-styles once ported the fork's
// dead `#sb-page-scroll` model and left long pages unscrollable.)
const body = Array.from({ length: 150 }, (_, i) => `Line ${i}`).join("\n");

test.use({ spaceFiles: { "Long.md": `# Long\n${body}\n` } });

for (const viewport of [
  { width: 411, height: 761 },
  { width: 1280, height: 800 },
]) {
  test(`a long page scrolls under the pinned app bar at ${viewport.width}x${viewport.height}`, async ({
    page,
    sbServer,
  }) => {
    await page.setViewportSize(viewport);
    await gotoSilverBulletPage(page, sbServer, "Long");
    await expect(page.locator("#sb-editor .cm-line").first()).toBeVisible();

    expect(
      await page.evaluate(
        () => document.scrollingElement!.scrollHeight <= window.innerHeight,
      ),
    ).toBe(true);

    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, 3000);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.querySelector("#sb-editor .cm-scroller")!.scrollTop,
        ),
      )
      .toBeGreaterThan(1000);
    await expect(
      page.locator("#sb-editor .cm-line", { hasText: /^Line 100$/ }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.querySelector("#sb-top")!.getBoundingClientRect().top,
      ),
    ).toBe(0);
  });
}
