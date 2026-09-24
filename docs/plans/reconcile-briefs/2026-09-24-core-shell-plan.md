# Planner brief — core-shell decomposition (design-bearing; DO NOT write product code)

Orchestrator: Paseo `34f4d0d3` (understudy for `7fec1afd`), 2026-09-24. Plan: [`docs/plans/2026-09-23-m3e-fork-main-reconciliation.md`](../2026-09-23-m3e-fork-main-reconciliation.md) — read all of it; §4 items 4–6 and §5 matter most. Shared builder rules (the hazards your slices must respect): [`scripts/reconcile/builder-common.md`](../../../scripts/reconcile/builder-common.md).

## Task — investigate + plan (DO NOT edit product code)
Decompose the remaining "core shell" reconciliation — the fork's (Stream A `c77ccb1d` + Stream B tip `4cfc3763`) changes to the editor shell that haven't landed on `main` — into an ordered set of atomic build slices, each with a cheap acceptance test. A previous Plan agent did this and its output was lost; redo it from the code.

Write the result as a committed plan doc `docs/plans/2026-09-24-core-shell-decomposition.md` in your worktree (commit it on your branch; the orchestrator lands it). That doc is your deliverable; your final message must restate its slice table and decisions in full.

## Scope — fork-changed files still differing from `main` (computed 2026-09-24; re-verify)
Core: `client/editor_ui.tsx`, `client/client.ts`, `client/components/top_bar.tsx` (+`top_bar.test.ts`), `client/content_manager.ts`, `client/editor_commands.ts`, `client/components/filter.tsx`, `client/components/panel.tsx`, `client/reducer.ts` (+test), `client/types/ui.ts`, `client/navigator.ts`, `client/style.ts`, `client/styles/_tokens.scss`, `client/markdown_renderer/markdown_render.ts`, `client/lib/recency.ts`.
Frontmatter (Jack decided: Stream B raw-YAML card at `4cfc3763`, NOT V5b's structured editor): `client/components/front_matter_panel.tsx` (+test), `client/lib/frontmatter_yaml.ts` (+test), `client/codemirror/frontmatter_folding.ts` (+test), `client/codemirror/frontmatter.ts`, `client/codemirror/editor_state.ts` (`frontMatterSyncExtension`, `PAGE_SCROLL_CONTAINER_ID`).
Other codemirror churn: `client/codemirror/{admonition,code_copy,fenced_code,footnote,html_widget,inline_content,list,lua_widget,table,task,top_bottom_panels}.ts` — plan §2b calls some of these "incidental find-replace churn"; classify each (real reskin intent vs noise vs main-superseded).
Features to place: floating toolbar (`floating_toolbar.tsx` landed in slice 2 but unwired), large app bar + title wrap/shrink (Stream B `f3c324e8`/`e5067ec2`/`9fa038d2`), side-panel `m3e-drawer-container`, sync progress indicator, linked-mentions `m3e-card`, theme accent color → m3e-theme seed (`df3895f0`), slash-menu autocomplete tokens (`5ba1d8a9`), tag pills, `showPanel("modal")` → `m3e-dialog` (Stream B `78d19733`), `#sb-page-scroll` refactor, push toggle app-bar button (seam provided by the push slice: `readPushState`/`togglePush` in `client/push_toggle.ts`).
e2e specs from the fork to port/retire: `app-bar-leading-trailing`, `app-bar-title-responsive-size`, `basic-modals`, `floating-toolbar`, `linked-mentions-card`, `side-panel-drawer`, `slash-menu-autocomplete-m3e`, `sync-progress-indicator`, `tag-pills`, `theme-accent-color`, `visual-verification`, and the fork's edits to `guide-journaling`, `guide-knowledge-base`, `lua-completion`, `navigate-restore`, `page-navigation`, `page-picker`, `page-rename`, `tasks`, `wiki-links`. Dead: `search-sheet`, `navigation-sheet`, `appbar-frontmatter-scroll-snap`, `snackbar-*` (alert deferred).

## Decisions already made by Jack — do not re-litigate
Main's navigator `NavRoot` is THE search/picker UI (fork `search_sheet`/`search_modes`/`navigation_sheet`/`nav_views/*`, `anything_picker`/`command_palette` edits: permanently dead). Frontmatter = Stream B raw-YAML card. Scroll-snap removed entirely. `plug-api/ui/alert.tsx` deferred (inline banner vs `m3e-snackbar` toast — Jack's call pending).

## Parallel work you must not collide with (in flight 2026-09-24)
- `reconcile/slice-6-styles` — the 8 `client/styles/{_standalone,colors,components,editor,main,modals,theme,top}.scss` files; fork rules for not-yet-ported core-shell elements land there *inertly*. Your slices must say which SCSS they'll need to activate/adjust after styles lands.
- `reconcile/slice-spaces-v2` — `client/spaces_ui/**`.
- `reconcile/slice-push` — push command/SW/server version; adds `client/push_toggle.ts` and edits `client/client_system.ts`.
- `reconcile/slice-plugui` — `plug-api/ui/tabs.tsx`, plug UI panels; may add one registration import to `client/editor_ui.tsx`.

## What the decomposition must contain
1. **Inventory**: per file above, what the fork changed (by intent, citing commits via `git log 2b2a7c719bb3546df8c78ddeaf95256535ee2dd3..4cfc3763 -- <file>`), what main changed since merge-base, and the classification: port / port-adapted-to-main's-API / already-landed / dead / main-superseded.
2. **Architecture notes** where main's shape differs materially (e.g. `client.ts` 700+ lines of main churn — live collab, sync engine, revisions, keyed panels; `editor_ui.tsx` navigator docks). Name the exact main-side seams each port hooks into (method/type names, file:line).
3. **Slice table**, ordered, each slice: files, fork commits, dependencies on other slices, the `@m3e/web/*` registrations it needs (in `client/editor_ui.tsx`, the editor bundle entry), hazards (tested files that must not import `@m3e/web`, unregistered-element risk, main e2e specs it can break), and **a cheap acceptance test** (the specific Playwright assertion(s) + gate). Aim for slices a single builder can finish + gate in one session (roughly ≤ 6 product files each); mark which can run in parallel (disjoint files) vs must serialize (shared `editor_ui.tsx`/`client.ts`/`top_bar.tsx` — propose a serialization or a stacked-branch order).
4. **Open product decisions** for Jack, each with your recommended default (builders will implement the default).

## Point-in-time state (captured 2026-09-24 ~20:10Z — re-verify)
Worktree `/Users/jack/Documents/code/sb-core-shell-plan`, branch `reconcile/core-shell-plan` @ `main` `49021d64`. `m3e-fork` @ `3d7545e1` (deployed staging), cards tip `4cfc3763`, merge-base `2b2a7c719bb3546df8c78ddeaf95256535ee2dd3`. Read fork files via `git show 4cfc3763:<path>`; never check out other branches in this worktree.

## Constraints
Read-only on product code. Only write/commit the one plan doc on your branch. No push/merge/stash/force; no AskUserQuestion. Don't run the e2e gate (not needed for a plan). Your final message IS the deliverable — restate the full slice table and decisions, never "see above".

## Suggested skills
`writing-plans`, `codebase-design`, `m3e`, `coding-preferences`.

## Frictions
Log via `~/.claude/signals/pain/log-friction.sh` (see `~/.claude/signals/pain/README.md`), or list under `## Frictions` in your final report.
