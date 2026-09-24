import { adminApi, login, test } from "../fixtures/authenticated.ts";
import {
  expect,
  gotoSilverBulletPage,
  waitForPersistedContent,
} from "../fixtures/core.ts";

const hostnameTest = process.env.SB_E2E_HOST
  ? test
  : test.extend({
      launchOptions: {
        args: [
          "--disable-dev-shm-usage",
          "--host-resolver-rules=MAP team.localhost 127.0.0.1",
        ],
      },
    });
hostnameTest.skip(
  ({ browserName }) => browserName !== "chromium" && !process.env.SB_E2E_HOST,
  "The fixture hostname mapping uses Chromium; set SB_E2E_HOST for other browsers.",
);

hostnameTest(
  "an administrator reuses a hostname for sibling spaces, edits and opens them",
  async ({ page, sbServer }) => {
    await login(page, sbServer);
    await adminApi(page, sbServer, "PUT", "server-config", {
      primaryUrl: sbServer.url,
    });
    const primaryRoot = await adminApi<{ id: string }>(
      page,
      sbServer,
      "POST",
      "spaces",
      {
        name: "Primary Root",
        binding: { host: `127.0.0.1:${sbServer.port}` },
      },
    );
    await page.reload();
    await page.getByRole("link", { name: "Create space", exact: true }).click();
    const primaryOption = page
      .getByLabel("Hostname", { exact: true })
      .locator('option[value="primary"]');
    await expect(primaryOption).toHaveText(/Primary hostname .* — \/$/);
    await expect(primaryOption).toBeDisabled();
    await expect(
      page
        .getByLabel("Hostname", { exact: true })
        .locator(`option[value="host:127.0.0.1:${sbServer.port}"]`),
    ).toHaveCount(0);
    await adminApi(page, sbServer, "DELETE", `spaces/${primaryRoot.id}`);
    await page.reload();
    await page.getByLabel("Name", { exact: true }).fill("Draft");
    await page.getByLabel("Hostname", { exact: true }).selectOption("new");
    await page
      .getByLabel("New hostname", { exact: true })
      .fill(`team.localhost:${sbServer.port}`);
    await page.getByLabel("Name", { exact: true }).fill("Work");
    await page.getByLabel("Hostname", { exact: true }).selectOption("primary");
    await expect(page.getByLabel("Path", { exact: true })).toHaveValue("/work");
    await page.getByLabel("Hostname", { exact: true }).selectOption("new");
    await expect(page.getByLabel("New hostname", { exact: true })).toHaveValue(
      `team.localhost:${sbServer.port}`,
    );
    await page.getByLabel("Path", { exact: true }).fill("/work");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).not.toHaveURL(/\/new$/);
    const workId = decodeURIComponent(
      new URL(page.url()).pathname.split("/").pop()!,
    );
    await adminApi(page, sbServer, "PATCH", `spaces/${workId}`, {
      access: "write",
    });

    await page.goto(`${sbServer.url}/.spaces/`);
    await page.getByRole("link", { name: "Create space", exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("Wiki");
    const knownHost = page
      .getByLabel("Hostname", { exact: true })
      .locator("option", {
        hasText: `team.localhost:${sbServer.port} — /work`,
      });
    await expect(knownHost).toHaveText(
      `team.localhost:${sbServer.port} — /work`,
    );
    await expect(knownHost).toBeEnabled();
    await page
      .getByLabel("Hostname", { exact: true })
      .selectOption(`host:team.localhost:${sbServer.port}`);
    await page.getByLabel("Path", { exact: true }).fill("/wiki");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).not.toHaveURL(/\/new$/);
    const wikiId = decodeURIComponent(
      new URL(page.url()).pathname.split("/").pop()!,
    );
    await adminApi(page, sbServer, "PATCH", `spaces/${wikiId}`, {
      access: "write",
    });

    await page.getByLabel("Path", { exact: true }).fill("/docs");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    const wiki = await adminApi<any>(page, sbServer, "GET", `spaces/${wikiId}`);
    expect(wiki.binding).toEqual({
      host: `team.localhost:${sbServer.port}`,
      prefix: "/docs",
    });

    const teamServer = {
      ...sbServer,
      url: `http://team.localhost:${sbServer.port}`,
    };
    expect(
      (
        await page.request.put(`${teamServer.url}/work/.fs/Identity.md`, {
          data: "Work space identity",
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await page.request.put(`${teamServer.url}/docs/.fs/Identity.md`, {
          data: "Wiki space identity",
        })
      ).ok(),
    ).toBe(true);
    await gotoSilverBulletPage(
      page,
      { ...teamServer, url: `${teamServer.url}/work` },
      "Identity",
    );
    await expect(page.locator(".cm-content")).toContainText(
      "Work space identity",
    );
    await page.locator(".cm-content").click();
    await page.keyboard.insertText("A new shared workspace.");
    await waitForPersistedContent(
      { ...teamServer, url: `${teamServer.url}/work` },
      "Identity.md",
      "Work space identityA new shared workspace.",
      page.request,
    );
    await gotoSilverBulletPage(
      page,
      { ...teamServer, url: `${teamServer.url}/docs` },
      "Identity",
    );
    await expect(page).toHaveURL(`${teamServer.url}/docs/Identity`);
    await expect(page.locator(".cm-content")).toContainText(
      "Wiki space identity",
    );
  },
);

test("an administrator creates a member and saves a space grant", async ({
  adminPage: page,
  sbServer,
}) => {
  await page.goto(`${sbServer.url}/.spaces/users/new`);
  await page.getByLabel("Username", { exact: true }).fill("casey");
  await page.getByLabel("Password", { exact: true }).fill("casey-password");
  await page.getByRole("button", { name: "Create user", exact: true }).click();
  await expect(page).toHaveURL(/\/\.spaces\/users\/casey/);
  const space = await adminApi<{ id: string }>(
    page,
    sbServer,
    "POST",
    "spaces",
    {
      name: "Notebook",
      binding: { prefix: "/notes" },
    },
  );
  await page.goto(`${sbServer.url}/.spaces/${space.id}?section=access`);
  await page
    .getByRole("checkbox", { name: "casey: Write", exact: true })
    .check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "casey: Write", exact: true }),
  ).toBeChecked();
  const saved = await adminApi(page, sbServer, "GET", `spaces/${space.id}`);
  expect(saved.members.casey.role).toBe("write");
});

test("an administrator manages a user's API tokens through the m3e-list/m3e-dialog reskin", async ({
  adminPage: page,
  sbServer,
}) => {
  await adminApi(page, sbServer, "POST", "users", {
    username: "casey",
    password: "casey-password",
    fullName: "Casey Example",
  });
  await page.goto(`${sbServer.url}/.spaces/`);
  await page.setViewportSize({ width: 411, height: 761 });
  await page.screenshot({
    path: "/tmp/slice-spaces-v2-shots/admin-spaces-list-mobile.png",
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: "/tmp/slice-spaces-v2-shots/admin-spaces-list-desktop.png",
  });

  await page.goto(
    `${sbServer.url}/.spaces/users/casey?section=tokens`,
  );
  await page.screenshot({
    path: "/tmp/slice-spaces-v2-shots/users-view-desktop.png",
  });
  await page.setViewportSize({ width: 411, height: 761 });
  await page.screenshot({
    path: "/tmp/slice-spaces-v2-shots/users-view-mobile.png",
  });
  await page.setViewportSize({ width: 1280, height: 800 });

  // Create a token, then confirm the m3e-list custom element is actually
  // upgraded (registered), not inert unstyled HTML.
  await page.getByLabel("Token name", { exact: true }).fill("ci-token");
  await page.getByRole("button", { name: "Create token", exact: true }).click();
  const list = page.locator("m3e-list.sb-token-list");
  await expect(list).toBeVisible();
  await expect(list.locator("m3e-list-item")).toContainText("ci-token");
  expect(
    await page.evaluate(() => !!customElements.get("m3e-list")),
  ).toBe(true);
  expect(
    await list.evaluate((el) => !!(el as Element).shadowRoot),
  ).toBe(true);

  // Cancelling the m3e-dialog confirm leaves the token in place.
  await page
    .getByRole("button", { name: "Revoke token ci-token", exact: true })
    .click();
  const dialog = page.locator("m3e-dialog[open]");
  await expect(dialog).toBeVisible();
  expect(
    await page.evaluate(() => !!customElements.get("m3e-dialog")),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(list.locator("m3e-list-item")).toContainText("ci-token");

  // Confirming it removes the token.
  await page
    .getByRole("button", { name: "Revoke token ci-token", exact: true })
    .click();
  await page
    .locator("m3e-dialog[open]")
    .getByRole("button", { name: "Ok", exact: true })
    .click();
  await expect(page.getByText("No tokens.", { exact: true })).toBeVisible();

  // Deleting the user goes through the same m3e-dialog confirm. "Delete user"
  // lives in the "account" section (UserDetail's default section is
  // "profile" without a `?section=` query param).
  await page.goto(`${sbServer.url}/.spaces/users/casey?section=account`);
  await page.getByRole("button", { name: "Delete user", exact: true }).click();
  await page
    .locator("m3e-dialog[open]")
    .getByRole("button", { name: "Ok", exact: true })
    .click();
  await expect(page).toHaveURL(`${sbServer.url}/.spaces/users`);
  await expect(page.getByText("casey", { exact: true })).toHaveCount(0);
});
