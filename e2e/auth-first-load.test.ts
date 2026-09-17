import { expect, type Page, test } from "@playwright/test";
import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getFreePort, waitForServer } from "./fixtures";

/**
 * True once `tag` is a registered custom element AND the matched `selector`
 * element has actually been upgraded to an instance of it — not just present
 * in the light DOM waiting on its module. Same helper as basic-modals.test.ts
 * (the cross-cutting acceptance gate every m3e reskin PR adds, per
 * docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-spec.md §3) — kept
 * local rather than imported since neither file exports it.
 */
function isUpgraded(
  page: Page,
  tag: string,
  selector: string = tag,
): Promise<boolean> {
  return page.evaluate(
    ({ tag, selector }: { tag: string; selector: string }) => {
      const ctor = customElements.get(tag);
      const el = document.querySelector(selector);
      return !!ctor && !!el && el instanceof ctor;
    },
    { tag, selector },
  );
}

// Regression test: on the FIRST-ever visit to an authenticated space (empty
// localStorage, no session), the boot fetches all 401 and the client redirects
// to the login page. The redirect used to abort the sibling in-flight boot
// fetches, which were then misclassified as "offline" and surfaced a spurious
// "Could not process config and no cached copy" alert right before the login
// page appeared.

let proc: ChildProcess;
let spaceDir: string;
let base: string;

test.beforeAll(async () => {
  spaceDir = await mkdtemp(join(tmpdir(), "sb-auth-e2e-"));
  const port = await getFreePort();
  proc = spawn(
    "./target/debug/silverbullet",
    [spaceDir, "-p", String(port), "-L", "127.0.0.1"],
    {
      cwd: join(import.meta.dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        SB_USER: "alice:s3cret",
        SB_RUNTIME_API: "0",
        SB_DISABLE_SERVICE_WORKER: "1",
      },
    },
  );
  base = `http://127.0.0.1:${port}`;
  // The SPA shell is served openly, so /.ping answers even without a session.
  await waitForServer(`${base}/.ping`);
});

test.afterAll(async () => {
  proc?.kill();
  await rm(spaceDir, { recursive: true, force: true });
});

test("first load of an authenticated space redirects to login without alerts", async ({
  page,
}) => {
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await page.goto(`${base}/`);
  // The boot code discovers it is unauthenticated and redirects to the login
  // page.
  await expect(page.locator("#username")).toBeVisible({ timeout: 30_000 });
  // Give any straggling (aborted) boot fetch time to surface a dialog.
  await page.waitForTimeout(1500);
  expect(dialogs, `unexpected dialogs: ${dialogs.join(" | ")}`).toEqual([]);

  // And logging in still works end to end.
  await page.locator("#username").fill("alice");
  await page.locator("#password").fill("s3cret");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(`${base}/`);
  await expect(page.locator("#sb-editor .cm-editor")).toBeVisible({
    timeout: 30_000,
  });
  expect(dialogs, `unexpected dialogs: ${dialogs.join(" | ")}`).toEqual([]);
});

test("the login page's styles actually load", async ({ page }) => {
  await page.goto(`${base}/`);
  // LoginForm.tsx's submit is a plug-api/ui `Button`, which now renders
  // `m3e-button` rather than a plain `<button>` (Phase B #8's kit-level
  // reskin — see docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-
  // spec.md §3), so `#login button` no longer matches it at all — only the
  // unrelated `#togglePassword` show/hide toggle remains a real `<button>`.
  // A CSS-only "computed backgroundColor" check would also read the wrong
  // thing for a Shadow-DOM component (the host's own box, not what
  // @m3e/web actually paints inside it) — so assert the thing that can
  // actually fail here: the custom element's module loaded and the
  // light-DOM element really upgraded to it.
  const button = page.locator("#login m3e-button").last();
  await button.waitFor({ state: "visible" });
  expect(await isUpgraded(page, "m3e-button", "#login m3e-button")).toBe(
    true,
  );
});
