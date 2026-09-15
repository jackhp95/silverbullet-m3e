import type { ComponentChildren, FunctionalComponent } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";
import * as featherIcons from "preact-feather";
import type { Notification } from "@silverbulletmd/silverbullet/type/client";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/app-bar";
import "@m3e/web/icon-button";
import "@m3e/web/menu";
import "./m3e-jsx.d.ts";

export type ActionButton = {
  icon: FunctionalComponent<any>;
  description: string;
  class?: string;
  callback: () => void;
  href?: string;
  mobile?: boolean;
  dropdown?: boolean;
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

function NotificationPanel({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}) {
  if (notifications.length === 0) return null;
  return createPortal(
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
    </div>,
    document.body,
  );
}

function SyncProgressIndicator({
  percentage,
  type,
}: {
  percentage?: number;
  type?: string;
}) {
  if (percentage === undefined) return null;
  return (
    <div className="sb-sync-progress">
      <div
        className="progress-wrapper"
        title={`${type} progress: ${percentage}%`}
      >
        <div
          className="progress-bar"
          style={`background: radial-gradient(closest-side, var(--top-background-color) 79%, transparent 80% 100%), conic-gradient(var(--progress-${type}-color) ${percentage}%, var(--progress-background-color) 0);`}
        >
          {percentage}
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ buttons }: { buttons: ActionButton[] }) {
  return (
    <div className="sb-actions">
      {buttons.map((actionButton, i) => (
        <m3e-icon-button
          key={`${actionButton.description}-${i}`}
          href={actionButton.href || undefined}
          title={actionButton.description}
          aria-label={actionButton.description}
          className={actionButton.class}
          // "small" (the m3e default) forces a 24px icon in a 40px target —
          // correct for a standalone button, but heavy for this many
          // buttons packed into a 55px-tall bar. "extra-small" (20px icon /
          // 32px target) is the documented next rung down, not a guessed
          // override. Per-icon sizing on the Feather/mdi child itself
          // (previously `size={18}`) has no effect either way: m3e-icon-button
          // forces all slotted icon content to `1em`, which it then sets via
          // its own `font-size` per the `size` attribute above — so a size
          // prop on the child was always dead code.
          size="extra-small"
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            actionButton.callback();
          }}
        >
          <actionButton.icon />
        </m3e-icon-button>
      ))}
    </div>
  );
}

// Real anchored dropdown (m3e-menu) for actions that don't fit the bar,
// replacing the old hover/CSS-class hamburger fly-out hack. The trigger
// stays an m3e-icon-button (same sizing rationale as ActionButtons above);
// m3e-menu-trigger marks its icon content as the thing that opens the menu,
// same pattern the m3e menu card documents for m3e-button triggers.
function OverflowMenu({ buttons }: { buttons: ActionButton[] }) {
  if (buttons.length === 0) return null;
  return (
    <div className="sb-actions sb-overflow">
      <m3e-icon-button
        size="extra-small"
        title="More actions"
        aria-label="More actions"
      >
        <m3e-menu-trigger for="sb-overflow-menu">
          <featherIcons.MoreVertical />
        </m3e-menu-trigger>
      </m3e-icon-button>
      <m3e-menu id="sb-overflow-menu" position-x="before">
        {buttons.map((actionButton, i) => (
          <m3e-menu-item
            key={`${actionButton.description}-${i}`}
            href={actionButton.href || undefined}
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              actionButton.callback();
            }}
          >
            <span slot="icon" className="sb-menu-item-icon">
              <actionButton.icon />
            </span>
            {actionButton.description}
          </m3e-menu-item>
        ))}
      </m3e-menu>
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
  notifications,
  onRename,
  onDismissNotification,
  actionButtons,
  progressPercentage,
  progressType,
  lhs,
  rhs,
  pageNamePrefix,
  cssClass,
  mobileMenuStyle,
  readOnly,
}: {
  pageName?: string;
  unsavedChanges: boolean;
  isOnline: boolean;
  isLoading: boolean;
  notifications: Notification[];
  progressPercentage?: number;
  progressType?: string;
  onRename: (newName?: string) => Promise<void>;
  onDismissNotification: (id: number) => void;
  actionButtons: ActionButton[];
  lhs?: ComponentChildren;
  rhs?: ComponentChildren;
  pageNamePrefix?: string;
  cssClass?: string;
  mobileMenuStyle?: string;
  readOnly: boolean;
}) {
  return (
    <div id="sb-top" className={isOnline ? undefined : "sb-sync-error"}>
      {lhs}
      <m3e-app-bar className="main" size="small">
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
          {mobileMenuStyle ? (
            <>
              <ActionButtons
                buttons={actionButtons.filter((b) => b.dropdown === false)}
              />
              <OverflowMenu
                buttons={actionButtons.filter((b) => b.dropdown !== false)}
              />
            </>
          ) : (
            <ActionButtons buttons={actionButtons} />
          )}
        </span>
      </m3e-app-bar>
      <NotificationPanel
        notifications={notifications}
        onDismiss={onDismissNotification}
      />
      {rhs}
    </div>
  );
}
