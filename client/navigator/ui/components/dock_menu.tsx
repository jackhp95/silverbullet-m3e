import type { JSX } from "preact";
import { useId } from "preact/hooks";
import { CHROME_ICON_PROPS } from "./chrome_icons.tsx";
import { moveDock } from "../../navigator.ts";

const LABELS: Record<string, string> = {
  "page-top": "Top of page",
  "page-bottom": "Bottom of page",
  lhs: "Left sidebar",
  rhs: "Right sidebar",
  bhs: "Bottom panel",
  modal: "Modal only",
};

function dockIcon(dock: string) {
  const page = dock === "page-top" || dock === "page-bottom";
  const frame = page ? (
    <rect x="3.5" y="1.5" width="9" height="13" rx="1" />
  ) : (
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
  );
  const fills: Record<string, JSX.Element> = {
    "page-top": <rect x="5" y="3" width="6" height="2.5" rx="0.5" />,
    "page-bottom": <rect x="5" y="10.5" width="6" height="2.5" rx="0.5" />,
    lhs: <rect x="3.5" y="4.5" width="3" height="7" rx="0.5" />,
    rhs: <rect x="9.5" y="4.5" width="3" height="7" rx="0.5" />,
    bhs: <rect x="3.5" y="9" width="9" height="2.5" rx="0.5" />,
    modal: <rect x="4.5" y="5" width="7" height="4.5" rx="0.5" />,
  };
  return (
    <svg viewBox="0 0 16 16" {...CHROME_ICON_PROPS}>
      {frame}
      <g fill="currentColor" stroke="none">
        {fills[dock]}
      </g>
    </svg>
  );
}

/**
 * m3e reskin: the hand-rolled positioned popup (mousedown-outside-to-close,
 * viewport-edge-aware placement, scroll/resize-to-close) is replaced
 * wholesale by `m3e-menu` -- a real anchored-menu component that already
 * owns positioning, dismissal (Popover-API light-dismiss: outside click,
 * scroll, Escape) and keyboard navigation, none of which the old
 * implementation had (it only closed on outside mousedown; there was no
 * keyboard support at all). The "current selection has a distinct
 * indicator" requirement maps directly onto `m3e-menu-item-radio`'s
 * `checked` state -- this is exactly a mutually-exclusive, single-choice
 * menu (one dock at a time), the textbook radio-group use case.
 *
 * `.sb-dock-button` and `.sb-dock-menu-item` are kept as literal class names
 * (alongside the new m3e tags/attributes) because e2e/flows/docking.test.ts
 * selects on them directly (`.locator(".sb-dock-button")`,
 * `.locator(".sb-dock-menu-item", { hasText: ... })`) -- see
 * client/navigator/keyboard.ts's own note on the panel's keyboard pipeline:
 * it only ever binds to the filter `<input>`, so it has no opinion about
 * this menu at all, and nothing here can shadow it.
 *
 * `useId()` (already used elsewhere -- see plug-api/ui/field.tsx,
 * plug-api/ui/section_nav.tsx) gives each mounted instance its own
 * `m3e-menu` id: a page can host several page-top/page-bottom nav widgets
 * at once, each needing its own trigger/menu pairing.
 */
export function DockMenu({
  name,
  current,
  supported,
}: {
  name: string;
  current: string;
  supported: string[];
}) {
  const menuId = useId();
  if (supported.length < 2) return null;
  const label = `Shown as: ${LABELS[current]}. Change placement`;
  return (
    <>
      <m3e-icon-button
        type="button"
        class="sb-dock-button"
        size="small"
        title={label}
        aria-label={label}
      >
        <m3e-menu-trigger for={menuId}>{dockIcon(current)}</m3e-menu-trigger>
      </m3e-icon-button>
      <m3e-menu id={menuId}>
        {supported.map((dock) => (
          <m3e-menu-item-radio
            key={dock}
            class="sb-dock-menu-item"
            checked={dock === current}
            onClick={() => {
              if (dock !== current) void moveDock(name, dock);
            }}
          >
            <span slot="icon">{dockIcon(dock)}</span>
            {LABELS[dock]}
          </m3e-menu-item-radio>
        ))}
      </m3e-menu>
    </>
  );
}
