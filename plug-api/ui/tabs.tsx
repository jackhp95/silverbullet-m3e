import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/tabs"` here — reachable
// from plug FUNCTION code (no DOM), so every real DOM-side consumer
// self-imports it (see plug-api/ui/button.tsx for the same convention).
//
// `m3e-tab` has no href/link-navigation attribute at all (TabElement.d.ts:
// disabled/for/selected only — `for` targets a same-page panel id, not a
// URL — see M3eTabAttributes above), so this component keeps TWO render
// paths instead of a like-for-like fork swap:
//   - `navigation` mode (any item carries `href`, e.g. SectionNav's
//     horizontal admin/space/user-settings strips): stays plain
//     `<a href>`/`<button>` — swapping those to m3e-tab would regress
//     ctrl/middle-click, status-bar preview and crawlability, same
//     reasoning fork 664a4d53's own doc comment gave for App.tsx's admin
//     nav staying plain anchors.
//   - pure tablist mode (no item has `href`, e.g. configuration-manager's
//     Header, whose `onSelect` is a same-page view-switch callback with no
//     URL of its own): renders `<m3e-tabs>`/`<m3e-tab>`, matching fork
//     664a4d53's reskin.

export type TabItem = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  dirty?: boolean;
  href?: string;
  onSelect?: () => void;
};

export type TabsProps = {
  items: TabItem[];
  class?: string;
  label?: string;
};

export function Tabs({ items, class: extra, label }: TabsProps) {
  const navigation = items.some((item) => item.href !== undefined);

  if (navigation) {
    return (
      <div
        class={cx("sb-tabs", extra)}
        role="navigation"
        aria-label={label}
      >
        {items.map((t) =>
          t.href !== undefined ? (
            <a
              key={t.label}
              href={t.disabled ? undefined : t.href}
              aria-disabled={t.disabled || undefined}
              aria-current={t.active ? "page" : undefined}
              data-dirty={t.dirty || undefined}
              class={cx("sb-tab", t.active && "sb-active")}
            >
              {t.label}
            </a>
          ) : (
            <button
              key={t.label}
              type="button"
              disabled={t.disabled}
              data-dirty={t.dirty || undefined}
              class={cx("sb-tab", t.active && "sb-active")}
              onClick={t.onSelect}
            >
              {t.label}
            </button>
          ),
        )}
      </div>
    );
  }

  return (
    <m3e-tabs variant="secondary" class={cx("sb-tabs", extra)} aria-label={label}>
      {items.map((t) => (
        <m3e-tab
          key={t.label}
          selected={!!t.active}
          disabled={t.disabled}
          class={cx("sb-tab", t.active && "sb-active")}
          onClick={t.onSelect}
        >
          {t.label}
        </m3e-tab>
      ))}
    </m3e-tabs>
  );
}
