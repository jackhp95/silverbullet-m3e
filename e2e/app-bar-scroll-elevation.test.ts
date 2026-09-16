import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// m3e-app-bar's `for` attribute (AppBarElement.d.ts) drives elevation-on-
// scroll by attaching a native scroll listener directly to the element with
// that id. client/client.ts assigns that id, once, to CodeMirror's own
// public `EditorView.scrollDOM` handle right after the editor is
// constructed — replacing a MutationObserver that used to poll for
// `.cm-scroller` to appear in the DOM. This test scrolls the real editor
// and asserts both observable effects wired to that id: the app bar's own
// internal elevation state (`.base.on-scroll` in its shadow DOM) and this
// fork's breadcrumb-collapse state (`#sb-top[data-scrolled]`, top_bar.tsx).

const LONG_PAGE = Array.from(
  { length: 400 },
  (_, i) => `Line ${i}: enough content to make the editor scroll.`,
).join("\n");

test.use({
  spaceFiles: {
    "Long Page.md": LONG_PAGE,
  },
});

test("scrolling the editor elevates the app bar and marks #sb-top as scrolled", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "Long Page");

  // The scroll container CodeMirror's EditorView.scrollDOM was id'd as, set
  // once at editor mount (client.ts) — not discovered via DOM class hunt.
  const scroller = page.locator("#sb-editor-scroller");
  await expect(scroller).toHaveCount(1);

  const topBar = page.locator("#sb-top");
  await expect(topBar).toHaveAttribute("data-scrolled", "off");

  const appBarOnScroll = () =>
    page.locator("m3e-app-bar").evaluate((el) =>
      el.shadowRoot?.querySelector(".base")?.classList.contains("on-scroll") ??
        false
    );
  expect(await appBarOnScroll()).toBe(false);

  await scroller.evaluate((el) => {
    el.scrollTop = 2000;
  });

  await expect(topBar).toHaveAttribute("data-scrolled", "on", {
    timeout: 10_000,
  });
  await expect
    .poll(appBarOnScroll, { timeout: 10_000 })
    .toBe(true);

  // Scrolling back to the top clears both states — confirms this is a live
  // scroll listener on the real container, not a one-shot flag.
  await scroller.evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(topBar).toHaveAttribute("data-scrolled", "off", {
    timeout: 10_000,
  });
  await expect.poll(appBarOnScroll, { timeout: 10_000 }).toBe(false);
});
