// Chrome audit harness: boots a hermetic debug server over a populated space
// (SilverBullet's own docs/) and shoots the app chrome at both reference
// viewports -- home, a long page, the page picker (search modal) and the
// command palette -- plus the computed-style / geometry / axe measurements
// the APPS-2 findings are stated in.
//
//   OUT_DIR=e2e/screenshots/apps2/before npx tsx e2e/tools/shoot-chrome.ts
//
// AXE_PATH points at an axe-core `axe.min.js` (not a repo dependency).
import { chromium } from "@playwright/test";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getFreePort,
  mod,
  spawnServerProcess,
  waitForServer,
} from "../fixtures/core.ts";

const OUT_DIR = process.env.OUT_DIR ?? "e2e/screenshots/apps2/before";
const AXE_PATH = process.env.AXE_PATH;
const VIEWPORTS = [
  { name: "411", width: 411, height: 761 },
  { name: "1280", width: 1280, height: 720 },
] as const;

const PROBE = () => {
  const cs = (el: Element | null) => (el ? getComputedStyle(el) : null);
  const rect = (el: Element | null) => {
    const r = el?.getBoundingClientRect();
    return r
      ? { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }
      : null;
  };
  const q = (s: string) => document.querySelector(s);
  const link = q(".cm-content .sb-wiki-link, .cm-content a, .sb-wiki-link");
  const fab = q(".sb-floating-toolbar");
  // Only the part of a line the scroller actually shows can be covered.
  const scroller = rect(q(".cm-scroller"));
  const textRects = [...document.querySelectorAll(".cm-line")]
    .map((l) => ({ t: (l.textContent ?? "").trim(), r: rect(l) }))
    .filter(
      (l) => l.t && l.r && scroller && l.r.y < scroller.b && l.r.b > scroller.y,
    )
    .map((l) => ({
      t: l.t,
      r: l.r && scroller && { ...l.r, b: Math.min(l.r.b, scroller.b) },
    }));
  const fr = rect(fab);
  const overlaps = fr
    ? textRects.filter(
        (l) =>
          l.r && l.r.x < fr.r && l.r.r > fr.x && l.r.y < fr.b && l.r.b > fr.y,
      ).length
    : 0;
  return {
    top: { bg: cs(q("#sb-top"))?.backgroundColor, rect: rect(q("#sb-top")) },
    rootBg: cs(q("#sb-root"))?.backgroundColor,
    appBarSurface: cs(q("m3e-app-bar"))?.getPropertyValue(
      "--m3e-app-bar-container-color",
    ),
    surfaceToken: cs(q("m3e-theme"))
      ?.getPropertyValue("--md-sys-color-surface")
      .trim(),
    appBar: {
      bg: cs(q("m3e-app-bar"))?.backgroundColor,
      rect: rect(q("m3e-app-bar")),
    },
    breadcrumbBg: cs(q("m3e-breadcrumb"))?.backgroundColor,
    editorBg: cs(q("#sb-editor .cm-editor"))?.backgroundColor,
    mainBg: cs(q("#sb-main"))?.backgroundColor,
    bodyBg: cs(document.body)?.backgroundColor,
    link: link
      ? {
          color: cs(link)?.color,
          deco: cs(link)?.textDecorationLine,
          text: link.textContent,
        }
      : null,
    primaryToken: cs(q("m3e-theme"))
      ?.getPropertyValue("--md-sys-color-primary")
      .trim(),
    fab: { tag: fab?.localName, rect: fr, textLinesUnder: overlaps },
    firstLineTop: rect(q(".cm-line"))?.y,
    hasMain: !!q("main"),
    hasH1: !!q("h1"),
    viewportMeta: document
      .querySelector("meta[name=viewport]")
      ?.getAttribute("content"),
    m3eTags: [
      ...new Set(
        [...document.querySelectorAll("*")]
          .map((e) => e.localName)
          .filter((n) => n.startsWith("m3e-")),
      ),
    ],
  };
};

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const space = mkdtempSync(join(tmpdir(), "apps2-space-"));
  cpSync("docs", space, { recursive: true });
  const port = await getFreePort();
  const proc = spawnServerProcess(space, port);
  const url = `http://127.0.0.1:${port}`;
  const report: Record<string, unknown> = {};
  try {
    await waitForServer(`${url}/.ping`);
    const browser = await chromium.launch();
    for (const vp of VIEWPORTS) {
      for (const [label, path] of [
        ["home", "index"],
        ["long", "CHANGELOG"],
        ["arch", "Architecture"],
      ] as const) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2,
          // 411 is a phone: coarse pointer, so the app bar uses its real
          // hamburger overflow instead of clipping desktop-style icons.
          ...(vp.width < 600 ? { isMobile: true, hasTouch: true } : {}),
        });
        // tsx wraps arrow fns in a __name helper that page.evaluate lacks.
        await ctx.addInitScript("globalThis.__name = (f) => f;");
        const page = await ctx.newPage();
        await page.goto(`${url}/${encodeURIComponent(path)}?headless=1`);
        await page
          .locator("#sb-editor .cm-editor")
          .waitFor({ state: "visible", timeout: 60_000 });
        await page.waitForFunction(
          () => (globalThis as any).sbRuntime?.ready === true,
          undefined,
          { timeout: 60_000 },
        );
        const key = `${label}-${vp.name}`;
        await page.screenshot({ path: join(OUT_DIR, `${key}.png`) });
        report[key] = await page.evaluate(PROBE);
        if (AXE_PATH) {
          await page.addScriptTag({ path: AXE_PATH });
          report[`${key}-axe`] = await page.evaluate(async () => {
            const r = await (globalThis as any).axe.run(document, {
              runOnly: ["wcag2a", "wcag2aa", "best-practice"],
            });
            return r.violations.map((v: any) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
            }));
          });
        }
        if (label === "arch") {
          await page.keyboard.press(`${mod}+k`);
          await page.locator(".sb-nav-root-modal").waitFor();
          await page.screenshot({
            path: join(OUT_DIR, `search-${vp.name}.png`),
          });
          await page.keyboard.press("Escape");
          await page.locator(".sb-nav-root-modal").waitFor({ state: "hidden" });
          await page.keyboard.press(`${mod}+/`);
          await page.locator(".sb-nav-root-modal").waitFor();
          await page.screenshot({
            path: join(OUT_DIR, `palette-${vp.name}.png`),
          });
        }
        await ctx.close();
      }
    }
    await browser.close();
    writeFileSync(
      join(OUT_DIR, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    proc.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
