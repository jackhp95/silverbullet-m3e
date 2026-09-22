import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
  ADMIN_PASSWORD,
  ADMIN_USER,
  getFreePort,
  waitForServer,
} from "./fixtures";

let proc: ChildProcess;
let rootDir: string;
let base: string;

const BIN = "./target/debug/silverbullet";
const CWD = join(import.meta.dirname, "..");

/**
 * True once `tag` is a registered custom element AND the matched `selector`
 * element has actually been upgraded to an instance of it — not just present
 * in the light DOM waiting on its module. Same helper as basic-modals.test.ts
 * (the cross-cutting acceptance gate every m3e reskin PR adds) — kept local
 * rather than imported since neither file exports it.
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

test.beforeAll(async () => {
  rootDir = await mkdtemp(join(tmpdir(), "sb-admin-spaces-e2e-"));

  // Same non-interactive provisioning as e2e/multi-space-admin.test.ts: the
  // `setup` subcommand writes users.json (the admin account) + an empty
  // spaces.json, which is what boots the server into multi-space mode.
  execFileSync(
    BIN,
    ["setup", rootDir, "--admin", `${ADMIN_USER}:${ADMIN_PASSWORD}`],
    {
      cwd: CWD,
      stdio: "pipe",
    },
  );

  const port = await getFreePort();
  proc = spawn(BIN, [rootDir, "-p", String(port), "-L", "127.0.0.1"], {
    cwd: CWD,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      SB_RUNTIME_API: "0",
      SB_DISABLE_SERVICE_WORKER: "1",
    },
  });
  base = `http://127.0.0.1:${port}`;
  await waitForServer(`${base}/.spaces`);
});

test.afterAll(async () => {
  proc?.kill();
  await rm(rootDir, { recursive: true, force: true });
});

// Log in through the admin UI before each test, so the browser context's
// cookie jar (shared with `page.request` below) carries the admin session
// for both UI navigation and direct API calls.
test.beforeEach(async ({ page }) => {
  await page.goto(`${base}/.spaces`);
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  // The list screens have no heading — the active tab names them instead.
  await expect(page.locator(".sb-tab.sb-active")).toHaveText("Spaces");
});

/** Create a space directly via the admin API (full-config POST) and return its id. */
async function createSpaceViaApi(
  page: Page,
  config: Record<string, unknown>,
): Promise<string> {
  const resp = await page.request.post(`${base}/.spaces/api/admin/spaces`, {
    data: config,
  });
  expect(resp.ok(), await resp.text()).toBeTruthy();
  const json = await resp.json();
  return json.id;
}

/** Fetch a single space's config via the admin API. */
async function fetchSpaceViaApi(page: Page, id: string): Promise<any> {
  const resp = await page.request.get(`${base}/.spaces/api/admin/spaces/${id}`);
  expect(resp.ok(), await resp.text()).toBeTruthy();
  return resp.json();
}

/**
 * Call an admin API endpoint (e.g. `api/admin/users`) using the given page's
 * session cookie, and return the parsed JSON body.
 */
async function admin(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
): Promise<any> {
  const resp = await page.request.fetch(`${base}/.spaces/${path}`, {
    method,
    data: body,
  });
  expect(resp.ok(), await resp.text()).toBeTruthy();
  return resp.json();
}

test("editing a space preserves fields the form does not manage", async ({
  page,
}) => {
  // Create a space via the API with a non-default themeColor and
  // description, which the edit form has no inputs for.
  const id = await createSpaceViaApi(page, {
    name: "Work",
    binding: { prefix: "/work" },
    themeColor: "#ff0000",
    description: "Custom description",
  });

  await page.goto(`${base}/.spaces`);
  // The name opens the space itself; the admin-only Edit control at the end
  // of the row is the durable edit route.
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(`${base}/.spaces/${encodeURIComponent(id)}`);
  await page.getByLabel("Name").fill("Renamed");
  await page.getByRole("button", { name: "Save" }).click();

  // Saving stays on the canonical edit URL, which can be refreshed directly.
  await expect(page).toHaveURL(`${base}/.spaces/${encodeURIComponent(id)}`);
  // Wait for the PATCH to actually land before reloading: m3e-button's click
  // -> form submit dispatch is async (FormSubmitterMixin), unlike a native
  // <button type=submit>'s synchronous submit, so reloading right after the
  // click can abort the in-flight (or not-yet-issued) save request — same
  // race the "saving an existing space" test below already guards against.
  await expect(page.locator("[role=status]")).toHaveText("✓ Saved");
  await page.reload();
  await expect(page.getByLabel("Name")).toHaveValue("Renamed");

  const after = await fetchSpaceViaApi(page, id);
  expect(after.name).toBe("Renamed");
  expect(after.themeColor).toBe("#ff0000");
  expect(after.description).toBe("Custom description");
});

test("saving an existing space confirms that the change was applied", async ({
  page,
}) => {
  const id = await createSpaceViaApi(page, {
    name: "Feedback",
    binding: { prefix: "/feedback" },
  });

  await page.goto(`${base}/.spaces/${encodeURIComponent(id)}`);
  await page.getByLabel("Name").fill("Feedback Renamed");

  // Saving an existing space stays on the URL it started on and re-renders an
  // identical form, so this confirmation is the *only* signal the user gets.
  const status = page.locator("[role=status]");
  await expect(status).toBeHidden();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(status).toHaveText("✓ Saved");

  // And it clears itself, rather than lingering next to fields the user edits
  // afterwards and claiming those were saved too.
  await expect(status).toBeHidden({ timeout: 6000 });
});

test("the shell allow list is editable, and only shown when shell is enabled", async ({
  page,
}) => {
  const id = await createSpaceViaApi(page, {
    name: "Shell",
    binding: { prefix: "/shell" },
    shell: { enabled: true, whitelist: ["git"] },
  });

  await page.goto(`${base}/.spaces/${encodeURIComponent(id)}`);
  await page.locator("summary", { hasText: "Advanced" }).click();

  const allowed = page.getByLabel("Allowed commands");
  await expect(allowed).toHaveValue("git");

  // The field belongs to the toggle above it: with shell commands off there
  // is nothing for an allow list to restrict.
  // Not getByLabel: Chromium's accessible-name computation for `label[for]`
  // doesn't extend to form-associated custom elements the way Playwright's
  // getByLabel expects (verified: locator resolves 0 matches even with an
  // explicit id/for pair) — #id is the working pattern already used by
  // client-encryption.test.ts's `#clientEncryption`.
  await page.locator("#space-shell-enabled").uncheck();
  await expect(allowed).toBeHidden();
  await page.locator("#space-shell-enabled").check();
  await expect(allowed).toHaveValue("git");

  await allowed.fill("git pandoc");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("[role=status]")).toHaveText("✓ Saved");

  const after = await fetchSpaceViaApi(page, id);
  expect(after.shell).toEqual({ enabled: true, whitelist: ["git", "pandoc"] });
});

test("switching a host-bound space to prefix without a value is rejected", async ({
  page,
}) => {
  // A host-bound space: editing it never seeds the (unused) `prefix` field.
  // Switching the Binding dropdown to "URL prefix" must not let an empty
  // prefix through — that would silently rebind the space to the server root.
  const id = await createSpaceViaApi(page, {
    name: "Hostname Space",
    binding: { host: "hostname-space.example.com" },
  });

  await page.goto(`${base}/.spaces/${encodeURIComponent(id)}`);

  // The hostname affix describes the public URL, not this admin session's:
  // always https (TLS is required), whatever port the server this page came
  // from happens to be listening on. Nothing trails the hostname.
  await expect(page.locator(".sb-url-affix")).toHaveText(["https://"]);

  await page.getByLabel("Binding").selectOption("prefix");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.locator(".sb-alert-error")).toContainText(
    "prefix is required",
  );
  // Saving must have been aborted client-side: still on the edit URL.
  await expect(page).toHaveURL(`${base}/.spaces/${encodeURIComponent(id)}`);

  // The important assertion: the stored binding is unchanged, i.e. the PATCH
  // never went through. An error message next to a binding that quietly
  // changed anyway would be worse than no guard at all.
  const after = await fetchSpaceViaApi(page, id);
  expect(after.binding).toEqual({ host: "hostname-space.example.com" });
});

test("user create and detail screens have refreshable URLs", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Users" }).click();
  // The tab is now the screen's label, so it must be marked as the current
  // page rather than merely highlighted.
  await expect(page.locator("[aria-current=page]")).toHaveText("Users");
  await expect(page).toHaveURL(`${base}/.spaces/users`);
  await page.getByRole("link", { name: "Create user" }).click();
  await expect(page).toHaveURL(`${base}/.spaces/users/new`);

  await page.getByLabel("Username").fill("route-user");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page).toHaveURL(`${base}/.spaces/users/route-user`);
  await expect(page.getByRole("heading", { name: "route-user" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "route-user" })).toBeVisible();

  // A direct visit without a session goes through login and returns to the
  // requested detail screen rather than dropping back at the list.
  await page.context().clearCookies();
  await page.goto(`${base}/.spaces/users/route-user`);
  await expect(page).toHaveURL(/\/\.spaces\/login\?next=/);
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(`${base}/.spaces/users/route-user`);
});

test("the wordmark's app icon loads, including on a nested URL", async ({
  page,
}) => {
  // A broken <img> still lays out, so assert the bytes actually arrived. The
  // nested URL is the real risk: the asset path is relative, and only the
  // page's <base href="/.spaces/"> stops it resolving against /.spaces/users/.
  await page.goto(`${base}/.spaces/users`);
  const icon = page.locator(".sb-wordmark img");
  await expect(icon).toBeVisible();
  expect(
    await icon.evaluate((img: HTMLImageElement) => img.naturalWidth > 0),
  ).toBe(true);
});

test("a non-admin sees only their spaces and no admin affordances", async ({
  page,
}) => {
  // The file's beforeEach already established an admin session on `page`; use
  // it to create a member user and a space they belong to via the admin API.
  await admin(page, "POST", "api/admin/users", {
    username: "member",
    password: "memberpw123",
  });
  await admin(page, "POST", "api/admin/spaces", {
    name: "Members Only",
    folder: join(rootDir, "members-only"),
    binding: { prefix: "/members" },
    members: { member: {} },
    seedIndex: true,
  });

  // Drop the admin session and log in as the member instead.
  await page.context().clearCookies();
  await page.goto(`${base}/.spaces/login`);
  await page.fill("#username", "member");
  await page.fill("#password", "memberpw123");
  // LoginForm.tsx's submit is a plug-api/ui `Button`, which now renders
  // `m3e-button` rather than a plain `<button>` (Phase B #8's kit-level
  // reskin) — `getByRole` still resolves it (m3e-button is accessible by
  // default), matching this file's other login-button clicks above.
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.locator(".sb-space-list li")).toHaveCount(1);
  await expect(page.locator("text=Members Only")).toBeVisible();
  // No Users tab, no create button.
  await expect(page.locator(".sb-tabs")).toHaveCount(0);
  await expect(page.locator("text=Create space")).toHaveCount(0);
  // With no tab bar to name the screen, the heading is what labels it — it is
  // dropped only where a tab already says "Spaces".
  await expect(page.getByRole("heading", { name: "Spaces" })).toBeVisible();

  // Typing an admin URL yields the not-found screen, not the user list.
  await page.goto(`${base}/.spaces/users`);
  await expect(page.locator("h1")).toHaveText("Not found");

  // And the API refuses regardless of what the UI renders. The caller is
  // authenticated (just not an admin), so this is 403, not 401.
  const resp = await page.request.get(`${base}/.spaces/api/admin/users`);
  expect(resp.status()).toBe(403);
});

// Phase C #9 (docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-spec.md
// §3): FolderPicker.tsx's browse panel — previously a plain <ul>/<button>
// tree — now renders m3e-breadcrumb/m3e-list-action.
test("the folder picker's browse panel upgrades to m3e-breadcrumb/m3e-list-action, and clicking an entry fills the folder field", async ({
  page,
}) => {
  const probeDir = join(rootDir, "browse-probe");
  await mkdir(join(probeDir, "child-one"), { recursive: true });

  await page.goto(`${base}/.spaces/new`);
  // Typing directly into the folder field marks it "touched", so the browse
  // panel opens on that value itself rather than the untouched default's
  // "spaces" parent (see FolderPicker.tsx's `browseStart` doc comment).
  await page.locator("#space-folder").fill(probeDir);
  await page.getByRole("button", { name: "Browse…" }).click();

  const breadcrumb = page.locator("m3e-breadcrumb");
  await expect(breadcrumb).toBeVisible();
  expect(await isUpgraded(page, "m3e-breadcrumb")).toBe(true);
  expect(await isUpgraded(page, "m3e-breadcrumb-item")).toBe(true);

  const entry = page.locator("m3e-list-action", { hasText: "child-one" });
  await expect(entry).toBeVisible();
  expect(await isUpgraded(page, "m3e-list-action")).toBe(true);
  await entry.click();

  await expect(page.locator("#space-folder")).toHaveValue(
    join(probeDir, "child-one"),
  );
});

// Phase C #9: SpaceForm.tsx's "Delete space" used to go through a blocking
// `window.confirm()`; it now stages an m3e-dialog-backed ConfirmDialog.tsx.
test("deleting a space asks for confirmation via an upgraded m3e-dialog, and Cancel leaves it untouched", async ({
  page,
}) => {
  const id = await createSpaceViaApi(page, {
    name: "Doomed",
    binding: { prefix: "/doomed" },
  });

  await page.goto(`${base}/.spaces/${encodeURIComponent(id)}`);
  await page.getByRole("button", { name: "Delete space" }).click();

  const dialog = page.locator("m3e-dialog");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog.locator('[slot="header"]')).toContainText(
    'Remove "Doomed" from the server?',
  );
  expect(await isUpgraded(page, "m3e-dialog")).toBe(true);
  expect(await isUpgraded(page, "m3e-button")).toBe(true);

  await dialog.getByText("Cancel", { exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const stillThere = await fetchSpaceViaApi(page, id);
  expect(stillThere.name).toBe("Doomed");

  // Ok actually deletes it.
  await page.getByRole("button", { name: "Delete space" }).click();
  await page.locator("m3e-dialog").getByText("Ok", { exact: true }).click();
  await expect(page.locator("m3e-dialog")).not.toBeVisible();

  const resp = await page.request.get(
    `${base}/.spaces/api/admin/spaces/${id}`,
  );
  expect(resp.status()).toBe(404);
});

// Phase C #9: UsersView.tsx's "Revoke" token action used to go through a
// blocking `window.confirm()`, and the token list itself was a plain
// <ul>/<li>; both now render via m3e-dialog / m3e-list-item.
test("revoking a token asks for confirmation via an upgraded m3e-dialog, and the token list renders as m3e-list", async ({
  page,
}) => {
  await admin(page, "POST", "api/admin/users", {
    username: "token-owner",
    password: "tokenownerpw123",
  });
  await page.goto(`${base}/.spaces/users/token-owner`);
  await page.getByLabel("Token name").fill("ci-token");
  await page.getByRole("button", { name: "Create token" }).click();

  const tokenList = page.locator("m3e-list.sb-token-list");
  await expect(tokenList).toBeVisible();
  expect(
    await isUpgraded(page, "m3e-list", "m3e-list.sb-token-list"),
  ).toBe(true);
  expect(await isUpgraded(page, "m3e-list-item")).toBe(true);
  await expect(tokenList).toContainText("ci-token");

  await page.getByRole("button", { name: "Revoke" }).click();
  const dialog = page.locator("m3e-dialog");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog.locator('[slot="header"]')).toContainText(
    'Revoke token "ci-token"',
  );
  expect(await isUpgraded(page, "m3e-dialog")).toBe(true);

  // Cancel leaves the token in place.
  await dialog.getByText("Cancel", { exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(tokenList.locator("m3e-list-item")).toHaveCount(1);

  // Ok revokes it.
  await page.getByRole("button", { name: "Revoke" }).click();
  await page.locator("m3e-dialog").getByText("Ok", { exact: true }).click();
  await expect(page.locator("m3e-dialog")).not.toBeVisible();
  await expect(page.getByText("No tokens.")).toBeVisible();
});

// Phase C #9: UsersView.tsx's "Delete user" used to go through a blocking
// `window.confirm()`; it now stages the same ConfirmDialog.tsx surface.
test("deleting a user asks for confirmation via an upgraded m3e-dialog", async ({
  page,
}) => {
  await admin(page, "POST", "api/admin/users", {
    username: "doomed-user",
    password: "doomeduserpw123",
  });
  await page.goto(`${base}/.spaces/users/doomed-user`);

  await page.getByRole("button", { name: "Delete user" }).click();
  const dialog = page.locator("m3e-dialog");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog.locator('[slot="header"]')).toContainText(
    'Delete user "doomed-user"?',
  );
  expect(await isUpgraded(page, "m3e-dialog")).toBe(true);

  await dialog.getByText("Ok", { exact: true }).click();
  await expect(page).toHaveURL(`${base}/.spaces/users`);

  const resp = await page.request.get(
    `${base}/.spaces/api/admin/users/doomed-user`,
  );
  expect(resp.status()).toBe(404);
});
