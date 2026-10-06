import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "whats-left.sh",
);

// A throwaway repository shaped like the reconcile: the fork branched from
// `base`, the integration branch merged the fork for real (so the fork tip is
// its ancestor), and a later integration commit dropped one of the fork's
// changes again.
describe("whats-left.sh", () => {
  let repo: string;
  let base: string;
  let fork: string;

  // Under a git hook GIT_DIR points at the real repository; every git call
  // here must resolve the fixture from its cwd instead.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
  );
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8", env }).trim();
  const write = (file: string, text: string) =>
    writeFileSync(path.join(repo, file), text);
  const commit = (message: string) => {
    git("add", "-A");
    git("commit", "-q", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const run = (...args: string[]) =>
    spawnSync("bash", [script, "--base", base, "--theirs", fork, ...args], {
      cwd: repo,
      encoding: "utf8",
      env,
    });
  const statuses = (stdout: string) =>
    Object.fromEntries(
      stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split("\t").reverse() as [string, string]),
    );

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "whats-left-"));
    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");

    write("kept.txt", "one\ntwo\nthree\n");
    write("lost.txt", "alpha\nbeta\ngamma\n");
    write("clash.txt", "red\ngreen\nblue\n");
    write("dead.txt", "old picker\n");
    write("gone.txt", "fork removes this\n");
    base = commit("base");

    git("checkout", "-q", "-b", "fork");
    write("kept.txt", "one\ntwo\nthree\nfork line\n");
    write("lost.txt", "alpha\nbeta\ngamma\nfork port A\nfork port B\n");
    write("clash.txt", "red\nfork green\nblue\n");
    write("dead.txt", "old picker, reskinned\n");
    write("added.txt", "new on the fork\n");
    git("rm", "-q", "gone.txt");
    fork = commit("fork: reskin");

    git("checkout", "-q", "main");
    write("unrelated.txt", "main moves on\n");
    commit("main: unrelated work");
    git("merge", "-q", "--no-ff", "-m", "merge the fork", "fork");

    // After the merge: main drops two fork lines, rewrites a third, deletes a
    // file the fork had touched, and restores a file the fork had deleted.
    write("lost.txt", "alpha\nbeta\ngamma\n");
    write("clash.txt", "red\nmain green\nblue\n");
    git("rm", "-q", "dead.txt");
    write("gone.txt", "main brought it back\n");
    commit("main: later rewrite");
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  test("the premise: ancestry says nothing is left", () => {
    expect(git("merge-base", "main", fork)).toBe(fork);
  });

  test("each path the fork changed is classified against the pre-merge base", () => {
    const result = run();
    expect(result.status).toBe(0);
    expect(statuses(result.stdout)).toEqual({
      "kept.txt": "LANDED",
      "added.txt": "LANDED",
      "lost.txt": "fork-adds:2",
      "clash.txt": "CONFLICT:1",
      "dead.txt": "ours-deleted",
      "gone.txt": "fork-deletes",
    });
    expect(result.stderr).toMatch(/6 path\(s\).*2 landed, 4 pending/);
  });

  test("--pending hides what has landed; explicit paths limit the report", () => {
    expect(Object.keys(statuses(run("--pending").stdout)).sort()).toEqual([
      "clash.txt",
      "dead.txt",
      "gone.txt",
      "lost.txt",
    ]);
    expect(statuses(run("lost.txt", "kept.txt").stdout)).toEqual({
      "lost.txt": "fork-adds:2",
      "kept.txt": "LANDED",
    });
  });

  test("--ours picks the side to ask about: at the merge commit itself everything had landed", () => {
    const mergeCommit = git("rev-parse", "main~1");
    const result = run("--ours", mergeCommit, "--pending");
    expect(result.stdout.trim()).toBe("");
    expect(result.stderr).toMatch(/6 landed, 0 pending/);
  });

  test("a bad revision or an unknown option is a usage error", () => {
    expect(run("--ours", "no-such-ref").status).toBe(2);
    expect(run("--nope").status).toBe(2);
  });
});
