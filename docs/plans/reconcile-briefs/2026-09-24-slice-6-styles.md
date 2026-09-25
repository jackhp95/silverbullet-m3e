# Builder brief — slice 6-styles (8 `client/styles/*.scss` hand-merges)

Orchestrator: Paseo `34f4d0d3` (understudy for `7fec1afd`), 2026-09-24. Plan: [`docs/plans/2026-09-23-m3e-fork-main-reconciliation.md`](../2026-09-23-m3e-fork-main-reconciliation.md) §2, §4 item 6, §5. Shared rules (hazards, gate, git discipline, report format — **mandatory, read first**): [`scripts/reconcile/builder-common.md`](../../../scripts/reconcile/builder-common.md).

## Task — implement
Rebuild the 3-way hand-merge of `client/styles/{_standalone,colors,components,editor,main,modals,theme,top}.scss` so `main`'s own design is preserved and the fork's (Stream B tip `4cfc3763`) m3e reskin intent is layered on top. Gate it, commit it.

## Goals + acceptance
- Every one of the 8 files resolved per the per-hunk rules below; no conflict markers; SCSS compiles.
- Full gate (see builder-common) green vs baseline: check/unit/lint exit 0, e2e no NEW failures vs baseline (43 pass / 1 known `git.test.ts:101` failure).
- Playwright screenshots (411×761 and 1280×800) of the editor page, a modal (e.g. a Prompt), the navigator panel, and the spaces admin page, before (on `main`) and after (your branch), saved under `/tmp/slice-6-styles-shots/`, LOOKED at; list visible differences in the report and justify each as intended reskin, not a regression. If there are visible *unintended* regressions vs main, fix them.

## Point-in-time state (captured 2026-09-24 ~20:10Z — re-verify before acting)
- Worktree `/Users/jack/Documents/code/sb-slice-6-styles`, branch `reconcile/slice-6-styles`, rebased onto `main` @ `49021d64`.
- One commit on top: `checkpoint(slice-6-styles): WIP hand-merge of 8 styles/*.scss (ungated)`. **This WIP is known-flawed**: review found that wherever fork == base but main changed a value/rule (main's token palette refresh, `--ui-font` → iA-Mono, modal/button/badge colors), it took the stale fork/base value, silently reverting main's design. Treat it as a source of already-researched reasoning, NOT as a base. The expected result is that you replace its contents file by file with correct resolutions (new commits on top; do not rewrite/force anything).
- 3-way inputs may exist at `/tmp/6s-3way/<f>.{base,main,fork,merged,wip}` (volatile). If missing, regenerate: `git show 2b2a7c719bb3546df8c78ddeaf95256535ee2dd3:client/styles/<f>.scss > <f>.base`, `git show main:… > <f>.main`, `git show 4cfc3763:… > <f>.fork`, then `cp <f>.main <f>.merged && git merge-file -L main -L base -L fork <f>.merged <f>.base <f>.fork`. Write regenerated files to `/tmp/6s-3way/`, never into the repo.

## Merge rules (per hunk)
1. **Main changed, fork == base** → main wins. Never revert main.
2. **Fork changed, main == base** → verify against main's CURRENT markup:
   - Fork *deletions* (Stream B "SCSS reduction": 8c88e809 bb63ab16 907019b2 1079003b 6f1664f0 27c4e281 5e2cdcce d61a5a61 d637f342 213dbb42, and others) often moved properties to Tailwind utility classes at a TSX call site IN THE FORK. Check main's TSX (`git grep -n '<class>' -- client plug-api plugs libraries`). If main still renders the selector without equivalent Tailwind classes, KEEP main's rule. Delete only if the selector is rendered nowhere on main (mind dynamic construction like `sb-notification-${type}`, `sb-resizer-${side}`, CodeMirror `cm-*` classes, and Space Lua / plug-generated HTML in `libraries/` and `plugs/`).
   - Fork *additions/changes* = reskin intent: keep if they target markup main renders now, OR if inert (target not-yet-ported core-shell elements: large app bar, `.sb-floating-toolbar`, `m3e-drawer-container`, frontmatter raw-YAML card, `#sb-page-scroll`, linked-mentions card). Inert additions must not change current rendering.
   - DROP fork rules whose only target is permanently dead UI: `#sb-search-sheet`/`.sb-search-sheet-*`, `.sb-navigation-sheet-*`/`.sb-sheet-section-*`, `nav_views/*`, fork `anything_picker`/`command_palette` styling. No scroll-snap rules at all.
   - Fork restructures needing TSX that hasn't landed (`#sb-main` → `m3e-drawer-container`, auto-height editor inside `#sb-page-scroll`, `.sb-modal` → `<m3e-dialog>`) → keep main's rules for current markup; add the fork's version only inertly (scoped to the not-yet-rendered element) or defer. Say which.
3. **Both changed** → hand-resolve: main's structure wins for current markup; layer fork visual intent on top where it applies.
4. **Slice 6b is landed**: `plug-api/ui/{button,input,url_prefix_input,checkbox,badge}.tsx` and `client/components/basic_modals.tsx` now render `<m3e-button>`, `<m3e-form-field>`, `<m3e-checkbox>`, `<m3e-chip>`, `<m3e-dialog>`. Main's rules for the OLD native markup of those components may be dead (but native `<button>`/`<input>` still render elsewhere — grep). Fork rules targeting m3e elements may now be LIVE — check tag/token names against `node_modules/@m3e/web/dist/*.js`.
5. Every CSS custom property referenced must be defined (theme.scss, `_tokens.scss`, colors.scss, tailwind vendor, or m3e tokens). If you drop a token definition, prove zero consumers across `client/`, `plug-api/`, `plugs/`, `libraries/` (incl. `.lua`/`.md` Space Lua CSS).
6. Comments short and documentary; no tombstones, no reconciliation essays.

## Constraints
- Scope: the 8 SCSS files only. If a style fix strictly needs a TSX class hook, report it instead of making it (core-shell slice owns TSX). `_tokens.scss` is out of scope unless a token you keep is genuinely undefined without it — then say so.
- Commit per file (or small group) as each resolves and compiles; run the full gate at the end; commit fixes.
- Everything in builder-common applies (no push/merge/stash/force, no AskUserQuestion, report format).

## Suggested skills
`m3e`, `coding-preferences`, `playwright-e2e-conventions`, `verification-before-completion`.

## Frictions
Log via `~/.claude/signals/pain/log-friction.sh` (see `~/.claude/signals/pain/README.md`), or list under `## Frictions` in your final report.
