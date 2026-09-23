import type { ComponentChildren } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import { relativeTime } from "../lib/relative_time.ts";
import { countWords, readingTimeMinutes } from "../lib/reading_time.ts";
import "@m3e/web/app-bar";
import "@m3e/web/breadcrumb";
import "@m3e/web/progress-indicator";
import "@m3e/web/icon-button";
import "@m3e/web/icon";
import "@m3e/web/menu";
// V11: offline indicator, moved from an anchored `m3e-badge` dot (no
// longer used in this file) to a persistent, labeled trailing chip — see
// the trailing-slot comment below. Snackbar fires a one-shot toast on the
// online<->offline transition (`M3eSnackbar.open`, a `globalThis` static
// method this side-effect import registers — see Snackbar.d.ts's
// `declare global`), imperative-only, no JSX involved.
import "@m3e/web/chips";
import "@m3e/web/snackbar";
import "./m3e-jsx.d.ts";

// One segment of the folder-path trail rendered above the app bar (see
// BreadcrumbItem below). `current` marks the final segment — the page
// itself — as the trail's "you are here" endpoint (BreadcrumbItemCurrent
// per BreadcrumbItemElement.d.ts); `onClick` is omitted for it, since
// there's nowhere useful to navigate from the page you're already on.
// Computed in client/editor_ui.tsx from `client.currentPath()` — see that
// file's own comment for why intermediate "folder" segments open the page
// picker rather than a folder-index page (SB has no folder-index concept).
export type BreadcrumbItem = {
  key: string;
  label: string;
  current: boolean;
  onClick?: () => void;
};

// One entry in the app-bar's trailing kebab menu (sb-app-bar-menu). This
// leaf (L6/L7 of docs/plans/2026-09-16-toolbar-search-feedback-spec.md)
// only builds the menu shell + trigger + positioning — `menuItems` defaults
// to `[]` below (editor_ui.tsx isn't touched by this leaf at all, since it's
// owned by the follow-up leaf L8, sequenced after this one to avoid a merge
// conflict on that file). L8 populates it with real items (Web Push toggle,
// CONFIG link, etc.) without needing to restructure anything here. `icon` is a
// Material Symbols ligature name (string), not a component, because the icon is
// rendered as an `<m3e-icon slot="icon">` child — m3e-menu-item's own
// documented leading-icon slot (see the render below).
export type AppBarMenuItem = {
  key: string;
  icon?: string;
  /**
   * The visible label. Keep it short — a kebab item has ~228px (roughly 30
   * characters at the label-large type scale) before it ellipsizes. Longer
   * text degrades gracefully rather than clipping (see `.sb-app-bar-menu-
   * label` in client/styles/top.scss), but an ellipsized label is still a
   * label the user can't read.
   */
  label: string;
  /**
   * The full sentence behind a deliberately terse `label`, surfaced as the
   * item's hover tooltip. Omit when the label already says everything.
   */
  detail?: string;
  onClick: () => void;
  disabled?: boolean;
};

function pageNameClass(
  isLoading: boolean,
  unsavedChanges: boolean,
  cssClass?: string,
): string {
  const state = isLoading
    ? "sb-loading"
    : unsavedChanges
      ? "sb-unsaved"
      : "sb-saved";
  return cssClass ? `${state} sb-decorated-object ${cssClass}` : state;
}

function SyncProgressIndicator({
  percentage,
  type,
  slot,
}: {
  percentage?: number;
  type?: string;
  /** Forwarded onto the root element so the caller can slot it directly. */
  slot?: string;
}) {
  if (percentage === undefined) return null;
  // `filesProcessed / totalFiles` (plugs/sync/sync.ts) is NaN when totalFiles
  // is 0 — the one case where the caller still passes a defined-but-useless
  // percentage through. Rather than hand it to `value` (which would silently
  // clamp/NaN in the ring math), fall back to the component's own
  // `indeterminate` mode: "something is happening" without a bogus number.
  const indeterminate = Number.isNaN(percentage);
  return (
    <div className="sb-sync-progress" slot={slot}>
      <div
        className={`progress-wrapper progress-${type}`}
        title={indeterminate
          ? `${type} in progress`
          : `${type} progress: ${percentage}%`}
      >
        <m3e-circular-progress-indicator
          indeterminate={indeterminate}
          value={indeterminate ? undefined : percentage}
        >
          {indeterminate ? null : percentage}
        </m3e-circular-progress-indicator>
      </div>
    </div>
  );
}

function PageNameEditor({
  pageName,
  readOnly,
  onRename,
}: {
  pageName?: string;
  readOnly: boolean;
  onRename: (newName?: string) => Promise<void>;
}) {
  const [name, setName] = useState(pageName ?? "");
  const committing = useRef(false);
  useEffect(() => setName(pageName ?? ""), [pageName]);

  // 2026-09-22 (app-bar title wrap task): a real `<input>` can NEVER wrap
  // its text onto multiple lines — that's a browser-level rendering
  // constraint on form controls (MDN: an `<input>`'s value "is always
  // displayed on a single line"), not something CSS `white-space`/
  // `text-wrap` can override. A Notion-style display/edit dual-mode (plain
  // wrapping `<span>` shown until clicked, swapping to this same `<input>`
  // only while editing) was tried and reverted here — it breaks ~15 existing
  // e2e specs across page-rename.test.ts, page-picker.test.ts,
  // navigate-restore.test.ts, wiki-links.test.ts, app-bar-leading-
  // trailing.test.ts, and others, all of which assert
  // `#sb-current-page input.sb-input` is present and directly clickable at
  // all times (`nameInput.click()` immediately followed by typing, with no
  // "enter edit mode" step) — a real, load-bearing test contract, not
  // incidental coverage. Flagged to Jack rather than landing that
  // rearchitecture unasked. Kept as a single always-live `<input>`; the fix
  // here is containment (ellipsis, no visual overflow past the bar) plus
  // the responsive size-shrink below, which is what an editable native
  // form control can actually do.
  const commit = (newName: string) => {
    if (committing.current) {
      return;
    }
    if (newName !== pageName) {
      committing.current = true;
      Promise.resolve(onRename(newName))
        .catch(() => setName(pageName ?? ""))
        .finally(() => {
          committing.current = false;
        });
    } else {
      void onRename();
    }
  };

  return (
    <Input
      // Inline page-title text, not a boxed Material field — see the
      // `bare` prop's doc comment on plug-api/ui/input.tsx.
      bare
      class="sb-page-name-editor"
      value={name}
      readOnly={readOnly}
      onInput={(e) => setName(e.currentTarget.value)}
      onConfirm={(value) => commit(value)}
      onBlur={(e) => commit(e.currentTarget.value)}
    />
  );
}

export function TopBar({
  pageName,
  unsavedChanges,
  isOnline,
  isLoading,
  onRename,
  progressPercentage,
  progressType,
  lhs,
  rhs,
  pageNamePrefix,
  cssClass,
  mobileMenuStyle,
  readOnly,
  breadcrumbItems,
  lastModified,
  bodyText,
  menuItems = [],
  readOnlyToggle,
}: {
  pageName?: string;
  unsavedChanges: boolean;
  isOnline: boolean;
  isLoading: boolean;
  progressPercentage?: number;
  progressType?: string;
  onRename: (newName?: string) => Promise<void>;
  lhs?: ComponentChildren;
  rhs?: ComponentChildren;
  pageNamePrefix?: string;
  cssClass?: string;
  mobileMenuStyle?: string;
  readOnly: boolean;
  /** Folder-path trail rendered as the app bar's own leading breadcrumb —
   * see BreadcrumbItem. `breadcrumbItems[0]` is rendered as the icon-only
   * asterisk/home item; the rest render as ordinary label items. */
  breadcrumbItems: BreadcrumbItem[];
  /** `PageMeta.lastModified` (ISO-8601), used to compute the "Edited Xh
   * ago" subtitle segment. Kept raw (not pre-formatted by the caller) so
   * `relativeTime`'s `now` stays live across re-renders. Undefined before
   * the page's meta has loaded. */
  lastModified?: string;
  /** The page's body text (frontmatter range excluded), used to compute
   * the "N min read" subtitle segment via `reading_time.ts`. */
  bodyText: string;
  /** Trailing kebab-menu items (sb-app-bar-menu) — see AppBarMenuItem. */
  menuItems?: AppBarMenuItem[];
  /** Read-only mode toggle, rendered in the trailing slot before the kebab
   * trigger. Undefined hides it entirely (e.g. command unavailable). */
  readOnlyToggle?: { active: boolean; label: string; onClick: () => void };
}) {
  // No more overflow/kebab trigger here — every actionButton, plus quick
  // capture and journal entry, now live in the single floating vertical
  // toolbar (client/components/floating_toolbar.tsx, rendered as a sibling
  // of <TopBar> in editor_ui.tsx). The app bar itself is left with exactly
  // what only it can do: the editable page title and sync/notification
  // status — it isn't "orphaned," its remaining job is just narrower.
  //
  // 2026-09-22 V5b (docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md
  // §1.5/L8): the app bar is `size="large"` and non-sticky — it scrolls with
  // the page as part of `#sb-page-scroll` (client/editor_ui.tsx), resting
  // above the CodeMirror editor host and below the front-matter property
  // list. The breadcrumb that used to sit in its own row above the app bar
  // is now the bar's own `slot="leading"` content — `size="large"`'s
  // compiled template (verified directly against the installed
  // `@m3e/web@2.7.12` `dist/app-bar.js`, not assumed from the older
  // `m3e` skill card) puts leading/trailing slot content in a `.heading`
  // row above a separate `.label` row holding title/subtitle, so the
  // breadcrumb and the sync/lock/offline/kebab cluster share the top row
  // for free — no custom placement CSS needed here.
  //
  // The leading asterisk breadcrumb item below runs the exact same
  // navigation as the root breadcrumb segment ("Space", breadcrumbItems[0]
  // — always constructed first in editor_ui.tsx's breadcrumbItems array)
  // rather than a second, separately-wired copy of "Navigate: Home" — one
  // command binding, rendered as that segment's own icon-only item.
  // Disabled under the same condition the segment itself uses (command
  // unavailable -> no onClick).
  const homeOnClick = breadcrumbItems[0]?.onClick;
  const restBreadcrumbItems = breadcrumbItems.slice(1);

  // V11: one-shot toast on the online<->offline *transition* — the chip
  // above is the sustained-state indicator; this is just the moment-of-
  // change nudge, so it must not fire on initial mount (a freshly loaded
  // page that happens to start offline isn't a "transition"). `isMounted`
  // guards exactly that first run, same skip-on-mount pattern as
  // PageNameEditor's `committing` ref above. Not covered by
  // top_bar.test.ts's preact-render-to-string tests — effects don't run
  // under SSR-style rendering (no DOM `M3eSnackbar.open` could act on), same
  // documented gap as this file's e2e note.
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    M3eSnackbar.open(isOnline ? "Back online" : "You're offline");
  }, [isOnline]);

  // 2026-09-22 (app-bar title wrap task): drop from `size="large"` to
  // `size="medium"` (both real values — AppBarSize.d.ts: "small" | "medium"
  // | "large") whenever the title, at the large-size title font
  // (Display Small), would be wider than the space actually available —
  // the case that used to visibly overflow the bar. `size` is a plain
  // reflected JS/attribute property on `m3e-app-bar` (AppBarElement.d.ts),
  // not a CSS-stylable token, so a container query alone can't flip it — a
  // CSS container query can't set an attribute on any element, full stop,
  // regardless of component. A hidden same-font mirror span
  // (`titleMirrorRef`, rendered inside the real title slot so it inherits
  // the exact same `--m3e-app-bar-*-title-text-font-*` cascade) reports the
  // title's true natural (unwrapped) width via `scrollWidth`; `titleRef`'s
  // `clientWidth` reports the width actually available. The visible
  // `<input>` itself can't be measured this way while focused/mid-edit (its
  // own scrollWidth reflects the caret's scroll position, not the full
  // value), which is exactly why this uses a separate mirror instead.
  //
  // 2026-09-22 (jitter fix — live report): the original version of this
  // wrapped the same measurement in a persistent `ResizeObserver` watching
  // `titleRef`. That was a real feedback loop, not a one-off flake: the
  // mirror's font cascades from `m3e-app-bar`'s OWN `size` attribute
  // (--m3e-app-bar-large/medium-title-text-font-*), i.e. from `barSize`
  // itself — so the very act of setting `barSize` to "medium" shrinks the
  // mirror's own `scrollWidth`, which can make it fit again, flipping back
  // to "large", which grows the font back out, overflowing again... forever.
  // `titleRef`'s own box can also shift size when the bar's `size` changes
  // (different icon/slot metrics per size), which re-fires the observer on
  // every single one of those self-inflicted layout changes. Two different
  // feedback paths into the same setState — textbook infinite-loop plumbing.
  //
  // Fixed contract, matching what Jack asked for exactly: this measures
  // ONCE per title change (still keyed on [pageName, pageNamePrefix] below —
  // "pageload or input change", never on the bar's own resulting layout
  // shift), via `useLayoutEffect` so the DOM mutation + re-render happen
  // before the browser paints (no visible frame at the wrong size), and
  // there is no persistent observer left running afterward to re-trigger
  // itself — so there is nothing left that CAN oscillate. A later real
  // window resize (not caused by this effect) is deliberately NOT re-
  // measured until the next title change; if Jack wants viewport-resize
  // responsiveness back, that needs a debounced, mirror-pinned-to-large-
  // font remeasure, not this loop, and should be its own follow-up.
  const titleRef = useRef<HTMLElement>(null);
  const titleMirrorRef = useRef<HTMLSpanElement>(null);
  const [barSize, setBarSize] = useState<"large" | "medium">("large");
  useLayoutEffect(() => {
    const el = titleRef.current;
    const mirror = titleMirrorRef.current;
    if (!el || !mirror) {
      return;
    }
    const available = el.clientWidth;
    const needed = mirror.scrollWidth;
    const overflows = available > 0 && needed > available;
    setBarSize(overflows ? "medium" : "large");
  }, [pageName, pageNamePrefix]);

  return (
    <div
      id="sb-top"
      className={isOnline ? undefined : "sb-sync-error"}
      data-mobile-menu-style={mobileMenuStyle}
    >
      {lhs}
      <div className="main">
        <m3e-app-bar size={barSize}>
          {/* "asterisk" verified as a real glyph in the bundled font
              subset — client/fonts/MaterialSymbolsOutlined.woff2 decompiled
              (fontTools) and its glyph order literally contains "asterisk"
              (alongside "inbox_text_asterisk"/"mail_asterisk", which aren't
              it), the same way "close"/"history"/"add" etc. already used
              elsewhere in this file/floating_toolbar.tsx resolve — so no
              `emergency` fallback is needed here. The breadcrumb's first
              item renders this icon in its own `slot="icon"`
              (BreadcrumbItemElement.d.ts) rather than as a standalone
              icon-button — see the file-level comment above. */}
          <m3e-breadcrumb slot="leading" aria-label="Breadcrumb">
            <m3e-breadcrumb-item
              item-label="Home"
              disabled={!homeOnClick}
              onClick={homeOnClick
                ? (e: MouseEvent) => {
                  e.preventDefault();
                  homeOnClick();
                }
                : undefined}
            >
              <m3e-icon slot="icon" name="asterisk"></m3e-icon>
            </m3e-breadcrumb-item>
            {restBreadcrumbItems.map((item) => (
              <m3e-breadcrumb-item
                key={item.key}
                current={item.current ? "page" : null}
                disabled={!item.onClick}
                onClick={item.onClick
                  ? (e: MouseEvent) => {
                    e.preventDefault();
                    item.onClick!();
                  }
                  : undefined}
              >
                {item.label}
              </m3e-breadcrumb-item>
            ))}
          </m3e-breadcrumb>
          <span slot="title" className="sb-page-title" ref={titleRef}>
            <span className="sb-page-prefix flex items-baseline flex-none text-left pt-[3px] whitespace-pre-wrap">
              {pageNamePrefix}
            </span>
            <span
              id="sb-current-page"
              className={pageNameClass(isLoading, unsavedChanges, cssClass)}
            >
              <PageNameEditor
                pageName={pageName}
                readOnly={readOnly}
                onRename={onRename}
              />
            </span>
            {/* Invisible, same-font natural-width probe for the responsive
                size-shrink effect above — never shown, `aria-hidden` so it's
                not read out twice alongside the real title. */}
            <span className="sb-page-title-mirror" aria-hidden="true" ref={titleMirrorRef}>
              {pageNamePrefix}{pageName}
            </span>
          </span>
          <span slot="subtitle">
            Edited {relativeTime(lastModified ?? "")} ·{" "}
            {readingTimeMinutes(countWords(bodyText))} min read
          </span>
          {/* Each trailing item carries `slot="trailing"` ITSELF, as a direct
              child of the app bar — the documented pattern (the app-bar card's
              own examples slot several sibling buttons into `trailing`, and
              client/codemirror/lua_widget.ts already builds its card header
              this way). This replaced a single `<span slot="trailing"
              className="sb-trailing">` wrapper whose `display:flex;
              align-items:center; flex:none` CSS merely re-implemented what the
              app bar's own internal `.trailing-icon` container already applies
              to the slot (verified in node_modules/@m3e/web/dist/app-bar.js) —
              custom CSS duplicating a component's own layout, which the
              styling ladder puts last. It also let the app bar see the real
              buttons rather than one opaque span, so its
              `with-trailing-icon` slotchange toggle now reflects whether any
              action is actually present instead of being permanently on. */}
          <SyncProgressIndicator
            slot="trailing"
            percentage={progressPercentage}
            type={progressType}
          />
            {/* V5 (docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md
                §2.2): read-only toggle, added directly to the trailing slot —
                it previously had no UI home at all (a real regression, not a
                preservation, per §1.3). `editor_ui.tsx` (V8, later/separate
                leaf) constructs this object from live command-availability
                state; undefined here just hides the button. */}
            {readOnlyToggle && (
              <m3e-icon-button
                slot="trailing"
                title={readOnlyToggle.label}
                aria-label={readOnlyToggle.label}
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  readOnlyToggle.onClick();
                }}
              >
                <m3e-icon
                  name={readOnlyToggle.active ? "lock" : "lock_open"}
                >
                </m3e-icon>
              </m3e-icon-button>
            )}
            {/* V11: persistent offline indicator — replaces the old
                anchored `m3e-badge` dot on the page title (easy to miss).
                Offline is a sustained state, so a labeled, glanceable chip
                in the trailing slot (left of the kebab trigger, per Jack's
                own placement call) is the right affordance, not a dot or a
                one-shot snackbar. `m3e-chip` (not m3e-assist-chip) since
                this isn't clickable — ChipElement.d.ts's own doc comment
                calls it "a non-interactive chip used to convey small pieces
                of information," exactly this case. `m3e-chip` has no
                color-role/`variant` option for an error treatment (verified
                against custom-elements.json: `variant` is only
                "outlined" | "elevated" — no color attr) — the error color is
                set via the same CSS custom properties colors.scss already
                uses for the analogous case (chip error-role tags, e.g.
                `m3e-assist-chip[data-tag-name="issue"]`):
                `--m3e-outlined-chip-outline-color` /
                `--m3e-chip-label-text-color` pointed at
                `--md-sys-color-error`. Done inline via `style` rather than a
                new colors.scss rule since this leaf is scoped to this file
                only. */}
            {!isOnline && (
              <m3e-chip
                slot="trailing"
                className="sb-offline-chip"
                title="Offline — changes will sync once reconnected"
                aria-label="Offline"
                style={{
                  "--m3e-outlined-chip-outline-color":
                    "var(--md-sys-color-error)",
                  "--m3e-chip-label-text-color": "var(--md-sys-color-error)",
                }}
              >
                Offline
              </m3e-chip>
            )}
            {/* L7: kebab menu — shell + trigger + positioning only in this
                leaf. Real content (Web Push toggle, CONFIG link, etc.) is
                wired in by a follow-up leaf (L8) via the `menuItems` prop,
                which also touches editor_ui.tsx and is sequenced after this
                one lands to avoid a merge conflict on this file. */}
            <m3e-icon-button
              slot="trailing"
              title="More actions"
              aria-label="More actions"
            >
              <m3e-menu-trigger for="sb-app-bar-menu">
                <m3e-icon name="more_vert"></m3e-icon>
              </m3e-menu-trigger>
            </m3e-icon-button>
        </m3e-app-bar>
        {/* `position-y="below"` is explicit here (it's also the component's
            own default, MenuPosition.d.ts) for the same self-documenting
            reason floating_toolbar.tsx's sb-recent-pages-menu is explicit
            about "above": this anchor lives at the TOP of the viewport (the
            sticky app bar), not the bottom like that toolbar — "below" is
            the only direction with room to open into, so it's stated
            outright rather than left to rely on the default silently being
            right. */}
        <m3e-menu id="sb-app-bar-menu" position-y="below">
          {menuItems.length === 0
            ? <m3e-menu-item disabled>No actions yet</m3e-menu-item>
            : menuItems.map((item) => (
              <m3e-menu-item
                key={item.key}
                disabled={item.disabled}
                onClick={item.disabled
                  ? undefined
                  : (e: MouseEvent) => {
                    e.preventDefault();
                    item.onClick();
                  }}
              >
                {/* `slot="icon"` is m3e-menu-item's OWN documented leading-
                    icon slot ("Renders an icon before the item's label",
                    menu component card / CEM). Without it the icon landed in
                    the DEFAULT slot, which is the LABEL slot — so it rendered
                    inline inside the label text instead of in the item's
                    dedicated leading-icon region, losing the component's icon
                    sizing/spacing/color treatment. */}
                {item.icon && (
                  <m3e-icon slot="icon" name={item.icon}></m3e-icon>
                )}
                {/* The label is wrapped rather than slotted as a bare text
                    node so `.sb-app-bar-menu-label` (client/styles/top.scss)
                    has something to bind to. m3e-menu-item's own shadow
                    `.content` declares `text-overflow: ellipsis`, but that
                    ellipsis can never fire for a long label — see the
                    stylesheet for the measured root cause. Slotting an
                    element is the only lever the light DOM has here:
                    m3e-menu-item exports no `part` and no width-related
                    custom property. `title` keeps the untruncated text
                    reachable on hover once the label does ellipsize. */}
                <span
                  className="sb-app-bar-menu-label"
                  title={item.detail ?? item.label}
                >
                  {item.label}
                </span>
              </m3e-menu-item>
            ))}
        </m3e-menu>
      </div>
      {rhs}
    </div>
  );
}
