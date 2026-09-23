# 2026-09-16 — Toolbar / Search consolidation + live-feedback spec

Follow-on to `docs/plans/2026-09-16-m3e-reskin-and-agentic-journal-spec.md`. Conventions inherited: bare side-effect imports (`import "@m3e/web/x"`), raw `<m3e-*>` in Preact JSX typed via `client/components/m3e-jsx.d.ts`, no `@m3e/react`. All component APIs below verified against `node_modules/@m3e/web/dist/custom-elements.json` (138 tags).

## §1 Current state (verified reads)

| Area | File / line | Fact |
|---|---|---|
| Floating toolbar | `client/components/floating_toolbar.tsx` | Renders, in order: N CONFIG `actionButtons`, read-only toggle, push/bell toggle, recent-pages `m3e-menu-trigger`, journal, filled "New" → 4 fixed + N dynamic |
| App bar | `client/components/top_bar.tsx:160-236` | `m3e-breadcrumb` row + `m3e-app-bar size="small" for=… position:sticky`; `slot="title"` only; `slot="trailing"` holds only `SyncProgressIndicator`. No `leading` slot used, no kebab (removed earlier) |
| Breadcrumb collapse | `client/styles/top.scss:146-184` | `.sb-breadcrumb-row{overflow:hidden;padding:4px 20px 10px;max-height:42px}`; `#sb-top[data-scrolled="on"] .sb-breadcrumb-row{max-height:0;opacity:0}`; `.main{overflow-y:auto}`; app bar has no explicit `z-index`/opaque stacking above the row |
| Pickers | `anything_picker.tsx`, `command_palette.tsx` → both render `FilterList` (`filter.tsx`) → `m3e-search-view mode="fullscreen"` + `m3e-list` | This IS Jack's "search review" = `m3e-search-view` chrome |
| Capture sheet pattern | `item_capture_sheet.tsx` | `m3e-bottom-sheet modal handle hideable open={}` + `m3e-segmented-button`/`m3e-button-segment` (with `checked` + `onInput`) + `m3e-form-field`; note the live-verified quirk: `handle` must be set as a real **attribute** via ref (`sheetRef.current?.setAttribute("handle","")`) or the header slot is `display:none` |
| Recency data | `client/client.ts:154,1171-1182` | `recentPaths: {path,ts}[]`, persisted in `ds` under `["client","recentPaths"]` — recent **pages already exist** |
| Command recency | `command_palette.tsx:23` (`def.lastRun`), `client.registerCommandRun()` | recent **commands already exist** |
| Recent search terms | — | **Do not exist**; must be added (same `ds` pattern as `recentPaths`) |
| Full-text search | none | No search plug in core (`silversearch` is an external ghr plug, `Dockerfile.website`); `plugs/index/paragraph.ts:55` only indexes tagged/anchored paragraphs → no reliable FTS backend |
| Linked Mentions | `libraries/Library/Std/Widgets/Widgets.md:273-318` | Space-Lua bottom widget: `widgets.linkedMentions()` returns `widget.new{markdown="# Linked Mentions\n"…}` via `hooks:renderBottomWidgets` → `client/codemirror/top_bottom_panels.ts:145` `ArrayWidget` → `LuaWidget(inPage:false)` → chrome from `lua_widget.ts:388-522` `wrapHtml()` (`div.button-bar` + `div.content`), styled `client/styles/editor.scss:558-572,690-722`. The **2 existing icons = "Reload"** (`index.refreshWidgets`) and **"Copy"** (`editor.copyToClipboard`) — raw feather `<svg>` in hand-built `<button>`s, hover-revealed absolute overlay |
| Push | `client/lib/push_subscribe.ts:118-138`, `client/editor_ui.tsx:380-500` | POSTs `${sidecarUrl}/push/subscribe`; "Failed to fetch" = `reason:"post-failed"` |
| Baked config | `client_bundle/client/.client/client.js` | **`pushSidecarUrl="http://localhost:8791"`** (live evidence) |
| Sidecar | `/Users/jack/Documents/code/workspace/knowledge-substrate/push/server.mjs` | `createServer(handler).listen(port,"127.0.0.1")`; handles only `POST /push/subscribe` and `POST /push/send`; **no `OPTIONS` route, zero `Access-Control-Allow-*` headers** |
| Existing same-origin proxy | `server/src/router.rs:108`, `server/src/handlers/proxy.rs` | `any("/.proxy/{*path}")`; `proxy_target_url` uses `http://` for `localhost|127.0.0.1|…`; forwards **only** `X-Proxy-Header-*`-prefixed headers (prefix stripped); refuses when `boot_config.read_only` |
| Demo config | `demo-space/CONFIG.md:3-26` (untracked) | `actionButton.define{icon="zap", description="m3e Demo", run=editor.flashNotification "This top bar is the reskinned m3e-app-bar!"}` and `actionButton.define{icon="github", …openUrl}` |
| Icons | `client/styles/main.scss:51` + `client/fonts/MaterialSymbolsOutlined.woff2` (460 KB) | Ligature-name font; `m3e-icon name="…"` resolves by ligature. `client/filtered_material_icons.ts` is a **separate** react-icons export list used only by `actionButtons`, and contains no asterisk |

## §2 Per-item spec

**Item 8 — push subscribe "failed to fetch" (P0, root cause CONFIRMED).**
Two independent, sufficient causes: (a) the page is `https://jacks-macbook-pro.tail93dc3b.ts.net:8443`, the baked target is `http://localhost:8791` → cross-origin `POST` with `Content-Type: application/json` forces a CORS **preflight**; the sidecar has no `OPTIONS` route and no `Access-Control-Allow-Origin`, so it 404s bare → browser surfaces `TypeError: Failed to fetch`. (b) `http://` from an `https://` document (Safari blocks `http://localhost` outright; Chrome exempts it) and `localhost` is simply wrong from any other device on the tailnet. **Target:** route the subscribe POST through the server's existing same-origin proxy — bake `PUSH_SIDECAR_URL=/.proxy/localhost:8791`, so `push_subscribe.ts` fetches the relative `/.proxy/localhost:8791/push/subscribe`. Because `handle_proxy` forwards only `X-Proxy-Header-*` headers, the client must send `X-Proxy-Header-Content-Type: application/json` (and may drop the plain `Content-Type`, which also removes the preflight since it becomes a simple request). Keeps the sidecar loopback-bound and unauthenticated-but-unreachable. Secondary hardening (other repo, optional): an `OPTIONS` + allowlisted `Access-Control-Allow-Origin` route in `server.mjs`. Known limitation to document: the proxy refuses in read-only mode.

**Item 1 — breadcrumb peeks above the app bar on scroll.** Current collapse is `max-height:0;opacity:0` with `overflow:hidden`, but the host still participates in layout/stacking and `m3e-breadcrumb`'s shadow content can paint outside a zero-height box; the sticky app bar has no `z-index` or opaque background guaranteeing it paints over the row, and `.main{overflow-y:auto}` lets the row scroll a few px into the bar's band. **Target:** `#sb-top{overflow:hidden}` clip, explicit `z-index`/opaque container color on `m3e-app-bar`, and terminate the collapse in a non-painting state (`visibility:hidden` at the end of the transition, or `content-visibility:hidden`) rather than relying on `max-height` alone. Acceptance: at `scrollTop>0`, `getBoundingClientRect()` of `.sb-breadcrumb-row` has `height===0` and no descendant rect has `top < appBarRect.top`.

**Items 2 + 12 — toolbar reduced to exactly 4.** Target `floating_toolbar.tsx` renders **Journal, Add, Search, Read-only** and nothing else. `actions` (CONFIG `actionButtons`), `recentPages`, and `pushToggle` props are **deleted** from its API: `actionButtons` + push move to the new app-bar kebab (item 11); recent-pages is subsumed by the search sheet's open-mode history (item 5). The `toolbarActions` computation in `editor_ui.tsx:611-690` moves wholesale to the kebab's item source (keep its `lock`/`home`/`github` icon filters).

**Items 3 + 4 + 5 — consolidated search bottom sheet.** New `client/components/search_sheet.tsx`: `m3e-bottom-sheet modal handle hideable open={}` (mirroring `item_capture_sheet.tsx`, including the `setAttribute("handle","")` workaround) containing:
- an `m3e-segmented-button` with 3 `m3e-button-segment`s — `open` (icon `description`/`find_in_page`), `run` (icon `terminal`), `search` (icon `search`);
- an `m3e-search-bar clearable` whose `slot="input"` is a plain `<input>` (this is exactly why `plug-api/ui/input.tsx` has its `bare` prop), plus an `m3e-autocomplete for="<input id>"` holding `m3e-option`s (`query`/`change` events) for suggestions. `m3e-search-view` is **not** used here — that's the "search review" chrome Jack is replacing;
- an `m3e-list` of results/history below.
Mode semantics: **open** reuses `anything_picker.tsx`'s option-building (pages/documents/tags/anchors) + its navigate handlers; **run** reuses `command_palette.tsx`'s option-building + the existing `onTrigger` path incl. `registerCommandRun`; **search** — since there is no core FTS backend, scope v1 to (i) fuzzy match over page names/tags via the existing `fuzzySearchAndSort`, plus (ii) a first-row "Search space for *«query»*" action that runs a `/^Search/`-matching command **only if** one exists in `viewState.commands` (silversearch installed), and (iii) recording the term. Explicitly document that real full-text search is out of scope for this round.
History under the bar, filtered by mode: `open` → `client.recentPaths`; `run` → commands sorted by `def.lastRun`; `search` → new `recentSearchTerms` persisted at `["client","recentSearchTerms"]` following `recentPaths`' exact read/write pattern in `client.ts`. Shown when the query is empty.
Existing `FilterList`-based `AnythingPicker`/`CommandPalette` modals stay reachable via their current keybindings/`filterBox` API — the sheet is an additional consolidated entry point, not a deletion of `filter.tsx`.

**Item 6 — asterisk home button.** New `m3e-icon-button slot="leading"` inside `top_bar.tsx`'s `m3e-app-bar` (`leading` is a real slot), running the same `Navigate: Home` command the root breadcrumb segment already runs. Icon name must be verified live in the bundled Material Symbols font; `asterisk` is the intended ligature with `emergency` as the documented fallback.

**Item 7 — Linked Mentions as an `m3e-card`.** `m3e-card` slots are `header`/`content`/`actions`/`footer` — rebuild `LuaWidget.wrapHtml()`'s block chrome as `m3e-card variant="outlined"` with an app-bar-style header row: leading `m3e-icon-button` (`expand_more`/`expand_less`) toggling the content region, a title, and trailing `m3e-icon-button`s replacing the hand-rolled `<button>`+inline-SVG bar — `refresh` for Reload, `content_copy` for Copy (and `package`→`deployed_code`, `edit`, `visibility` for the in-page variants). Title source: hoist the rendered content's leading `<h1>` text into `slot="header"` (Linked Mentions' markdown begins `# Linked Mentions`), falling back to no title. **Scope decision:** gate the card chrome on `!opts.inPage` (top/bottom array widgets only, `top_bottom_panels.ts:76`) so in-page query/directive widgets are untouched this round — that keeps the blast radius to the widget Jack actually named. `editor.scss:690-722`'s `.button-bar` rules and the `h1` background hacks at `:558-572` retire for that path.

**Item 9 — remove zap/demo snackbar.** Lives only in `demo-space/CONFIG.md` (untracked), not in client code: delete that `actionButton.define` block and the matching claim in `demo-space/index.md:7`. Also remove it from Jack's live space config if present (verify at deploy time).

**Item 10 — remove GitHub button + config entry.** The button is already suppressed in code (`editor_ui.tsx` filters `button.icon !== "github"`), so item 10 is **partially already fixed**; what remains is the real `actionButton.define{icon="github"}` block in `demo-space/CONFIG.md:19-26` and the `index.md:7` mention. Once both `zap` and `github` entries are gone, the `icon !== "github"` filter and its long comment can also be simplified — but keep the `lock`/`home` filters.

**Item 11 — app-bar trailing kebab.** `m3e-icon-button` (`more_vert`) wrapping `m3e-menu-trigger for="sb-app-bar-menu"` in `top_bar.tsx`'s `slot="trailing"` (beside the existing sync indicator), plus a sibling `m3e-menu id="sb-app-bar-menu"` — same composition `floating_toolbar.tsx` already uses for `sb-recent-pages-menu`, but with default `position-y="below"` since this anchor is at the top of the viewport. Contents: push/notifications toggle (moved from the toolbar, keeping all 8 `pushState` labels and the `disabled` semantics via `m3e-menu-item disabled`), a config link (`client.navigate` to `CONFIG`, or the `Editor: Open Config` command if present — verify), and every CONFIG `actionButton`.

## §3 Traceability

| Item | Plan leaves |
|---|---|
| 8 push bug | L1, L2, L3 |
| 1 breadcrumb overflow | L4 |
| 9 zap snackbar | L5 |
| 10 github button/config | L5, L13 (partially already fixed in code) |
| 6 asterisk home | L6 |
| 11 app-bar kebab | L7, L8 |
| 5 history store | L9 |
| 3 search sheet + search bar + autocomplete | L10 |
| 4 mode picker (open/run/search) | L11 |
| 5 history list under bar | L12 |
| 2 toolbar too long | L13 |
| 12 four-item toolbar | L13 |
| 7 Linked Mentions card | L14, L15 |

## §4 Plan (atomic leaves, each with a cheap acceptance test)

**P0 — push regression**
- **L1 (diagnose, confirm-only)** — `curl -i -X OPTIONS http://127.0.0.1:8791/push/subscribe` → expect 404 with no `Access-Control-*`; `curl -i http://127.0.0.1:8791/push/subscribe -X POST -d '{}' -H 'Content-Type: application/json'` → expect 400 JSON (proves the sidecar is up and the failure is CORS, not liveness); `grep -o 'pushSidecarUrl="[^"]*"' client_bundle/client/.client/client.js`. **Accept:** the three outputs recorded in the plan doc.
- **L2 (client)** — `push_subscribe.ts`: send `X-Proxy-Header-Content-Type: application/json` instead of a plain `Content-Type`, accept a relative `sidecarUrl`, and document the proxy hop. **Accept:** `e2e/push-notifications.test.ts` still 4/4 green (rebuild with the test's own `localhost:9999` fixture), and its intercepted request records the new header.
- **L3 (deploy)** — rebuild the live bundle with `PUSH_SIDECAR_URL=/.proxy/localhost:8791`; click the bell on the live instance. **Accept:** "Push notifications enabled" snackbar and a new entry in the sidecar's subscription store; sidecar log shows the POST.

**P1 — cheap, isolated wins**
- **L4** breadcrumb clipping fix (`top.scss`, possibly `top_bar.tsx`). **Accept:** the scrolled-state rect assertion in §2 item 1, via Playwright or a browser-tool check.
- **L5** delete the `zap` and `github` `actionButton.define` blocks from `demo-space/CONFIG.md` and fix `demo-space/index.md:7`. **Accept:** `grep -c 'zap\|github' demo-space/CONFIG.md` → 0; reload shows no snackbar button.
- **L6** asterisk icon-button in the app bar's `leading` slot. **Accept:** clicking it navigates to the index page, and the rendered glyph is a real asterisk (not tofu) — verify the ligature before committing the name.

**P2 — kebab (must precede L13)**
- **L7** `m3e-menu` + kebab trigger in `top_bar.tsx`'s trailing slot, empty-safe, with a new `menuItems` prop. **Accept:** clicking `more_vert` opens a menu positioned below the bar.
- **L8** move the push toggle + CONFIG `actionButtons` + a config link into that menu from `editor_ui.tsx`. **Accept:** all 8 push labels/disabled states still reachable; a CONFIG-defined `actionButton` appears and runs.

**P3 — search sheet (strictly sequential; one file, three leaves)**
- **L9** `recentSearchTerms` in `client.ts` (+ `ds` persistence), mirroring `recentPaths`. **Accept:** unit test — record 3 terms, reload, read back deduped and capped.
- **L10** `search_sheet.tsx` skeleton: bottom sheet + `m3e-search-bar` + `m3e-autocomplete` + empty list; opened from a temporary trigger. **Accept:** sheet opens, typing filters nothing yet, Escape closes.
- **L11** the 3-mode segmented picker wired to the extracted open/run/search option builders. **Accept:** each mode returns correct results and Enter performs navigate / run-command / record-term respectively.
- **L12** mode-filtered history list when the query is empty. **Accept:** with an empty query, `open` lists `recentPaths`, `run` lists last-run commands, `search` lists recorded terms.

**P4 — toolbar reduction (depends on L8 + L12)**
- **L13** cut `floating_toolbar.tsx` to Journal / Add / Search / Read-only; delete the `actions`, `recentPages`, `pushToggle` props and their `editor_ui.tsx` call-site wiring; simplify the now-dead `github` filter. **Accept:** DOM query counts exactly 4 `m3e-icon-button`s in `.sb-floating-toolbar`; each does the right thing.

**P5 — Linked Mentions card**
- **L14** `m3e-card` chrome + Material `m3e-icon-button`s in `LuaWidget.wrapHtml()` for `!inPage`, with the header-title hoist and the collapse toggle. **Accept:** on a page with linked mentions, the widget renders an `m3e-card` whose header reads "Linked Mentions" with a working collapse toggle and 2 trailing icon-buttons that still reload/copy.
- **L15** retire the superseded `.button-bar`/widget-`h1` CSS in `editor.scss` for that path. **Accept:** no visual regression on in-page query widgets (which keep the old chrome) and `plugs/index/xray.test.ts` + widget e2e still green.

## §5 File-overlap risk (for the dispatching manager)

| File | Leaves | Guidance |
|---|---|---|
| `client/components/top_bar.tsx` | L4(maybe), L6, L7 | serialize: L6 → L7; L4 is CSS-first, keep it out of L6/L7's diff |
| `client/editor_ui.tsx` | L8, L11, L12, L13 | **hottest file** — strictly sequential L8 → L11/L12 → L13 |
| `client/components/floating_toolbar.tsx` | L13 only | safe to parallelize with L14/L15 |
| `client/components/search_sheet.tsx` | L10 → L11 → L12 | one owner, sequential |
| `client/codemirror/lua_widget.ts` + `client/styles/editor.scss` | L14, L15 | independent of everything else — run in parallel with P2/P3 |
| `client/styles/top.scss` | L4, L7(minor) | L4 first |
| `demo-space/CONFIG.md` | L5 | independent |
| `client/lib/push_subscribe.ts` | L2 | independent, do first |

## Summary

- **Item 8 root-caused with hard evidence, not a guess:** the deployed bundle bakes `pushSidecarUrl="http://localhost:8791"` while the live page is HTTPS on the tailnet, and `knowledge-substrate/push/server.mjs` binds 127.0.0.1 with **no OPTIONS route and no CORS headers** → the JSON preflight 404s → `Failed to fetch`. Fix reuses the SB server's **already existing** `/.proxy/{*path}` route (`server/src/router.rs:108`) for a same-origin hop, which also requires switching the client to `X-Proxy-Header-Content-Type` since the proxy forwards only `X-Proxy-Header-*` headers.
- **Item 10 is partially already fixed** (code filters `icon !== "github"`); only the `demo-space/CONFIG.md` entry + `index.md` mention remain. Items 9 and 10 both live entirely in the untracked `demo-space/CONFIG.md` — no client code involved.
- **"Search review" confirmed** as `m3e-search-view` (via `filter.tsx`'s `FilterList`), replaced in the new sheet by `m3e-search-bar` + `m3e-autocomplete` + `m3e-list`.
- **History is mostly not greenfield:** `client.recentPaths` (persisted) and `Command.lastRun` already exist; only `recentSearchTerms` is new.
- **No core full-text search exists** (silversearch is an external plug; `paragraph.ts` only indexes tagged/anchored text) — search mode is scoped honestly to name/tag fuzzy match plus an optional delegate to a `Search…` command.
- **Linked Mentions** is a Space-Lua bottom widget whose chrome comes from `lua_widget.ts wrapHtml()`; the "two existing icons" are **Reload** and **Copy**, hand-built `<button>`s with inline feather SVG.
- 15 leaves, sequenced P0 push → P1 isolated wins → P2 kebab → P3 search sheet → P4 toolbar cut → P5 card, with `editor_ui.tsx` flagged as the serialization bottleneck.

## Ad-hoc fix: PWA double-reload update lifecycle (new, separate from the toolbar batch above)

| leaf | task | agent-id | workspace | branch | status |
|---|---|---|---|---|---|
| SW single-reload | fix "takes 2 reloads to see new deploy" — controllerchange-guarded single reload | `c47793d4-ae97-449a-9eab-a5e2301dfb83` | `wks_4d0c5a1ceec6d788` | `fb-sw-single-reload-update` | **done** — real update-cycle e2e (not a guard unit test): swapped the SW's own cache-name literal mid-session, called `registration.update()`, proved the SAME tab lands on the new version after exactly one reload it never initiated. Correctly distinguished "first controllerchange of a fresh install" (skip) from "any later transition" (reload) — a naive single-flag guard would've silently broken on session 2. Caught 2 real bugs in its OWN test before trusting it (async predicate not awaited; a restore-timing race). Manager verified: real diff (40 lines in `boot.ts`), own test + 2 regression checks green; investigated a suspicious multi-space-SW failure pattern (2/3 fail on one run) rather than dismissing it as flake, confirmed genuine non-determinism via a clean full re-run (3/3) — not caused by this fix. Merged+pushed as `4675fab0` |

## Gauntlet execution tracker

| leaf | task | agent-id | workspace | branch | status |
|---|---|---|---|---|---|
| L1+L2 | push CORS/proxy fix | `31a25157-f546-45fd-ac21-74736ed36a38` | `wks_2e96c6d7a8c3d42e` | `fb-push-cors-fix` | **done** — real diagnosis confirmed (curl proof: OPTIONS 404 no CORS headers, POST reaches app logic = CORS is the exact failure, not liveness); dual absolute/relative URL support kept (backward compat, zero test changes needed); merged+pushed as `5b312f64`. Manager end-to-end verified through the REAL proxy path: `curl -X POST http://127.0.0.1:3789/.proxy/localhost:8791/push/subscribe -H "X-Proxy-Header-Content-Type: application/json"` → `{"ok":true,"created":true,"count":1}`. Live daily-driver redeployed with `PUSH_SIDECAR_URL=/.proxy/localhost:8791` |
| L4 | breadcrumb overflow fix | `8dcf7c1f-653c-4b6b-95c8-49e263a84d1b` | `wks_9470b7d5a71e149d` | `fb-breadcrumb-overflow` | **done** (2× narration-yield, harvested both times) — found the REAL root cause: `.sb-breadcrumb-row` uses `box-sizing:border-box` with 14px padding, so `max-height:0` couldn't shrink it below the padding floor (verified via live computed-style dump); fixed by zeroing padding + `visibility:hidden` terminal state + `z-index`/opaque app-bar; self-caught a false-positive in own test (a deliberately-inset invisible touch-hitbox div). Manager-verified 4/4 own tests pass. Merged+pushed as `c31f562a` |
| L5 | demo-config cleanup (zap+github) | `24605dc6-0e8a-4772-bef4-7edfef7b347a` | `wks_29250a7b264d4e63` | `fb-demo-config-cleanup` | **done** — found untracked dirs don't copy into fresh worktrees (real gotcha, logged), so worker edited main checkout's `demo-space/` directly instead (no tracked side effects, verified); nothing to commit/merge since demo-space is untracked-by-convention. Correctly did NOT simplify the `github` filter in `editor_ui.tsx` — found `docs/CONFIG.md` (a different, TRACKED space) has its own real github actionButton the filter still legitimately suppresses. Since live daily-driver runs `cargo run demo-space` from this exact repo path, this edit IS already live, no separate deploy step needed |
| L14+L15 | Linked Mentions m3e-card | `38ae0af5-b078-44c0-9e85-fdc26e55fc87` | `wks_e57ba82dd32ef158` | `fb-linked-mentions-card` | **done** — generic title-hoist (works for Linked Mentions AND Linked Tasks, falls back cleanly for TOC's no-h1 case), not hardcoded; proved in-page widgets keep old chrome via explicit regression test. Manager verified 14/14 fresh incl. 3 guide-suite regression files + xray. Merged+pushed as `3f6ba829` |
| L6+L7 | asterisk home + kebab shell | `4d123d7b-3bcf-40ab-8d3b-c822639609c6` | `wks_8f08b77cc84dc87c` | `fb-asterisk-kebab` | **done** — decompiled the actual font (fontTools) to confirm real glyph `asterisk` exists, no fallback needed; clean `AppBarMenuItem` prop shape (`{key,icon?,label,onClick,disabled?}`) ready for L8 to populate. Manager verified 3/3 fresh (own 2 + breadcrumb regression check). Merged+pushed as `1e602a43` |
| L9-L12 | consolidated search sheet | `7f50ac5b-e375-4c14-9527-055020997824` | `wks_2ecab0cf15cc6a4f` | `fb-search-sheet` | **done** — biggest leaf, well-executed: extracted shared option-building/navigate/run logic OUT of `anything_picker.tsx`/`command_palette.tsx` into reusable exports rather than duplicating (net LOC reduction in `editor_ui.tsx`); caught a real pre-existing bug (`registerCommandRun` never mutated in-memory `viewState.commands`, `CommandPalette` papered over it via `startCommandPalette()`'s augmenter, search sheet's own `startSearchSheet()` needed the same call — fixed); found a SECOND instance of the camelCase-vs-lowercase custom-event pitfall (`onclear` not `onClear` on `m3e-search-bar`). FTS honestly scoped out per spec. Manager verified 3/3 vitest + 18/18 e2e fresh (own tests + command-palette/page-picker/item-capture-sheet regression). Merged+pushed as `639f6b03`. Opened via new command "Navigate: Search Sheet" (`Cmd/Ctrl-Shift-/`), not yet wired into the toolbar — that's L13 |
| L8 | wire kebab contents (push+config+actions) | `44d97e03-e003-467e-b9dc-46c9e1537b85` | `wks_a9d18f46304388fb` | `fb-wire-kebab-contents` | **done** — correctly rejected "Configuration: Open" command (opens a rich settings panel, not the CONFIG page — investigated, not guessed), used `client.navigate({path:"CONFIG.md"})` instead matching established repo convention; correctly distinguished CONFIG actionButtons' feather-icon vocabulary from AppBarMenuItem's Material-Symbols vocabulary (left icon unset rather than render garbage/wrong glyphs). Manager ran the FULL suite (last leaf touching editor_ui.tsx before toolbar reduction): 141 passed, 1 known non-regression (push fixture-vs-real-key, same as before). Merged+pushed as `2dc09fd5` |
| L13 | toolbar reduction to 4 items | `be84ae0c-171d-4cfa-a658-6de1f7532726` | `wks_f204e1c54eb7c789` | `fb-toolbar-reduction` | **done** — root-caused both "regressions": #1 was a PRE-EXISTING bug from L8 (test hardcoded a pushState label, headless Chromium hardcodes `Notification.permission="denied"` regardless of real state — proved pre-existing by checking out the parent commit and reproducing identically before this leaf touched anything); #2 could not be reproduced across ~10 clean runs, left uninvestigated further per house policy (no anchor to fix against). Manager ran full suite twice more: confirmed both original failures gone, one different pre-existing flake (`lua-completion.test.ts`, known since PR-1 this morning) recurred once and cleared on isolated re-run. Merged+pushed as `f3e886d7`. **This closes the entire 2026-09-16 toolbar/search feedback spec** — but superseded by the 2026-09-17 nav-bar redesign spec for the search/toolbar layer specifically |

### Critical Files for Implementation
- `client/editor_ui.tsx`
- `client/components/floating_toolbar.tsx`
- `client/components/top_bar.tsx`
- `client/codemirror/lua_widget.ts`
- `client/lib/push_subscribe.ts` (+ `workspace/knowledge-substrate/push/server.mjs`)
