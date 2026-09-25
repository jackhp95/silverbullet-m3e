# Builder brief — slice spaces-v2 (`client/spaces_ui/**` m3e reskin, entry-point registration)

Orchestrator: Paseo `34f4d0d3` (understudy for `7fec1afd`), 2026-09-24. Plan: [`docs/plans/2026-09-23-m3e-fork-main-reconciliation.md`](../2026-09-23-m3e-fork-main-reconciliation.md) §4 item 6 (read the `reconcile/slice-6-spaces` and `slice-6b-registration` paragraphs closely), §5. Shared rules (hazards, gate, git discipline, report format — **mandatory, read first**): [`scripts/reconcile/builder-common.md`](../../../scripts/reconcile/builder-common.md).

## Task — implement
Port the fork's (Stream B tip `4cfc3763`) m3e reskin of the multi-space admin / setup / login UI onto `main`'s current `client/spaces_ui/**`, keeping all of main's business logic (SSO/OIDC, section-nav, git-sync, revisions, member-access). Register every `@m3e/web/*` element these bundles render ONCE in the browser-only entries (`client/spaces_ui/{spaces,setup,central,auth}.tsx`), never in a file loaded by a vitest test. Gate, commit.

## Scope (fork-vs-main differing files, verify with `git diff main 4cfc3763 -- <path>` and `git log 2b2a7c719bb..4cfc3763 -- <path>`)
`client/spaces_ui/FolderPicker.tsx`, `space_fields.tsx`, `spaces.tsx`, `setup.tsx`, `central.tsx`, `auth.tsx`, `components/{App,LoginForm,SpaceEditor,SpaceForm,SpaceList,SpaceLogin,UsersView,ConfirmDialog}.tsx`, `components/wizard/{AdminStep,SpaceStep}.tsx`; e2e specs `e2e/{admin-spaces,auth-first-load,multi-space-admin,setup-wizard}.test.ts` (port fork assertions onto main's specs only where they test reskin that you land; keep main's own coverage).

Out of scope: `plug-api/ui/alert.tsx` (stays deferred pending Jack: inline banner vs toast — do not swap it; spaces_ui `<Alert>` consumers stay as-is). `plug-api/ui/tabs.tsx` (plugui slice). `client/styles/*.scss` (styles slice — if you need a style, prefer Tailwind utilities at the call site, which is the fork's own pattern).

## Point-in-time state (captured 2026-09-24 ~20:10Z — re-verify before acting)
- Worktree `/Users/jack/Documents/code/sb-slice-spaces-v2`, branch `reconcile/slice-spaces-v2`, rebased onto `main` @ `49021d64`.
- One commit on top: `checkpoint(slice-spaces-v2): WIP left by builder killed at usage limit (ungated)` — a previous builder's in-progress work, committed verbatim by the orchestrator so it can't be lost: 6 files (`FolderPicker.tsx`, `components/ConfirmDialog.tsx`, `components/UsersView.tsx` (API-token list → `m3e-list`, ConfirmDialog-based delete confirm), `setup.tsx` + `spaces.tsx` (register `@m3e/web/{dialog,list,breadcrumb}`), `space_fields.tsx`). **Continue from it** — review it critically (it was never compiled or tested), keep what's right, fix what isn't. Don't restart from scratch.
- Known prior finding: per-file `@m3e/web/*` self-imports in `UsersView.tsx`/`SpaceForm.tsx` crash `UsersView.test.ts`/`SpaceForm.test.ts` (`document.createTreeWalker is not a function`). Entry-point registration is the fix shape; confirm every tested file you touch has NO `@m3e/web` import (direct or transitive via an import chain the test loads).
- 5 real browser bundles (see `build/build_client.ts` entryPoints): `client/editor_ui.tsx`, `client/spaces_ui/{spaces,setup,central,auth}.tsx`. `auth.tsx` renders `SpaceLogin` → `LoginForm` — missing a registration there broke `device-authorization`/`encryption` e2e once already.

## Goals + acceptance
- Each fork reskin in scope is either landed (m3e element renders styled, registered in every bundle that renders it) or explicitly deferred with a reason.
- Full gate green vs baseline (check/unit/lint exit 0; e2e no NEW failures vs 43 pass / 1 known `git.test.ts:101`). Specifically confirm `accounts`, `administration`, `device-authorization`, `encryption`, `setup`, `http`, `access-isolation`, `multi-space*`, `admin-spaces` e2e pass.
- Playwright: a spec (ported or new) that asserts the reskinned elements render as upgraded custom elements (e.g. `customElements.get("m3e-list")` defined and the element has a shadowRoot) on the admin users page and the setup wizard folder picker. Screenshots 411×761 + 1280×800 of admin spaces list, users view, setup wizard, login page → `/tmp/slice-spaces-v2-shots/`, LOOKED at.

## Constraints
Everything in builder-common. Commit each verified step. No push/merge/stash/force; no AskUserQuestion — conservative default + list decisions in report.

## Suggested skills
`m3e`, `coding-preferences`, `playwright-e2e-conventions`, `verification-before-completion`.

## Frictions
Log via `~/.claude/signals/pain/log-friction.sh` (see `~/.claude/signals/pain/README.md`), or list under `## Frictions` in your final report.
