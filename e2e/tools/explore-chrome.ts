// Ad-hoc DOM explorer for the chrome audit: prints ancestor backgrounds,
// the floating toolbar geometry and axe node targets for one page/viewport.
//   W=411 H=761 PAGE=Architecture AXE_PATH=... npx tsx e2e/tools/explore-chrome.ts
import { chromium } from "@playwright/test";
import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getFreePort,
  spawnServerProcess,
  waitForServer,
} from "../fixtures/core.ts";

const W = Number(process.env.W ?? 411);
const H = Number(process.env.H ?? 761);
const PAGE = process.env.PAGE ?? "Architecture";

const space = mkdtempSync(join(tmpdir(), "apps2-space-"));
cpSync("docs", space, { recursive: true });
const port = await getFreePort();
const proc = spawnServerProcess(space, port);
try {
  await waitForServer(`http://127.0.0.1:${port}/.ping`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  await ctx.addInitScript("globalThis.__name = (f) => f;");
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/${PAGE}?headless=1`);
  await page.locator("#sb-editor .cm-editor").waitFor({ timeout: 60_000 });
  await page.waitForFunction(
    () => (globalThis as any).sbRuntime?.ready === true,
    undefined,
    { timeout: 60_000 },
  );
  await page.addScriptTag({ path: process.env.AXE_PATH! });
  const out = await page.evaluate(async () => {
    const chain = (el: Element | null) => {
      const r: string[] = [];
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        r.push(
          `${e.localName}${e.id ? "#" + e.id : ""}.${[...e.classList].join(".")} bg=${s.backgroundColor} disp=${s.display}`,
        );
      }
      return r;
    };
    const rect = (e: Element | null) => {
      const r = e?.getBoundingClientRect();
      return r && [r.x, r.y, r.width, r.height].map(Math.round);
    };
    const ax = await (globalThis as any).axe.run(document, {
      runOnly: ["wcag2a", "wcag2aa", "best-practice"],
    });
    const tok = (el: Element | null, n: string) =>
      el ? getComputedStyle(el).getPropertyValue(n).trim() : null;
    return {
      tokens: {
        html: tok(document.documentElement, "--md-sys-color-surface"),
        root: tok(document.querySelector("#sb-root"), "--md-sys-color-surface"),
        theme: tok(
          document.querySelector("m3e-theme"),
          "--md-sys-color-surface",
        ),
        rootBgVar: tok(document.documentElement, "--root-background-color"),
        mainRect: rect(document.querySelector("#sb-main")),
        mainPad: getComputedStyle(document.querySelector("#sb-main")!)
          .paddingBottom,
        editorRect: rect(document.querySelector("#sb-editor")),
      },
      editorChain: chain(document.querySelector(".cm-editor")),
      topChain: chain(document.querySelector("#sb-top")),
      toolbars: [
        ...document.querySelectorAll("m3e-toolbar, .sb-floating-toolbar"),
      ].map((e) => ({
        tag: e.localName,
        cls: e.className,
        rect: rect(e),
        html: e.outerHTML.slice(0, 900),
      })),
      topHtml: document.querySelector("#sb-top")?.outerHTML.slice(0, 3000),
      axe: ax.violations.map((v: any) => ({
        id: v.id,
        nodes: v.nodes.map(
          (n: any) => n.target.join(" ") + " :: " + n.html.slice(0, 200),
        ),
      })),
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
} finally {
  proc.kill();
}
