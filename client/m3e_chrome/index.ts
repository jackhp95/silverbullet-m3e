// Single import line for editor_ui.tsx's fork additions. `register.ts`'s
// `@m3e/web/*` side-effect import is loaded separately (`import
// "./m3e_chrome/register.ts";`), not re-exported here, since it has nothing
// to export.
export { mountThemeRoot, useAppChrome } from "./use_app_chrome.ts";
export { PlugModal } from "./plug_modal.tsx";
