/*
 * Visual A/B harness for CSS→Tailwind conversions.
 *
 * NOT a Playwright test — it asserts nothing on its own. It drives every
 * surface the Tailwind migration can plausibly affect and writes one PNG per
 * surface per theme, so two builds can be pixel-diffed against each other.
 * This is the verification tool for Phase 2 (the mechanical
 * `client/styles/*.scss` → utility-class conversion); Phase 1 used it to
 * prove the infra landed with zero visual change.
 *
 *   node e2e/tailwind-visual-ab.mjs <baseURL> <outDir>
 *
 * HOW TO GET A TRUSTWORTHY DIFF
 * -----------------------------
 * Compare two client bundles through the SAME server process, not two
 * servers. `rust-embed` has no `debug-embed` feature here (see
 * bin/silverbullet/src/embed.rs and Cargo.toml), so a debug binary reads
 * client_bundle/ from disk on every request. That means you can swap the
 * bundle under a running server and just re-request:
 *
 *   # capture the converted build
 *   cp -R client_bundle/client /tmp/bundle-after
 *   node e2e/tailwind-visual-ab.mjs http://127.0.0.1:PORT/ /tmp/ab-after
 *
 *   # build the baseline in a detached worktree, swap it in, capture
 *   git worktree add --detach /tmp/base <baseline-ref>
 *   ( cd /tmp/base && npm run build:client )
 *   rm -rf client_bundle/client && cp -R /tmp/base/client_bundle/client client_bundle/client
 *   node e2e/tailwind-visual-ab.mjs http://127.0.0.1:PORT/ /tmp/ab-before
 *
 *   # restore, then diff (ImageMagick)
 *   rm -rf client_bundle/client && cp -R /tmp/bundle-after client_bundle/client
 *   for f in /tmp/ab-before/*.png; do
 *     compare -metric AE "$f" "/tmp/ab-after/$(basename $f)" /dev/null
 *   done
 *
 * Diffing two *different* servers instead will produce false positives: the
 * version strings differ (so one build raises the "new client available"
 * snackbar) and their space indexes settle in different orders (so search
 * results rank differently). Both were observed while building this.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const [, , baseURL, outDir] = process.argv;
if (!baseURL || !outDir) {
  console.error("usage: node e2e/tailwind-visual-ab.mjs <baseURL> <outDir>");
  process.exit(2);
}
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const shots = [];
const failures = [];

/*
 * Hide the transient "a new version of the client is available" snackbar —
 * a service-worker version notice, not part of any surface under test, and
 * it fires depending on what the browser profile has cached.
 */
async function muteSnackbars(page) {
  await page
    .addStyleTag({
      content: "m3e-snackbar, .sb-snackbar { display: none !important; }",
    })
    .catch(() => {});
}

async function shoot(page, name) {
  await muteSnackbars(page);
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  shots.push(name);
  console.log("  captured", name);
}

function note(label, e) {
  const msg = e.message.split("\n")[0];
  failures.push(`${label}: ${msg}`);
  console.log(`  !! ${label}: ${msg}`);
}

/** The app stores its theme in localStorage as `darkMode`. */
async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("darkMode", t === "dark" ? "true" : "false");
  }, theme);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cm-content", { timeout: 30_000 });
  await page.waitForTimeout(900);
}

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
  });
  const page = await ctx.newPage();

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cm-content", { timeout: 30_000 });
  await setTheme(page, theme);

  // 1. Editor + top app bar, at rest.
  await shoot(page, `${theme}-01-editor`);

  // 2. Kebab menu (app bar trailing slot) — selector from
  //    e2e/app-bar-leading-trailing.test.ts.
  try {
    await page
      .locator('m3e-app-bar m3e-icon-button[title="More actions"]')
      .click({ timeout: 8000 });
    await page.waitForSelector("#sb-app-bar-menu", { timeout: 8000 });
    await page.waitForTimeout(600);
    await shoot(page, `${theme}-02-kebab-menu`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch (e) {
    note("kebab", e);
  }

  // 3. Search sheet, then its mode picker — selectors from
  //    e2e/search-sheet.test.ts. Note the sheet opens from the floating
  //    toolbar; Mod+K is the *page picker*, a different surface.
  try {
    await page
      .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Search"]')
      .click({ timeout: 8000 });
    await page.waitForSelector("#sb-search-sheet[open]", { timeout: 10_000 });
    await page.waitForTimeout(800);
    await shoot(page, `${theme}-03-search-sheet`);

    await page
      .locator('#sb-search-sheet m3e-icon-button[title="Change search mode"]')
      .click({ timeout: 8000 });
    await page.waitForSelector("#sb-search-sheet-mode-list", { timeout: 8000 });
    await page.waitForTimeout(600);
    await shoot(page, `${theme}-04-search-mode-picker`);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch (e) {
    note("search", e);
  }

  // 4. Navigation sheet — trigger from e2e/navigation-sheet.test.ts.
  try {
    await page
      .locator('.sb-floating-toolbar m3e-icon-button[aria-label="Navigation"]')
      .click({ timeout: 8000 });
    await page.waitForSelector("#sb-navigation-sheet[open]", {
      timeout: 10_000,
    });
    await page.waitForTimeout(800);
    await shoot(page, `${theme}-05-navigation-sheet`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch (e) {
    note("nav sheet", e);
  }

  // 5. Breadcrumb collapse. The app shell has overflow:hidden on html/body,
  //    so the real scroller is .cm-scroller (this is exactly why top.scss
  //    collapses the breadcrumb with a grid track instead of position:sticky).
  try {
    await page.locator(".cm-scroller").evaluate((el) => el.scrollTo(0, 400));
    await shoot(page, `${theme}-06-breadcrumb-collapsed`);
    await page.locator(".cm-scroller").evaluate((el) => el.scrollTo(0, 0));
    await page.waitForTimeout(400);
  } catch (e) {
    note("breadcrumb", e);
  }

  // 6. The two dialogs whose actions row the Phase 1 proof-of-concept
  //    converted. Driven through the real command palette, the same path
  //    e2e/basic-modals.test.ts uses: "Page: Copy" -> editor.prompt() ->
  //    <Prompt>; "Page: Delete" -> editor.confirm({destructive}) ->
  //    <Confirm>. Both are dismissed with Escape, so nothing is copied or
  //    deleted — Confirm() does no work until its Ok action is clicked.
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  for (const [name, command] of [
    ["07-prompt-dialog", "Page: Copy"],
    ["08-confirm-dialog", "Page: Delete"],
  ]) {
    try {
      // Reload between the two: dismissing an m3e-dialog leaves focus state
      // that stops the next Mod+/ from opening the palette.
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector(".cm-content", { timeout: 30_000 });
      await page.waitForTimeout(900);
      await page.locator(".cm-content").click();
      await page.keyboard.press(`${mod}+/`);
      await page
        .locator(".sb-modal-box input.sb-input")
        .click({ timeout: 8000 });
      await page.keyboard.type(command, { delay: 25 });
      await page.keyboard.press("Enter");
      await page.waitForSelector("m3e-dialog[open]", { timeout: 10_000 });
      await page.waitForTimeout(700);
      await shoot(page, `${theme}-${name}`);

      // Computed layout of the converted actions row. A screenshot proves
      // it looks the same; this proves *why*, and survives a theme change.
      const box = await page.evaluate(() => {
        const row = document.querySelector('m3e-dialog[open] [slot="actions"]');
        if (!row) return null;
        const cs = getComputedStyle(row);
        const r = row.getBoundingClientRect();
        return {
          cls: row.getAttribute("class"),
          display: cs.display,
          justifyContent: cs.justifyContent,
          gap: cs.gap,
          box: {
            x: Math.round(r.x),
            w: Math.round(r.width),
            h: Math.round(r.height),
          },
          kids: [...row.children].map((k) => {
            const kr = k.getBoundingClientRect();
            return { x: Math.round(kr.x), w: Math.round(kr.width) };
          }),
        };
      });
      console.log(`  MEASURED ${theme}-${name}: ${JSON.stringify(box)}`);

      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    } catch (e) {
      note(name, e);
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  await ctx.close();
}

await browser.close();
console.log(`\n${shots.length} screenshots → ${outDir}`);
if (failures.length) {
  console.log(`${failures.length} surface(s) failed to capture:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
