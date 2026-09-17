import { Confirm, Prompt } from "./components/basic_modals.tsx";
import {
  CommandPalette,
  keyboardHint,
  triggerCommand,
} from "./components/command_palette.tsx";
import { FilterList } from "./components/filter.tsx";
import {
  AnythingPicker,
  navigateToAnythingPickerName,
  navigateToAnythingPickerRef,
} from "./components/anything_picker.tsx";
import {
  type AppBarMenuItem,
  type BreadcrumbItem,
  TopBar,
} from "./components/top_bar.tsx";
import { Fab, NavBar } from "./components/nav_bar.tsx";
import {
  type CaptureItemType,
  ItemCaptureSheet,
} from "./components/item_capture_sheet.tsx";
import reducer from "./reducer.ts";
import {
  type Action,
  type AppViewState,
  initialViewState,
  type NavDestination,
} from "./types/ui.ts";
import "@m3e/web/theme";
import "@m3e/web/snackbar";
// Registers m3e-chip/-assist-chip/etc (used by codemirror/hashtag.ts,
// frontmatter_folding.ts, and markdown_renderer/markdown_render.ts for tag
// pills) here rather than in those lower-level modules: they're imported by
// plain-Node vitest unit tests with no DOM, where a side-effect import
// defining a `class extends LitElement` would throw at load time.
// Registration is global, so importing it once here covers all of them.
import "@m3e/web/chips";
// Side-panel chrome (lhs/rhs) — see the `#sb-main` block below. Only the
// host/wrapper is reskinned here; Panel (panel.tsx) itself, the plug-owned
// iframe/Shadow-DOM content it hosts, is untouched.
import "@m3e/web/drawer-container";
import "@m3e/web/icon-button";
import "@m3e/web/icon";
import "./components/m3e-jsx.d.ts";
import { h, render as preactRender } from "preact";
import { useEffect, useReducer, useState } from "preact/hooks";
import { closeSearchPanel } from "@codemirror/search";
import { runScopeHandlers } from "@codemirror/view";
import type { Client } from "./client.ts";
import { Panel } from "./components/panel.tsx";
import { safeRun } from "@silverbulletmd/silverbullet/lib/async";
import type {
  FilterOption,
  NotificationAction,
  NotificationType,
} from "@silverbulletmd/silverbullet/type/client";
import { notificationDismissTimeouts } from "@silverbulletmd/silverbullet/type/client";
import {
  getNameFromPath,
  isMarkdownPath,
  isValidName,
  parseToRef,
  type Path,
} from "@silverbulletmd/silverbullet/lib/ref";
import { slugify } from "@silverbulletmd/silverbullet/ui";
import {
  getPushSubscriptionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "./lib/push_subscribe.ts";

// Nav-bar destination panel host (2026-09-17 nav-bar redesign spec §2.3
// option (a), leaf N4) — a plain repo-owned fixed `<div>` (`.sb-nav-panel`
// in top.scss), NOT an `m3e-bottom-sheet`. Placeholder content only for
// this leaf; N5-N9 each replace one entry with a real `nav_views/*.tsx`
// view. Not owned by nav_bar.tsx (see the spec's §5.1 file-overlap table —
// N4 isn't listed among that file's owners), since it's wiring-level, same
// as this file's other viewState-driven panels above.
const NAV_PANEL_PLACEHOLDERS: Record<NavDestination, string> = {
  recent: "Recent — coming soon",
  search: "Search — coming soon",
  run: "Run — coming soon",
  notifications: "Notifications — coming soon",
};

// The frontmatter `tags:` value each item_capture_sheet.tsx type gets, and
// the `captures/<folder>/` directory its page lands in. "contact" maps to
// the `person` tag, not a fork-invented `contact` tag — this repo's own
// docs/Guide/People Notes.md (+ e2e/guide-people-notes.test.ts) already
// establishes `tags: person` as SilverBullet's real convention for a
// person/contact page (`from p = tags.person` query, Linked Mentions), so a
// captured contact interoperates with that existing guide/dashboard for
// free instead of minting a parallel, unqueried taxonomy.
const CAPTURE_TAXONOMY: Record<
  Exclude<CaptureItemType, "note">,
  { tag: string; folder: string }
> = {
  task: { tag: "task", folder: "task" },
  event: { tag: "event", folder: "event" },
  contact: { tag: "person", folder: "contact" },
  idea: { tag: "idea", folder: "idea" },
};

// Quick-capture write for the unified item-creation bottom sheet's
// task/event/contact/idea types (client/components/item_capture_sheet.tsx).
//
// Was: append one plain line to one shared hardcoded page (`Tasks`/
// `Events`/`Contacts`/`Ideas`), no frontmatter, no tag — everything on a
// page piled into one undifferentiated, unaddressable blob.
//
// This fork has no `tag.define`-schema'd "task" (or event/contact/idea)
// convention of its own to conform to (checked: no `tag.define` in
// demo-space/CONFIG.md or anywhere in this repo/libraries/ beyond SB's
// upstream *built-in* tags — see libraries/Library/Std/Infrastructure/
// Builtin Tags.md). SB's real built-in "task" is checkbox-shaped
// (`* [ ] text`, auto-indexed by plugs/index/task.ts — see
// docs/Guide/Task Management.md) rather than a per-page frontmatter schema,
// so the task branch below keeps that literal checkbox line as the page
// body (real, toggleable, queryable via `tags.task`) while *also* giving it
// its own page so it's individually addressable — the "minimum bar" this
// task's brief calls for when no fuller schema exists. event/idea have no
// existing SB-native tag at all, so they get a plain new tag of the same
// name (the same minimum bar).
async function writeCaptureItemPage(
  client: Client,
  type: Exclude<CaptureItemType, "note">,
  body: string,
): Promise<string> {
  const { tag, folder } = CAPTURE_TAXONOMY[type];
  const slug = slugify(body.slice(0, 60)) || "item";
  const pageName = `captures/${folder}/${slug}-${Date.now().toString(36)}`;
  const frontmatter = `---\ntags: ${tag}\ncaptured: ${new Date().toISOString()}\n---\n`;
  await client.space.writePage(pageName, `${frontmatter}${body}\n`);
  return pageName;
}

// Stable id given to the real editor scroll container exactly once, in
// client.ts right after `new EditorView(...)` constructs it — see the
// comment there. `EditorView.scrollDOM` (view/index.d.ts) is CodeMirror's
// own public, documented handle to that element (already used elsewhere in
// client.ts, e.g. `editorView.scrollDOM.scrollTop`), so no DOM class-name
// hunting is needed to find it: it's a real API return value, not `.cm-
// scroller` discovered by querying internal CM6 markup. AppBarElement.d.ts's
// `for` attribute needs a real element id to attach its scroll listener to
// (scroll events don't bubble, so it must be the actual scrolling element,
// not an ancestor).
export const EDITOR_SCROLL_CONTAINER_ID = "sb-editor-scroller";

// m3e-snackbar (node_modules/@m3e/web/dist/src/snackbar/SnackbarElement.d.ts,
// v2.7.12, verified against the installed CEM — not the older v2.7.3 pinned
// in the m3e skill card) has no `type`/severity/variant/role attribute or
// option at all; its only styling seam for this is the documented
// `--m3e-snackbar-container-color` cssprop. Map each real `NotificationType`
// to the matching M3 system-color token (core.js confirms the live var
// names: `--md-sys-color-error`, `--md-sys-color-tertiary`); "info" is left
// `undefined` to keep the library's own neutral default.
const SEVERITY_CONTAINER_COLOR: Record<NotificationType, string | undefined> = {
  info: undefined,
  warning: "var(--md-sys-color-tertiary)",
  error: "var(--md-sys-color-error)",
};

export class MainUI {
  viewState: AppViewState = initialViewState;

  constructor(private client: Client) {
    // Make keyboard shortcuts work even when the editor is in read only mode or not focused
    globalThis.addEventListener("keydown", (ev) => {
      if (!client.editorView.hasFocus) {
        const target = ev.target as HTMLElement;
        if (target.className === "cm-textfield" && ev.key === "Escape") {
          // Search panel is open, let's close it
          console.log("Closing search panel");
          closeSearchPanel(client.editorView);
          return;
        } else if (
          target.className === "cm-textfield" ||
          target.closest(".cm-content") ||
          target.closest(".cm-vim-panel")
        ) {
          // In some cm element, let's back out
          return;
        } else if (
          target.closest('input, textarea, select, [contenteditable="true"]')
        ) {
          // Focus is in a native form field (e.g. the top-bar page-name
          // editor). Let the field own keys it handles natively — typing,
          // caret navigation, and the standard clipboard/undo/select-all
          // combos — but still forward genuine command shortcuts (e.g. Cmd-K)
          // so they keep working from the field, like they did in the old
          // CodeMirror mini-editor.
          const cmd = ev.metaKey || ev.ctrlKey;
          const key = ev.key.toLowerCase();
          const fieldHandlesNatively =
            !cmd ||
            ["a", "c", "v", "x", "z", "y"].includes(key) ||
            [
              "arrowleft",
              "arrowright",
              "arrowup",
              "arrowdown",
              "home",
              "end",
              "backspace",
              "delete",
            ].includes(key);
          if (fieldHandlesNatively) {
            return;
          }
          // Otherwise fall through and forward the shortcut to the editor.
        }
        if (runScopeHandlers(client.editorView, ev, "editor")) {
          ev.preventDefault();
        }
      }
    });

    globalThis.addEventListener("touchstart", (ev) => {
      // Launch the page picker on a two-finger tap
      if (ev.touches.length === 2) {
        ev.stopPropagation();
        ev.preventDefault();
        client.startPageNavigate("page");
      }
      // Launch the command palette using a three-finger tap
      if (ev.touches.length === 3) {
        ev.stopPropagation();
        ev.preventDefault();
        void client.startCommandPalette();
      }
    });

    globalThis.addEventListener("mouseup", (_) => {
      setTimeout(() => {
        client.editorView.dispatch({});
      });
    });
  }

  // Progress circle handling
  private progressTimeout?: ReturnType<typeof setTimeout>;

  viewDispatch: (action: Action) => void = () => {};

  // Real m3e-snackbar (node_modules/@m3e/web/dist/src/snackbar/Snackbar.d.ts,
  // v2.7.12) replaces the old ad hoc `viewState.notifications` + portal-
  // rendered toast (top_bar.tsx's old NotificationPanel). `M3eSnackbar.open`
  // is the component's own documented global imperative API — a real
  // singleton snackbar element it creates/appends/removes itself, not a
  // hand-rolled store. External signature is unchanged (this is still the
  // exact method `editor.flashNotification` — a public, Space-Lua-facing
  // syscall, client/plugos/syscalls/editor.ts — calls), only the rendering
  // is swapped, matching every other component patch this round.
  //
  // Severity: error/warning now also drive `--m3e-snackbar-container-color`
  // (SEVERITY_CONTAINER_COLOR above) in addition to the existing text
  // prefix — color alone would be a WCAG 1.4.1 "use of color" violation for
  // anyone who can't distinguish the hue, so the prefix stays as the
  // non-color channel. `M3eSnackbar.open()` returns void and creates its own
  // element internally (Snackbar.d.ts) — `M3eSnackbarElement.current` only
  // updates inside its async `beforetoggle` handler (Lit's update cycle is
  // microtask-deferred), so it isn't readable synchronously here. The
  // synchronously-reliable handle is `document.body.lastElementChild`: the
  // compiled source (snackbar.js) does `document.body.append(snackbar)`
  // immediately before returning, and nothing else can run between that and
  // this line (single JS thread) — so it's guaranteed to be the element
  // `.open()` just created, not a DOM-hunt.
  //
  // Single-at-a-time (deliberate, not a gap): kept as-is. Material's
  // snackbar pattern — and this library's implementation specifically
  // (`M3eSnackbarElement.__current`, `_handleBeforeToggle` forcibly closes
  // whatever's showing before opening the next) — is a hard singleton, not
  // a policy choice on our side. Reintroducing a stacked queue would mean
  // bypassing `M3eSnackbar.open()` entirely and hand-rolling our own
  // multi-toast stack outside the vendored component, which is exactly the
  // kind of hand-rolled store this reskin was removing. A second
  // `flashNotification` while one is showing replaces it, same as before.
  flashNotification(
    message: string,
    type: NotificationType = "info",
    options?: {
      timeout?: number;
      actions?: NotificationAction[];
    },
  ) {
    const persistent = options?.timeout === 0;
    const duration = persistent
      ? 0
      : (options?.timeout ?? notificationDismissTimeouts[type]);
    const prefix = type === "error" ? "Error: " : type === "warning" ? "Warning: " : "";
    const primaryAction = options?.actions?.[0];
    if (primaryAction) {
      globalThis.M3eSnackbar.open(`${prefix}${message}`, primaryAction.name, true, {
        duration,
        actionCallback: primaryAction.run,
      });
    } else {
      globalThis.M3eSnackbar.open(`${prefix}${message}`, persistent, { duration });
    }

    const containerColor = SEVERITY_CONTAINER_COLOR[type];
    if (containerColor) {
      const el = document.body.lastElementChild;
      if (el?.tagName === "M3E-SNACKBAR") {
        (el as HTMLElement).style.setProperty(
          "--m3e-snackbar-container-color",
          containerColor,
        );
      }
    }
  }

  showProgress(progressPercentage?: number, progressType?: "sync" | "index") {
    this.viewDispatch({
      type: "set-progress",
      progressPercentage,
      progressType,
    });
    if (this.progressTimeout) {
      clearTimeout(this.progressTimeout);
    }
    this.progressTimeout = setTimeout(() => {
      this.viewDispatch({
        type: "set-progress",
      });
    }, 5000);
  }

  filterBox(
    label: string,
    options: FilterOption[],
    helpText = "",
    placeHolder = "",
  ): Promise<FilterOption | undefined> {
    return new Promise((resolve) => {
      this.viewDispatch({
        type: "show-filterbox",
        label,
        options,
        placeHolder,
        helpText,
        onSelect: (option: any) => {
          this.viewDispatch({ type: "hide-filterbox" });
          this.client.focus();
          resolve(option);
        },
      });
    });
  }

  prompt(message: string, defaultValue = ""): Promise<string | undefined> {
    return new Promise((resolve) => {
      this.viewDispatch({
        type: "show-prompt",
        message,
        defaultValue,
        callback: (value: string | undefined) => {
          this.viewDispatch({ type: "hide-prompt" });
          this.client.focus();
          resolve(value);
        },
      });
    });
  }

  confirm(
    message: string,
    options?: { destructive?: boolean },
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.viewDispatch({
        type: "show-confirm",
        message,
        destructive: options?.destructive,
        callback: (value: boolean) => {
          this.viewDispatch({ type: "hide-confirm" });
          this.client.focus();
          resolve(value);
        },
      });
    });
  }

  ViewComponent() {
    const [viewState, dispatch] = useReducer(reducer, initialViewState);
    this.viewState = viewState;
    this.viewDispatch = dispatch;
    // Controls the unified item-creation m3e-bottom-sheet (nav bar's FAB) —
    // fully Preact-controlled, see item_capture_sheet.tsx.
    const [captureSheetOpen, setCaptureSheetOpen] = useState(false);

    const client = this.client;

    // Escape closes the nav-bar destination panel (N4). Only attached while
    // a panel is actually open, and removed the moment it closes for any
    // other reason (clicking the same nav item again, selecting a different
    // destination doesn't need this — it's a straight dispatch) — no
    // dangling listener once `navDestination` goes back to `null`.
    useEffect(() => {
      if (viewState.navDestination === null) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          dispatch({ type: "close-nav-panel" });
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [viewState.navDestination]);

    // Single source of truth for read-only state — the same expression that
    // already drove TopBar's readOnly prop below and CodeMirror's editable
    // config (client/codemirror/editor_state.ts). Reused for the floating
    // toolbar's lock/unlock icon and the mono→sans editor-font swap so all
    // three stay in lockstep with the real state, not separately guessed.
    const isReadOnly = viewState.uiOptions.forcedROMode ||
      client.bootConfig.readOnly;

    // Reflects read-only mode onto <html> so a space-style-independent CSS
    // rule (theme.scss, `html[data-read-only="on"]`) can swap
    // --editor-font to the sans-serif --ui-font stack. Same
    // dataset-attribute pattern as the darkMode/markdownSyntaxRendering
    // effects below.
    useEffect(() => {
      document.documentElement.dataset.readOnly = isReadOnly ? "on" : "off";
    }, [isReadOnly]);

    // Web Push subscribe toggle (spec §5.1) — floating toolbar's bell icon.
    // `pushState` mirrors what `PushManager.getSubscription()`/
    // `Notification.permission` actually report, checked once at mount, so
    // a reload (or a permission the user changed in browser settings) still
    // renders correctly instead of just tracking this session's own clicks.
    // See client/lib/push_subscribe.ts for the actual subscribe/unsubscribe
    // logic and where `vapidPublicKey`/`pushSidecarUrl` come from.
    const [pushState, setPushState] = useState<
      | "checking"
      | "unsupported"
      | "not-configured"
      | "denied"
      | "off"
      | "pending"
      | "on"
      | "error"
    >("checking");

    useEffect(() => {
      safeRun(async () => {
        if (!isPushSupported()) {
          setPushState("unsupported");
          return;
        }
        if (!client.bootConfig.vapidPublicKey || !client.bootConfig.pushSidecarUrl) {
          setPushState("not-configured");
          return;
        }
        if (Notification.permission === "denied") {
          setPushState("denied");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscribed =
          (await getPushSubscriptionState(registration)) === "subscribed";
        setPushState(subscribed ? "on" : "off");
      });
      // Deliberately once-at-mount: there's no browser event for a
      // permission change made outside the app, and re-deriving on every
      // render would fight the "pending" state set during the click handler
      // below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const PUSH_TOGGLE_LABELS: Record<typeof pushState, string> = {
      checking: "Checking push notification support…",
      unsupported: "Push notifications are not supported in this browser",
      "not-configured": "Push notifications are not configured for this server",
      denied:
        "Notification permission was denied — enable it in your browser settings",
      off: "Enable push notifications",
      pending: "Enabling push notifications…",
      on: "Push notifications are on — click to turn off",
      error: "Push notifications failed — click to retry",
    };

    const pushToggle = pushState === "checking" ? undefined : {
      active: pushState === "on",
      unavailable: pushState === "unsupported" || pushState === "not-configured" ||
        pushState === "denied",
      pending: pushState === "pending",
      label: PUSH_TOGGLE_LABELS[pushState],
      onClick: () =>
        safeRun(async () => {
          if (
            pushState === "unsupported" || pushState === "not-configured" ||
            pushState === "denied"
          ) {
            // Nothing actionable from here — surface why, same channel as
            // every other client-side notice.
            client.ui.flashNotification(PUSH_TOGGLE_LABELS[pushState], "info");
            return;
          }
          const registration = await navigator.serviceWorker.ready;
          if (pushState === "on") {
            await unsubscribeFromPush(registration);
            setPushState("off");
            client.ui.flashNotification("Push notifications turned off");
            return;
          }
          setPushState("pending");
          const result = await subscribeToPush(registration, {
            vapidPublicKey: client.bootConfig.vapidPublicKey!,
            sidecarUrl: client.bootConfig.pushSidecarUrl!,
          });
          if (result.ok) {
            setPushState("on");
            client.ui.flashNotification("Push notifications enabled");
          } else if (result.reason === "denied") {
            setPushState("denied");
            client.ui.flashNotification(
              "Notification permission denied",
              "error",
            );
          } else {
            setPushState("error");
            client.ui.flashNotification(
              `Could not enable push notifications: ${
                result.detail ?? result.reason
              }`,
              "error",
            );
          }
        }),
    };

    // m3e-theme's `color` seed is sourced from the space's own
    // `--ui-accent-color` custom property (client/styles/_tokens.scss;
    // theme.scss overrides it per dark/light scheme) rather than a
    // hardcoded literal, so a space that recolors its own accent via
    // CONFIG.md space-style also recolors m3e's Material color roles
    // instead of the two silently diverging. It's re-read every time
    // `uiOptions.customStyles` changes rather than once at mount: a
    // space-style override loads asynchronously well after this component's
    // first render (client.ts's boot sequence mounts the UI at
    // `this.ui.render(this.parent)` long before the awaited
    // `this.loadCustomStyles()` near the end of boot has a chance to run,
    // since it depends on the object index being available) — the
    // `<style>` tag(s) it injects into `#custom-styles` are what can
    // actually override `--ui-accent-color` on `html`, so reading the
    // computed value only at mount would always see the pre-override
    // default. `customStyles` starts `undefined` and changes exactly once
    // (to the loaded content, even if empty) once `loadCustomStyles`
    // dispatches, which is enough to trigger a re-read after the override
    // (if any) is actually in the DOM. Falls back to the token's own
    // default if the read ever comes back empty (shouldn't happen — the
    // var always has a value from _tokens.scss — but a hardcoded fallback
    // is cheap insurance against a blank m3e-theme color crashing render).
    const [accentColor, setAccentColor] = useState("#464cfc");
    useEffect(() => {
      const computed = getComputedStyle(document.documentElement)
        .getPropertyValue("--ui-accent-color")
        .trim();
      if (computed) setAccentColor(computed);
    }, [viewState.uiOptions.customStyles]);

    // Wires the real editor scroll container up for two consumers in
    // top_bar.tsx: `m3e-app-bar`'s own `for`-driven elevation-on-scroll
    // (AppBarElement.d.ts), and the breadcrumb-row collapse this fork adds
    // on top of it (`#sb-top[data-scrolled]`, top.scss) — see that file's
    // comment for why the breadcrumb can't just live inside a `position:
    // sticky` ancestor here.
    //
    // `client.editorView.scrollDOM` (view/index.d.ts) is CodeMirror's own
    // public handle to the actual scrolling element — already used
    // elsewhere in client.ts (`editorView.scrollDOM.scrollTop`) — and gets
    // its stable id assigned exactly once, at construction, in client.ts
    // right after `new EditorView(...)`. That replaced a MutationObserver
    // that polled `#sb-editor` for a `.cm-scroller` child to appear and
    // stamped an id on it at runtime: it worked, but it depended on
    // CodeMirror's internal DOM shape (a class name with no public
    // contract) rather than CodeMirror's own documented API, so it would
    // have broken silently on a future upstream rebase that changed that
    // internal markup. `client.editorView` is constructed synchronously,
    // in the same tick as `MainUI`'s own initial render (client.ts:264-270,
    // no `await` between them), so it already exists by the time this
    // effect runs — no polling or "wait for it" needed.
    const [headerScrolled, setHeaderScrolled] = useState(false);
    useEffect(() => {
      const scroller = client.editorView.scrollDOM;
      const onScroll = () => setHeaderScrolled(scroller.scrollTop > 0);
      onScroll();
      scroller.addEventListener("scroll", onScroll, { passive: true });
      return () => scroller.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
      if (viewState.current) {
        document.title =
          (this.client.currentPageMeta()?.pageDecoration?.prefix ?? "") +
          getNameFromPath(viewState.current.path);
      }
    }, [viewState.current]);

    useEffect(() => {
      void this.client.rebuildEditorState();
      void this.client.dispatchAppEvent("editor:modeswitch");
    }, [viewState.uiOptions.vimMode]);

    useEffect(() => {
      const updateTheme = () => {
        const darkMode =
          viewState.uiOptions.darkMode === undefined
            ? globalThis.matchMedia("(prefers-color-scheme: dark)").matches
            : viewState.uiOptions.darkMode;

        document.documentElement.dataset.theme = darkMode ? "dark" : "light";

        if (this.client.contentManager.isDocumentEditor()) {
          this.client.contentManager.documentEditor.updateTheme();
        }
      };

      updateTheme();

      if (viewState.uiOptions.darkMode === undefined) {
        const mediaQuery = globalThis.matchMedia(
          "(prefers-color-scheme: dark)",
        );
        mediaQuery.addEventListener("change", updateTheme);

        return () => {
          mediaQuery.removeEventListener("change", updateTheme);
        };
      }
    }, [viewState.uiOptions.darkMode]);

    useEffect(() => {
      document.documentElement.dataset.markdownSyntaxRendering = viewState
        .uiOptions.markdownSyntaxRendering
        ? "on"
        : "off";
    }, [viewState.uiOptions.markdownSyntaxRendering]);

    useEffect(() => {
      // Need to dispatch a resize event so that the top_bar can pick it up
      globalThis.dispatchEvent(new Event("resize"));
    }, [viewState.panels]);
    const actionButtons = client.config.get<ActionButtonConfig[]>(
      "actionButtons",
      [],
    );
    // Same filter/priority/icon-resolution logic the old TopBar
    // `actionButtons` prop used to run inline — moved here, unchanged,
    // shared by both the floating toolbar (below) AND the app-bar kebab's
    // configMenuItems (also below, L8): same underlying CONFIG-defined
    // buttons, two render targets, temporarily duplicated per L8's own
    // scope (removal from the toolbar is a later leaf, L13).
    const filteredActionButtons = actionButtons
      .filter(
        (button) =>
          button.icon &&
          (typeof button.mobile === "undefined" ||
            button.mobile === viewState.isMobile) &&
          (typeof button.standalone === "undefined" ||
            button.standalone === viewState.isStandalone) &&
          // The Std library's "Read Only Mode.md" ships this exact
          // actionButton (icon "lock", mobile-only, static icon that never
          // reflects real state). Our own readOnlyToggle below replaces it
          // with a live, state-reflecting one shown regardless of device —
          // filter the static original out here so it's not duplicated.
          !(button.icon === "lock" &&
            button.description === "Toggle read-only mode") &&
          // The Std library's default Config.md ships a "home" actionButton
          // (icon "home", command "Navigate: Home" — libraries/Library/Std/
          // Config.md) whose exact function — go to the index/root page —
          // the breadcrumb's own root "Space" segment now performs directly
          // (see the breadcrumbItems computation below, which literally
          // runs the same "Navigate: Home" command). And a demo/user space
          // may ship a "github" actionButton (verified against this repo's
          // own demo-space/CONFIG.md convention: icon "github", opening a
          // repo URL) — that's a link-out, not a workspace action, and
          // doesn't belong in a content-creation/navigation toolbar.
          // Filtering by icon here (not editing either CONFIG.md) keeps
          // this robust regardless of which space defines them — the same
          // reasoning the pre-existing "lock" filter above already
          // establishes. No "help"/question-mark actionButton exists
          // anywhere in this repo state today (checked libraries/ and the
          // repo root — there is no demo-space/ directory in this
          // checkout), so there's nothing to filter for that concept yet.
          button.icon !== "home" &&
          button.icon !== "github",
      )
      .map((button, index) => ({
        ...button,
        priority: button.priority ?? actionButtons.length - index,
      }))
      .sort((a, b) => b.priority - a.priority);

    // Item 11 / L8 (docs/plans/2026-09-16-toolbar-search-feedback-spec.md):
    // every CONFIG-defined actionButton, surfaced as a trailing app-bar
    // kebab entry (top_bar.tsx's `menuItems`) — as of L13 (the toolbar
    // reduction, see floating_toolbar.tsx's header comment) this is the ONLY
    // render target left for these; the toolbar itself no longer takes an
    // `actions` prop at all. `icon` is
    // deliberately left unset here: `button.icon` is a feather-icon name
    // (APIs/Action Button.md: "feather icon to use for your button") — a
    // different vocabulary than `AppBarMenuItem.icon`'s Material Symbols
    // ligature string (top_bar.tsx). Reusing the raw feather name as a
    // Material Symbols glyph name would render nothing or the wrong glyph
    // for most of the icon set (verified: "activity"/"message-circle"/
    // "book"/"terminal"/"chevron-left" etc. are not Material Symbols names).
    // Text-only menu entries are correct here, not a placeholder.
    const configMenuItems: AppBarMenuItem[] = filteredActionButtons.map(
      (button, index): AppBarMenuItem => {
        let label = button.description || button.icon;
        if (button.command) {
          const cmd = viewState.commands.get(button.command);
          if (cmd) {
            const hint = keyboardHint(cmd);
            if (hint) label = `${label} (${hint})`;
          }
        }
        return {
          key: `config-action-${index}`,
          label,
          onClick: button.command
            ? () => this.client.runCommandByName(button.command!)
            : button.run ||
              (() => {
                this.flashNotification(
                  "actionButton did not specify a command or run() callback",
                  "error",
                );
              }),
        };
      },
    );

    // Breadcrumb segments for TopBar's <m3e-breadcrumb> (top_bar.tsx),
    // derived from the current page's path. SB has no literal folder/
    // directory concept — just a flat page-path namespace where "/" is an
    // ordinary character in the page NAME (verified: no "folder"/
    // "directory" concept anywhere in client/client.ts or
    // plug-api/lib/ref.ts; `client.navigate`/`startPageNavigate` only take
    // a `Ref` or a picker `mode`, never a path-prefix filter) — so there's
    // no real "open this folder's index page" target to invent:
    //  - the root "Space" segment reuses the exact real "Navigate: Home"
    //    command (plugs/editor/editor.plug.yaml's `navigateHome`, `page:
    //    ""` — the identical command the removed "home" actionButton used
    //    to run, see the filteredActionButtons filter above), guarded the same way
    //    readOnlyToggle already guards on command availability below.
    //  - intermediate "folder" segments (everything between the root and
    //    the final page-name segment) open the real, already-wired,
    //    unfiltered page picker (`client.startPageNavigate("page")`) — not
    //    a folder-prefix-filtered picker, since that would need new
    //    plumbing through reducer.ts/types/ui.ts/anything_picker.tsx (none
    //    of which this round touches); "search from here" is the closest
    //    real, non-invented affordance SB's own APIs support today.
    //  - the final segment is the current page itself: `current`, no
    //    onClick (see BreadcrumbItem's own doc in top_bar.tsx).
    const currentPageName = viewState.current
      ? getNameFromPath(viewState.current.path)
      : undefined;
    const pathSegments = currentPageName
      ? currentPageName.split("/").filter((s) => s.length > 0)
      : [];
    const breadcrumbItems: BreadcrumbItem[] = [
      {
        key: "sb-breadcrumb-root",
        label: "Space",
        current: pathSegments.length === 0,
        onClick: viewState.commands.has("Navigate: Home")
          ? () =>
            safeRun(async () => {
              await client.runCommandByName("Navigate: Home");
            })
          : undefined,
      },
      ...pathSegments.map((segment, i) => {
        const isLast = i === pathSegments.length - 1;
        return {
          key: `sb-breadcrumb-${i}`,
          label: segment,
          current: isLast,
          onClick: isLast ? undefined : () => client.startPageNavigate("page"),
        };
      }),
    ];

    // Shared by AnythingPicker (below) and SearchSheet's "open" mode — same
    // computation, one call instead of two.
    const documentExtensions = new Set(
      Array.from(
        client.clientSystem.documentEditorHook.documentEditors.values(),
      ).flatMap(({ extensions }) => extensions),
    );

    // Item 11 / L8: trailing app-bar kebab contents (top_bar.tsx's
    // `menuItems` prop, shell built in L6/L7). Three sources, in display
    // order: the Web Push toggle (all 8 `pushState` labels preserved as-is
    // via the existing `pushToggle`/`PUSH_TOGGLE_LABELS` above — undefined
    // during the one-time "checking" state, same as the floating toolbar's
    // own `{pushToggle && (...)}` guard, so that state simply omits the
    // item rather than rendering something misleading), a CONFIG-page link,
    // then every CONFIG-defined actionButton (`configMenuItems` above).
    const pushMenuItem: AppBarMenuItem | undefined = pushToggle && {
      key: "push-toggle",
      icon: pushToggle.unavailable
        ? "notifications_off"
        : pushToggle.active
        ? "notifications_active"
        : "notifications",
      label: pushToggle.label,
      disabled: pushToggle.unavailable || pushToggle.pending,
      onClick: pushToggle.onClick,
    };

    // No dedicated "open the CONFIG page" command exists in
    // `viewState.commands` — "Configuration: Open" (Cmd/Ctrl-,,
    // plugs/configuration-manager) opens a different thing, a rich
    // settings-manager panel (schemas/values/categories editor), not plain
    // page navigation. `client.navigate({ path: "CONFIG" })` is the direct,
    // already-established pattern in this file for jumping straight to a
    // named page (see the recent-pages item below), and is what the
    // configuration-manager plug's own `openConfigPage()` does via the
    // equivalent plug-side syscall (`editor.navigate("CONFIG")`,
    // plugs/configuration-manager/ui/components/app.tsx) — so this mirrors
    // a real, already-used code path rather than inventing a new one.
    const configLinkItem: AppBarMenuItem = {
      key: "open-config",
      icon: "settings",
      label: "Open Config",
      onClick: () =>
        safeRun(async () => {
          await client.navigate({ path: "CONFIG.md" as Path });
        }),
    };

    const menuItems: AppBarMenuItem[] = [
      ...(pushMenuItem ? [pushMenuItem] : []),
      configLinkItem,
      ...configMenuItems,
    ];

    return (
      // m3e components read Material color-role tokens (--md-sys-color-*)
      // that only exist once something computes them — @m3e/web ships no
      // static/baseline fallback for them anywhere in its bundle, they're
      // set entirely at runtime by m3e-theme. Without this wrapper every
      // m3e-app-bar/m3e-icon-button/m3e-search-view/m3e-list in the tree
      // renders against unset custom properties (verified directly against
      // node_modules/@m3e/web/dist/{core,theme}.js — zero static
      // `--md-sys-color-*: value` definitions anywhere, only
      // `--md-sys-color-${role}` built and .setProperty'd by ThemeElement).
      // m3e-theme is `display: contents`, so swapping it in for the bare
      // Fragment this used to be has no layout effect.
      // Seed color is SB's own accent, read at mount from the computed
      // `--ui-accent-color` custom property (client/styles/_tokens.scss;
      // theme.scss overrides it per scheme; a space's CONFIG.md can
      // override it further) — see the `accentColor` useState above — not
      // a guessed or hardcoded brand color. That keeps a space that
      // recolors its own accent in sync with m3e's Material color roles
      // instead of the two silently diverging. scheme mirrors the same
      // darkMode resolution the effect above already applies to
      // `document.documentElement.dataset.theme`, so m3e and SB's own
      // Flexoki theme never disagree about light/dark.
      <m3e-theme
        color={accentColor}
        scheme={
          viewState.uiOptions.darkMode === undefined
            ? "auto"
            : viewState.uiOptions.darkMode
              ? "dark"
              : "light"
        }
      >
        {viewState.showPageNavigator && (
          <AnythingPicker
            allDocuments={viewState.allDocuments}
            allPages={viewState.allPages}
            extensions={documentExtensions}
            currentPath={client.currentPath()}
            mode={viewState.pageNavigatorMode}
            darkMode={viewState.uiOptions.darkMode}
            onModeSwitch={(mode) => {
              dispatch({ type: "stop-navigate" });
              setTimeout(() => {
                dispatch({ type: "start-navigate", mode });
              });
            }}
            onNavigate={(name) =>
              navigateToAnythingPickerName(name, () =>
                dispatch({ type: "stop-navigate" }))}
            onNavigateRef={(ref) =>
              navigateToAnythingPickerRef(ref, () =>
                dispatch({ type: "stop-navigate" }))}
          />
        )}
        {viewState.showCommandPalette && (
          <CommandPalette
            onTrigger={(cmd) =>
              triggerCommand(cmd, () => dispatch({ type: "hide-palette" }))}
            commands={client.getCommandsByContext(viewState)}
            darkMode={viewState.uiOptions.darkMode}
          />
        )}
        {viewState.showFilterBox && (
          <FilterList
            label={viewState.filterBoxLabel}
            placeholder={viewState.filterBoxPlaceHolder}
            options={viewState.filterBoxOptions}
            darkMode={viewState.uiOptions.darkMode}
            allowNew={false}
            helpText={viewState.filterBoxHelpText}
            onSelect={viewState.filterBoxOnSelect}
          />
        )}
        {viewState.showPrompt && (
          <Prompt
            message={viewState.promptMessage!}
            defaultValue={viewState.promptDefaultValue}
            darkMode={viewState.uiOptions.darkMode}
            callback={(value) => {
              dispatch({ type: "hide-prompt" });
              viewState.promptCallback!(value);
            }}
          />
        )}
        {viewState.showConfirm && (
          <Confirm
            message={viewState.confirmMessage!}
            destructive={viewState.confirmDestructive}
            callback={(value) => {
              dispatch({ type: "hide-confirm" });
              viewState.confirmCallback!(value);
            }}
          />
        )}
        <TopBar
          pageName={
            !viewState.current ? "" : getNameFromPath(viewState.current.path)
          }
          isOnline={viewState.isOnline}
          unsavedChanges={viewState.unsavedChanges}
          isLoading={viewState.isLoading}
          progressPercentage={viewState.progressPercentage}
          progressType={viewState.progressType}
          onRename={async (newName) => {
            if (client.contentManager.isDocumentEditor()) {
              if (!newName) return;

              console.log("Now renaming document to...", newName);
              await client.clientSystem.system.invokeFunction(
                "index.renameDocumentCommand",
                [{ document: newName }],
              );
            } else {
              if (!newName) {
                // Always move cursor to the start of the page
                client.editorView.dispatch({
                  selection: { anchor: 0 },
                });
                client.focus();
                return;
              }
              console.log("Now renaming page to...", newName);
              await client.clientSystem.system.invokeFunction(
                "index.renamePageCommand",
                [{ page: newName }],
              );
              client.focus();
            }
          }}
          rhs={
            !!viewState.panels.rhs.mode && (
              <div
                className="panel"
                style={{ flex: viewState.panels.rhs.mode }}
              />
            )
          }
          lhs={
            !!viewState.panels.lhs.mode && (
              <div
                className="panel"
                style={{ flex: viewState.panels.lhs.mode }}
              />
            )
          }
          pageNamePrefix={
            client.currentPageMeta()?.pageDecoration?.prefix ?? ""
          }
          cssClass={(client.currentPageMeta()?.pageDecoration?.cssClasses ?? [])
            .join(" ")
            .replaceAll(/[^a-zA-Z0-9-_ ]/g, "")}
          mobileMenuStyle={
            viewState.isMobile
              ? client.config.get<string>("mobileMenuStyle", "hamburger")
              : undefined
          }
          readOnly={isReadOnly}
          breadcrumbItems={breadcrumbItems}
          scrollContainerId={EDITOR_SCROLL_CONTAINER_ID}
          headerScrolled={headerScrolled}
          menuItems={menuItems}
        />
        <m3e-drawer-container
          id="sb-main"
          start={viewState.panels.lhs.mode !== undefined}
          start-mode="side"
          end={viewState.panels.rhs.mode !== undefined}
          end-mode="side"
        >
          {viewState.panels.lhs.mode !== undefined && (
            <div slot="start" id="sb-panel-lhs" className="sb-panel-drawer">
              <m3e-icon-button
                className="sb-panel-drawer-close"
                aria-label="Close panel"
                onClick={() => dispatch({ type: "hide-panel", id: "lhs" })}
              >
                <m3e-drawer-toggle for="sb-panel-lhs" />
                <m3e-icon name="close" />
              </m3e-icon-button>
              <Panel config={viewState.panels.lhs} editor={client} />
            </div>
          )}
          <div id="sb-editor" />
          {viewState.panels.rhs.mode !== undefined && (
            <div slot="end" id="sb-panel-rhs" className="sb-panel-drawer">
              <m3e-icon-button
                className="sb-panel-drawer-close"
                aria-label="Close panel"
                onClick={() => dispatch({ type: "hide-panel", id: "rhs" })}
              >
                <m3e-drawer-toggle for="sb-panel-rhs" />
                <m3e-icon name="close" />
              </m3e-icon-button>
              <Panel config={viewState.panels.rhs} editor={client} />
            </div>
          )}
        </m3e-drawer-container>
        {viewState.panels.modal.mode !== undefined && (
          <div className="sb-modal-backdrop">
            <div
              className="sb-modal"
              style={{ inset: `${viewState.panels.modal.mode}px` }}
            >
              <Panel config={viewState.panels.modal} editor={client} />
            </div>
          </div>
        )}
        {viewState.panels.bhs.mode !== undefined && (
          <div className="sb-bhs">
            <Panel config={viewState.panels.bhs} editor={client} />
          </div>
        )}
        {
          // Bottom nav bar + FAB (2026-09-17 nav-bar redesign spec, leaves
          // N2+N3) — replaces the old floating vertical toolbar entirely.
          // Journal is an action-only item (no panel, spec §2.4); the other
          // four are destinations whose panels are placeholders until N5-N9
          // relocate the real Recent/Search/Run/Notifications views here.
          //
          // The read-only toggle's old toolbar-icon-button home is gone
          // with the toolbar; its new home is the app-bar kebab (spec's
          // leaf N10, not yet landed) — a deliberate, temporary gap in this
          // 12-leaf sequential rollout, same as the Search panel's
          // placeholder content until N7.
        }
        <NavBar
          navDestination={viewState.navDestination}
          journal={{
            available: viewState.commands.has("Journal: Today"),
            onClick: () =>
              safeRun(async () => {
                await client.runCommandByName("Journal: Today");
              }),
          }}
          onSelectDestination={(destination) =>
            dispatch({ type: "select-nav-destination", destination })}
          onCloseDestination={() => dispatch({ type: "close-nav-panel" })}
        />
        <Fab onClick={() => setCaptureSheetOpen(true)} />
        {viewState.navDestination !== null && (
          <div className="sb-nav-panel" role="region">
            {NAV_PANEL_PLACEHOLDERS[viewState.navDestination]}
          </div>
        )}
        <ItemCaptureSheet
          open={captureSheetOpen}
          onCancel={() => setCaptureSheetOpen(false)}
          onSubmit={(type, text) =>
            safeRun(async () => {
              // Reuses the exact same per-type capture behavior the old
              // fab-menu's 5 `newMenuItems` ran inline; note is the one
              // type that doesn't write via `writeCaptureItemPage` — it
              // validates the name and navigates, same
              // `isValidName`/`parseToRef`/`client.open` path the page
              // picker's own "type a name that doesn't exist yet" flow
              // already uses, see the `onNavigate` handler above rather
              // than reinventing page creation) — only the entry point
              // changed, from 5 separate fab-menu items (each with its own
              // `this.prompt()` round-trip) to this one sheet's type
              // selector + submit.
              switch (type) {
                case "task":
                  await writeCaptureItemPage(client, "task", `* [ ] ${text}`);
                  this.flashNotification(`Task added: ${text}`);
                  break;
                case "event":
                  await writeCaptureItemPage(client, "event", text);
                  this.flashNotification(`Event added: ${text}`);
                  break;
                case "contact":
                  await writeCaptureItemPage(client, "contact", text);
                  this.flashNotification(`Contact added: ${text}`);
                  break;
                case "idea":
                  await writeCaptureItemPage(client, "idea", text);
                  this.flashNotification("Idea captured");
                  break;
                case "note": {
                  // For this one type, the sheet's shared text field is
                  // doubling as the page NAME rather than page content —
                  // see item_capture_sheet.tsx's `isNote` comment for why
                  // that's a deliberate, single-field design rather than a
                  // separate note-only form. Validate the same way the old
                  // "New note" prompt did; leave the sheet open (don't fall
                  // through to setCaptureSheetOpen below) so an invalid name
                  // can be corrected in place instead of losing the draft.
                  const ref = parseToRef(text);
                  if (!isValidName(text) || !ref) {
                    this.flashNotification(
                      `Couldn't create page ${text}, name is invalid`,
                      "error",
                    );
                    return;
                  }
                  await client.open(ref);
                  break;
                }
              }
              setCaptureSheetOpen(false);
            })
          }
        />
      </m3e-theme>
    );
  }

  render(container: Element) {
    // const ViewComponent = this.ui.ViewComponent.bind(this.ui);
    container.innerHTML = "";
    preactRender(h(this.ViewComponent.bind(this), {}), container);
  }

  async promptDocumentOperation(path: Path, msg: string) {
    const options: string[] = ["View", "Delete", "Rename"];

    const option = await this.filterBox(
      "Modify",
      options.map((x) => ({ name: x }) as FilterOption),
      msg,
    );
    if (!option) return;

    switch (option.name) {
      case "View": {
        await this.client.open({ path: path });
        break;
      }
      case "Delete": {
        if (
          await this.confirm(
            `Are you sure you would like delete ${getNameFromPath(path)}?`,
            { destructive: true },
          )
        ) {
          if (isMarkdownPath(path)) {
            await this.client.space.deletePage(getNameFromPath(path));
          } else {
            await this.client.space.deleteDocument(getNameFromPath(path));
          }
        }
        break;
      }
      case "Rename": {
        if (isMarkdownPath(path)) {
          await this.client.clientSystem.system.invokeFunction(
            "index.renamePageCommand",
            [{ oldPage: getNameFromPath(path) }],
          );
        } else {
          await this.client.clientSystem.system.invokeFunction(
            "index.renameDocumentCommand",
            [{ oldDocument: getNameFromPath(path) }],
          );
        }
        break;
      }
    }
  }
}

// Raw shape of a space-config `actionButtons` entry (CONFIG.md), as read
// from `client.config.get<ActionButtonConfig[]>("actionButtons", [])` above.
// `filteredActionButtons`'s `.map()` (above) turns this unresolved config
// record (`icon` a string name, `command` a string to look up) into
// `AppBarMenuItem`s (top_bar.tsx) for the app-bar kebab — its only render
// target as of L13 (floating_toolbar.tsx no longer has an `actions` prop at
// all; see that file's header comment).
type ActionButtonConfig = {
  icon: string;
  description?: string;
  command?: string;
  mobile?: boolean;
  standalone?: boolean;
  dropdown?: boolean;
  priority?: number;
  run?: () => void;
};
