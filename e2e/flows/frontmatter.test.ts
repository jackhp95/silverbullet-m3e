// CS-8: frontmatter raw-YAML card (client/components/front_matter_panel.tsx,
// mounted per D7 as a CodeMirror block widget by
// client/codemirror/top_bottom_panels.ts). docs/plans/2026-09-24-core-shell-
// decomposition.md, CS-8 row's acceptance test.
import {
  expect,
  gotoSilverBulletPage,
  test,
  waitForPersistedContent,
} from "../fixtures/core.ts";

const FM_DOC = "---\ntags: demo\nstatus: draft\n---\nBody\n";

test.describe("editable mode — raw-YAML card", () => {
  test.use({ spaceFiles: { "FM.md": FM_DOC } });

  test("shows current frontmatter, persists a valid edit, rejects invalid YAML", async ({
    page,
    sbServer,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "FM");

    const textarea = page.locator(".sb-fm-panel textarea.sb-fm-yaml-textarea");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(/status: draft/);

    // A valid edit, committed on blur, persists to the file.
    await textarea.fill("tags: demo\nstatus: done");
    await page.locator("#sb-editor .cm-content").click();
    await waitForPersistedContent(sbServer, "FM.md", /status: done/);

    // Invalid YAML on blur is rejected: notification fires, file unchanged.
    await textarea.fill("a: [");
    await page.locator("#sb-editor .cm-content").click();
    const errorNotification = page.locator(".sb-notification-error");
    await expect(errorNotification).toContainText("invalid YAML");
    await waitForPersistedContent(sbServer, "FM.md", /status: done/);
  });
});

test.describe("frontMatterSyncExtension — CodeMirror edits sync into the card", () => {
  test.use({ spaceFiles: { "FM.md": FM_DOC } });

  test("body-only edits leave the card alone; editing the YAML in CM updates it", async ({
    page,
    sbServer,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "FM");

    const textarea = page.locator(".sb-fm-panel textarea.sb-fm-yaml-textarea");
    await expect(textarea).toHaveValue(/status: draft/);

    // Body-only edit does not intersect the frontmatter block.
    const bodyLine = page.locator("#sb-editor .cm-line", { hasText: "Body" });
    await bodyLine.click();
    await page.keyboard.press("End");
    await page.keyboard.type("x");
    await expect(textarea).toHaveValue(/status: draft/);

    // Editing the YAML line in CM (not the card) flows through
    // frontMatterSyncExtension into the card.
    await page
      .locator("#sb-editor .cm-line", { hasText: "status: draft" })
      .click();
    await page.keyboard.press("End");
    for (let i = 0; i < "draft".length; i++) {
      await page.keyboard.press("Backspace");
    }
    await page.keyboard.type("final");
    await expect(textarea).toHaveValue(/status: final/);
  });
});

test.describe("card widget geometry — clicks below the card", () => {
  test.use({
    spaceFiles: {
      "FM.md":
        "---\ntags: demo\nstatus: draft\n---\nLine one\nLine two\nLine three\n",
    },
  });

  // CodeMirror maps clicks to positions from its own height map; if the
  // widget's measured box excludes the card's margins, every line below it
  // resolves too low.
  const lineAtCursor = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const view = (window as any).client.editorView;
      return view.state.doc.lineAt(view.state.selection.main.head).text;
    });

  const clickLine = async (
    page: import("@playwright/test").Page,
    text: string,
  ) => {
    const box = (await page
      .locator("#sb-editor .cm-line", { hasText: text })
      .first()
      .boundingBox())!;
    await page.mouse.click(box.x + 10, box.y + box.height / 2);
  };

  test("clicks land on the line under the pointer, before and after the card grows", async ({
    page,
    sbServer,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "FM");
    const textarea = page.locator(".sb-fm-panel textarea.sb-fm-yaml-textarea");
    await expect(textarea).toBeVisible();

    for (const text of ["status: draft", "Line one", "Line three"]) {
      await clickLine(page, text);
      await expect.poll(() => lineAtCursor(page)).toBe(text);
    }

    // Grow the card by three rows, commit on blur, re-check.
    await textarea.fill("tags: demo\nstatus: draft\na: 1\nb: 2\nc: 3");
    await clickLine(page, "Line two");
    await waitForPersistedContent(sbServer, "FM.md", /c: 3/);
    for (const text of ["b: 2", "Line one", "Line three"]) {
      await clickLine(page, text);
      await expect.poll(() => lineAtCursor(page)).toBe(text);
    }
  });
});

test.describe("read-only mode — non-interactive row list", () => {
  test.use({
    spaceFiles: { "FM.md": FM_DOC },
    serverEnv: { SB_READ_ONLY: "1" },
  });

  test("shows one row per key, no editable textarea", async ({
    page,
    sbServer,
  }) => {
    await gotoSilverBulletPage(page, sbServer, "FM");

    await expect(page.locator(".sb-fm-row")).toHaveCount(2);
    await expect(page.locator(".sb-fm-yaml-textarea")).toHaveCount(0);
  });
});

test.describe("no frontmatter — no panel", () => {
  test.use({
    spaceFiles: { "Plain.md": "# Just a page\n\nNo frontmatter here.\n" },
  });

  test("renders no frontmatter panel at all", async ({ page, sbServer }) => {
    await gotoSilverBulletPage(page, sbServer, "Plain");

    await expect(page.locator(".sb-fm-panel")).toHaveCount(0);
  });
});
