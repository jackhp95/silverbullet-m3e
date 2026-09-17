import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, gotoSilverBulletPage, test } from "./fixtures.ts";

// Exercises client/editor_ui.tsx's `writeCaptureItemPage` (wired to
// item_capture_sheet.tsx's onSubmit) end to end: was a plain line appended
// to one shared hardcoded page (`Tasks`/`Events`/`Contacts`/`Ideas`, no
// frontmatter); now each captured item gets its own page under
// `captures/<type>/`, individually addressable, with a real `tags:`
// frontmatter field.
test.describe("item capture sheet writes real per-item pages", () => {
  test.use({
    spaceFiles: {
      "index.md": "# Welcome",
    },
  });

  test("capturing a task writes its own page with tags: task and a real checkbox line", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "index");

    await sbPage.locator('[aria-label="New…"]').click();
    // Scoped by id, not just the bare tag: search_sheet.tsx's consolidated
    // search sheet is now also an always-mounted `m3e-bottom-sheet`
    // sibling, so an untargeted tag locator would be ambiguous (strict-mode
    // violation) — see that file's own `#sb-search-sheet` id.
    const sheet = sbPage.locator("#sb-item-capture-sheet");
    await expect(sheet).toBeVisible();

    // "task" is item_capture_sheet.tsx's DEFAULT_TYPE, so no segment click
    // is needed here (covered implicitly).
    await sbPage.locator("#sb-item-capture-field").fill("Buy stamps e2e");
    await sbPage.getByText("Add task", { exact: true }).click();

    await expect(sheet).not.toBeVisible();

    // The page name is `captures/task/<slug>-<timestamp>` — generated, so
    // discover it on disk (spaceDir is the server's real backing store)
    // rather than assuming an exact name, then re-read it through the
    // actual `/.fs` HTTP API to verify the persisted artifact, not just
    // in-memory client state.
    const taskDir = join(sbServer.spaceDir, "captures", "task");
    let files: string[] = [];
    await expect(async () => {
      files = await readdir(taskDir);
      expect(files.length).toBe(1);
    }).toPass({ timeout: 10_000 });

    expect(files[0]).toMatch(/^buy-stamps-e2e-[a-z0-9]+\.md$/);

    const resp = await fetch(
      `${sbServer.url}/.fs/captures/task/${files[0]}`,
    );
    expect(resp.ok).toBe(true);
    const content = await resp.text();
    expect(content).toMatch(/^---\ntags: task\ncaptured: /);
    expect(content).toContain("* [ ] Buy stamps e2e");

    // Sanity: the disk read and the HTTP read agree.
    const diskContent = await readFile(join(taskDir, files[0]), "utf-8");
    expect(diskContent).toBe(content);
  });

  test("capturing a contact writes tags: person, not a fork-invented contact tag", async ({
    sbPage,
    sbServer,
  }) => {
    await gotoSilverBulletPage(sbPage, sbServer, "index");

    await sbPage.locator('[aria-label="New…"]').click();
    const sheet = sbPage.locator("#sb-item-capture-sheet");
    await expect(sheet).toBeVisible();

    // `m3e-button-segment`'s `value` prop is set by Preact as a real DOM
    // property, never reflected as an HTML attribute (same gotcha this
    // file's own `handle` comment flags for m3e-bottom-sheet) — an
    // attribute selector like `[value="contact"]` can never match. The
    // segmented button exposes real `radiogroup`/`radio` ARIA semantics
    // instead (confirmed via Playwright's own accessibility snapshot), so
    // query by role.
    await sbPage.getByRole("radio", { name: "Contact" }).click();
    // Wait for the segment switch to actually flip Preact's `type` state
    // (contentLabel becomes "Contact") before typing, rather than racing
    // the click's onInput -> setType -> re-render.
    await expect(sbPage.locator('label[for="sb-item-capture-field"]'))
      .toHaveText("Contact");
    await sbPage.locator("#sb-item-capture-field").fill("Jane Doe e2e");
    await sbPage.getByText("Add contact", { exact: true }).click();

    await expect(sheet).not.toBeVisible();

    const contactDir = join(sbServer.spaceDir, "captures", "contact");
    let files: string[] = [];
    await expect(async () => {
      files = await readdir(contactDir);
      expect(files.length).toBe(1);
    }).toPass({ timeout: 10_000 });

    const resp = await fetch(
      `${sbServer.url}/.fs/captures/contact/${files[0]}`,
    );
    expect(resp.ok).toBe(true);
    const content = await resp.text();
    // docs/Guide/People Notes.md + e2e/guide-people-notes.test.ts already
    // establish `tags: person` as this fork's real convention for a
    // contact page (queried as `tags.person`) — captured contacts join
    // that same taxonomy instead of a parallel, unqueried `contact` tag.
    expect(content).toMatch(/^---\ntags: person\ncaptured: /);
    expect(content).toContain("Jane Doe e2e");
  });
});
