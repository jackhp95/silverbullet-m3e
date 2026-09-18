---
title: Journal-driven content synthesis — implementation plan (dry-run-gated)
date: 2026-09-17
kind: synthesis
fidelity: stated
sensitivity: personal
source_repo: silverbullet-m3e
tags: [silverbullet, m3e, journal, agentic, spec, plan]
---

# Journal-driven content synthesis — implementation plan

> **Plan only. No code lands from this doc directly.** Implements the
> recommendation in
> [`docs/plans/2026-09-17-journal-synthesis-pipeline-research.md`](2026-09-17-journal-synthesis-pipeline-research.md)
> (read that first — architecture below is LOCKED by it, not re-derived) plus
> Jack's 2026-09-17 dry-run-gate decision layered on top. Every path/line
> number cited below was verified against the actual files on disk during
> planning (not assumed from the research doc's own citations) — see
> Appendix.

**Goal:** Jack tags a journal free-write line `#queue/synth`; an idle-triggered
host daemon notices, runs the existing `journal-agent.mjs` pipeline against a
**local** LiteLLM-routed model to classify+route it, and composes the exact
writes it would make (contact / event / todo / research / note) as a
**reviewable proposal artifact** — without touching Jack's real contacts,
tasks, or notes. A separate, explicitly gated script applies an approved
proposal for real. Push + AI-daily-log summary fire either way (existing
mechanism, reused verbatim). Every classify failure — malformed output or an
unreachable backend — is bounded-retried, then surfaced as a friction for
Jack's morning review rather than silently dropped or infinitely retried.

**Architecture:** External idle-debounce daemon on the SB host does two jobs
per idle pass: (1) `git commit` the space as a backup, (2) invoke the journal
pipeline in dry-run mode. The pipeline reuses `journal-agent.mjs`'s
WATCH/ROUTE/WRITE-BACK/NOTIFY machinery almost entirely as-is; the real
deltas are the trigger gate (marker-scoped, not continuous), the CLASSIFY
backend (a **local**-only LiteLLM proxy already live on this fleet, reached
via **constrained JSON + schema validation, not tool-calling** — local models
measured 0/8 on structured tool-calling, so the routing contract is
parse-and-validate a plain-JSON reply), and a new bounded-retry/friction path
for classify failures. A new module boundary
(`pipeline/journal-synth-proposal.mjs`) owns "compose but don't write";
another new module (`pipeline/journal-synth-apply.mjs`) is the ONLY code path
in the whole system allowed to write to a real destination page, and it is
never invoked by the daemon — only by Jack, by hand, with an explicit
`--confirm` flag. A third new module
(`pipeline/journal-synth-friction.mjs`) is the ONLY code path allowed to write
to `~/.claude/signals/pain/agent/` — it fires when the bounded retry budget
for a line is exhausted, and it dovetails directly with the dry-run gate: a
failed synthesis surfaces as a friction/notification, **never** a bad write.

**Tech stack:** Node.js (`.mjs`, `node:test`), the existing
`workspace/knowledge-substrate/` connector idiom (injectable `sbfs`/`clock`/
`fetch`, pure functions + thin effectful shells), the **already-live** LiteLLM
proxy at `https://litellm.fox.peterson.place` (privacy-first: local Ollama
backends on the tailnet only, journal content never leaves the tailnet),
`fs.watch` + `git` CLI for the daemon, VAPID push (already built, reused
unmodified), the existing `~/.claude/signals/pain/` friction pipeline (Schema
A, per the `friction-lifecycle` skill / harness-OKF `frictions` page).

---

## 0. Terminology reconciliation (read before the leaves — resolves 3 ambiguities in the feature brief)

1. **"the day's notifications page" = the existing "🤖 AI daily log" section
   of `journal/<date>`.** Verified there is no separate wiki page called
   "Notifications" — `client/components/nav_views/notifications.tsx` in this
   fork is a **client-side push-subscribe UI toggle** (2026-09-17 nav-bar
   redesign, leaf N9), not a content page. `runNotifyStep`
   (`journal-agent.mjs:602–648`) already appends exactly the summary line the
   brief asks for, via `appendAiDailyLogLine`. No new page type needed —
   flagged here only because the name-collision would otherwise cause a
   second artifact to get built by mistake.
2. **"event → calendar" and "todo → to-do list" are NOT two schemas.** This
   SB space has no `calendar` zone/tag/kind anywhere (grepped `docs/CONFIG.md`
   + the whole `workspace` tree — zero hits beyond unrelated M3E `Calendar`
   *component* docs). Both route through the **same** existing task system
   (`knowledge/tasks/`, `task-tools/verbs.mjs`'s `propose()`), differentiated
   only by a `category` field — exactly the pattern `add-event` already uses
   (`journal-agent.mjs:524–547`, `category: "event"`, because
   `TASK_TYPE_ENUM` — `task-page.mjs:21–23` — has no `event`/`todo` member and
   this repo's own PR-3 precedent explicitly chose "land on real upstream
   conventions" over inventing new enum values, per the 2026-09-16 spec's
   tracker). §3 below adds `add-todo` as `category: "todo"` on the same
   `propose()` call shape — zero new enum surface.
3. **Two independent review gates, not one.** Jack's 2026-09-17 decision
   ("dry-run before any real mutation") and `task-tools`'s existing
   `propose()`→`accept()` gate are **different granularities**, both kept:
   the dry-run proposal artifact answers "should the pipeline attempt this
   line at all"; `propose()`'s `status: "proposed"` (for event/todo) answers
   "should this specific task be accepted," using Jack's already-daily task
   workflow. Contact/research drafts have no second gate today (Jack promotes
   a draft page by hand) and none is added here — consistent with existing
   behavior in `buildContactDraft`/`buildResearchDraft`.
4. **"Report as a friction to address in the morning" (2026-09-17 model
   decision) reuses the existing `~/.claude/signals/pain/agent/` Schema-A
   pipeline verbatim** (`okf/harness-okf/knowledge/frictions.md`), not a new
   bespoke mechanism. That pipeline is written for LLM-agent-session
   reporters (`reporter: subagent:<label>`, plus `model`/`effort` fields
   scoped to an agent turn); `journal-agent`/the daemon is a cron-style
   script, not an agent session, so §7.5 documents this as a **deliberate,
   transparent adaptation** of the schema (`reporter: subagent:journal-agent`,
   `effort: "n/a"`) rather than a silent misuse of it.

---

## 1. REUSED vs NEW — critical files

| Path | Status | Role |
|---|---|---|
| `workspace/knowledge-substrate/pipeline/journal-agent.mjs` | **REUSE** (modified) | WATCH/section-parse/ledger/NOTIFY all reused verbatim; `diffJournalPage`, `CLASSIFY_ENUM`, `preFilterHints`, `classifySegment`, `routeIntent`, `runPipeline`, `main()` all get targeted edits (§3–§6) |
| `workspace/knowledge-substrate/pipeline/journal-agent.test.mjs` | **REUSE** (extended) | 35 existing tests stay green; new tests appended per leaf |
| `workspace/knowledge-substrate/lib/sbfs.mjs` | **REUSE** (unmodified) | `/.fs` read/write/list contract — the only write path to real SB pages, used by both dry-run's proposal-artifact write and live-apply's real-destination write |
| `workspace/knowledge-substrate/lib/taxonomy.mjs` | **REUSE** (unmodified) | `ZONES`, `KINDS`, `pagePath()`, `validate()`, `stringify()`/`parse()` for the new proposal-artifact page |
| `workspace/knowledge-substrate/lib/scrub.mjs` | **REUSE** (unmodified) | `findLeaks()` gate on research-intent outbound query, unchanged |
| `workspace/knowledge-substrate/task-tools/verbs.mjs` | **REUSE** (unmodified) | `propose()` — both `add-event` and new `add-todo` call it identically, differing only by `category` |
| `workspace/knowledge-substrate/task-tools/task-page.mjs` | **REUSE** (unmodified) | `TASK_TYPE_ENUM`/`ACTIVE_STATUSES` — confirmed no `event`/`todo` member exists or is needed (§0.2) |
| `workspace/knowledge-substrate/push/server.mjs`, `push/send.mjs`, `push/config.mjs` | **REUSE** (unmodified) | VAPID sidecar, `POST /push/send` — `sendPushNotification` in `journal-agent.mjs:587–600` already calls it |
| `workspace/knowledge-substrate/lib/git-checks.mjs` | **REUSE** (unmodified) | Injectable-`runGit` idiom copied for the new backup-commit module (it has no commit function itself — read-only predicates only, confirmed by full read) |
| `workspace/knowledge-substrate/lib/git-backup.mjs` | **NEW** | §6 — `commitIfDirty(runGit, {repo, message})`, same injectable-`runGit` shape as `git-checks.mjs` |
| `workspace/knowledge-substrate/lib/git-backup.test.mjs` | **NEW** | tests for the above |
| `workspace/knowledge-substrate/pipeline/journal-synth-proposal.mjs` | **NEW** | §4 — pure composers + proposal-artifact writer; the dry-run half of the mode split |
| `workspace/knowledge-substrate/pipeline/journal-synth-proposal.test.mjs` | **NEW** | tests for the above |
| `workspace/knowledge-substrate/pipeline/journal-synth-apply.mjs` | **NEW** | §5 — **the only file allowed to write a real destination page for synth intents**; CLI-gated, never daemon-invoked |
| `workspace/knowledge-substrate/pipeline/journal-synth-apply.test.mjs` | **NEW** | tests for the above |
| `workspace/knowledge-substrate/pipeline/journal-synth-friction.mjs` | **NEW** | §7.5 — **the only file allowed to write to `~/.claude/signals/pain/agent/`**; builds + writes the Schema-A friction report when a line's classify-retry budget is exhausted |
| `workspace/knowledge-substrate/pipeline/journal-synth-friction.test.mjs` | **NEW** | tests for the above |
| `workspace/knowledge-substrate/pipeline/journal-watch-daemon.mjs` | **NEW** | §6 — idle-debounce daemon: backup-commit + dry-run pipeline invocation |
| `workspace/knowledge-substrate/pipeline/journal-watch-daemon.test.mjs` | **NEW** | tests for the above (fake timers, fake `runGit`) |
| `workspace/knowledge-substrate/pipeline/journal-watch-state.json` | **REUSE** (schema extended) | ledger — `status` enum grows from `{done}` to `{done, proposed, failed}`, plus a new per-line `attempts` counter (§3, §7.5) |
| `config/litellm/config.yaml` (this `workspace` repo, read-only doc mirror of the real nix-homelab-deployed config) | **REUSE** (unmodified, read as ground truth) | confirms the real live LiteLLM proxy's model aliases (`local-fast`, `local-heavy`) — no new proxy stood up, §2/§7 |
| `scripts/pi-ollama-models-sync.mjs` | **REUSE** (unmodified, read as ground truth) | confirms the real proxy's base URL (`https://litellm.fox.peterson.place`) and `auth=false` contract, §2/§7 |
| `workspace/knowledge-substrate/package.json` | **MODIFY** | add `journal-synth-apply`/`journal-watch-daemon` to the `test` glob if new dirs are used (they aren't — same `pipeline/*.test.mjs` glob already covers new files); add npm scripts `synth-apply`, `synth-daemon` |

No file in `silverbullet-m3e` (this repo) is touched by this feature — confirmed
by the research doc (`journal-agent.mjs` and everything above lives in the
sibling `workspace/knowledge-substrate/` repo) and by this plan's own file
list. This repo's push client-side pieces (`client/service_worker.ts`,
`nav_views/notifications.tsx`) are already-shipped dependencies, not touched.

---

## 2. Config decisions — flagged, with proposed defaults

These need Jack's confirm (or silent accept-the-default) before the daemon
leaf (§6) can go live; everything through §5 (dry-run + live-apply *code*,
not its *use*) can build without waiting on them.

| Decision | Status | Value | Why |
|---|---|---|---|
| **Backend locality** | **DECIDED (Jack, 2026-09-17)** | **Local only.** Journal content is personal; it must never leave the tailnet. No cloud fallback of any kind for classify — a `research` intent's outbound web query still goes through `scrub.mjs`'s existing gate (§0/§4.6 of the research doc), unchanged. | Privacy-first, Jack's explicit instruction |
| **LiteLLM endpoint** | **DECIDED — already live, nothing to stand up** | `https://litellm.fox.peterson.place/v1` (OpenAI-compatible `/v1/chat/completions`, `/v1/models`). Verified real via `config/litellm/config.yaml` (this repo's read-only doc mirror of the actual nix-homelab-deployed config) + `scripts/pi-ollama-models-sync.mjs:15–20,40` (`ROUTER_BASE`, confirmed live 2026-09-05 per that config file's own header). `auth: false` by design — send a truthy placeholder API key (`"not-needed"`, matching `pi-ollama-models-sync.mjs:139`'s exact convention), no real credential to manage. Env override `LITELLM_BASE_URL`, same convention as `DEFAULT_OLLAMA_BASE_URL` (`journal-agent.mjs:103`). | Reuse, don't stand up new infra — this proxy already fans across mushroompc/avetta/main-mac, all tailnet-only |
| **LiteLLM model alias** | **DECIDED — `local-heavy`, falls back within the alias itself** | `local-heavy` (`config/litellm/config.yaml:88–95`): primary backend `ollama/hf.co/deepreinforce-ai/Ornith-1.0-35B-GGUF:Q4_K_M` on avetta (35B, most headroom), LiteLLM-level fallback to `ollama/qwen3:14b` on mushroompc if avetta's unreachable. `local-fast` (`qwen3:8b`, fans mainmac+mushroompc) is the documented lower-latency alternative if `local-heavy`'s round-trip proves too slow for "at its own pace" cadence — not the default, since structured-JSON reliability matters more than latency here and this pipeline is explicitly non-urgent. Both aliases are **generate-only, no native tool-calling relied upon** (§7) — consistent with Jack's 2026-09-17 instruction and the original research §4.3's 0/8 tool-calling finding. | Bigger model = better constrained-JSON reliability; non-urgent workload tolerates avetta's serial-queue/sleep caveats |
| **Daemon host** | Proposed default, pending Jack confirm-or-silent-accept | Paseo workspace script on `jacks-macbook-pro` (same host as the live daily-driver SB instance) | Matches this fleet's already-standing supervised-long-running-process idiom (per Paseo orientation: "launchd is retired"); co-located with the space it watches, no network hop |
| **Backup-repo target** | Proposed default, pending Jack confirm-or-silent-accept | `git init` (if absent) directly inside the live space's own root directory, **local commits only, no remote push** | Simplest; matches obsidian-git's baseline mode (research §2.3) before remote-sync is added |
| **Idle threshold** | Locked by the brief | 5 minutes (`--idle-ms 300000`) | Explicitly stated in the task brief |
| **`#queue/synth` exact spelling** | Locked by the brief | `#queue/synth` | Matches research §5 recommendation and the brief |
| **Classify retry budget before friction** | Proposed default, pending Jack confirm-or-silent-accept | 3 attempts across separate daemon runs (`--max-classify-attempts 3`), plus 1 in-call repair-prompt retry per attempt (§7.5) | Balances "don't spam a friction for one sleepy laptop" against "don't retry forever and lose the entry" — avetta in particular is documented as often-asleep, so 1 attempt would false-positive on every idle pass it happens to be off |

---

## 3. Leaf: trigger-gate — marker scan + ledger status extension

**Depends on:** nothing (foundation).

**File:** `pipeline/journal-agent.mjs`.

- Add `hasSynthTag(text)`, mirroring `hasPingTag` (`journal-agent.mjs:221–223`)
  exactly:
  `export function hasSynthTag(sourceText) { return /(^|\s)#queue\/synth(\b|$)/.test(String(sourceText ?? "")); }`
- Modify `diffJournalPage` (`journal-agent.mjs:263–278`): the segment-emission
  loop currently emits every non-`done` Free-write line. Change the skip
  condition from `pageState.lines[hash]?.status === "done"` to
  `["done", "proposed", "failed"].includes(pageState.lines[hash]?.status)`,
  **and** add a second filter: only emit a segment when `hasSynthTag(text)`
  is true. This is the "continuous → gated" swap the research calls for (§4
  of the research doc). A `"failed"` line (§7.5) is skipped like `"done"`/
  `"proposed"` — it is terminal-until-Jack-intervenes, not silently
  re-attempted forever (§7.5's `resetFailedSegment` is the only way back to
  eligible). `notify_on_complete` stays computed from `hasPingTag` unchanged
  — the two tags are independent (`#ping` = "notify me", `#queue/synth` =
  "act on this"); a line can carry both, one, or neither.
- Add `markSegmentProposed(state, seg, extra)` next to `markSegmentDone`
  (`journal-agent.mjs:280–283`), identical shape but `status: "proposed"`.
  §7.5 adds a third sibling, `markSegmentFailed`. `markSegmentDone` stays the
  terminal state (used only by live-apply, §5, and by the `intent === "none"`
  short-circuit in `runPipeline`, `journal-agent.mjs:687–690`, which stays
  unchanged — a segment classified `none` is still terminally done, no
  proposal needed).
- The ledger line-entry shape (`journal-agent.mjs:280–283`'s
  `{status, at, ...extra}`) gains one more field used only by §7.5:
  `attempts` (integer, starts absent/0, incremented on every classify
  failure — malformed output or unreachable backend — across separate daemon
  runs). A line that classifies successfully on its first attempt never gets
  an `attempts` field at all — it's write-only for the failure path, so the
  common case's ledger entries stay exactly as small as they are today.
- Extend `CLASSIFY_ENUM` (`journal-agent.mjs:297`): add `"add-todo"` →
  `["add-contact", "add-event", "add-todo", "research", "note", "none"]`.
- Extend `preFilterHints` (`journal-agent.mjs:302–309`) with a todo heuristic
  that does NOT overlap the event date/time pattern already there — a bare
  imperative with no date token:
  `if (/\b(todo|to-do|need to|should|remember to)\b/i.test(text) && !/\btomorrow\b|\bon the \d|\d{1,2}(:\d{2})?\s?(am|pm)\b/i.test(text)) hints.push("add-todo");`
- Update `CLASSIFY_SYSTEM_PROMPT` (`journal-agent.mjs:311–318`, the Ollama
  path only — the LiteLLM path gets its own prompt in §6) to add the
  `add-todo` label and its rule: *"add-todo: a plain thing to do, no specific
  date/time attached (if it has a date/time, use add-event instead)."*

**Tests to add** (`journal-agent.test.mjs`):
- `hasSynthTag` positive (`"call the vet #queue/synth"`) and negative
  (`"call the vet"`, `"#synth"` alone, `"#queue/synth-extra"` word-boundary
  check) cases.
- `diffJournalPage` emits zero segments for a page whose Free-write lines have
  no `#queue/synth` tag, even though they're not `done`.
- `diffJournalPage` skips a line whose ledger status is `"proposed"` or
  `"failed"`, same as it already skips `"done"`.
- `CLASSIFY_ENUM` includes `"add-todo"`.
- `preFilterHints("need to call the vet #queue/synth")` includes `"add-todo"`
  but not `"add-event"`; `preFilterHints("call the vet tomorrow 3pm #queue/synth")`
  includes `"add-event"` but not `"add-todo"`.

---

## 4. Leaf: pure composers + dry-run/proposal mode

**Depends on:** §3 (needs `CLASSIFY_ENUM`'s `add-todo` and the `proposed`
ledger status).

**This is the leaf that makes Jack's decision structural**, not a comment.

### 4.1 Extract pure composers in `journal-agent.mjs`

`buildContactDraft` (`journal-agent.mjs:423–445`) and `buildResearchDraft`
(`journal-agent.mjs:448–477`) are **already pure** — no `sbfs` call inside
either. No change needed to them.

`routeNote` (`journal-agent.mjs:480–504`) and the `add-event` branch of
`routeIntent` (`journal-agent.mjs:524–547`) are **not** pure — they call
`sbfs.read`/`sbfs.write`/`propose()` inline. Split each:

- New pure export `composeNoteAppend({ page, lineNo, text, now, model, existingData, existingBody })` returning `{ path, content, data }` — same body-building logic as `routeNote`'s current lines 493–500, but taking the existing page's already-read `{data, body}` as parameters instead of calling `sbfs.read` itself. The caller (dry-run or live-apply) does the read.
- New pure export `composeTaskProposalFields({ text, lineNo, page, lineHash, category })` returning the exact object literal `routeIntent`'s `add-event` branch currently builds inline for `propose()`'s second argument (`journal-agent.mjs:535–545`), generalized with a `category` param instead of the hardcoded `"event"` string. `add-todo` calls this with `category: "todo"`; `add-event` keeps `category: "event"`. This does **not** call `propose()` — it only builds the args `propose()` would need. `propose()` itself does a `store.listTasks()` read for slug-collision/dedup, which is a read, not a mutation — safe to run at either dry-run or live-apply time; this plan runs it **only at live-apply time** (§5) so a dry-run pass never touches `knowledge/tasks/` at all, not even to check dedup, keeping the "no real-destination access whatsoever in dry-run" invariant absolute rather than "read-only real-destination access is fine."

### 4.2 New file `pipeline/journal-synth-proposal.mjs`

- `export function proposalArtifactPath(date)` → `pagePath("captures", \`journal-agent/proposals-${date}\`)` (mirrors `routeNote`'s existing `pagePath("captures", \`journal-agent/notes-${date}\`)` call, `journal-agent.mjs:482`).
- `export function renderProposalEntry({ intentRecord, composed, category })` → a pure markdown-block renderer producing one `##`-level entry per proposal: source link (reuse `provenanceLine`, `journal-agent.mjs:418–420`, exported for this), intent, target path, category (for tasks), and the **full composed content** the live-apply step would write (so Jack can read the exact page text/task fields before approving, not just a one-line description). For `note`, render a unified-diff-style "append preview" (existing body + `+` the new line) instead of full content, since the destination page may already have real content.
- `export function appendProposalArtifact(existingArtifactContent, entries, { date, now })` → pure function: if `existingArtifactContent` is `null` (first proposal of the day), build a fresh page (`kind: "capture"`, `fidelity: "llm-inferred"`, `sensitivity: "personal"`, `capture_state: "placeholder"`, `tags: ["draft", "needs-review", "synth-proposal"]`, per `taxonomy.mjs`'s real `KINDS`/`CAPTURE_STATE`/`SENSITIVITY` enums — verified `"capture"` is a valid `KINDS` member, `taxonomy.mjs:17–26`); else parse+append via `taxonomy.mjs`'s `parse`/`stringify` (same idiom `routeNote` already uses, `journal-agent.mjs:496–499`).
- `export async function routeIntentDryRun(intentRecord, deps)` — the dry-run dispatcher, one branch per intent, each branch calling the matching pure composer from §4.1/existing `buildContactDraft`/`buildResearchDraft` and returning `{ composed, category? }` for `renderProposalEntry` — **never calls `deps.sbfs.write` against the composed page's own target path**, only against the proposal-artifact path (batched once per `runPipeline` call in the orchestrator, not per-intent, to avoid N read-modify-writes of the same artifact page in one run — see §4.3).

### 4.3 Orchestrator change in `journal-agent.mjs`

`runPipeline` (`journal-agent.mjs:670–713`) gains a `{ mode = "dry-run" }`
option:

- When `classified.intent !== "none"` and not deferred: if `mode === "dry-run"`, call `routeIntentDryRun` instead of `routeIntent`; collect its `{composed, category}` into a per-run array (not written yet); call `markSegmentProposed` instead of `markSegmentDone`; the audit-trail line (`journal-agent.mjs:701–707`) changes verb: `"proposed"` instead of the intent name directly, e.g. `"14:32Z · journal-agent · PROPOSED add-todo → pending review"` (no real path exists yet to log).
- After the per-page segment loop, **once per run**: if any dry-run proposals were collected, read the day's proposal artifact (`sbfs.read(proposalArtifactPath(date))`), call `appendProposalArtifact`, write it back once (`sbfs.write`) — one write per day-page per run, not one per proposal.
- `mode === "live"` preserves **today's exact existing behavior** (calls `routeIntent`, `markSegmentDone`) — this is what §5's live-apply script uses internally when it re-runs classification-free routing for an already-approved proposal (see §5, it does NOT re-invoke `runPipeline` — that would re-classify via the LLM, non-deterministically; it replays the **already-composed** proposal instead).
- `main()`'s CLI (`journal-agent.mjs:719–768`) gains `--mode dry-run|live`, **default `"dry-run"`** — this is the load-bearing default-safety flip: today's `main()` has no mode concept and behaves like today's "live" once this lands, so the default MUST change to `dry-run` or every existing manual CLI invocation would suddenly start mutating real pages again silently. Document this default flip prominently in the file header comment (one line, per house style — no multi-paragraph comment blocks).

**Tests to add** (`pipeline/journal-synth-proposal.test.mjs` + additions to
`journal-agent.test.mjs`):
- `proposalArtifactPath("2026-09-17")` → `"captures/journal-agent/proposals-2026-09-17.md"`.
- `appendProposalArtifact(null, [...])` builds a fresh page with valid frontmatter (assert `validate(data, {path}).ok`).
- `appendProposalArtifact(existingContent, [...])` appends without dropping prior entries (round-trip via `parse`).
- `renderProposalEntry` for each of the 5 non-`none` intents produces a block containing the source line, the target path, and (for tasks) the `category`.
- `runPipeline({..., mode: "dry-run"})` on the `SAMPLE_JOURNAL`-shaped fixture (extended with a `#queue/synth` line) → asserts **zero writes** to `knowledge/contacts/*`/`knowledge/tasks/*` on the `FakeSbfs`, exactly one write to `captures/journal-agent/proposals-<date>`, and the ledger shows `status: "proposed"` not `"done"` for that line.
- `runPipeline({..., mode: "live"})` (no `mode` passed, or `mode: "live"` explicit) reproduces the **exact current 35-test behavior** unchanged — this is the regression guard proving the split didn't change live semantics.
- `main()` with no `--mode` flag defaults to dry-run — assert via the same zero-real-write check at the CLI level (existing CLI tests, if any, extended; if none exist today, add one using `--space-dir` against a temp dir).

---

## 5. Leaf: live-mutation (GATED leaf — the pause point)

**Depends on:** §4 (needs the proposal artifact + `"proposed"` ledger status
to exist).

**This is the leaf Jack reviews before it is ever wired to run
unattended.** Nothing downstream of this leaf (§6's daemon) is allowed to
call it.

**New file:** `pipeline/journal-synth-apply.mjs`.

- `export function findPendingProposals(state, { page })` — scans
  `state.pages[page].lines` for entries with `status: "proposed"` **only**
  (never `"failed"` — a failed line was never composed into a proposal in the
  first place, §7.5, so there is nothing here for `applyProposal` to apply;
  it stays invisible to this leaf entirely and only Jack's
  `resetFailedSegment` (§7.5) can bring it back into play), returns
  `[{ page, lineHash, ...extra }]`. Pure, read-only over the in-memory ledger
  object (the same shape `loadWatchState` returns).
- `export async function applyProposal({ page, lineHash }, deps)` — the
  **real** write path, one proposal at a time:
  1. Re-read the live journal page (`deps.sbfs.read(page)`), recompute
     `extractFreeWriteLines` + `lineHash` for the matching line. **If the
     recomputed hash doesn't match the stored `lineHash`** (Jack edited the
     line after proposing), abort this item with `{ ok: false, error:
     "source line changed since proposal — re-tag #queue/synth to re-propose"
     }` and do **not** touch the ledger — this is the drift-guard from §4.3's
     header note, made real.
  2. Re-run ONLY the deterministic composer for the proposal's already-known
     `intent` (stored in the ledger's `extra` from `markSegmentProposed`) —
     `buildContactDraft`/`buildResearchDraft`/`composeNoteAppend`/
     `composeTaskProposalFields` from §4.1 — **not** `classifySegment` again
     (classification is not re-run; the proposal already committed to an
     intent, and re-classifying could flip it non-deterministically between
     propose and apply, which is exactly the failure mode task-tools'
     `propose()`/`accept()` split and this whole plan's dry-run gate exist to
     prevent).
  3. Dispatch to the REAL write: `sbfs.write` for contact/research/note
     (identical call shape to today's pre-split `routeIntent`), or
     `propose({store, clock}, {...composeTaskProposalFields(...)})` for
     event/todo (this is where `task-tools`'s own `store.listTasks()`
     dedup-by-`dedup_key` check finally runs — see §4.1's note on deferring
     it here).
  4. On success: `markSegmentDone(state, {page, lineHash}, {intent, path})`
     (now truly terminal), append one AI-daily-log line:
     `"<hhmm>Z · journal-agent · APPLIED (live) · <intent> → <path>"`.
  5. On failure: leave ledger at `"proposed"` (not `"done"`), return the
     error — Jack can retry `applyProposal` for that item without re-tagging
     anything, as long as the source line hasn't drifted (step 1).
- CLI: `node pipeline/journal-synth-apply.mjs --space-dir <dir>|--sb-url <url> [--state <path>] --page journal/<date> [--all-pending | --line-hash <hash>] --confirm`
  - **`--confirm` is mandatory to write anything.** Without it, the script
    lists every pending proposal for the given page (or every page with any
    pending proposal, if `--page` is omitted) with its composed content, and
    exits 0 having written nothing — a second, CLI-level dry-run check, on
    top of the fact that this whole script is never auto-invoked.
  - `--all-pending` applies every pending proposal on the target page(s) in
    one run; `--line-hash` applies exactly one (for surgical approval of a
    single item out of a batch).

**Tests to add** (`pipeline/journal-synth-apply.test.mjs`):
- `findPendingProposals` returns exactly the `"proposed"`-status lines for a
  fixture ledger with a mix of `done`/`proposed`/absent statuses.
- `applyProposal` for each of the 5 intents performs the real write (assert
  the destination page now exists on `FakeSbfs` with the composed content)
  and flips the ledger to `"done"`.
- `applyProposal` on a drifted source line (mutate the journal page's text
  between propose and apply, so the recomputed hash differs) returns
  `{ok:false}` and leaves the ledger untouched at `"proposed"`.
- `applyProposal` for `add-event`/`add-todo` with a repeated `dedup_key`
  (simulating two proposals that resolved to the same underlying task) is a
  no-op per `propose()`'s existing dedup behavior — assert only one task page
  exists after both applies.
- CLI without `--confirm` writes nothing (assert `FakeSbfs`'s file set is
  unchanged before/after) but exits 0 and prints the pending list.

---

## 6. Leaf: watcher daemon — idle-debounce backup-commit + dry-run trigger

**Depends on:** §4 (needs dry-run mode to exist so the daemon has something
safe to call). Does **not** depend on §5 — the daemon never calls
`journal-synth-apply.mjs`.

### 6.1 `lib/git-backup.mjs` (new, mirrors `lib/git-checks.mjs`'s injectable-`runGit` shape)

- `export async function isDirty(runGit, { repo })` → wraps
  `git -C <repo> status --porcelain`, `{ ok: stdout.trim().length > 0, evidence }`.
- `export async function commitIfDirty(runGit, { repo, message })` → if
  `isDirty` is false, `{ ok: true, committed: false, evidence: "clean, no commit" }`;
  else runs `git -C <repo> add -A` then `git -C <repo> commit -m <message>`,
  returns `{ ok: code === 0, committed: true, evidence }`.
- `export async function ensureGitRepo(runGit, { repo })` → if
  `git -C <repo> rev-parse --git-dir` fails, runs `git -C <repo> init`; called
  once at daemon startup, matching §2's "init if not present" default.

### 6.2 `pipeline/journal-watch-daemon.mjs` (new)

- CLI: `node pipeline/journal-watch-daemon.mjs --space-dir <dir> [--idle-ms 300000] [--state <path>] [--litellm-url ...] [--push-url ...]`
  (a `--sb-url` live-space mode is a documented follow-up, not built here —
  `fs.watch` needs a local directory; a remote-`/.fs` space would need
  polling `list()` for mtimes instead, same `--space-dir` vs `--sb-url` split
  `journal-agent.mjs` already has for WATCH, §7 flags this explicitly as
  future work rather than silently only-half-building it).
- On startup: `ensureGitRepo`, then `fs.watch(spaceDir, {recursive: true}, onChange)`.
- `onChange` resets a single `setTimeout(idleMs)`; on fire:
  1. `commitIfDirty(runGit, {repo: spaceDir, message: `backup: ${clock.now()}`})`.
  2. Call `journal-agent.mjs`'s `main()`-equivalent pipeline entrypoint
     (import `runPipeline`/`listJournalPagesFromDir`/`loadWatchState`/
     `saveWatchState` directly, same as `main()` does internally) with
     **`mode: "dry-run"` hardcoded, not a flag** — the daemon structurally
     cannot run live mode; there is no CLI flag for it here, so "daemon
     always dry-run" isn't a convention that can be flipped by mistake, it's
     the absence of a code path.
  3. Log a one-line summary to stdout (proposals written, **frictions
     filed**, errors, push result) — daemon-level observability per the
     research's "plain logs" reliability argument for choosing an external
     daemon in the first place. A nonzero friction count in this log is the
     daemon-level signal that §7.5 fired, without needing to grep
     `~/.claude/signals/pain/` separately.
- Crash/restart: none built here beyond what the daemon-host decision (§2,
  Paseo workspace script) provides — workspace scripts are process-supervised
  already, so this file does not need its own retry/supervisor loop.

**Tests to add** (`pipeline/journal-watch-daemon.test.mjs`):
- `commitIfDirty`/`isDirty`/`ensureGitRepo` unit tests with an injected fake
  `runGit` (same fixture idiom as `lib/git-checks.test.mjs`).
- Idle-timer test using `node:test`'s fake timers (or a manually-injectable
  `setTimeout`/`clearTimeout` pair, matching the injectable-everything idiom
  used throughout this codebase): three rapid `onChange` calls within the
  idle window fire the idle handler exactly once, not three times.
- The idle handler invokes the pipeline with `mode: "dry-run"` — assert via a
  spy/fake that no real-destination write ever occurs, independent of §4's
  own dry-run tests (defense in depth: this test would catch a future edit
  that accidentally hardcodes `mode: "live"` in the daemon).

---

## 7. Leaf: LiteLLM local-model backend + constrained-JSON extraction + schema validation

**Depends on:** §3 (needs `add-todo` in `CLASSIFY_ENUM`). Independent of
§4/§5/§6 — can build in parallel with those; only `runPipeline`'s
`classifyOpts` wiring needs to agree on the final shape, and that shape
(`{backend, baseUrl, model, apiKey, fetch}`) is additive to the existing
`classifyOpts` object, not a breaking change to it.

**Superseded design note:** an earlier draft of this leaf specified LiteLLM
**tool-calling**. Jack's 2026-09-17 decision overrides that: local models
fail structured tool-calling (research §4.3, 0/8 measured), so this leaf uses
**plain constrained-JSON output, parsed and schema-validated by hand** — the
same "generate/classify-only behind deterministic scaffolding" posture the
2026-09-16 spec already established for the Ollama path, extended to cover
richer extraction instead of a single enum label.

**File:** `pipeline/journal-agent.mjs`.

- **Response contract** — the model replies with ONE JSON object, no markdown
  fences, no prose:
  `{"intent": "add-contact"|"add-event"|"add-todo"|"research"|"note"|"none", "title"?: string, "when"?: string, "query"?: string, "summary"?: string}`.
  Every field beyond `intent` is **advisory extraction only** — the
  deterministic composers in §4.1 still build their own page content from
  `text`/`page`/`lineNo` as they do today; a future leaf (research §6,
  "context-window upgrade") can start actually using `title`/`when`/`query`
  for richer drafts, but this leaf does not expand what the composers do with
  them, only what the model returns. This keeps the leaf's blast radius to
  "backend swap," not "also change what gets written."
- `export function tryParseSynthJson(raw)` — tolerant parse: strip a leading/
  trailing ```` ```json ````/```` ``` ```` fence if present (local models
  routinely wrap JSON in one despite instructions — a documented, expected
  quirk, not a bug to prompt-engineer away blindly), then `JSON.parse`.
  Returns `null` on any parse failure (mirrors `tryParseClassifyOutput`'s
  `journal-agent.mjs:320–327` null-on-invalid convention exactly).
- `export function validateSynthJson(parsed)` — hand-rolled, no new
  dependency (matches this codebase's existing no-schema-library convention,
  e.g. `taxonomy.mjs`'s `validate()`): `parsed.intent` must be a member of
  `CLASSIFY_ENUM`; every other field, if present, must be a string. Returns
  `{ok: true, value}` or `{ok: false, error}`.
- `export async function classifySegmentLiteLLM({ segment, hints, baseUrl, model, apiKey, fetch: f })`:
  POST `${baseUrl}/chat/completions` (OpenAI-compatible — the real live proxy
  at `https://litellm.fox.peterson.place/v1`, §2), body
  `{ model, messages: [...], temperature: 0 }` — **no `tools`/`tool_choice`
  param at all**, this is a plain chat completion. System prompt is the
  existing `CLASSIFY_SYSTEM_PROMPT` shape extended with the JSON-object
  contract above and the `add-todo` rule from §3, plus one added rule: *"Reply
  with ONLY the JSON object. No markdown code fence. No explanation."*
  Extract `choices[0].message.content`, run `tryParseSynthJson` →
  `validateSynthJson`. On failure (parse OR validate), **one in-call
  repair-prompt retry** — identical shape to `classifySegment`'s existing
  retry (`journal-agent.mjs:376–385`): append the bad assistant reply + a user
  turn naming the exact problem and re-stating the contract. If the retry
  also fails: return `{intent: "none", deferred: true, unreachable: false,
  reason: "invalid JSON after repair retry: <detail>"}` — **note the explicit
  `unreachable: false`**, this is a "model produced bad output" failure, not
  a "backend is asleep" failure, and §7.5 treats the two the same for
  retry-budget purposes but records the distinct reason.
- **Backend-unreachable path** (the `fetch` call itself throws — connection
  refused/timeout, e.g. avetta asleep and mushroompc's fallback also down):
  caught once, around the whole attempt, returns `{intent: "none", deferred:
  true, unreachable: true, reason: "unreachable: <err.message>"}`. **No
  in-call retry for this case** — an immediately-retried connection to a
  sleeping laptop wastes a request timeout for no gain; the retry that
  matters here is the across-run one in §7.5.
- `classifySegment`'s existing signature (`journal-agent.mjs:339–389`) gains
  a `backend: "ollama" | "litellm"` option, **default `"litellm"`** — Jack's
  2026-09-17 decision makes LiteLLM (routed to the local `local-heavy` alias,
  §2) the primary path, not a cloud-tool-calling swap. The direct-Ollama path
  is kept, not deleted, as a lower-level manual-override fallback (e.g.
  testing against `gemma4:latest` on this machine directly, bypassing the
  proxy) — both paths are equally local/private, this is purely about which
  HTTP surface is called.
- New env vars, same `DEFAULT_*` export convention as
  `DEFAULT_OLLAMA_BASE_URL`/`DEFAULT_MODEL` (`journal-agent.mjs:103–104`):
  `DEFAULT_LITELLM_BASE_URL = "https://litellm.fox.peterson.place/v1"`,
  `DEFAULT_LITELLM_MODEL = "local-heavy"` (§2 — both now have safe, real,
  already-live defaults; no more "no safe default" blocker).
- `main()`'s `classifyOpts` (`journal-agent.mjs:751–755`) gains
  `--backend ollama|litellm` (default `litellm`), `--litellm-url`,
  `--litellm-model`, `--litellm-api-key` (default `"not-needed"`, matching
  `pi-ollama-models-sync.mjs:139`'s exact convention for this same
  auth-disabled proxy — or `LITELLM_API_KEY` env, matching `SB_AUTH_TOKEN`'s
  existing env-or-flag convention at `journal-agent.mjs:745`).

**Tests to add** (`journal-agent.test.mjs`):
- `tryParseSynthJson` strips a ```` ```json ```` fence and parses; parses bare
  JSON with no fence; returns `null` on unparseable garbage.
- `validateSynthJson` accepts a minimal `{intent:"none"}`; rejects an
  out-of-enum `intent`; rejects a non-string extra field.
- `classifySegmentLiteLLM` with a fake `fetch` returning a well-formed
  `{"intent":"add-todo","title":"..."}` (optionally fence-wrapped, both
  variants tested) → `{intent: "add-todo", deferred: false}`.
- Malformed JSON → repair retry → still malformed → fail-safe
  `{intent:"none", deferred:true, unreachable:false}` (mirrors the existing
  `"classifySegment retries once on invalid output then fails safe"`-shaped
  test already in the suite for the Ollama path).
- Fake `fetch` that throws (simulated connection refused) → immediate
  fail-safe `{intent:"none", deferred:true, unreachable:true}`, **no** retry
  attempt made (assert the fake `fetch` was called exactly once).
- Out-of-enum `intent` value in an otherwise-valid JSON reply → same
  fail-safe path as unparseable JSON (schema validation, not just parse,
  matters).
- `classifySegment({backend: "ollama", ...})` still reproduces the exact
  existing 35-suite behavior unchanged (regression guard for keeping the old
  path alive, not just adding the new one).

---

## 7.5. Leaf: validation + bounded retry + friction-on-failure

**Depends on:** §3 (ledger status extension) + §7 (needs `classifySegment`'s
`unreachable`/`reason` fields to exist on its return value). This is the leaf
that makes Jack's 2026-09-17 "understand when it hit an error and either
retry or report that error as a friction" instruction structural, not an
afterthought bolted onto §7.

**Two retry loops, deliberately not merged:**

| | In-call repair retry (§7) | Across-run attempt budget (this leaf) |
|---|---|---|
| Triggers on | malformed/invalid JSON from a model that IS responding | any classify failure, `unreachable` or not, that survives the in-call retry |
| Bound | 1 retry, same HTTP round trip | `--max-classify-attempts` (default 3, §2), one increment per daemon run |
| Rationale | the model is reachable right now — worth one immediate nudge | a sleeping backend (avetta especially) won't wake up in the next 2 seconds; retrying immediately just burns a timeout. Across-run retry gives real wall-clock time for the host to come back |

### 3.x (ledger helpers, `pipeline/journal-agent.mjs`)

- `export function recordClassifyAttempt(state, seg, { reason, unreachable })`
  — increments `state.pages[page].lines[hash].attempts` (creating the entry
  at `attempts: 1` if absent), stores the latest `reason`/`unreachable`/`at`.
  Does **not** set `status` — the line stays eligible for re-emission by
  `diffJournalPage` (still not `done`/`proposed`/`failed`) exactly like
  today's plain `deferred: true` behavior, up to the attempt cap.
- `export function markSegmentFailed(state, seg, extra)` — sibling of
  `markSegmentDone`/`markSegmentProposed`, `status: "failed"`. Called once,
  the run `attempts` crosses `--max-classify-attempts`.
- `export function resetFailedSegment(state, { page, lineHash })` — deletes
  `state.pages[page].lines[lineHash]` entirely, returning the line to
  never-attempted. This is Jack's manual escape hatch after reading a
  friction report and fixing whatever caused it (e.g. rewording an
  ambiguous line, or just deciding to retry as-is once the backend is back).
  Exposed as a CLI flag on `journal-agent.mjs`: `--reset-failed <page> <lineHash>`
  (prints the ledger entry being cleared, then exits — a single-purpose
  maintenance invocation, not folded into a normal pipeline run).

### `runPipeline` orchestration change (`journal-agent.mjs:670–713`)

Where the loop currently does `if (classified.deferred) continue;`
(`journal-agent.mjs:685`), insert the attempt-budget check **before** the
`continue`:

1. `recordClassifyAttempt(state, seg, {reason: classified.reason, unreachable: classified.unreachable})`.
2. Read back `state.pages[seg.page].lines[seg.lineHash].attempts`.
3. If `attempts < maxAttempts`: `continue` as today — silently retried next
   run, no friction yet (this preserves the existing "best-effort, host
   asleep is not an error" tolerance for the common case).
4. If `attempts >= maxAttempts`: **this is the new terminal-failure path.**
   - `markSegmentFailed(state, seg, { reason: classified.reason, attempts })`.
   - Build + write a friction report (below) via
     `pipeline/journal-synth-friction.mjs`.
   - Append one AI-daily-log line via the existing `appendAuditTrailLine`
     helper (`journal-agent.mjs:650–654`, reused verbatim):
     `"<hhmm>Z · journal-agent · FAILED (needs attention) · <reason> — friction: <friction-file-path>"`.
     This line is written **unconditionally** on terminal failure, regardless
     of `#ping` — a failure is exactly the case that shouldn't depend on a
     tag Jack happened to add for an unrelated reason. Push notification
     stays gated on `#ping`/`notify_on_complete` as today (§0.3's "don't let
     anything but the deterministic tag scan decide push" invariant,
     unchanged) — the friction file is the "morning" surface Jack asked for,
     not an interruptive push.
   - `continue` (never reaches `routeIntent`/`routeIntentDryRun` — a failed
     classification has nothing to route).

### New file `pipeline/journal-synth-friction.mjs`

- `export function buildFrictionReport({ page, lineNo, text, reason, attempts, model, now })`
  — pure, returns `{ filename, content }`:
  - `filename`: `` `${nowCompactUtc(now)}-journal-synth-${slugForSegment(page, lineNo, text)}.md` ``
    (reuses `slugForSegment`, `journal-agent.mjs:399–411`, already exported;
    `nowCompactUtc` is a small new local helper formatting `now` as
    `YYYYMMDDTHHMMSSZ` per the Schema-A filename convention).
  - `content`: Schema-A frontmatter — `id` (the filename minus `.md`),
    `reporter: "subagent:journal-agent"`, `kind: "self"` (the pipeline
    reporting its own operational failure, not observing another agent's
    work), `model` (whatever `classifyOpts.model` was in play, e.g.
    `"local-heavy"`), `effort: "n/a"` (documented, deliberate deviation —
    `journal-agent` is a script invocation, not an agent-session turn, so
    the schema's effort-tier field doesn't apply; §0.4 already flags this
    adaptation), `task: "journal-agent: classify/route a #queue/synth journal line"`,
    `repo: "workspace"`, `severity: "low"`, `status: "new"`. Body: the
    schema's required **What happened / Why it mattered / Suggested fix**
    three sections — "What happened" states the source line (via
    `provenanceLine`, reused), the failure `reason`, and the `attempts`
    count; "Why it mattered" notes the entry is now parked at
    `status: "failed"` and won't be retried until reset; "Suggested fix"
    names the two live possibilities verbatim: *"if this looks like a
    transient backend-availability issue, just re-run `--reset-failed
    <page> <lineHash>`; if the model is consistently failing on this input,
    consider rewording the journal line or filing a harness friction against
    the `local-heavy` alias itself."*
- `export function writeFrictionReport({ filename, content }, { fs = nodeFs, painDir } = {})`
  — the ONLY effectful export in this file: writes to
  `${painDir ?? join(homedir(), ".claude", "signals", "pain", "agent")}/${filename}`,
  creating the directory if absent (`mkdirSync(..., {recursive:true})`,
  matching `saveWatchState`'s existing convention, `journal-agent.mjs:253–256`).
  Injectable `fs`/`painDir` for tests, same idiom as every other effectful
  boundary in this codebase.

**Tests to add** (`pipeline/journal-synth-friction.test.mjs` + additions to
`journal-agent.test.mjs`):
- `recordClassifyAttempt` increments `attempts` from absent→1→2→3 across
  three separate calls on the same ledger object.
- `runPipeline` with a `classifyOpts` fixture that always fails (fake
  LiteLLM `fetch` always throwing) run **three times in sequence** against
  the same persisted `state` → first two runs leave the line eligible
  (no `status` set, `attempts` 1 then 2); the third run sets
  `status: "failed"`, calls the (injected/spied) friction writer exactly
  once, and appends exactly one AI-daily-log `FAILED` line.
- A fourth run, after `status: "failed"`, does not re-emit the segment at
  all (`diffJournalPage`'s `"failed"` skip, §3) and does not call the
  friction writer again (no duplicate frictions for an already-failed line).
- `resetFailedSegment` clears the entry; a subsequent `diffJournalPage` call
  re-emits the line as a fresh segment (`attempts` absent again).
- `buildFrictionReport` produces valid Schema-A frontmatter (spot-check the
  required keys listed above are all present) and a body with all three
  required section headers.
- `writeFrictionReport` with an injected fake `fs`/`painDir` writes to the
  expected path — no real write to the actual `~/.claude/signals/pain/`
  during tests (this codebase's existing injectable-everything discipline
  applied to a new effectful boundary).

---

## 8. Leaf: full-suite regression pass + tracker close-out

**Depends on:** §3–§7.5 all landed.

- `npm test` in `workspace/knowledge-substrate` (existing glob already covers
  every new `pipeline/*.test.mjs` and `lib/*.test.mjs` file per `package.json`
  line 8 — no glob edit needed unless a new top-level directory is
  introduced, and this plan deliberately keeps everything under existing
  `pipeline/`/`lib/` dirs to avoid that).
- Add one integration-shaped test (`pipeline/journal-agent.test.mjs` or a new
  `pipeline/journal-synth-integration.test.mjs`) exercising the **whole
  dry-run path end to end**: a `#queue/synth`-tagged line → fake LiteLLM
  `fetch` returns `{"intent":"add-event","title":"..."}` →
  `runPipeline({mode:"dry-run"})` → assert
  (a) `knowledge/tasks/*` has zero entries on `FakeSbfs`, (b)
  `captures/journal-agent/proposals-<date>` exists and contains the event's
  title, (c) the day's journal page's AI-daily-log gained one line, (d) the
  ledger shows `status: "proposed"`. Then feed that same ledger+page state
  into `applyProposal` (§5) and assert the task page now DOES exist and the
  ledger flips to `"done"` — proving the two leaves compose correctly
  end-to-end, not just in isolation.
- A second integration test for the **failure path**: a `#queue/synth` line,
  fake LiteLLM `fetch` always failing, `runPipeline` invoked 3× against
  persisted `state` (matching §7.5's own test) → assert (a) zero writes ever
  occur to any real destination or the proposal artifact, (b) exactly one
  friction file is written (via injected fake friction-writer), (c) the
  ledger's terminal state is `"failed"`, not `"proposed"` or `"done"` — the
  three-way ledger split (proposed/done/failed) is only meaningfully tested
  once all three are exercised in the same suite.
- Confirm additive-only: existing test count (35, per the research doc's
  citation) should only grow, never shrink or change assertions on unrelated
  cases.

---

## Gauntlet execution tracker

| task | role | tier | status | agent-id | workspace | branch |
|---|---|---|---|---|---|---|
| §3 trigger-gate + ledger status (3-way: proposed/done/failed) | work | sonnet | **done — merged to workspace main** (`5095496`, merge `78b045d`) | Agent (worktree) | agent-a869341a49aa5d199 | worktree-agent-a869341a49aa5d199 (deleted post-merge) |
| §4 pure composers + dry-run/proposal mode | work | sonnet | **done — merged to workspace main** (`207a38e`) | Agent (worktree) | agent-acc236e53079bb888 | worktree-agent-acc236e53079bb888 (deleted post-merge) |
| §5 live-mutation (**GATED — Jack reviews before wiring/dispatch of its *use***) | work | sonnet | **done — code+tests merged to workspace main** (`60692e2`); confirmed unwired anywhere, fixture-only tests, never run against a real space | Agent (worktree) | agent-ab67713960ff28881 | worktree-agent-ab67713960ff28881 (deleted post-merge) |
| §6 watcher daemon (backup-commit + dry-run trigger) | work | sonnet | **done — merged to workspace main** (`95eabbd`); `mode: "dry-run"` hardcoded literal, no `--mode` flag exists | Agent (worktree) | agent-a6b6b8116df08dcfa | worktree-agent-a6b6b8116df08dcfa (deleted post-merge) |
| §7 LiteLLM local-model backend (constrained JSON, not tool-calling) | work | sonnet | **done — merged to workspace main** (`7ffdfa9`) | Agent (worktree) | agent-a092be34ca16cce40 | worktree-agent-a092be34ca16cce40 (deleted post-merge) |
| §7.5 validation + bounded retry + friction-on-failure | work | sonnet | **done — merged to workspace main** (`3a618e5`) | Agent (worktree) | agent-ad125a3b05def5033 | worktree-agent-ad125a3b05def5033 (deleted post-merge) |
| §8 full regression pass + integration tests (dry-run path + failure path) | manage/verify | sonnet | **done — merged to workspace main** (`64c5bf3`); 2 new e2e integration tests (dry-run→apply compose; 3-run failure→friction path), full suite 415 tests/410 pass/0 fail/5 skip, exit 0 | Agent (worktree) | agent-a4aed6ee4328c801d | worktree-agent-a4aed6ee4328c801d (deleted post-merge) |

**BUILD COMPLETE (2026-09-18).** All 7 leaves (§3, §7, §4, §5, §6, §7.5, §8) merged to `workspace` main and pushed to origin (final commit `9065116`). Dry-run pipeline verified end-to-end against fixtures: `#queue/synth` tag → LiteLLM-classify → compose reviewable proposal (zero real-destination writes) → `journal-synth-apply.mjs` performs the one real write only when Jack runs it by hand with `--confirm`. Gate independently re-verified by the orchestrating session (not just self-reported by leaf agents): `grep -rn journal-synth-apply` across the repo shows it is imported ONLY by its own test and by leaf §8's integration test — never by `journal-watch-daemon.mjs` or any production code path; the daemon's `mode: "dry-run"` is a hardcoded literal with no `--mode` CLI flag to override it. **Pause point reached per Jack's directive — live-apply and daemon-against-a-real-space both remain untouched, awaiting his review.**
| Config decision: LiteLLM model pick | — | — | **DECIDED** — local, `local-heavy` alias on the already-live `litellm.fox.peterson.place` proxy (§2) | — | — | — |
| Config decision: daemon host confirm (default: Paseo workspace script, jacks-macbook-pro) | — | — | pending Jack confirm-or-silent-accept | — | — | — |
| Config decision: backup-repo target confirm (default: local-commit-only, in-place `git init`) | — | — | pending Jack confirm-or-silent-accept | — | — | — |
| Config decision: classify retry budget before friction (default: 3 attempts) | — | — | pending Jack confirm-or-silent-accept | — | — | — |

Autonomous-build scope per Jack's 2026-09-17 directives: §3, §4 (dry-run mode
+ tests), §5 (**code + tests only — never dispatched into live use**), §6,
§7, §7.5, §8 may all be built and tested end-to-end without a check-in — the
model decision that was previously blocking §7 is now resolved (local,
already-live infra, no new endpoint to stand up). The pause point is:
**§5's `journal-synth-apply.mjs` is never invoked against a real `--sb-url`
space, and §6's daemon is never started against a real space, until Jack
reviews the built dry-run output.**

---

## Appendix — provenance of key claims (this planning pass, 2026-09-17)

- `journal-agent.mjs` full read (809 lines) — exact line numbers cited above
  for `diffJournalPage` (263–278), `markSegmentDone` (280–283),
  `CLASSIFY_ENUM` (297), `preFilterHints` (302–309), `CLASSIFY_SYSTEM_PROMPT`
  (311–318), `classifySegment` (339–389), `buildContactDraft` (423–445),
  `buildResearchDraft` (448–477), `routeNote` (480–504), `routeIntent`
  (509–565, `add-event` branch 524–547), `sendPushNotification` (587–600),
  `runNotifyStep` (602–648), `appendAuditTrailLine` (650–654), `runPipeline`
  (670–713), `main()` (732–768) — all verified directly, not taken from the
  research doc's own citations.
- `lib/sbfs.mjs` full read (148 lines) — `/.fs` contract, read-back
  verification, 401-retry.
- `lib/git-checks.mjs` full read (109 lines) — confirmed **no commit
  capability exists today**, only `branchHasCommits`/`isAncestor`/
  `remoteContains`/`symlinkResolvesInto`; `lib/git-backup.mjs` (§6) is
  genuinely new, not a rename of existing code.
- `task-tools/verbs.mjs` full read (286 lines) — `propose()`'s dedup-by-
  `dedup_key` behavior (203–235), `accept()`/`decline()` gate.
- `task-tools/task-page.mjs` lines 1–40 — `TASK_TYPE_ENUM` (21–23, 8 members,
  no `event`/`todo`), `ACTIVE_STATUSES` (26).
- `lib/taxonomy.mjs` lines 17–45 — `KINDS` (9 members incl. `"capture"`),
  `FIDELITY`, `SENSITIVITY`, `ZONES` (4 members, no `calendar`).
- `push/config.mjs`/`push/server.mjs` full reads — confirmed `DEFAULT_PORT`
  8791, sidecar routes, no changes needed.
- Grep of `docs/CONFIG.md` (this repo) + whole `workspace/` tree for
  `calendar`/`notif` — confirmed no existing "calendar" zone/tag and that
  `client/components/nav_views/notifications.tsx` (this repo) is UI-only
  push-toggle chrome, not a content page (§0 terminology reconciliation).
  `client/components/nav_views/notifications.tsx` lines 1–50 read directly.
- `package.json` (`workspace/knowledge-substrate/`) confirmed the `test`
  glob already covers `pipeline/*.test.mjs`/`lib/*.test.mjs` — no glob edit
  needed for the new files listed in §1.
- Dispatch-base self-verification: `git merge-base --is-ancestor
  e1d8eb18971d048831cba9d69b73c198cd1de4fb HEAD` returned **not an ancestor**
  (that sha lives on `main`, not `m3e-fork`; merge-base is `2b2a7c71`, the
  same upstream-2.10.0 base cited by the 2026-09-16 spec). Flagged per
  `using-git-worktrees` step 2b; not blocking since this task produced a
  single new doc, no code changes to this repo's tracked tree.

**Revision pass, same day (2026-09-17), for Jack's local-model decision:**
- `config/litellm/config.yaml` full read (122 lines) — confirmed a REAL,
  already-live LiteLLM proxy (`https://litellm.fox.peterson.place`,
  `auth: false`), model aliases `local-fast` (`qwen3:8b`, mainmac+mushroompc)
  and `local-heavy` (`ollama/hf.co/deepreinforce-ai/Ornith-1.0-35B-GGUF:Q4_K_M`
  on avetta, falls back to `qwen3:14b` on mushroompc), confirmed live via
  that file's own header note ("Synced 2026-09-05... confirmed LIVE via
  `curl https://litellm.fox.peterson.place/v1/models`"). This is a read-only
  doc mirror of the real nix-homelab-deployed config (file's own header,
  lines 6–13) — routing changes happen in `nix-homelab`, out of this repo's
  scope, but the config as documented is what's actually live.
- `scripts/pi-ollama-models-sync.mjs` full read (187 lines) — confirmed the
  `local-router` provider id, the exact base URL
  (`ROUTER_BASE = process.env.PASEO_LOCAL_ROUTER_URL || "https://litellm.fox.peterson.place"`,
  line 40), and the `apiKey: "not-needed"` convention for this auth-disabled
  proxy (line 139) — reused verbatim for `journal-agent.mjs`'s new
  `--litellm-api-key` default.
- `okf/harness-okf/knowledge/router-pi.md` and
  `okf/harness-okf/knowledge/frictions.md` read directly (not from memory) —
  confirmed the Schema-A friction file format/location
  (`~/.claude/signals/pain/agent/`, filename convention
  `YYYYMMDDTHHMMSSZ-<slug>.md`, required frontmatter keys) that §7.5's
  `buildFrictionReport` targets, and confirmed that schema is written for
  LLM-agent-session reporters — the basis for §0.4's explicit "deliberate
  adaptation" note (`effort: "n/a"` for a script, not an agent turn).
- This correction supersedes this doc's own original §2 config-decisions
  table, which proposed standing up a fresh LiteLLM proxy at
  `http://localhost:4000` — that was wrong not because the reasoning was
  bad, but because the research pass that produced it didn't grep for an
  already-existing `config/litellm/` directory in `workspace/`. Left as a
  lesson in this appendix rather than silently erased: always grep for the
  literal technology name across the whole monorepo before proposing to
  stand up new infra for it.
