import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/app-bar";
import "@m3e/web/breadcrumb";
import "@m3e/web/progress-indicator";
import "@m3e/web/badge";
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
            {/* Distinct offline marker, additive to the whole-bar
                `#sb-top.sb-sync-error` tint above — a small error-colored dot
                (badge's own default colors: DesignToken.color.error/onError,
                badge.md) anchored to the page title, so "offline" reads at a
                glance even where the bar tint alone might not stand out. */}
            {!isOnline && (
              <m3e-badge
                for="sb-current-page"
                size="small"
                title="Offline — changes will sync once reconnected"
                aria-label="Offline"
              >
              </m3e-badge>
            )}
          </span>
          <span slot="trailing" className="sb-trailing">
            <SyncProgressIndicator
              percentage={progressPercentage}
              type={progressType}
            />
          </span>
        </m3e-app-bar>
      </div>
      {rhs}
    </div>
  );
}
