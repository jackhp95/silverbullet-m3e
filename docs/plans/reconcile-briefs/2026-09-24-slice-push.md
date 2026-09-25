# Builder brief — slice push (Web Push UI, service worker, PWA single-reload, server version convergence)

Orchestrator: Paseo `34f4d0d3` (understudy for `7fec1afd`), 2026-09-24. Plan: [`docs/plans/2026-09-23-m3e-fork-main-reconciliation.md`](../2026-09-23-m3e-fork-main-reconciliation.md) §1 (Web Push row), §4 items 1, 2 (the Rust-files note), 6 (`slice-6-boot` paragraph), §5. Shared rules (hazards, gate, git discipline, report format — **mandatory, read first**): [`scripts/reconcile/builder-common.md`](../../../scripts/reconcile/builder-common.md).

## Task — implement
Finish reconciling the fork's Web Push + PWA-update work onto `main`:
1. **Push subscribe UI** — the fork's subscribe toggle, decoupled from the not-yet-ported core shell (app bar / floating toolbar belong to the core-shell slice): expose it as a command (`Push Notifications: Toggle`) wired through `ClientSystem`, reusing `client/lib/push_subscribe.ts` + `client/lib/push_ui.ts`. Leave a clean seam (`readPushState`/`togglePush`) the core-shell slice can later bind an app-bar button to.
2. **Service worker** — reconcile `client/service_worker.ts` with the fork's push/notificationclick + single-reload intent, against main's current SW (slice 2 already landed some push handlers — diff before adding anything; don't double-register listeners).
3. **PWA single reload** (fork `4675fab0`) — `client/boot.ts`'s `controllerchange` reload-once logic already landed in slice 6-boot (`526e94e0`); verify what's still missing (SW side, server version check) and land only that.
4. **Server version convergence** (fork `4ba909d0` "converge the client-reload version check via a Dynamic server version"): `bin/silverbullet/src/{embed,multi,single}.rs`, `server/src/{state.rs,multi/instance.rs,multi/manager.rs}`. Main has its own independently-evolved `embed.rs`/`ServerVersion`; slice 2 reverted these to main's version rather than risk it. Decide from the code whether main already solves the same problem (then land nothing and explain) or port the fix onto main's shape. Add `cargo test -p silverbullet` (and `-p silverbullet-server` or whatever the server crate is named — check `Cargo.toml`) to your gate if you touch Rust.
5. e2e: port `e2e/push-notifications.test.ts` and `e2e/pwa-update-single-reload.test.ts` from `4cfc3763` (fix selectors to main's markup; the push spec is expected to skip when the bundle has no push config, per fork `40c6c1a1`).

## Point-in-time state (captured 2026-09-24 ~20:10Z — re-verify before acting)
- Worktree `/Users/jack/Documents/code/sb-slice-push`, branch `reconcile/slice-push`, rebased onto `main` @ `49021d64`.
- One commit on top: `checkpoint(slice-push): WIP left by builder killed at usage limit (ungated)` — the previous builder's in-progress work, committed verbatim by the orchestrator: new `client/push_toggle.ts` (the command + `readPushState`/`togglePush`), `client/lib/push_ui.ts` (+78 lines), `client/client_system.ts` (`registerPushCommands`). **Continue from it** — review critically (never compiled/tested), keep what's right. Items 2–5 above appear not started.
- Fork commits in scope: `36487be8`, `5b312f64`, `4675fab0`, `40c6c1a1`, `4ba909d0` (and the push_ui extraction in `7c776716` — ignore its search_modes/NavListRow parts, dead/landed).
- `build/build_client.ts` `patchPushConfig()` and `BootConfig.vapidPublicKey`/`pushSidecarUrl` already landed in slice 6-boot.

## Goals + acceptance
- Unit tests for any pure logic you add/change (`push_ui.ts` has a test sibling pattern in the fork — check `git show 4cfc3763 --stat`-style for `*.test.ts`).
- Full gate green vs baseline (check/unit/lint exit 0; e2e no NEW failures vs 43 pass / 1 known `git.test.ts:101`), plus cargo tests if Rust touched. The ported `pwa-update-single-reload` spec must actually run and pass (not skip); `push-notifications` may skip only via its explicit no-config guard — report which.
- Mutation check: for the single-reload spec, show it fails when the reload-once guard is removed (revert one line, run, confirm red, restore).

## Constraints
Everything in builder-common. Do not touch `client/editor_ui.tsx`, `top_bar.tsx`, `floating_toolbar.tsx` (core-shell slice). Don't deploy; don't touch nix-homelab, DNS or the push sidecar infra. Commit each verified step.

## Suggested skills
`coding-preferences`, `playwright-e2e-conventions`, `verification-before-completion`.

## Frictions
Log via `~/.claude/signals/pain/log-friction.sh` (see `~/.claude/signals/pain/README.md`), or list under `## Frictions` in your final report.
