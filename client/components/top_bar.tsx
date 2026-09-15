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

// Real anchored dropdown (m3e-menu) for every top-bar action, replacing the
// old hover/CSS-class hamburger fly-out hack. Every actionButton lives here
// now, full stop — including SB's own built-in "home"/"book" defaults
// (libraries/Library/Std/Config.md sets `dropdown = false` on those two,
// a policy written for upstream's old flat hamburger-icon-row UI where a
// standalone-vs-hidden split made sense). This reskin's whole point is
// consolidation into one clean kebab (2026-09-15: "home and book should be
// in there too, stuff like search would go in there") — nothing in a
// minimal notes app's top bar is more "primary" than the page-title field
// itself, so `ActionButton.dropdown` is intentionally NOT consulted here.
// The trigger stays an m3e-icon-button; m3e-menu-trigger marks its icon
// content as the thing that opens the menu, same pattern the m3e menu card
// documents for m3e-button triggers.
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
            className={actionButton.class}
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
    <div
      id="sb-top"
      className={isOnline ? undefined : "sb-sync-error"}
      data-mobile-menu-style={mobileMenuStyle}
    >
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
          {
            // Every actionButton lives in the kebab now — not gated on
            // mobileMenuStyle/isMobile, and not filtered by the upstream
            // `dropdown` field (see OverflowMenu's own doc comment above).
            // That gate used to mean the overflow menu only ever rendered
            // on a true mouse-less/touch device (viewState.isMobile is
            // `!mouseDetected`, not a viewport-width check) — on every
            // mouse-equipped desktop browser, every actionButton rendered
            // as its own standalone icon, all the time. That was the exact
            // bug Jack flagged: home/book/search sitting as separate
            // always-visible icons instead of living in the kebab.
          }
          <OverflowMenu buttons={actionButtons} />
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
