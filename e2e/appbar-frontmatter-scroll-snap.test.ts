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
 * inside a longer, unrelated key elsewhere in the panel. */
function fmRow(page: Page, key: string) {
  return page.locator(`.sb-fm-row:has(.sb-fm-key:text-is("${key}"))`);
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

/** The inverse of `waitForServerContent` — polls until a substring that was
 * present has been removed (e.g. a deleted list item). */
async function waitForServerContentGone(
  sbServer: SBServer,
  pagePath: string,
  goneSubstring: string,
): Promise<string> {
  await expect
    .poll(() => readServerFile(sbServer, pagePath), { timeout: 10_000 })
    .not.toContain(goneSubstring);
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
  await expect(page.locator("#sb-current-page input.sb-input")).toHaveValue(
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

  // Item 3 (part 2): the revealed panel shows a real property list with the
  // right key/value text.
  await expect(fmRow(page, "tags").locator(".sb-fm-value")).toHaveText(
    "[demo, sample]",
  );
  await expect(fmRow(page, "date").locator(".sb-fm-value")).toHaveText(
    "2026-01-01",
  );

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
  // client/codemirror/editor_state.ts).
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
  await readOnlyButton.click(); // restore, for hygiene
  await expect(readOnlyButton).toHaveAttribute("title", "Enable read-only");

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

test("inline edit writeback: scalar + flow values commit, Enter-then-blur commits exactly once, invalid YAML is rejected leaving the doc unchanged", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "StatusPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);

  // --- Scalar edit (status): commit via Enter, then let the browser's own
  // automatic blur (fired when the input unmounts post-commit — the exact
  // race fixed in commit 26774192) fire too. Must commit exactly once, not
  // duplicate.
  const statusValue = fmRow(page, "status").locator(".sb-fm-value");
  await statusValue.click();
  const statusInput = fmRow(page, "status").locator(
    "input.sb-fm-value-input",
  );
  await statusInput.fill("published");
  await statusInput.press("Enter");
  // A follow-up click elsewhere is a real, additional blur-target change —
  // exercising the same "commit already happened, a later blur must be a
  // no-op" path the fix guards, on top of the automatic unmount-blur.
  await page.locator("#sb-editor .cm-content").click();

  let content = await waitForServerContent(
    sbServer,
    "StatusPage.md",
    "status: published",
  );
  expect(content).not.toContain("publishedpublished");
  expect(content).not.toContain("published published");
  // Exactly one occurrence of the committed value.
  expect(content.match(/published/g)?.length).toBe(1);

  // --- Flow edit (tags): re-derive the row after the status commit
  // re-rendered the panel.
  const tagsValue = fmRow(page, "tags").locator(".sb-fm-value");
  await tagsValue.click();
  const tagsInput = fmRow(page, "tags").locator("input.sb-fm-value-input");
  await tagsInput.fill("[journal, verified]");
  await tagsInput.press("Enter");
  await page.locator("#sb-editor .cm-content").click();

  content = await waitForServerContent(
    sbServer,
    "StatusPage.md",
    "tags: [journal, verified]",
  );
  expect(content).not.toContain("tags: [journal, retro]");

  // --- Invalid-YAML edit rejected, doc unchanged. The scalar/flow writeback
  // path (`serializeYamlValue`) safely re-quotes any string a user types, so
  // it can't actually be driven into producing broken YAML from those
  // controls — the block-mapping textarea (`owner`) is the one control that
  // validates the user's RAW text directly (`YAML.load`, before any
  // safe-dumping), so it's the genuine way to reproduce a rejected edit.
  const beforeInvalid = content;
  const ownerTextarea = fmRow(page, "owner").locator(
    "textarea.sb-fm-block-mapping-textarea",
  );
  await ownerTextarea.click();
  await ownerTextarea.fill("name: [Jack"); // unbalanced flow bracket -> invalid YAML
  await page.locator("#sb-editor .cm-content").click();

  const snackbar = page.locator("m3e-snackbar");
  await snackbar.waitFor({ state: "attached", timeout: 10_000 });
  await expect(snackbar).toContainText('Couldn\'t save "owner" — invalid YAML');

  // Give any (incorrect) writeback a moment to land, then confirm nothing
  // changed.
  await page.waitForTimeout(500);
  const afterInvalid = await readServerFile(sbServer, "StatusPage.md");
  expect(afterInvalid).toBe(beforeInvalid);
  expect(afterInvalid).toContain("name: Jack");
  expect(afterInvalid).toContain("email: j@x.com");

  // Reload (full navigation) and confirm the two valid writes persisted.
  await gotoSilverBulletPage(page, sbServer, "StatusPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);
  await expect(fmRow(page, "status").locator(".sb-fm-value")).toHaveText(
    "published",
  );
  await expect(fmRow(page, "tags").locator(".sb-fm-value")).toHaveText(
    "[journal, verified]",
  );
});

/** Front matter is folded/hidden until the panel + CM sync extension have
 * both settled after a fresh navigation — waiting for the panel's rows to
 * actually be present avoids racing that. */
async function waitEditorReadyAndPanel(page: Page): Promise<void> {
  await waitForEditorReady(page);
  await expect(page.locator(".sb-fm-panel .sb-fm-row").first()).toBeVisible({
    timeout: 10_000,
  });
}

test("block-style inline editing: a block-sequence field (tags) and a literal block-scalar field (notes) both write back correctly, leaving sibling keys untouched", async ({
  sbServer,
  page,
}) => {
  await gotoSilverBulletPage(page, sbServer, "BlockShapesPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);

  // --- Block sequence (tags): edit item 0, add a new item, remove item 1
  // (the original "retro"), in that order.
  const tagsRow = fmRow(page, "tags");
  const seqInputs = tagsRow.locator("input.sb-fm-seq-item-input");
  await expect(seqInputs).toHaveCount(2);
  await seqInputs.nth(0).fill("journal-edited");
  await seqInputs.nth(0).blur();
  // Let the edit land before the next one.
  await waitForServerContent(sbServer, "BlockShapesPage.md", "journal-edited");

  await tagsRow.locator(".sb-fm-seq-add").click(); // adds a trailing empty item
  await expect(tagsRow.locator("input.sb-fm-seq-item-input")).toHaveCount(3);
  await tagsRow.locator("input.sb-fm-seq-item-input").nth(2).fill(
    "added-item",
  );
  await tagsRow.locator("input.sb-fm-seq-item-input").nth(2).blur();
  await waitForServerContent(sbServer, "BlockShapesPage.md", "added-item");

  // Remove the original second item ("retro").
  await tagsRow.locator('m3e-icon-button[title="Remove retro"]').click();

  const seqContent = await waitForServerContentGone(
    sbServer,
    "BlockShapesPage.md",
    "retro",
  );
  expect(seqContent).toMatch(
    /tags:\n\s*-\s*journal-edited\n\s*-\s*added-item\n/,
  );
  expect(seqContent).not.toContain("retro");
  // Sibling key untouched.
  expect(seqContent).toContain("author: Jack");

  // --- Literal block scalar (notes): textarea shows DECODED lines, not the
  // raw `|`-fenced source.
  const notesRow = fmRow(page, "notes");
  const notesTextarea = notesRow.locator("textarea.sb-fm-block-scalar-textarea");
  // js-yaml's literal (`|`, clip-chomping) style keeps a single trailing
  // newline on the parsed string — tolerate its presence or absence rather
  // than asserting an exact byte count that depends on js-yaml's own
  // chomping default.
  await expect(notesTextarea).toHaveValue(/^line one\nline two\n?$/);

  await notesTextarea.fill("line one\nline two\nline three");
  await notesTextarea.blur();

  const scalarContent = await waitForServerContent(
    sbServer,
    "BlockShapesPage.md",
    "line three",
  );
  // Literal style preserved (`|`, never folded `>`) — per §4/L4.3's stated
  // round-trip-fidelity rule, the chomping indicator suffix (bare `|` vs
  // `|-`/`|+`) is NOT guaranteed identical to the original (js-yaml infers
  // it from the edited value's own trailing-whitespace content), only the
  // literal-vs-folded style itself is.
  expect(scalarContent).toMatch(
    /notes: \|[+-]?\n\s*line one\n\s*line two\n\s*line three\n/,
  );
  expect(scalarContent).not.toMatch(/notes: >/);
  // Every other key still present and unchanged.
  expect(scalarContent).toContain("author: Jack");
  expect(scalarContent).toMatch(
    /tags:\n\s*-\s*journal-edited\n\s*-\s*added-item\n/,
  );

  // Reload and confirm both edits persisted in the panel.
  await gotoSilverBulletPage(page, sbServer, "BlockShapesPage");
  await scrollTo(page, 0);
  await waitEditorReadyAndPanel(page);
  await expect(
    fmRow(page, "tags").locator("input.sb-fm-seq-item-input"),
  ).toHaveCount(2);
  await expect(
    fmRow(page, "notes").locator("textarea.sb-fm-block-scalar-textarea"),
  ).toHaveValue(/^line one\nline two\nline three\n?$/);
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

  await expect(page.locator("#sb-current-page input.sb-input")).toHaveValue(
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
  await expect(page.locator("#sb-current-page input.sb-input")).toHaveValue(
    "NavPageB",
  );
  await waitForEditorReady(page);

  await page.goBack();
  await expect(page.locator("#sb-current-page input.sb-input")).toHaveValue(
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
