# 2026-09-17 — Vertical toolbar + search/nav bottom-sheet redesign spec

**Supersedes the UI decisions of `docs/plans/2026-09-17-nav-bar-fab-search-redesign-spec.md`**
(the horizontal `m3e-nav-bar` + FAB + non-modal panel-host design, leaves N1–N9,
merged to `m3e-fork` as `39d96047`/`afdf7953`/`08d42196`/`fbdedbaf`/`de004aaa`). Jack
is reverting that redesign back to a **vertical `m3e-toolbar`** pattern. N10
(readonly→kebab, uncommitted in worktree `nav-n10-readonly-kebab`) is **moot** —
never merge it, do not build on it. N11/N12 (delete-search_sheet, visual pass) from
that spec are also moot; this spec supplies its own versions of both.

The 2026-09-16 spec (`docs/plans/2026-09-16-toolbar-search-feedback-spec.md`) is
**not** superseded — its non-toolbar outcomes (push CORS fix, breadcrumb fix,
asterisk home, Linked Mentions card, `recency.ts`, the extracted option-builders)
all stand and are reused here exactly as they were reused by the doc this
supersedes.

Conventions inherited: bare side-effect imports (`import "@m3e/web/x"`), raw
`<m3e-*>` in Preact JSX typed via `client/components/m3e-jsx.d.ts`, no `@m3e/react`.
Repo is pinned to `@m3e/web@2.7.12` (`node_modules/@m3e/web/package.json`). Every
component API below is verified against `node_modules/@m3e/web/dist/custom-elements.json`
(cross-checked against the `m3e` skill's v2.7.3 cards — no drift found for any tag
used here) and, where behavior isn't obvious from attributes alone, the compiled
`dist/*.js`.

## §0 Jack's request, decomposed

> "the nav-bar redesign... revert to vertical toolbar. 4 buttons bottom-right:
> Search, Navigation, Journal, Notifications. Read-only stays top-right app bar.
> Deprecate Add-item/FAB — journaling is now the only way to add content. Search
> → bottom sheet, search bar on top, leading icon opens a menu to pick
> Search/Open/Run, list of recent searches below that updates live, no dropdowns.
> Navigation → bottom sheet with tabs: History/Changelog/Sitemap. Journal →
> today's journal page. Notifications → today's notifications page."

| # | Requirement | Resolution | Leaves |
|---|---|---|---|
| R1 | Vertical `m3e-toolbar`, bottom-right, exactly 4 buttons: Search, Navigation, Journal, Notifications | Resurrect-and-rewrite `floating_toolbar.tsx` (§2.1) | V4 |
| R2 | Read-only toggle **remains** top-right app bar, not kebab | **Correction to the framing** — it currently has no UI home at all (§1.3); this plan **adds** it to `top_bar.tsx`'s trailing slot | V5 |
| R3 | Deprecate Add/FAB; content only via journaling; `ItemCaptureSheet` dead | Delete `Fab()`, `ItemCaptureSheet`, its trigger (§2.3) | V3 |
| R4 | Search → bottom sheet: bar on top, leading icon → mode menu (Search/Open/Run), live recent-searches list below, **no dropdowns** | Modal `m3e-bottom-sheet` + `m3e-search-view mode="docked"` + `m3e-menu` mode-switch (§2.4) | V2, V6 |
| R5 | Recent searches must persist and update live | **Already solved** — `client.recentSearchTerms` exists and is wired (§2.5) | V6 (reuse only) |
| R6 | Navigation → bottom sheet, `m3e-tabs`: History / Changelog / Sitemap | Modal `m3e-bottom-sheet` + `m3e-tabs` (§2.6) | V7 |
| R6a | Changelog: modified pages, by whom, when | "When" free (`PageMeta.lastModified`); "who" genuinely absent — flagged, options given (§2.7) | V7 |
| R6b | Sitemap: all files + commonly navigated | "All files" free (`viewState.allPages`); "commonly navigated" nearly free via existing `lastOpened` (§2.8) | V7 |
| R7 | Journal → today's journal page | Action-only toolbar button, `"Journal: Today"` (§2.9) | V4 |
| R8 | Notifications → today's notifications page | Action-only toolbar button, **new** `"Notifications: Today"` command (§2.10) | V4, V8 |
| R9 (unstated, discovered) | Push-subscribe toggle has no home once the Notifications *panel* is deleted | Restore `pushMenuItem` to the app-bar kebab (§2.10) | V8 |

## §1 Investigation — what exists today (verified reads, `m3e-fork` @ `de004aaa`)

### 1.1 Verified component reality (new components this spec adds vs. the reverted spec)

The reverted nav-bar spec already verified `m3e-toolbar`, `m3e-bottom-sheet`,
`m3e-search-view`/`m3e-search-bar`, `m3e-fab`(-menu), `m3e-nav-bar`/`m3e-nav-item`,
`m3e-badge` against this repo's exact `dist/custom-elements.json` — those facts
still hold (`@m3e/web` version unchanged at 2.7.12) and are reused below without
re-verification where cited. **Newly verified for this spec** (attrs/slots/events
pulled directly from this repo's `node_modules/@m3e/web/dist/custom-elements.json`,
not the skill cache, since skill cards are pinned to 2.7.3 and this repo runs
2.7.12 — spot-checked, no drift found for any tag below):

| Tag | Source | Attributes | Slots | Events |
|---|---|---|---|---|
| `m3e-tabs` | `src/tabs/TabsElement.ts` | `disable-pagination`, `header-position` (`"before"\|"after"`, default `before`), `next-page-label`, `previous-page-label`, `stretch`, `variant` (`"primary"\|"secondary"`, default `secondary`) | `(default)` = tabs, `panel` = panels, `next-icon`, `prev-icon` | `change`, `beforeinput`, `input` |
| `m3e-tab` | `src/tabs/TabElement.ts` | `disabled`, `for`, `selected` | `(default)` = label, `icon` | `beforeinput`, `input`, `change`, `click` |
| `m3e-tab-panel` | `src/tabs/TabPanelElement.ts` | (none) | `(default)` | — |
| `m3e-menu` | `src/menu/MenuElement.ts` | `position-x` (`"before"\|"after"`, default `after`), `position-y` (`"above"\|"below"`, default `below`), `variant` (`"standard"\|"vibrant"`), `submenu` | `(default)` | `beforetoggle`, `toggle` |
| `m3e-menu-trigger` | `src/menu/MenuTriggerElement.ts` | `for` | `(default)` | — |
| `m3e-menu-item` | `src/menu/MenuItemElement.ts` | `disabled`, `href`/`target`/`rel`/`download` | `(default)`, `icon`, `trailing-icon` | `click` |
| `m3e-menu-item-radio` | `src/menu/MenuItemRadioElement.ts` | `disabled`, `checked` | `(default)`, `icon`, `trailing-icon` | `click` only — **no `change`/`input`** |
| `m3e-menu-item-group` | `src/menu/MenuItemGroupElement.ts` | (none) | `(default)` | — |
| `m3e-list` / `m3e-list-item` | `src/list/ListElement.ts` etc. | `variant` (list-level) | `leading`, `overline`, `supporting-text`, `trailing` | — (list-item is inert; use `m3e-list-action` for clickable rows) |
| `m3e-list-action` | `src/list/ListActionElement.ts` | `disabled`, `href`/`target`/`rel`/`download` | `(default)`, `leading`, `overline`, `supporting-text`, `trailing` | `click` |

**Load-bearing gap, verify at implementation time (V6):** `m3e-menu-item-radio`
exposes `checked` as a plain attribute and only a `click` event — **no
`change`/`input`**, unlike `m3e-nav-item`/`m3e-tab` which dispatch
`beforeinput`/`change`. Nothing in the manifest documents automatic
mutual-exclusivity within an `m3e-menu-item-group`. Do not assume the component
manages `checked` exclusivity itself — **decompile `dist/menu.js`'s
`MenuItemRadioElement`/`MenuItemGroupElement` before wiring** (same discipline the
reverted spec applied to `nav-bar.js`/`bottom-sheet.js`). If it turns out
ungoverned, drive `checked` as a Preact-controlled prop from local `mode` state on
each radio (same pattern `nav_bar.tsx` already used for `m3e-nav-item`'s
`selected`), and call `e.preventDefault()`-free `click` handlers that just set
`mode` and close the menu.

**`m3e-tabs`' own default `variant` is `"secondary"`** (thinner indicator) — use it
as-is for the Navigation sheet's 3 tabs; `"primary"` is for prominent top-level
navigation, which a sheet's internal content is not.

### 1.2 Current code state (post N1–N9, `m3e-fork` @ `de004aaa`) — what must be undone

Full diff stat for the redesign being reverted (`git diff --stat 39d96047~1..de004aaa`):
20 files changed, 2046 insertions(+), 250 deletions(-). Every file in that diff is
either deleted, rewritten, or re-touched by this plan; nothing outside it needs to
change.

| Area | File(s) : lines | Current fact |
|---|---|---|
| Nav bar shell | `client/components/nav_bar.tsx` (163L, whole file) | `NavBar()` (`:69-133`) renders `m3e-nav-bar` with Journal (`beforeinput`-cancelled, `:87-106`) + 4 mapped destinations (Recent/Search/Run/Notifications, `:107-130`, `onChange` toggles selection). `Fab()` (`:147-163`) is a single `m3e-fab` opening the capture sheet |
| Destination views | `client/components/nav_views/{recent,search,run,notifications}.tsx` | `recent.tsx` (213L): `m3e-search-view mode="docked" contained`, typed→`buildAnythingPickerOptions({mode:"all"})`+fuzzy+`$`-anchor, empty→`recentPaths` history (`:57-213`). `search.tsx` (242L): same shell, `buildAnythingPickerOptions({mode:"page"})`+delegate row, empty→`recentSearchTerms`, `client.recordSearchTerm()` on activate (`:154`). `run.tsx` (180L): `buildCommandPaletteOptions`+`triggerCommand`, empty→`orderId`(=lastRun)-sorted. `notifications.tsx` (91L): no search/picker imports at all — just `m3e-switch` + status text; exports `notificationsIconFor()` (`:53-60`), reused below |
| View state | `client/types/ui.ts:24,48,95,147-148` | `NavDestination = "recent"\|"search"\|"run"\|"notifications"`; `navDestination: NavDestination \| null` |
| Reducer | `client/reducer.ts:136-149` | `select-nav-destination`/`close-nav-panel`, pure setters, no dedup logic (toggle-on-reclick lives in `nav_bar.tsx`'s `onChange`) |
| Command retarget | `client/client.ts:572-581` | `startSearchSheet()` now dispatches `select-nav-destination("search")` (used to dispatch to the old modal). Still called from `client/editor_commands.ts:526-532`'s `"Navigate: Search Sheet"` (`Cmd/Ctrl-Shift-/`) |
| Recency stores | `client/client.ts:155,159,1205-1233`; `client/lib/recency.ts` (19L, whole file) | `recentPaths`/`recentSearchTerms` both live, both persisted via one shared `pushRecent(list, entry, isSame, cap=20)` helper. **`recentSearchTerms` already exists** — see §2.5, this resolves one of the mandated "flag the cost" items as already-solved |
| Kebab shell | `client/components/top_bar.tsx:38-44,153,178,298-331` | Generic `AppBarMenuItem[]` renderer; **no push, no read-only item built here** — `top_bar.tsx` itself never names push or read-only, it's a pure shell |
| Kebab contents | `client/editor_ui.tsx:662-711,727-751,812-821,834-842,844-847` | `menuItems = [configLinkItem, ...configMenuItems]` — **exactly two sources today**. Comment at `:812-821` confirms push was deliberately deleted from here by N9, moved to the (now-being-deleted) Notifications destination |
| Read-only — **currently orphaned** | `client/editor_ui.tsx:1069-1073` (comment only) | *"The read-only toggle's old toolbar-icon-button home is gone with the toolbar; its new home is the app-bar kebab (spec's leaf N10, not yet landed) — a deliberate, temporary gap."* **No `readOnlyMenuItem`, no readOnly icon-button, exists anywhere in the live app right now.** See §1.3 |
| FAB / capture | `client/components/item_capture_sheet.tsx` (270L, unchanged since before N1) | Still a real `m3e-bottom-sheet modal handle hideable` + 5-way `m3e-segmented-button`; triggered from `nav_bar.tsx`'s `Fab onClick` via `editor_ui.tsx:1089`, `captureSheetOpen` state (`:407`), render at `:1157-1173+` |
| Dead code, not yet deleted | `client/components/search_sheet.tsx` (414L) | **Confirmed dead**: no import remains in `editor_ui.tsx`/`reducer.ts`/`types/ui.ts`, only comments reference it as a relocation source. It's the OLD segmented-button+autocomplete design (§1.4 below) |
| Page metadata (unused so far) | `plug-api/types/index.ts:18-27` | `PageMeta` already carries `created: string`, `lastModified: string`, and `lastOpened?: number` — **all three already populated and flowing into `viewState.allPages`** (`client/reducer.ts:55,76-84`, `client/content_manager.ts:347`). Load-bearing for §2.7/§2.8 |
| Styles | `client/styles/top.scss:153-260` | `.sb-nav-bar`/`.sb-nav-panel`/`.sb-fab`/`--sb-nav-bar-height`/`#sb-editor{padding-bottom}` all live; `.sb-floating-toolbar` is fully gone (only a retrospective comment names it, `:155`) |
| e2e, live/relevant | `e2e/nav-bar.test.ts` (11 tests), `nav-recent.test.ts` (3), `nav-search.test.ts` (2), `nav-run.test.ts` (2), `nav-notifications.test.ts` (2), `app-bar-leading-trailing.test.ts` (5, one already reversed by N9), `command-palette.test.ts` (3, untouched) | Full inventory + successor mapping in §6 |
| e2e, already stale | `e2e/floating-toolbar.test.ts` (5), `e2e/search-sheet.test.ts` (7) | Reference deleted/dead components; orphaned since N2 (pending, never-executed N11 was supposed to delete these) |
| e2e, live, unrelated | `e2e/item-capture-sheet.test.ts` (2) | Currently valid (capture sheet still wired); **deleted with no successor** by this plan (§2.3) |
| Unrelated, do not touch | `command_palette.tsx`, `anything_picker.tsx`, `filter.tsx` | Confirmed **zero diff** across the entire N1–N9 range; still the sole `mode="fullscreen"` `m3e-search-view` user (`filter.tsx:109-127`), still keyboard-first, unaffected by this plan |

### 1.3 Real regression found — read-only toggle currently has no UI affordance at all

Jack's phrasing ("read-only toggle **remains** top-right app bar") assumes it is
already there. **It is not.** Tracing the history: `floating_toolbar.tsx` held it
(`readOnlyToggle` prop, icon `lock`/`lock_open`) until N2 deleted that whole file;
N10 was supposed to add it to the kebab but is stuck, uncommitted, in the isolated
`nav-n10-readonly-kebab` worktree (confirmed: `HEAD` there is still `de004aaa`, no
new commits, three files with uncommitted diffs — `editor_ui.tsx`,
`e2e/app-bar-leading-trailing.test.ts`, `e2e/nav-notifications.test.ts`). Right now,
on `m3e-fork`, **there is no way to toggle or even see read-only mode** except the
Std library's own static `lock` actionButton, which `editor_ui.tsx`'s
`filteredActionButtons` (`:662-711`) deliberately filters out to avoid duplicating
the (currently nonexistent) live one.

This plan resolves the gap by **adding** a read-only icon-button directly to
`top_bar.tsx`'s app-bar trailing slot (§2.2) — which satisfies both halves of
Jack's instruction (visibly in the top-right app bar; explicitly not in the kebab)
even though, read literally, "remains" is inaccurate. Do not skip this leaf on the
assumption the toggle is already handled somewhere.

### 1.4 What the dead `search_sheet.tsx` looked like, for context only

`search_sheet.tsx:35-42` (per the prior spec's citation, `git`-confirmed unchanged):
`m3e-bottom-sheet modal handle hideable` + a persistent `m3e-segmented-button` with
3 `m3e-button-segment`s (open/run/search) + `m3e-search-bar clearable` +
`m3e-autocomplete for=` (a real dropdown) + `m3e-list` below. **This plan does not
resurrect this file.** Its segmented-button is structurally the "always-visible
3-way switch" Jack is now replacing with a menu-behind-the-leading-icon, and its
`m3e-autocomplete` is exactly the "dropdown" Jack says must not exist. The file is
deleted outright (V3); its *logic* (already living in fresher form inside
`nav_views/{recent,search,run}.tsx`, having been improved through N6–N8's real bug
fixes — a stale-recency fix in `run.tsx`, a rebase-resolved typing fix in
`search.tsx`) is extracted from those three current files, not from the older dead
one.

## §2 Design resolutions

### 2.1 R1 — vertical toolbar shell: resurrect-and-rewrite `floating_toolbar.tsx`

The pre-nav-bar `floating_toolbar.tsx` (recovered via
`git show 39d96047~1:client/components/floating_toolbar.tsx`) is the right shape —
`m3e-toolbar vertical shape="rounded" elevated` fixed bottom-right via
`.sb-floating-toolbar` (`position:fixed;right:24px;bottom:24px;z-index:30`), a row
of `m3e-icon-button`s. `m3e-toolbar` has **no selection-manager concept** (unlike
`m3e-nav-bar` — confirmed, no `selected` attribute, no `beforeinput`/`change`
events in its manifest entry, §1.1 of the reverted spec). This is a genuine
simplification the revert buys back: no Preact-controlled `selected` state, no
`beforeinput`-cancel dance for Journal — every toolbar button is a plain,
stateless `onClick` icon-button.

**New `FloatingToolbar` props and order** (top-to-bottom in the vertical bar,
matching Jack's stated order Search/Navigation/Journal/Notifications):

```tsx
export function FloatingToolbar({
  onSearchClick,
  onNavigationClick,
  journal,
  notifications,
}: {
  onSearchClick: () => void;
  onNavigationClick: () => void;
  journal: { available: boolean; onClick: () => void };
  notifications: { iconName: string; onClick: () => void };
}) {
  return (
    <m3e-toolbar vertical shape="rounded" elevated className="sb-floating-toolbar" aria-label="Toolbar">
      <m3e-icon-button title="Search" aria-label="Search" onClick={(e: MouseEvent) => { e.preventDefault(); onSearchClick(); }}>
        <m3e-icon name="search"></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button title="Navigation" aria-label="Navigation" onClick={(e: MouseEvent) => { e.preventDefault(); onNavigationClick(); }}>
        <m3e-icon name="explore"></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button
        title="Journal" aria-label="Journal"
        disabled-interactive={!journal.available}
        onClick={journal.available ? (e: MouseEvent) => { e.preventDefault(); journal.onClick(); } : undefined}
      >
        <m3e-icon name="edit_calendar"></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button title="Notifications" aria-label="Notifications" onClick={(e: MouseEvent) => { e.preventDefault(); notifications.onClick(); }}>
        <m3e-icon name={notifications.iconName}></m3e-icon>
      </m3e-icon-button>
    </m3e-toolbar>
  );
}
```

Icon provenance: `search` and `edit_calendar` are **already proven live** in this
exact bundled font subset (used by the reverted spec's own `nav_bar.tsx` and by the
original `floating_toolbar.tsx` respectively — no re-verification needed).
`explore` (new, for Navigation) is **not yet verified** — V4's acceptance test must
decompile `client/fonts/MaterialSymbolsOutlined.woff2` with fontTools (same method
`top_bar.tsx:240-243` used for `asterisk`) and confirm the glyph exists before
committing to it; if absent, fall back to `map` or `alt_route` (also decompile-check
before using). Notifications' icon is **not hardcoded** — it's
`notificationsIconFor(pushToggle)` (§2.10), already a proven-live function.

`m3e-icon-button` itself needs no fresh verification — used identically (title +
aria-label + onClick + slotted `m3e-icon`) in `top_bar.tsx`'s existing asterisk and
kebab buttons today.

CSS: restore `top.scss`'s pre-nav-bar `.sb-floating-toolbar` rule verbatim
(`position:fixed;right:24px;bottom:24px;z-index:30`), delete `.sb-nav-bar`,
`.sb-nav-panel`, `.sb-fab`, `--sb-nav-bar-height`, and the
`#sb-editor{padding-bottom:...}` rule (the old toolbar floats *over* content by
design, unlike the full-width nav bar — no editor padding reservation needed, and
the pre-nav-bar `top.scss` never had one).

### 2.2 R2 — read-only toggle: add to `top_bar.tsx`'s trailing slot

Per §1.3, this is a genuine **add**, not a preservation. New prop on `TopBar`:

```ts
readOnlyToggle?: { active: boolean; label: string; onClick: () => void };
```

Rendered in the `slot="trailing"` span, **before** the existing kebab trigger
(`top_bar.tsx:288-303`):

```tsx
<span slot="trailing" className="sb-trailing">
  <SyncProgressIndicator percentage={progressPercentage} type={progressType} />
  {readOnlyToggle && (
    <m3e-icon-button
      title={readOnlyToggle.label} aria-label={readOnlyToggle.label}
      onClick={(e: MouseEvent) => { e.preventDefault(); readOnlyToggle.onClick(); }}
    >
      <m3e-icon name={readOnlyToggle.active ? "lock" : "lock_open"}></m3e-icon>
    </m3e-icon-button>
  )}
  <m3e-icon-button title="More actions" aria-label="More actions">
    <m3e-menu-trigger for="sb-app-bar-menu"><m3e-icon name="more_vert"></m3e-icon></m3e-menu-trigger>
  </m3e-icon-button>
</span>
```

Wiring in `editor_ui.tsx` (V8) is a 1:1 port of the old toolbar's exact logic:
`icon: isReadOnly ? "lock" : "lock_open"`,
`viewState.commands.has("Editor: Toggle Read Only Mode")` guard,
`runCommandByName("Editor: Toggle Read Only Mode")` on click. The
`filteredActionButtons` filter that drops the Std library's static `lock`
actionButton (`editor_ui.tsx:662-711`) **must stay** — its comment gets updated
from "toolbar" (its current wording, inherited from the pre-nav-bar era) to
"app-bar trailing slot."

### 2.3 R3 — deprecate Add/FAB/`ItemCaptureSheet`

Per Jack: "journaling alone" adds content now; a separate epic turns journal
entries into wiki changes (out of scope here). This plan's job is narrower and
purely subtractive:

- Delete `Fab()` from `nav_bar.tsx` (the whole file is deleted anyway, §2.1/V3).
- Delete `client/components/item_capture_sheet.tsx` outright — confirmed zero other
  callers (`grep -rn "ItemCaptureSheet\|item_capture_sheet"` outside the file
  itself and its one call site in `editor_ui.tsx`).
- Delete `captureSheetOpen` state (`editor_ui.tsx:407`) and its render block
  (`:1157-1173+`).
- Delete `e2e/item-capture-sheet.test.ts` (2 tests) — **no successor**, this is a
  removed feature, not a relocated one. Recorded explicitly in §6's mapping table
  so it isn't mistaken for an oversight.

No replacement affordance is added anywhere — this is a pure deletion, and the
plan does not touch journal-entry-to-wiki-change tooling (explicitly out of scope
per Jack's own framing).

### 2.4 R4 — Search bottom sheet, mode menu, no dropdowns

**Modality: `modal`, not the reverted spec's non-modal panel.** The reverted
spec's N4 went non-modal specifically so the *persistent* nav bar stayed clickable
while a destination panel was open (§1.3 of that spec — `modal` sets
`popover="manual"` + `inertController.lock()`, blocking everything outside,
including the nav bar itself). That constraint doesn't exist here: the vertical
toolbar's Search/Navigation buttons each open their *own* independent sheet, one
at a time, with no sibling persistent chrome that needs to stay reachable while a
sheet is open. `modal handle hideable` (the same composition `item_capture_sheet.tsx`
already uses) is simpler and correct — this is a real simplification the revert
buys back, not a step down.

**Shell:**

```html
<m3e-bottom-sheet id="sb-search-sheet" modal handle hideable open={searchSheetOpen}>
  <m3e-search-view mode="docked" contained open>
    <span slot="closed-leading">
      <m3e-icon-button title="Change search mode" aria-label="Change search mode">
        <m3e-menu-trigger for="sb-search-mode-menu"><m3e-icon name={MODE_ICON[mode]}></m3e-icon></m3e-menu-trigger>
      </m3e-icon-button>
    </span>
    <span slot="open-leading">
      <!-- identical trigger, duplicated per the search-view's open/closed slot split -->
    </span>
    <Input bare slot="input" placeholder={MODE_PLACEHOLDER[mode]} value={query} onInput={...} />
    <m3e-list>
      {(query.trim() === "" ? getHistory(mode) : getResults(mode, query)).map((row) => (
        <NavListRow key={row.key} {...row} onClick={() => activate(mode, row)} />
      ))}
    </m3e-list>
  </m3e-search-view>
</m3e-bottom-sheet>
<m3e-menu id="sb-search-mode-menu">
  <m3e-menu-item-group>
    <m3e-menu-item-radio checked={mode === "search"} onClick={() => setMode("search")}>
      <m3e-icon slot="icon" name="search"></m3e-icon>Search
    </m3e-menu-item-radio>
    <m3e-menu-item-radio checked={mode === "open"} onClick={() => setMode("open")}>
      <m3e-icon slot="icon" name="description"></m3e-icon>Open
    </m3e-menu-item-radio>
    <m3e-menu-item-radio checked={mode === "run"} onClick={() => setMode("run")}>
      <m3e-icon slot="icon" name="terminal"></m3e-icon>Run
    </m3e-menu-item-radio>
  </m3e-menu-item-group>
</m3e-menu>
```

This directly satisfies "no dropdown lists — results live inside the bottom
sheet": there is no `m3e-autocomplete` anywhere in this composition (it's the one
piece of the dead `search_sheet.tsx` deliberately not resurrected, §1.4), and the
`m3e-list` is the sheet's own slotted content, not a floating overlay.

**Mode semantics — mirror SB's native conventions exactly, per Jack's instruction,
by relocating already-proven logic rather than reinventing it:**

| Mode | Meaning | Source (extract from, don't rewrite) | Live results (typed query) | History (empty query) |
|---|---|---|---|---|
| **Search** | FTS over all text (honestly scoped — no core FTS backend exists, same limitation the reverted spec documented) | `nav_views/search.tsx:86-135` | `buildAnythingPickerOptions({mode:"page"})` fuzzy + `/^Search/`-command delegate row if one exists | `client.recentSearchTerms` |
| **Open** | filenames, SB's normal open conventions | `nav_views/recent.tsx:87-133` | `buildAnythingPickerOptions({mode:"all"})` fuzzy + `$`-anchor submode | `client.recentPaths` (≠ current page, cap 10) |
| **Run** | commands/actions | `nav_views/run.tsx:58-115` | `buildCommandPaletteOptions`+`fuzzySearchAndSort` | same options sorted by `orderId` (=`-lastRun`) |

Extract these three modes' pure logic (result-building + history-building +
activate) into `client/components/search_modes.ts` **before** deleting the three
source files (V2 precedes V3) — one small module grouped by domain concept
("search modes"), not three duplicated inline blocks, per
[[coding-preferences]]'s "modules by domain concept" and "three similar lines
before abstracting" (this is the fourth occurrence — Open/Search/Run/History-tab
all need list-row rendering, see `NavListRow` below — so extraction is warranted,
not premature).

Mode does **not** persist across sheet opens (matches the exact, already-documented
limitation the 2026-09-16 spec recorded for the old segmented-button design —
carry the honesty forward rather than silently fixing scope creep into this leaf).
Default mode on open: `"open"` (matches `floating_toolbar.tsx`'s own historical
comment: *"defaults to its 'Open' mode on open"*).

**Shared list-row extraction (`client/components/nav_list_row.tsx`, new):** all
three search modes plus the Navigation sheet's History tab render structurally
identical `m3e-list-action` rows (leading icon, label, supporting-text hint,
trailing chevron/keyboard-hint). Four call sites is above the "three similar
lines" threshold — extract one `<NavListRow icon label hint onClick>` component,
used by all four, rather than repeating the ~15-line JSX block four times.

### 2.5 R5 — recent-searches persistence: already solved, no new cost

The mandatory "flag SB-costly areas" list assumed recent-search-**query** history
might not exist (only recent **pages** were assumed tracked). Verified: it already
does. `client.ts:159` (`recentSearchTerms: {term,ts}[]`), persisted at
`["client","recentSearchTerms"]`, written by `client.recordSearchTerm()`
(`:1222-1233`, already called from `nav_views/search.tsx:154` today), rehydrated at
boot (`:1239-1240`). Same `pushRecent` cap-20 dedup helper as `recentPaths`
(`recency.ts:8-18`). **Zero new persistence work for this requirement** — Search
mode's history list in §2.4 reads this directly.

### 2.6 R6 — Navigation bottom sheet, `m3e-tabs`

```html
<m3e-bottom-sheet id="sb-navigation-sheet" modal handle hideable open={navigationSheetOpen}>
  <span slot="header">Navigation</span>
  <m3e-tabs variant="secondary">
    <m3e-tab selected for="sb-nav-history"><m3e-icon slot="icon" name="history"></m3e-icon>History</m3e-tab>
    <m3e-tab for="sb-nav-changelog"><m3e-icon slot="icon" name="update"></m3e-icon>Changelog</m3e-tab>
    <m3e-tab for="sb-nav-sitemap"><m3e-icon slot="icon" name="account_tree"></m3e-icon>Sitemap</m3e-tab>
    <m3e-tab-panel id="sb-nav-history"><HistoryTab .../></m3e-tab-panel>
    <m3e-tab-panel id="sb-nav-changelog"><ChangelogTab .../></m3e-tab-panel>
    <m3e-tab-panel id="sb-nav-sitemap"><SitemapTab .../></m3e-tab-panel>
  </m3e-tabs>
</m3e-bottom-sheet>
```

`m3e-tab`'s `for` attaches it to its panel by DOM id (verified §1.1); `selected`
on the first tab sets History as default per Jack's stated order.

**History tab** (`client/components/nav_views/history_tab.tsx`, new): plain
`m3e-list` of `client.recentPaths`, each row a `NavListRow` (§2.4), `onClick`
navigates and closes the sheet. **No input box** — unlike the reverted spec's
"Recent" destination, typed jump-to-page now lives exclusively in the Search
sheet's Open mode (§2.4), so History is purely a passive browse list. This
resolves the overlap the *first* nav-bar spec root-caused (§1.5 of that doc):
Open (type a name) and History (browse recents) are now cleanly non-overlapping
by construction, not just by convention.

### 2.7 R6a — Changelog "by whom, when": flagged, "when" free, "who" genuinely costly

**"When" — zero new cost.** `PageMeta.lastModified`/`created` (`plug-api/types/index.ts:21-22`)
are already populated ISO-string fields, already flowing through
`viewState.allPages`. `ChangelogTab` just sorts `allPages` by `lastModified`
descending and renders the timestamp — no plumbing needed.

**"Who" — genuinely absent, confirmed by exhaustive search.** `grep`s across
`server/src/lib.rs`, `state.rs`, `router.rs`, every `handlers/*.rs` for
`git log`/`git_log`/`commit`/`author` return **zero real hits** (a looser sweep
matched only false positives like `authorizer.rs`/`jwt_authorizer.rs`). There is
no git-log, blame, or author-attribution capability anywhere server-side today. SB
itself has no built-in versioning — it's a plain-file, no-DB substrate by design
(consistent with `silverbullet` skill's `reference/why-plain-markdown-substrate.md`).
Whether "who" is even meaningful depends on whether Jack's *live* space (not this
repo's untracked `demo-space/`) is single-author or git-backed with multiple
committers — this plan cannot determine that from the repo alone.

**Options, cheapest first:**

1. **(Recommended for v1) Drop "who" entirely, ship "when" only.** Zero new
   server code. Matches this codebase's own established honesty precedent (Search
   mode already ships without real FTS and says so in its placeholder/UI rather
   than faking it). `ChangelogTab` renders `page — modified {relative-time}`, no
   author column.
2. **New server endpoint.** A `git log --follow --name-only --format=%H|%an|%ae|%at`
   handler in `server/src/handlers/` (new file) + a route in `router.rs`, assuming
   the space directory is itself a git working tree. Real cost: new Rust surface,
   must degrade gracefully (empty/404) when the space isn't git-backed, and the
   assumption "the deployed space is a git repo" needs Jack's confirmation before
   building — this repo's own `demo-space/` is untracked, so it is *not* an example
   of this working today.
3. **Client-side approximation via `ds`.** Track "last edited by this client" per
   page in the existing `ds` store (mirrors `recentPaths`' own pattern) — gives a
   "you" vs "someone else" binary at best, not real names, and only for edits made
   through this exact client instance going forward (no retroactive history). Weak
   value for real cost; not recommended over option 1 or 2.

This plan's leaves build option 1. Option 2 is flagged as a real follow-up, not
built here, pending Jack confirming the live space's git-backing.

### 2.8 R6b — Sitemap "all files + commonly navigated": mostly free

**"All files" — zero new cost.** `viewState.allPages: PageMeta[]` already lists
every page (it's `AnythingPicker`'s own data source, `anything_picker.tsx:359-370`).
`SitemapTab` renders it as a flat `m3e-list` of `NavListRow`s.

**"Commonly navigated" — nearly free, one caveat.** `PageMeta.lastOpened?: number`
already exists, is already populated on every page open
(`content_manager.ts:347`: `.setAugmentation(pageName, {lastOpened: Date.now()})`),
already flows into `allPages` (`reducer.ts:55,76-84`), and is **already used**
by `anything_picker.tsx:159-160` for its own default ordering
(`orderId = -pageMeta.lastOpened`) — this is a proven, shipped pattern, not a
guess. `SitemapTab` sorts by `lastOpened` descending for a "commonly navigated"
lead section, same computation, zero new persistence.

**Caveat, state honestly in the UI:** `lastOpened` is *recency*-of-last-open, not
a true *frequency* count — a page opened once yesterday will outrank a page
opened 50 times last month. This is the same approximation `anything_picker.tsx`
already ships with today, so it's consistent, not a regression. If Jack later
wants true frequency, the fix is small and well-scoped (a new
`pageVisitCounts: Record<Path, number>` field on `Client`, incremented alongside
`lastOpened` in the same `content_manager.ts:347` call site, persisted the same
way `recentPaths`/`recentSearchTerms` already are) — flagged as a clean future
leaf, not built here since the recency proxy is free and already-proven.

### 2.9 R7 — Journal: unchanged behavior, simpler wiring

Identical guard and action to the reverted spec's N5 (`viewState.commands.has("Journal: Today")`,
`client.runCommandByName("Journal: Today")`) — only the *chrome* simplifies, per
§2.1, since `m3e-toolbar` has no selection state to fight with (no `beforeinput`
cancellation needed at all now, unlike the nav-bar version).

### 2.10 R8/R9 — Notifications: new page-link command, and where push toggle goes

**Notifications button is action-only**, structurally identical to Journal, but
there is **no existing "Notifications: Today" convention to reuse** — confirmed
absent: zero hits for any `"Notifications: ..."` command anywhere in
`client/`/`server/`/`libraries/`, and no `Notifications` directory under
`libraries/Library/Std/` (which has `Journal`, `Slash Templates`, `APIs`, `Slash
Commands`, `Docs`, `Infrastructure`, `Pages`, `Page Templates`, `Editor`,
`Widgets` — no eleventh). This is genuinely greenfield, unlike every other
button on the toolbar.

**Decision: a plain TS command, not a Std-library Space-Lua feature.** Journal's
real implementation (`libraries/Library/Std/Journal/Journal.md`) is a full
configurable feature — `journal.enabled`/`journal.template`/`journal.prefix`/
`journal.tag` config keys, a template page, three other commands. Building an
equivalent parallel system for Notifications is far more than "links to today's
notifications page" asks for. Instead, register `"Notifications: Today"` directly
in `client/editor_commands.ts` (same file that already hosts the app-specific
`"Navigate: Search Sheet"` command, `:526-532` — precedent for app-owned commands
living here rather than in `libraries/`):

```ts
{
  name: "Notifications: Today",
  run: async () => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
    await client.navigate({ path: `Notifications/${today}` });
  },
}
```

Flagged honestly: hardcoded `Notifications/` prefix, no config, no template, UTC
date (Journal's Lua `date.today()` may use local time — a minor, documented
inconsistency, not a blocker). If this needs to grow into a full parallel-to-
Journal feature (configurable prefix/template, auto-populated from real push
events) later, that is new scope, not built here.

**Push-subscribe toggle has nowhere to live once `notifications.tsx` (the panel)
is deleted.** Jack's instructions don't mention push at all — this is a
consequence his 4-button list doesn't address, surfaced here rather than silently
dropped. **Decision: restore `pushMenuItem` to the app-bar kebab** — reversing
exactly the move N9 made, symmetric to §2.2's read-only decision (kebab is where
settings-shaped, non-primary toggles belong once Notifications becomes a
navigation action rather than a settings panel). The `pushToggle` object
construction already lives in `editor_ui.tsx:488-548` independent of any view that
consumes it — restoring the kebab item is a 5-line re-add:

```ts
const pushMenuItem: AppBarMenuItem = {
  key: "push",
  icon: pushToggle.icon,
  label: pushToggle.label,
  onClick: pushToggle.onClick,
  disabled: pushToggle.disabled,
};
const menuItems: AppBarMenuItem[] = [pushMenuItem, configLinkItem, ...configMenuItems];
```

`notificationsIconFor()` (currently exported from the doomed `nav_views/notifications.tsx:53-60`)
and the duplicated `CHECKING_LABEL` constant (that file's own header comment,
`:26-35`, already flags this as a manually-kept-in-sync duplicate of
`editor_ui.tsx`'s private `PUSH_TOGGLE_LABELS.checking`) get extracted to a new
`client/lib/push_ui.ts` as part of V2 — this both preserves the toolbar's need for
`notificationsIconFor(pushToggle)` (§2.1) and **fixes** the pre-existing duplication
wart while it's being touched anyway, rather than re-duplicating it a third time.

## §3 Spec — current (post N1–N9) → target

| Element | Current | Target |
|---|---|---|
| Toolbar shell | `m3e-nav-bar`, full-width, fixed bottom:0, 5 `m3e-nav-item`s + sibling FAB | `m3e-toolbar vertical shape="rounded" elevated`, `.sb-floating-toolbar`, fixed bottom-right, 4 `m3e-icon-button`s |
| Search | Own nav-bar destination (`nav_views/search.tsx`), non-modal panel | Modal `m3e-bottom-sheet` triggered by toolbar's Search button; mode-switch via `m3e-menu` behind the search-view's leading icon, not a persistent segmented button |
| Open (jump-to-page) | Folded into "Recent" destination's typed state | Search sheet's "Open" mode |
| Run | Own nav-bar destination (`nav_views/run.tsx`) | Search sheet's "Run" mode |
| Recent/History | Own nav-bar destination, typed+history dual-purpose | Navigation sheet's "History" tab, **passive list only** (typed jump moved to Search/Open) |
| Notifications | Own nav-bar destination, push toggle + status | Toolbar action button → new `"Notifications: Today"` page nav; push toggle **restored to kebab** |
| Journal | Nav-bar action-only item, `beforeinput`-cancelled | Toolbar action-only `m3e-icon-button`, plain `onClick` (no selection state to cancel) |
| Add/FAB | `m3e-fab` → `ItemCaptureSheet` | **Deleted**, no replacement |
| Read-only | **Missing entirely** (regression, §1.3) | New icon-button, `top_bar.tsx` trailing slot |
| Push kebab item | Absent (moved to nav destination by N9) | **Restored** |
| Changelog | Does not exist | New Navigation-sheet tab, "when" only (v1) |
| Sitemap | Does not exist | New Navigation-sheet tab, all pages + `lastOpened`-recency lead section |
| View state | `navDestination: NavDestination \| null` | `searchSheetOpen: boolean`, `navigationSheetOpen: boolean` |
| `client.startSearchSheet()` | Dispatches `select-nav-destination("search")` | Dispatches `show-search-sheet` |

## §4 Footnotes

### 4.1 Why modal sheets are correct here but weren't for the nav-bar

Worth stating explicitly since it looks like a reversal: the reverted spec's
non-modal panel-host (§1.3/§2.3 of that doc) was forced by a **specific**
constraint — a persistent, always-visible nav bar that had to stay clickable
while a destination panel was open, so mode-switching could happen without
closing anything. A vertical toolbar with independent, single-purpose buttons has
no such constraint: only one sheet is ever meaningfully open at a time, and modal
(blocking, inert-locked, top-layer) is simpler and matches `item_capture_sheet.tsx`'s
already-proven pattern. This is not "redoing the same mistake" — it's a different
shell with genuinely different requirements.

### 4.2 The `nav-n10-readonly-kebab` worktree — leave it alone

Confirmed via `git worktree list`: isolated at
`/Users/jack/.paseo/worktrees/2wrtc7xr/nav-n10-readonly-kebab`, branch
`nav-n10-readonly-kebab`, `HEAD` still at `de004aaa` with uncommitted changes to
`editor_ui.tsx`/`e2e/app-bar-leading-trailing.test.ts`/`e2e/nav-notifications.test.ts`.
This plan's read-only design (§2.2) is a different implementation (app-bar
trailing slot, not kebab) — do not merge, rebase onto, or cherry-pick from that
worktree. Its resolution (discard vs. salvage) is a separate decision for Jack,
out of scope here.

### 4.3 What is deliberately not rebuilt

`buildAnythingPickerOptions`, `resolveAnythingPickerSelection`, `stripHashtags`,
`useAnchorOptions`, `buildCommandPaletteOptions`, `commandFromOption`,
`triggerCommand`, `keyboardHint`, `fuzzySearchAndSort`, `pushRecent`,
`client.recentPaths`, `client.recentSearchTerms`, `client.recordSearchTerm`,
`filter.tsx`/`AnythingPicker`/`CommandPalette` (`mode="fullscreen"`, keyboard-first
path), the kebab shell (`top_bar.tsx`'s generic `AppBarMenuItem` renderer),
`push_subscribe.ts`. Any leaf that finds itself rewriting one of these instead of
importing/relocating it has gone out of scope.

## §5 Implementation plan — atomic leaves

### P0 — foundation (V1/V2 parallel; V3 depends on V2)

- **V1 — view state.** `types/ui.ts`: delete `NavDestination`/`navDestination`,
  add `searchSheetOpen: boolean`, `navigationSheetOpen: boolean` (default `false`).
  `reducer.ts`: delete `select-nav-destination`/`close-nav-panel`, add
  `show-search-sheet`/`hide-search-sheet`/`show-navigation-sheet`/`hide-navigation-sheet`
  (plain setters, mirroring the deleted ones' style). `client.ts:572-581`
  `startSearchSheet()`: dispatch `show-search-sheet` instead. Rewrite
  `reducer.test.ts`'s 5 tests for the new actions (same structure: sets true,
  overwrites/no-ops harmlessly since booleans have no "already active" case to
  dedup, clears to false).
  **Accept:** `grep -c "navDestination\|select-nav-destination\|close-nav-panel" client/ → 0`;
  new reducer tests green.

- **V2 — extraction.** New `client/components/search_modes.ts`: pure functions
  `getOpenResults(allPages, query)`, `getOpenHistory(recentPaths, currentPath)`,
  `getSearchResults(commands, allPages, query)`, `getSearchHistory(recentSearchTerms)`,
  `getRunResults(commands, query)`, `getRunHistory(commands)`, plus `activate*`
  wrappers — extracted verbatim from `nav_views/recent.tsx:87-133`,
  `search.tsx:86-135,154`, `run.tsx:58-115` (read-only source, don't modify those
  files yet). New `client/components/nav_list_row.tsx`: `NavListRow` component,
  extracted from the shared `m3e-list-action` row shape common to all three
  view files' list rendering. New `client/lib/push_ui.ts`: `notificationsIconFor()`
  + the checking-label constant, extracted from `nav_views/notifications.tsx:26-60`
  (single source of truth, fixing that file's own documented duplication wart).
  **Accept:** unit tests for each `search_modes.ts` function against fixture data
  (page lists, command maps) proving output matches what the current
  `nav_views/*.tsx` produce today for the same inputs — this is the safety net
  that lets V3 delete the originals with confidence.

- **V3 — delete dead nav-bar code.** Delete `client/components/nav_bar.tsx`,
  `client/components/nav_views/{recent,search,run,notifications}.tsx`,
  `client/components/item_capture_sheet.tsx`, `client/components/search_sheet.tsx`
  (the old dead one, §1.4). In `editor_ui.tsx`: delete the 6 now-dead imports
  (§7 of the investigation), delete `NAV_PANEL_PLACEHOLDERS`, delete
  `captureSheetOpen` state + its render block. **Depends on V2** (logic must be
  extracted first).
  **Accept:** `grep -rc "nav_bar\|nav_views\|item_capture_sheet\|ItemCaptureSheet" client/editor_ui.tsx → 0`;
  `tsc` passes (proves nothing else still imports the deleted files); full existing
  vitest suite still green apart from the intentionally-deleted `reducer.test.ts`
  cases (already handled by V1).

### P1 — new components (parallel, each a disjoint new/rewritten file)

- **V4 — toolbar.** New `client/components/floating_toolbar.tsx` per §2.1. Restore
  `.sb-floating-toolbar` in `top.scss`, delete `.sb-nav-bar`/`.sb-nav-panel`/
  `.sb-fab`/`--sb-nav-bar-height`/`#sb-editor{padding-bottom}`.
  **Accept:** decompile `MaterialSymbolsOutlined.woff2` (fontTools) and confirm
  `explore` (or its fallback) is a real glyph in the subset **before** committing
  to it in code — do not guess; new `e2e/floating-toolbar.test.ts` (rewritten,
  §6) asserts exactly 4 icon-buttons in `.sb-floating-toolbar`, in order
  Search/Navigation/Journal/Notifications, each rendering a real (non-tofu) glyph.

- **V5 — read-only trailing button.** `top_bar.tsx` per §2.2.
  **Accept:** clicking it toggles read-only mode, icon/label reflect state,
  hidden when `"Editor: Toggle Read Only Mode"` is unavailable; asserted in
  updated `e2e/app-bar-leading-trailing.test.ts` (§6).

- **V6 — search sheet.** New composition per §2.4, wired to `search_modes.ts`
  (V2) and `show-/hide-search-sheet` (V1). Includes the `m3e-menu-item-radio`
  decompile-verification called out in §1.1 before finalizing the mode-switch
  wiring.
  **Accept:** new `e2e/search-sheet.test.ts` (rewritten, §6): opening the sheet
  shows Open mode by default with `recentPaths` history; clicking the leading
  icon opens a menu with exactly 3 items (Search/Open/Run); selecting Search
  switches placeholder + results source live; typing in any mode updates the
  `m3e-list` **without any `m3e-autocomplete`/dropdown element existing in the DOM
  at all** (explicit negative assertion — this is the exact defect class prior
  attempts shipped); submitting a Search-mode term calls `recordSearchTerm` and
  it resurfaces as history on reopen; Escape closes the sheet.

- **V7 — navigation sheet.** New `client/components/navigation_sheet.tsx` +
  `nav_views/{history_tab,changelog_tab,sitemap_tab}.tsx` per §2.6/§2.7/§2.8,
  wired to `show-/hide-navigation-sheet` (V1). `HistoryTab` depends on
  `NavListRow` (V2); `ChangelogTab`/`SitemapTab` need no extraction dependency
  (fresh logic over already-existing `allPages`).
  **Accept:** new `e2e/navigation-sheet.test.ts` (§6): opening the sheet shows
  History tab selected by default with `recentPaths` rows, no input box present;
  clicking Changelog shows pages sorted by `lastModified` descending with no
  "who"/author column rendered anywhere (proves the honest v1 scoping, not a
  silent omission); clicking Sitemap shows a row count equal to
  `viewState.allPages.length` and a "commonly navigated" lead section ordered by
  `lastOpened` descending.

### P2 — integration (V8, strictly last, hottest file)

- **V8 — `editor_ui.tsx` final wiring.** Swap the deleted `<NavBar>`/`<Fab>`/panel-
  host/`<ItemCaptureSheet>` block for `<FloatingToolbar>` (V4) +
  `searchSheetOpen`/`navigationSheetOpen` dispatch wiring (V1) + `<SearchSheet>`
  (V6) + `<NavigationSheet>` (V7); pass `readOnlyToggle` to `<TopBar>` (V5);
  restore `pushMenuItem` in `menuItems` (§2.10); register
  `"Notifications: Today"` in `client/editor_commands.ts` (§2.10) and wire the
  toolbar's `notifications.onClick`. **Depends on V3 (dead code gone) and
  V4/V5/V6/V7 (all new components exist).**
  **Accept:** full app boots; clicking each of the 4 toolbar buttons does the
  right thing; kebab shows push + config link + actionButtons (3 sources, push
  restored); app-bar trailing shows read-only + kebab (2 items); full vitest +
  e2e suite green except the files V9 hasn't rewritten yet.

### P3 — test cleanup (V9) and visual verification (V10)

- **V9 — e2e reconciliation.** Delete `e2e/{nav-bar,nav-recent,nav-search,nav-run,
  nav-notifications,item-capture-sheet}.test.ts`. Rewrite
  `e2e/floating-toolbar.test.ts` and `e2e/search-sheet.test.ts` from scratch (old
  content is stale/orphaned regardless, §1.2). Write new
  `e2e/navigation-sheet.test.ts`. Update `e2e/app-bar-leading-trailing.test.ts`
  (push-restored assertion, new read-only assertion). Every one of the ~30 old
  tests enumerated in §6 must have an entry in that table — either a named
  successor or an explicit "removed, no successor" with reason.
  **Accept:** `grep -rc "nav_bar\|NavBar\|nav_views" e2e/ → 0`; full e2e suite green.

- **V10 — visual verification.** Screenshots at 390×844 (mobile) and 1440×900
  (desktop), both live on a page with existing recent-paths/search-terms/multiple
  pages so lists aren't empty. Concrete assertions, not just "looks fine":
  1. Toolbar closed: 4 icon-buttons visible bottom-right; `.sb-floating-toolbar`'s
     rect width is small (a floating pill, not full-width) — contrast check
     against the old nav-bar's now-removed full-width assertion.
  2. Search sheet open, mode menu open: exactly 3 `m3e-menu-item-radio`s visible,
     current mode's `checked` reflected; screenshot pair before/after typing a
     query, list row count differs between the two (proves live update, not a
     static list).
  3. Search sheet: confirm zero `m3e-autocomplete` elements exist in the DOM via
     `page.locator("m3e-autocomplete").count()` → 0, screenshotted alongside.
  4. Navigation sheet on History: 3 tabs visible, History active, list populated.
  5. Navigation sheet, Changelog tab: pages + timestamps, no author column.
  6. Navigation sheet, Sitemap tab: full page count matches `allPages.length`.
  7. App bar: read-only icon-button visible in trailing slot, before the kebab
     trigger.
  8. No element's `getBoundingClientRect()` overlaps another's, in either
     viewport (carried forward from the reverted spec's own N12 convention).

### §5.1 File-overlap risk

| File | Leaves | Guidance |
|---|---|---|
| `client/editor_ui.tsx` | V1(none, only client.ts/types/reducer), V3, V8 | V3 first (dead-code removal), V8 last (hottest file, full rewiring) — strictly sequential |
| `client/types/ui.ts` + `client/reducer.ts` + `client/reducer.test.ts` | V1 | alone, first, parallel to V2 |
| `client/components/search_modes.ts`, `nav_list_row.tsx` (new) | V2 | one owner; read-only reads from doomed `nav_views/*.tsx` |
| `client/lib/push_ui.ts` (new) | V2 | same leaf as above, disjoint file |
| `client/components/nav_bar.tsx`, `nav_views/*.tsx`, `item_capture_sheet.tsx`, old `search_sheet.tsx` | V3 (delete) | after V2 lands |
| `client/components/floating_toolbar.tsx` (new) | V4 | fully parallel with V5/V6/V7 |
| `client/components/top_bar.tsx` | V5 | fully parallel with V4/V6/V7 |
| `client/components/search_sheet.tsx` (new, replaces the deleted one) | V6 | depends on V1+V2 only, parallel with V4/V5/V7 |
| `client/components/navigation_sheet.tsx` + `nav_views/{history,changelog,sitemap}_tab.tsx` (new) | V7 | depends on V1+V2 only, parallel with V4/V5/V6 |
| `client/editor_commands.ts` | V8 | same leaf as the wiring pass (registers `"Notifications: Today"`) |
| `client/styles/top.scss`, `colors.scss` | V4 (toolbar placement), V6/V7 (sheet-specific rules if any) | V4 first for the shared `.sb-floating-toolbar` token, V6/V7 additive after |
| `e2e/*` | V9 | last, after V8 |

### §5.2 Sequencing summary

```
[discard/ignore nav-n10-readonly-kebab worktree]
   ├─ V1 view state           ┐
   └─ V2 extraction           ┴─ parallel
       └─ V3 delete dead code
           ├─ V4 toolbar        ┐
           ├─ V5 read-only      │
           ├─ V6 search sheet   ├─ parallel (disjoint new files)
           └─ V7 navigation sheet ┘
               └─ V8 editor_ui.tsx wiring (hottest file, strictly last)
                   └─ V9 e2e reconciliation
                       └─ V10 visual verification
```

10 leaves. The 4-wide parallel band (V4–V7) is the throughput win, same shape as
the reverted spec's own N6–N9 band; `editor_ui.tsx` is again the unavoidable
serialization bottleneck at the very end rather than the middle, since this
design's components don't need to exist inside a shared shell until final wiring.

## §6 e2e mapping — every old nav-bar-era test accounted for

| Old test | File | Disposition |
|---|---|---|
| "renders exactly 5 nav items in order..." | `nav-bar.test.ts` | **Removed, no successor** — nav-bar shell itself is gone |
| "nav bar is fixed, flush to viewport bottom, full width" | `nav-bar.test.ts` | **Removed** — replaced by V10's "toolbar is a small floating pill, not full-width" contrast assertion |
| "clicking Recent selects only Recent; clicking again clears" | `nav-bar.test.ts` | **Removed, no successor** — toolbar has no selection state (§2.1) |
| "clicking Journal never selects any nav item" | `nav-bar.test.ts` | **Removed, no successor** — moot, toolbar buttons have no selection state at all |
| "clicking Journal while another destination selected..." | `nav-bar.test.ts` | **Removed, no successor** — same reason |
| "exactly one m3e-fab exists" | `nav-bar.test.ts` | **Removed, no successor** — FAB deprecated (§2.3) |
| "FAB sits above nav bar and inside viewport" | `nav-bar.test.ts` | **Removed, no successor** |
| "clicking FAB opens item-capture sheet" | `nav-bar.test.ts` | **Removed, no successor** |
| "panel sits above nav bar, no gap/overlap" | `nav-bar.test.ts` | **Removed, no successor** — non-modal panel-vs-nav-bar geometry no longer exists |
| "nav bar stays clickable while panel open" | `nav-bar.test.ts` | **Removed, no successor** — the specific non-modal design constraint this proved no longer applies (§4.1) |
| "Escape closes the panel" | `nav-bar.test.ts` | → **`search-sheet.test.ts`**/**`navigation-sheet.test.ts`**, "Escape closes the sheet" (V6/V7) |
| "typing a page name + Enter navigates" | `nav-recent.test.ts` | → **`search-sheet.test.ts`**, "Open mode: typed query + Enter navigates" (V6) |
| "empty-query history is recentPaths, not default order" | `nav-recent.test.ts` | → **`navigation-sheet.test.ts`**, "History tab lists recentPaths" (V7) |
| "typing $ switches to anchor mode" | `nav-recent.test.ts` | → **`search-sheet.test.ts`**, "Open mode: $ enters anchor submode" (V6) |
| "submitting a term records it, resurfaces as history" | `nav-search.test.ts` | → **`search-sheet.test.ts`**, "Search mode: recordSearchTerm + reopen history" (V6) |
| "empty query placeholder + honest FTS scope" | `nav-search.test.ts` | → **`search-sheet.test.ts`**, "Search mode placeholder + no FTS claim" (V6) |
| "typed query filters commands, Enter runs + closes" | `nav-run.test.ts` | → **`search-sheet.test.ts`**, "Run mode: typed + Enter runs, closes sheet" (V6) |
| "running a command registers recency, visible as history" | `nav-run.test.ts` | → **`search-sheet.test.ts`**, "Run mode: recency after run" (V6) |
| "Notifications shows push switch, disabled, status text" | `nav-notifications.test.ts` | **Removed, no successor** — Notifications is action-only now, no panel/switch (§2.10) |
| "kebab no longer contains push item" | `nav-notifications.test.ts` | **Reversed** → `app-bar-leading-trailing.test.ts`, "kebab contains the push toggle" (V8/V5) |
| "read-only toggle in toolbar, icon/label reflect state" (2026-09-16 era) | `floating-toolbar.test.ts` | → **`app-bar-leading-trailing.test.ts`**, "read-only trailing icon-button reflects state" (V5) — moved surfaces, not deleted |
| "search icon-button opens search sheet" | `floating-toolbar.test.ts` | → **`floating-toolbar.test.ts`** (rewritten), "Search button opens sb-search-sheet" (V4/V9) |
| "journal icon-button runs Journal: Today" | `floating-toolbar.test.ts` | → **`floating-toolbar.test.ts`** (rewritten), same assertion, V9 |
| "filled Add icon-button opens capture sheet" | `floating-toolbar.test.ts` | **Removed, no successor** — Add deprecated (§2.3) |
| "exactly 4 icon-buttons total" | `floating-toolbar.test.ts` | → **`floating-toolbar.test.ts`** (rewritten), "exactly 4 icon-buttons: Search/Navigation/Journal/Notifications" (V9) |
| 3-mode segmented-button switching (×3 tests) | `search-sheet.test.ts` (old, dead) | → **`search-sheet.test.ts`** (new), mode-menu equivalents (V6) — segmented button itself has no successor, replaced by the menu per §2.4 |
| history-per-mode (×1) | `search-sheet.test.ts` (old, dead) | → split across `search-sheet.test.ts` (Open/Search/Run history) and `navigation-sheet.test.ts` (History tab), V6/V7 |
| open/run/search activate (×3) | `search-sheet.test.ts` (old, dead) | → **`search-sheet.test.ts`** (new) per-mode activate tests, V6 |
| item-capture-sheet (×2, both) | `item-capture-sheet.test.ts` | **Removed, no successor** — feature deprecated (§2.3) |
| command-palette (×3, all) | `command-palette.test.ts` | **Unchanged** — `command_palette.tsx` untouched |
| asterisk-home, config-link, actionButtons (×3) | `app-bar-leading-trailing.test.ts` | **Unchanged** |

## Critical files for implementation

- `client/editor_ui.tsx` (hottest, V3 then V8)
- `client/components/nav_bar.tsx` + `nav_views/*.tsx` (deleted, V3, after V2 extracts their logic)
- `client/components/floating_toolbar.tsx` (new, V4)
- `client/components/search_sheet.tsx` (new, V6)
- `client/components/navigation_sheet.tsx` + `nav_views/{history,changelog,sitemap}_tab.tsx` (new, V7)
- `client/components/top_bar.tsx` (V5)
- `client/types/ui.ts` + `client/reducer.ts` (V1)
- `client/components/search_modes.ts` + `nav_list_row.tsx` + `client/lib/push_ui.ts` (new, V2)
- `client/styles/top.scss` (V4)

## Summary

- **Read-only toggle currently has no UI home at all** — a real, previously
  unflagged regression (floating toolbar deleted by N2, kebab relocation N10
  never merged). This plan adds it to the app-bar trailing slot, satisfying
  Jack's instruction's *intent* even though its literal "remains" framing doesn't
  match current reality (§1.3/§2.2).
- **Recent-search persistence is already solved** — `client.recentSearchTerms`
  exists, is wired, and needs zero new work (§2.5). One of the four mandated
  "flag the cost" items turns out to be free.
- **Sitemap's "commonly navigated" is nearly free** — `PageMeta.lastOpened` is
  already populated and already used by `anything_picker.tsx` for the exact same
  kind of ordering; a true frequency counter is a small, clean future leaf, not
  needed for v1 (§2.8).
- **Changelog "who" is genuinely unbuilt** — zero git-log/author capability
  exists server-side; "when" is free via already-populated `PageMeta.lastModified`.
  v1 ships "when" only, honestly, matching this codebase's own established
  pattern of shipping honest partial capability over faked completeness (§2.7).
- **Modal sheets are the right call here**, not a regression from the reverted
  spec's non-modal design — that design's non-modality was forced by a
  persistent nav bar's clickability requirement that a vertical toolbar with
  independent per-button sheets simply doesn't have (§4.1).
- **Push-subscribe toggle needed a new home Jack's instructions didn't
  address** — restored to the app-bar kebab, symmetric to read-only's placement
  logic (§2.10).
- **"Notifications: Today" is genuinely greenfield** — no existing library
  convention to reuse (unlike Journal's full configurable feature); scoped to a
  minimal, hardcoded TS command rather than building a parallel Space-Lua system
  (§2.10).
- **`m3e-menu-item-radio`'s exclusivity behavior is unverified** — only a `click`
  event exists in the manifest, no `change`; flagged for mandatory decompile
  verification before the mode-switch menu is wired (§1.1).
- 10 leaves, a 4-wide parallel band (V4–V7, one new file/composition each) after
  a 3-step serial foundation (V1/V2 parallel → V3), `editor_ui.tsx` again the
  unavoidable final serialization point.

## Gauntlet execution tracker

| leaf | task | agent-id | workspace | branch | status |
|---|---|---|---|---|---|
| V1 | view state (ui.ts/reducer.ts/client.ts) | `6ea0f9f9-6c1e-4b27-9d20-838500cb39a1` | `wks_0fe397e1c1cb8a49` | `redesign-v1-view-state` | **merged** — manager reran 5/5 reducer.test.ts fresh, exit 0; diff scoped to the 4 allowed files; ff-merged as `69b134e3` |
| V2 | extraction (search_modes.ts, nav_list_row.tsx, push_ui.ts) | `a4de017c-274e-4ae5-ae4d-dee1dbca46fe` | `wks_e991b5d7794ff872` | `redesign-v2-extraction` | **merged** — manager reran 22/22 (reducer+search_modes) fresh, exit 0; caught+fixed a spec typo (`m3e-list-item` not `m3e-list-action`, verified against custom-elements.json); rebased onto V1, ff-merged as `7c776716`. **Flagged: spec doc is untracked so fresh worktrees don't have it — manager now copies it into each new worktree before dispatch** |
| V3 | delete dead nav-bar code | `3df3d273-3caa-447e-92e9-7a2bdc4ccdc1` | `wks_08e03ed65e9feb20` | `redesign-v3-delete-dead-code` | **merged** — manager reran fresh: tsc clean, 102/102 files / 1185/1185 tests, 0 grep hits in editor_ui.tsx; ff-merged as `16f27408` |
| V4 | floating toolbar shell | `5d7e3696-c1a9-4ac8-bd35-0ce27913bd39` (orig) | `wks_3791d12ff0753a4a` | `redesign-v4-toolbar` | **merged** — fresh orchestrator (2026-09-18) found branch had diverged from V5 (branched pre-V5), rebased onto m3e-fork clean, reran 5/5 vitest + tsc + full suite (104 files/1193 tests) fresh, exit 0; diff scoped to floating_toolbar.tsx(+test)/top.scss/e2e stub; ff-merged as `29f13d5f`; worktree removed |
| V5 | read-only trailing button | `74a5e5cd-dce3-4fbc-8948-f61b35155d1c` | `wks_e4ee596fab6ce74d` | `redesign-v5-readonly` | **merged** — manager reran 3/3 top_bar.test.ts fresh, exit 0; diff scoped to top_bar.tsx+its test; ff-merged as `95e54fd3`. Wiring into live app deferred to V8 (expected) |
| V6 | search bottom sheet | `8cc3f48a-22bb-45e7-80a0-91c94b011518` (redispatch, prior worker died to disk-full w/ 0 commits) | `wks_1db7196e527091f8` | `redesign-v6-search-sheet` | **merged** — decompiled dist/menu.js: `checked` exclusivity IS self-managed by `M3eMenuItemRadioElement`, still drove `checked` as controlled prop (source-of-truth doubled, no conflict); zero real `m3e-autocomplete` usage confirmed by grep; manager reran fresh: tsc clean, 105/105 files / 1205/1205 (+5 pre-existing skips), diff scoped to search_sheet.tsx(+test)/e2e stub only; ff-merged as `0635bb73`; worktree removed |
| V7 | navigation bottom sheet | `881613ea-afd6-4049-bbb1-f0e248b7c6f9` (redispatch, prior worker died to disk-full w/ 0 commits) | `wks_1c1f43786ddf3a47` | `redesign-v7-navigation-sheet` | **merged** — branched pre-V6, manager rebased onto m3e-fork (had V6) clean, no conflicts (disjoint files); copied gitignored `version.json` from main checkout to clear 2 baseline tsc errors; decompiled dist/tabs.js confirming `m3e-tab-panel` self-assigns `slot="panel"`; manager reran fresh: tsc clean, 109/109 files / 1223/1223 (+5 pre-existing skips); ff-merged as `d659fdac`; worktree removed |
| V8 | editor_ui.tsx final wiring | `c3d32f8c-9e1e-44ce-8a20-42dd6df38c6f` | `wks_cd1f3eb333ed23c8` | `redesign-v8-wiring` | **merged** — branched pre-V11, manager rebased onto m3e-fork (had V11) clean, no conflicts (disjoint files); caught+fixed 2 spec sketch inaccuracies: `pushToggle` has no `icon`/`disabled` fields (real shape `active/unavailable/pending/label/onClick`, restored pre-N9 logic via `notificationsIconFor`), and `Notifications: Today` path needed `.md`+`as Path` cast (branded `Path` type requires a dot). Manager reran fresh: tsc clean, 109/109 files / 1225/1225 (+5 pre-existing skips), diff scoped to editor_ui.tsx+editor_commands.ts only; ff-merged as `52fa1492`; worktree removed |
| V9 | e2e reconciliation | `70efbaca-6cbf-4f6c-b042-f65916f2762f` | `wks_2170f7ec8ef162e4` | `redesign-v9-e2e` | **merged** — agent iterated in several autonomous bursts (Paseo reported "finished" prematurely at least once with work uncommitted; manager verified/rebiome-formatted/committed on its behalf after confirming file state had stabilized). Deleted 5 dead nav-bar-era e2e files; un-skipped floating-toolbar/search-sheet/navigation-sheet; reversed the push-toggle kebab assertion; added read-only + a bonus navigation-sheet Escape test. **Real app defect found (not fixed, correctly left `test.fixme`):** `#sb-search-mode-menu` (position-y="above") is not hit-testable when triggered from inside the modal `#sb-search-sheet` bottom-sheet — confirmed via `elementFromPoint` and a `force:true` click both landing on `#sb-root` underneath despite the popover being visually on top; likely an interaction between the sheet's `modal`-driven `inertController.lock()` and the menu's popover top-layer promotion. Blocks 2 of search-sheet's 6 e2e assertions (Search-mode selection + term-recording); Search mode itself is still reachable and correct per the co-located vitest render test, only the *e2e click path* is blocked. Also worked around an unrelated pre-existing SB gap: `viewState.allPages`'s cached `lastModified` only updates via a slow background object-index re-enrichment after save, not reflected within 30s — Changelog test now seeds via natural file-write-order mtimes instead of a live edit. Manager reran fresh: tsc clean, 109/109 files / 1225/1225 (+5 pre-existing skips) unit, 17/19 e2e passed + 2 correctly-skipped (defect above), diff scoped to e2e/ only; ff-merged as `15d02d75`; worktree removed. **V10 or a follow-up leaf should decompile `bottom-sheet.js`/`menu.js` to root-cause the hit-testing defect** — not yet done. |
| V10 | visual verification | `86379a31-0ec4-48b9-932d-a305b05c553b` | `wks_a2ed00f7e4446275` | `redesign-v10-visual` | **merged** — all 8 spec checks + a V11 offline-chip bonus check, all passing at both 390×844 and 1440×900, screenshots captured (`test-results/v10-visual/`, gitignored — confirmed complete when run isolated per-viewport; some intermediate files don't survive a combined multi-test run, a Playwright output-dir cleanup quirk, not a test-logic or app bug). **Real upstream defect found:** switching Navigation-sheet tabs leaves the previously-active `m3e-tab-panel` at `visibility: visible` (root-caused via decompile: `m3e-tabs.js`'s stylesheet falls back to the CSS-invalid string `"hidden"` for `--_tabs-slide-visibility`, silently dropped by the browser) — an `@m3e/web@2.7.12` library bug, not a `navigation_sheet.tsx` defect; tracked as `test.fixme`, fixed by V13 below. Manager reran fresh: tsc clean, 109/109 files / 1225/1225 (+5 pre-existing skips) unit, 4/4 real e2e passed (1 correctly-fixme'd); biome clean; ff-merged as `e5a92d44`; worktree removed |
| V13 | fix: nav-sheet tab-panel visibility overlap (upstream `@m3e/web` CSS-fallback bug, found by V10) — app-level workaround | `3d8ee37d-e3e8-49b7-acd0-578f195c3dab` | `wks_2370b072b4cc4b7e` | `redesign-v13-tab-panel-fix` | **merged** — independently re-confirmed V10's root cause via its own decompile+probe before trusting it. Fix: `navigation_sheet.tsx` now tracks `activePanelId` off `m3e-tabs`' public `change` event + `selectedTab` getter, sets `hidden` on every non-active `m3e-tab-panel` (controlled-prop workaround, same pattern V6 used for `checked`); added `onChange` to `M3eTabsAttributes` in the shared `m3e-jsx.d.ts`. Un-skipped V10's `test.fixme`. Manager reran fresh: tsc clean, 109/109 files / 1225/1225 (+5 pre-existing skips) unit, **9/9 e2e passed** (navigation-sheet.test.ts 4/4 + visual-verification.test.ts 5/5 including the newly-fixed overlap test), biome clean; ff-merged as `d1041727`; worktree removed. |
| — | final gate: rebuild + full-repo e2e + fix a stale reference in an unrelated file | (manager, direct, no leaf worktree) | | `m3e-fork` | Main checkout's server binary/client bundle were stale (predated all 13 leaves) — `make build-e2e` rebuilt. Full-repo `npx playwright test --project=chromium` (all ~155 tests, not just this gauntlet's files): **152 passed, 3 failed**. 2 of the 3 pre-existing/environmental (`lua-completion.test.ts` — unrelated flaky tooltip test, its sibling passed; `push-notifications.test.ts` — needs a special VAPID-configured build per its own doc header, neither file touched by any leaf). 1 real regression: `e2e/sync-progress-indicator.test.ts`'s "offline state marker" test still asserted the old `m3e-badge` V11 replaced — V11's scope was `top_bar.tsx` only and never touched this separate file. Fixed directly (not worth a 14th leaf), committed straight to `m3e-fork` as `26a2f95f`. Reran full targeted suite (24/24) + vitest (109/109, 1225/1225+5 skips) + tsc clean after. |
| V12 | fix: `#sb-search-mode-menu` not hit-testable when opened from inside modal `#sb-search-sheet` (real app bug found by V9, not just a test issue) | `e52d0827-7f4b-413b-aed3-8d71dbabed9d` | `wks_77fa08fa67eac2ae` | `redesign-v12-search-menu-hittest-fix` | **merged** — manager's dispatched hypothesis (move menu to sibling of the *sheet*) was actually inverted/wrong; agent verified live with a minimal repro rather than trusting it, and found the real cause: `m3e-search-view` (not the bottom-sheet) owns its own `InertController` and locks all its OWN siblings on docked-open — the menu, being a sibling of `m3e-search-view`, was getting inerted by that lock, not by the sheet's. Fix: render `<m3e-menu>` as a descendant of `<m3e-search-view>` instead of a sibling (menu is top-layer, so render position has no visual effect; trigger/menu still linked by `for`/`id`). Grep-confirmed this nested-menu-in-modal-sheet pattern exists nowhere else in the codebase. Manager reran fresh: tsc clean, 109/109 files / 1225/1225 (+5 pre-existing skips) unit, **19/19 e2e passed, 0 skipped** (both previously-blocked tests now pass for real); diff scoped to search_sheet.tsx + its e2e test; ff-merged as `adee3633`; worktree removed |
| V11 | offline indicator: badge dot → `m3e-chip` "Offline" in app-bar trailing (left of kebab), optional connect/disconnect snackbar | `a0f707a1-60a0-479b-8bd9-c2f3b1ec318b` | `wks_582928f93446b938` | `redesign-v11-offline-chip` | **merged** — new leaf added by Jack 2026-09-18 mid-gauntlet, not in original spec doc. Built chip + included the optional snackbar (trivial `M3eSnackbar.open()` static call, skip-on-mount ref guard). Error color via CSS custom props (`m3e-chip` has no color-role attr per custom-elements.json). Additive-only `m3e-jsx.d.ts` touch (new `m3e-chip` typing), no collision w/ V7's tabs typings in same file (verified diff). Manager reran fresh: tsc clean, 109/109 files / 1225/1225 (+5 pre-existing skips, +2 new); ff-merged as `e56e4745` (direct off current tip, no rebase needed); worktree removed |
