import { useEffect, useRef } from "preact/hooks";
import "@m3e/web/bottom-sheet";
import "@m3e/web/tabs";
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { ChangelogTab } from "./nav_views/changelog_tab.tsx";
import { HistoryTab } from "./nav_views/history_tab.tsx";
import { SitemapTab } from "./nav_views/sitemap_tab.tsx";

// Navigation bottom sheet (2026-09-17 vertical-toolbar/nav redesign spec
// §2.6/§2.7/§2.8, leaf V7). Modal `m3e-bottom-sheet` (same `modal handle
// hideable` composition `item_capture_sheet.tsx` already proved live) hosting
// `m3e-tabs variant="secondary"` with History/Changelog/Sitemap. Wired to
// `show-navigation-sheet`/`hide-navigation-sheet` (V1) via the `open`/
// `onClose` props below — NOT rendered from client/editor_ui.tsx yet, that's
// a later leaf (V8), same pattern V4/V5/V6 already used.
//
// `m3e-tabs`' own default `variant` is `"secondary"` (verified against this
// repo's node_modules/@m3e/web/dist/custom-elements.json — TabsElement's
// `variant` attribute defaults to `"secondary"`); passed explicitly anyway
// per spec, since `"primary"` is for prominent top-level nav which a sheet's
// internal tabs are not. `m3e-tab`'s `for` links each tab to its panel by DOM
// id (also verified against the live manifest); `m3e-tab-panel` self-assigns
// `slot="panel"` in its own `connectedCallback` (decompiled
// dist/tabs.js:190-199) — no `slot="panel"` attribute needed in this JSX.
//
// Icon provenance: "history" was already live elsewhere in this fork before
// this leaf (git log -S, dd47f410/abf4c3f9) — no re-check needed. "update"
// and "account_tree" are new to this codebase, so — same discipline
// top_bar.tsx/floating_toolbar.tsx already applied for "asterisk"/"explore"
// — both were verified present via `fontTools.ttLib.TTFont(...).getGlyphOrder()`
// against `client/fonts/MaterialSymbolsOutlined.woff2` (it's the full ~6618-
// glyph Material Symbols Outlined set, not a hand-curated per-usage subset,
// confirmed by inspecting `getGlyphOrder()`'s length): both glyph names are
// present, not tofu.
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

  // Same wart item_capture_sheet.tsx already documented and worked around:
  // Preact sets `handle`/`modal`/`hideable` as real DOM properties, but
  // M3eBottomSheetElement's compiled stylesheet gates the entire `.header`
  // region (drag handle + `slot="header"` title) behind a plain CSS
  // *attribute* selector (`:host(:not([handle])) .header { display: none }`),
  // and `handle` doesn't reflect prop->attribute. Force the real attribute
  // once the element exists so the sheet's own CSS actually shows its header.
  useEffect(() => {
    sheetRef.current?.setAttribute("handle", "");
  }, []);

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
      <span slot="header">Navigation</span>
      <m3e-tabs variant="secondary">
        <m3e-tab selected for="sb-nav-history">
          <m3e-icon slot="icon" name="history"></m3e-icon>
          History
        </m3e-tab>
        <m3e-tab for="sb-nav-changelog">
          <m3e-icon slot="icon" name="update"></m3e-icon>
          Changelog
        </m3e-tab>
        <m3e-tab for="sb-nav-sitemap">
          <m3e-icon slot="icon" name="account_tree"></m3e-icon>
          Sitemap
        </m3e-tab>
        <m3e-tab-panel id="sb-nav-history">
          <HistoryTab
            recentPaths={recentPaths}
            currentPath={currentPath}
            onNavigate={onClose}
          />
        </m3e-tab-panel>
        <m3e-tab-panel id="sb-nav-changelog">
          <ChangelogTab allPages={allPages} onNavigate={onClose} />
        </m3e-tab-panel>
        <m3e-tab-panel id="sb-nav-sitemap">
          <SitemapTab allPages={allPages} onNavigate={onClose} />
        </m3e-tab-panel>
      </m3e-tabs>
    </m3e-bottom-sheet>
  );
}
