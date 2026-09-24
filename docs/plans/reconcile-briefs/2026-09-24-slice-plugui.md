# Builder brief — slice plugui (`plug-api/ui/tabs.tsx` + configuration-manager / object-graph plug UI)

Orchestrator: Paseo `34f4d0d3` (understudy for `7fec1afd`), 2026-09-24. Plan: [`docs/plans/2026-09-23-m3e-fork-main-reconciliation.md`](../2026-09-23-m3e-fork-main-reconciliation.md) §1 (Stream B "Component migrations"), §4 items 3 and 6 (`slice-6b-registration`), §5. Shared rules (hazards, gate, git discipline, report format — **mandatory, read first**): [`scripts/reconcile/builder-common.md`](../../../scripts/reconcile/builder-common.md).

## Task — implement
1. **Tabs → `m3e-tabs`/`m3e-tab`** (fork `664a4d53`): port `plug-api/ui/tabs.tsx` onto main's current version. Find EVERY real JSX consumer of `Tabs` on main (`git grep -n "Tabs" -- client plug-api plugs libraries`), and make sure `@m3e/web/tabs` is registered in each consumer's browser bundle: plug UI panels (`plugs/*/ui/`) are separate iframe bundles that self-import per consumer (keep that convention — see `libraries_tab.tsx`'s existing `@m3e/web/*` imports); client bundles register at their entry (`client/editor_ui.tsx`, `client/spaces_ui/{spaces,setup,central,auth}.tsx`) — never in a file loaded by a vitest test. Splice only the `Tabs` test block of `plug-api/ui/ui.test.ts` from `4cfc3763` (other blocks stay main's; Progress/Checkbox/Badge/Button/Input already landed).
2. **configuration-manager UI** (`plugs/configuration-manager/ui/components/{configuration_tab,libraries_tab}.tsx`, `configuration.scss`): port the fork's m3e reskin (incl. fork `b1e51b7f`'s fix for 2 missed consumers + the double-dismiss bug) onto main's current files, keeping main's logic.
3. **object-graph UI** (`plugs/object-graph/ui/components/{header,sidebar,graph_canvas}.tsx`, `object-graph.scss`): port only the fork's side of the diff (check `git diff 2b2a7c719bb3546df8c78ddeaf95256535ee2dd3 4cfc3763 -- plugs/object-graph` — the two-dot main↔fork diff also contains main's own newer changes, which you must keep).
4. e2e: port `e2e/configuration-manager-m3e.test.ts` from `4cfc3763`, fixing selectors to main's real markup.

Out of scope: `plug-api/ui/alert.tsx` (deferred pending Jack's inline-banner-vs-toast call — do NOT swap it). `client/styles/*.scss` (styles slice). Core-shell files (`client/editor_ui.tsx` except adding one registration import if a client-side Tabs consumer exists — if so, say so in the report since core-shell will also edit that file).

## Point-in-time state (captured 2026-09-24 ~20:10Z — re-verify before acting)
- Worktree `/Users/jack/Documents/code/sb-slice-plugui`, branch `reconcile/slice-plugui` @ `main` `49021d64`, no commits of its own — a prior dispatch never produced any work. Start fresh.

## Goals + acceptance
- Tabs renders as an upgraded `m3e-tabs` everywhere it's used on main (assert in Playwright: element defined via `customElements.get`, has shadowRoot, clicking a tab switches the panel — preserve keyboard/ARIA behavior main had).
- Full gate green vs baseline (check/unit/lint exit 0; e2e no NEW failures vs 43 pass / 1 known `git.test.ts:101`). Ported `configuration-manager-m3e` spec passes.
- Screenshots 411×761 + 1280×800 of the configuration manager (each tab) and the object graph panel → `/tmp/slice-plugui-shots/`, LOOKED at.

## Constraints
Everything in builder-common. Commit each verified step. No push/merge/stash/force; no AskUserQuestion — conservative default + list decisions in report.

## Suggested skills
`m3e`, `coding-preferences`, `playwright-e2e-conventions`, `verification-before-completion`.

## Frictions
Log via `~/.claude/signals/pain/log-friction.sh` (see `~/.claude/signals/pain/README.md`), or list under `## Frictions` in your final report.
