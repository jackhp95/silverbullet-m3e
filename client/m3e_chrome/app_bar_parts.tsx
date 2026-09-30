// SSR-safe app-bar pieces moved verbatim out of `top_bar.tsx`. No `@m3e/web`
// import here (see `register.ts`): these render as inert custom-element
// tags under vitest's DOM-less `node` environment, which is exactly what
// `app_bar_parts.test.ts` asserts (the upgrade itself is e2e's job).

import { readingTimeMinutes, countWords } from "../lib/reading_time.ts";
import { relativeTime } from "../lib/relative_time.ts";
import type { ActionButton } from "../components/top_bar.tsx";

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

/** Read-only mode toggle, rendered in the trailing slot before the kebab
 * trigger. Absent (no `AppBarChrome.readOnlyToggle`) hides it entirely. */
export type ReadOnlyToggle = {
  active: boolean;
  label: string;
  onClick: () => void;
};

/** Everything `TopBar` needs from the derived chrome, one prop instead of
 * five. */
export type AppBarChrome = {
  breadcrumbItems: BreadcrumbItem[];
  lastModified?: string;
  bodyText: string;
  readOnlyToggle?: ReadOnlyToggle;
  menuItems: AppBarMenuItem[];
};

/** Folder-path trail rendered in the app bar's own `slot="leading"`. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <m3e-breadcrumb slot="leading" aria-label="Breadcrumb">
      {items.map((item) => (
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
  );
}

/** "Edited … · N min read" subtitle segment. */
export function Subtitle({
  lastModified,
  bodyText,
}: {
  lastModified?: string;
  bodyText: string;
}) {
  return (
    <span slot="subtitle">
      {lastModified ? `Edited ${relativeTime(lastModified)} · ` : ""}
      {readingTimeMinutes(countWords(bodyText))} min read
    </span>
  );
}

/** The trailing read-only toggle icon button. */
export function ReadOnlyToggleButton({ toggle }: { toggle: ReadOnlyToggle }) {
  return (
    <m3e-icon-button
      slot="trailing"
      title={toggle.label}
      aria-label={toggle.label}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        toggle.onClick();
      }}
    >
      <m3e-icon name={toggle.active ? "lock" : "lock_open"}></m3e-icon>
    </m3e-icon-button>
  );
}

/** The trailing "More actions" trigger bound to `#sb-app-bar-menu`. */
export function KebabTrigger() {
  return (
    <m3e-icon-button
      slot="trailing"
      title="More actions"
      aria-label="More actions"
    >
      <m3e-menu-trigger for="sb-app-bar-menu">
        <m3e-icon name="more_vert"></m3e-icon>
      </m3e-menu-trigger>
    </m3e-icon-button>
  );
}

/** A kebab item for an action button moved there by the hamburger style.
 * Its icon is a Preact component (feather/mdi), so it goes into the item's
 * `icon` slot through a wrapper span, as dock_menu.tsx does. */
export function actionButtonMenuItem(button: ActionButton, i: number) {
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

export function AppBarMenu({
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
          data-key={item.key}
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
