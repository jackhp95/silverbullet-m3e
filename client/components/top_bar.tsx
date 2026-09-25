import type { Notification } from "@silverbulletmd/silverbullet/type/client";
import { Icon, Input } from "@silverbulletmd/silverbullet/ui";
import type { ComponentChildren, FunctionalComponent } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { resolveIconNode } from "../lib/icon.ts";

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
        const onBlur = () => {
          if (mobileMenuStyle === "hamburger") {
            document
              .querySelector("#sb-top .sb-actions.hamburger")
              ?.classList.remove("open");
          }
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
              onBlur={onBlur}
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
            onBlur={onBlur}
          >
            <actionButton.icon size={18} />
          </m3e-icon-button>
        );
      })}
    </span>
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
    <Input
      // Chrome-less inline page-title editor, not a boxed Material field —
      // see Input's `bare` doc comment.
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
}) {
  const pageIconNode = resolveIconNode(pageIcon);
  return (
    <div id="sb-top" className={isOnline ? undefined : "sb-sync-error"}>
      {lhs}
      <m3e-app-bar className="main" size="small">
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
        {mobileMenuStyle ? (
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
      </m3e-app-bar>
      <NotificationPanel
        notifications={notifications}
        onDismiss={onDismissNotification}
      />
      {rhs}
    </div>
  );
}
