---
title: SilverBullet-M3E — reskin finish + agentic journal + push notifications (consolidated spec)
date: 2026-09-16
kind: synthesis
fidelity: stated
sensitivity: personal
source_repo: silverbullet-m3e
tags: [silverbullet, m3e, reskin, agentic, web-push, journal, spec]
---

# SilverBullet-M3E — consolidated spec: finish the reskin, add an agentic journal, wire push

> **Sensitivity / placement note (read first).** This doc lives at
> `silverbullet-m3e/docs/plans/` because the task asked for "the right
> docs/plans location for the SB fork repo," and this is where the reskin PRs
> land. **But `silverbullet-m3e` has an `upstream` remote (it tracks
> `silverbulletmd/silverbullet`) and a `publish.yml` that pushes a public
> `ghcr.io/jackhp95/silverbullet-m3e` image.** This file contains personal
> infra references (tailnet hosts, `fox.peterson.place`, home model fleet) that
> `workspace/knowledge-substrate/lib/scrub.mjs`'s denylist exists specifically
> to keep out of anything public. Two consequences: (1) if this fork's git repo
> is ever made a public mirror, **this doc must be excluded** (docs never enter
> the docker image, so the image is safe regardless); (2) **Parts 4 & 5's
> implementation home is not this repo** — the agentic substrate lives in
> `workspace/knowledge-substrate/` (private monorepo), and only the client-side
> Web-Push hooks land in this fork. A private-monorepo mirror of this spec at
> `workspace/knowledge-substrate/docs/2026-09-16-*` is the safer canonical copy
> if Jack prefers; flagging per the house default of naming leak gaps rather
> than silently working around them.

## 0. Context: there are two M3E tracks, and this fork is the real one

Research surfaced **two parallel M3E efforts**, and it matters that they are not
confused:

1. **This fork (`silverbullet-m3e`, branch `m3e-fork`)** — a genuine
   source-level reskin: `@m3e/web` custom elements wired directly into
   SilverBullet's Preact client (`client/components/*.tsx`). This is "option
   (c)" from the 2026-09-15 UI report (`workspace/knowledge-substrate/docs/2026-09-15-silverbullet-ui-improvement-report.md`)
   — patch the official client, self-host the build. **This is the canonical
   reskin.**
2. **The live homelab space (`notes.fox.peterson.place`, stock 2.10.0 runtime)**
   — a Space-Lua/`CONFIG.md` veneer: `space-style` CSS (Monaspace + Flexoki
   accents), tag-pill styling, `actionButton.define` home/search buttons. It
   briefly had an `@m3e/web` FAB via `widget.sandbox`, but that was **reverted
   on 2026-09-15** (it reached into `window.parent.document`, violating the
   iframe's documented intent, and needed 3 fix rounds in one day) and replaced
   with a native `actionButton.define` + `editor.filterBox` menu. **Lesson that
   validated this fork:** SB v2 offers *no* sanctioned way to reskin its own
   chrome from the space layer — Space Lua has no DOM, plugs run in Web Workers,
   and every custom-HTML surface is iframe-isolated. A real chrome reskin
   **requires** forking the client. That is exactly what this fork does.

The `CONFIG.md` veneer and the fork are **complementary, not competing**: the
veneer's `space-style` tokens (`--ui-accent-color: #464cfc`-ish Flexoki,
Monaspace fonts) should be the *source of truth* for the fork's `m3e-theme`
color and font choices so a self-hosted fork build and the stock space look
identical. The fork does not need to run on the homelab yet — it can be a
daily-driver built and run locally, or deployed alongside/replacing the stock
container later.

---

## 1. Resume-state inventory

### 1.1 Exact location

| | |
|---|---|
| Repo | `/Users/jack/Documents/code/silverbullet-m3e` |
| Branch | `m3e-fork` (current, checked out) |
| HEAD | `ef9a5d3a` |
| Base | upstream `2.10.0` = tag `2.10.0` = commit `2b2a7c71` (17 fork commits on top) |
| Remotes | `origin` = `github.com/jackhp95/silverbullet-m3e`; `upstream` = `github.com/silverbulletmd/silverbullet` |
| `@m3e/web` | **2.7.12** (declared `^2.7.12`); the `m3e` skill is pinned to 2.7.3 — same 2.7.x line, no tag-level drift |
| Working tree | clean except untracked `demo-space/` (scratch test space) |
| Other branches | `m3e-fork-fab-menu-search-fix`, `m3e-fork-theme-icons-menu-fab` — **both fully merged into `m3e-fork`, hold no unmerged work** |

> The dispatch-record base sha `4e132e6f…` is **not in this repo** — it belongs
> to the parent `/Users/jack/Documents/code` directory (which is not itself a
> git repo). Moot for this research-only pass; no writes to tracked code.

### 1.2 Architecture facts (load-bearing for everything below)

- **Server = Rust** (`server/`, `server-common/`, `server-runtime-chrome/`,
  `bin/silverbullet/`; `cargo run <SPACE>` dev, `make` release embeds the bundle
  via rust-embed). *No Deno anywhere* (the task brief's Deno assumption is
  wrong).
- **Client = TypeScript + Preact + CodeMirror 6**, bundled by **ESBuild**
  (`build/build_client.ts`), styles by **dart-sass** (`client/styles/*.scss`).
  474 client files / ~104,795 LOC; the **chrome slice that a reskin touches is
  ~34 files / ~7,654 LOC (<8%)**, isolated in `client/components/*.tsx` +
  `editor_ui.tsx` + `client/styles/`.
- `@m3e/web` is pulled in by **bare side-effect imports** (`import "@m3e/web/app-bar"`)
  and bundled into `client.js`. **No import map** (that's only needed for the
  no-bundler browser path).
- **Theming**: an `m3e-theme` root wrapper in `editor_ui.tsx` (`color="#464cfc"`,
  `scheme` mirrors dark mode) generates `--md-sys-color-*` roles at runtime;
  per-component `--m3e-*` custom props bridge SB's own Flexoki tokens
  (`theme.scss`/`colors.scss`) into the m3e shadow DOM.
- `preact/compat` is **already a live dependency** in `top_bar.tsx` and
  `anchored_menu.tsx` — so raw `@m3e/web` custom elements in Preact JSX is the
  right integration path; **skip `@m3e/react` + `@lit/react`** (they buy nothing
  a fresh Preact app needs and add 3 packages + a global `react` alias to the
  rebase surface). Confirmed against source in the 2026-09-15 report Addendum 2.

### 1.3 What is already M3E-reskinned

| Surface | File(s) | M3E tag(s) | Landed in |
|---|---|---|---|
| Top app bar | `client/components/top_bar.tsx` | `m3e-app-bar` | `9716bb8e`, refined `57eab39f` |
| Breadcrumbs (**new**, no stock equivalent) | `top_bar.tsx` + `editor_ui.tsx` | `m3e-breadcrumb`, `m3e-breadcrumb-item` | `57eab39f` |
| Command palette | `command_palette.tsx` (unchanged) → renders via `FilterList` | `m3e-search-view`, `m3e-list`, `m3e-list-item` | `e8f0927d` |
| Page picker / quick-open | `anything_picker.tsx` (unchanged) → `FilterList` | same | `e8f0927d` |
| Generic filter box (`filterBox()`) | `editor_ui.tsx` → `FilterList` | same | `e8f0927d` |
| FAB + kebab + action buttons + recent-pages + journal + read-only toggle (all consolidated) | `client/components/floating_toolbar.tsx` (**new**) | `m3e-toolbar`, `m3e-icon-button`, `m3e-icon`, `m3e-menu`, `m3e-menu-trigger`, `m3e-menu-item` | `e91f0119`, `483c2cb0`, `e080a91b` |
| Item creation (task/event/contact/idea/note) | `client/components/item_capture_sheet.tsx` (**new**) | `m3e-bottom-sheet`, `m3e-segmented-button`, `m3e-button-segment`, `m3e-form-field`, `m3e-textarea-autosize`, `m3e-button`, `m3e-icon` | `57eab39f` |
| Toasts / notifications | `editor_ui.tsx` `flashNotification` | `m3e-snackbar` (global `globalThis.M3eSnackbar.open`) | ~`e91f0119` |
| Global theme / color roles | `editor_ui.tsx` | `m3e-theme` | `483c2cb0` |
| Typography (icons, editor/read-only fonts) | `main.scss`, `theme.scss` | Material Symbols Outlined, Monaspace Neon, Roboto (all self-hosted in `client/fonts/`) | `dd47f410`, `f932e56c` |

Nuance: the palette and page-picker *source files are unchanged*; they look M3E
purely because they delegate to the reskinned `FilterList`. The **search/pick
chrome is M3E; the option-building logic underneath is still stock.**

### 1.4 What is broken / unfinished / degraded

1. **Snackbar lost features** (`editor_ui.tsx:187`): `m3e-snackbar` has no
   severity color, so error/warning are signalled only by a `"Error: "` text
   prefix; and it is one-at-a-time, so a second `flashNotification` *replaces*
   the first (the old stacked `viewState.notifications` store was deleted from
   `reducer.ts`/`types/ui.ts`). Regression vs stock.
2. **App-bar sticky/elevation is a hack** (`editor_ui.tsx:311-339`): `#sb-top`
   is a fixed non-scrolling row, so `m3e-app-bar`'s `for`-based scroll elevation
   can't work natively. A `MutationObserver` finds CodeMirror's `.cm-scroller`,
   assigns it `id=sb-editor-scroller`, and drives `#sb-top[data-scrolled]` by
   hand. **Fragile if CodeMirror's DOM changes** — a rebase risk.
3. **Breadcrumb "folder" segments are stand-ins**: SB has no folder concept, so
   intermediate segments open the full page picker rather than a folder index.
4. **Capture sheet is schema-agnostic** (`editor_ui.tsx:50-64, 864-921`):
   task/event/contact/idea append **plain lines to hardcoded pages** (`Tasks`,
   `Events`, `Contacts`, `Ideas`) via `appendCaptureLine`. It does **not** use
   `tag.define` schemas, and — critically for Part 4 — does not write to the
   real task system (`knowledge/tasks/`, tagged `task`) or the taxonomy zones.
5. **`m3e-theme color` is hardcoded** `#464cfc` and not sourced from the
   space's Flexoki `--ui-accent-color`; light/dark only mirrors, doesn't adopt
   the space palette.
6. **Code smells**: stale `TODO` at `editor_ui.tsx:984` referencing an
   `ActionButton` type that moved to `floating_toolbar.tsx`; two divergent
   `ActionButton` type shapes now exist.
7. **No design doc / palette in-repo**: `STYLE.md` is upstream coding
   conventions, `README.md` isn't updated for the fork, `.impeccable/` holds
   only `hook.cache.json` (design-hook findings, all `cleanAcked`). This spec is
   the first design doc.

### 1.5 Next 3 PRs to finish the reskin

**PR-1 — Dialogs & modals to `m3e-dialog` (highest daily-driver value, low
risk).** `client/components/basic_modals.tsx` `Prompt()`/`Confirm()`/`AlwaysShownModal`
are still native `<dialog class="sb-modal-box">` + stock `Button`/`Input`.
Replace with `m3e-dialog` (+ `m3e-dialog-action`, `m3e-form-field` for the
prompt input, `m3e-button` for actions; `destructive`→`variant` mapping for
Confirm). Self-contained, no CodeMirror coupling, visible on every rename/delete.

**PR-2 — Snackbar severity + fix the app-bar sticky hack.** (a) Restore
error/warning affordance: drive `m3e-snackbar` container color from a severity
arg (Material error role) instead of a text prefix; decide explicitly whether to
keep single-at-a-time (acceptable) or reintroduce a minimal queue. (b) Replace
the `MutationObserver` `.cm-scroller` hunt with a stable hook — either wire
`m3e-app-bar`'s `for` to an explicitly-id'd scroll container set once at editor
mount, or drop elevation-on-scroll entirely. Removes the single biggest rebase
fragility.

**PR-3 — Tag pills to `m3e-chip` + capture-sheet writes real schema.** (a)
Replace `.sb-hashtag` stock CSS chips with `m3e-chip` (or `m3e-filter-chip` where
the hashtag is a live filter action), styled from the space's `data-tag-name`
palette so provenance tags (`task`/`issue`/`approach`/…) read as distinct pills.
(b) Rework `appendCaptureLine` so the capture sheet writes through the real task
system (`knowledge/tasks/`, `task` tag, `task-tools` verbs) and taxonomy zones
instead of hardcoded `Tasks`/`Events`/`Contacts` pages — this is the seam Part 4
depends on, so doing it here pays double.

(Deferred, own PRs after: side panels → `m3e-drawer-container`; sync indicator →
`m3e-circular-progress-indicator`; `spaces_ui` standalone screens; slash-menu.)

---

## 2. Non-material component inventory (stock → M3E mapping)

Real `@m3e/web` 2.7.12 tags only (137 registered; 55 documented families).
"Compose" = no single dedicated element, must assemble documented primitives.

| # | Stock surface today | File(s) | M3E equivalent | Verdict |
|---|---|---|---|---|
| 1 | **Prompt dialog** — native `<dialog>` + SB `Input`/`Button` | `basic_modals.tsx` | `m3e-dialog` + `m3e-form-field` + `m3e-button`/`m3e-dialog-action` | **Clean** — PR-1 |
| 2 | **Confirm dialog** — native `<dialog>` + `Button` (destructive) | `basic_modals.tsx` | `m3e-dialog` (`alert`) + `m3e-dialog-action` (`m3e-button` filled/error) | **Clean** — PR-1 |
| 3 | **AlwaysShownModal** — raw `<dialog>.showModal()` | `basic_modals.tsx` | `m3e-dialog` (`open`, `disable-close`) | **Clean** |
| 4 | **Slash-command / autocomplete menu** — CodeMirror `.cm-tooltip-autocomplete` | `styles/colors.scss`, `editor.scss` | No dedicated tag. `m3e-menu`/`m3e-floating-panel` (positioner) or `m3e-autocomplete`, **but caret anchoring is custom to CodeMirror either way** | **Compose + custom anchoring** — hardest surface; low priority |
| 5 | **Editor chrome / CodeMirror surfaces** | `styles/editor.scss` (17 KB) | Not an M3E concern; wrap surrounding chrome in `m3e-content-pane`/`m3e-split-pane` only | **Leave stock** |
| 6 | **In-editor markdown toolbar** (hover-reveal) | `main.scss` `.sb-markdown-toolbar` | `m3e-toolbar` + `m3e-icon-button` | **Clean** (low value) |
| 7 | **CodeMirror bottom search/replace panel** | `colors.scss`/`editor.scss` `.cm-search` | `m3e-search-bar` + `m3e-icon-button`, but it's a CM-owned panel → custom | **Compose / low priority** |
| 8 | **Side panels (LHS/RHS/modal/BHS)** — iframe + Shadow-DOM plug panels | `panel.tsx`, `panel_html.ts`; `.sb-panel`/`.sb-bhs` CSS | `m3e-drawer-container` (`start`/`end`, modes over/push/side/auto) + `m3e-drawer-toggle`; `m3e-content-pane` for the scroll body; `m3e-split-pane` if resizable. **Panel *content* is a plug iframe — only the chrome/host wraps in M3E.** | **Clean (chrome only)** |
| 9 | **Page-name editor field** — SB `Input` slotted into app-bar title | `top_bar.tsx` `PageNameEditor` | `m3e-form-field` wrapping the native input (keep the input, it's an editable title, not a picker) | **Clean** |
| 10 | **Sync / status / progress indicator** — hand-rolled conic-gradient circle | `top_bar.tsx` `SyncProgressIndicator`; `top.scss` | `m3e-circular-progress-indicator` (`value`/`indeterminate`); offline state → an `m3e-badge` or `m3e-icon` state | **Clean** |
| 11 | **Tag pills / hashtags** | `colors.scss` `.sb-hashtag` | `m3e-chip` (static), `m3e-filter-chip`(+`-set`) (as filter action), `m3e-input-chip`(+`-set`) (tokenized entry) | **Clean** — PR-3 |
| 12 | **Rendered markdown content** (admonitions, tables, blockquotes, code, wiki-links, frontmatter) | `markdown_renderer/`, `colors.scss`/`editor.scss` | Not component-shaped; `m3e-card` for admonition/callout blocks at most | **Leave stock** (theme via tokens) |
| 13 | **Standalone server UIs** — Space Manager / setup / auth | `client/spaces_ui/*.tsx`, `*.html` | `m3e-dialog`/`m3e-form-field`/`m3e-button`/`m3e-list` | **Clean but out of daily-driver scope** |
| 14 | **Shared SB UI kit** — `Button`, `Input` | `plug-api/ui/index.ts` | `m3e-button`, `m3e-form-field` — replace at the kit level to cascade everywhere | **Clean (leverage point)** |
| 15 | **Command palette** — option logic (chrome already M3E via FilterList) | `command_palette.tsx` | already served by `m3e-search-view` + `m3e-list`; no single "palette" tag | **Done (compose)** |
| 16 | **Page picker** — option logic (chrome already M3E) | `anything_picker.tsx` | `m3e-autocomplete` or `m3e-search-view` + `m3e-option`/`m3e-list-option`; no single tag | **Done (compose)** |

**Surfaces with NO clean M3E equivalent (need custom work):**
- **Slash menu (#4)** — needs custom CodeMirror caret anchoring on top of
  `m3e-menu`/`m3e-floating-panel`. This is the one genuinely custom build.
- **Command palette / page picker** — no single element, but the *composition*
  (`m3e-search-view` + `m3e-list`) is already shipped via `FilterList`; nothing
  to build, just noted for completeness.
- **CodeMirror internals (#5, #7)** — deliberately not M3E; owned by CM.

---

## 3. Prioritized plan to reach daily-driver, sequenced by risk/effort

**Guiding rule:** the fork's real recurring cost is *rebasing against upstream's
~monthly releases* over a small (<8%) chrome slice. Every PR should (a) reduce
DOM-coupling to CodeMirror/upstream internals, and (b) be independently
mergeable, so a mid-reskin rebase is never blocked.

**Phase A — stabilize what exists (do first, unblocks daily use):**
1. **PR-1 dialogs** (§1.5) — most-hit missing surface, zero CM coupling.
2. **PR-2 snackbar severity + de-hack the app-bar sticky** — kills the top
   rebase-fragility and restores a real regression.
3. Fix the stale `ActionButton` TODO / dedupe the two type shapes (tiny; do it
   inside PR-2).
4. Source `m3e-theme color` + fonts from the space's Flexoki/Monaspace tokens so
   the fork and the stock space match (one-line-ish, high polish payoff).

**Phase B — coverage (each independent):**
5. **PR-3 tag pills → `m3e-chip`** + capture-sheet writes real task/taxonomy
   schema (the Part-4 seam).
6. **Side panels → `m3e-drawer-container`** (chrome only; plug iframe untouched).
7. **Sync indicator → `m3e-circular-progress-indicator`.**
8. **Shared UI kit (`plug-api/ui`) `Button`/`Input` → `m3e-*`** — cascades to
   every remaining stock consumer at once (biggest leverage, do after PR-1 proves
   the pattern).

**Phase C — long tail (optional, low daily value):**
9. `spaces_ui` standalone screens.
10. Slash-menu custom anchoring (the one hard custom build) — only if the stock
    CM autocomplete genuinely annoys in daily use.

**Cross-cutting acceptance gate (per [[ui-changes-need-playwright]]):** every PR
adds/updates a Playwright e2e that opens the surface and asserts the `m3e-*`
element **upgrades** (custom element defined) and renders — the fork already
carries an `e2e/` suite and a `playwright.config.ts`. Verify against a clean
build (`npm run build` → `cargo run demo-space`), not a leaked dev server.

---

## 4. Agentic background-processing design (the journal watcher)

### 4.1 Goal

Jack dumps freeform thoughts into the SB **journal** through the day. A
**local, privacy-first, non-urgent** model picks them up at its own pace and
performs actions — add a contact, add an event, do research/web-search, write
results back into the wiki — turning the journal into an LLM-wiki intake.

### 4.2 What already exists (do NOT rebuild)

The substrate is almost entirely already built in
`workspace/knowledge-substrate/` and the live SB space. This is an *assembly*
job, not greenfield.

- **Journal zone** — live: `journal/<YYYY-MM-DD>` pages, backed by SB's built-in
  Journal (`journal.prefix`/`journal.template` in `CONFIG.md`, `Ctrl-q j`). Each
  day page already has two sections by convention: **✍️ Free-write** (Jack's,
  top, unstructured) and **🤖 AI daily log** (append-only, `HH:MMZ · <agent> ·
  <event>`). This is the exact scratch space; no new namespace needed.
- **Task system** — live: tasks are one page each under `knowledge/tasks/`,
  tagged `task`, schema in `CONFIG.md`, board at `knowledge/tasks/board`,
  operated by the `sb-task` skill. Tooling in
  `workspace/knowledge-substrate/task-tools/`: `task-store.mjs`
  (`listTasks`/`readTask`/`writeTask`), `task-page.mjs`
  (`buildTaskPage`/`parseTaskPage`, `STATUS_ENUM`, `COMPLETION_ENUM`,
  `TASK_TYPE_ENUM`), and **`verbs.mjs` with `create`/`update`/`propose`/
  `accept`/`decline`/`archive`** — i.e. **the draft-vs-commit gate already
  exists** (`propose()` stages, Jack `accept()`s).
- **Write client** — `lib/sbfs.mjs` `SilverBulletFS` class: read-modify-write
  over the `/.fs` HTTP API with `lib/authelia-token.mjs` for the Authelia
  Bearer token (the same path that ships Monaspace fonts / Silversearch). MCP
  `create-note` works for text but **can't write bytes** — `/.fs` raw PUT is the
  contract for assets.
- **Taxonomy contract** — `lib/taxonomy.mjs`: zones `captures | knowledge | okf
  | journal`; `KINDS` (capture/summary/synthesis/entity/…); `FIDELITY`
  (professional/stated/det-inferred/**llm-inferred**); `SENSITIVITY`
  (public/private/personal); `CAPTURE_STATE` (placeholder/captured/verified);
  `pagePath(zone, id)`; `translate()` to stamp provenance frontmatter.
- **Sensitivity guard** — `lib/scrub.mjs`: fail-closed sensitivity gate +
  fail-loud denylist (tailnet IPs, `*.ts.net`, `peterson.place`, `jackhp*`,
  `/Users/jack/…`, `nix-homelab`). **Any outbound web call/publish must pass
  through this.**
- **Connector precedent** — `pipeline/extract.mjs` + `paperless-sync.mjs`:
  mtime/hash-keyed, idempotent ingest into SB zones. The watcher is a new
  connector of the same shape.
- **Scheduling precedent** — Paseo schedule `qwen-night-triage` (id `9051aee6`,
  2am, writes to a review-staging dir, never auto-applies). The watcher reuses
  this exact "fresh agent per run, local model, staged output, human gate"
  pattern. **launchd is retired; use a Paseo schedule.**

### 4.3 The model — "Jimma 4" = **Gemma 4**, confirmed available

Dictation resolved: **Gemma 4**. Confirmed in the `pi`/`local-router` model list
three ways:
- **Local Ollama**: `ollama/gemma4:latest` (and `local-mainmac-gemma3-12b`,
  `local-mushroompc-gemma3-12b` for the 3.x line).
- **Via the `pi` local-router**: `local-router/openrouter/google/gemma-4-26b-a4b-it`
  and `…gemma-4-31b-it`.
- **OpenRouter free tier**: `google/gemma-4-26b-a4b-it:free`,
  `google/gemma-4-31b-it:free` (26B MoE / ~4B active). *Free but cloud* — breaks
  local-first/privacy, so **only** as a degraded fallback when the whole home
  fleet is asleep, and **only after `scrub.mjs`** (a journal line may be
  `personal`).

**Recommendation:** run **`gemma4:latest` locally via Ollama**, reached through
the **`pi` / `local-router`** profiles (`local-fast` → mushroompc, generate-only;
`local-heavy` → avetta Ornith-MoE, falls back to mushroompc qwen3:14b) so host
availability/fallback is handled centrally. This matches Jack's home fleet
([[jack-machine-fleet]]): `mushroompc` (RTX 5070, often offline), `avetta` (M1
Max, **sleeping laptop, single-GPU serial queue — never parallelize**), main
Mac.

**Hard caveats (these shape the whole design, per [[qwen-local-triage-capability]]
+ [[jack-machine-fleet]]):**
1. Local models **fail structured tool-calling and structured output** (T4 eval
   0/8 faithfulness; 12.5% privacy-classification false-negatives). → The model
   is **generate/classify-only behind deterministic scaffolding**, never given
   free tool-calling.
2. Verdicts are **non-deterministic** (same input flips across runs). → The
   model **proposes**; it **never auto-commits** to Jack's own pages.
3. Availability is **best-effort** (hosts asleep/offline). → The pipeline must
   be **idempotent, resumable, and non-urgent by design** — exactly why Jack
   said "at its own pace."

### 4.4 Architecture

```
┌─────────────────────────── Paseo schedule (e.g. "journal-agent", hourly-ish) ───────────────────────────┐
│  spawns a FRESH agent per run (like qwen-night-triage), pointed at local-heavy/local-fast profile        │
│                                                                                                          │
│  1. WATCH (deterministic, no LLM)                                                                        │
│     - list_notes("journal/") + list tasks under knowledge/tasks/ with status in ACTIVE_STATUSES          │
│     - diff against pipeline/journal-watch-state.json (mtime/hash keyed, like extract-state.json)         │
│     - emit CANDIDATE SEGMENTS: new/changed free-write lines + new #task-tagged notes                     │
│                                                                                                          │
│  2. CLASSIFY INTENT (LLM, constrained)  — gemma4 via local-router                                        │
│     - per segment, model picks ONE enum: {add-contact | add-event | research | note | none}              │
│       via SPAN/ENUM SELECTION (not free JSON tool-call) + a deterministic validator + one retry          │
│       (the qwen-triage harness pattern: tolerant parse → validate → retry → else "none" fail-safe)       │
│     - also extracts a #ping flag from the SOURCE text (deterministic tag scan, see Part 5)               │
│     → produces an INTENT RECORD: {segment, source_page, source_line, intent, notify_on_complete, ...}    │
│                                                                                                          │
│  3. ROUTE + EXECUTE (deterministic dispatch → per-intent handler)                                        │
│     add-contact → knowledge/contacts/<slug>.md draft (entity kind)                                       │
│     add-event   → task-tools propose() a TASK of type=event (proposed status)                            │
│     research    → agent runs WebSearch (scrub.mjs-gated), writes knowledge/<slug>.md synthesis w/ cites  │
│     note        → summarize + file under captures/ (or leave, if trivial)                                │
│                                                                                                          │
│  4. WRITE-BACK (safe, via lib/sbfs.mjs + taxonomy.mjs)                                                    │
│     - DRAFT by default: fidelity=llm-inferred, capture_state=placeholder, into a staging surface         │
│     - task-shaped output uses propose() → status "proposed" → Jack accept()/decline()s                   │
│     - append a one-line pointer to the day's 🤖 AI daily log (this is the audit trail)                   │
│                                                                                                          │
│  5. NOTIFY (Part 5)                                                                                       │
│     - if any completed intent had notify_on_complete (source carried #ping): fire ONE Web-Push           │
│     - else: silent (the AI-daily-log line is the only trace)                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 How intent is decided (add-contact vs event vs research)

- **Deterministic pre-filter first.** Cheap regex/heuristics narrow the space
  before the model: an `@name`/"met/call/email" pattern → contact-candidate; a
  date/time token ("tomorrow 3pm", "on the 14th") → event-candidate; a "?"
  question or "look into/research/find out" verb → research-candidate. This
  keeps the model's job to *disambiguation*, its measured strength, not
  open-ended generation.
- **Model as classifier, not tool-caller.** The model receives the segment +
  the pre-filter's shortlist and returns **one enum value** (constrained
  decoding / a single token) — the span-selection reframe that took local
  summarize from ~17%→76% faithfulness. It does **not** emit a JSON action
  object (that's the 0/8 failure mode).
- **Deterministic validator + retry + fail-safe.** Invalid/ambiguous → one
  retry → else `none` (segment left untouched, re-tried next run). Never
  fabricate an action from a low-confidence classification.

### 4.6 How it writes back safely (draft vs auto-commit)

| Output | Default mode | Mechanism | Auto-commit? |
|---|---|---|---|
| Contact | **Draft** | `sbfs` write to `knowledge/contacts/<slug>.md`, `kind: entity`, `fidelity: llm-inferred`, `capture_state: placeholder` | No — Jack promotes |
| Event | **Proposed** | `task-tools verbs.propose()` → task `type=event`, status `proposed` | No — `accept()`/`decline()` |
| Research | **Draft** | `knowledge/<slug>.md`, `kind: synthesis`, `fidelity: llm-inferred`, claim-level `sources:` citations | No — Jack reviews |
| Summary/note | **Append-only** to a derived page (`captures/…`) | `sbfs` append; never edits Jack's free-write | Low-risk auto OK |

**Invariants (from [[verification-pattern-capture-synthesis-split]] +
[[deterministic-over-nondeterministic]]):**
1. **Never mutate Jack's own free-write or `knowledge/` pages in place.** The
   agent writes *new* draft pages and *appends* to the AI-daily-log; Jack's
   words are immutable input.
2. **Every generated page carries provenance frontmatter** via
   `taxonomy.translate()`: `generating_model: gemma4`, `generated_at`,
   `source: [[journal/<date>]]#Ln`, `fidelity: llm-inferred`. Trust tier is
   visible, per Jack's provenance discipline.
3. **`scrub.mjs` gates every outbound web call** (research intent) — a
   `personal`-sensitivity journal line must not leak into a search query. Fail
   loud, don't auto-redact.
4. **Idempotent + resumable**: `journal-watch-state.json` keys processed
   segments by `(page, line-hash)`; a re-run skips done work. Safe to miss runs.

### 4.7 How it composes with existing infra (no new daemon)

- **Runner** = a **Paseo schedule** (`create_schedule`, cron → fresh agent),
  mirroring `qwen-night-triage`. Cadence: hourly or a few times/day — *not*
  event-driven, matching "at its own pace / not urgent." The Mac's Paseo daemon
  must be awake (same constraint as the qwen schedule).
- **The agent per run** = a small controller (sonnet or even local, but the
  *orchestration* is deterministic) that: pulls the journal via MCP/`sbfs`, runs
  the 5-step pipeline, calls `gemma4` via the `pi` local-router for step 2, uses
  its own **`WebSearch`** for research intents, and writes back via `sbfs` +
  `task-tools`. Code lives in `workspace/knowledge-substrate/pipeline/journal-agent.mjs`
  (new connector, same shape as `paperless-sync.mjs`).
- **No net-new model infra**: `gemma4` is already routable; `sbfs`/`taxonomy`/
  `scrub`/`task-tools` already exist; the journal + task zones are live. The
  only new artifacts are the connector script, the watch-state file, the Paseo
  schedule, and the Part-5 push hook.

### 4.8 Open decisions to confirm before build

- Cadence (hourly vs 3×/day) and which profile (`local-fast` mushroompc vs
  `local-heavy` avetta) — both often asleep; may need a "if all local hosts
  down, defer" branch rather than the OpenRouter-free fallback (privacy).
- Whether "note" intent auto-summarizes or is a no-op (lean no-op to start —
  fewer low-value drafts).
- Staging surface for drafts: a dedicated `captures/journal-agent/` prefix vs
  the target zone with `capture_state: placeholder`. Prefer the latter (drafts
  are findable in-context) with a `#draft`/`#needs-review` tag pill (ties to
  PR-3).

---

## 5. Push notifications for SB (Web Push + `#ping`)

### 5.1 Reference pattern (already shipped by Jack)

`compass-social` shipped the exact stack ([[compass-social-implementation-plan]]):
**VAPID Web Push** — a `service worker` `push`/`notificationclick` handler, a
subscribe flow, a server-side sender wired into a `notify()` function, and
`pushPayloadFor(kind)` shaping the payload per event kind. Proven over Tailscale
HTTPS (push needs a secure context; the SB PWA already runs under HTTPS on the
tailnet). **Reuse this sender near-verbatim.**

### 5.2 Where it lives in the SB fork

The fork **already ships a PWA service worker** at `client/service_worker.ts`
(currently: fetch-proxy, precache, sync-engine; it even has a `logPush` config
flag for sync). That is the natural home for the Web-Push client side:
- **Client**: add `self.addEventListener("push", …)` (parse payload →
  `self.registration.showNotification(title, {body, data:{url}})`) and
  `self.addEventListener("notificationclick", …)` (focus/open the linked page).
  Add a one-time **subscribe flow** (request permission, `pushManager.subscribe`
  with the VAPID public key, POST the subscription to the server) — surface it as
  a toggle in the `floating_toolbar` (an `m3e-icon-button`) or settings.
- **Server (two options):**
  - **Option A (recommended first): a small Node sidecar** in
    `workspace/knowledge-substrate/` — `push/subscribe` (store subscription) +
    `push/send` (VAPID send), lifted almost directly from compass's sender. Zero
    Rust work; the **journal-agent calls `push/send` directly** at pipeline
    step 5. Fastest path, and keeps push logic next to the agent that fires it.
  - **Option B (later): fold into the Rust server** — add `/.push/subscribe` +
    an internal send path in `server/`. More work (Rust + a web-push crate),
    but no sidecar to run. Migrate to this once the pattern is proven.
- **VAPID keys**: generate once, public key baked into the client subscribe
  call, private key in the sidecar/server env (gitignored, like compass's).

### 5.3 The `#ping` convention — where it's checked and how it threads through

**Contract:** if the *source* journal entry or task note contains the `#ping`
hashtag, the agent that completes work derived from it fires a push on
completion. Without `#ping`, it completes silently (the AI-daily-log line is the
only trace). `#ping` is a real SB tag (`data-tag-name="ping"`), so it's
also styleable as a pill (PR-3) and greppable.

**Threading (single source of truth → single call site):**

1. **Check point = the WATCH/CLASSIFY boundary (step 1→2).** When a segment is
   emitted, a **deterministic tag scan** of the *source text* sets a boolean:
   `notify_on_complete = /(^|\s)#ping(\b|$)/.test(sourceText)`. This is
   deterministic — **never** left to the model (the model must not decide
   whether to ping).
   - Granularity: `#ping` on a specific free-write line → pings for intents from
     *that line*; `#ping` in a task page's frontmatter/body → pings for that
     task's completion. Page-level `#ping` in the day's free-write pings for all
     of that day's derived work (documented, so Jack knows the blast radius).
2. **Carried on the INTENT RECORD** produced in step 2:
   `{segment, source_page, source_line, intent, notify_on_complete, …}`. It
   rides untouched through step 3 (route) and step 4 (write-back).
3. **Fired at exactly one place — pipeline step 5 (NOTIFY), after write-back
   succeeds.** Pseudocode:
   ```js
   // pipeline/journal-agent.mjs — step 5, the ONLY push call site
   for (const done of completedIntents) {
     if (!done.notify_on_complete) continue;         // no #ping → silent
     await push.send(subscription, pushPayloadFor("journal-agent", {
       title: `Done: ${done.intent}`,                // e.g. "Done: research"
       body: done.summary,                           // what was written
       url: done.resultPageUrl,                      // deep-link to the draft
     }));
   }
   ```
   - Batching: if a run completes several `#ping` intents, coalesce into one
     notification ("3 items done") to avoid a burst — but still gate on
     `notify_on_complete` per intent.
   - Failure: a push-send failure is logged to the AI-daily-log and **never**
     blocks or reverts the write-back (notification is best-effort, the wiki
     write is the real outcome).

**Why the tag is checked deterministically at intake, not at send:** the source
text is only reliably available at watch time; by completion the agent may be
working from a derived intent record. Capturing `notify_on_complete` once, at
the boundary where the raw text is in hand, and threading a plain boolean, keeps
the notification decision auditable and out of the non-deterministic model's
hands.

### 5.4 Sequencing (Part 5 relative to Part 4)

Push is **step 5 of the same pipeline**, so it can't be tested before the
watcher exists — but the **`#ping` scan (step 1) and the `notify_on_complete`
field should be built with the watcher from day one** (they're deterministic and
cheap), with the actual `push.send` call stubbed to a log line until the VAPID
sidecar (§5.2 Option A) is up. That way the threading is proven before the
transport, and turning on real push is a one-line swap of the stub.

---

## Gauntlet execution tracker (manager state, updated live)

| task | role | tier | status | agent-id | workspace | branch |
|---|---|---|---|---|---|---|
| PR-1 dialogs→m3e-dialog | work | sonnet | **done** (retried_up once — real bug found+fixed: Preact camelCase-vs-lowercase custom-event dead-listener bug) — rebased + merged to `m3e-fork` @ `8c40d68a`, agent archived | `604e9b60-c1be-4855-82fe-a3f101676149` (archived) | `wks_182a606509ebc97d` | `pr1-m3e-dialogs` |
| **Follow-up (new, not yet dispatched)**: audit `m3e-bottom-sheet` onOpening/onOpened/onClosing/onClosed in `item_capture_sheet.tsx` for the same dead-listener bug (flagged by PR-1's fix, logged as friction `~/.claude/signals/pain/agent/20260916T223002Z-item-capture-sheet-tsx-s-m3e-bottom-sheet-onopen.md`) | work | — | queued, low priority (masked today by onCancel) | — | — | — |
| PR-2 snackbar+appbar-sticky+ActionButton dedupe | work | sonnet | **done** — merged to `m3e-fork` @ `df3c56b5`, agent+workspace archived | `40f1f2bb-9a42-4a2a-ab30-b0a2b112fd83` (archived) | `wks_2f016c6105394204` (archived) | `pr2-snackbar-appbar-fix` |
| PR-3 tag pills→m3e-chip + capture-sheet real schema | work | sonnet | **done** (retried_up once for a narration-yield, not a bug) — correctly rejected spec's own suggested `m3e-chip`/`m3e-filter-chip` after checking real API (used `m3e-assist-chip`, the only variant with real `href`/click); capture-sheet schema finding: fork defines NO task/event/contact tag schema of its own — landed on real upstream conventions (`tags: task` checkbox line, `tags: person` not `contact`) rather than inventing one; merged to `m3e-fork` @ `379e064a`, agent archived | `12a2462a-bc04-4792-9490-121db3f70894` (archived) | `wks_d91a9fbd50383271` | `pr3-tag-pills-capture-schema` |
| Phase A #4: source `m3e-theme` color from `--ui-accent-color` | work | sonnet (in-harness worktree) | **done** — self-caught wrong-base worktree (logged its own friction), proved mutation-adequacy via stash-revert, merged to `m3e-fork` @ `9b822194` | — (in-harness, archived w/ agent lifecycle) | — | `worktree-agent-aea5d97774f2418d9` |
| Live daily-driver instance | infra | — | **UP**: `https://jacks-macbook-pro.tail93dc3b.ts.net:8443/` — Tailscale Serve → `cargo run demo-space -p 3789 -L 127.0.0.1 --single` (debug build, m3e-fork @ `9b822194`, demo-space content, not yet real personal space) — restarted after each merge so far | — | — | — |
| Phase B #6: side panels → `m3e-drawer-container` (chrome only) | work | sonnet | **done** (retried_up once for narration-yield) — real merge CONFLICT vs Phase B #7 in `m3e-jsx.d.ts` (both leaves added typings same region); manager rebased + resolved by hand (initial programmatic merge silently dropped a closing brace, caught by `tsc --noEmit` going non-zero, fixed, re-verified 10/10 e2e), merged to `m3e-fork` @ `98337018`. Known gap: lost old flex-weight panel sizing (m3e-drawer-container is fixed-width) — logged as friction, low severity | `676a61a9-a556-48a5-8900-3e181cd5c7d6` (archived) | `wks_1756c9267c183c74` | `phaseb-side-panels-drawer` |
| Phase B #7: sync indicator → `m3e-circular-progress-indicator` + offline `m3e-badge` | work | sonnet | **done** (retried_up once for narration-yield) — 4/4 e2e incl. NaN-fallback edge case, merged to `m3e-fork` @ `775739fa`, agent archived | `08fd76e6-d046-4c04-bcb5-89907e17666c` (archived) | `wks_f573a9ef85db2c65` | `phaseb-sync-indicator` |
| Phase B #8: shared UI kit (`plug-api/ui`) `Button`/`Input`→`m3e-*` (biggest leverage, cascades everywhere) | work | sonnet | **done** — 23-file consumer sweep, 4 named consumers correctly kept `bare` (no double-wrap), 1 icon-variant gap noted (mapped to `variant="text"`); manager ran FULL e2e suite (not a subset, given blast radius) — background-handoff notification falsely reported exit 0 while log showed "1 failed" (logged as high-sev harness friction: never trust a post-timeout background exit-code notification); re-verified via isolated re-run, confirmed pre-existing flake (context-teardown timeout), not a regression, 118+3 real passes/0 real fails; merged to `m3e-fork` @ `2c607ff9`, agent archived. **All Phase A + Phase B items now done.** | `06205fbf-44eb-4f34-94b9-f8e4d6330d44` (archived) | `wks_ae1b5f65d5cc6769` | `phaseb-shared-ui-kit` |

Dispatched 2026-09-16 by the gauntlet manager (top-level session, cwd `/Users/jack/Documents/code/silverbullet-m3e`). No `TaskCreate` tool was available in this harness build at dispatch time — this table is the sole durable record; on resume, re-derive live state via `mcp__paseo__list_agents`/`get_agent_status` against the agent-ids above before trusting `dispatched` as still accurate.

## Part 4 execution tracker (in `workspace/knowledge-substrate`, not this repo)

| task | role | tier | status | agent-id | workspace | branch |
|---|---|---|---|---|---|---|
| journal-agent connector v1 (watch+`#ping`-scan+route+draft-write-back real; classify attempted live against gemma4:latest w/ validator+retry+fail-safe; research-exec stubbed [needs agent-turn host for WebSearch, not a plain Node script — found, documented]; push stubbed as AI-daily-log line per §5.4) | work | sonnet | **done** — worker self-merged+pushed to `origin/main`; per `work-fully-autonomously` house policy ("push-to-main-on-green is pre-authorized... no ask needed") this is CORRECT behavior, not a deviation as I first flagged it — retracting that concern. 35/35 unit tests verified fresh myself, additive-only. Merged+pushed as `8ca1f9f` | `fe09b13c-fcb1-46f1-9b44-525e5e3379e3` (archived) | `wks_de049024d097f60a` | merged+pushed as `8ca1f9f` on `workspace` main |

## Final push (work-fully-autonomously, proceed-to-the-end pass)

House policy note: as of this pass, workers merge+push to their own repo's main themselves on green (per `work-fully-autonomously`'s "push-to-main-on-green is pre-authorized" — a different, more permissive policy than gauntlet's manager-verify-then-merge, correctly applied per-worker's dispatch context). Manager still doubts "finished" and batons residuals per that skill's mandate #6, but does not re-verify+re-merge already-pushed green work item by item the way earlier leaves were.

| task | role | tier | status | agent-id | workspace | branch |
|---|---|---|---|---|---|---|
| Push transport (server): VAPID sidecar in `knowledge-substrate` | work | sonnet | **done** — worker's terse report gave no evidence, doubted per house policy; manager verified independently: real commit `135d832` (push/vapid.mjs, store.mjs, payload.mjs, send.mjs, server.mjs), journal-agent.mjs NOTIFY now does a real POST instead of the log-stub. `npm test` initially showed 3 fails (missing `web-push` dep in this checkout — needed `npm install`, not a defect); after install, 301/301 pass. Pushed to `origin/main` already | `36645fc9-4a26-4008-bd06-8307649b604d` (archived) | `wks_60875da7784acc04` | merged+pushed as `135d832` on `workspace` main |
| Push transport (client): service_worker.ts push/notificationclick + subscribe UI | work | sonnet | **done** — manager verified: real bug hunt on first e2e run (test hardcodes `PUSH_SIDECAR_URL=http://localhost:9999` as its build-fixture; my first rebuild used the real 8791 key, causing an expected mismatch, not a defect — confirmed by rebuilding with the test's documented fixture values, 4/4 green). Merged+pushed as `6979b3e0`. Manager then rebuilt the LIVE instance with the REAL VAPID key + started the sidecar (`node push/server.mjs`, listening on :8791) — push is now actually wired end-to-end on the live daily-driver, not just built | `55fe7ccf-34d3-452a-819e-cecc8e89209f` (archived) | `wks_cb1b1fa51ac5e04f` | merged+pushed as `6979b3e0` on `m3e-fork` |
| Phase C #9: spaces_ui standalone screens → m3e | work | sonnet | **done** — well-reasoned skip list (fieldset/legend a11y, no-Radio-component gap, tabular data not list-shaped, all documented not silently dropped); FolderPicker/UsersView/SpaceForm reskinned, 3× `window.confirm()` → real `m3e-dialog`; manager verified 19/19 e2e fresh; merged+pushed as `9bfb51f4` | `58589769-6af1-435e-b195-7137bebc8f05` (archived) | `wks_b9a83e3279953f93` | merged+pushed as `9bfb51f4` on `m3e-fork` |
| Phase C #10: slash-menu CM autocomplete → M3E-styled (real swap or token reskin, worker's call) | work | sonnet | **done** — investigated real swap first (checked `@codemirror/autocomplete`'s actual render hooks + `m3e-menu`/`m3e-autocomplete`'s real anchor API against custom-elements.json), correctly concluded no clean swap exists (CM's caret-anchoring vs m3e-menu's fixed-trigger `.show()` API are incompatible), did an honest CSS-token reskin instead; self-caught a stale-binary bug (copied debug binary served stale CSS via baked-in `CARGO_MANIFEST_DIR`) and fixed it; manager verified 3/3 e2e fresh incl. cargo rebuild. Merged+pushed as `a75275c7`. **This closes out the entire spec — Phase A, B, C, Part 4 (v1), Part 5 all done.** | `897d5dc5-e573-4e8a-ba77-41d40c227aac` (archived) | `wks_798c2fea30796264` | merged+pushed as `a75275c7` on `m3e-fork` |

## Final whole-spec gate (2026-09-16, end of session)

Full `npx playwright test --project=chromium` (no filter, ~128 specs) run fresh against the final merged `m3e-fork` tip, real-VAPID-key deploy build: **126 passed, 2 failed** — both explained, neither a regression:
1. `multi-space-service-worker.test.ts:132` — pre-existing non-deterministic context-teardown flake under full-suite load, observed 3× today across different leaves, confirmed clean in isolation each time.
2. `push-notifications.test.ts:131` (subscribe-toggle) — expected: this build was baked with the REAL deploy `VAPID_PUBLIC_KEY`/port `8791` for the live daily-driver instance, not the test's own hardcoded fixture `localhost:9999`. Confirmed 4/4 green earlier against the matching fixture build.

**Spec status: Phase A (4/4), Phase B (3/3), Phase C (2/2), Part 4 v1 (journal-agent connector, real watch/#ping/route/write-back, stubbed classify-model-reachability/research-exec/push per sequencing), Part 5 (VAPID sidecar + client hooks, both real, wired end-to-end) — ALL DONE.** Live daily-driver: `https://jacks-macbook-pro.tail93dc3b.ts.net:8443/`, real push sidecar running on `:8791`.

## Appendix — provenance of key claims

- Fork inventory, tag wiring, broken bits: direct read of `silverbullet-m3e`
  @ `ef9a5d3a` (git diff `2b2a7c71..HEAD`, grep of `client/`), 2026-09-16.
- `@m3e/web` 2.7.12 tag catalog: `node_modules/@m3e/web/dist/custom-elements.json`
  (137 tags) + the `m3e` skill (v2.7.3 cards), 2026-09-16.
- SB v2 architecture / sanctioned extension points / fork-seam analysis:
  `workspace/knowledge-substrate/docs/2026-09-15-silverbullet-ui-improvement-report.md`
  (source-verified against a fresh SB clone).
- Substrate tooling (`sbfs`/`taxonomy`/`scrub`/`task-tools`/`pipeline`): direct
  read of `workspace/knowledge-substrate/` @ 2026-09-16 (note: the top-level
  `~/Documents/code/knowledge-substrate` is **retired/empty** — active tooling is
  under `workspace/`).
- Journal zone + AI-daily-log convention + task system: live SB space
  (`journal/index`, `journal/2026-09-15`, `Planning/2026-09-04-*`), 2026-09-16.
- Model fleet + local-model caveats: `pi`/`local-router` `list_models` +
  `list_profiles` (2026-09-16) cross-checked with memories
  [[jack-machine-fleet]], [[qwen-local-triage-capability]] (verified live, not
  taken on faith — both memories flagged stale).
- Web-Push pattern: memory [[compass-social-implementation-plan]] (VAPID +
  service worker + `pushPayloadFor`), 2026-07-20 — pattern reused, not re-derived.
