---
title: Journal-driven content synthesis — engine placement research + recommendation
date: 2026-09-17
kind: research
fidelity: stated
sensitivity: personal
source_repo: silverbullet-m3e
tags: [silverbullet, m3e, journal, agentic, research, spec]
---

# Journal-driven content synthesis — engine research + recommendation

> **Deliverable type**: research + recommendation, NOT a leaf-level implementation
> plan. Direction is Jack's pick. Touches no code. Separate epic from the
> concurrent UI-toolbar refactor.

## 0. READ THIS FIRST — a working version of this already exists

Before any web research or repo spelunking: `docs/plans/` in this repo already
holds `2026-09-16-m3e-reskin-and-agentic-journal-spec.md` (§4–§5), written and
**fully executed the day before this request**. It is not aspirational — I
verified the artifacts on disk, not just the spec's own claims:

- `workspace/knowledge-substrate/pipeline/journal-agent.mjs` (809 lines, real
  code, 35 unit tests) implements WATCH → CLASSIFY → ROUTE → WRITE-BACK →
  NOTIFY over `journal/<date>` pages. Merged to `main` at `8ca1f9f`.
- `workspace/knowledge-substrate/push/*.mjs` (VAPID sidecar: subscribe/send)
  wired into journal-agent's NOTIFY step. Merged at `135d832`.
- Both commits are real, on `workspace/knowledge-substrate`'s `main` branch
  (`git log --oneline`, verified 2026-09-17).
- Client-side push (service worker `push`/`notificationclick` + subscribe
  toggle) landed in *this* repo at `6979b3e0` on `m3e-fork`, per that spec's
  execution tracker — this is the "push-notification capability" Jack's
  request refers to.

**So this research doc's job is narrower than it first looks: not "invent an
engine from scratch," but "evaluate Jack's new leaning (marker-gated trigger,
host file-watcher, debounced-backup-commit, LiteLLM) against what's already
built and running, and recommend whether to extend it, replace its runner, or
fork a second pipeline."** The existing system and today's ask differ in three
concrete ways, all load-bearing for the recommendation below:

| | Existing (`journal-agent.mjs`, shipped 2026-09-16) | Today's ask |
|---|---|---|
| **Trigger** | Continuous — every not-yet-`done` Free-write line is a candidate on every run (state-file dedup, no explicit marker) | Marker-gated — only entries explicitly marked "done" should fire |
| **Model** | Direct Ollama HTTP to local `gemma4:latest`, classify-only (span/enum selection, no tool-calling — local models measured to fail structured tool-calling, see spec §4.3) | LiteLLM-backed agent with tool-calling |
| **Runner** | Designed for a Paseo schedule (cron → fresh agent), run manually as a Node CLI so far; no git-backup/debounce-commit anywhere | A host-level file-watcher that *also* does debounced idle→git-backup-commit, combining backup and synthesis in one idle-triggered pass |

The "notes-page summary write-back" and "push notification on completion"
outputs Jack asked for are **already implemented** (AI-daily-log append +
VAPID push, both real, in `runNotifyStep`/`appendAuditTrailLine`,
`journal-agent.mjs:568–654`). The open design surface is genuinely just:
**trigger convention + runner/engine + LLM backend.**

---

## 1. This repo's own mechanisms (SilverBullet v2.10.0, verified against source)

Ground-truthed by direct grep/read against `/Users/jack/Documents/code/silverbullet-m3e` (spot-checked 2026-09-17 against the citations below — not training-data recall, which is explicitly stale for SB v2 per the `silverbullet` skill).

### 1.1 Plug event hooks

- Dispatch core: `client/plugos/hooks/event.ts:68–158` (`EventHook.dispatchEvent`), interface `client/plugos/eventhook.ts:1–8`. Fans out in parallel (`Promise.allSettled`) to: (a) plug functions declaring `events: [...]` in their `*.plug.yaml` manifest, (b) in-process JS listeners, (c) Space Lua `event.listen{}` registrations read from `config.get("eventListeners", {})`.
- Example manifest wiring: `plugs/index/index.plug.yaml:88–91` (`indexPage`, `events: [page:index]`).
- Catalogued events: `docs/Event.md` — confirmed live: `editor:pageSaved` (line 42), `page:index` (line 58), **`cron:secondPassed`: "One second has passed (useful for implementing periodic behavior)"** (line 60).
- Dispatch sites for file/page changes: `client/spaces/evented_space_primitives.ts` — `page:saved` (206), `page:deleted` (143, 259), `file:changed`/`file:deleted`/`file:listed` (131, 139, 147, 226, 263).
- **Load-bearing caveat, confirmed against the docs' own text**: `editor:pageSaved`/`editor:pageSaving` are **client-side-only** — they fire only inside an open browser tab. A write that lands via the HTTP API (`/.fs`, which is exactly how the existing `journal-agent.mjs` and any headless watcher would write) produces **no event at all**. This kills "SB plug listening for page:save" as a trigger for anything that isn't itself driven from an open browser tab.
- Plugs CAN make outbound HTTPS calls (e.g. to a LiteLLM endpoint): `client/plugos/syscalls/fetch.ts` exposes a `fetch` syscall gated by `requiredPermissions: [fetch]` in the manifest (example: `plugs/editor/editor.plug.yaml:1–3`). It does not do a raw browser fetch — it proxies through `/.proxy/<url>`, and the **server** performs the real outbound call via `reqwest` (`server/src/handlers/proxy.rs:65–77`, no allowlist beyond scheme). So network egress from a plug is real and server-mediated — feasibility is not the blocker; the client-side-only event boundary is.

### 1.2 space-script vs space-lua

Confirmed **space-script (JS) is dead** in this codebase — kept only as a CodeMirror syntax alias (`client/languages.ts:23–24`) and a schema stub for indexing (`plugs/core/core.plug.yaml:81–90`); the actual API (`system.loadSpaceScripts`, `client/plugos/syscalls/system.ts:161–171`) is aliased straight to the Lua loader. **Space Lua is the only live space-embedded scripting mechanism** (`client/languages.ts:14`, `client/client_system.ts:197–230`).

### 1.3 Cron

**No dedicated cron plug or scheduled-task config exists in SB itself.** The only periodic primitive is `cron:secondPassed`, a plain client-side `setInterval(..., 1000)` in `client/client.ts:350–352` — no cron-expression parsing, no persisted "last run," no restart catch-up. Any real cadence must be hand-rolled by a listener comparing timestamps against this once-a-second tick, and — same caveat as §1.1 — this only runs while a client (browser tab, or this fork's headless-Chrome runtime, §1.6) is alive. `docs/CONFIG.md` has no `schedule`/`cron` key.

### 1.4 Publish / Share

There is no `publish.ts` in this repo — replaced by **Share** (`docs/Share.md`): frontmatter-driven (`share.uri`/`share.mode`/`share.hash`), triggered **only** by a user running the `Share: Page` command from the editor. Synchronous, human-initiated, page-scoped — not a background hook, not repurposable as one without new code. Federation (a related cross-space feature) was explicitly removed (`docs/ADR/004 Federation.md:25`, "Deprecated and removed (2025)... no direct replacement").

### 1.5 Sync / backup flow — and the file-watch + git-backup gap

- Sync (client↔server) is a separate plug (`plugs/sync/sync.plug.yaml`) driven by a browser **service worker**, not a server daemon — `service-worker:space-sync-complete` etc., all client/tab-scoped.
- **No git-backup mechanism exists anywhere in this repo.** Grepped `server/`, `server-common/`, `bin/` for `chokidar`, `fs.watch`, `git commit`, `backup`, `debounce` — zero hits. SB's own runtime has no watch→commit loop, no snapshotting. **This confirms Jack's instinct that debounced-commit-to-backup-repo has to be bolted on externally — SB offers nothing here to repurpose.**

### 1.6 Server vs client vs plug-sandbox runtime boundary — the key architectural fact

This is the fact that actually decides feasibility, and it diverges from stock upstream SB:

- **Normal split**: client (browser tab) runs the event system and dispatches everything in §1.1–1.3; only runs while a tab is open. Plug sandbox = a Web Worker (`client/plugos/sandboxes/worker_sandbox.ts`), no direct fetch, only the proxied one. Server (Rust, `server/src/*.rs`) is otherwise "just" an HTTP file server in stock terms.
- **This fork adds a headless-Chrome-hosted client** (`server-runtime-chrome/`): the Rust server launches a real Chrome/Chromium process (`server-runtime-chrome/src/supervisor.rs:117–152`) navigated to `?headless=1`, running the **exact same `client.ts` bootstrap** — full plug/event system, including the `cron:secondPassed` ticker. Launch is lazy (first call to `/.runtime/lua` etc., gated by `SB_RUNTIME_API`, `server-runtime-chrome/src/transport.rs:89–133`) but once up, a supervisor loop keeps it alive indefinitely with liveness checks and auto-restart (`supervisor.rs:290–341`) — **it never shuts down for being idle**.
- Network egress from inside that headless client still goes through `/.proxy`, executed server-side via `reqwest` — a genuinely real outbound HTTPS path to something like LiteLLM, with no browser CORS involved.
- **Caveat**: this is a full Chrome process per space (`--no-sandbox`, own user-data-dir), intended narrowly to "answer the Lua/objects API," not general automation — repurposing it for journal synthesis is possible but heavy and off-label.

**Bottom line for §1**: SB itself offers exactly one thing usable as a trigger without new server code (`cron:secondPassed`, and only from a live client/headless-runtime), and zero built-in file-watch/backup/webhook machinery. Everything else has to come from outside the SB process.

---

## 2. Web prior art

### 2.1 SilverBullet community — triggered/background/queued work

- **No built-in webhook/automation plug exists, and the community has explicitly asked and been told no.** A GitHub issue proposing a "Webhooks" plug (fire HTTP calls on events, cites n8n) was filed and **closed "not planned"**, zero replies. [Plug Idea: Webhooks · Issue #333](https://github.com/silverbulletmd/silverbullet/issues/333) — [source/issue]
- Official docs confirm the event bus (`event.listen`) and `cron:secondPassed`, and state plugs generically "can respond to events triggered either on the server or client-side" and "run recurring and background tasks" — but **name no concrete existing cron/webhook/automation plug**. [SilverBullet — Event](https://silverbullet.md/Event) — [official docs]; [SilverBullet — Plugs](https://silverbullet.md/Plugs) — [official docs]
- **Independently confirms §1.1's finding from the other direction**: the docs state `editor:pageSaved` "only fires inside an open browser tab, so anything writing through the HTTP API directly produces no event at all." [SilverBullet — Event](https://silverbullet.md/Event) — [official docs]
- A community forum thread shows a user hand-rolling `CustomEvent`/Lua-JS interop for editor↔plug sync, self-described "pretty ugly" — evidence the event system gets informal workarounds, not a sanctioned automation API. [Editor <-> Plug communication](https://community.silverbullet.md/t/editor-plug-communication/4005/4) — [community]
- **Conclusion: this is greenfield territory.** No SB community pattern exists for exactly what Jack wants; the fork (or an external watcher) has to build it.

### 2.2 Publish specifically

`publish` (SilverBullet Pub, `silverbulletmd/silverbullet-pub`) is a one-way, manually/CI-triggered **static-site exporter** — not a change-trigger hook, explicitly experimental, invoked as a discrete command. No evidence the community has repurposed it as a background trigger. [silverbulletmd/silverbullet-pub](https://github.com/silverbulletmd/silverbullet-pub) — [source]

### 2.3 Debounced-commit / idle-then-backup pattern (general prior art)

- **obsidian-git** implements exactly Jack's leaning under "Auto commit-and-sync after stopping file edits": attaches to vault `modify`/`delete`/`create`/`rename` events, and per its own docs "waits X minutes after your latest change for the commit-and-sync" — explicitly distinct from a fixed-interval mode, motivated by "not want[ing] to get interrupted by a commit while typing." [obsidian-git Features.md](https://github.com/Vinzent03/obsidian-git/blob/master/docs/Features.md) — [source/docs]
- Known gotcha: the debouncer only resets on **vault file events** — config/plugin changes don't reset the idle timer and can sit uncommitted. [Issue #1088](https://github.com/Vinzent03/obsidian-git/issues/1088) — [source/issue] — directly relevant: a marker-consumption write (the watcher stripping its own marker) must itself count as an activity event, or it can race the idle window.
- **Logseq** instead uses a fixed-interval commit (default 60s), not idle-debounce — the two dominant designs in this genre are idle-debounce (obsidian-git) vs fixed-interval poll (Logseq). [logseq/git-auto](https://github.com/logseq/git-auto) — [source]
- **Takeaway**: idle-debounce is the right model for "wait until the entry is actually done," matching Jack's leaning — not fixed-interval polling.

### 2.4 Marker-consumption / idempotent-trigger patterns

- **SQS visibility-timeout model**: a message becomes invisible on receipt; only explicit deletion (or SDK auto-delete on success) permanently consumes it. AWS's own guidance: processing must be idempotent, every message needs a dedup ID. [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) — [official docs]
- **Gmail-automation label pattern**: apply the "processed" label **only after the downstream action succeeds**, never on failure, and exclude already-labeled items from the next scan (`-label:Automation/Processed`). [Gmail Apps Script automation guide](https://appscriptsolution.com/gmail-automation-with-google-apps-script-a-practical-technical-guide/) — [blog], mechanism backed by [GmailApp reference](https://developers.google.com/apps-script/reference/gmail/gmail-app) — [official docs]
- **Local-ledger pattern (note-tool precedent)**: `obsidian-readwise-inbox` doesn't mutate the source item at all — it appends the processed item's ID to a separate log file, and a query filters anything already in that log. Decouples idempotency state from the watched content. [obsidian-readwise-inbox](https://github.com/TfTHacker/obsidian-readwise-inbox) — [source]
- **This is exactly the mechanism `journal-agent.mjs` already uses**: `journal-watch-state.json`, keyed by `(page, line-hash)`, marks a segment `done` only after a *real* (non-deferred) result — see `journal-agent.mjs:225–289`. It does not touch the source page. Two dominant idioms exist — **mutate-the-marker-in-place** (strip/flip a tag on the page itself) vs **external ledger** (state file/log, page untouched) — and the existing pipeline already committed to the ledger approach.

---

## 3. Options comparison

| | (a) External file-watcher daemon on host (debounce-commit + marker scan) | (b) SB plug on save/index event | (c) SB `cron:secondPassed` polling (plug or Lua) | (d) Paseo schedule/heartbeat, git-aware | (e) Extend existing `journal-agent.mjs` runner |
|---|---|---|---|---|---|
| **Reliability** | High — plain OS process, restart-on-crash trivial (launchd/systemd/Paseo-supervised) | Low — dies with the browser tab; `editor:pageSaved` doesn't fire for API/git writes at all (§1.1, §2.1) | Medium — needs a live client/headless-runtime (§1.6) running continuously | High — Paseo daemon already always-on for Jack | High — already proven, 35 passing unit tests, real merged commits |
| **Observability** | High — plain logs, ps/systemd status | Low — buried in browser devtools/plug logs | Low — same | Medium-high — Paseo's agent activity log | Medium-high — console output + AI-daily-log audit trail already built |
| **Re-trigger safety** | Whatever you build — must add marker-consumption yourself | Same | Same | Same | **Already solved** — line-hash watch-state, `done` only on non-deferred success |
| **LLM + tool-calling feasibility** | Full — plain host process, call LiteLLM directly, no sandbox | Feasible via `/.proxy` (server-mediated fetch) but plug sandbox has no tool-calling harness, and it's a classify/fetch call, not an agent loop | Same constraint as (b) | Full — spawns a real agent turn (this is *why* `journal-agent.mjs`'s own header concludes research-intent WebSearch needs an agent-turn host, not a plain script) | Full — same reasoning as (d); today it runs as a plain Node CLI for the deterministic legs and is designed to run under an agent-hosting runner for the WebSearch leg |
| **Coupling to SB internals** | None — reads/writes over `/.fs` HTTP API, same as `sbfs.mjs` already does | Tight — plug manifest, sandbox permissions, upstream-rebase risk (this fork already tracks upstream) | Tight — same | None | None — already decoupled, `sbfs.mjs` + `/.fs` |
| **Ops burden** | New always-on host service to manage | None new, but broken (§1.1 event gap makes it non-functional for API/headless writes) | New always-on browser/headless-Chrome process, heavy (§1.6) | None new — Paseo already the standing daemon Jack runs everything else through | None new if riding Paseo; the debounce/git-backup half is still a net-new gap either way |
| **Backup-commit combo (Jack's ask)** | **Yes — this is the natural home for it**, one idle-triggered pass does both | No | No | Possible but awkward — a schedule fires on cadence, not on idle-since-last-write, so "debounce" would need its own state tracking inside the agent turn | Same gap as (d) — the existing pipeline has no backup-commit logic at all |

**Ruled out fast**: (b) and (c) both die on the confirmed §1.1/§2.1 fact that `editor:pageSaved` — SB's only save-hook — never fires for writes that don't go through an open browser tab, which is exactly how any headless watcher (and the already-shipped `journal-agent.mjs`) writes. Building the synthesis trigger *inside* SB means either keeping a browser/headless-Chrome tab alive forever (§1.6's heavy, off-label option) or accepting the pipeline literally cannot see its own writes. Neither is attractive next to an external watcher that just reads files directly.

---

## 4. Recommendation

**Adopt (a) — an external file-watcher/idle-debounce daemon on the SB host — as the single engine for both jobs Jack named: idle-triggered git-backup-commit AND the done-marker scan that fires synthesis.** This matches Jack's own leaning, and is now also the option that best reconciles with what's already shipped:

- Runner = a small always-on process (Paseo workspace script, or a `chokidar`/`fs.watch`-based Node daemon under systemd/launchd-equivalent — Paseo workspace scripts, per the `paseo` skill, are already the supervised-long-running-process idiom Jack uses elsewhere in this fleet) watching the space directory (or `/.fs` via polling if the space is remote, not local-disk).
- On **idle > 5 min since last file change**: (1) `git add -A && git commit` to the backup repo (Jack's existing ask), (2) in the *same* pass, scan journal pages for the done-marker (§5), and for each match, invoke the synthesis leg.
- **Reuse `journal-agent.mjs`'s WATCH/ROUTE/WRITE-BACK/NOTIFY machinery wholesale** — it already does line-hash dedup, taxonomy-stamped drafts, push notify, and AI-daily-log write-back, all decoupled from SB internals via `sbfs.mjs`/`/.fs`. Do **not** re-derive this. The two real deltas to make on top of it:
  1. **Swap the trigger** from "every non-`done` Free-write line, every run" (continuous) to "only lines under an explicit done-marker" (gated) — a change to `diffJournalPage` (`journal-agent.mjs:263–278`), not a rewrite.
  2. **Swap the model backend** from direct-Ollama-HTTP (`classifySegment`, `journal-agent.mjs:339–389`) to a LiteLLM endpoint. LiteLLM's proxy exposes an OpenAI-compatible (and often Ollama-compatible) HTTP surface, so this is a base-URL/payload-shape change, not an architecture change — and it's the natural place to also add real tool-calling for the ROUTE step instead of the current classify-only enum, once Jack wants that upgrade (today's local-model tool-calling failure mode, spec §4.3, is a *local-model* limitation — a hosted LiteLLM-routed model doesn't necessarily share it).
- **Runner detail**: the daemon does NOT need to be a "fresh agent per run" the way the existing Paseo-schedule design assumed for WebSearch access. If the daemon calls out to a real agent-hosting surface (a Paseo `create_agent`/schedule invocation, or a direct LiteLLM tool-calling loop that has its own web-search tool) only for the synthesis leg, the idle-watch/git-commit/marker-scan legs stay in the lightweight always-on process. This is a straightforward extension of the file-watcher option, not a contradiction of it.

**Why not (d) Paseo-schedule-only** (the existing design's runner): a cron-cadence schedule can't naturally express "N minutes after the LAST edit," which is exactly the idle-debounce semantics Jack wants for the backup-commit half — you'd have to reimplement idle-tracking as state inside the agent turn, which is just option (a) with extra scheduling indirection. Running the daemon as a Paseo *workspace script* (long-lived, not schedule-invoked) sidesteps this, which is why the recommendation above treats Paseo as the supervision layer, not the trigger mechanism.

**Why not repurpose the headless-Chrome runtime (§1.6)**: technically feasible, but it's off-label (built for the Lua/objects API, not general automation), heavy (a full Chrome process per space), and buys nothing an external `/.fs`-speaking watcher doesn't already get more cheaply and more observably.

---

## 5. Trigger-convention decision

**Recommend a dedicated marker, not `#done`** — this matches Jack's stated wariness, and the community/prior-art findings back it up:

- `#done` is very likely already load-bearing elsewhere (task/todo completion semantics, possibly styled as a tag pill per the reskin spec's PR-3 chip work) — overloading it risks the watcher firing on completions that have nothing to do with synthesis intent, or a real "mark this todo done" action silently also triggering a wiki-mutation side effect Jack didn't ask for.
- Recommended concrete convention: **a namespaced tag, `#queue/synth`** (or `#synth`), consumed the same way the existing pipeline already consumes work — **not** by editing/stripping page text, but by the external ledger pattern already proven in `journal-agent.mjs` (§2.4): a watch-state file records `(page, line-hash) → done` once synthesis actually completes. This has two real advantages over marker-stripping:
  1. **It's already built.** `diffJournalPage`/`markSegmentDone` (`journal-agent.mjs:263–289`) is exactly this ledger, just needs its gate condition changed from "any non-blank Free-write line" to "line contains `#queue/synth`."
  2. **It avoids the obsidian-git gotcha found in §2.3** — if the watcher edited the source page to strip the marker, that edit is itself a file change, which would reset the idle-debounce timer that triggers the backup commit, creating a race/self-triggering loop (commit → strip marker → file-change → reset idle timer → wait 5 more min → commit again). An external ledger sidesteps this entirely: the source page is untouched, so consuming the marker never perturbs the idle clock it lives beside.
- If Jack wants the marker visibly gone from the journal text (aesthetic preference, not idempotency requirement), that's a **separate, optional cosmetic pass** — layer it on top of the ledger, don't make it the idempotency mechanism itself.
- Frontmatter (`synth: pending`) was considered and rejected for this use case specifically: Jack's journal entries are inline free-write lines within a day-page, not whole pages — a per-line marker (a hashtag inline in the text, as `#ping` already is) fits the existing line-granularity model; a page-level frontmatter field would only work if "done" meant "the whole day's journal is done," which isn't the semantics described.

---

## 6. Synthesis-agent contract sketch

(Sketch only — the follow-on implementation plan owns the real interface.)

- **Input**: the matched journal line's text, plus surrounding context = the rest of that day's Free-write section (for pronoun/reference resolution) and, optionally, a short window of recent prior days' AI-daily-log entries (so "add her as a contact" after an earlier "met Jane" line has a chance of resolving — the existing pipeline treats each line independently today; this is a genuine upgrade, not present yet).
- **Intent → destination routing**: keep the existing enum-first shape (`add-contact | add-event | research | note | none`, `journal-agent.mjs:297`) as the deterministic backbone, but let a LiteLLM-backed model with real tool-calling replace the classify-then-hardcoded-dispatch split with actual structured extraction (name/date/details), gated by the same deterministic validator+retry+fail-safe pattern already proven (§4.5 of the 2026-09-16 spec) — don't drop the safety net just because tool-calling becomes available.
- **Mutation mechanism**: `/.fs` HTTP API via `sbfs.mjs`'s `SilverBulletFS` (read-modify-write, Bearer/Authelia auth, `X-Sync-Mode: true` header) — **not** the SB MCP tools (no batch/patch primitive there, whole-file overwrite only, and no reason to route through MCP when a direct HTTP client already exists and is proven) and **not** direct raw file writes bypassing the API (would skip SB's own reindex-on-change if any exists client-side — moot per §1.1's finding that reindex triggers are client-side-only anyway, but `/.fs` is still the documented, credentialed, already-battle-tested path).
- **Idempotency**: the ledger (§5) — a line is only ever routed once; a failed route (validation error, write failure) leaves it un-`done` and retried on the next idle pass, matching `runPipeline`'s existing error handling (`journal-agent.mjs:692–699`).
- **Error handling**: never block or revert a partial write on a downstream failure (push failure already isolated this way, `journal-agent.mjs:640–644`); a classify/route failure defers the segment rather than fabricating a low-confidence action (existing fail-safe, §4.5 of the prior spec).
- **Write-back safety tier**: keep the existing draft/propose discipline (§4.6 of the prior spec) — contacts and research land as `capture_state: placeholder` drafts, events go through `task-tools propose()` for Jack's explicit accept, notes append-only. **Never** edit Jack's own free-write text in place. This is a real invariant worth carrying forward regardless of engine choice.
- **Notification + notes-page summary**: already real (§0) — `runNotifyStep` fires one push per batch of completed `notify_on_complete` intents and appends a one-line summary to that day's `## 🤖 AI daily log` section. The only change needed is deciding whether "done"-gated synthesis should *always* notify (since Jack explicitly marked it for synthesis) rather than only on the separate `#ping` tag — worth an explicit decision in the follow-on plan rather than assuming.

---

## 7. Outline of the follow-on implementation plan

(Not written here — this section is a table of contents for what to plan next, once Jack picks a direction.)

1. **Trigger-convention finalization** — confirm `#queue/synth` (or chosen alternative) naming; decide whether synthesis-triggered completions always push-notify or require `#ping` too (§6, last bullet).
2. **Watcher daemon spec** — process shape (Paseo workspace script vs bare daemon), idle-debounce timer implementation, git-backup-commit logic, local-disk vs remote-`/.fs` file-change detection (the existing pipeline supports both a `--space-dir` local fixture and a live `--sb-url` path, `journal-agent.mjs:110–148` — decide which is real for Jack's actual deployment).
3. **`diffJournalPage` gate change** — from "every non-done line" to "only `#queue/synth`-tagged lines," plus the self-triggering/idle-timer interaction called out in §5.
4. **LiteLLM integration** — replace `classifySegment`'s direct-Ollama call with a LiteLLM-routed call; decide sync-classify-only vs real tool-calling for extraction; define the LiteLLM endpoint/auth/model-routing config.
5. **Context-window upgrade** — decide whether to widen input beyond the single line (§6, cross-reference resolution) and how much surrounding context is safe/useful.
6. **Reconciliation with the existing Paseo-schedule design** — decide whether `journal-agent.mjs`'s current Paseo-schedule-per-run model is retired in favor of the daemon calling it as a subroutine, or kept as a secondary/fallback path.
7. **Backup-repo target + git credentials** — where the debounced commit actually pushes (separate backup remote? local-only commits? cadence of remote push vs local commit).
8. **Test plan** — extend the existing 35-test suite (`journal-agent.test.mjs`) to cover the gated trigger, marker-ledger race with idle-timer, and LiteLLM backend swap; add a watcher-daemon-level test (idle-detection timing, debounce reset on marker-consumption writes).
9. **Rollout** — dry-run against the live daily-driver space (`https://jacks-macbook-pro.tail93dc3b.ts.net:8443/`, per the 2026-09-16 spec's tracker) before enabling the daemon unattended.

---

## Appendix — provenance of key claims

- SB v2 event/plug/cron/publish/sync internals: direct read + grep of `silverbullet-m3e` @ HEAD (`de004aaa`), 2026-09-17 — `client/plugos/hooks/event.ts`, `client/plugos/eventhook.ts`, `plugs/index/index.plug.yaml`, `docs/Event.md`, `client/spaces/evented_space_primitives.ts`, `client/languages.ts`, `client/client_system.ts`, `plugs/core/core.plug.yaml`, `client/plugos/syscalls/system.ts`, `client/client.ts`, `docs/CONFIG.md`, `docs/Share.md`, `docs/ADR/004 Federation.md`, `plugs/sync/sync.plug.yaml`, `server/src/handlers/proxy.rs`, `server-runtime-chrome/src/supervisor.rs`, `server-runtime-chrome/src/transport.rs` — spot-checked directly (`docs/Event.md`, `client/client.ts`, `server/src/handlers/proxy.rs`, `server-runtime-chrome/`) in addition to subagent report.
- Existing journal-synthesis pipeline: direct read of `docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-spec.md` (this repo) + direct read of `workspace/knowledge-substrate/pipeline/journal-agent.mjs` (809 lines, full read) + `workspace/knowledge-substrate/lib/sbfs.mjs` (partial read) + `git log --oneline` on `workspace/knowledge-substrate` confirming commits `8ca1f9f`/`135d832` are real and merged, 2026-09-17.
- SilverBullet community prior art (Issue #333, community forum, Event/Plugs docs), debounced-commit pattern (obsidian-git, Logseq), marker-consumption patterns (SQS, Gmail Apps Script, obsidian-readwise-inbox): WebSearch/WebFetch by background research agent, 2026-09-17, each claim tagged with trust tier inline in §2.
