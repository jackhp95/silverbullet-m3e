import type { Page } from "@playwright/test";
import {
  expect,
  gotoSilverBulletPage,
  type SBServer,
  test,
  waitForEditorReady,
} from "./fixtures.ts";

// L12 (docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md §4/L12)
// — new coverage for the V5b redesign's actual behavior: the non-sticky
// `size="large"` app bar living inside `#sb-page-scroll` alongside the
// inline, editable front-matter property list, and the scroll-snap +
// re-snap-on-navigation mechanics (§11, decision #3).
//
// Superseded specs (deleted, not modified — nothing in them survives):
//   - app-bar-scroll-elevation.test.ts (the `for`-driven elevation + old
//     `#sb-top[data-scrolled]` mechanism L8/L9 removed)
//   - breadcrumb-scroll-collapse.test.ts (the `.sb-breadcrumb-row-shell`
//     collapse mechanism L9 removed)
// The one surviving selector update (the leading breadcrumb's first item is
// no longer a standalone icon-button) lives in
// app-bar-leading-trailing.test.ts, not here.

const LONG_BODY = Array.from(
  { length: 400 },
  (_, i) => `Line ${i}: enough content to make the page scroll.`,
).join("\n");

test.use({
  spaceFiles: {
    "RevealPage.md": [
      "---",
      "tags: [demo, sample]",
      "date: 2026-01-01",
      "---",
      "",
      "# Reveal Page",
      "",
      LONG_BODY,
      "",
    ].join("\n"),
    "NoFrontmatterPage.md": "# No Frontmatter\n\nJust a body, no YAML block.\n",
    "StatusPage.md": [
      "---",
      "status: draft",
      "tags: [journal, retro]",
      "owner:",
      "  name: Jack",
      "  email: j@x.com",
      "---",
      "",
      "# Status Page",
      "",
      "Some body content.",
      "",
    ].join("\n"),
    "BlockShapesPage.md": [
      "---",
      "tags:",
      "  - journal",
      "  - retro",
      "notes: |",
      "  line one",
      "  line two",
      "author: Jack",
      "---",
      "",
      "# Block Shapes Page",
      "",
      "Some body content.",
      "",
    ].join("\n"),
    "NavPageA.md": [
      "# Nav Page A",
      "",
      "Go to [[NavPageB]]",
      "",
      LONG_BODY,
      "",
    ].join("\n"),
    "NavPageB.md": ["# Nav Page B", "", LONG_BODY, ""].join("\n"),
  },
});

/** A `.sb-fm-row` located by its exact `.sb-fm-key` text — `:text-is()` (not
 * substring `text=`) so a key like "date" can't accidentally match "date"
 * inside a longer, unrelated key elsewhere in the panel. Only meaningful in
 * READ-ONLY mode (front_matter_panel.tsx's `FrontMatterReadOnlyList`) —
 * editable mode has no rows at all, just one raw-YAML textarea
 * (`fmYamlTextarea` below). */
function fmRow(page: Page, key: string) {
  return page.locator(`.sb-fm-row:has(.sb-fm-key:text-is("${key}"))`);
}

/** The editable card's single whole-block raw-YAML textarea
 * (front_matter_panel.tsx's `FrontMatterEditableCard`) — what the panel
 * renders in non-read-only mode (2026-09-22, readonly-gated raw-YAML-card
 * task, superseding the earlier per-field structured editor this spec used
 * to exercise). */
function fmYamlTextarea(page: Page) {
  return page.locator(".sb-fm-panel .sb-fm-yaml-textarea");
}

/** `#sb-page-scroll` (`PAGE_SCROLL_CONTAINER_ID`, client/editor_ui.tsx) is
 * the one real scrolling ancestor now — CodeMirror's own `.cm-scroller` no
 * longer owns scroll (L6's auto-height config). */
function pageScroll(page: Page) {
  return page.locator("#sb-page-scroll");
}

async function scrollTo(page: Page, top: number): Promise<void> {
  await pageScroll(page).evaluate((el, y) => {
    el.scrollTop = y;
  }, top);
}

async function scrollTopOf(page: Page): Promise<number> {
  return pageScroll(page).evaluate((el) => el.scrollTop);
}

/** Waits for the app bar to have settled at the top of the scroll container
 * — the "rests snapped to the app bar" default (decision #3, §11). Polled
 * rather than asserted once because `snapToAppBar` (client/lib/scroll_snap.ts)
 * is async (custom-element upgrade + fonts + a settle rAF pair). */
async function waitSnappedToTop(page: Page): Promise<void> {
  const topBar = page.locator("#sb-top");
  await expect
    .poll(async () => (await topBar.boundingBox())?.y ?? -9999, {
      timeout: 10_000,
    })
    .toBeLessThan(5);
}

/** Reads a page's raw source directly from the server's filesystem API — no
 * waiting, just the current bytes. */
async function readServerFile(
  sbServer: SBServer,
  pagePath: string,
): Promise<string> {
  const resp = await fetch(`${sbServer.url}/.fs/${pagePath}`);
  if (!resp.ok) {
    throw new Error(`Failed to read ${pagePath} from server: ${resp.status}`);
  }
  return resp.text();
}

/** Polls the server's copy of a page until it contains `expectedSubstring`,
 * then returns the full text at that point — used instead of fixtures.ts's
 * `waitForSaveAndReadFromServer` (which keys off the `.sb-unsaved`/
 * `.sb-saved` class transition) because a sequence of several edits in one
 * test can race that transition, and because polling for the actual
 * expected content is a more direct, deterministic signal of "did this
 * specific edit round-trip to the document" than "did *a* save happen." */
async function waitForServerContent(
  sbServer: SBServer,
  pagePath: string,
  expectedSubstring: string,
): Promise<string> {
  await expect
    .poll(() => readServerFile(sbServer, pagePath), { timeout: 10_000 })
    .toContain(expectedSubstring);
  return readServerFile(sbServer, pagePath);
}

test("large app bar renders breadcrumb + headline + subtitle, rests snapped to the top, and pull-reveals the front-matter panel", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "RevealPage");
  await waitSnappedToTop(page);

  // Item 1: breadcrumb with asterisk-home first item, page-name headline,
  // "Edited ... · N min read" subtitle.
  const homeItem = page.locator(
    'm3e-app-bar m3e-breadcrumb[slot="leading"] m3e-breadcrumb-item:first-child',
  );
  await expect(homeItem.locator("m3e-icon")).toHaveJSProperty(
    "name",
    "asterisk",
  );
  await expect(page.locator("#sb-current-page textarea.sb-input")).toHaveValue(
    "RevealPage",
  );
  await expect(page.locator('m3e-app-bar [slot="subtitle"]')).toContainText(
    "min read",
  );

  // Item 5: default rest state — front matter sits off-screen above the
  // viewport (still in the DOM, not display:none — just scrolled past).
  const fmPanel = page.locator(".sb-fm-panel");
  const restBox = await fmPanel.boundingBox();
  expect(restBox).not.toBeNull();
  expect(restBox!.y).toBeLessThan(0);

  // Item 3 (part 1): raw YAML must not appear as text in the editor body —
  // frontmatter is fully hidden (L3), the property list is its only
  // rendering.
  const editorText = await page.locator("#sb-editor .cm-content").innerText();
  expect(editorText).not.toContain("tags:");
  expect(editorText).not.toContain("date:");

  // Item 5: pulling up (scrolling towards 0) reveals the front matter.
  await scrollTo(page, 0);
  await expect
    .poll(async () => (await fmPanel.boundingBox())?.y ?? -9999, {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(0);

  // Item 3 (part 2), redesigned 2026-09-22 (readonly-gated raw-YAML-card
  // task): the revealed panel, NOT read-only, shows the whole-block raw
  // YAML in one textarea — the right key/value text must still be in there.
  const yamlTextarea = fmYamlTextarea(page);
  await expect(yamlTextarea).toBeVisible();
  await expect(yamlTextarea).toHaveValue(/tags: \[demo, sample\]/);
  await expect(yamlTextarea).toHaveValue(/date: 2026-01-01/);

  // Item 2: every trailing control present + functional.
  const appBar = page.locator("m3e-app-bar");
  const readOnlyButton = appBar.locator(
    'm3e-icon-button[title="Enable read-only"], m3e-icon-button[title="Disable read-only"]',
  );
  const kebab = appBar.locator('m3e-icon-button[title="More actions"]');
  await expect(readOnlyButton).toHaveCount(1);
  await expect(kebab).toHaveCount(1);

  // Read-only toggle actually toggles read-only (not just the icon/title —
  // the real CodeMirror `EditorState.readOnly` facet, per
  // client/codemirror/editor_state.ts) AND, per Jack's direct ask, flips
  // the front-matter panel from the editable raw-YAML textarea over to the
  // non-interactive row list.
  expect(
    await page.evaluate(() =>
      (globalThis as any).client.editorView.state.readOnly
    ),
  ).toBe(false);
  await readOnlyButton.click();
  await expect(readOnlyButton).toHaveAttribute("title", "Disable read-only");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (globalThis as any).client.editorView.state.readOnly
      )
    )
    .toBe(true);

  await expect(fmYamlTextarea(page)).toHaveCount(0);
  await expect(fmRow(page, "tags").locator(".sb-fm-value")).toHaveText(
    "[demo, sample]",
  );
  await expect(fmRow(page, "date").locator(".sb-fm-value")).toHaveText(
    "2026-01-01",
  );

  await readOnlyButton.click(); // restore, for hygiene
  await expect(readOnlyButton).toHaveAttribute("title", "Enable read-only");

  // Back to the editable card once read-only is off again.
  await expect(fmYamlTextarea(page)).toBeVisible();
  await expect(page.locator(".sb-fm-row")).toHaveCount(0);

  // Kebab opens its menu.
  const menu = page.locator("#sb-app-bar-menu");
  await expect(menu.evaluate((el: any) => el.isOpen)).resolves.toBe(false);
  await kebab.click();
  await expect.poll(() => menu.evaluate((el: any) => el.isOpen)).toBe(true);
});

test("a page with no frontmatter renders no front-matter panel at all", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "NoFrontmatterPage");
  await waitSnappedToTop(page);
  await expect(page.locator(".sb-fm-panel")).toHaveCount(0);
});

/** Front matter is folded/hidden until the panel + CM sync extension have
 * both settled after a fresh navigation — waiting for the editable card's
 * textarea to actually be present avoids racing that. */
async function waitEditorReadyAndPanel(page: Page): Promise<void> {
  await waitForEditorReady(page);
  await expect(fmYamlTextarea(page)).toBeVisible({ timeout: 10_000 });
}

// 2026-09-22 (readonly-gated raw-YAML-card task, direct from Jack —
// supersedes the earlier per-field "inline edit writeback"/"block-style
// inline editing" tests this spec used to run, which exercised the
// structured scalar/flow/block-sequence/block-mapping/block-scalar editors
// that front_matter_panel.tsx no longer has). Editable mode is now one
// whole-block raw-YAML textarea — there's only one commit path (blur) and
// one span (the whole block), so the old per-field misattribution and
// Enter-then-blur double-commit races this used to specifically guard
// against aren't reachable code paths here anymore by construction.
test("whole-block raw-YAML edit commits every shape (scalar/flow/block-sequence/block-mapping/block-scalar) at once, leaving the rest of the doc untouched", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "BlockShapesPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);

  const textarea = fmYamlTextarea(page);
  await expect(textarea).toHaveValue(/tags:\n\s*- journal\n\s*- retro/);
  await expect(textarea).toHaveValue(/notes: \|\n\s*line one\n\s*line two/);
  await expect(textarea).toHaveValue(/author: Jack/);

  await textarea.click();
  await textarea.fill(
    [
      "tags:",
      "  - journal-edited",
      "  - added-item",
      "notes: |",
      "  line one",
      "  line two",
      "  line three",
      "author: Jack",
      "status: published",
    ].join("\n"),
  );
  await textarea.blur();

  const content = await waitForServerContent(
    sbServer,
    "BlockShapesPage.md",
    "line three",
  );
  expect(content).toMatch(/tags:\n\s*-\s*journal-edited\n\s*-\s*added-item/);
  expect(content).not.toContain("retro");
  expect(content).toMatch(/notes: \|\n\s*line one\n\s*line two\n\s*line three/);
  expect(content).toContain("author: Jack");
  expect(content).toContain("status: published");
  expect(content).toContain("Some body content."); // body untouched

  // Reload and confirm the edit persisted.
  await gotoSilverBulletPage(page, sbServer, "BlockShapesPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);
  await expect(fmYamlTextarea(page)).toHaveValue(/journal-edited/);
  await expect(fmYamlTextarea(page)).toHaveValue(/line three/);
});

test("invalid YAML on blur is rejected — doc unchanged, error toast shown", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "StatusPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);

  const beforeInvalid = await readServerFile(sbServer, "StatusPage.md");
  const textarea = fmYamlTextarea(page);
  await textarea.click();
  await textarea.fill("status: [unterminated"); // invalid YAML
  await page.locator("#sb-editor .cm-content").click(); // blur elsewhere

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 10_000 });
  await expect(snackbar).toContainText(
    "Couldn't save front matter — invalid YAML",
  );

  // Give any (incorrect) writeback a moment to land, then confirm nothing
  // changed.
  await page.waitForTimeout(500);
  const afterInvalid = await readServerFile(sbServer, "StatusPage.md");
  expect(afterInvalid).toBe(beforeInvalid);
});

test("navigating to a second page also rests snapped to the app bar (decision #3 fires on every navigation)", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "NavPageA");
  await waitSnappedToTop(page);

  const editor = page.locator("#sb-editor .cm-content");
  const wikiLink = editor.locator(".sb-wiki-link", { hasText: "NavPageB" });
  await expect(wikiLink).toBeVisible({ timeout: 10_000 });
  await wikiLink.click();

  await expect(page.locator("#sb-current-page textarea.sb-input")).toHaveValue(
    "NavPageB",
  );
  await waitForEditorReady(page);
  await waitSnappedToTop(page);
});

test("[critical regression gate, §5.B risk 8] a deep scroll position on page A survives navigating to page B and back — it is restored, not resnapped", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "NavPageA");
  await waitSnappedToTop(page);

  // Scroll deep into A's body, well past the app bar.
  const DEEP_SCROLL = 3000;
  await scrollTo(page, DEEP_SCROLL);
  await expect
    .poll(() => scrollTopOf(page))
    .toBeGreaterThan(DEEP_SCROLL - 50);

  // Navigate via `client.navigate` rather than clicking the in-body wiki
  // link: the link sits at the very top of the document, and CM6's own
  // viewport virtualization (relied on by this plan's L6 auto-height config,
  // §5.B risk 9) can unmount off-screen content once scrolled this deep,
  // making the link itself unreachable by a real click. `client.navigate` is
  // the same navigation path a click ultimately drives (content_manager.ts),
  // so this doesn't skip any of the mechanism under test.
  await page.evaluate(() =>
    (globalThis as any).client.navigate({ path: "NavPageB.md" })
  );
  await expect(page.locator("#sb-current-page textarea.sb-input")).toHaveValue(
    "NavPageB",
  );
  await waitForEditorReady(page);

  await page.goBack();
  await expect(page.locator("#sb-current-page textarea.sb-input")).toHaveValue(
    "NavPageA",
  );
  await waitForEditorReady(page);

  // The critical assertion: A's app bar must NOT be at the top of the
  // viewport (that would mean branch-3's re-snap clobbered branch-2's
  // cached-scroll restore — §5.B risk 8, the single most important new check
  // in this leaf). Scrolled deep, `#sb-top` sits far ABOVE the viewport, so
  // its bounding-box `y` is strongly negative — not the ~0 a fresh snap
  // would produce — and the restored scrollTop must be close to where it
  // was left.
  const topBar = page.locator("#sb-top");
  const restoredTop = (await topBar.boundingBox())!.y;
  expect(restoredTop).toBeLessThan(-100);

  const restoredScrollTop = await scrollTopOf(page);
  expect(restoredScrollTop).toBeGreaterThan(DEEP_SCROLL - 500);
});
