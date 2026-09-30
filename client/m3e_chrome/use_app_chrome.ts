// Browser edge: owns every effectful read `deriveChrome` needs (push state,
// the computed accent, the page body text) and wires `viewState.commands`
// into `ChromeActions`, then hands the pure result to `deriveChrome`.

import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import { getNameFromPath } from "@silverbulletmd/silverbullet/lib/ref";
import type { Client } from "../client.ts";
import { findFrontmatterBlock } from "../codemirror/frontmatter_folding.ts";
import { accentSeed } from "../lib/theme_seed.ts";
import { readPushState, togglePush } from "../push_toggle.ts";
import type { PushState } from "../lib/push_ui.ts";
import type { AppViewState } from "../types/ui.ts";
import {
  deriveChrome,
  type AppChrome,
  type ChromeActions,
} from "./chrome_model.ts";

// `_tokens.scss`'s own `--ui-accent-color` default -- used only if the
// computed custom property can't be read at all (e.g. no matching rule).
const FALLBACK_ACCENT = "#3569b8";

/** The slice of `Client` the chrome needs -- kept narrow on purpose. */
export type ChromeClient = Pick<
  Client,
  | "bootConfig"
  | "ui"
  | "editorView"
  | "navigate"
  | "runCommandByName"
  | "startPageNavigate"
  | "currentPageMeta"
>;

// Page body minus frontmatter, for the app bar's "N min read" subtitle.
// `editorView` is unset on MainUI's first render (fork `1f8b8943`).
function computeBodyText(client: ChromeClient): string {
  const state = client.editorView?.state;
  if (!state) return "";
  const block = findFrontmatterBlock(state);
  return block ? state.sliceDoc(block.to) : state.sliceDoc();
}

/** Appends `<m3e-theme data-sb-theme-root>` to `container` and returns it as
 * the Preact render target -- `applyTheme` finds it back by the same
 * attribute every render, so the theme root is mounted imperatively instead
 * of as a JSX child (a body-level `<m3e-theme>` was rejected: see the
 * design's "Out of scope" notes). */
export function mountThemeRoot(container: Element): HTMLElement {
  const root = document.createElement("m3e-theme");
  root.setAttribute("data-sb-theme-root", "");
  container.appendChild(root);
  return root;
}

/** Pushes the derived theme onto the mounted root's `color`/`scheme`
 * properties. */
export function applyTheme(
  themeRoot: Element,
  theme: AppChrome["theme"],
): void {
  (themeRoot as any).color = theme.color;
  (themeRoot as any).scheme = theme.scheme;
}

export function useAppChrome(
  client: ChromeClient,
  viewState: AppViewState,
): AppChrome {
  // Kebab push item: `undefined` until the (async) first read resolves,
  // re-read after every toggle; `togglePush` flashes its own outcome.
  const [pushState, setPushState] = useState<PushState | undefined>();
  const [pushPending, setPushPending] = useState(false);
  useEffect(() => {
    void readPushState(client.bootConfig).then(setPushState);
  }, []);

  // `<m3e-theme>`'s color seed. Read once on mount and again whenever a
  // space style finishes loading (`loadCustomStyles` sets `customStyles`
  // after the `#custom-styles` stylesheet is in the DOM) -- a space style
  // overriding `--ui-accent-color` only takes effect on the *next* read of
  // the computed value, not retroactively on an already-read one.
  const [accent, setAccent] = useState(FALLBACK_ACCENT);
  useEffect(() => {
    const computed = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--ui-accent-color");
    setAccent(accentSeed(computed, FALLBACK_ACCENT));
  }, [viewState.uiOptions.customStyles]);

  const onPushClick = () => {
    setPushPending(true);
    void togglePush(client)
      .then(() => readPushState(client.bootConfig))
      .then(setPushState)
      .finally(() => setPushPending(false));
  };

  const isReadOnly =
    viewState.uiOptions.forcedROMode || client.bootConfig.readOnly;

  const actions: ChromeActions = {
    navigateHome: viewState.commands.has("Navigate: Home")
      ? () => void client.runCommandByName("Navigate: Home")
      : undefined,
    openPageNavigator: () => void client.startPageNavigate("page"),
    openConfig: () => void client.navigate({ path: "CONFIG.md" }),
    toggleReadOnly: viewState.commands.has("Editor: Toggle Read Only Mode")
      ? () => void client.runCommandByName("Editor: Toggle Read Only Mode")
      : undefined,
    togglePush: onPushClick,
    journalToday: viewState.commands.has("Journal: Today")
      ? () => void client.runCommandByName("Journal: Today")
      : undefined,
  };

  const chrome = deriveChrome({
    pageName: viewState.current
      ? getNameFromPath(viewState.current.path)
      : undefined,
    isReadOnly,
    darkMode: viewState.uiOptions.darkMode,
    accent,
    push: { state: pushState, pending: pushPending },
    lastModified: client.currentPageMeta()?.lastModified,
    bodyText: computeBodyText(client),
    actions,
  });

  useLayoutEffect(() => {
    const themeRoot = document.querySelector("[data-sb-theme-root]");
    if (themeRoot) applyTheme(themeRoot, chrome.theme);
  }, [chrome.theme.color, chrome.theme.scheme]);

  return chrome;
}
