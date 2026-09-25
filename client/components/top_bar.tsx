import type { Notification } from "@silverbulletmd/silverbullet/type/client";
import { Icon } from "@silverbulletmd/silverbullet/ui";
import type { ComponentChildren, FunctionalComponent } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { resolveIconNode } from "../lib/icon.ts";
import { countWords, readingTimeMinutes } from "../lib/reading_time.ts";
import { relativeTime } from "../lib/relative_time.ts";

/** One segment of the app bar's leading breadcrumb trail. `current` marks
 * the page itself; segments without `onClick` render disabled. */
export type BreadcrumbItem = {
  key: string;
  label: string;
  current?: boolean;
  onClick?: () => void;
};

/** One entry in the app bar's trailing kebab menu (`#sb-app-bar-menu`). */
export type AppBarMenuItem = {
  key: string;
  /** Material Symbols ligature, rendered as `<m3e-icon slot="icon">`. */
  icon?: string;
  /** Keep it ≤ ~30 chars: a kebab item ellipsizes past that (fork
   * `fa3d075a`, `.sb-app-bar-menu-label` in top.scss). */
  label: string;
  /** Full sentence behind a terse `label`, shown as the hover tooltip. */
  detail?: string;
  onClick: () => void;
  disabled?: boolean;
};

export type ActionButton = {
  icon: FunctionalComponent<any>;
  description: string;
  class?: string;
  callback: (el?: HTMLElement) => void;
  href?: string;
  mobile?: boolean;
  dropdown?: boolean;
  hasPopup?: boolean;
  expanded?: boolean;
  /** Render as a native `<button>` instead of `m3e-icon-button` — reserved
   * for the profile avatar (`accounts.test.ts:38`, `http.test.ts:156,163`
   * select it as `#sb-top button:has(.sb-profile-avatar)`). */
  native?: boolean;
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

function useEditorPaneMetrics() {
  // Layout effect, not effect: this runs before paint, so the overlay never
  // renders at the fallback position and then jumps.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const editor = document.querySelector("#sb-editor");
    if (!editor) return;

    const publish = () => {
      const { left, width } = editor.getBoundingClientRect();
      // A zero box means the pane has not been laid out yet; the observer
      // fires again once it has, and the CSS fallbacks hold until then.
      if (width === 0) return;
      root.style.setProperty("--sb-editor-pane-left", `${left}px`);
      root.style.setProperty("--sb-editor-pane-width", `${width}px`);
    };
    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(editor);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--sb-editor-pane-left");
      root.style.removeProperty("--sb-editor-pane-width");
    };
  }, []);
}

function NotificationPanel({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}) {
  if (notifications.length === 0) return null;
  return createPortal(
    <NotificationList notifications={notifications} onDismiss={onDismiss} />,
    document.body,
  );
}

function NotificationList({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}) {
  useEditorPaneMetrics();
  return (
    <div className="sb-notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`sb-notification-${notification.type}`}
        >
          <span className="sb-notification-message">
            {notification.message}
          </span>
          {notification.actions && notification.actions.length > 0 && (
            <span className="sb-notification-actions">
              {notification.actions.map((action, i) => (
                <button
                  key={i}
                  className="sb-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.run();
                  }}
                >
                  {action.name}
                </button>
              ))}
            </span>
          )}
          {notification.persistent && (
            <button
              className="sb-notification-dismiss"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
            >
              &times;
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function SyncProgressIndicator({
  percentage,
  type,
  withLabel,
  slot,
}: {
  percentage?: number;
  type?: string;
  withLabel?: boolean;
  /** Forwarded onto the root element so the caller can slot it directly. */
  slot?: string;
}) {
  if (percentage === undefined) return null;
  // `filesProcessed / totalFiles` (plugs/sync/sync.ts) is NaN when
  // totalFiles is 0 — fall back to the component's own `indeterminate`
  // mode ("something is happening") rather than feeding NaN to `value`.
  const indeterminate = Number.isNaN(percentage);
  return (
    <div className="sb-sync-progress" slot={slot}>
      <div
        className={`progress-wrapper progress-${type}`}
        title={
          indeterminate
            ? `${type} in progress`
            : `${type} progress: ${percentage}%`
        }
      >
        {withLabel && (
          <span className="progress-label">
            {type === "sync" ? "Syncing space" : "Indexing"}
          </span>
        )}
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

function ActionButtons({
  buttons,
  mobileMenuStyle,
}: {
  buttons: ActionButton[];
  mobileMenuStyle?: string;
}) {
  return (
    <span slot="trailing" className={`sb-actions ${mobileMenuStyle ?? ""}`}>
      {buttons.map((actionButton, i) => {
        const key = `${actionButton.description}-${i}`;
        const onClick = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          actionButton.callback(e.currentTarget as HTMLElement);
        };
        // The profile avatar stays a native <button> — e2e selects it as
        // `#sb-top button:has(.sb-profile-avatar)` (accounts.test.ts,
        // http.test.ts). Every other action button becomes m3e-icon-button.
        if (actionButton.native) {
          const btn = (
            <button
              type="button"
              key={key}
              onClick={onClick}
              title={actionButton.description}
              className={actionButton.class}
              aria-haspopup={actionButton.hasPopup ? "menu" : undefined}
              aria-expanded={
                actionButton.hasPopup ? !!actionButton.expanded : undefined
              }
            >
              <actionButton.icon size={18} />
            </button>
          );
          return actionButton.href ? (
            <a href={actionButton.href} key={key}>
              {btn}
            </a>
          ) : (
            btn
          );
        }
        return (
          <m3e-icon-button
            key={key}
            href={actionButton.href || undefined}
            title={actionButton.description}
            aria-label={actionButton.description}
            className={actionButton.class}
            onClick={onClick}
          >
            <actionButton.icon size={18} />
          </m3e-icon-button>
        );
      })}
    </span>
  );
}

/** Hamburger-style mobile menus (D2) move every `dropdown !== false` action
 * button into the kebab; the profile avatar (`native`) always stays a
 * trailing button. Any other style keeps main's trailing split. */
function isHamburger(mobileMenuStyle?: string): boolean {
  return !!mobileMenuStyle?.includes("hamburger");
}

function overflowsIntoKebab(button: ActionButton): boolean {
  return button.dropdown !== false && !button.native;
}

/** A kebab item for an action button moved there by the hamburger style.
 * Its icon is a Preact component (feather/mdi), so it goes into the item's
 * `icon` slot through a wrapper span, as dock_menu.tsx does. */
function actionButtonMenuItem(button: ActionButton, i: number) {
  return (
    <m3e-menu-item
      key={`action-${button.description}-${i}`}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        button.callback();
      }}
    >
      <span slot="icon">
        <button.icon size={18} />
      </span>
      <span className="sb-app-bar-menu-label" title={button.description}>
        {button.description}
      </span>
    </m3e-menu-item>
  );
}

function AppBarMenu({
  items,
  actionButtons,
}: {
  items: AppBarMenuItem[];
  actionButtons: ActionButton[];
}) {
  return (
    // The anchor sits at the top of the viewport, so the menu opens below.
    <m3e-menu id="sb-app-bar-menu" position-y="below">
      {items.map((item) => (
        <m3e-menu-item
          key={item.key}
          disabled={item.disabled}
          onClick={
            item.disabled
              ? undefined
              : (e: MouseEvent) => {
                  e.preventDefault();
                  item.onClick();
                }
          }
        >
          {item.icon && <m3e-icon slot="icon" name={item.icon}></m3e-icon>}
          {/* Wrapped (not a bare text node) so `.sb-app-bar-menu-label` can
              cap its width and let it ellipsize — see top.scss. */}
          <span
            className="sb-app-bar-menu-label"
            title={item.detail ?? item.label}
          >
            {item.label}
          </span>
        </m3e-menu-item>
      ))}
      {actionButtons.map(actionButtonMenuItem)}
    </m3e-menu>
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
  // Guards against the blur that fires when a successful rename refocuses the
  // editor, which would otherwise trigger a second (same-name) commit.
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
    // `<textarea>` so long titles wrap (D5); height auto-grows via
    // `field-sizing: content` in top.scss, capped at 2 lines.
    <textarea
      class="sb-input sb-page-name-editor"
      rows={1}
      value={name}
      readOnly={readOnly}
      onInput={(e) => setName(e.currentTarget.value)}
      onKeyDown={(e) => {
        // IME guard, as in plug-api/ui/input.tsx.
        if (e.isComposing) {
          return;
        }
        // Enter commits (the title is one logical line), never a newline.
        if (e.key === "Enter") {
          e.preventDefault();
          commit(e.currentTarget.value);
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => commit(e.currentTarget.value)}
    />
  );
}

export function TopBar({
  pageName,
  unsavedChanges,
  isOnline,
  isLoading,
  notifications,
  onRename,
  onDismissNotification,
  actionButtons,
  progressPercentage,
  progressType,
  progressWithLabel,
  lhs,
  rhs,
  pageNamePrefix,
  pageIcon,
  cssClass,
  mobileMenuStyle,
  readOnly,
  readOnlyToggle,
  breadcrumbItems,
  lastModified,
  bodyText,
  menuItems = [],
}: {
  pageName?: string;
  unsavedChanges: boolean;
  isOnline: boolean;
  isLoading: boolean;
  notifications: Notification[];
  progressPercentage?: number;
  progressType?: string;
  progressWithLabel?: boolean;
  onRename: (newName?: string) => Promise<void>;
  onDismissNotification: (id: number) => void;
  actionButtons: ActionButton[];
  lhs?: ComponentChildren;
  rhs?: ComponentChildren;
  pageNamePrefix?: string;
  pageIcon?: string;
  cssClass?: string;
  mobileMenuStyle?: string;
  readOnly: boolean;
  /** Read-only mode toggle, rendered in the trailing slot before the action
   * buttons. Undefined hides it entirely (e.g. command unavailable). */
  readOnlyToggle?: { active: boolean; label: string; onClick: () => void };
  /** Folder-path trail rendered in the app bar's own `slot="leading"`
   * breadcrumb (D4). `breadcrumbItems[0]` is the root ("Space" / Navigate:
   * Home); the rest are the page path's segments, last marked `current`. */
  breadcrumbItems: BreadcrumbItem[];
  /** `PageMeta.lastModified` (ISO-8601) for the "Edited …" subtitle
   * segment — kept raw (not pre-formatted) so `relativeTime`'s `now` stays
   * live across re-renders. Undefined before the page's meta has loaded. */
  lastModified?: string;
  /** The page's body text (frontmatter range excluded) for the "N min
   * read" subtitle segment via `reading_time.ts`. */
  bodyText: string;
  /** Trailing kebab-menu items (`#sb-app-bar-menu`), before any action
   * buttons the hamburger mobile style moves there. */
  menuItems?: AppBarMenuItem[];
}) {
  const hamburger = isHamburger(mobileMenuStyle);
  const kebabActionButtons = hamburger
    ? actionButtons.filter(overflowsIntoKebab)
    : [];
  const pageIconNode = resolveIconNode(pageIcon);
  return (
    <div id="sb-top" className={isOnline ? undefined : "sb-sync-error"}>
      {lhs}
      {/* D4: pinned `medium` — a pinned `large` bar costs too much of a
          phone screen now that the bar can't scroll away with the page. */}
      <m3e-app-bar className="main" size="medium">
        <m3e-breadcrumb slot="leading" aria-label="Breadcrumb">
          {breadcrumbItems.map((item) => (
            <m3e-breadcrumb-item
              key={item.key}
              current={item.current ? "page" : null}
              disabled={!item.onClick}
              onClick={
                item.onClick
                  ? (e: MouseEvent) => {
                      e.preventDefault();
                      item.onClick!();
                    }
                  : undefined
              }
            >
              {item.label}
            </m3e-breadcrumb-item>
          ))}
        </m3e-breadcrumb>
        <span slot="title" className="sb-page-title">
          <span className="sb-page-prefix">
            {pageIconNode && (
              <Icon node={pageIconNode} class="sb-page-decoration-icon" />
            )}
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
        </span>
        <span slot="subtitle">
          {lastModified ? `Edited ${relativeTime(lastModified)} · ` : ""}
          {readingTimeMinutes(countWords(bodyText))} min read
        </span>
        <SyncProgressIndicator
          slot="trailing"
          percentage={progressPercentage}
          type={progressType}
          withLabel={progressWithLabel}
        />
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
            ></m3e-icon>
          </m3e-icon-button>
        )}
        {/* Sustained-state indicator, additive to the whole-bar
            `#sb-top.sb-sync-error` tint above. `m3e-chip` is the
            non-interactive chip variant (ChipElement — "a non-interactive
            chip used to convey small pieces of information"); it carries no
            color-role attribute (verified against the m3e skill's chips
            card: `variant` is only "outlined"|"elevated"), so the error
            treatment is set via the same `--m3e-outlined-chip-outline-color`
            / `--m3e-chip-label-text-color` custom properties colors.scss
            uses for chip error roles elsewhere, applied inline since this
            leaf is scoped to top_bar.tsx. The online/offline M3eSnackbar
            toast (fork V11) is deferred — main's notifications stay. */}
        {!isOnline && (
          <m3e-chip
            slot="trailing"
            className="sb-offline-chip"
            title="Offline — changes will sync once reconnected"
            aria-label="Offline"
            style={{
              "--m3e-outlined-chip-outline-color": "var(--md-sys-color-error)",
              "--m3e-chip-label-text-color": "var(--md-sys-color-error)",
            }}
          >
            Offline
          </m3e-chip>
        )}
        {hamburger ? (
          <ActionButtons
            buttons={actionButtons.filter((b) => !overflowsIntoKebab(b))}
          />
        ) : mobileMenuStyle ? (
          <>
            <ActionButtons
              buttons={actionButtons.filter((b) => b.dropdown === false)}
            />
            <ActionButtons
              buttons={actionButtons.filter((b) => b.dropdown !== false)}
              mobileMenuStyle={mobileMenuStyle}
            />
          </>
        ) : (
          <ActionButtons buttons={actionButtons} />
        )}
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
      <AppBarMenu items={menuItems} actionButtons={kebabActionButtons} />
      <NotificationPanel
        notifications={notifications}
        onDismiss={onDismissNotification}
      />
      {rhs}
    </div>
  );
}
