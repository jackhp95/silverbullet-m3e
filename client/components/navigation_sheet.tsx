import { useEffect, useRef, useState } from "preact/hooks";
import "@m3e/web/bottom-sheet";
import "@m3e/web/toolbar"; // registers m3e-toolbar (section switcher)
import "@m3e/web/icon-button"; // registers m3e-icon-button
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { ChangelogTab } from "./nav_views/changelog_tab.tsx";
import { HistoryTab } from "./nav_views/history_tab.tsx";
import { SitemapTab } from "./nav_views/sitemap_tab.tsx";

// Navigation bottom sheet (2026-09-17 vertical-toolbar/nav redesign spec
// §2.6/§2.7/§2.8, leaf V7). Modal `m3e-bottom-sheet` (same `modal handle
// hideable` composition `item_capture_sheet.tsx` already proved live) showing
// one of History/Changelog/Sitemap.
//
// --- section switcher: floating icon-only toolbar, NOT tabs ----------------
//
// `m3e-tabs` is gone (Jack's round-3 direction). The switcher is a floating,
// icon-only `m3e-toolbar shape="rounded" elevated` pinned to the sheet's
// bottom edge, one `m3e-icon-button` per section, with the ACTIVE section
// named in the sheet's own `slot="header"` title instead of by a tab label.
// Same idiom as `floating_toolbar.tsx`'s vertical app toolbar, so the app's
// floating surfaces read as one family.
//
// This is a deliberate DELETION, not a reskin. Dropping `m3e-tabs` also drops
// the whole V13 workaround that existed only to serve it: `@m3e/web@2.7.12`'s
// `m3e-tabs` stylesheet has a CSS-invalid fallback (`visibility:
// var(--_tabs-slide-visibility, "hidden")` — the literal STRING `"hidden"`,
// not a valid `visibility` keyword), so a click-driven tab switch never hid
// the previously-active `m3e-tab-panel` and we had to force the global
// `hidden` attribute on every inactive panel off `m3e-tabs`' `change` event.
// With no tabs and no panels, only the active section is ever rendered, so
// there is no second panel to hide and the library bug is simply out of the
// picture — the overlap defect e2e/visual-verification.test.ts documented
// cannot recur by construction.
//
// `m3e-toolbar` has no selection-manager concept (no `selected` attribute, no
// `change` event — verified against node_modules/@m3e/web/dist/
// custom-elements.json, same check `floating_toolbar.tsx` records), so the
// active section is ours to drive. It is shown two ways, both via component
// attributes rather than custom CSS: the sheet's `slot="header"` title, and
// the active button's `variant="filled"` (m3e-icon-button's own documented
// appearance variant — NOT `selected`, which the component scopes to `toggle`
// buttons; these are mutually exclusive destinations, not independent
// toggles).
//
// --- sizing ----------------------------------------------------------------
//
// Sized ONLY by the component's own `detents` API — no `vh`, no px height, no
// manual viewport math anywhere in this component or its stylesheet. See the
// ref effect below for why `detents` has to be assigned as a real array.
//
// Icon provenance: "history" was already live elsewhere in this fork before
// this leaf (git log -S, dd47f410/abf4c3f9). "update" and "account_tree" were
// verified present via `fontTools.ttLib.TTFont(...).getGlyphOrder()` against
// `client/fonts/MaterialSymbolsOutlined.woff2` (the full ~6618-glyph Material
// Symbols Outlined set, not a hand-curated per-usage subset) — both glyph
// names are present, not tofu. All three are unchanged by this round; only
// their container changed from tab to icon-button.

export type NavSection = "history" | "changelog" | "sitemap";

/** Left-to-right order in the switcher, matching the old tab order. */
export const NAV_SECTION_ORDER: readonly NavSection[] = [
  "history",
  "changelog",
  "sitemap",
];

export const NAV_SECTION_LABEL: Record<NavSection, string> = {
  history: "History",
  changelog: "Changelog",
  sitemap: "Sitemap",
};

export const NAV_SECTION_ICON: Record<NavSection, string> = {
  history: "history",
  changelog: "update",
  sitemap: "account_tree",
};

export const DEFAULT_NAV_SECTION: NavSection = "history";

export function NavigationSheet({
  open,
  onClose,
  recentPaths,
  currentPath,
  allPages,
}: {
  open: boolean;
  onClose: () => void;
  recentPaths: { path: Path; ts: number }[];
  currentPath: Path;
  allPages: PageMeta[];
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const [section, setSection] = useState<NavSection>(DEFAULT_NAV_SECTION);

  // Two separate m3e-bottom-sheet interop warts, both already live-verified in
  // search_sheet.tsx and item_capture_sheet.tsx:
  //
  // 1. `handle` gates the entire `.header` region (drag handle + the
  //    `slot="header"` title this sheet's active-section indicator lives in)
  //    behind a plain CSS *attribute* selector (`:host(:not([handle]))
  //    .header { display: none }`), and it does not reflect property->
  //    attribute. Preact assigns the property, so the attribute never appears
  //    and the title would silently not render. Force the attribute.
  //
  // 2. `detents` must be assigned as a REAL ARRAY from JS. Preact takes the
  //    property branch for custom elements when the instance field already
  //    exists, bypassing Lit's attribute->array converter, so a JSX
  //    `detents="half"` leaves `el.detents` as the STRING "half";
  //    `this.detents[this.activeDetent]` then indexes the string ("half"[0]
  //    === "h"), matches no case in `_computeDetentHeight`, and the sheet
  //    silently falls back to collapsed peek height.
  //
  // `["half"]` is the component's own supported sizing lever:
  // `_computeDetentHeight("half")` resolves to `_computeMaxHeight() * 0.5`,
  // i.e. half the viewport minus the sheet's own top inset — it tracks real
  // viewport metrics, which a hardcoded `50vh` would drift from. This sheet
  // previously declared no detents at all and therefore collapsed to its
  // content height (live-measured at 19% of the viewport), which left the
  // floating switcher nothing stable to pin to.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) {
      return;
    }
    el.setAttribute("handle", "");
    (el as unknown as { detents: string[] }).detents = ["half"];
  }, []);

  // Reset to the default section each time the sheet opens, matching
  // search_sheet.tsx's equivalent mode reset.
  useEffect(() => {
    if (open) {
      setSection(DEFAULT_NAV_SECTION);
    }
  }, [open]);

  return (
    <m3e-bottom-sheet
      id="sb-navigation-sheet"
      ref={sheetRef}
      modal
      handle
      hideable
      open={open}
      onCancel={() => onClose()}
      onClosed={() => onClose()}
    >
      {/* The title IS the active-section indicator, replacing the tab labels
          the icon-only switcher no longer carries. */}
      <span slot="header">{NAV_SECTION_LABEL[section]}</span>
      {/* Only the active section is rendered — see the header comment on why
          that, rather than three panels with two hidden, is what removes the
          m3e-tabs visibility bug entirely. */}
      <div class="sb-navigation-sheet-body">
        {section === "history" && (
          <HistoryTab
            recentPaths={recentPaths}
            currentPath={currentPath}
            onNavigate={onClose}
          />
        )}
        {section === "changelog" && (
          <ChangelogTab allPages={allPages} onNavigate={onClose} />
        )}
        {section === "sitemap" && (
          <SitemapTab allPages={allPages} onNavigate={onClose} />
        )}
      </div>
      <m3e-toolbar
        shape="rounded"
        elevated
        class="sb-sheet-section-toolbar"
        aria-label="Navigation section"
      >
        {NAV_SECTION_ORDER.map((s) => (
          <m3e-icon-button
            key={s}
            variant={s === section ? "filled" : "standard"}
            title={NAV_SECTION_LABEL[s]}
            aria-label={NAV_SECTION_LABEL[s]}
            aria-pressed={s === section ? "true" : "false"}
            onClick={() => setSection(s)}
          >
            <m3e-icon name={NAV_SECTION_ICON[s]}></m3e-icon>
          </m3e-icon-button>
        ))}
      </m3e-toolbar>
    </m3e-bottom-sheet>
  );
}
