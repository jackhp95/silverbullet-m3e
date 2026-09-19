# Tailwind + M3E bridge vs. custom CSS — audit and options

**Status:** research / decision doc. **No execution.** Written for Jack's review; a
build order and any migration code belong in a separate later session (house
two-session pattern, `writing-plans` skill).

**Date:** 2026-09-19 · **Repo:** `silverbullet-m3e` @ `m3e-fork` (HEAD `8a5c8241`)

---

## 0. The question

Jack's position, as stated:

> "M3E gives us most of what we need… most things should just fit into the places
> they're designed to fit into using slots and typical composition within M3E. Any
> custom CSS file is an indication of something that needs to be deprecated and
> removed. I'd prefer Tailwind over custom CSS for layout/composition gaps M3E
> doesn't handle well."

Two sub-questions, answered separately below:

1. How much of this repo's custom CSS is actually the smell Jack thinks it is?
   (Part A)
2. Does the sibling tooling (`m3e-okf`, `tailwind-m3e-web`) exist, work, and apply
   here? (Part B)

---

## Part A — CSS inventory

### A.1 Surface area

All custom CSS lives in [`client/styles/`](../../client/styles) — 12 SCSS files,
**3,732 lines**, compiled by `sass.compileString` in
[`build/build_client.ts:139-150`](../../build/build_client.ts) into three sheets
(`main.css` for the editor, `app.css` for standalone pages, `components.css` for
plug-panel iframes).

| File | Lines | Rule blocks (approx.) |
|---|---:|---:|
| `editor.scss` | 817 | 134 |
| `colors.scss` | 619 | 104 |
| `theme.scss` | 466 | 22 |
| `_standalone.scss` | 466 | 63 |
| `top.scss` | 391 | 25 |
| `modals.scss` | 330 | 29 |
| `main.scss` | 312 | 37 |
| `components.scss` | 248 | 29 |
| `xray.scss` | 53 | 9 |
| `_tokens.scss` / `app.scss` / `components_bundle.scss` | 30 | 3 |
| **Total** | **3,732** | **~455** |

Selector prefixes (leading selector per rule, counted with `grep -ohE`):
`.sb-*` **334**, `.cm-*` **31**, `#sb-*` **18**, bare id/class 14.

Discipline signals — these matter for the verdict:

- `::part(…)`: **0 occurrences.** Nothing pierces a shadow root by force.
- `::slotted(…)`: **2** (`colors.scss`, `modals.scss`).
- `!important`: **18 total** (`editor.scss` 8, `colors.scss` 4, `theme.scss` 4,
  `main.scss` 2), and the CodeMirror ones are unavoidable — CM6 injects inline
  styles.
- `--m3e-*` custom-property overrides: **64** (`colors.scss` 23, `modals.scss` 12,
  `top.scss` 11, `components.scss` 10, `_standalone.scss` 8). These are the
  component-supported override channel, i.e. the *sanctioned* rung of the m3e
  skill's styling ladder, not a hack.

### A.2 Classification

**(c) CodeMirror / markdown editor surface — `editor.scss`, 817 lines (~22% of
all CSS), plus 31 `.cm-*` selectors elsewhere.**

This is the largest single bucket and it is *categorically out of scope for both
M3E and Tailwind*. The `.sb-*` class names in `editor.scss` are not authored
markup classes — they are CodeMirror 6 **decoration** class names emitted by
upstream SilverBullet's editor extensions: `.sb-line-h1…h6`, `.sb-header-inside`
(12 rules), `.sb-lua-top-widget`, `.sb-markdown-bottom-widget`,
`.sb-frontmatter-marker`, `.sb-table-align-*`, `.sb-wiki-link`, `.sb-admonition`,
`.sb-task-deadline`, etc. They appear in the DOM because TS decoration code puts
them there, never in a `.tsx` template.

Consequence: Tailwind's content scanner can never see them, and there is no M3E
component that styles a markdown syntax tree. Migrating this bucket would mean
rewriting SilverBullet's editor plugins to emit utility strings — a large,
upstream-diverging change with no design-system payoff.

**(d) Token/theme plumbing — `theme.scss` (466 lines, 289 custom-property
declarations), `_tokens.scss`, and the light/dark halves of `colors.scss`.**

`theme.scss` hand-rolls an entire parallel palette in hex —
`--link-color: #0330cb`, `--root-background-color: #fff`, `--top-background-color:
#e1e1e1`, `--meta-color: #650007`, `--ui-accent-color: #464cfc`
([`_tokens.scss:3`](../../client/styles/_tokens.scss)) — none of it derived from an
M3 role. Only **40 references to `--md-sys-*`** exist in the whole styles tree.

This is SilverBullet's *legacy* theming contract (themes and plugs read these
variable names), bridged onto M3E rather than replaced by it. It is the one bucket
where the sibling Tailwind bridge has a genuinely transformative story: its
seed → ref → sys → `@theme` cascade would let one `--md-seed-primary` retint the
app, instead of 289 hand-maintained hex values. It is also the highest-blast-radius
bucket, because third-party themes consume those names.

**(b) Genuine M3E component workarounds — small in line count, high in value.**

Every one of these is already root-caused in a comment with live measurements.
Representative cases, all from this session:

- **Kebab-menu label clipping** — [`top.scss:344-391`](../../client/styles/top.scss),
  commit `fa3d075a` *"kebab menu labels clipped because an upstream flex item can't
  shrink"*. An upstream `@m3e/web` bug: `m3e-menu-item`'s shadow `.wrapper` is
  `flex: 1 1 auto` with no `min-width: 0`, so the nowrap label's min-content
  contribution pins it 124px outside its own item and the component's own ellipsis
  never fires. The component exports no `part` and no width property, so the only
  reachable lever is the slotted label: `max-width: 0; min-width: 100%`. Plus
  `--m3e-menu-container-min/max-width` to restore shrink-to-fit. **Tailwind cannot
  fix this.** It is not a layout gap; it is a shadow-DOM bug with exactly one
  light-DOM workaround, and it is correctly documented as such.
- **Breadcrumb collapse** — [`top.scss:284-333`](../../client/styles/top.scss),
  commit `8a5c8241` *"collapse the breadcrumb with a grid track, not a magic
  max-height"*. `m3e-app-bar`'s documented `for` + `position: sticky` pattern
  assumes the bar lives inside the scroller; this app shell has `overflow: hidden`
  on html/body and the real scroller is `.cm-scroller`, so there is nothing to
  stick against. The fix is a `grid-template-rows: 1fr → 0fr` track with a bare
  padding-free clip element, adopted only after two other shapes were measured and
  rejected (both floored at 14px on the border-box padding rule). **Tailwind cannot
  fix this either** — the utility equivalent would be the same three declarations
  spread across three `className` strings with the 90-line rationale deleted.
- **Search-bar container colour** — commits `63897680`, `e16c7081`
  (*"search-bar container was a gray pill against the search sheet"*, then *"the
  gray box in the search sheet was the input, not the search bar"*). A
  `--m3e-*-container-color` override, i.e. the sanctioned channel.
- **`#sb-top` hard clip** — [`top.scss:6-16`](../../client/styles/top.scss):
  shadow-DOM-painted slivers escaping a zero-height ancestor.

**(a) Pure layout/spacing glue — the only bucket Tailwind would straightforwardly
own.** Examples: `.sb-floating-toolbar` (`position: fixed; right/bottom: 24px;
z-index: 30`, [`top.scss:162-167`](../../client/styles/top.scss)),
`.sb-nav-search-view` (`flex; column; gap: 8px; padding`), `.sb-hint`
(`padding; border-radius`), `.progress-wrapper` margins, `.sb-page-title`
(`flex; align-items: baseline; min-width: 0`). Real, but a minority of rules and a
small minority of *lines* — these rules are short; the bug-workaround rules are
long because of their comments.

**(e) Should not exist at all.** Notably, the repo is already doing this pruning
without Tailwind. [`top.scss:117-121`](../../client/styles/top.scss) is a comment
where a rule used to be: *"No `.sb-trailing` rule: the trailing actions are now
slotted directly into `m3e-app-bar`'s `trailing` slot… The old wrapper span's
hand-rolled equivalent was custom CSS duplicating the component."* Commit
`e9ceea61` (*"use the real slots for kebab-menu icons and app-bar trailing
actions"*) is the same move. Jack's instinct is correct as a *direction of travel*
and is already the working practice — it just doesn't need Tailwind to happen.

### A.3 Headline numbers

| Bucket | Share of lines | Tailwind-addressable? |
|---|---:|---|
| (c) CodeMirror / markdown editor surface | ~25% | **No** — classes emitted by TS decorations, invisible to the scanner |
| (d) Legacy SilverBullet token/theme plumbing | ~30% | **Partly** — the bridge's token cascade is a real upgrade, but it's a rewrite of the theming contract, not a migration |
| (b) Documented M3E component workarounds | ~20% (line-heavy because of rationale comments) | **No** — these are bugs, not layout gaps |
| (a) Pure layout/spacing glue | ~20% | **Yes** |
| (e) Removable via slots/attributes | ~5% and shrinking | Not Tailwind's job — just delete |

**So: roughly one line in five is the "convenience styling" Tailwind would
trivially replace.** The rest is either out of Tailwind's reach or is the
expensively-earned record of a real upstream bug.

### A.4 Tailwind's reach into this codebase is narrower than it looks

`grep -rn 'className=' client --include='*.tsx'` returns **30 sites**, and
`class="…"` + inline `style=` together add 27 more. Everything else the CSS targets
— `#sb-*` IDs, `.cm-*`, `.sb-line-*`, plug-panel iframe content (`components.css`),
the standalone login / setup-wizard / Space-Manager pages (`app.css`) — is either
generated or not JSX at all. A Tailwind migration would convert ~30 authored
elements and leave ~425 rule blocks untouched.

---

## Part B — the sibling tooling

### B.1 Where it actually lives

**Not** under `elm-cem-workspace/packages/` — that directory holds only `_probe`,
`elm-virtual-dom-intermediate-representation`, `tonal-palette-oklch`. Both projects
are **separate GitHub repos**, present on this machine only as detached-HEAD
snapshots:

- [`elm-cem-workspace/.cache/snapshots/elm-m3e-tailwind`](../../../elm-cem-workspace/.cache/snapshots/elm-m3e-tailwind)
  → `origin` = `https://github.com/jackhp95/tailwind-m3e-web.git`, HEAD `a3414c3`
  (2026-08-08).
- [`elm-cem-workspace/.cache/snapshots/elm-m3e-okf`](../../../elm-cem-workspace/.cache/snapshots/elm-m3e-okf)
  → `origin` = `https://github.com/jackhp95/m3e-okf.git`, HEAD `8275e26`.

Note for the record: these two are **not** covered by the
`elm-cem-workspace`-is-canonical rule in `~/Documents/code/CLAUDE.md`, because the
workspace does not vendor them as packages — they are independent repos with their
own release machinery. Worth correcting that CLAUDE.md line, which lists
`m3e-okf` and `tailwind-m3e-web` among the absorbed packages.

### B.2 `m3e-okf` — already in use here, nothing to do

Real, mature, and **already delivered into this machine's harness**. Package name
`m3e-docs` (private). It is a generator pipeline (`extract → guidance → examples →
skill → okf`, all CEM-verified against `@m3e/web`'s custom-elements manifest) whose
outputs are:

- `skills/m3e/` — **installed at `~/.claude/skills/m3e/`** (SKILL.md + 57
  component cards + 21 concept docs; installed 2026-08-19, concepts refreshed
  2026-09-04). Plus `applying-material-design`.
- `knowledge/` — an OKF v0.1 bundle, 86 markdown files (foundations, styles,
  expressive, patterns, anti-patterns, history).
- `implementations/m3e-web/` — 56 CEM-verified tag-level cards.

This repo is **already consuming it**: `modals.scss:317` cites *"per the m3e
skill's styling ladder"*. So item 1 of Jack's question is closed — the knowledge
layer exists, is installed, and is in active use. The only open item is whether the
`knowledge/` OKF tree should also be published to SilverBullet; that is a
`building-okfs` question, unrelated to CSS.

### B.3 `tailwind-m3e-web` — real, mature, and unpublished

`package.json` (`version 0.1.0`, `name: tailwind-m3e-web`, MIT, `type: module`):

- Exports `.` → `src/index.css`, `./utilities` → `generated/utilities.css`,
  `./roles-extended` → `src/roles-extended.css`.
- `peerDependencies: { "@m3e/web": "^2.5.0 <3" }` (optional).
- Real CI, changesets, a pre-publish gate, a **drift gate** (`bin/check-drift.mjs`
  regenerates into a scratch copy and byte-compares), and vitest tests.
- 12 commits of substantive maintenance including real bug fixes
  (`1b9db21` `:root → html` to fix an `<m3e-theme>` specificity collision;
  `6ea9fc3` on-\*-container roles resolving to tone 30 in light mode;
  `e4f9767` sign-flipped display-large tracking).

Architecture: a four-layer cascade (seed → oklch-derived ref palette → M3 sys roles
→ Tailwind v4 `@theme` keys), plus `generated/utilities.css` — **9,029 lines,
2,254 `@utility` rules**, one per public `--m3e-*` custom property, generated from
`node_modules/@m3e/web/dist/custom-elements.json`. Tailwind v4 emits only what you
use, so bundle cost is near zero.

**Verdict: this is not a stub. It is the most mature piece of tooling in this
whole question.**

### B.4 How it would get here

**Not via npm** — `npm view tailwind-m3e-web` returns 404; the repo is private and
unpublished. The established house pattern is **vendoring the CSS only**, and there
are two precedents on disk that both did exactly that:

- [`compass-social/web/vendor-web/tailwind-m3e-web/`](../../../compass-social/web/vendor-web/tailwind-m3e-web)
- [`buildoc/frontend/vendor-css-tailwind-m3e-web/`](../../../buildoc/frontend/vendor-css-tailwind-m3e-web)

Both contain only `src/` + `generated/` + a `VENDORED_FROM.txt` reading
*"jackhp95/tailwind-m3e-web (PRIVATE repo, not on npm) — vendored CSS only.
version 0.1.0"*. `silverbullet-m3e` is a different repo with no workspace linkage to
`elm-cem-workspace`, so vendoring is the only option short of publishing the
package (to npm or a private registry) first.

### B.5 Version compatibility — there IS drift

| | `@m3e/web` |
|---|---|
| `tailwind-m3e-web` peer range | `^2.5.0 <3` ✅ |
| `tailwind-m3e-web` lockfile / generation input | **2.5.14** |
| `silverbullet-m3e` pin (`package.json:114`) | `^2.7.12`, installed **2.7.12** |

The peer range is satisfied, so the *token* layer (`src/**`) drops in unchanged.
But `generated/utilities.css` was generated against **2.5.14** — any custom property
added or renamed across 2.5.14 → 2.7.12 is missing from the utility surface, and
the bridge's own drift gate would flag it.

Good news: this is cheap to fix and can be done **here**. `@m3e/web@2.7.12` ships
`node_modules/@m3e/web/dist/custom-elements.json` (verified present), which is
exactly the input `bin/generate-component-utilities.mjs` reads. Regenerating
against 2.7.12 is a mechanical step — ideally done upstream in
`tailwind-m3e-web` and then re-vendored, so the drift gate stays meaningful.

### B.6 Build-pipeline constraint (the real integration cost)

This repo has **no PostCSS and no Vite**. CSS is built by a bespoke call to
`sass.compileString()` at
[`build/build_client.ts:139-150`](../../build/build_client.ts), over three SCSS
entry points, with `loadPaths: ["client/styles"]` and `style: "compressed"`.

Tailwind v4's `@import "tailwindcss"`, `@theme` and `@utility` are **not** Sass
syntax; Sass will mangle or drop them. So adopting Tailwind means adding a second
CSS toolchain (`@tailwindcss/cli` or the PostCSS plugin) to `build_client.ts`,
ordered after or alongside Sass, and configuring `@source` scanning to cover
`client/**/*.tsx`. Three separate entry points (editor / standalone / plug-panel
iframe) each need their own decision about whether Tailwind output is included —
the plug-panel iframe sheet especially, since utility classes used inside a plug's
HTML would not be scanned from this repo's sources at all.

Also worth flagging: `tailwind-m3e-web` requires `light-dark()` and relative-colour
`oklch(from …)` — Chrome 123+ / Safari 17.5+ / Firefox 128+. That needs checking
against this fork's stated browser support (it is a PWA with a service worker and
an Electron-ish `-webkit-app-region` path).

---

## Part C — options, honestly assessed

### C.1 Does Jack's instinct hold up?

**Partly, and less than it feels like from the inside of a patching session.**

Where it holds:

- The *direction* is right and is already the working practice — slots and
  `--m3e-*` properties first, custom CSS last. `e9ceea61` and the deleted
  `.sb-trailing` rule are that discipline in action.
- `theme.scss`'s 289 hand-rolled hex values genuinely are a smell, and they are the
  single best argument for the bridge.
- The ~20% "pure layout glue" bucket really is convenience styling.

Where it does not hold:

- **The volume of `.sb-*` classes is misleading.** 334 selectors sounds like a mess;
  ~25% of them are CodeMirror decoration hooks that predate this fork entirely and
  have nothing to do with M3E.
- **The rules being written this session are mostly not convenience styling.** They
  are the residue of three real upstream `@m3e/web` bugs plus one architectural
  mismatch (app-shell scroller vs. `m3e-app-bar`'s sticky assumption). Tailwind has
  no opinion about any of them. Converting them to utilities would *lose*
  information — the 90-line measured rationale on the breadcrumb grid and the
  60-line root-cause on the menu-item `min-width: 0` bug are the most valuable
  artifacts in `top.scss`, and there is nowhere to put them in a `className`
  string.
- **The CSS is disciplined, not hacky.** Zero `::part()`, 18 `!important` (mostly
  forced by CodeMirror), 64 overrides through documented custom properties. This is
  what correct M3E consumption looks like, not what a workaround pile looks like.
- **Tailwind's reach here is ~30 JSX sites.** It cannot touch generated DOM, plug
  iframes, or CodeMirror decorations — i.e. most of the surface.

A more accurate restatement of the smell: *the problem is not that custom CSS
exists, it is that `theme.scss` maintains a parallel colour system that M3E already
derives.* That is one file, and it is the one the bridge actually solves.

### C.2 If the bridge is adopted — phases (NOT a build order)

Listed as independently-decidable phases, deliberately without sequencing or
estimates, per the two-session rule.

- **Phase T — toolchain.** Add Tailwind v4 to `build/build_client.ts` alongside
  Sass; decide per-entry-point (`main.css` / `app.css` / `components.css`) whether
  utilities are emitted; configure `@source` over `client/**/*.tsx`. This is the
  prerequisite and the bulk of the risk.
- **Phase V — vendor + regenerate.** Copy `src/` + `generated/` from
  `tailwind-m3e-web` following the compass-social / buildoc `VENDORED_FROM.txt`
  precedent, and regenerate `generated/utilities.css` against `@m3e/web@2.7.12`
  (preferably upstream first, then re-vendor).
- **Phase D — token cascade.** Point `theme.scss`'s SilverBullet-legacy variables at
  the bridge's `--md-sys-*` roles instead of hex literals, keeping the legacy names
  as the public contract so third-party themes and plugs keep working. Highest
  payoff, highest blast radius — this is the real prize and deserves its own spec.
- **Phase L — layout glue.** Migrate bucket (a) to utilities at the ~30 JSX sites.
  Lowest risk, lowest payoff.
- **Phase X — explicitly out of scope.** `editor.scss` (bucket c) and the
  documented component workarounds (bucket b). Bucket (b) rules should **stay as
  commented CSS overrides regardless of the Tailwind decision**, and should each
  carry an upstream `@m3e/web` issue link so they can be deleted when fixed
  upstream rather than migrated.

### C.3 Open questions / risks

1. **Specificity.** The bridge already hit and fixed one real collision
   (`1b9db21`: `:root` vs. `<m3e-theme>`). This repo wraps its tree in
   `<m3e-theme>` (`client/editor_ui.tsx`), so that fix is load-bearing here — it
   must be verified, not assumed, against 2.7.12.
2. **Two colour systems, temporarily three.** During Phase D, `theme.scss` hex,
   `<m3e-theme>`'s runtime tokens and the bridge's seed/ref cascade all coexist.
   What is the arbiter?
3. **Legacy theme contract.** Third-party SilverBullet themes and plugs read
   `--root-background-color`, `--top-color`, `--ui-accent-color`, etc. Are those
   names a public API of this fork?
4. **Browser floor.** `light-dark()` + relative-colour `oklch()` — Chrome 123 /
   Safari 17.5 / Firefox 128. Acceptable for a PWA target?
5. **Plug-panel iframes.** `components.css` is consumed by plug HTML authored
   outside this repo. Utilities used there would never be scanned. Safelist, or
   keep that sheet Tailwind-free?
6. **Publishing.** Vendoring means every future bridge fix (like `1b9db21`) has to
   be manually re-pulled into four consumers. Is publishing
   `tailwind-m3e-web` — npm or a private registry — the better move before a fourth
   vendored copy is created?
7. **Regression safety.** 50 e2e specs exist (`e2e/`), including
   `breadcrumb-scroll-collapse`, `app-bar-scroll-elevation`, `theme-accent-color`
   and `visual-verification`, with 14 computed-style/visual assertions. Phase D in
   particular needs that net extended before, not after.
8. **CLAUDE.md correction.** `~/Documents/code/CLAUDE.md` lists `m3e-okf` and
   `tailwind-m3e-web` as absorbed `elm-cem-workspace` packages; they are not in
   `packages/`, they are independent repos. Worth fixing so a future agent does not
   go looking in the wrong place.

### C.4 Bottom line

Adopt the **token cascade** (Phase D), treat **layout utilities** (Phase L) as a
nice-to-have, and **do not** migrate the editor surface or the documented component
workarounds. The premise that "any custom CSS file indicates something to
deprecate" does not survive contact with this particular codebase: the majority of
its CSS is either CodeMirror's territory or the written record of three real
`@m3e/web` bugs, and Tailwind is the wrong tool for both.

The one file that unambiguously deserves to be deprecated is `theme.scss` — and
`tailwind-m3e-web` is a genuinely good, genuinely maintained answer for it.

---

## Part D — Phase 1 (infrastructure) as built

**Status: DONE**, on branch `tailwind-v4-infra` (3 commits, unmerged, awaiting
review). Everything below is what actually shipped, which differs from Part C's
sketch in a few places — those differences are called out.

### D.1 What landed

| Commit | What |
|---|---|
| `bc0e24af` | Vendored `tailwind-m3e-web` → [`client/styles/vendor/tailwind-m3e-web/`](../../client/styles/vendor/tailwind-m3e-web) |
| `6ac29e70` | Tailwind v4 in the build → [`client/styles/tailwind.css`](../../client/styles/tailwind.css), [`build/build_client.ts`](../../build/build_client.ts) |
| `3dfb07c6` | The one proof-of-pipeline conversion + [`e2e/tailwind-visual-ab.mjs`](../../e2e/tailwind-visual-ab.mjs) |

### D.2 Decisions, and why

**CLI, not PostCSS.** §B.6 left this open. Resolved in favour of
`@tailwindcss/cli`, spawned as a subprocess from `build_client.ts`. The PostCSS
route would mean adding PostCSS itself plus a processor pipeline purely as a
host for one plugin, with no other consumer in the repo. The CLI takes a CSS
file and emits a CSS file — structurally identical to the Sass step it sits
beside — and subprocess-spawning is already the norm here (`build/version.ts`
spawns `git`). Cost is ~200ms on a build that already runs esbuild over the
whole client.

**Preflight is NOT imported.** Tailwind v4's `@import "tailwindcss"` pulls in
theme + base + utilities, where *base* is a greenfield reset that zeroes
margins on bare elements, forces `font-family` onto `html`, and rewrites
`border-style`. Against `editor.scss`'s CodeMirror typography and `theme.scss`'s
legacy contract that is a guaranteed wide regression for no benefit. Only the
theme and utilities layers are imported, via v4's layer-by-layer entry form.
Verified empirically: the emitted sheet contains no reset rules — the only
`*, ::before, ::after` block is Tailwind's `@property` fallback polyfill, which
sets `--tw-*` custom properties and nothing else.

**Only Layer 3 of the bridge is imported.** §C.3 asked "two colour systems,
temporarily three — what is the arbiter?" Phase 1 sidesteps the question
entirely rather than answering it: the vendored tree ships all four layers, but
`tailwind.css` imports only `src/theme.css` (Layer 3). This app already
generates `--md-sys-*` at runtime — `<m3e-theme>` writes them to `html` via
`adoptedStyleSheets` — so Layer 3 is the only piece needed to turn those
existing tokens into Tailwind utilities. Importing Layers 0–2 would introduce a
second, *static* source of truth for the same tokens. That is Phase D, and it
cannot land without visual review.

**Cascade safety (new, not in Part C).** Everything Tailwind emits sits inside
`@layer theme/utilities`; every rule in the SCSS bundles is unlayered; and
unlayered rules always beat layered ones. So Tailwind physically cannot outrank
an existing rule — which is what makes this droppable into a 3,800-line
stylesheet safely. **The corollary matters for Phase 2: a conversion is only
finished when the SCSS rule is deleted.** Leaving both in place silently keeps
the old rule winning, and the diff will look like it worked.

**Version drift: closed, not deferred.** §B.5 flagged it; it was real and is
fixed. Upstream generated its utility surface against `@m3e/web` 2.5.14; this
repo pins 2.7.12. Regenerating with upstream's own
`bin/generate-component-utilities.mjs` against this repo's installed manifest
gives **2,362 `@utility` rules, up from 2,254** (+108 rules, 124 changed lines).
`src/` is an unmodified upstream copy. Re-sync procedure is in
[`VENDORED_FROM.txt`](../../client/styles/vendor/tailwind-m3e-web/VENDORED_FROM.txt).

**Which bundles get Tailwind.** `main.css` (editor) and `app.css` (standalone
pages) — **not** `components.css`. That answers §C.3 q5: plug-panel iframe HTML
is authored outside this repo, so utilities used there could never be scanned
and would silently not emit. Keep that sheet Tailwind-free until there is a
safelist strategy.

### D.3 Evidence

`tsc --noEmit` exit 0. Vitest: 109 files, 1,228 passed / 5 skipped, exit 0.
Playwright: 161 passed, 1 skipped.

Visual: 16 surfaces (editor, top app bar, kebab menu, search sheet, search mode
picker, navigation sheet, breadcrumb collapse, prompt dialog, confirm dialog)
× light and dark, **all pixel-identical** (one surface differs by 0.04 of a
pixel — sub-pixel antialiasing).

The method matters and is reusable. Both bundles were served by the **same
server process**: a debug build has no `debug-embed`, so `rust-embed` reads
`client_bundle/` from disk per request, and the bundle can be swapped under a
running server. Diffing two *different* servers produces false positives —
observed both: differing version strings raise the "new client available"
snackbar, and independently-built space indexes rank search results
differently. `e2e/tailwind-visual-ab.mjs` documents the procedure in its header.

### D.4 The proof-of-concept, as the pattern to copy

`.sb-dialog-actions` (`display: flex; justify-content: flex-end; gap: 8px`) →
`class="flex justify-end gap-2"` at three call sites, with **both** SCSS rules
deleted — it was duplicated across `modals.scss` and `_standalone.scss` because
`app.scss` never `@use`s `modals.scss`. One scan feeds both bundles, so the
duplication is now structurally impossible rather than merely discouraged.

Measured identical before/after in all four dialog cases: `display:flex`,
`justify-content:flex-end`, `gap:8px`, same bounding box (prompt: x=524 w=232
h=40), same child button positions (x=603 w=86, x=697 w=59). Only the `class`
attribute differs.

**Three conventions Phase 2 must follow:**

1. **Delete the SCSS rule.** Not optional — see cascade safety above.
2. **Keep the reasoning as a comment in place.** The deleted rules' *why*
   (m3e-dialog's `::slotted()` gaps only direct children and cannot reach a
   nested row) has nowhere to live in a `className` string. Both deletion sites
   keep a comment; this repo already does this (`top.scss:117-121`).
3. **Verify the unit, don't assume it.** `gap-2` is `0.5rem` against a 16px
   root = 8px — confirmed live, not inferred.

### D.5 Ready for Phase 2 — concrete scope

A mechanical scan for rule blocks that are *strictly* pure-layout (no nesting,
no custom properties, no at-rules, no CodeMirror/`html`/`body` selectors) finds
**25 blocks across 6 files**. This is deliberately narrower than §A.3's "~20% of
lines" — it is the subset safe to hand to a cheap model with no judgement calls.

| File | Blocks | Line ranges |
|---|---:|---|
| `_standalone.scss` | 13 | 184-188, 190-194, 196-198, 200-202, 208-213, 226-230, 233-235, 253-257, 300-302, 366-369, 373-377, 412-416, 437-442 |
| `main.scss` | 4 | 165-167, 200-204, 206-209, 296-298 |
| `top.scss` | 3 | 162-167, **322-325, 327-332 — EXCLUDE** |
| `components.scss` | 2 | 96-98, 108-112 |
| `xray.scss` | 2 | 32-34, 36-38 |
| `modals.scss` | 1 | 334-336 |

**Two hard exclusions the scanner cannot see:**

- **`top.scss:322-332`** (`.sb-breadcrumb-row-clip`, `.sb-breadcrumb-row`) look
  like pure layout but are the breadcrumb-collapse workaround from §A.2 bucket
  (b) — the `1fr → 0fr` grid track and its padding-free clip element, adopted
  only after two other shapes were measured and rejected. **Do not convert.**
- **`modals.scss:334-336`** (`.sb-prompt-field { width: 100% }`) is mechanically
  `w-full`, but exists because `m3e-form-field`'s host is `inline-flex`. Convert
  if you like, but the comment must survive.

**Call sites must exist in scanned source.** `@source` covers
`client/**/*.{ts,tsx,html}`, so `class="…"`, `className="…"` and plain string
literals in `.ts` are all picked up. Verified per candidate:

- *Has an authored call site* — `.center`, `.flow`, `.checkbox-wrapper`,
  `.password-field`, `.sb-spaces-header-left`, `.sb-space-edit`,
  `.sb-folder-crumbs`, `.sb-folder-dirs`, `.sb-token-reveal`, `.sb-tabs`,
  `.sb-prompt-field` (all `.tsx`); `.sb-panel-drawer*` (`className=`);
  `.sb-floating-toolbar` (string literal in `.ts`).
- **No authored call site at all** — `.sb-preview`, `.sb-xray-card`,
  `.sb-select`. These reach the DOM from generated or plug-side HTML. Converting
  them would emit **nothing** and silently drop the styling. **Leave them.**

This is the trap that makes Phase 2 unsafe to do blind: the failure mode is
silent. Every conversion needs the `tailwind-visual-ab.mjs` before/after check,
not just a passing build.

**Still out of scope, unchanged from §C.2 Phase X:** `editor.scss` in its
entirety, and the documented `@m3e/web` workarounds.

### D.6 Known gaps

1. **Colour/typescale utilities are editor-only.** `<m3e-theme>` wraps the
   editor, not the standalone pages, so `--md-sys-*` — and therefore
   `bg-primary`, `text-body-lg`, etc. — resolve in `main.css` but not in
   `app.css`. Layout utilities derive from nothing and work in both. Phase D
   (importing the seed cascade) is what would close this.
2. **~38 phantom utilities.** Tailwind's scanner matches bare words in prose and
   identifiers (`collapse`, `container`, `hidden`, `sticky`…), emitting ~38
   single-word rules nobody asked for. Checked against real class names: no
   collisions, and all are layered so they lose to any SCSS rule. Cost is ~6 KB
   on `main.css`. Cosmetic, not a bug.
3. **Standalone pages not visually A/B'd.** The `ConfirmDialog.tsx` call site
   lives in the Space Manager, which the screenshot harness does not reach. It
   is covered functionally by the multi-space e2e specs, and `app.css` was
   confirmed to carry identical `.flex`/`.justify-end`/`.gap-2` declarations.
4. **Vendoring fan-out.** This is the fourth vendored copy of an unpublished
   package, and the `generated/` half is version-coupled to each consumer's own
   `@m3e/web`. Logged as a friction; §C.3 q6 stands — publishing is the real
   fix.
5. **Browser floor unverified.** §B.6/§C.3 q4's `light-dark()` +
   relative-colour `oklch()` floor (Chrome 123 / Safari 17.5 / Firefox 128)
   only binds once Layers 0–2 are imported, which Phase 1 does not do. It
   becomes a live question at Phase D.
