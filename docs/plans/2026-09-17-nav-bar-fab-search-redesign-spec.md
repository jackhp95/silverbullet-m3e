# 2026-09-17 — Nav bar + FAB + per-destination search redesign spec

Supersedes the toolbar/search half of `docs/plans/2026-09-16-toolbar-search-feedback-spec.md`
(items 2, 3, 4, 5, 11, 12 / leaves L8–L13). That spec's other outcomes — the push
CORS/proxy fix, the breadcrumb clipping fix, the asterisk home button, the Linked
Mentions `m3e-card`, `recency.ts`, and the extracted option-builders — all stand and
are *reused*, not redone.

Conventions inherited: bare side-effect imports (`import "@m3e/web/nav-bar"`), raw
`<m3e-*>` in Preact JSX typed via `client/components/m3e-jsx.d.ts`, no `@m3e/react`.
Every component API below is verified against
`node_modules/@m3e/web/dist/custom-elements.json` + the compiled `dist/*.js`.

## §0 Jack's feedback, decomposed

> "the search section is a mess. tons of overlap. Maybe search view was a better idea.
> maybe we can use a nav bar instead of a toolbar. journal, recent, search, run,
> notifications. then we can have a fab menu to add, and each option could have a
> specialized view in the bottom bar. no need for a segmented button. readonly can go
> in the kebab menu. notifications can be removed since it's in the nav bar."

| # | Requirement | Resolution | Leaves |
|---|---|---|---|
| R1 | Segmented 3-mode sheet is "a mess, tons of overlap" — diagnose why | §1.5 (root-caused, 3 independent causes) | — (informs R4) |
| R2 | Bottom **nav bar**, 5 destinations: Journal, Recent, Search, Run, Notifications | `m3e-nav-bar` + 5 `m3e-nav-item` | N1, N2 |
| R3 | **FAB** for Add ("fab menu") | single `m3e-fab` → existing `ItemCaptureSheet`; `m3e-fab-menu` verified-available but rejected (§2.2) | N3 |
| R4 | No segmented button; each destination gets its own specialized view "in the bottom bar" | **non-modal** `m3e-bottom-sheet` panel above the nav bar, content swapped per destination (§2.3) | N4, N5–N8 |
| R5a | Journal → today's journal page | action-only nav item, no panel (§2.4) | N5 |
| R5b | Recent → `client.recentPaths` list | own destination, reuses `RecentPathOption` logic | N6 |
| R5c | Search → fuzzy names/tags + FTS delegate | own destination, reuses current search-mode logic | N7 |
| R5d | Run → command palette | own destination, reuses `buildCommandPaletteOptions`/`triggerCommand` | N8 |
| R5e | Notifications → push toggle, **removed from kebab** | own destination + panel; `pushMenuItem` deleted from `menuItems` | N9 |
| R6 | Read-only toggle → kebab | new `readOnlyMenuItem` in `menuItems` | N10 |
| R7 | Asterisk home vs Journal tension | **no change**, footnote §4.1 | — |
| R8 | Where does "type any page name to open it" live? | **Recent** (§2.5) | N6 |

## §1 Investigation — what exists today (post the 2026-09-16 batch)

### 1.1 Verified component reality

`m3e-navigation-bar` **does not exist**. The real tags:

| Tag | Source | Attributes | Slots | Events |
|---|---|---|---|---|
| `m3e-nav-bar` | `src/nav-bar/NavBarElement.ts` | `mode` (`"compact" \| "expanded" \| "auto"`, default `compact`) | `(default)` = items | `change`, `input`, `beforeinput` |
| `m3e-nav-item` | `src/nav-bar/NavItemElement.ts` | `selected`, `disabled`, `disabled-interactive`, `href`, `target`, `rel`, `download`, `orientation` (`"vertical" \| "horizontal"`) | `(default)` = label, `icon`, `selected-icon` | `beforeinput`, `input`, `change`, `click` |
| `m3e-fab` | `src/fab/FabElement.ts` | `variant` (default `primary-container`), `size` (`FabSize`, default `medium`), `extended`, `lowered`, `disabled`, `href`/`target`/`rel`, `type`/`name`/`value` | `(default)` = icon, `label`, `close-icon` | `click` |
| `m3e-fab-menu` | `src/fab-menu/FabMenuElement.ts` | `variant` (`primary\|secondary\|tertiary`) | `(default)` | `beforetoggle`, `toggle` |
| `m3e-fab-menu-item` | same dir | `disabled`, `href`… | `(default)` = label, `icon` | `click` |
| `m3e-fab-menu-trigger` | same dir | `for` | — | — |
| `m3e-search-view` | `src/search/SearchViewElement.ts` | `contained`, `mode` (`"fullscreen"\|"docked"\|"auto"`), `open`, `clear-label`, `close-label`, `hide-search-icon` | `(default)` = results, `input`, `open-leading`, `open-trailing`, `closed-leading`, `closed-trailing`, `search-icon`, `close-icon`, `clear-icon` | `query`, `clear`, `beforetoggle`, `toggle` |
| `m3e-bottom-sheet` | `src/bottom-sheet/BottomSheetElement.ts` | `modal`, `open`, `handle`, `handle-label`, `hideable`, `hide-friction`, `detent`, `detents`, `overshoot-limit` | `(default)`, `header` | `opening`, `opened`, `closing`, `closed`, `cancel` |
| `m3e-badge` | `src/badge/BadgeElement.ts` | `for`, `size`, `position` (default `above-after`) | `(default)` | — |

`m3e-nav-bar`'s own docstring: *"A horizontal bar, typically used on smaller devices,
that allows a user to switch between 3-5 views."* Jack's list is exactly 5.

### 1.2 `m3e-nav-item` selection semantics (decompiled from `dist/nav-bar.js` — load-bearing)

```js
_M3eNavItemElement_handleClick = function (e) {
  if (e.defaultPrevented) return;
  if (this.dispatchEvent(new Event("beforeinput", { bubbles: true, cancelable: true }))) {
    this.selected = true;
    this.navBar?.[selectionManager].notifySelectionChange(this);
    this.dispatchEvent(new Event("input",  { bubbles: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
```

Three consequences the design depends on:

1. **Clicking never deselects.** There is no toggle-off. Selection must be
   Preact-controlled via each item's `selected` prop.
2. **`beforeinput` is cancelable and gates selection.** An action-only destination
   (Journal) can `preventDefault()` on `beforeinput`, run its action from `click`, and
   never take over the selected-destination indicator.
3. **`change` re-fires on re-click of the already-selected item.** That is the signal
   used to *close* an open destination panel — no extra affordance needed.

`m3e-nav-bar` uses `new SelectionManager().disableRovingTabIndex()`, re-dispatches a
bubbling `change`, is `display: block` with `overflow: hidden`, and supplies **no
fixed positioning of its own** — same situation as `m3e-toolbar` (see
`floating_toolbar.tsx`'s header comment), so `.sb-nav-bar` in `top.scss` must supply
placement, exactly as `.sb-floating-toolbar` does today (`top.scss:160`).

### 1.3 `m3e-bottom-sheet` modal vs non-modal (decompiled from `dist/bottom-sheet.js` — the key enabler)

```js
if (changedProperties.has("modal")) {
  this.role      = this.modal ? "dialog" : "region";
  this.ariaModal = this.modal ? "true"   : null;
  this.popover   = this.modal ? "manual" : null;   // <-- top layer only when modal
}
```

and on open, **only** in the modal path: `inertController.lock()`,
`scrollLockController.lock()`, `this.showPopover()`, plus a document-level click
handler (the backdrop dismiss). Host styles are
`position: fixed; top: calc(100dvh - var(--_bottom-sheet-height)); width: 100%;
max-width: var(--m3e-bottom-sheet-max-width, 640px)`.

**Therefore:** a *non-modal* bottom sheet is a plain fixed-position `role="region"`
in the normal layer — no popover, no inert lock, no scroll lock, no backdrop-dismiss
handler. Sibling fixed chrome (the nav bar) stays interactive and z-index-orderable
against it. This is what makes "nav bar + persistent per-destination panel" actually
composable, and it is also why today's *modal* sheet structurally **forced** a
segmented button inside itself.

### 1.4 Current code state

| Area | File | Fact |
|---|---|---|
| Toolbar | `floating_toolbar.tsx` (98 L) | `m3e-toolbar vertical shape="rounded" elevated`, exactly 4 items: read-only toggle, Search, Journal (`edit_calendar`), filled Add. Props: `journal`, `onNewClick`, `search`, `readOnlyToggle?` |
| Toolbar placement | `top.scss:160-165` | `.sb-floating-toolbar { position: fixed; right: 24px; bottom: 24px; z-index: 30 }` |
| Search sheet | `search_sheet.tsx` (414 L) | `m3e-bottom-sheet modal handle hideable open={}` + `m3e-segmented-button` (3 segments) + `m3e-search-bar clearable` (`onclear`, lowercase — documented pitfall) + `m3e-autocomplete for=` + `m3e-list`. State: `mode`, `query`, `selectedIndex`. `MODES` table carries per-mode `label`/`icon`/`placeholder`/`emptyHistoryLabel` |
| — open mode | `:171-185` | `buildAnythingPickerOptions({mode:"all",…})` + `fuzzySearchAndSort(stripHashtags(q))`; `$`-prefix → `useAnchorOptions` |
| — run mode | `:186-188` | `fuzzySearchAndSort(buildCommandPaletteOptions(commands), q)` |
| — search mode | `:193-212` | `buildAnythingPickerOptions({mode:"page"})` fuzzy + optional first row "Search space for «q»" iff a `/^Search/` command exists |
| — history | `:228-254` | empty query: open→`recentPaths` (filtered ≠ current, cap 10); run→`buildCommandPaletteOptions` sorted by `orderId` (= `-lastRun`); search→`recentSearchTerms` |
| — activate | `:258-294` | run→`onTriggerCommand`; search→`client.recordSearchTerm` then delegate or `resolveAnythingPickerSelection`; open→`onNavigateRef(recentPath)` or `resolveAnythingPickerSelection` |
| Kebab | `top_bar.tsx:293-331` | `m3e-icon-button` wrapping `m3e-menu-trigger for="sb-app-bar-menu"` in `slot="trailing"`; sibling `m3e-menu id="sb-app-bar-menu" position-y="below"`; `AppBarMenuItem = {key, icon?, label, onClick, disabled?}`; `"No actions yet"` disabled fallback |
| Kebab contents | `editor_ui.tsx:776-813` | `pushMenuItem` (8 `pushState` labels, `notifications_active`/`notifications`/`notifications_off`) → `configLinkItem` (`client.navigate({path:"CONFIG.md"})`) → `configMenuItems` (CONFIG `actionButtons`, icon deliberately unset: feather vs Material vocabularies) |
| Asterisk home | `top_bar.tsx:247-260` | `m3e-icon-button slot="leading"`, glyph `asterisk` font-verified, reuses `breadcrumbItems[0].onClick` = `"Navigate: Home"` |
| Recency | `client.ts:155-159, 1197-1232`, `lib/recency.ts` | `recentPaths`, `recentSearchTerms`, both via `pushRecent(list, entry, isSame, cap=20)` + `ds` keys `["client","recentPaths"]` / `["client","recentSearchTerms"]` |
| Command reuse | `command_palette.tsx:18-71` | exported `buildCommandPaletteOptions`, `commandFromOption`, `triggerCommand(cmd, close)`, `keyboardHint` |
| Capture sheet | `item_capture_sheet.tsx` | `m3e-bottom-sheet modal handle hideable` + 5-way `m3e-segmented-button` (task/event/contact/idea/note) + `m3e-form-field`. **Header comment records it replaced "the old 5-item 'New' `m3e-fab-menu` speed-dial"** |
| View state | `types/ui.ts:40,87,139-140`, `reducer.ts:136-147` | `showSearchSheet` + `show-search-sheet`/`hide-search-sheet` |
| Entry points | `client.ts:566`, `editor_commands.ts:531` | `client.startSearchSheet()`; command `"Navigate: Search Sheet"` (`Cmd/Ctrl-Shift-/`) |
| `m3e-search-view` today | `filter.tsx:109-288` | `mode="fullscreen" open hide-search-icon class="sb-modal-box"`, plain `<input slot="input">`, `slot="open-leading"` label, `m3e-list` results — used by `AnythingPicker` + `CommandPalette` |
| Bottom-sheet quirk | both sheets | `handle` must be forced as a real **attribute** via ref (`setAttribute("handle","")`) or the header slot is `display:none` |
| Existing e2e | `e2e/floating-toolbar.test.ts` (5 tests), `e2e/search-sheet.test.ts` (6), `e2e/app-bar-leading-trailing.test.ts` (5), `e2e/item-capture-sheet.test.ts` (2) | all four must be updated/replaced by this redesign |
| Known in-flight | two parallel worktrees | search-sheet/kebab backdrop-dismiss regression fix + service-worker single-reload fix. **Not this spec's concern** — and note the dismiss bug lives in the `modal`/popover path this spec largely retires |

### 1.5 R1 — *why* the segmented sheet is "a mess, tons of overlap" (root-caused)

Three independent, sufficient causes:

1. **The `modal` sheet structurally forced the segmented button.** Because `modal`
   sets `popover="manual"` and `inertController.lock()`, *nothing outside the sheet is
   clickable while it's open*. Any mode switch therefore had to be re-implemented
   **inside** the sheet. The segmented button is a symptom of the modality choice, not
   a design preference.
2. **Genuine result-set overlap, in code.** `search_sheet.tsx:171-185` (open) and
   `:193-202` (search) both call `buildAnythingPickerOptions` and both
   `fuzzySearchAndSort(stripHashtags(query))` over page names. Open mode is a strict
   superset (adds documents, tags, `$anchors`). So for most queries Search returns a
   **subset** of Open's rows — two modes, near-identical output. That is literally
   "tons of overlap", and no UI polish fixes it.
3. **Three semantics crammed into three rows.** One 3-row surface (segments + bar +
   list) carries three placeholders, three history sources, three Enter meanings
   (navigate / run / record-then-maybe-delegate), and a fourth hidden mode
   (`$`-anchor). Switching modes resets `query` to `""` (`:320-322`) — context is
   *thrown away* on every switch, which is the "awkward" part.

Additionally, mode is **not** a persisted or URL-addressable concept: every open
resets to `"open"` (`:136-143`). It behaves like navigation but has none of
navigation's properties — which is exactly why a **nav bar** is the right primitive.

## §2 Design resolutions

### 2.1 R1 / "maybe search view was a better idea" — **yes, in docked mode, outside `.sb-modal-box`**

`filter.tsx:109-127` records the real reason docked `m3e-search-view` was rejected in
the previous round, and it is **not** a property of the component:

> *"'docked' mode renders its own persistent anchored container + scrim on top of the
> `.sb-modal-box` chrome below — literally the 'container within a container within a
> container' nesting Jack flagged."*

The container nesting came from `.sb-modal-box`, not from `m3e-search-view`. In a
dedicated panel with no `.sb-modal-box` chrome, `m3e-search-view`'s **own documented
example** is exactly the shape each destination needs:

```html
<m3e-search-view mode="docked" contained>
  <input slot="input" placeholder="Search..." />
  <m3e-list>…</m3e-list>
</m3e-search-view>
```

What it gives us that the hand-rolled `m3e-search-bar` + `m3e-autocomplete` + `m3e-list`
stack does not:

- a real **closed↔open lifecycle** (`open`, `beforetoggle`, `toggle`) — a destination
  panel can show a collapsed bar and expand on focus, instead of being permanently
  maximal;
- built-in **clear** affordance + `clear` event, and a `query` event (no reliance on
  the lowercase-`onclear` pitfall found last round);
- `closed-leading`/`closed-trailing`/`open-leading`/`open-trailing` slots, which is
  precisely where **per-destination** chrome goes (a destination title, a Run-mode
  `terminal` icon, a Notifications toggle) — replacing the segmented button's job with
  *static per-destination* decoration;
- `contained` = "persistent, filled search container", correct for an always-visible
  panel.

**Decision:** each panel destination renders one `m3e-search-view mode="docked"
contained`. `m3e-search-bar` + `m3e-autocomplete` are retired from this surface (the
autocomplete was redundant with the `m3e-list` below it anyway — `search_sheet.tsx:367-373`
duplicates every visible row into `m3e-option`s). `filter.tsx` keeps its
`mode="fullscreen"` usage untouched.

### 2.2 R3 — FAB: **a single `m3e-fab`, not an `m3e-fab-menu`**

`m3e-fab-menu`/`m3e-fab-menu-item`/`m3e-fab-menu-trigger` are all real and verified
(§1.1), and the documented composition is a `m3e-fab-menu-trigger for="…"` nested
inside an `m3e-fab`, with the FAB's `close-icon` slot supplying the open-state icon.
So a fab menu is *available*.

It is nevertheless the wrong call, on repo evidence rather than taste.
`item_capture_sheet.tsx:11-21` documents that this exact thing already existed and was
deliberately removed:

> *"replacing three separate flows this round: 1. the old 5-item 'New' `m3e-fab-menu`
> speed-dial (floating_toolbar.tsx), 2. the old idea_capture_sheet.tsx, 3. the old
> top-aligned native-`<dialog>` `this.prompt()` flow…"*

and `:34-38`: the capture sheet's segmented picker is *ordered to match the old
fab-menu's own item order* precisely because it **is** that menu, relocated inside the
sheet where the type choice is revisable mid-compose instead of being a one-way door.
Re-adding an `m3e-fab-menu` of the same 5 types would restore a 5-item speed-dial in
front of a sheet that already has a 5-way picker — a third instance of the overlap R1
is about.

**Decision:** one `m3e-fab variant="primary" size="large"` with `<m3e-icon name="add">`,
`onClick` → `setCaptureSheetOpen(true)`. Identical behavior to today's filled Add
icon-button, correct M3 prominence, zero new surfaces. The capture sheet's own
segmented picker **is** the "fab menu" Jack is picturing — it just lives one tap
later, where it's editable.

*Escape hatch (do not build now):* if a second, genuinely different add-target ever
appears (e.g. "upload a document"), `m3e-fab-menu` becomes correct and the change is
local to `nav_bar.tsx` — the FAB already hosts the trigger slot.

### 2.3 R4 — "specialized view in the bottom bar" = **non-modal bottom sheet above a fixed nav bar**

Precise reading of Jack's phrase: the nav bar is *the* mode picker; selecting a
destination swaps the **content** of one persistent bottom panel. The nav bar does not
live inside the panel, and the panel is not a separate modal per destination.

Layout (two fixed siblings, normal layer, no popover):

```
┌──────────────────────────────────────┐
│  app bar (breadcrumb, asterisk, ⋮)   │  ← unchanged
│                                      │
│           editor content             │
│                                 (+)  │  ← m3e-fab, fixed, bottom-right,
├──────────────────────────────────────┤     above the nav bar
│  destination panel (non-modal sheet) │  ← .sb-nav-panel, only when a
│   m3e-search-view mode="docked"      │     panel destination is selected
├──────────────────────────────────────┤
│ 📅 Journal  🕘 Recent  🔍 Search  ▶ Run  🔔 Notif │  ← m3e-nav-bar, fixed bottom:0
└──────────────────────────────────────┘
```

Why non-modal (§1.3): `modal` would put the sheet in the top layer, inert everything
behind it, and make the nav bar unclickable — reproducing the exact constraint that
produced the segmented button. Non-modal keeps `role="region"`, stays in the normal
layer, and is z-index-orderable against the nav bar.

CSS contract (new `.sb-nav-bar` / `.sb-nav-panel` in `top.scss`, replacing
`.sb-floating-toolbar`):

```
--sb-nav-bar-height: 80px;   /* --m3e-nav-bar-height is the component's own token */
.sb-nav-bar   { position: fixed; inset-inline: 0; bottom: 0; z-index: 31; }
.sb-nav-panel { position: fixed; inset-inline: 0; bottom: var(--sb-nav-bar-height);
                z-index: 30; max-height: 50dvh; }
.sb-fab       { position: fixed; right: 24px;
                bottom: calc(var(--sb-nav-bar-height) + 16px); z-index: 32; }
#sb-editor    { padding-bottom: var(--sb-nav-bar-height); }  /* content not occluded */
```

**Important:** the non-modal `m3e-bottom-sheet` host is itself
`position: fixed; top: calc(100dvh - height)`, i.e. viewport-bottom-anchored and
therefore *underneath* the nav bar. Two acceptable resolutions, decided at
implementation time by whichever the acceptance test proves:
- **(a) preferred, no sheet component at all for the panel:** `.sb-nav-panel` is a
  plain repo-owned fixed `<div>` hosting the `m3e-search-view` — the *same*
  established convention by which `.sb-floating-toolbar` supplies positioning
  `m3e-toolbar` lacks (`floating_toolbar.tsx:12-15`). Simplest, zero fighting with the
  component's own `100dvh` math, fully testable.
- **(b) fallback, keep `m3e-bottom-sheet` (non-modal, `handle`, `hideable`,
  `detents="fit half"`)** for the drag/detent affordances, and raise the nav bar's
  z-index above it while adding `padding-bottom: var(--sb-nav-bar-height)` to the
  sheet's slotted content so nothing hides behind the bar.

Start with (a); leaf N4's acceptance test is written so that (b) also passes it if (a)
turns out visually wrong.

**Open/close model** (exploiting §1.2):
- Journal: `onBeforeInput` → `preventDefault()`; `onClick` → run `"Journal: Today"`.
  Never becomes the selected item; never opens a panel.
- Recent/Search/Run/Notifications: `onChange` → if already the active destination,
  close the panel and clear selection; else set it and open the panel.
- Escape closes the panel. Activating a result closes the panel (same
  `hide-*`-dispatch semantics as today). Panel state lives in `viewState`, not local
  component state, so `client.startSearchSheet()` and the
  `"Navigate: Search Sheet"` keybinding keep working (retargeted to open the panel on
  the Search destination).

### 2.4 R5a — Journal is an **action**, not a view

Today's toolbar Journal button is a one-click `"Journal: Today"` run
(`editor_ui.tsx:1087-1094`), and the destination it navigates to *is* a full-screen
page — a preview panel would be a strictly worse version of what the click already
delivers. So Journal gets **no specialized panel**: `beforeinput`-cancelled,
`click`-driven, guarded on `viewState.commands.has("Journal: Today")` (the command is
defined in Space-Lua at `libraries/Library/Std/Journal/Journal.md:116`, so it can
legitimately be absent in a space without the Std library — same guard style as
`readOnlyToggle` uses today).

This makes Journal the one "link-shaped" nav item, which is *normal* M3: `m3e-nav-item`
even ships `href`/`target`/`rel` for exactly that case (we don't use `href` here
because navigation goes through SB's command layer, not the browser's).

### 2.5 R8 — the arbitrary-page picker belongs to **Recent**

Jack's five destinations have no obvious slot for "type any page name and jump to it"
— today's `open` mode, the single most-used capability in the sheet. The three
candidate homes:

| Option | Assessment |
|---|---|
| Fold into **Search** | ✗ Recreates cause #2 of R1 verbatim: Search would again be a page-name matcher, and Recent would be a list with no query box. Two destinations, one behavior. |
| Give it a **6th destination** ("Open") | ✗ Violates R2's explicit 5, and `m3e-nav-bar`'s own "3-5 items" guidance. Also re-splits Recent/Open, which is the split Jack is collapsing. |
| **Recent** = *"jump to a page"* destination, whose *empty state* is recents | ✓ |

**Decision: Recent.** Recent is not "a list of recents" — it is the **navigate-to-a-
page destination**, whose default (empty-query) state is `client.recentPaths` and whose
typed state is today's full `open` mode verbatim (`buildAnythingPickerOptions({mode:"all"})`
over pages + documents + tags, plus the `$`-anchor sub-mode via `useAnchorOptions`).
This is standard M3/mobile practice — a search destination whose zero-query state is
history — and it is *already how the sheet's open mode behaves* (`search_sheet.tsx:232-240`),
so the diff is a relocation, not a rewrite. **Zero capability is lost.**

The distinction between the two query-bearing destinations then becomes real and
stateable in one line each, which it currently is not:

- **Recent** — *"Jump to"*: resolve a **name** to a destination (page, document, tag,
  `$anchor`). Result → navigate. Empty → recents.
- **Search** — *"Find in space"*: resolve **content**. FTS-delegate row first (iff a
  `/^Search/` command exists), then name/tag fuzzy matches as the honest fallback for
  a fork with no core FTS backend. Empty → `recentSearchTerms`.

Residual honest overlap (**must be documented in the code, not hidden**): with no core
FTS backend, Search's fallback rows are still name matches, so a query typed in either
destination can produce similar rows. The *difference in intent* is carried by the
panel's `closed-leading` label and its placeholder ("Jump to a page…" vs "Find in
space…"), and the overlap shrinks to nothing the moment a real FTS plug
(`silversearch`) is installed. This is a scope statement, not a defect — same honesty
as the previous spec's §2 FTS call.

### 2.6 R5e — Notifications destination, and removal from the kebab

Move the push toggle out of `editor_ui.tsx`'s `menuItems` (delete `pushMenuItem`
entirely, `:776-786` and `:810`) and into a Notifications destination panel. All eight
`pushState` labels and the `unavailable`/`pending` → disabled semantics are preserved;
the existing `pushToggle` object is passed to the nav bar instead of to the kebab, so
nothing about `push_subscribe.ts` or the proxy fix is touched.

The panel's content (a toggle plus status text) is thin for a whole destination. v1,
honestly scoped: a `closed-leading`-labelled panel containing the push
enable/disable control (an `m3e-switch` row reading the same three icons
`notifications_active`/`notifications`/`notifications_off`) plus the current state
label as supporting text, and — during the one-time `checking` state — a disabled row
rather than an omitted one (the kebab omitted it; a *destination* can't vanish, so it
must render disabled instead). A `m3e-badge for="sb-nav-notifications"` on the nav item
is available (verified) for a future unread count; **do not** add it in v1 — there is
no notification store in this codebase (`flashNotification` renders an `m3e-snackbar`
and drops it), so a badge would have nothing truthful to count. A persisted
notification log is a separate, later piece of work and is explicitly out of scope
here.

### 2.7 R6 — read-only moves to the kebab

The kebab (`top_bar.tsx:293-331`, `AppBarMenuItem`) already has exactly the right
shape: `icon` (Material ligature), `label`, `disabled`, `onClick`. The read-only
toggle's current toolbar wiring (`editor_ui.tsx:1067-1082`) maps 1:1 —
`icon: isReadOnly ? "lock" : "lock_open"`, the same two-state label, the same
`viewState.commands.has("Editor: Toggle Read Only Mode")` guard, the same
`runCommandByName`. Net kebab contents after this spec: **read-only toggle → config
link → CONFIG actionButtons** (push gone). Note `editor_ui.tsx:641-642`'s existing
filter that drops the Std library's static `lock` actionButton so it isn't duplicated
by our live one — that filter must **stay**, and its comment updated to say "kebab"
instead of "toolbar".

## §3 Spec — current → target

| Destination / element | Current (post 2026-09-16) | Target |
|---|---|---|
| **Chrome shell** | `m3e-toolbar vertical elevated` fixed bottom-right, 4 icon-buttons (`.sb-floating-toolbar`, `top.scss:160`) | `m3e-nav-bar` fixed `bottom:0`, full width, 5 `m3e-nav-item`s (`.sb-nav-bar`); `.sb-floating-toolbar` rule deleted; `#sb-editor` gains bottom padding |
| **Journal** | toolbar icon-button, `edit_calendar`, runs `"Journal: Today"` | `m3e-nav-item` icon `edit_calendar`, label "Journal", `beforeinput`-cancelled (never selected), same command + same availability guard |
| **Recent** | `search_sheet.tsx` `open` mode (segment 1 of 3): `buildAnythingPickerOptions({mode:"all"})` + `$`-anchors; empty → `recentPaths` | `m3e-nav-item` icon `history`, label "Recent" → panel `RecentView`: `m3e-search-view mode="docked" contained`, placeholder "Jump to a page, document, tag, or $anchor"; same builders, same `resolveAnythingPickerSelection`, same empty-state `recentPaths` |
| **Search** | `search` mode (segment 3): `buildAnythingPickerOptions({mode:"page"})` fuzzy + `/^Search/` delegate row; empty → `recentSearchTerms` | `m3e-nav-item` icon `search` → panel `SearchView`, placeholder "Find in space"; identical logic incl. `client.recordSearchTerm` and the delegate row; the FTS-out-of-scope comment carried over verbatim |
| **Run** | `run` mode (segment 2): `buildCommandPaletteOptions` + `triggerCommand`; empty → `orderId`-sorted (= `lastRun`) | `m3e-nav-item` icon `terminal` → panel `RunView`, placeholder "Command"; same builder, same `triggerCommand`, same `keyboardHint` trailing hints |
| **Notifications** | `pushMenuItem` in the app-bar kebab (`editor_ui.tsx:776-786`) | `m3e-nav-item` icon per `pushToggle` state → panel `NotificationsView` (toggle + status); **`pushMenuItem` deleted from `menuItems`** |
| **Add** | filled `m3e-icon-button` (`add`) in the toolbar → `ItemCaptureSheet` | `m3e-fab variant="primary" size="large"` (`add`) fixed above the nav bar → **the same unchanged `ItemCaptureSheet`** |
| **Read-only** | first toolbar icon-button, `lock`/`lock_open` | first `AppBarMenuItem` in the kebab, same icons/labels/guard |
| **Mode picker** | `m3e-segmented-button` + 3 `m3e-button-segment` inside the sheet (`search_sheet.tsx:311-337`) | **deleted.** The nav bar is the picker |
| **Search input stack** | `m3e-search-bar clearable` + `m3e-autocomplete for=` + `m3e-list` | `m3e-search-view mode="docked" contained` + plain `<input slot="input">` + slotted `m3e-list`; `m3e-autocomplete` dropped (it duplicated the list) |
| **Sheet modality** | `m3e-bottom-sheet modal handle hideable` (popover top layer + inert lock) | non-modal panel in the normal layer (§2.3 option (a) preferred) — nav bar stays live |
| **View state** | `showSearchSheet: boolean`, `show-/hide-search-sheet` | `navDestination: "recent"\|"search"\|"run"\|"notifications"\|null`, actions `select-nav-destination` / `close-nav-panel`; `startSearchSheet()` + `"Navigate: Search Sheet"` keep working, retargeted to `select-nav-destination("search")` |
| **Asterisk home** | `slot="leading"`, `"Navigate: Home"` | unchanged (§4.1) |
| **`filter.tsx` / `AnythingPicker` / `CommandPalette`** | `m3e-search-view mode="fullscreen"`, own keybindings | unchanged — still the keyboard-first path; the nav bar is the touch-first path over the same builders |

**Files touched:** `floating_toolbar.tsx` (**deleted**), new `nav_bar.tsx` + new
`client/components/nav_views/{recent,search,run,notifications}.tsx`, `search_sheet.tsx`
(**split apart and deleted**, its logic relocated — no logic rewritten),
`top_bar.tsx` (kebab contents unchanged structurally), `editor_ui.tsx` (wiring),
`types/ui.ts` + `reducer.ts` (state), `client.ts` (`startSearchSheet` retarget),
`styles/top.scss` + `styles/modals.scss` + `styles/colors.scss` (placement/theming).

## §4 Footnotes / flagged tensions

### 4.1 Asterisk home vs. a Journal destination (R7) — flagged, **not changed**

They are genuinely different targets: the asterisk goes to the **space index/root**
(`"Navigate: Home"`); Journal goes to **today's dated note**. Both are "go somewhere",
but so is every nav item, and M3 routinely pairs a top-bar home/brand affordance with a
bottom nav.

The real, pre-existing duplication is a different pair: the asterisk and the
breadcrumb's root "Space" segment run the **exact same command** — deliberately, and
documented as such (`top_bar.tsx:201-207`: *"one command binding, two entry points"*).
Adding a nav bar doesn't change that. **Recommendation: no change.** If the app bar is
ever decluttered, the asterisk is the redundant one (the breadcrumb root already covers
it), and nothing in the nav bar can absorb it — Recent's empty state is *recents*, not
the index page.

### 4.2 The in-flight backdrop-dismiss regression

The stuck kebab/sheet close bug being fixed in a parallel worktree lives in the
`modal` bottom-sheet path — `showPopover()` + `inertController.lock()` + the
document-level click handler (§1.3). This spec moves the *search* surface off that path
entirely (non-modal), which removes one of its two reported symptoms by construction.
**Do not** treat that as a reason to skip landing the fix: `ItemCaptureSheet` remains
`modal`, and the kebab `m3e-menu` is untouched. Land the fix first, then build on top.

### 4.3 What is deliberately *not* rebuilt

`buildAnythingPickerOptions`, `resolveAnythingPickerSelection`, `stripHashtags`,
`useAnchorOptions`, `buildCommandPaletteOptions`, `commandFromOption`,
`triggerCommand`, `keyboardHint`, `fuzzySearchAndSort`, `pushRecent`,
`client.recentPaths`, `client.recentSearchTerms`, `client.recordSearchTerm`,
`ItemCaptureSheet`, `writeCaptureItemPage`, the kebab shell, `push_subscribe.ts`. The
previous round's best outcome was that these were *extracted* rather than duplicated
(L9–L12's completion note). This redesign changes **which chrome calls them**, and
essentially nothing about what they do. Any leaf that finds itself rewriting one of
these has gone out of scope.

## §5 Implementation plan — atomic leaves

Each leaf has a cheap acceptance test. Preconditions: the two in-flight worktrees
(backdrop-dismiss, SW reload) have landed.

### P0 — state + shell (sequential; everything else depends on these)

- **N1 — view state.** `types/ui.ts`: replace `showSearchSheet: boolean` with
  `navDestination: NavDestination | null` (`"recent"|"search"|"run"|"notifications"`);
  `reducer.ts`: replace `show-/hide-search-sheet` with
  `select-nav-destination` (payload) / `close-nav-panel`, where selecting the
  already-active destination is a no-op at the reducer level (toggling is the
  component's job, so the reducer stays a pure setter). Retarget
  `client.startSearchSheet()` (`client.ts:566`) and `"Navigate: Search Sheet"`
  (`editor_commands.ts:531`) to `select-nav-destination("search")`.
  **Accept:** new unit test on `reducer.ts` — each action yields the expected
  `navDestination`; a vitest assertion that no `showSearchSheet` identifier remains
  (`grep -c showSearchSheet client/ → 0`).

- **N2 — nav bar shell.** New `client/components/nav_bar.tsx`: `m3e-nav-bar` +
  5 `m3e-nav-item`s (icons `edit_calendar`, `history`, `search`, `terminal`,
  notifications-state-dependent), `selected` Preact-controlled from `navDestination`,
  `onBeforeInput` `preventDefault()` on Journal only, `onChange` toggling. Delete
  `floating_toolbar.tsx`. New `.sb-nav-bar` + `#sb-editor` padding in `top.scss`;
  delete `.sb-floating-toolbar`.
  **Accept:** new `e2e/nav-bar.test.ts` — exactly 5 `m3e-nav-item`s in `.sb-nav-bar`
  with the expected labels in order; the bar's rect is flush to the viewport bottom
  and full-width; clicking Recent sets `selected` on Recent **and only Recent**;
  clicking Recent again clears it; clicking Journal leaves `selected` **unset on all
  five items** (this is the §1.2 `beforeinput` behavior — the test that would catch a
  regression if the component's internals ever change).

- **N3 — FAB.** `m3e-fab variant="primary" size="large"` + `<m3e-icon name="add">` in
  `nav_bar.tsx`, `.sb-fab` placement above the nav bar, `onClick` →
  `setCaptureSheetOpen(true)`. No `m3e-fab-menu` (§2.2).
  **Accept:** `e2e/nav-bar.test.ts` — exactly one `m3e-fab` exists; its rect sits
  entirely above the nav bar's rect and inside the viewport; clicking it opens
  `m3e-bottom-sheet` with the 5-way capture picker; **`e2e/item-capture-sheet.test.ts`
  passes unchanged** (proof the capture flow itself wasn't touched).

- **N4 — panel host.** `.sb-nav-panel` fixed container (§2.3 option (a)) rendering the
  active destination's view, mounted only when `navDestination !== null`; Escape
  closes.
  **Accept:** with Recent selected, `.sb-nav-panel`'s rect bottom equals the nav bar's
  rect top (no overlap, no gap) and the nav bar is still **hittable** —
  `page.locator("m3e-nav-item").nth(2).click()` succeeds *while the panel is open* and
  switches the panel (this is the single assertion that proves the non-modal /
  no-inert-lock design works, and would have failed under the old `modal` sheet).
  Escape closes the panel and leaves the editor focused.

### P1 — destination views (parallelizable after N4; one file each)

Each of N5–N9 *relocates* existing logic; none rewrites a builder (§4.3).

- **N5 — Journal.** Action-only nav item (no view file). Guarded on
  `viewState.commands.has("Journal: Today")`; disabled (`disabled-interactive` so the
  tooltip still reads) when absent.
  **Accept:** clicking Journal navigates to today's dated journal page and **opens no
  panel** (`.sb-nav-panel` absent) — a port of `e2e/floating-toolbar.test.ts:74`.

- **N6 — `nav_views/recent.tsx`.** `m3e-search-view mode="docked" contained` +
  `<input slot="input">` + `m3e-list`. Empty query → `recentPaths` (≠ current, cap 10);
  typed → `buildAnythingPickerOptions({mode:"all"})` + `fuzzySearchAndSort` + the
  `$`-anchor sub-mode; Enter/click → `resolveAnythingPickerSelection`. Arrow-key
  `selectedIndex` carried over from `search_sheet.tsx:347-364`.
  **Accept:** ports `e2e/search-sheet.test.ts:50` (type a page name, Enter navigates)
  and `:132` (empty-query history **is** `recentPaths`, not default page order) to the
  Recent destination; plus a new assertion that typing `$` enters anchor mode.

- **N7 — `nav_views/search.tsx`.** Same shell; delegate row + name/tag fallback +
  `client.recordSearchTerm`; empty → `recentSearchTerms`. Placeholder "Find in space".
  **Accept:** ports `e2e/search-sheet.test.ts:101` (submitting a term records it and it
  resurfaces as history on reopen) to the Search destination.

- **N8 — `nav_views/run.tsx`.** Same shell; `buildCommandPaletteOptions` +
  `triggerCommand`; empty → recency order.
  **Accept:** ports `e2e/search-sheet.test.ts:71` minus the segment-switching half
  (running a command works and registers its recency, visible as history on reopen);
  **`e2e/command-palette.test.ts` passes unchanged**.

- **N9 — `nav_views/notifications.tsx`** + delete `pushMenuItem` from
  `editor_ui.tsx:776-786,810`. Toggle + status; `checking` renders **disabled**, not
  omitted. No badge (§2.6).
  **Accept:** ports `e2e/app-bar-leading-trailing.test.ts:117` to the nav destination
  (all `pushToggle` states reachable, disabled when `unavailable`/`pending`) **and**
  asserts `#sb-app-bar-menu` contains **no** notifications item — the no-duplication
  half of R5e, which is the part easiest to forget.

### P2 — kebab + cleanup (after N2; N10 touches `top_bar.tsx`/`editor_ui.tsx` only)

- **N10 — read-only → kebab.** New `readOnlyMenuItem` as the first `AppBarMenuItem`;
  `menuItems = [readOnlyMenuItem?, configLinkItem, ...configMenuItems]`. Update
  `editor_ui.tsx:636-640`'s `lock`-filter comment to say "kebab".
  **Accept:** ports `e2e/floating-toolbar.test.ts:99` to the kebab (toggle flips
  read-only, icon/label reflect state, absent when the command is unavailable); the
  other four `app-bar-leading-trailing` tests pass unchanged.

- **N11 — delete `search_sheet.tsx`** once N6–N8 own its logic; delete
  `e2e/floating-toolbar.test.ts` and `e2e/search-sheet.test.ts` (fully superseded by
  N2/N5–N9's ports — every one of their 11 tests must have a named successor, listed in
  the leaf's report); prune `.sb-search-sheet-*` rules from `modals.scss:191-203` and
  `colors.scss:148`; drop the now-unused `@m3e/web/segmented-button` /
  `@m3e/web/autocomplete` imports from the retired file (both are still used by
  `item_capture_sheet.tsx` / elsewhere — verify before touching any shared import).
  **Accept:** `grep -rc "search_sheet\|sb-search-sheet" client/ e2e/ → 0`; full vitest
  + e2e suite green; no `m3e-segmented-button` remains outside
  `item_capture_sheet.tsx`.

- **N12 — visual verification pass** on the live instance (mobile + desktop widths):
  nav bar reachable one-handed, FAB not occluding the panel, panel not occluding the
  last editor line, `mode="auto"` behavior at wide widths decided explicitly (compact
  vs expanded — pick one and write it down rather than inheriting the default
  silently).
  **Accept:** screenshots at 390×844 and 1440×900 recorded in the plan doc; no
  element's rect overlaps another's in either.

### §5.1 File-overlap risk (for the dispatching manager)

| File | Leaves | Guidance |
|---|---|---|
| `client/editor_ui.tsx` | N1, N2, N3, N4, N5–N9 (wiring), N10, N11 | **hottest file, as last round.** Strictly sequential. Land N1→N4 as one serialized chain, then give **one** owner the N5–N9 wiring block, then N10, then N11 |
| `client/components/nav_bar.tsx` (new) | N2, N3, N5 | one owner, sequential — small file, don't split it |
| `client/components/nav_views/*.tsx` (new) | N6, N7, N8, N9 | **fully parallel — one file each, zero shared edits.** The only true parallelism in this plan; use it |
| `client/components/floating_toolbar.tsx` | N2 (delete) | delete in N2, not later — leaving it dead invites a second render target |
| `client/components/search_sheet.tsx` | N6–N8 (read-only source), N11 (delete) | **read-only** until N11. N6–N8 copy logic *out*; nobody edits it |
| `client/components/top_bar.tsx` | N9 (comment), N10 | serialize N9 → N10; shell/`AppBarMenuItem` shape unchanged |
| `client/types/ui.ts` + `client/reducer.ts` | N1 only | do first, alone |
| `client/client.ts` + `client/editor_commands.ts` | N1 | same leaf as the state change |
| `client/styles/top.scss` | N2, N3, N4 | same chain as its leaves; one `--sb-nav-bar-height` token, referenced by all three |
| `client/styles/{modals,colors}.scss` | N11 | last, after the sheet is gone |
| `e2e/floating-toolbar.test.ts`, `e2e/search-sheet.test.ts` | N5–N10 (port from), N11 (delete) | **do not delete before every test has a named successor** — N11's report must map all 11 old tests to new ones |
| `client/components/item_capture_sheet.tsx` | **none** | must not be edited by any leaf (N3 changes only its trigger) |
| `client/components/filter.tsx`, `anything_picker.tsx`, `command_palette.tsx` | **none** | read-only; they keep their `mode="fullscreen"` path and keybindings |

### §5.2 Sequencing summary

```
[land in-flight fixes]
   └─ N1 state
       └─ N2 nav bar shell (+ delete toolbar)
           ├─ N3 FAB
           └─ N4 panel host
               ├─ N5 Journal
               ├─ N6 Recent      ┐
               ├─ N7 Search      ├─ parallel, one file each
               ├─ N8 Run         │
               └─ N9 Notifications ┘
                   └─ N10 read-only → kebab
                       └─ N11 delete search_sheet + CSS + old e2e
                           └─ N12 visual verification
```

12 leaves. The 4-wide parallel band (N6–N9) is the throughput win; N1→N4 and N10→N12
are unavoidably serial on `editor_ui.tsx`.

## Summary

- **`m3e-navigation-bar` does not exist** — the real component is **`m3e-nav-bar` +
  `m3e-nav-item`**, and its own docs specify 3–5 destinations (Jack's list is exactly 5).
- **`m3e-fab-menu` is real but the wrong call**: `item_capture_sheet.tsx`'s own header
  records that a 5-item `m3e-fab-menu` speed-dial *already existed and was deliberately
  replaced* by the capture sheet's segmented type picker. One `m3e-fab` → the unchanged
  capture sheet (§2.2).
- **The segmented button was a symptom of modality, not of taste.** `modal` on
  `m3e-bottom-sheet` sets `popover="manual"` + `inertController.lock()`, so nothing
  outside the sheet is clickable and the mode switch *had* to live inside it. A
  **non-modal** panel makes the nav bar the switch, and the segmented button simply
  disappears (§1.3, §2.3).
- **The overlap is real and in the code**, not a feeling: open mode and search mode both
  call `buildAnythingPickerOptions` + `fuzzySearchAndSort` over page names, with search
  a strict subset of open (§1.5).
- **"Search view was a better idea" is correct, and the prior rejection was
  narrower than remembered**: `filter.tsx:110-127` rejected *docked* mode only because
  it nested inside `.sb-modal-box`. Outside that chrome,
  `<m3e-search-view mode="docked" contained>` is the component's own documented example
  and gives us the open/close lifecycle + per-destination `closed-*` slots that replace
  the segmented button's job (§2.1).
- **`m3e-nav-item` never deselects and re-fires `change` on re-click; `beforeinput` is
  cancelable and gates selection** — which is exactly what makes Journal an
  action-not-a-destination and re-click a panel-close signal (§1.2).
- **The page-picker capability lands in Recent** — "jump to a page", whose empty state is
  `recentPaths` and whose typed state is today's `open` mode verbatim. Nothing dropped;
  the Recent-vs-Search line becomes stateable in one sentence each (§2.5).
- **Asterisk home: no change**, footnote only; the genuine (and deliberate, documented)
  duplication is asterisk vs. the breadcrumb root, and it predates the nav bar (§4.1).
- 12 leaves, with a 4-wide parallel band (one file per destination view) and
  `editor_ui.tsx` again the serialization bottleneck.

## Gauntlet execution tracker

| leaf | task | agent-id | workspace | branch | status |
|---|---|---|---|---|---|
| N1-N4 | view state + nav-bar shell + FAB + panel host (placeholders) | `f53dc1ed-e213-448e-b19e-5290a948ed4c` | `wks_68a22aab37986b81` | `nav-n1-view-state` | **done** — verified `m3e-nav-item`'s beforeinput-gates-selection behavior against compiled source, not just the spec's restatement; caught+fixed a real CSS-token gap (`--sb-nav-bar-height` vs `--m3e-nav-bar-height` not tied, 12px layout gap) via its own e2e; correctly reasoned that 12 "failures" (floating-toolbar+search-sheet tests) are a designed multi-leaf gap, not a regression. Manager verified 9/9 vitest + 13/13 e2e fresh incl. the load-bearing "nav bar clickable while panel open" proof. Merged+pushed as `39d96047` | 
| N5 | Journal action-only item | — | — | — | **already done** — included in N1-N4's combined implementation |
| N6 | Recent destination view | `b946eb70-4578-4c20-8212-7a038bf44fb6` | `wks_40cdf2f865fafdd7` | `nav-n6-recent` | **done** — smart sibling-conflict avoidance (surgical ternary swap on just the "recent" branch, left `NAV_PANEL_PLACEHOLDERS` intact for N7/N8/N9); correctly did NOT control `m3e-search-view`'s `open` attr after decompiling `dist/search.js` and finding it drives its own open/close off focus/blur internally. Manager verified 14/14 fresh. Merged+pushed as `afdf7953` |
| N7 | Search destination view | `ca1cdd09-d93c-4004-acbb-6d5ffc4f9bb4` | `wks_1ee08ff0e36af7dd` | `nav-n7-search` | **done** — hit a real rebase conflict against N6 (both touched `NAV_PANEL_PLACEHOLDERS`), correctly resolved by following N6's own established pattern rather than its own original narrower typing. Manager verified 16/16 fresh (own 2 + N6 + N1-N4 regression). Merged+pushed as `08d42196` |
| N8 | Run destination view | `e4921c8d-bd98-42c7-bc9a-941cb5f6527d` | `wks_7e88d8c3dc5082df` | `nav-n8-run` | **done** — diagnosed a genuine stale-recency edge case (the old sheet's single entry point awaited a command-augmenter refresh, the nav bar's direct dispatch has no such chokepoint) and self-containedly fixed it inside its own file rather than touching unauthorized shared wiring; caught its own silent rebase-conflict prop-drop via `tsc`. Rebased 3x (last to land in the band). Manager verified 23/23 fresh — **the full 4-wide parallel band (N6/N7/N8/N9) is now confirmed merged together with zero regressions.** Merged+pushed as `de004aaa` | 
| N9 | Notifications destination view + kebab dedup | `4a62682f-4be1-408a-a171-fda01083c59b` | `wks_c38dc939b3184c58` | `nav-n9-notifications` | **done** — resolved 2 rebase conflicts (against N6 then N7), correctly used `toHaveJSProperty` after finding `m3e-switch`'s `disabled` isn't a reflected attribute, honestly documented one genuinely untestable "checking" state under headless Chromium's hardcoded permission stub. Manager verified 23/23 fresh (own 2 + kebab-dedup assertion + N1-N4/N6/N7 full regression). Merged+pushed as `fbdedbaf` | 
| N10 | read-only → kebab | `2feb8f91-a8f2-40ce-8b92-903700bd946d` | `wks_a7ec63f1cbc6fab7` | `nav-n10-readonly-kebab` | dispatched (parallel band done, unblocked) |
| N11 | delete search_sheet.tsx + old e2e + CSS | — | — | — | queued |
| N12 | visual verification pass | — | — | — | queued |

### Critical Files for Implementation
- `client/editor_ui.tsx`
- `client/components/search_sheet.tsx`
- `client/components/floating_toolbar.tsx`
- `client/components/top_bar.tsx`
- `client/types/ui.ts` + `client/reducer.ts`
