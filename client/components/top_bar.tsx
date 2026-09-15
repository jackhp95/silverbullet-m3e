import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/app-bar";
import "./m3e-jsx.d.ts";

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
}) {
  // No more overflow/kebab trigger here — every actionButton, plus quick
  // capture and journal entry, now live in the single floating vertical
  // toolbar (client/components/floating_toolbar.tsx, rendered as a sibling
  // of <TopBar> in editor_ui.tsx). The app bar itself is left with exactly
  // what only it can do: the editable page title and sync/notification
  // status — it isn't "orphaned," its remaining job is just narrower.
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
        </span>
      </m3e-app-bar>
      {rhs}
    </div>
  );
}
