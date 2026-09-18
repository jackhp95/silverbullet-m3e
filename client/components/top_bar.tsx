import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
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
// Material Symbols ligature name (string), not a component, since
// m3e-menu-item's own content is a plain slotted child, not a leading-icon
// prop.
export type AppBarMenuItem = {
  key: string;
  icon?: string;
  label: string;
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
}: {
  percentage?: number;
  type?: string;
}) {
  if (percentage === undefined) return null;
  // `filesProcessed / totalFiles` (plugs/sync/sync.ts) is NaN when totalFiles
  // is 0 — the one case where the caller still passes a defined-but-useless
  // percentage through. Rather than hand it to `value` (which would silently
  // clamp/NaN in the ring math), fall back to the component's own
  // `indeterminate` mode: "something is happening" without a bogus number.
  const indeterminate = Number.isNaN(percentage);
  return (
    <div className="sb-sync-progress">
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
  scrollContainerId,
  headerScrolled,
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
  /** Folder-path trail rendered above the app bar — see BreadcrumbItem. */
  breadcrumbItems: BreadcrumbItem[];
  /** Id of the real scrolling container the app bar reacts to (its `for`
   * attribute, AppBarElement.d.ts) — set once client/editor_ui.tsx finds
   * the CodeMirror scroller; undefined until then. */
  scrollContainerId?: string;
  /** Whether that container is currently scrolled past its top — drives the
   * breadcrumb-row collapse in top.scss (`#sb-top[data-scrolled]`). */
  headerScrolled?: boolean;
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
  // The breadcrumb (added 2026-09-15) sits above the app bar, inside the
  // same `.main` column (top.scss) — moved here from being the app-bar
  // element's own class, since `.main` now needs to host two stacked rows
  // instead of being the app bar itself. `m3e-app-bar`'s `for` + inline
  // `position: sticky; top: 0` follow AppBarElement.d.ts's own second
  // documented example (a `for`-attached scroll container producing
  // elevation-on-scroll) as closely as this app's real layout allows — see
  // top.scss's comment on `.sb-breadcrumb-row` for why the *collapse* of the
  // breadcrumb itself is driven by `data-scrolled` rather than by `for`
  // alone: `#sb-top` is a fixed, non-scrolling chrome row in SB's app-shell
  // layout (html/body's own `overflow: hidden`, main.scss), not a descendant
  // of the actual scrolling container, so plain CSS `position: sticky`
  // relative to it has nothing to stick against on its own.
  //
  // L6 (docs/plans/2026-09-16-toolbar-search-feedback-spec.md §4): the
  // leading asterisk icon-button below runs the exact same navigation as
  // the root breadcrumb segment ("Space", breadcrumbItems[0] — always
  // constructed first in editor_ui.tsx's breadcrumbItems array) rather than
  // a second, separately-wired copy of "Navigate: Home" — one command
  // binding, two entry points into it. Disabled under the same condition
  // the breadcrumb segment itself uses (command unavailable -> no onClick).
  const homeOnClick = breadcrumbItems[0]?.onClick;

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

  return (
    <div
      id="sb-top"
      className={isOnline ? undefined : "sb-sync-error"}
      data-mobile-menu-style={mobileMenuStyle}
      data-scrolled={headerScrolled ? "on" : "off"}
    >
      {lhs}
      <div className="main">
        <m3e-breadcrumb className="sb-breadcrumb-row" aria-label="Breadcrumb">
          {breadcrumbItems.map((item) => (
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
        <m3e-app-bar
          size="small"
          for={scrollContainerId}
          style={{ position: "sticky", top: 0 }}
        >
          {/* "asterisk" verified as a real glyph in the bundled font
              subset — client/fonts/MaterialSymbolsOutlined.woff2 decompiled
              (fontTools) and its glyph order literally contains "asterisk"
              (alongside "inbox_text_asterisk"/"mail_asterisk", which aren't
              it), the same way "close"/"history"/"add" etc. already used
              elsewhere in this file/floating_toolbar.tsx resolve — so no
              `emergency` fallback is needed here. */}
          <m3e-icon-button
            slot="leading"
            title="Home"
            aria-label="Home"
            disabled={!homeOnClick}
            onClick={homeOnClick
              ? (e: MouseEvent) => {
                e.preventDefault();
                homeOnClick();
              }
              : undefined}
          >
            <m3e-icon name="asterisk"></m3e-icon>
          </m3e-icon-button>
          <span slot="title" className="sb-page-title">
            <span className="sb-page-prefix">{pageNamePrefix}</span>
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
          </span>
          <span slot="trailing" className="sb-trailing">
            <SyncProgressIndicator
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
            <m3e-icon-button title="More actions" aria-label="More actions">
              <m3e-menu-trigger for="sb-app-bar-menu">
                <m3e-icon name="more_vert"></m3e-icon>
              </m3e-menu-trigger>
            </m3e-icon-button>
          </span>
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
                {item.icon && <m3e-icon name={item.icon}></m3e-icon>}
                {item.label}
              </m3e-menu-item>
            ))}
        </m3e-menu>
      </div>
      {rhs}
    </div>
  );
}
