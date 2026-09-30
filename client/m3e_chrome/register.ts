// Global custom-element registration for `<m3e-assist-chip>` (tag pills, both
// in the live CodeMirror editor via codemirror/hashtag.ts, and in rendered
// markdown/widgets via markdown_renderer/markdown_render.ts's Hashtag case).
// This is imported once by editor_ui.tsx, so one side-effect import here covers
// every module that renders the tag — those modules can't import it
// themselves because they're also loaded by plain-Node vitest unit tests
// with no DOM (see frontmatter_folding.test.ts's `domTest` guard; a
// LitElement class throws immediately at import time without a global
// `HTMLElement`).
import "@m3e/web/chips";
// Global custom-element registration for the navigator panel's m3e reskin
// (client/navigator/ui/components/{nav_root,dock_menu,content_view,
// loading_indicator}.tsx) -- same reason as the chips import just above:
// this is imported once by editor_ui.tsx, and none of those files may
// self-import an `@m3e/web/*` module at module scope, because several
// siblings under client/navigator/ have `.test.ts` files that run under
// vitest's DOM-less `node` environment (a Lit custom-element class throws
// immediately at import time with no global `HTMLElement`).
import "@m3e/web/search"; // m3e-search-bar: the filter input's chrome; also registers m3e-search-view (CS-4's FilterList)
import "@m3e/web/icon-button"; // m3e-icon-button: close/copy/dock-menu-trigger
import "@m3e/web/menu"; // m3e-menu/-item-radio/-trigger: the dock-placement menu
import "@m3e/web/progress-indicator"; // m3e-circular-progress-indicator: the loading spinner
// m3e-list / m3e-list-item: CS-4's FilterList result rows (client/components/filter.tsx).
import "@m3e/web/list";
// Same reasoning as `@m3e/web/chips` above, for `<m3e-button>`: `Button`
// (plug-api/ui/button.tsx) is reachable from plug FUNCTION code too (no
// DOM), so its kit file deliberately doesn't self-register — every real
// DOM-side consumer must, and this is the one import once covering
// client/navigator/ui/components/revision_preview.tsx's `<Button>` usage
// (the only direct Button consumer left in the editor bundle;
// client/components/basic_modals.tsx self-registers its own `@m3e/web/button`
// since it isn't reachable from plug FUNCTION code, and
// client/components/filter.tsx / top_bar.tsx render `Input` with `bare`,
// which never renders an m3e element at all).
import "@m3e/web/button";
// m3e-theme: dynamic-color root wrapping MainUI (CS-1), seeded from the
// space's `--ui-accent-color` custom property.
import "@m3e/web/theme";
// m3e-card / m3e-app-bar / m3e-icon: client/codemirror/lua_widget.ts's
// TOP/BOTTOM Lua array widgets (Linked Mentions, TOC, Linked Tasks) have
// rendered these tags since Slice 2's `3f6ba829` -- registering them here
// is what actually upgrades them from inert HTML.
import "@m3e/web/card";
import "@m3e/web/app-bar";
import "@m3e/web/breadcrumb"; // m3e-breadcrumb/-item: top_bar.tsx's app-bar leading-slot folder trail (CS-7a).
import "@m3e/web/icon";
// m3e-dialog: the plug modal (`showPanel("modal", ...)`) below.
import "@m3e/web/dialog";
// m3e-textarea-autosize: the frontmatter raw-YAML card
// (client/components/front_matter_panel.tsx, a CodeMirror block widget).
import "@m3e/web/textarea-autosize";
// m3e-toolbar: the floating toolbar (client/components/floating_toolbar.tsx).
import "@m3e/web/toolbar";
