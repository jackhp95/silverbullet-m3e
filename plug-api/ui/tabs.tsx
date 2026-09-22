import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/tabs"` here — same reason
// as button.tsx: reachable from plug FUNCTION code (no DOM), so every real
// DOM-side consumer self-imports it.
//
// Renders <m3e-tabs>/<m3e-tab>, NOT a like-for-like swap for every tab-styled
// UI in this codebase: `m3e-tab` has no href/link-navigation attribute at
// all (TabElement.d.ts: disabled/for/selected only — `for` targets a
// same-page panel id, not a URL), so App.tsx's admin nav (real `<a href>`
// route links styled as tabs) correctly stays plain anchors — swapping those
// to m3e-tab would regress ctrl/middle-click, status-bar preview and
// crawlability. This component's contract is different: `TabItem.onSelect`
// is a same-page view-switch callback with no URL of its own (its only
// consumer, plugs/configuration-manager/ui/components/app.tsx's Header,
// manages the switched panel content itself, outside this component) —
// exactly `for`/panel-id's non-navigating use case, so m3e-tab is the
// correct primitive here.

export type TabItem = {
  label: string;
  active?: boolean;
  onSelect: () => void;
};

export type TabsProps = {
  items: TabItem[];
  class?: string;
};

export function Tabs({ items, class: extra }: TabsProps) {
  return (
    <m3e-tabs variant="secondary" class={cx("sb-tabs", extra)}>
      {items.map((t) => (
        <m3e-tab
          key={t.label}
          selected={!!t.active}
          class={cx("sb-tab", t.active && "sb-active")}
          onClick={t.onSelect}
        >
          {t.label}
        </m3e-tab>
      ))}
    </m3e-tabs>
  );
}
