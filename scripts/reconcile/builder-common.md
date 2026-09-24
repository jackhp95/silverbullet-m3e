## Shared rules for every silverbullet-m3e reconcile builder (orchestrator 2026-09-24)

**Context.** Repo `silverbullet-m3e` = fork of upstream SilverBullet reskinned with @m3e/web (Material 3 Expressive web components). The reconcile epic ports the fork's reskin (Stream B tip `4cfc3763` on branch `m3e-cards-and-tailwind-audit`, fork/main merge-base `2b2a7c719bb3546df8c78ddeaf95256535ee2dd3`) onto `main` (upstream's newer architecture). THE living plan doc — read §2, §4 and §5 before touching code: `docs/plans/2026-09-23-m3e-fork-main-reconciliation.md` (also at `/Users/jack/Documents/code/sb-reconcile-main/docs/plans/2026-09-23-m3e-fork-main-reconciliation.md`). Load the `m3e` skill before writing any `<m3e-*>` markup (tags/attrs/slots/events must be real, not guessed), and the `coding-preferences` skill before writing code.

**Decisions already made by Jack — do not re-litigate:** main's navigator `NavRoot` is THE search/picker UI; fork `search_sheet.tsx`, `search_modes.ts`, `navigation_sheet.tsx`, `nav_views/*`, and fork edits to `anything_picker.tsx`/`command_palette.tsx` are permanently dead. Frontmatter = Stream B raw-YAML card. Scroll-snap removed entirely. `plug-api/ui/alert.tsx` stays deferred (pending Jack: inline banner vs. m3e-snackbar toast — `m3e-snackbar` is `popover="manual"` so it floats over inline content and blocks clicks).

**Load-bearing hazards (each already cost a slice a regression):**
1. `@m3e/web/*` elements only work after a side-effect `import "@m3e/web/<x>"`. Register in the browser-only bundle entry (`client/editor_ui.tsx` for the editor; `client/spaces_ui/{spaces,setup,central,auth}.tsx` for spaces UI — all 5 are real bundles, see `build/build_client.ts` entryPoints). NEVER add `@m3e/web/*` imports to a file with a sibling `.test.ts` or imported by a vitest test — vitest env is node, lit-html crashes (`document.createTreeWalker is not a function`). Plug UI panels (`plugs/*/ui/`) are separate iframe bundles that self-import per consumer — keep that convention.
2. An unregistered `<m3e-*>` renders as inert, roleless HTML and silently breaks main's own e2e flows. Before/after e2e diff against the baseline is the only reliable catch.
3. `git merge-tree` only shows textual conflicts; a "clean" fork file can depend on a method/type main doesn't have. Compile + e2e, don't trust clean merges.
4. Keep main's business logic (SSO/OIDC, git-sync, revisions, live collab, navigator) intact — the fork never had it. Port only the fork's visual/reskin intent onto main's current code.

**Gate — run ALL of it from YOUR worktree, in this order (or run `scripts/reconcile/sb-gate.sh "$PWD" /tmp/sbgate/<slice>` which does exactly this and writes `/tmp/sbgate/<slice>-summary.log`), and paste the terminal exit code + final summary line of each into your report (never paraphrase counts; never pipe a gate into `&&`; capture `$?`):**
```
cp /Users/jack/Documents/code/silverbullet-m3e/version.json .   # gitignored, needed by build
npm ci                      # fall back to `npm install` ONLY if you changed package.json
npm run build               # client bundle; e2e does NOT build for you
cargo build -p silverbullet -p sb   # e2e spawns target/debug/silverbullet; stale binary = fake failures
./target/debug/silverbullet --version   # must show your HEAD sha (git describe)
npm run check
npm test
RUST_MIN_STACK=67108864 npm run lint   # macOS biome stack-overflow workaround
npm run test:e2e > /tmp/<slice>-e2e.log 2>&1; echo "EXIT:$?"
```
Baseline on `main` @ `cd50bf9f` (captured 2026-09-24): check/unit/lint exit 0; e2e was historically 43/44 with only the pre-existing `git.test.ts` flake failing — the orchestrator will tell you the fresh number if it differs. Any e2e failure that isn't in the baseline is yours until proven otherwise (re-run it on a clean `main` worktree to prove it's pre-existing).

**UI house rule:** every UI change gets a Playwright test that is actually run and passes. Where the fork already has an e2e spec for the feature (see `git show 4cfc3763:e2e/<name>.test.ts`), port it (fixing selectors to main's real markup) rather than writing from scratch; delete/rewrite fork specs that target dead UI. Also take Playwright screenshots at 411×761 (mobile) and 1280×800 of each reskinned surface, save under `/tmp/<slice>-shots/`, LOOK at them (Read the png), and confirm the m3e components actually render styled (not inert text).

**Git discipline:** work only in your worktree on your branch. Commit each verified step before moving on; never leave verified work uncommitted. Do NOT push, do NOT merge into main, do NOT touch other worktrees/branches, do NOT run `git stash` (shared stack), no force operations. Don't commit `version.json`, `target/`, test artifacts, or pnpm files. Keep the diff scoped to your slice — no drive-by reformatting of unrelated files (run biome format only on files you changed).

**Never end your turn waiting on a background job.** Under Paseo, a background Bash/Monitor completion does NOT wake an agent whose turn has ended — it just sits idle. Run gate steps in the foreground (Bash timeout up to 600000 ms, one step per call; e2e as its own call), or keep working and poll the log yourself. End your turn only to deliver the final report. Monitor/`run_in_background` completion notices and ScheduleWakeup do NOT reach you once idle — 5 of 6 builders in the 2026-09-24 run stalled that way. Canonical wait (one foreground Bash call, timeout 600000, repeat until DONE): `for i in $(seq 1 55); do grep -q DONE /tmp/sbgate/<slice>-summary.log 2>/dev/null && break; sleep 10; done; cat /tmp/sbgate/<slice>-summary.log`

**No AskUserQuestion.** Nobody is watching. If you hit a genuine product/UX decision, implement the most conservative option (preserve main's current behavior), and list the decision with your recommended default in your report.

**Premise check first:** your brief states checkable facts (file lists, what's on main). Verify them before building; if one is wrong, say so explicitly in the report and adapt.

**Final report (your final message IS the deliverable — restate in full, never "as above"):** branch + commit SHAs; per-file what you ported/kept/dropped and why; each gate step's exit code + verbatim summary line; e2e pass/fail list vs baseline; screenshots paths + what you saw; decisions for Jack with your default; known gaps. Frictions: log via `~/.claude/signals/pain/log-friction.sh` (see `~/.claude/signals/pain/README.md`), or list under `## Frictions` in your report.
