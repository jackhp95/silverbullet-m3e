# 2026-09-22 — Large app bar + inline front matter + scroll-snap pull-to-reveal (V5b)

> **For agentic workers:** This is a plan, not a diff. Follow the leaves (L1…L13) in
> order — each is bite-sized, names its exact files, and states its own
> verification. Do not skip the investigation section (§0/§1) before touching code;
> it records load-bearing facts (especially §1.4/§1.5) that are easy to silently
> break if you start from the mockup's HTML alone.

**Goal:** Replace the sticky `size="small"` app bar + collapsing breadcrumb row
with a non-sticky `size="large"` app bar whose leading slot is the breadcrumb
itself, whose title/subtitle are the page name and edit-info, and which sits in
a genuine top-to-bottom scroll flow **below an inline front-matter property
list** and **above the page body** — with the page loading snapped to the app
bar by default, front matter revealed by pulling up.

**Non-goals:**
- Do not touch `client/components/navigation_sheet.tsx`, `client/components/search_sheet.tsx`,
  or `bin/silverbullet/src/{embed,multi,single}.rs` / `server/src/**` — these have
  unrelated uncommitted changes already in the tree (kebab-menu label-overflow
  fix, unrelated server work); leave them alone.
- Do not build a fully general, lossless structured-YAML editor (arbitrary
  nesting, block-style multi-line collections, comment preservation). §4/L4's
  inline editing is real writeback, not a stub, but it is explicitly scoped to
  single-line scalar and flow-style values — see L4's "type handling" section
  and the block-value fallback it specifies.
- Do not change `@m3e/web`'s pinned version (2.7.12) or vendor a newer one.
- Do not attempt this on the Rust server — this is a client-only redesign; the
  live `:3333` debug server reads the client bundle from disk, so only
  `npm run build:client` is needed to see changes (§6).

**Architecture:** Keep the app bar as ordinary Preact/light DOM (reject
CM-widget-as-appbar — §2). Introduce one new light-DOM scroll+snap container
(`#sb-page-scroll`) that becomes the sole child of `m3e-drawer-container`'s
default slot, holding — in document order — the new front-matter property
list, the (now non-sticky) `<TopBar>`, and the CodeMirror editor host.
CodeMirror is reconfigured to auto-height ("page scrolls" mode, a
documented CM6 pattern) so its content participates in that one scroll flow
instead of owning its own. Every existing consumer of
`editorView.scrollDOM.scrollTop` is repointed at the new container (§2.3) —
this is the single riskiest, easiest-to-miss piece of the whole plan.

**Tech Stack:** Preact + TSX (`client/`), CodeMirror 6 (`client/codemirror/`),
`@m3e/web@2.7.12` custom elements, SCSS (`client/styles/`), Playwright e2e.

**Mockups (read before starting):**
- `/tmp/sb-appbar-mockups/v5b.html` — the approved, live, self-contained mockup.
  Its own inline comments already document two of this plan's load-bearing
  findings (the `.heading`-is-a-row fact in §3, and the `scroll-initial-target`
  gotcha in §7.3) — read them, don't re-derive them.
- `/tmp/sb-appbar-mockups/v5b.png` — default rest state (snapped to app bar).
- `/tmp/sb-appbar-mockups/v5b-revealed.png` — pulled-up state (front matter visible).

---

## §0 Requirements, decomposed

| # | Requirement (from Jack's brief) | Resolution | Leaves |
|---|---|---|---|
| R1 | Non-sticky `size="large"` app bar, scrolls with the page | §2 architecture decision; drop `position:sticky`/`for` | L8, L9 |
| R2 | Leading slot = breadcrumb, first item = icon-only asterisk | `<m3e-breadcrumb slot="leading">` replaces standalone icon-button + old breadcrumb row | L8 |
| R3 | Headline = page name, subtitle = "Edited Xh ago · N min read" | Reuse `PageNameEditor`; new `relativeTime` + `reading_time` modules | L1, L2, L8 |
| R4 | Front matter rendered inline, Notion-ish property list, above the app bar | New CM hide-mechanism + new Preact component, both new | L3, L4 |
| R5 | Scroll order: [front matter] → [app bar] → [body], default rest on app bar, pull reveals front matter | New `#sb-page-scroll` wrapper + CM auto-height + scroll-snap CSS + JS init | L5, L6, L9, L11 |
| R6 | Preserve every current trailing control | No functional change to trailing children, only slot/row context | L8 (verify only) |
| R7 | Remove dead breadcrumb-collapse machinery | Delete `.sb-breadcrumb-row-shell`/`-clip`, `#sb-top[data-scrolled]`, `headerScrolled` plumbing | L8, L9, L10 |
| R8 | Don't break existing scroll-position features | Repoint `navigator.ts`/`content_manager.ts`/`client.ts` off `editorView.scrollDOM` | L7 |
| R9 | Keep e2e green / update what the redesign obsoletes | Delete 2 tests, rewrite 1 selector, add 1 new spec | L12 |

## §1 Investigation — what's actually there (verified reads, `m3e-fork` @ `34243d86`)

### 1.1 The DOM/scroll structure today

`#sb-root` (`client/styles/main.scss:157`) is a flex column with three
top-level children, built in `client/editor_ui.tsx`'s `MainUI` render
(~line 886 onward):

1. `<TopBar>` → renders `<div id="sb-top">` (`client/components/top_bar.tsx:254`).
2. `<m3e-drawer-container id="sb-main">` (`editor_ui.tsx:968`), whose **default
   slot**'s only child today is `<div id="sb-editor" />` (`editor_ui.tsx:988`).
   `start`/`end` slots hold the lhs/rhs `Panel`s.
3. `<FloatingToolbar>` (`position:fixed`, immaterial to scroll).

`#sb-top` and `#sb-main` are **siblings** — `#sb-top` is fixed chrome, never
part of any scrolling box (`html, body { overflow: hidden }`,
`client/styles/main.scss:138`). `#sb-main` is `flex-grow:1; height:0`
(`main.scss:188`).

Inside `#sb-editor`, CodeMirror's `EditorView` is constructed
(`client/client.ts:272`) and its own public `scrollDOM` handle is stamped
with a stable id right after construction:

```ts
// client/client.ts:281
this.editorView.scrollDOM.id = EDITOR_SCROLL_CONTAINER_ID; // "sb-editor-scroller"
```

`EDITOR_SCROLL_CONTAINER_ID` is exported from `client/editor_ui.tsx:81` and
today has exactly two consumers: the id-stamp above, and
`scrollContainerId={EDITOR_SCROLL_CONTAINER_ID}` passed to `<TopBar>`
(`editor_ui.tsx:950`), which forwards it as `m3e-app-bar`'s `for` attribute
(drives elevation-on-scroll — `AppBarElement.d.ts`'s own documented pattern).

**CodeMirror's `.cm-scroller` (`editorView.scrollDOM`) is the ONLY element
that actually scrolls today.** `.cm-editor { height: 100% }` /
default CM base-theme `.cm-scroller { overflow: auto }`
(`client/styles/editor.scss:5-9`, `:806-814`) — confirmed no override.

One more wrinkle discovered mid-investigation, decisive for §2: `#sb-editor`
sits inside `m3e-drawer-container`'s **shadow-DOM** `.content` region, which
is *itself* `height:100%; overflow:auto` (`node_modules/@m3e/web/dist/drawer-container.js`,
`.content` rule) — but exports **zero `part=` attributes** (grepped the whole
compiled file, confirmed empty). That region can never be given
`scroll-snap-type` from light-DOM CSS. It cannot be "the" scroll+snap owner
no matter how the light-DOM content inside it is arranged. This rules out a
design that just relies on `.content`'s existing overflow box.

### 1.2 How front matter is hidden today

Not CSS — CodeMirror's own code-folding. The parser emits a real `FrontMatter`
syntax node (`client/markdown_parser/parser.ts:335-390`) over the literal
`---\n...\n---` YAML block. `client/codemirror/frontmatter_folding.ts`:

- `findFrontmatterBlock(state)` — locates that node via the syntax tree.
- `frontmatterFoldingExtension(client)` — a `ViewPlugin` that, on load, calls
  `shouldAutoFoldFrontmatter` (config `"never" | "long" | "always"`, default
  `"long"` folding blocks >5 lines) and dispatches CM's `foldEffect` over the
  node's range if it should fold.
- `frontmatterFoldPlaceholderDOM` — builds the **inline replacement DOM** CM
  paints in place of the folded range: tag pills (`m3e-assist-chip`, parsed
  from the YAML's `tags` key via `frontmatterFoldTags`, which already
  `YAML.load`s the frontmatter text with `js-yaml`) + a
  `"N frontmatter lines hidden"` status span. Clicking it dispatches
  `unfoldEffect` and places the cursor at `editPos` (`findFrontmatterBlock`'s
  block start's next line).
- Wired into `client/codemirror/editor_state.ts:166-171` via CM's
  `codeFolding({ preparePlaceholder, placeholderDOM })` extension.

This placeholder is **still inline CM content** — it lives inside
`.cm-content`'s document flow (correctly at the top, since frontmatter is the
first block), not a separate DOM region outside the editor. "Render inline as
a property list above the app bar" requires it to leave CM's flow entirely.

### 1.3 Where last-modified and reading-time data come from

- **Last modified**: `client.currentPageMeta(): PageMeta | undefined`
  (`client/client.ts:494`) → `PageMeta.lastModified: string`, an ISO-8601
  string (`plug-api/types/index.ts:22`; fixtures confirm the format, e.g.
  `plugs/index/indexer.test.ts:11`: `"2026-07-01T10:00:00Z"`).
- A ready-made formatter **already exists and is already exported** —
  `client/components/nav_views/changelog_tab.tsx:17-44`:

  ```ts
  export function relativeTime(iso: string, now: number = Date.now()): string
  ```

  (`Intl.RelativeTimeFormat`-based, used today for the nav sheet's Changelog
  tab against `page.lastModified`.) It lives in a nav-view leaf file, which is
  the wrong module boundary for a second consumer in `top_bar.tsx` — extract
  it (L1).
- **Reading time**: no client-side utility exists yet, but the exact formula
  the space already uses is in `plugs/editor/stats.ts:1-11` (a plug command,
  sandboxed, not directly callable from Preact render):

  ```ts
  function countWords(str: string): number {
    const matches = str.match(/[\w\d'-]+/gi);
    return matches ? matches.length : 0;
  }
  function readingTime(wordCount: number): number {
    return Math.ceil(wordCount / 225); // 225 wpm, average adult reading speed
  }
  ```

  Port this pair (unchanged formula — it's the space's own established
  convention, don't invent a different constant) into a small client-side
  module (L2), fed by `client.editorView.state.doc.toString()` **minus** the
  frontmatter range (use `findFrontmatterBlock` + `state.sliceDoc(block.to)`
  — reading time should reflect body prose, not YAML key/value noise).

### 1.4 Where the frontmatter *data* for the property list comes from

Two candidate sources, and this matters for whether the list can ever be
"editable":

- `client.currentPageMeta()` — `plugs/index/page.ts:33-37` proves every
  arbitrary frontmatter key gets merged onto the server-indexed `PageMeta`
  object (`{...pageMeta, ...frontmatter, ...pageMeta}`). Simple to read, but
  it's the **space index's copy** — populated by the plug system after a
  save + reindex round-trip, not live per-keystroke.
- Live CM state — `findFrontmatterBlock` + `js-yaml`'s `YAML.load` (exactly
  the pattern `frontmatterFoldTags` already uses at
  `client/codemirror/frontmatter_folding.ts:196-209`) against
  `state.sliceDoc(block.from, block.to)`. Reflects the document as typed,
  with zero index lag.

**Recommendation: parse live CM state, not `currentPageMeta()`.** The
property list needs to feel like it's looking at the document, not a stale
mirror of it — and decision #1 (§5) makes this non-negotiable, not just
nice-to-have: inline editing writes back into the CM document directly
(L4), so the list must already be keyed off live CM positions, not a
server-indexed copy that lags a save+reindex round-trip behind whatever the
user just typed.

### 1.5 `m3e-app-bar`'s compiled `size="large"` template — where trailing actions land

Grepped `node_modules/@m3e/web/dist/app-bar.js`'s two render templates
(small/medium share one, large has its own):

```
size="large" template:
  .base
    .heading            <-- ROW: leading-icon slot + spacer + trailing-icon slot
      .leading-icon  <slot name="leading">
      .spacer
      .trailing-icon <slot name="trailing">
    .spacer
    .label              <-- SEPARATE row, below .heading
      .title    <slot name="title">
      .subtitle <slot name="subtitle">
```

**Answer to the open question in the brief:** trailing actions align to the
**leading/breadcrumb row** (`.heading`), not the headline row. This is
Material 3's actual large-app-bar layout (icon row on top, big headline
below) and it's exactly what we want — the breadcrumb and the sync/lock/
offline/kebab cluster share the top row; the page name + edit-info subtitle
get their own row underneath, full width. No custom CSS needed to achieve
this placement; it's what `size="large"` already does. `.heading` itself
exports no `part=` either (same drawer-container-style gap) — don't attempt
to restyle its internals, style only the slotted children.

## §2 Architecture decision — the crux

**Rejected: app bar (and front matter) as CodeMirror block widgets.**
`client/codemirror/lua_widget.ts` proves the codebase already has the
machinery for this (`WidgetType`, `toDOM`/`updateDOM`, block widgets
stacked at arbitrary doc positions) — it's not hypothetical. But the app bar
carries a dozen-plus pieces of *live Preact state*: unsaved-changes/loading
class, sync-progress percentage + type, online/offline chip + one-shot
snackbar effect (`isMounted` guard), read-only toggle, an async-populated
kebab menu (push-toggle, CONFIG actions), and an inline-editable page-name
`<Input>`. All of that is already idiomatic Preact in `top_bar.tsx` /
`editor_ui.tsx` today. Re-hosting it inside a CM `WidgetType` means
hand-rolling imperative DOM diffing for all of it — CM widgets get `eq` +
`toDOM` + `updateDOM`, no framework reactivity — duplicating state plumbing
that already works, and putting every future app-bar change behind CM's
widget-update contract instead of ordinary JSX. Rejected: real cost, no
offsetting benefit — the DOM-restructure alternative below achieves the same
visual scroll flow without moving any state.

**Recommended: keep the app bar as light-DOM Preact; make CodeMirror share
one outer scroll container instead of owning its own.**

CodeMirror 6 has a documented "auto-height, page scrolls" configuration:
size `.cm-editor` by content (no fixed height) and set `.cm-scroller {
overflow: visible }`. CM6's internal viewport tracking
(`scrollableParents()`, present in the installed
`node_modules/@codemirror/view/dist/index.js:624`, used at `:4690` and
`:6291` to find the nearest real scrolling ancestor for both measurement and
scroll-into-view) then walks *past* the now-non-scrolling `.cm-scroller` and
tracks whatever real scrolling ancestor it finds next — which becomes our
new wrapper. This is CM's own supported mechanism, not a hack against it.

Because `m3e-drawer-container`'s `.content` region (§1.1) can't be styled
for scroll-snap, the new wrapper has to be an **explicit light-DOM div**,
not that shadow region. Concretely (L5): introduce

```tsx
<div id="sb-page-scroll">
  <FrontMatterPanel client={client} />   {/* new, L4 */}
  <TopBar ... />                          {/* moved here from being #sb-main's sibling */}
  <div id="sb-editor" />
</div>
```

as the **sole child of `m3e-drawer-container`'s default slot** (replacing
today's lone `<div id="sb-editor" />`). `#sb-page-scroll` gets
`height:100%; overflow-y:auto; scroll-snap-type:y proximity` (L9) — since
it's plain light DOM, it's fully stylable, and it exactly fills
`.content`'s box at first paint (no double-scrollbar: `.content` only shows
its own scrollbar if *its* child overflows it, and `#sb-page-scroll` sized
to `height:100%` never does — `#sb-page-scroll` does 100% of the real
scrolling internally).

This is the one piece of real risk in the plan, named up front: **every
existing consumer of `editorView.scrollDOM.scrollTop` will start reading a
permanent 0** once `.cm-scroller` stops owning scroll, and must be repointed
at `#sb-page-scroll` instead (L7) — this is not optional cleanup, it is
required for the app to keep working (per-page scroll memory, scroll
restore after navigation, scroll preservation across widget-driven
`rebuildEditorState()` calls all currently read that value).

## §3 Front matter mechanics — what "undo the hide, render inline" means

Two coordinated changes:

1. **Fully hide the raw YAML in CM**, not fold-with-a-visible-placeholder.
   Reuse the *fold* machinery (`frontmatterFoldingExtension`,
   `codeFolding({...})` in `editor_state.ts`) exactly as-is for the
   "collapse the range" mechanic — CM's fold effect already does the right
   thing positionally — but change `frontmatterFoldPlaceholderDOM`'s
   `"frontmatter"` branch (`client/codemirror/frontmatter_folding.ts:242-292`)
   to return an **empty, zero-content `<span>`** instead of building the tag
   chips + status text. The click-to-unfold behavior (`unfoldEffect`, cursor
   to `editPos`) stays — that's the fallback affordance block-style values
   use (§4/L4.3) once inline editing can't handle them directly, just with
   nothing painted inline by default. Also change `shouldAutoFoldFrontmatter`
   (`frontmatter_folding.ts:138-155`) so frontmatter auto-folds
   **unconditionally** while the selection is outside it, regardless of the
   `"never"/"long"/"always"` space config — the property list is now the
   *only* rendering of frontmatter a reader sees; a space owner who set
   `"never"` was opting out of the old chip-placeholder, which no longer
   exists to opt out of. (Flag this behavior change explicitly in the leaf's
   commit message — it's a real, if small, semantic shift for existing
   spaces.)

2. **Render the property list as new, separate Preact DOM** (`client/
   components/front_matter_panel.tsx`, L4) inside `#sb-page-scroll`, above
   `<TopBar>`. Data source: live CM parse (§1.4). Row shape per the mockup:
   icon + key + value, e.g.:

   ```tsx
   function FrontMatterRow({ icon, label, value, onActivate }: {
     icon: string; label: string; value: string; onActivate: () => void;
   }) {
     return (
       <div className="sb-fm-row" onClick={onActivate}>
         <m3e-icon className="sb-fm-icon" name={icon}></m3e-icon>
         <span className="sb-fm-key">{label}</span>
         <span className="sb-fm-value">{value}</span>
       </div>
     );
   }
   ```

   `onActivate` unfolds the frontmatter range and moves the cursor to that
   key's line (reuse `findFrontmatterBlock` + a line-scan for `^key:` inside
   the block — new, small pure function, `client/codemirror/
   frontmatter_folding.ts` is the right home since it already owns
   block-range logic). Icon-per-key mapping: a small fixed lookup (`tags` →
   `sell`, `date`/`created` → `calendar_today`, `author` → `person`, default
   → `label`) — same spirit as the mockup, not meant to be exhaustive; unknown
   keys fall back to the default icon. Render nothing (no panel at all) when
   `findFrontmatterBlock` returns `undefined` (no frontmatter on the page) —
   don't render an empty card.

## §4 Task breakdown

### L1: Extract `relativeTime` to a shared module

**Files:**
- Create: `client/lib/relative_time.ts`
- Modify: `client/components/nav_views/changelog_tab.tsx` (remove the
  function body, `import { relativeTime } from "../../lib/relative_time.ts";`)
- Test: `client/lib/relative_time.test.ts` (move the existing test coverage,
  if `changelog_tab.test.ts` has any assertions against `relativeTime`
  directly — grep first; if only exercised indirectly via `ChangelogTab`
  render, add direct unit coverage here since it's now a standalone module)

- [ ] Move the function verbatim (`client/components/nav_views/changelog_tab.tsx:17-44`)
      into `client/lib/relative_time.ts`, exported the same way.
- [ ] Update `changelog_tab.tsx`'s import and remove the inline definition +
      its doc comment (keep the comment's substance — port it to the new
      file's own header).
- [ ] Run `npm run check` (tsc) — must pass with zero new errors.
- [ ] Commit: `refactor(client): extract relativeTime into client/lib for reuse by the app-bar subtitle`

### L2: New `client/lib/reading_time.ts`

**Files:**
- Create: `client/lib/reading_time.ts`
- Test: `client/lib/reading_time.test.ts`

```ts
// Ported from plugs/editor/stats.ts's statsCommand formula — same constant
// (225 wpm), so the app-bar subtitle and the "Editor: Stats" command never
// silently disagree about what "N min read" means for the same page.
export function countWords(text: string): number {
  const matches = text.match(/[\w\d'-]+/gi);
  return matches ? matches.length : 0;
}

export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 225));
}
```

(Note the `Math.max(1, ...)` — `stats.ts`'s original can report "0 minutes
read" for a near-empty page; for a subtitle string like "3 min read" a floor
of 1 reads better than "0 min read". This is a deliberate, small deviation
from the plug's formula — call it out in the commit message.)

- [ ] Write `reading_time.test.ts`: empty string → `countWords` 0,
      `readingTimeMinutes(0)` → 1; a 450-word fixture string → `countWords`
      450, `readingTimeMinutes(450)` → 2.
- [ ] Run `npm run check`.
- [ ] Commit: `feat(client): add reading_time module (ported from plugs/editor/stats.ts formula)`

### L3: Hide frontmatter fully instead of fold-with-placeholder

**Decision #2 (§5) locks in the always-fold behavior below** — this is no
longer conditional on Jack confirming it; it's specified as the only
behavior to build.

**Files:**
- Modify: `client/codemirror/frontmatter_folding.ts`
  - `frontmatterFoldPlaceholderDOM` (lines 230-297): in the `"frontmatter"`
    branch, delete the tag-chip-building loop and the `status` span; return
    a bare `<span className="cm-foldPlaceholder cm-frontmatterFoldPlaceholder">`
    with no text content and no children, keeping the `onclick`/
    `pointerdown` unfold wiring exactly as-is.
  - `shouldAutoFoldFrontmatter` (lines 138-155): remove the `config`
    parameter's effect on the outcome — always return `true` when
    `!args.selectionInside` (frontmatter always folds on load / whenever the
    cursor leaves it). Keep the `FrontmatterFoldingConfig` type and
    `normalizeFrontmatterFoldingConfig` (still consumed elsewhere? grep
    first — if `clientFrontmatterFoldingConfig`'s only caller becomes dead,
    delete it too rather than leaving an unused config path).
  - Add the small "line for key" helper described in §3, e.g.
    `export function frontmatterKeyLinePos(state, block, key): number | undefined`.
- Test: `client/codemirror/frontmatter_folding.test.ts` — update existing
  assertions on `shouldAutoFoldFrontmatter`'s `"never"/"long"` behavior (they
  will now fail — that's expected, rewrite them to assert always-true);
  update `frontmatterFoldPlaceholderDOM` assertions that check for tag-chip
  DOM (delete those, or repoint at a "renders empty" assertion); add a test
  for the new `frontmatterKeyLinePos` helper.

- [ ] Make the edits above.
- [ ] Run the file's own unit tests: `npx tsx --test client/codemirror/frontmatter_folding.test.ts`
      (or whatever this repo's actual unit-test runner invocation is — check
      `package.json`'s `"test"` script if this differs) — must pass.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor(codemirror): fully hide frontmatter instead of a chip placeholder — property list (L4) is now its only rendering`

### L4: `FrontMatterPanel` component — parse, render, AND inline edit/writeback

**This is the largest single leaf in the plan, and Jack's widened scope
(decision #1, §5) makes it larger still — decision #1 now covers
block-style YAML (multi-line sequences, mappings, and `|`/`>` block
scalars) as genuinely editable, not just scalar/flow values with a
jump-to-raw-YAML fallback.** Budget it as 5 sub-steps (L4.1-L4.5), each
independently committable; **L4.3 (block-value editing) is now the single
biggest sub-step in the whole plan** — do not compress it, and do not treat
any of L4.1-L4.5 as one atomic step.

**Files:**
- Create: `client/components/front_matter_panel.tsx`
- Create: `client/lib/frontmatter_yaml.ts` (the pure parse/locate/serialize
  logic, kept out of the component so it's unit-testable without DOM/Preact
  — matches this repo's `client/lib/` convention of small, focused, directly
  testable modules)
- Modify: `client/codemirror/frontmatter_folding.ts` (add
  `frontmatterKeyLinePos`, per L3 — this leaf is the helper's real consumer)
- Test: `client/lib/frontmatter_yaml.test.ts` (pure-function unit tests, the
  bulk of this leaf's test coverage), `client/components/front_matter_panel.test.ts`
  (preact-render-to-string, matching `top_bar.test.ts`'s existing pattern)

#### L4.1 — Locate each key's value span (`client/lib/frontmatter_yaml.ts`)

`js-yaml`'s `YAML.load()` gives values but not source positions. Rather than
adopting a full YAML-position-tracking library (a real dependency addition,
out of proportion to this feature), locate spans the same "ad-hoc but
honest" way `content_manager.ts:606`'s existing `frontMatterRegex` and L3's
`frontmatterKeyLinePos` already do: a **line-based scan** of the block's raw
text, not a structural YAML-position API.

```ts
import type { EditorState } from "@codemirror/state";
import YAML from "js-yaml";
import type { FrontmatterBlock } from "../codemirror/frontmatter_folding.ts";

export type FrontMatterFieldShape =
  | "scalar" // `status: draft`
  | "flow" // single-line `tags: [journal, retro]` / `owner: {name: Jack}`
  | "blockSequence" // `tags:\n  - journal\n  - retro`
  | "blockMapping" // `owner:\n  name: Jack\n  email: j@x.com`
  | "blockScalarLiteral" // `body: |\n  line one\n  line two`
  | "blockScalarFolded"; // `body: >\n  line one\n  line two`

export type FrontMatterFieldSpan = {
  key: string;
  shape: FrontMatterFieldShape;
  /**
   * Absolute CM doc offset where the value text starts. For `scalar`/`flow`
   * this is right after `key: ` on the key's own line, same as before. For
   * every block shape this is ALSO right after `key:` on the key's own line
   * (including any inline block-scalar indicator, ` |`/` >`/` |-`/etc.) —
   * the full multi-line value, indicator included, is one contiguous
   * replaceable span; there is no separate "header span" vs "body span".
   */
  valueFrom: number;
  /**
   * Absolute CM doc offset where the value text ends. For `scalar`/`flow`,
   * end of the key's own line (unchanged). For a block shape, extended by
   * `blockValueEndLine` (below) through the END of the LAST line that is
   * still part of this value — i.e. the last line before either a new
   * top-level key (indentation returns to 0) or the block's closing `---`.
   */
  valueTo: number;
  /** Absolute CM doc offset of the key's line start (for delete-property). */
  lineFrom: number;
  /**
   * Absolute CM doc offset of the END of this field's full span, including
   * its trailing newline — for `scalar`/`flow` this is the key's own line
   * + 1; for a block shape this is `valueTo` + 1 (or `state.doc.length` if
   * the block is the very last thing before EOF). Used by delete-property.
   */
  lineTo: number;
  /** Convenience flag — `true` for any of the four block shapes above.
   * Kept alongside `shape` (rather than only `shape`) since most call
   * sites only need "is this multi-line," not which kind. */
  isBlockValue: boolean;
};

const KEY_LINE = /^([\w.$-]+):[ \t]?(.*)$/;
const BLOCK_SCALAR_INDICATOR = /^[|>][+-]?\d*$/;

function lineIndent(text: string): number {
  return text.match(/^[ \t]*/)![0].length;
}

/**
 * Scans forward from a key's line to find where its block-style value ends
 * — the "ad-hoc but honest" dedent rule this codebase already uses
 * elsewhere (frontMatterRegex, findFrontmatterBlock): a line belongs to the
 * current key's block value if it's blank, OR indented deeper than column 0
 * (top-level frontmatter keys are always at column 0, so ANY indentation
 * marks a continuation line — this deliberately does not attempt to handle
 * a frontmatter file that itself uses a >0 base indent, which no code in
 * this repo produces). A blank line only counts as PART of the block if a
 * later indented line follows it (a blank line immediately before the
 * closing `---` or the next top-level key is trailing whitespace, not
 * content) — implemented as a lookahead rather than a running flag so
 * trailing blank lines are correctly excluded from `valueTo`.
 */
function blockValueEndLine(
  state: EditorState,
  keyLineNumber: number,
  blockEndLineNumber: number, // the line number of the closing `---`
): number {
  let lastContentLine = keyLineNumber;
  for (let n = keyLineNumber + 1; n < blockEndLineNumber; n++) {
    const line = state.doc.line(n);
    if (line.text.trim().length === 0) continue; // tentative — only counts if followed by more indented content
    if (lineIndent(line.text) === 0) break; // next top-level key
    lastContentLine = n;
  }
  return lastContentLine;
}

function classifyShape(inlineValue: string, firstContinuationText: string | undefined): FrontMatterFieldShape {
  const trimmed = inlineValue.trim();
  if (BLOCK_SCALAR_INDICATOR.test(trimmed)) {
    return trimmed[0] === "|" ? "blockScalarLiteral" : "blockScalarFolded";
  }
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return "flow";
  if (trimmed.length > 0) return "scalar";
  // Empty inline value: a block sequence/mapping follows on subsequent
  // indented lines — peek at the first continuation line's own shape.
  const firstTrimmed = firstContinuationText?.trim() ?? "";
  return firstTrimmed.startsWith("- ") || firstTrimmed === "-"
    ? "blockSequence"
    : "blockMapping"; // default when there's no continuation at all either
    // (an empty/null value) — treated as an empty block mapping, which
    // FrontMatterPanel (L4.5) renders as an empty editable group rather
    // than erroring.
}

export function locateFrontMatterFields(
  state: EditorState,
  block: FrontmatterBlock,
): FrontMatterFieldSpan[] {
  const fields: FrontMatterFieldSpan[] = [];
  const startLine = state.doc.lineAt(block.from).number;
  const endLine = state.doc.lineAt(Math.max(block.from, block.to - 1)).number;
  // Skip the opening `---` (startLine) and closing `---` (endLine).
  for (let n = startLine + 1; n < endLine; n++) {
    const line = state.doc.line(n);
    if (lineIndent(line.text) > 0) continue; // continuation line of a prior block value, already consumed below
    const match = KEY_LINE.exec(line.text);
    if (!match) continue;
    const [, key, inlineValue] = match;
    const firstContinuation = n + 1 < endLine ? state.doc.line(n + 1).text : undefined;
    const shape = classifyShape(inlineValue, firstContinuation);
    const isBlockValue = shape !== "scalar" && shape !== "flow";
    const endLineForField = isBlockValue ? blockValueEndLine(state, n, endLine) : n;
    const fieldEndLine = state.doc.line(endLineForField);
    fields.push({
      key,
      shape,
      valueFrom: line.from + key.length + 1 + (line.text[key.length + 1] === " " ? 1 : 0),
      valueTo: fieldEndLine.to,
      lineFrom: line.from,
      lineTo: Math.min(fieldEndLine.to + 1, state.doc.length),
      isBlockValue,
    });
    if (isBlockValue) n = endLineForField; // skip past the continuation lines already claimed
  }
  return fields;
}

/** Dumps a value for splicing back in as `key:<this>`, using js-yaml's own
 * dumper rather than hand-rolled quoting/indentation rules — the documented
 * trick is to dump a one-key object and strip the synthetic key back off,
 * so js-yaml's real escaping/indentation logic runs unmodified. Shape-aware
 * (full mechanism + rationale in §4/L4.3):
 *  - `scalar`/`flow` → single line, `flowLevel: 1` (unchanged from before).
 *  - `blockSequence`/`blockMapping` → block style (omit `flowLevel`, or set
 *    it above the value's own depth so js-yaml never collapses to flow),
 *    2-space indent — js-yaml's default block indent already matches this
 *    repo's own frontmatter convention (verified against every example
 *    fixture cited in this plan, e.g. `plugs/index/indexer.test.ts`'s ISO
 *    strings sit at 2-space indent under their block parents elsewhere in
 *    this codebase's own YAML usage).
 *  - `blockScalarLiteral`/`blockScalarFolded` → forces js-yaml's `styles`
 *    option (`{ styles: { "!!str": preferredStyle === "blockScalarFolded"
 *    ? "folded" : "literal" } }`) so editing an existing `|` value can't
 *    silently flip it to `>` (or vice versa) — see L4.3's round-trip-
 *    fidelity note for what this does and doesn't guarantee. */
export function serializeYamlValue(
  value: unknown,
  shape: FrontMatterFieldShape,
): string {
  const isBlock = shape !== "scalar" && shape !== "flow";
  const dumped = YAML.dump({ __v: value }, {
    flowLevel: isBlock ? -1 : 1,
    styles: shape === "blockScalarFolded" || shape === "blockScalarLiteral"
      ? { "!!str": shape === "blockScalarFolded" ? "folded" : "literal" }
      : undefined,
  });
  const withoutKey = dumped.replace(/^__v:\s?\n?/, "");
  // Re-indent by the synthetic `__v:` key's own 0-column base — js-yaml
  // dumps block content at whatever indent the wrapping key sits at, which
  // here is already column 0, matching every top-level frontmatter key.
  return isBlock ? "\n" + withoutKey.trimEnd() : withoutKey.trimEnd();
}

/** Re-parses a candidate full frontmatter block text and returns the parsed
 * object, or `undefined` if it's invalid YAML — the writeback validation
 * gate (§4/L4.2) always calls this on the SPLICED result before dispatching
 * a CM transaction, never trusts the edit blind. */
export function tryParseFrontMatter(rawBlockText: string): Record<string, unknown> | undefined {
  const yamlText = rawBlockText
    .replace(/^---[ \t]*(?:\r?\n|$)/, "")
    .replace(/(?:\r?\n)?---[ \t]*$/, "");
  try {
    const parsed = YAML.load(yamlText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
```

- [ ] Write `frontmatter_yaml.test.ts` first (TDD): fixtures covering a
      plain-scalar line (`status: draft`, `shape: "scalar"`), a flow-array
      line (`tags: [journal, retro]`, `shape: "flow"`), a **block sequence**
      (`tags:\n  - journal\n  - retro`, `shape: "blockSequence"`,
      `valueTo` extending through the `- retro` line, not stopping at the
      `tags:` line), a **block mapping** (`owner:\n  name: Jack\n  email: j@x.com`,
      `shape: "blockMapping"`), a **literal block scalar**
      (`notes: |\n  line one\n  line two`, `shape: "blockScalarLiteral"`),
      a **folded block scalar** (`notes: >\n  line one\n  line two`,
      `shape: "blockScalarFolded"`), a block value immediately followed by
      ANOTHER top-level key (assert `valueTo`/`lineTo` stop exactly at the
      dedent, not swallowing the next key), a block value that is the LAST
      key before the closing `---` (assert `blockValueEndLine`'s loop bound
      and the trailing-blank-line lookahead both behave at the boundary), a
      quoted string value (`title: "Has: a colon"` — the regex's `.*`
      capture must not choke on the embedded colon), and
      `serializeYamlValue` round-tripping: a string with special
      characters, a number, a boolean, a small array (`shape: "flow"` vs
      `shape: "blockSequence"` — assert each produces the requested style,
      not whichever js-yaml would pick by default), and a multi-line string
      through both `blockScalarLiteral` and `blockScalarFolded` (assert the
      requested indicator survives, not just that SOME multi-line
      representation comes out).
- [ ] Implement `locateFrontMatterFields`/`serializeYamlValue`/`tryParseFrontMatter`
      against those fixtures until green. Treat any fixture where actual
      js-yaml output doesn't match this doc's pseudocode's assumed
      indentation/style as the pseudocode being wrong, not the test —
      this leaf's own code snippets were written without running them
      against the real `js-yaml` version pinned in this repo's
      `package.json`, and should be verified against it before being
      trusted, same caveat as any other illustrative snippet in this plan.
- [ ] Run `npm run check`.
- [ ] Commit: `feat(client): add frontmatter_yaml — line-based field location (scalar + block shapes) + shape-aware YAML (de)serialization`

#### L4.2 — Writeback: edit a value, validate, dispatch a CM transaction

Editing a row commits through **one function, used identically for every
shape** — scalar, flow, and (per decision #1's widened scope) all four
block shapes alike. This is the payoff of L4.1 giving every shape the same
`{valueFrom, valueTo}` contract: `commitFieldEdit` below never needs to know
whether it's replacing one line or twelve. L4.3 supplies the per-shape
*editor UI* and the value each control hands back; this function is the
single writeback path all of them funnel through.

```ts
// In front_matter_panel.tsx, or frontmatter_yaml.ts if kept pure — this one
// needs `client.editorView.dispatch`, so it lives in the component file.
function commitFieldEdit(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
  newRawValue: unknown,
): boolean {
  const state = client.editorView.state;
  const newValueText = serializeYamlValue(newRawValue, field.shape);
  // Validate BEFORE dispatching: splice the candidate text into the block
  // and re-parse the WHOLE block, not just the one line — catches cases
  // where the new value's own YAML is fine in isolation but breaks the
  // surrounding document (e.g. an unescaped `:` shifting flow-mapping
  // parsing). This mirrors PageNameEditor's own commit-with-catch pattern
  // (top_bar.tsx:127-141) rather than trusting the edit optimistically.
  const candidateBlockText =
    state.sliceDoc(block.from, field.valueFrom - block.from + block.from) === undefined
      ? ""
      : state.sliceDoc(block.from, field.valueFrom) +
        newValueText +
        state.sliceDoc(field.valueTo, block.to);
  if (tryParseFrontMatter(candidateBlockText) === undefined) {
    client.ui.flashNotification(
      `Couldn't save "${field.key}" — invalid YAML`,
      "error",
    );
    return false; // caller reverts the row's displayed value
  }
  client.editorView.dispatch({
    changes: { from: field.valueFrom, to: field.valueTo, insert: newValueText },
    annotations: [isolateHistory.of("full")],
  });
  return true;
}
```

(`isolateHistory` — same undo-grouping annotation `setEditorText`/
`applyExternalPatches` already use in `content_manager.ts:503-521` — a
front-matter field edit should undo as one step, not merge into whatever
edit history the body happens to be in.)

- [ ] In `FrontMatterPanel`, make `.sb-fm-value` a click-to-activate field:
      on click, swap the `<span>` for an `<input>` (or `contenteditable`
      span — prefer a real `<input>` for IME/selection correctness, same
      reasoning `PageNameEditor` already uses `Input` rather than
      `contenteditable`) pre-filled with the row's current display value.
      On blur/Enter, call `commitFieldEdit`; on success, let the doc-change
      listener (L4.4) re-render the row from the new parsed state; on
      failure, revert the input's value to the last-known-good row value
      (do NOT leave the invalid text sitting in the input) and keep the
      flashed error visible (it's already a global toast, nothing more to
      do here).
- [ ] Escape/blur-without-change cancels without dispatching anything.
- [ ] Write `front_matter_panel.test.ts` cases: committing a valid new
      **scalar** value dispatches a transaction whose resulting doc text
      contains the new value at the right span (assert via
      `state.sliceDoc`, not string matching the whole doc); committing an
      invalid value (e.g. an unterminated quote) does NOT change the doc
      and calls `flashNotification`; committing a valid **block-shaped**
      value (a new array for a `blockSequence` field) replaces the field's
      FULL multi-line span and leaves every line outside that span
      byte-for-byte unchanged (assert on the surrounding keys' text
      specifically, not just that parsing the whole doc still succeeds) —
      this second case exercises the same function this leaf already wrote,
      it's really L4.3 wiring a block editor's output through it, but
      belongs in this leaf's own test file since `commitFieldEdit` is
      defined here.
- [ ] Run `npm run check`.
- [ ] Commit: `feat(front-matter-panel): inline value editing with validated CM writeback (shape-agnostic — scalar and block alike)`

#### L4.3 — Full editing for every value shape, including block-style YAML

**Widened per Jack's decision (2026-09-22): block-style values (multi-line
sequences, mappings, and `|`/`>` block scalars) are genuinely editable in
place, not display-only.** This is now the largest single sub-step in the
plan — budget it accordingly, and land it as its own set of commits (one
per shape below), not one big diff.

**The mechanism, in one paragraph:** every shape shares the exact same
locate → edit → serialize (shape-aware) → splice `[valueFrom, valueTo)` →
re-parse-whole-block-to-validate → dispatch pipeline from L4.1/L4.2 — a
block value is not a structurally different kind of edit, just a bigger
span with a fancier input control and a multi-line
`serializeYamlValue(value, shape)` call. The only genuinely new work per
shape is (a) which Preact control renders in the row and what raw
value/array/string it hands `commitFieldEdit`, and (b) the round-trip
fidelity caveats specific to that shape's YAML syntax.

**Per-shape editor control:**

- **Plain scalar** (unchanged from the original draft) — `<input>`,
  `serializeYamlValue` handles quoting.
- **Flow-style array/object on one line** (unchanged) — `<input>`,
  comma-joined display / comma-split-and-rewrapped commit.
- **Block sequence** (`tags:\n  - journal\n  - retro`) — a small **list-row
  editor**, Notion-style: each array item renders as its own removable row
  (a text `<input>` + a trailing delete `m3e-icon-button`) directly beneath
  the property row, plus a final "+ add item" row. Reordering existing
  items is **not supported in this pass** (state that explicitly — a
  reorder-by-drag control is a materially separate feature; note it as a
  natural follow-up, not silently missing). On any item's add/edit/delete,
  reconstruct the full JS array from the currently-rendered item rows (in
  their current DOM order) and call `commitFieldEdit(client, block, field,
  reconstructedArray)` — `serializeYamlValue(reconstructedArray,
  "blockSequence")` (L4.1) produces the multi-line `- item` YAML.
- **Block mapping** (`owner:\n  name: Jack\n  email: j@x.com`) — **a raw
  multi-line `<textarea>`** (use `m3e-textarea-autosize`, already an
  installed `@m3e/web` component — `import "@m3e/web/textarea-autosize"` —
  matching this repo's own "reach for an m3e component before hand-rolling"
  styling-ladder default) containing the nested block's YAML **source
  text as-is** (not decomposed into a recursive property-row UI — that's a
  deliberate scope line: a genuinely recursive Notion-style editor for
  arbitrarily nested mappings is a materially bigger feature than editing
  the leaf values this plan otherwise handles, and nothing in Jack's brief
  or the mockup calls for nested rows). On commit: re-indent every line of
  the textarea's edited text by 2 spaces (the nesting level under a
  top-level key) before calling `serializeYamlValue`-equivalent splicing —
  concretely, skip `serializeYamlValue` for this one shape and instead
  validate the textarea's raw text directly (`YAML.load` it in isolation
  first, as a cheap early rejection of obviously-broken YAML before the
  expensive whole-block splice-and-reparse), then splice
  `"\n" + textareaText.split("\n").map(l => l ? "  " + l : l).join("\n")`
  into `[valueFrom, valueTo)` the same as every other shape.
- **Block scalar, literal (`|`) or folded (`>`)** — a `<textarea>`
  (`m3e-textarea-autosize` again) containing the **decoded** multi-line
  string (real newlines as the user would type them, not the raw `|`-fenced
  YAML source with its own leading-space-per-line encoding). On commit,
  `serializeYamlValue(textareaValue, field.shape)` re-encodes it with
  L4.1's `styles` option forcing the SAME indicator (`literal` vs `folded`)
  the field already had — editing a `|` value can never silently turn it
  into a `>` value or vice versa. A **new** block scalar (created via
  add-property, §4/L4.4) defaults to `blockScalarLiteral` (`|`) — folded's
  automatic whitespace-collapsing/reflow behavior is surprising for a user
  who just typed exact line breaks into a textarea and expects them
  preserved verbatim, so literal is the safer, more predictable default,
  not folded.
- **Escape hatch, all shapes**: keep a small "Edit as YAML" icon-button per
  row (in addition to the structured control above, not instead of it) that
  does the original L3 "unfold the raw frontmatter + jump cursor to this
  key's line" behavior — for the rare case a shape's structured editor
  can't represent something the user needs (a YAML anchor/alias, a comment
  inside a block value, a style this plan's classifier mis-detects). This
  is no longer the PRIMARY path for block values (decision #1 widened past
  that), just a documented fallback so "the structured editor can't do X"
  never means "and there's truly no way to fix X short of leaving the
  panel."

**Round-trip fidelity — what's preserved, what's normalized, and why that
split is the right one to accept:**

- **Preserved, by construction**: every line of the document OUTSIDE the
  edited field's `[valueFrom, valueTo)` span — every other key, comments
  between keys (as long as they're not inside the one field being edited),
  and the body content entirely. The splice-based transaction can't touch
  them; this is the same guarantee L4.2 already gives scalar edits, just
  reconfirmed here because a much bigger span is now in play per edit.
- **Preserved, by explicit design choice**: the `|` vs `>` block-scalar
  indicator on edit (L4.1's `styles` option), item order in a block
  sequence (JS array order is preserved by construction).
- **NOT preserved — accepted, stated normalization**: within the ONE field
  being re-dumped, js-yaml's own canonical formatting choices apply —
  indentation width if the original used something other than 2 spaces,
  quoting style on scalar items inside a re-dumped sequence/mapping
  (js-yaml only quotes when strictly necessary; a value the user originally
  quoted for stylistic reasons may come back unquoted), and exact chomping
  (`|-`/`|+` vs bare `|`) on a re-dumped block scalar, which js-yaml infers
  from the value's own trailing-whitespace content rather than preserving
  the original indicator's chomping mode verbatim. **Decision: accept this
  normalization.** Building a lossless, format-preserving YAML patcher (the
  only way to avoid it) is a fundamentally different, much larger project
  than this plan's editor — the same "not a fully general lossless YAML
  editor" boundary this plan's non-goals section already draws, now stated
  explicitly for block values too rather than left implicit. Every
  normalization above is scoped to the one edited field; nothing else in
  the document is at risk.
- **Edge cases to test explicitly, not just hope work**: an edit that
  empties a block sequence to zero items (does it correctly become `tags:
  []` or `tags:` with nothing after, and does re-adding an item afterward
  work from that state); a block mapping textarea submitted with
  inconsistent internal indentation (must be rejected by the early
  `YAML.load` check, not silently mis-indented); a block scalar edited to
  empty string (verify js-yaml doesn't error or produce something that
  fails the whole-block re-parse).

- [ ] Implement the scalar/flow controls (already covered by L4.2 — just
      re-confirm they still work once `commitFieldEdit`'s signature grew a
      `field.shape` argument).
- [ ] Implement the block-sequence list-row editor.
- [ ] Implement the block-mapping raw-textarea editor, including its
      early-validate-then-reindent-then-splice path.
- [ ] Implement the block-scalar (literal/folded) textarea editor,
      including the "new block scalar defaults to literal" rule.
- [ ] Implement the per-row "Edit as YAML" escape-hatch button (all shapes).
- [ ] Extend `frontmatter_yaml.test.ts`: `serializeYamlValue` round-trips a
      block sequence back to the SAME item order and 2-space indent it
      started with; editing an existing `|` value's content and
      re-serializing keeps `|`, not `>` (and vice versa); a block mapping's
      re-indent-by-2 logic produces text that `YAML.load`s back to the
      same structure it started from.
- [ ] Extend `front_matter_panel.test.ts`: a block-sequence field renders
      the list-row editor and adding/removing an item produces the
      expected multi-line doc text; a block-mapping field renders a
      textarea pre-filled with its raw nested YAML and an edit that breaks
      indentation is rejected with `flashNotification`, doc unchanged; a
      block-scalar field renders a textarea with DECODED newlines (not the
      raw `|`-prefixed source) and a commit re-encodes with the original
      indicator preserved; the "Edit as YAML" button unfolds the raw block
      and places the cursor at the right key regardless of shape.
- [ ] Run `npm run check`.
- [ ] Commit: `feat(front-matter-panel): full inline editing for block-style YAML — sequences, mappings, and literal/folded block scalars`

#### L4.4 — Add / remove a property, and bidirectional sync

**Add property**: a trailing "+ Add property" row. On activation, prompts
for a key name (reuse the existing `Prompt` component pattern already used
elsewhere in `editor_ui.tsx`, e.g. `viewState.showPrompt`), then inserts a
new `key: \n` line immediately before the block's closing `---` fence:

```ts
function insertNewProperty(client: Client, block: FrontmatterBlock, key: string) {
  const closingLineStart = client.editorView.state.doc.lineAt(
    Math.max(block.from, block.to - 4), // "---\n" is 4 chars; land on that line
  ).from;
  client.editorView.dispatch({
    changes: { from: closingLineStart, insert: `${key}: \n` },
    annotations: [isolateHistory.of("full")],
  });
}
```

Validate the key name doesn't collide with an existing one (case-sensitive
match against `tryParseFrontMatter`'s current keys) before dispatching;
reject with `flashNotification` if it does, same pattern as L4.2.

**Remove property**: a trailing "delete" affordance per row (e.g. a
`m3e-icon-button` revealed on row hover — mirror the hover-reveal pattern
already used for `.sb-panel-drawer-close` elsewhere, if this repo has one;
otherwise always-visible is an acceptable fallback, implementer's call).
Dispatches `{ changes: { from: field.lineFrom, to: field.lineTo, insert: "" } }`
for that field's full line span (from L4.1's `lineFrom`/`lineTo`) — no
validation needed, deleting a line can't produce invalid YAML on its own
(unless it was the last key and removing it leaves an empty frontmatter
block; `tryParseFrontMatter` on an empty YAML body returns `undefined` per
its own `!parsed` check, so guard: if removing the last key, treat this as
"remove the whole page's frontmatter" and confirm via the existing
`Confirm` component pattern rather than silently producing a technically-
invalid empty block).

**Bidirectional sync**:
- **List → doc**: L4.2/L4.4's dispatch calls, above.
- **Doc → list**: the panel must re-parse whenever the frontmatter range
  changes for *any* reason — not just the panel's own edits, but a manual
  unfold-and-hand-edit, a sync pulling in a remote change, or an undo. Use a
  CM `ViewPlugin`'s `update(update: ViewUpdate)` hook (the same primitive
  `frontmatterFoldingExtension` itself is built on,
  `client/codemirror/frontmatter_folding.ts:307-356`) registered once
  alongside the other `editor_state.ts` extensions
  (`client/codemirror/editor_state.ts:166-171`'s neighborhood), which calls
  a small callback prop whenever `update.docChanged` is true AND the changed
  range intersects the current `findFrontmatterBlock` range. Thread that
  callback into `FrontMatterPanel` via a prop (`onFrontMatterChanged`) rather
  than a `client.eventHook` guess (this sidesteps L4's original open
  question about `eventHook`'s exact API entirely — a CM `ViewPlugin`
  calling a plain callback is a mechanism this codebase's own
  `frontmatterFoldingExtension` already proves works, no API archaeology
  needed).
- **Echo-loop guard**: the panel's own writeback (L4.2) dispatches a CM
  transaction, which the ViewPlugin above will observe and use to trigger a
  re-parse/re-render — this is fine and *should* happen (it's how the row
  picks up its own committed value from the single source of truth, the
  document, rather than trusting its own optimistic local state). The one
  real risk: if the user is **actively editing** a row when an unrelated
  doc change re-syncs the list (e.g. a background sync pulling a remote
  edit to a *different* key), the re-render must not blow away the
  in-progress edit. Guard: track which key (if any) is currently being
  edited (a `useState<string | null>`) and skip re-rendering *that one
  row* from the re-parsed data while it's active — every other row still
  updates live. **This guard must cover every control from L4.3, not just
  the scalar `<input>`**: a block-sequence field's list-row editor (several
  `<input>`s at once) and a block-mapping/block-scalar field's `<textarea>`
  are all "actively being edited" states the same guard needs to recognize
  — track "currently-editing key" at the row level (one flag per field key,
  regardless of which control type owns that row), not per-input, so the
  guard doesn't need shape-specific logic of its own.
- [ ] Implement add/remove.
- [ ] Implement the `ViewPlugin` + `onFrontMatterChanged` callback wiring.
- [ ] Implement the focused-row echo-guard, verified against EVERY L4.3
      control type, not just the scalar input.
- [ ] Write tests: adding a property inserts the expected line and the panel
      picks it up; removing the last property triggers the confirm-and-clear
      path; a doc-side edit made outside the panel (dispatch a transaction
      directly in the test, bypassing the panel) is reflected in the panel's
      rendered rows; a focused scalar row's input text survives an unrelated
      concurrent doc change; **a block-sequence row mid-item-edit, and a
      block-mapping/block-scalar row mid-textarea-edit, both also survive**
      an unrelated concurrent doc change (three additional cases beyond the
      original single scalar-input case).
- [ ] Run `npm run check`.
- [ ] Commit: `feat(front-matter-panel): add/remove properties, bidirectional doc<->list sync with a shape-agnostic focused-row echo guard`

#### L4.5 — Assemble `FrontMatterPanel`

With L4.1-L4.4's pieces in hand, the component itself is now mostly
composition: hold `rows` state (derived via `locateFrontMatterFields` +
`tryParseFrontMatter`, re-derived on the `onFrontMatterChanged` callback),
render `null` when there's no frontmatter block at all, and wire each row to
the L4.2/L4.3/L4.4 behaviors. No further new logic — if this step is
producing new logic, some of L4.1-L4.4 was under-specified and should be
revisited rather than patched here.

- [ ] Assemble and wire into the render tree (consumed by L5, unchanged
      from the original plan — `<FrontMatterPanel client={client} />`).
- [ ] Full `front_matter_panel.test.ts` pass, covering render + all edit
      paths end to end (not just the unit-level pieces from L4.1-L4.4),
      including one integration fixture with ALL shapes present in a single
      page's frontmatter at once (a plain scalar, a flow array, a block
      sequence, a block mapping, and a literal block scalar) — asserts
      L4.1's span detection doesn't misattribute one field's lines to its
      neighbor when several multi-line shapes sit back to back.
- [ ] Run `npm run check`.
- [ ] Commit: `feat(client): assemble FrontMatterPanel — full inline-editable property list, every YAML shape included`

### L5: Introduce `#sb-page-scroll` and move `<TopBar>` inside the drawer container

**Files:**
- Modify: `client/editor_ui.tsx`
  - Add `export const PAGE_SCROLL_CONTAINER_ID = "sb-page-scroll";` near
    `EDITOR_SCROLL_CONTAINER_ID` (line 81) — do NOT remove
    `EDITOR_SCROLL_CONTAINER_ID`'s *export* yet if anything outside this
    plan's scope still imports it (grep confirmed today it has exactly the
    two consumers listed in §1.1, both removed by L7/L8 — once both land,
    delete the export and the `client.ts:281` stamp entirely as dead code).
  - Move the `<TopBar ... />` JSX block (currently ~lines 886-967, a sibling
    of `<m3e-drawer-container>`) to become the **second child** inside a new
    wrapper, itself the sole child of `<m3e-drawer-container>`'s default
    slot:

    ```tsx
    <m3e-drawer-container id="sb-main" ...>
      {viewState.panels.lhs.mode !== undefined && ( ... /* unchanged */ )}
      <div id={PAGE_SCROLL_CONTAINER_ID}>
        <FrontMatterPanel client={client} />
        <TopBar
          {/* same props as today, MINUS scrollContainerId/headerScrolled — see L8 */}
        />
        <div id="sb-editor" />
      </div>
      {viewState.panels.rhs.mode !== undefined && ( ... /* unchanged */ )}
    </m3e-drawer-container>
    ```
  - Remove the `headerScrolled` state + its scroll-listener effect (lines
    524-531) — dead once L8 drops `data-scrolled`/`for`.
- Test: any existing `editor_ui`-level render test (check for
  `editor_ui.test.ts` or equivalent; if none exists, this is covered instead
  by L12's new e2e spec).

- [ ] Make the JSX move. Double-check `lhs`/`rhs` props on `<TopBar>` — these
      render empty spacer `<div className="panel">` elements
      (`top_bar.tsx:255-262`) that today sit *outside* `.main` as `#sb-top`'s
      flex siblings; moving `<TopBar>` doesn't change what `lhs`/`rhs` render,
      only where the whole `#sb-top` box now sits in the tree — confirm
      visually (L9/L13's manual check) that these spacer divs still make
      sense once `#sb-top` is no longer a `#sb-root`-level flex item. If they
      look like dead vestigial code once you're looking directly at it
      (possible — nothing else in this file set was found wiring real
      content through them), flag it as a finding for Jack rather than
      silently deleting a prop with unclear original intent.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor(client): move TopBar inside the drawer-container's content slot, introduce #sb-page-scroll`

### L6: CodeMirror auto-height ("page scrolls") configuration

**Files:**
- Modify: `client/styles/editor.scss`
  - `#sb-main .cm-editor` (line 5): remove `height: 100%`; let it size to
    content.
  - `.cm-scroller` (line 806, inside the same `#sb-main .cm-editor` block):
    replace the `padding-bottom: 20em` rule's context — keep the padding,
    add `overflow: visible; height: auto;` alongside it. (Padding-bottom
    still makes sense as breathing room at the end of a long page.)
  - `#sb-editor>.cm-editor>.cm-scroller { scrollbar-gutter: stable }`
    (line 812) — this becomes a no-op once `.cm-scroller` no longer
    scrolls; move `scrollbar-gutter: stable` onto `#sb-page-scroll` instead
    (L9) so the layout-shift-avoidance property it existed for is preserved
    on the element that now actually needs it.
- Modify: `client/styles/main.scss`
  - `#sb-editor` (line 211): remove `flex: 2; height: 100%` (no longer a
    flex item of anything, and no longer needs to fill a box — its height is
    now intrinsic to its content, same as the new `#sb-page-scroll` sibling
    elements around it).

- [ ] Make the CSS edits.
- [ ] `npm run build:client`.
- [ ] Manual check against `:3333` (§6): open a long page, confirm the
      editor's content now extends the outer page instead of scrolling in
      its own inner box (you should see ONE scrollbar for the whole
      front-matter+app-bar+body region, not two nested ones). This is the
      single most important manual check in the whole plan — if you see two
      scrollbars, or the editor still clips at a fixed height, something in
      this leaf or L5 is wrong before you go any further.
- [ ] Commit: `refactor(editor): configure CodeMirror for auto-height / page-scrolls mode`

### L7: Repoint every `scrollDOM.scrollTop` consumer at `#sb-page-scroll`

This is the leaf most likely to be silently skipped — do not skip it. Once
L6 lands, `client.editorView.scrollDOM.scrollTop` is permanently `0`
everywhere it's read below, unless this leaf also lands. **Land this before
L11** — L11 edits the same `navigateWithinPage`/`restoreScrollPosition`
functions this leaf touches, and needs the repointed container to already
be in place.

**Files:**
- Modify: `client/navigator.ts`
  - `captureEditorPosition` (line ~153-163): change
    `scrollTop: editorView.scrollDOM.scrollTop` to read from
    `document.getElementById(PAGE_SCROLL_CONTAINER_ID)?.scrollTop ?? 0`.
    Import `PAGE_SCROLL_CONTAINER_ID` from `./editor_ui.tsx`.
- Modify: `client/content_manager.ts`
  - The "no adjusted position, scroll to top" fallback (~line 613):
    `this.client.editorView.scrollDOM.scrollTop = 0` →
    `document.getElementById(PAGE_SCROLL_CONTAINER_ID)!.scrollTop = 0`.
  - `restoreScrollPosition` (~line 622-695): replace every
    `const scrollDOM = this.client.editorView.scrollDOM;` with a lookup of
    `document.getElementById(PAGE_SCROLL_CONTAINER_ID)!` instead. The
    MutationObserver's `observer.observe(scrollDOM, ...)` call must now
    observe the **new element** (its subtree still includes `#sb-editor`'s
    widget-driven height changes, since `#sb-editor` remains a descendant) —
    confirm this by re-reading the observer's `childList`/`subtree`/
    `attributeFilter` config after the swap; it should need no further
    change since `subtree: true` already covers a deeper container.
- Modify: `client/client.ts`
  - Delete the `EDITOR_SCROLL_CONTAINER_ID` stamp (`this.editorView.scrollDOM.id = EDITOR_SCROLL_CONTAINER_ID;`,
    line 281) and its now-dead import (line 52, keep `MainUI`).
  - `rebuildEditorState()` (~line 783-812): replace
    `editorView.scrollDOM.scrollTop` (both reads and the final write) with
    the same `document.getElementById(PAGE_SCROLL_CONTAINER_ID)` lookup.
    `editorView.scrollDOM.clientHeight` (used for the `cursorWasVisible`
    calc) should likewise become the new element's `clientHeight` — the
    calc is "is the cursor within the visible scrolled window," which is
    now a property of the outer container, not CM's own box.
- Modify: `client/editor_ui.tsx`
  - Delete the `EDITOR_SCROLL_CONTAINER_ID` export (line 81) once the above
    three files no longer reference it — grep for any remaining
    `EDITOR_SCROLL_CONTAINER_ID` occurrence before deleting; if `top_bar.tsx`'s
    `scrollContainerId` prop is removed in L8 first, this export becomes
    fully dead and safe to delete in this same leaf.

- [ ] Make all edits above.
- [ ] Run `npm run check`.
- [ ] Manual check against `:3333`: scroll deep into a long page, navigate
      away (open another page), navigate back (browser back button) —
      confirm scroll position is restored. This exercises `navigator.ts` +
      `content_manager.ts` together and is the regression this leaf exists
      to prevent.
- [ ] Commit: `fix(client): repoint scroll-position tracking from CM's scrollDOM to #sb-page-scroll (CM no longer owns scroll — see L6)`

### L8: `top_bar.tsx` restructuring

**Files:**
- Modify: `client/components/top_bar.tsx`

Changes, in the order they appear in the file:

- [ ] **Props**: remove `scrollContainerId` and `headerScrolled` from
      `TopBar`'s prop type and destructuring (lines 172-204) — no longer
      consumed anywhere once `for`/`data-scrolled` are dropped below. Add
      `lastModified?: string` (the raw ISO string from `PageMeta`) — the
      subtitle is computed inside this component from it, not passed
      pre-formatted, so `relativeTime`'s `now` parameter stays live across
      re-renders rather than freezing at whatever moment the parent computed
      it.
- [ ] **Remove** the `data-scrolled={headerScrolled ? "on" : "off"}` attribute
      from the root `<div id="sb-top">` (line 259).
- [ ] **Remove** the entire `.sb-breadcrumb-row-shell` / `.sb-breadcrumb-row-clip`
      / standalone `<m3e-breadcrumb className="sb-breadcrumb-row">` block
      (lines 263-298).
- [ ] **Remove** the standalone leading `<m3e-icon-button slot="leading">`
      asterisk button (lines 304-324) — replaced below.
- [ ] Change `<m3e-app-bar size="small" for={scrollContainerId} style={{position:"sticky", top:0}}>`
      (lines 299-303) to:

  ```tsx
  <m3e-app-bar size="large">
    <m3e-breadcrumb slot="leading" aria-label="Breadcrumb">
      <m3e-breadcrumb-item
        item-label="Home"
        disabled={!homeOnClick}
        onClick={homeOnClick
          ? (e: MouseEvent) => { e.preventDefault(); homeOnClick(); }
          : undefined}
      >
        <m3e-icon slot="icon" name="asterisk"></m3e-icon>
      </m3e-breadcrumb-item>
      {breadcrumbItems.slice(1).map((item) => (
        <m3e-breadcrumb-item
          key={item.key}
          current={item.current ? "page" : null}
          disabled={!item.onClick}
          onClick={item.onClick
            ? (e: MouseEvent) => { e.preventDefault(); item.onClick!(); }
            : undefined}
        >
          {item.label}
        </m3e-breadcrumb-item>
      ))}
    </m3e-breadcrumb>
    <span slot="title" className="sb-page-title">
      {/* unchanged PageNameEditor block */}
    </span>
    <span slot="subtitle">
      Edited {relativeTime(lastModified ?? "")} · {readingTimeMinutes(countWords(bodyText))} min read
    </span>
    {/* trailing children below: UNCHANGED from today */}
  </m3e-app-bar>
  ```

  Note `breadcrumbItems[0]` (the existing "Space" root segment, whose
  `onClick` is already captured as `homeOnClick` at line 234) is now
  represented by the icon-only first breadcrumb item, not repeated as a
  second "Space" text item — `breadcrumbItems.slice(1)` renders the rest.
  `bodyText` needs to come from somewhere — thread it as a new prop
  (`bodyText: string`, computed by the caller from
  `client.editorView.state.doc.toString()` minus the frontmatter range,
  same computation L4 already does — consider whether `FrontMatterPanel`
  and this subtitle computation should share a single "parsed live doc"
  hook instead of each re-slicing the document independently; if so, that
  hook is a good L4.5 candidate, `client/lib/use_live_frontmatter.ts` or
  similar — call this out as a follow-up leaf if L4 and L8 end up
  duplicating the same slice logic when actually written).
  Import `relativeTime` (L1) and `countWords`/`readingTimeMinutes` (L2) at
  the top of the file.
- [ ] **Trailing children**: leave every one of the four trailing controls
      (`SyncProgressIndicator`, read-only toggle, offline chip, kebab
      menu+trigger) exactly as they are today (lines 352-427) — this leaf
      does not touch them at all. Per §1.5, they now render inside the
      `size="large"` bar's `.heading` row (same row as the breadcrumb),
      which is the component's own built-in behavior, not something this
      leaf needs to arrange.
- [ ] Update the file-level comments at lines 210-233 that describe the
      now-removed breadcrumb-row-above-app-bar structure and the
      `for`+`position:sticky` rationale — they'll be actively misleading
      once this leaf lands; replace with a short pointer to this plan doc
      and §2/§3 above rather than re-explaining the whole history inline.
- [ ] Run `npm run check`.
- [ ] Commit: `feat(top_bar): size=large app bar, breadcrumb-in-leading-slot with asterisk-as-first-item, relativeTime+reading-time subtitle`

### L9: `top.scss` — remove dead machinery, add new scroll-snap + property-list styling

**Files:**
- Modify: `client/styles/top.scss`

- [ ] **Delete**: `.sb-breadcrumb-row-shell`, `#sb-top[data-scrolled="on"] .sb-breadcrumb-row-shell`,
      `.sb-breadcrumb-row-clip`, `.sb-breadcrumb-row` (lines 293-332), and
      their entire preceding HISTORY comment block (lines 218-292) — the
      comment is only meaningful as an explanation of code that's being
      deleted; don't leave orphaned prose.
  - [ ] **Delete** the `m3e-app-bar { z-index: 1 }` stacking-context rule
        (lines 33-46's comment + rule) — it existed specifically to defend
        against the breadcrumb row's static-paint-order collision, which no
        longer exists once that row is gone.
  - [ ] **Delete** `.main { overflow-y: auto; scrollbar-gutter: stable }`
        (lines 27-31) — `.main` (inside `#sb-top`, unrelated to the new
        `#sb-page-scroll`, don't confuse the two) no longer needs its own
        scroll box once the breadcrumb-collapse it was sized for is gone;
        confirm nothing else depended on this by checking `.main`'s other
        rules (padding-left/right custom properties, `env(titlebar-area-width)`
        sizing at lines 53-57) still make sense without it — they should,
        they're unrelated concerns.
- [ ] **Add** the new scroll-snap container rules (new section, place near
      the top of the file or in a new `_scroll_snap.scss` partial if this
      file is getting unwieldy — check its current line count first and use
      judgment per the "huge file, tear it down" code-smell guidance):

  ```scss
  #sb-page-scroll {
    height: 100%;
    overflow-y: auto;
    scrollbar-gutter: stable; // moved from .cm-scroller, see L6
    scroll-snap-type: y proximity; // not mandatory — see the mockup's own
      // comment for why (an unbounded body below the app bar would fight
      // mandatory snapping on every scroll-end pause)
    -webkit-overflow-scrolling: touch;
  }

  .sb-fm-panel {
    scroll-snap-align: start;
  }

  #sb-top {
    // no longer sticky (R1) — this just needs the two snap properties now,
    // position:sticky/top:0 inline style is removed in L8
    scroll-snap-align: start;
    scroll-snap-stop: always; // safety net against a hard fling skipping
      // past the app bar on first load/fast scroll — see mockup comment
  }
  ```

  Note `#sb-top` itself (not `.main` inside it) is the right selector for
  the snap properties — it's the element that survives as the app bar's
  outer chrome box after L8's restructuring, still identity-stable.
- [ ] **Add** `.sb-fm-panel`/`.sb-fm-row`/`.sb-fm-icon`/`.sb-fm-key`/
      `.sb-fm-value` rules, porting the mockup's `.sb-property-list`/
      `.sb-property-row` styling (`/tmp/sb-appbar-mockups/v5b.html:146-179`)
      onto the class names L4's component actually renders — border,
      radius, `surface-container-lowest` background, per-row flex layout,
      icon/key/value column treatment. Use the same `--md-sys-color-*`
      tokens the mockup uses (already available globally per `m3e-theme`,
      confirmed live by every other `--md-sys-color-*` reference already in
      this file).
- [ ] Run `npm run build:client`.
- [ ] Commit: `style(top): remove dead breadcrumb-collapse machinery, add scroll-snap + front-matter property-list styling`

### L10: `main.scss` cleanup pass

**Files:**
- Modify: `client/styles/main.scss`

- [ ] Re-read `#sb-main`'s comment (lines 183-195) — it currently describes
      "`m3e-drawer-container` manages its own start/main/end row layout... only
      needs to size it as a flex item of `#sb-root`'s column layout." That's
      still true (drawer-container's own sizing is untouched by this plan —
      only what's *inside* its default slot changed), but the comment's
      framing of `#sb-root`'s children ("TopBar, then #sb-main") is now
      stale since `<TopBar>` moved inside `#sb-main`'s subtree (L5). Update
      the comment; no functional CSS change expected here beyond L6's
      `#sb-editor` edit (already covered in that leaf) — this leaf is
      comment-hygiene plus a final read-through to catch anything else in
      this file referencing the old `#sb-top`-as-sibling-of-`#sb-main`
      structure.
- [ ] Run `npm run build:client`.
- [ ] Commit: `docs(main.scss): update comments for TopBar's new position inside #sb-main`

### L11: Snap to the app bar on EVERY navigation (decision #3) — and how it coexists with scroll-restore

**Decision #3 (§5) replaces this leaf's original scope.** The original draft
put a one-time mount effect in `editor_ui.tsx`. That's now wrong on its own
terms: investigation into `client/client.ts:1233-1250`
(`initNavigator()`'s `pageNavigator.subscribe` callback) shows **cold boot
and every subsequent in-app navigation already funnel through the exact same
single call path** —

```ts
this.pageNavigator.subscribe(async (locationState) => {
  await this.contentManager.loadPage(locationState);   // client.ts:1245
  ...
});
```

— which always calls `contentManager.loadPage()` →
`this.navigateWithinPage(locationState)` (`client/content_manager.ts:411`,
gated only by the `navigateWithinPage: boolean = true` default parameter,
which nothing in this codebase currently sets `false`). There is no separate
"cold boot" code path to special-case. So: **delete the mount-effect idea
entirely** and put the snap logic at its one true source — inside
`content_manager.ts`'s existing `navigateWithinPage`, which already has the
exact three-way branch this needs to slot into.

#### §11.1 — Tracing today's precedence (so the fix doesn't fight it)

`navigateWithinPage(pageState: LocationState)` (`client/content_manager.ts:525-615`)
has three mutually-exclusive branches, in this order:

1. **Explicit ref target** (`pageState.details` is a header/position/
   linecolumn — e.g. a `[[Page#Header]]` link click): computes `pos`,
   dispatches `selection` + `EditorView.scrollIntoView(pos, {y:"start"})`,
   then **returns early** (line 552: `if (pos !== undefined) { ...; return; }`)
   — deliberately bypasses everything below it.
2. **Cached position exists** (`pageState.scrollTop > 0` and/or
   `pageState.selection` — populated by `client/navigator.ts:153-163`'s
   `captureEditorPosition`, which snapshots the *leaving* page's scroll/
   selection on every navigation-away or `popstate`): calls
   `this.restoreScrollPosition(pageState.scrollTop)` (the MutationObserver-
   based hold-during-widget-render mechanism, lines 628-695) and/or sets
   `selection`. Sets `adjustedPosition = true`.
3. **Neither of the above** (fresh page, or a page with no meaningful
   history — e.g. never scrolled past the top before): today, defaults the
   cursor to just after the frontmatter (`frontMatterRegex`-based) and sets
   `this.client.editorView.scrollDOM.scrollTop = 0` +
   `dispatch({ selection: {anchor: initialCursorPos}, scrollIntoView: true })`.

**Resolution — snap wins, but only inside branch 3; branches 1 and 2 are
untouched.** This is not "snap vs. restore always fighting" — it's that
"scroll to top" was ALREADY the behavior for exactly the case decision #3
targets ("a page switch with no deep scroll history to honor"), and this
leaf simply changes what "top" means now that the front-matter panel sits
above the app bar in the scroll flow. A page you deliberately scrolled deep
into (branch 2) or jumped to a specific heading in (branch 1) must keep
doing exactly what it does today — re-snapping over either of those would
be a real regression (the very scroll-memory feature R8 protects), not a
feature. Concretely:

- Branch 1 (explicit ref): **no change**. A `[[Page#Header]]` link should
  land on that header, not snap to the app bar — snapping here would defeat
  the link's own purpose.
- Branch 2 (cached deep scroll): **no change**. `restoreScrollPosition`
  keeps doing exactly what it does today (once L7 repoints it at
  `#sb-page-scroll` instead of `editorView.scrollDOM` — L7 must land before
  this leaf, since they touch the same function).
- Branch 3 (no cached position): **the "scroll to top" line is replaced by
  the new snap-to-app-bar behavior.** This is the only branch this leaf
  touches.

#### §11.2 — Shared `snapToAppBar` helper (new module, not `editor_ui.tsx`)

`content_manager.ts` is a data/content-management layer; `editor_ui.tsx` is
a page-level view component. Per the "data → domain → view → page" direction
(coding-preferences), `content_manager.ts` importing FROM `editor_ui.tsx`
would be a backwards dependency (a lower layer reaching into a page
component). The snap function needs to be called from `content_manager.ts`
(§11.1) — so it lives in a new, neutral, dependency-direction-correct home:

**Files:**
- Create: `client/lib/scroll_snap.ts`

```ts
/**
 * Scrolls `#sb-top` into view within its scrolling ancestor, deferred until
 * the m3e custom elements it depends on for layout have upgraded and fonts
 * are loaded — otherwise `scrollIntoView` measures the pre-upgrade
 * (much shorter) placeholder box and lands short. See
 * /tmp/sb-appbar-mockups/v5b.html's own comment for the measured gotcha
 * this works around (`scroll-initial-target` alone is not reliable here).
 *
 * Cheap to call on every navigation, not just cold boot: `whenDefined` on
 * an already-upgraded tag resolves on the next microtask, and
 * `document.fonts.ready` is already resolved after the first page — so this
 * only actually waits on the very first call in a session.
 */
export async function snapToAppBar(topBarId = "sb-top"): Promise<void> {
  await Promise.all([
    customElements.whenDefined("m3e-app-bar"),
    customElements.whenDefined("m3e-breadcrumb"),
    customElements.whenDefined("m3e-icon"),
    document.fonts.ready,
  ]);
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  document.getElementById(topBarId)?.scrollIntoView({ behavior: "instant", block: "start" });
}
```

- [ ] Write `client/lib/scroll_snap.test.ts` — this is DOM-dependent (uses
      `customElements`/`document.fonts`/`scrollIntoView`), so mirror
      whatever DOM-test setup this repo's other DOM-touching `client/lib/`
      tests already use (check `box_proxy.test.ts` first, since
      `box_proxy.ts` looked like the closest existing DOM-adjacent module);
      if none of `client/lib/`'s existing tests touch real DOM, this may be
      better covered purely by L12's new e2e spec instead of a unit test —
      make that call by checking the existing pattern before writing one.

#### §11.3 — Wire it into `navigateWithinPage`'s branch 3

**Files:**
- Modify: `client/content_manager.ts`
  - Import `snapToAppBar` from `../lib/scroll_snap.ts`.
  - In branch 3 (~lines 601-614, the `if (!adjustedPosition)` block): keep
    the `frontMatterRegex`-based `initialCursorPos` computation unchanged
    (the cursor still belongs right after the frontmatter — that fact
    doesn't change just because the frontmatter is now hidden by default).
    Change the dispatch to **drop `scrollIntoView: true`** from it (so CM's
    own scroll-into-view doesn't fight the explicit snap below — the cursor
    position right after a hidden frontmatter block is already inside the
    visible viewport once snapped to the app bar, so CM has nothing useful
    to add here), and replace `this.client.editorView.scrollDOM.scrollTop = 0`
    with a call to the new helper:

    ```ts
    if (!adjustedPosition) {
      const pageText = this.client.editorView.state.sliceDoc();
      let initialCursorPos = 0;
      const match = frontMatterRegex.exec(pageText);
      if (match) initialCursorPos = match[0].length;
      this.client.editorView.dispatch({
        selection: { anchor: initialCursorPos },
        // No `scrollIntoView` here — snapToAppBar owns scroll positioning
        // for this branch (see plan §11).
      });
      void snapToAppBar(); // fire-and-forget, same pattern this method
        // already uses for its own async event dispatches below
    }
    ```
  - **Flash-of-wrong-position guard**: `restoreScrollPosition` (branch 2,
    lines 628-695) already solves an adjacent problem — a scroll assignment
    made before CodeMirror's first measure pass gets clamped to 0 and
    visibly flashes — by hiding the scroller (`scrollDOM.style.visibility =
    "hidden"`) until the position is confirmed applied. `snapToAppBar`'s
    async gate (custom-element upgrade + fonts + rAF pair) is a different
    mechanism solving the same *category* of problem, but has no such
    hide/reveal step of its own — on every subsequent in-app navigation
    (not just cold boot, where nothing has painted yet regardless), the
    page has *already painted* mid-transition before this microtask chain
    resolves, so a brief visible flash of "wrong" scroll position (front
    matter momentarily visible, or the previous page's scroll position
    briefly showing through) is a real, newly-introduced-by-decision-#3
    risk that did not exist when this only ran once at boot. Mitigate by
    applying the same `visibility: hidden` guard `restoreScrollPosition`
    uses, scoped to `#sb-page-scroll` (not `editorView.scrollDOM`, per L7),
    around the `snapToAppBar()` call in branch 3 — hide before dispatching
    the new page's state, reveal only after `snapToAppBar()` resolves. This
    is new work this leaf must do, not a reuse of existing code as-is.
- [ ] Make the edits above, including the visibility-hide/reveal wrap.
- [ ] Run `npm run check`.
- [ ] Manual check at `:3333`: (a) cold-load a page with frontmatter —
      rests snapped to the app bar, front matter revealed on pull-up,
      matching the original mockup check; (b) with that page still scrolled
      to its rest position, click a same-space link to navigate to a
      *different* fresh page — confirm it ALSO rests snapped to the app bar
      (decision #3's actual new behavior, not exercised by (a) alone); (c)
      scroll deep into a long page's body, navigate away, navigate back
      (browser back button) — confirm the deep scroll position is restored,
      NOT overridden by the snap (this is the regression this leaf's whole
      §11.1 analysis exists to prevent — if this check fails, branch 2 and
      branch 3 are bleeding into each other and the `adjustedPosition`
      gating above needs re-checking); (d) click a `[[Page#Header]]` link —
      confirm it lands on the header, not the app bar.
- [ ] Commit: `feat(content-manager): snap to the app bar on every navigation with no cached scroll position, without disturbing deep-scroll restore`

### L12: e2e test updates

**Files:**
- Delete: `e2e/app-bar-scroll-elevation.test.ts` — entirely tests the
  `for`-driven elevation-on-scroll + `#sb-top[data-scrolled]` mechanism this
  plan removes (L8/L9). Nothing in it survives.
- Delete: `e2e/breadcrumb-scroll-collapse.test.ts` — entirely tests the
  `.sb-breadcrumb-row-shell`/`-clip` collapse mechanism this plan removes
  (L9). Nothing in it survives.
- Modify: `e2e/app-bar-leading-trailing.test.ts`
  - The test `"leading asterisk icon-button reuses the breadcrumb root's
    Home navigation"` (line 47) currently selects
    `'m3e-app-bar m3e-icon-button[slot="leading"]'` (line 54) and asserts an
    `m3e-icon name="asterisk"` inside it. Update the selector to the new
    structure: `'m3e-app-bar m3e-breadcrumb[slot="leading"] m3e-breadcrumb-item:first-child'`,
    still asserting the nested `m3e-icon[name="asterisk"]` and the same
    click → "Navigate: Home" behavior.
  - The remaining trailing-slot tests (kebab, read-only toggle, offline
    chip, push toggle, CONFIG link, action-button list — lines 80-293)
    should not need selector changes (`m3e-app-bar m3e-icon-button[title="..."]`
    selectors are unaffected by `size` or by which row `.heading` puts them
    in) — **run them, don't just assume**; if `size="large"`'s internal
    layout affects click hit-targets or visibility in a way `small` didn't,
    fix forward here.
- Create: `e2e/appbar-frontmatter-scroll-snap.test.ts` — new coverage for
  this plan's actual behavior:
  - A page with frontmatter (`tags`, `date`) + enough body content to
    scroll: assert on load, `#sb-top`'s bounding box top is at (or very
    near) the viewport top (the "rests snapped to the app bar" behavior).
  - Scroll/wheel up from that rest position; assert the front-matter
    property list (`.sb-fm-panel`) becomes visible and its rows show the
    right key/value text.
  - Assert every trailing control from R6 is present and rendered inside
    `m3e-app-bar` regardless of the leading/breadcrumb restructuring —
    reuse this file's fixture pattern (`spaceFiles`, `gotoSilverBulletPage`)
    matching the three files above.
  - A page with NO frontmatter: assert `.sb-fm-panel` is entirely absent
    from the DOM (not just hidden) — covers L4's `rows.length === 0 → null`
    branch end-to-end.
  - **Decision #1 coverage (inline edit + writeback, L4)**: open a page with
    `status: draft` frontmatter, click the `status` row's value, type
    `published`, commit (blur or Enter), then read the page's raw text via
    `editor.getText()` (the same syscall `plugs/editor/stats.ts` uses — check
    whether this repo's e2e fixtures already expose a syscall-invocation
    helper, several other `e2e/*.test.ts` files likely do) and assert the
    frontmatter block now contains `status: published`. Reload the page
    (full navigation, not just a DOM re-render) and assert the panel still
    shows `published` — proves the write actually persisted to the document,
    not just to local component state. Also cover the reject path: commit an
    edit that produces invalid YAML (e.g. an unescaped `:` in a plain
    scalar) and assert the document is UNCHANGED and a notification appears
    (`flashNotification`'s rendered toast, however this repo's other e2e
    specs already assert on `M3eSnackbar`/notification DOM — grep for an
    existing pattern rather than inventing a new one).
  - **Decision #1 coverage, widened (block-style values, L4.3)**: on a page
    with `tags:\n  - journal\n  - retro` frontmatter, open the `tags` row's
    list-row editor, edit the first item's text, add a new item, remove the
    second item, then read the raw doc text and assert the frontmatter
    block now contains a `tags:` block sequence reflecting exactly those
    three operations (right items, right order) — NOT a flow array and NOT
    the original items. Reload and assert the panel still shows the edited
    list. Separately, on a page with a literal block scalar
    (`notes: |\n  line one\n  line two`), open the `notes` row's textarea,
    confirm it shows two DECODED lines (not the raw `|`-prefixed source),
    edit the text to three lines, commit, read the raw doc text and assert
    it still uses `|` (not `>`) with the three edited lines correctly
    re-indented under it, and that every OTHER key in that page's
    frontmatter is byte-for-byte unchanged (the "surrounding keys'
    formatting is preserved" claim from §4/L4.3, checked for real rather
    than assumed).
  - **Decision #3 coverage (re-snap on every navigation, L11)**: from a page
    at rest (snapped to the app bar), click a link to a second page; assert
    the second page ALSO rests snapped to the app bar on arrival (not just
    the first page loaded in the test, which the earlier assertions in this
    file might otherwise only incidentally cover once). Separately: scroll
    deep into a long page's body (well past the app bar), navigate to a
    second page, then navigate back (`page.goBack()`); assert the FIRST
    page's deep scroll position is restored — i.e. the app bar is NOT at the
    viewport top on return, proving decision #3's re-snap did not clobber
    branch-2 scroll-restore (§11.1's precedence). This is the single most
    important new assertion in this leaf — it's the regression the whole
    plan is most likely to silently introduce if L11 is implemented
    carelessly.

- [ ] Delete the two obsolete spec files.
- [ ] Update the one selector + re-run the rest of that file.
- [ ] Write the new spec file, including both decision-specific blocks above.
- [ ] Run `npm run test:e2e` — full suite green (this also re-validates
      every other app-bar-adjacent spec not explicitly touched here, e.g.
      anything asserting `#sb-top`'s existence/attributes incidentally).
- [ ] Commit: `test(e2e): retire breadcrumb-collapse/scroll-elevation specs, add scroll-snap + inline-edit + navigation-resnap coverage`

## §5 Decisions (resolved by Jack, 2026-09-22) and remaining risks

### §5.A Resolved decisions — locked in, not open

1. **Full inline editing, including block-style YAML — widened
   2026-09-22.** The property list writes directly back to the raw YAML
   frontmatter in the CM document for EVERY value shape: plain scalars,
   flow arrays/objects, block sequences, block mappings, and `|`/`>` block
   scalars (§4/L4, all five sub-steps, L4.3 now the largest single
   sub-step in the plan). *Rationale:* a Notion-style property list that
   can only edit some rows and shrugs at others (Jack's own `tags` example
   is exactly the shape — a block sequence — most likely to hit that
   shrug) is a worse, inconsistent experience than the raw YAML it
   replaces; "full inline editing" should mean full, not "full for the
   easy half of YAML." The remaining scope line is drawn narrower and more
   honestly than the original draft's "block = out of scope": every shape
   is genuinely editable via a shape-appropriate control (§4/L4.3), a
   recursive row-per-nested-key UI for block mappings is NOT built (a raw
   textarea of that nesting's YAML source is, instead — still real editing,
   just not decomposed into further Notion rows), and js-yaml's own
   canonical-formatting normalization within a single edited field's span
   is accepted rather than chased into a lossless YAML patcher (§4/L4.3's
   round-trip-fidelity section states exactly what is and isn't preserved).
2. **Always auto-fold, overriding the space's `never`/`long`/`always`
   config** (§3, L3). *Rationale:* the property list is now the canonical
   view of frontmatter — showing raw YAML alongside it (even for a space
   that opted out of the old chip-placeholder fold) would mean two
   simultaneously-editable representations of the same data able to drift
   out of sync mid-edit, which is a worse failure mode than removing a
   per-space display preference that only ever applied to the now-deleted
   chip placeholder in the first place.
3. **Re-snap to the app bar on every in-app page navigation, not just cold
   boot** (§11, L11 — fully rewritten from the original draft, see below).
   *Rationale:* "the app bar is the resting point" should be a property of
   the app's navigation model, not a one-time boot animation that only the
   very first page a session happens to load gets to demonstrate.

### §5.B Risks — some pre-existing, several newly introduced by §5.A's decisions

4. **[NEW, from decision #1] Echo-loop between the panel's own writeback and
   its doc-change listener.** Specified and mitigated in §4/L4.4 (the
   focused-row guard) — flagged here because it's the kind of subtle,
   easy-to-regress interaction bug that a quick "looks like it works"
   manual check can miss (it only shows up when a *second* doc-change source
   — another sync, another edit — fires while a row is actively focused).
   Make sure L4.4's specific test case (a concurrent doc-side edit while a
   row's input is focused) actually gets written and run, not skipped as
   "unlikely in practice."
5. **[NEW, from decision #1] Malformed-YAML edge cases beyond the happy
   path.** §4/L4.2's validate-before-dispatch gate (re-parsing the whole
   spliced block, not just the new value in isolation) covers the common
   cases, but YAML has enough edge-case syntax (multi-document markers,
   anchors/aliases, flow-scalar ambiguities) that some valid-looking edits
   could still produce a technically-valid-but-semantically-wrong document
   (e.g. accidentally closing a flow collection early). No further
   mitigation is proposed beyond the existing validate+reject+notify gate —
   noting this as a residual, accepted risk rather than pretending the
   validation is airtight.
6. **[NEW, widened along with decision #1, 2026-09-22] Block-value
   round-trip fidelity is explicitly NOT lossless.** §4/L4.3 states this
   directly rather than leaving it implicit: editing a block sequence,
   block mapping, or block scalar re-serializes that ONE field through
   js-yaml's own dumper, which can normalize formatting details the
   original author chose deliberately — indentation width other than 2
   spaces, quoting style on items inside a re-dumped collection, and exact
   chomping (`|-`/`|+` vs bare `|`) on a re-dumped block scalar. The `|`
   vs `>` indicator itself IS preserved (L4.1's `styles` option), and
   nothing outside the edited field's span is touched — but "the rest of
   that one field's formatting comes back js-yaml-canonical, not
   byte-identical" is a real, user-visible property of every block edit,
   not just an internal implementation detail. Surface this if a beta user
   ever reports "my frontmatter formatting changed" — that's expected
   behavior per this decision, not a bug, and should be documented as such
   wherever end-user-facing release notes for this feature eventually live.
7. **[NEW, from decision #3] Flash-of-wrong-scroll-position on every
   navigation, not just once per session.** Specified and mitigated in
   §11.3 (the `visibility: hidden` wrap borrowed from
   `restoreScrollPosition`'s existing pattern) — flagged here because this
   risk didn't exist in the original cold-boot-only draft (nothing has
   painted yet at boot) and is a direct, mechanical consequence of decision
   #3 firing on every navigation instead. Verify the mitigation visually at
   `:3333` (L11's manual check (b)) rather than trusting the code alone —
   visibility-timing bugs are notoriously easy to get subtly wrong (e.g.
   revealing one frame too early) and hard to catch from reading the diff.
8. **[NEW, from decision #3] `navigateWithinPage`'s three-branch precedence
   is now load-bearing in a way it wasn't before.** Before this plan, the
   distinction between "explicit ref," "cached deep scroll," and "fresh page
   default" only affected *initial cursor/scroll placement* — getting the
   branch gating slightly wrong was a minor UX papercut. After decision #3,
   getting it wrong means either the app bar never snaps on plain page
   switches (branch-3 logic accidentally not reached) or, worse, snapping
   *does* fire on top of a restored deep-scroll position (branch 2 and
   branch 3 bleeding together) — a visible, repeated annoyance on exactly
   the "scroll deep, navigate away, come back" workflow R8 exists to
   protect. This is why L12's e2e coverage makes the "deep scroll survives a
   navigate-away-and-back round trip" assertion the explicitly called-out
   most-important new check in the whole plan, not an afterthought.
9. **CM auto-height + very long documents (L6).** CM6's virtualization still
   functions when scroll-tracking defers to an outer ancestor
   (`scrollableParents`, confirmed present and used for exactly this in the
   installed `@codemirror/view` build) — but this repo has not measured
   actual scroll/typing performance on a very long real page (10k+ lines)
   under this configuration. Add a manual perf smoke-check (open the
   longest real page in the demo/test spaces, type, scroll) as part of L6's
   verification, beyond what's already listed there.
10. **The `lhs`/`rhs` spacer divs on `TopBar`** (flagged in L5) — their
   original purpose wasn't confirmed in this investigation; don't remove
   them speculatively, but do flag the finding.
11. **`@m3e/web` version drift note.** This repo is pinned to **2.7.12**; the
    `m3e` skill's cards (referenced throughout this plan, e.g. §1.5's
    app-bar/breadcrumb slot names) are generated against **2.7.3**. Every
    fact this plan relies on from the skill cards was **re-verified directly
    against this repo's own `node_modules/@m3e/web/dist/*.js`** (§1.5's
    grep, the drawer-container `part=` grep, the `scrollableParents` grep in
    `@codemirror/view`) rather than trusted from the skill cache — the one
    prior spec in this repo (`2026-09-17-vertical-toolbar-search-nav-redesign-spec.md`,
    its own §1.1) did the same and found no drift for the tags it checked;
    this plan independently re-checked the tags it uses and likewise found
    no attribute/slot drift, only the version-specific internal-template
    fact in §1.5 (which the skill card doesn't cover at all, being an
    internals-of-`size="large"` question the card's own prose doesn't
    answer either version).

## §6 Verification summary (per-leaf detail is above; this is the full-plan gate)

- [ ] `npm run check` (tsc --noEmit) — zero errors, run after every leaf.
- [ ] `npm run build:client` — the live `:3333` debug server reads the
      client bundle from disk; **do not restart or rebuild the Rust
      server** for any of this work — it's 100% client-side. Rebuild the
      client after each leaf that touches `client/` and refresh `:3333` to
      see it.
- [ ] Manual checks at `:3333` (repeated from individual leaves, consolidated
      here as the final pass): non-sticky scroll (app bar moves with the
      page, doesn't float), pull-to-reveal snap resting on the bar by
      default, every trailing control present and clickable (sync spinner
      shows during a sync, lock icon toggles read-only, offline chip
      appears when offline, kebab opens with all its items), front matter
      visible as a property list and NOT visible as raw YAML text, clicking
      a property row jumps into the real YAML at that key.
- [ ] `npm run test:e2e` — full suite green, including the new/updated
      specs from L12.

---

## Self-review notes (per the writing-plans skill's required pass)

- **Spec coverage**: every requirement in §0's table maps to at least one
  leaf; §5.A records Jack's three resolved decisions with rationale, §5.B
  lists what's still genuinely open or newly-introduced risk rather than
  silently dropped.
- **Placeholder scan**: L4 (five sub-steps, L4.1-L4.5 — L4.3 now the single
  largest sub-step in the plan after being widened to cover block-style
  YAML) replaced its earlier "illustrative snippet with two unresolved
  points" framing — the event-hook-API guess is gone entirely (replaced by
  a concrete CM `ViewPlugin` + callback-prop mechanism the codebase already
  proves works via `frontmatterFoldingExtension`), the jump-to-key wiring
  is now a fully specified inline call using L3's `frontmatterKeyLinePos`
  (kept as a documented escape hatch, not the primary path, once L4.3
  widened), and "block-style multi-line collections fall back to
  display-only" — the one deliberately-scoped-down placeholder the
  previous revision of this doc still carried — is gone too, replaced by
  L4.3's per-shape editor controls and stated round-trip-fidelity tradeoffs
  rather than a punted feature. L11 similarly replaced its own former open
  question (re-run-on-navigation) with a traced, resolved mechanism
  (§11.1-§11.3) rather than leaving it for the executor to figure out.
- **Type/name consistency**: `PAGE_SCROLL_CONTAINER_ID` is introduced once
  (L5) and referenced by the same name in every later leaf (L7, L9, L11);
  `relativeTime`/`countWords`/`readingTimeMinutes` names match their L1/L2
  definitions everywhere they're used later (L8); `snapToAppBar`
  (`client/lib/scroll_snap.ts`, L11) and `locateFrontMatterFields`/
  `serializeYamlValue`/`tryParseFrontMatter` (`client/lib/frontmatter_yaml.ts`,
  L4.1) are each defined once and referenced by the same name everywhere
  they're used later (L4.2-L4.5, §11.3).
- **Sequencing check (new, given L4 and L11 both grew substantially)**: L7
  must land before L11 (both touch `navigateWithinPage`/
  `restoreScrollPosition` — noted explicitly at the top of L7); L3 must land
  before L4 (`frontmatterKeyLinePos` is L3's output, L4.3's consumer); L1/L2
  must land before L8 (subtitle's imports). No leaf reads from one not yet
  listed above it in §4's ordering.
