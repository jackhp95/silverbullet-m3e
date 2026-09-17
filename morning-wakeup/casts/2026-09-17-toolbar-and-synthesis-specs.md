# Two Specs: The M3e Toolbar Rework and the Journal Synthesis Engine

A comprehensive walkthrough of the two planning documents produced on 2026-09-17
for the `silverbullet-m3e` project — a SilverBullet fork being reskinned with the
M3e (Material 3 Expressive) web-component library. One spec is a shovel-ready UI
redesign; the other is a research-and-recommendation for a journal-driven content
synthesis pipeline.

## Where the project stood before today

The branch `m3e-fork` had just merged a full horizontal navigation-bar redesign —
leaves N1 through N9 — replacing an older vertical floating toolbar. That work
gave the app a bottom `m3e-nav-bar` with five destinations (Journal, Recent,
Search, Run, Notifications), a floating action button for adding content, and
per-destination bottom-sheet panels. N10 (moving the read-only toggle into a
kebab menu) was still uncommitted, with N11 and N12 queued.

Then the direction changed.

## Spec one: revert to a vertical toolbar

The first decision was to **abandon the horizontal nav-bar and return to a
vertical toolbar** pinned bottom-right — the old `m3e-toolbar vertical` pattern,
but rebuilt. This spec lives at
`docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md` and
supersedes the UI half of the just-merged nav-bar spec.

The new toolbar carries exactly four buttons: **Search, Navigation, Journal,
Notifications**. The read-only toggle stays in the top-right of the app bar — not
the kebab. The FAB and the whole "add item" pattern are deprecated; new content
now enters through journaling alone (which is what spec two is about).

### The search sheet

Search opens a bottom sheet with a search bar at the top. The left icon defaults
to a search glyph; tapping it opens a menu to switch mode between **Search**
(full-text over all content), **Open** (filenames, following SilverBullet's usual
open conventions), and **Run** (commands and actions). Below the bar, a live
`m3e-list` of recent searches updates as the query changes. The critical
constraint: **no dropdown lists** — results live inside the sheet itself. Prior
attempts at search had been rough precisely because of dropdown behavior, so the
plan includes an explicit screenshot-verification leaf with concrete assertions.

### The navigation sheet

Navigation opens a bottom sheet with `m3e-tabs`: **History** (visited pages),
**Changelog** (what changed, by whom, when), and **Sitemap** (all files plus
commonly-navigated ones). Journal and Notifications buttons are simple links to
today's respective pages.

### What the planning agent discovered

Several assumptions flipped once the code was actually checked:

- The **read-only toggle currently has no UI home at all** on `m3e-fork` — a live
  regression left by deleting the old toolbar before the N10 relocation merged.
  The plan restores it fresh to the app-bar trailing slot.
- **Recent-search persistence was already solved** — `client.recentSearchTerms`
  exists. A flagged cost turned out free.
- **Sitemap "commonly navigated" is nearly free** via the already-populated
  `PageMeta.lastOpened`.
- **Changelog "who" is genuinely unbuilt** — there's no server-side git-log
  capability anywhere. "When" is free via `PageMeta.lastModified`; author
  attribution needs new work or gets deferred.
- **`m3e-menu-item-radio` has no `change` event** — flagged for mandatory
  decompile verification before the mode-switch menu gets wired.
- **Modal bottom-sheets are correct here**, not a step backward from the reverted
  non-modal design — it's a different constraint.

The plan is ten leaves, with a full end-to-end successor mapping for the roughly
thirty existing e2e tests.

## Spec two: the journal synthesis engine

The second effort is bigger in ambition: journal freely in one place, and when an
entry is marked done, a language-model agent synthesizes it and routes the pieces
across the wiki — a contact into contacts, an event into the calendar, a to-do
into the to-do list. On completion, a push notification fires and a summary is
appended to the day's notifications page. The chosen gateway is LiteLLM.

This spec is a research-and-recommendation doc at
`docs/plans/2026-09-17-journal-synthesis-pipeline-research.md`, because the engine
placement was deliberately left open for investigation.

### The headline finding: it's not greenfield

The research turned up
`workspace/knowledge-substrate/pipeline/journal-agent.mjs` — a real, merged
pipeline with thirty-five tests that **already** does watch, classify, route,
write-back, and notify, with push wiring in place. The notification and
notes-page-summary asks are effectively already built.

The gaps against today's vision are narrower than expected: the trigger is
continuous rather than marker-gated; it uses a local model over Ollama rather
than LiteLLM with tool-calling; and there's no debounced backup-commit and no
host-level file watcher.

### The recommendation

An **external file-watcher daemon on the SilverBullet host**. A single
idle-debounce pass does two jobs at once: commit changes to the backup repo, and
scan for the synthesis marker. It reuses the existing pipeline's watch, route,
write-back, and notify stages — swapping only the trigger gate and the model
backend.

Two sharp details:

- The marker is a **dedicated `#queue/synth` tag**, not `#done` — avoiding the
  overloading of `#done`'s existing meaning and side effects.
- Consumption goes through an **external ledger** (a watch-state file), *not* by
  stripping the marker from the page — because stripping is itself a file write
  that would race the idle timer and risk re-triggering.

And a structural constraint: **SilverBullet itself can't host the trigger.** Its
only save-hook is client-tab-only and fires nothing for API or headless writes.

## How the two connect, and what's next

Both epics now have documents. The UI spec is shovel-ready. The synthesis spec
awaits a green-light before its implementation plan gets written. Two decisions
are still open on the UI side: whether the push-notification toggle belongs in
the kebab (the agent's default), and whether to build a server git-log path for
changelog authorship or ship without "who" for now.

Housekeeping along the way: the moot N10 worktree and branch were discarded
cleanly — no unique commits lost — leaving only an empty Paseo workspace record
for the reaper to sweep.
