import { closeSearchPanel } from "@codemirror/search";
import { runScopeHandlers } from "@codemirror/view";
// Global custom-element registration for `<m3e-assist-chip>` (tag pills, both
// in the live CodeMirror editor via codemirror/hashtag.ts, and in rendered
// markdown/widgets via markdown_renderer/markdown_render.ts's Hashtag case).
// This is the browser-only app root, so one side-effect import here covers
// every module that renders the tag — those modules can't import it
// themselves because they're also loaded by plain-Node vitest unit tests
// with no DOM (see frontmatter_folding.test.ts's `domTest` guard; a
// LitElement class throws immediately at import time without a global
// `HTMLElement`).
import "@m3e/web/chips";
// Global custom-element registration for the navigator panel's m3e reskin
// (client/navigator/ui/components/{nav_root,dock_menu,content_view,
// loading_indicator}.tsx) -- same reason as the chips import just above:
// this is the browser-only app root, and none of those files may
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
// DOM-side consumer must, and this app root is the one that covers
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
import { getNameFromPath } from "@silverbulletmd/silverbullet/lib/ref";
import type {
  FilterOption,
  NotificationAction,
  NotificationType,
} from "@silverbulletmd/silverbullet/type/client";
import { notificationDismissTimeouts } from "@silverbulletmd/silverbullet/type/client";
import { h, render as preactRender } from "preact";
import { useEffect, useMemo, useReducer, useState } from "preact/hooks";
import * as featherIcons from "preact-feather";
import { isMacLike, keyboardHint } from "../plug-api/lib/shortcut.ts";
import {
  type ConfiguredActionButton,
  visibleActionButtons,
} from "./action_buttons.ts";
import type { Client } from "./client.ts";
import { AnchoredMenu } from "./components/anchored_menu.tsx";
import { Confirm, Prompt } from "./components/basic_modals.tsx";
import { findFrontmatterBlock } from "./codemirror/frontmatter_folding.ts";
import { FilterList } from "./components/filter.tsx";
import { FloatingToolbar } from "./components/floating_toolbar.tsx";
import { Panel } from "./components/panel.tsx";
import {
  editorProfileMenuItems,
  ProfileAvatar,
  profileMenuHeader,
  profileMenuLabel,
} from "./components/profile_button.tsx";
import { type BreadcrumbItem, TopBar } from "./components/top_bar.tsx";
import * as mdi from "./filtered_material_icons.ts";
import { kebabToPascal } from "./lib/feather_icons.ts";
import { accentSeed } from "./lib/theme_seed.ts";
import { RevisionPreviewModal } from "./navigator/ui/components/revision_preview.tsx";
import { NavigatorDock, NavigatorModal } from "./navigator/ui/panels.tsx";
import { useNavigatorSlot } from "./navigator/ui/slots.ts";
import { loadProfile, type ProfileState } from "./profile.ts";
import reducer from "./reducer.ts";
import {
  type Action,
  type AppViewState,
  initialViewState,
} from "./types/ui.ts";

// _tokens.scss's own `--ui-accent-color` default -- used only if the
// computed custom property can't be read at all (e.g. no matching rule).
const FALLBACK_ACCENT = "#3569b8";

// Page body minus frontmatter, for the app bar's "N min read" subtitle.
// `editorView` is unset on MainUI's first render (fork `1f8b8943`).
function computeBodyText(client: Client): string {
  const state = client.editorView?.state;
  if (!state) return "";
  const block = findFrontmatterBlock(state);
  return block ? state.sliceDoc(block.to) : state.sliceDoc();
}

export class MainUI {
  viewState: AppViewState = initialViewState;

  constructor(private client: Client) {
    // Safari treats Cmd-O as its own "Open File..." shortcut and wins before
    // any bubble-phase listener -- including CodeMirror's own keymap and the
    // bubble-phase fallback right below -- ever sees the keydown. Caught here
    // at capture phase, ahead of that default, and only prevented when a
    // handler actually claims it (an unbound Cmd-O still opens Safari's
    // dialog, same as before). `stopPropagation` keeps the bubble-phase
    // listeners from also matching the same chord and running it twice.
    globalThis.addEventListener(
      "keydown",
      (ev) => {
        if (
          ev.target instanceof Element &&
          ev.target.closest(".sb-anchored-menu")
        )
          return;
        const cmd = isMacLike ? ev.metaKey : ev.ctrlKey;
        if (!cmd || ev.altKey || ev.shiftKey || ev.key.toLowerCase() !== "o") {
          return;
        }
        if (runScopeHandlers(client.editorView, ev, "editor")) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      },
      { capture: true },
    );

    // Make keyboard shortcuts work even when the editor is in read only mode or not focused
    globalThis.addEventListener("keydown", (ev) => {
      if (!client.editorView.hasFocus) {
        const target = ev.target as HTMLElement;
        if (target.className === "cm-textfield" && ev.key === "Escape") {
          console.log("Closing search panel");
          closeSearchPanel(client.editorView);
          return;
        } else if (
          target.className === "cm-textfield" ||
          target.closest(".cm-content") ||
          target.closest(".cm-vim-panel")
        ) {
          return;
        } else if (
          target.closest('input, textarea, select, [contenteditable="true"]')
        ) {
          // Let native fields handle typing, navigation, and editing shortcuts while
          // forwarding command shortcuts such as Cmd-K.
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
        }
        if (runScopeHandlers(client.editorView, ev, "editor")) {
          ev.preventDefault();
        }
      }
    });

    globalThis.addEventListener("touchstart", (ev) => {
      if (ev.touches.length === 2) {
        ev.stopPropagation();
        ev.preventDefault();
        void client.startPageNavigate("page");
      }
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

  private progressMap = new Map<
    "index" | "sync",
    {
      percentage: number;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();

  viewDispatch: (action: Action) => void = () => {};

  flashNotification(
    message: string,
    type: NotificationType = "info",
    options?: {
      timeout?: number;
      actions?: NotificationAction[];
    },
  ): number {
    const id = Math.floor(Math.random() * 1000000);
    const dismiss = () => {
      this.viewDispatch({ type: "dismiss-notification", id });
    };
    const persistent = options?.timeout === 0;
    const actions = options?.actions?.map((action) => ({
      name: action.name,
      run: () => {
        action.run();
        dismiss();
      },
    }));
    this.viewDispatch({
      type: "show-notification",
      notification: {
        id,
        type,
        message,
        date: new Date(),
        actions,
        persistent,
      },
    });
    if (!persistent) {
      const timeout = options?.timeout ?? notificationDismissTimeouts[type];
      setTimeout(dismiss, timeout);
    }
    return id;
  }

  dismissNotification(id: number) {
    this.viewDispatch({ type: "dismiss-notification", id });
  }

  private dispatchProgressState() {
    if (this.progressMap.size === 0) {
      this.viewDispatch({ type: "set-progress" });
      return;
    }

    // Sync takes precedence over index so the indicator
    // doesn't flip between the two when both streams are firing.
    const progressType: "sync" | "index" = this.progressMap.has("sync")
      ? "sync"
      : "index";
    const entry = this.progressMap.get(progressType);
    if (entry) {
      this.viewDispatch({
        type: "set-progress",
        progressPercentage: entry.percentage,
        progressType,
      });
    }
  }

  private removeProgressType(progressType: "index" | "sync") {
    const entry = this.progressMap.get(progressType);
    if (entry) {
      clearTimeout(entry.timeout);
      this.progressMap.delete(progressType);
    }
  }

  showProgress(progressType: "sync" | "index", progressPercentage?: number) {
    this.removeProgressType(progressType);

    if (progressPercentage !== undefined) {
      const timeout = setTimeout(() => {
        this.removeProgressType(progressType);
        this.dispatchProgressState();
      }, 5000);
      this.progressMap.set(progressType, {
        percentage: progressPercentage,
        timeout,
      });
    }

    this.dispatchProgressState();
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

    const client = this.client;

    // Single source of truth for read-only state — same expression that
    // used to be inlined at TopBar's `readOnly` prop below, now also
    // driving whether the Std library's static "lock" actionButton is
    // filtered out in favor of TopBar's own live toggle.
    const isReadOnly =
      viewState.uiOptions.forcedROMode || client.bootConfig.readOnly;

    // Loaded once on mount, not polled or re-fetched on navigation
    const [profile, setProfile] = useState<ProfileState>({
      status: "unavailable",
    });
    useEffect(() => {
      // `/.spaces/*` only exists on account-managed servers; asking for it
      // anywhere else is a guaranteed 404 on every boot.
      if (!client.bootConfig.accountManaged) return;
      void loadProfile().then(setProfile);
    }, []);

    const [menuTrigger, setMenuTrigger] = useState<HTMLElement | undefined>(
      undefined,
    );

    // `<m3e-theme>`'s color seed. Read once on mount and again whenever a
    // space style finishes loading (`loadCustomStyles` sets `customStyles`
    // after the `#custom-styles` stylesheet is in the DOM) -- a space style
    // overriding `--ui-accent-color` only takes effect on the *next* read of
    // the computed value, not retroactively on an already-read one.
    const [themeColor, setThemeColor] = useState(FALLBACK_ACCENT);
    useEffect(() => {
      const computed = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--ui-accent-color");
      setThemeColor(accentSeed(computed, FALLBACK_ACCENT));
    }, [viewState.uiOptions.customStyles]);

    const themeScheme =
      viewState.uiOptions.darkMode === undefined
        ? "auto"
        : viewState.uiOptions.darkMode
          ? "dark"
          : "light";

    const navSlots = {
      lhs: useNavigatorSlot("lhs"),
      rhs: useNavigatorSlot("rhs"),
      bhs: useNavigatorSlot("bhs"),
      modal: useNavigatorSlot("modal"),
    };

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

    // A navigator dock reserves top-bar space the same way a plug's own
    // sidebar panel does, falling back to that panel's mode when no dock is
    // open so nothing changes for a plug that has one.
    const sidebarSpacer = (slot: "lhs" | "rhs") => {
      const mode = navSlots[slot]?.mode ?? viewState.panels[slot].mode;
      if (!mode) {
        return false;
      }
      // The navigator's spacer deliberately doesn't carry the classic "panel"
      // class: space styles that target `#sb-top .panel` (a common hack to
      // neutralize the classic spacer) would otherwise break the title
      // alignment this spacer exists for.
      return (
        <div
          className={navSlots[slot] ? "sb-nav-spacer" : "panel"}
          style={{ flex: mode }}
        />
      );
    };
    const navDockSignature = (["lhs", "rhs"] as const)
      .map((slot) => `${slot}:${navSlots[slot]?.mode ?? ""}`)
      .join(",");

    useEffect(() => {
      // Need to dispatch a resize event so that the top_bar can pick it up
      globalThis.dispatchEvent(new Event("resize"));
    }, [viewState.panels, navDockSignature]);

    const actionButtons = client.config.get<ConfiguredActionButton[]>(
      "actionButtons",
      [],
    );
    // A fresh component identity would remount the avatar on every
    // top-bar render, and the top bar re-renders on sync progress.
    const profileAvatarComponent = useMemo(
      () => ProfileAvatar(profile),
      [profile],
    );
    // Gates both TopBar's own live toggle (below) and the Std static
    // "lock" button filter (visibleActionButtons) — undefined when the
    // command isn't registered (e.g. system.getMode() !== "rw", see
    // "Read Only Mode.md"), same guard the fork used.
    const readOnlyToggleShown = viewState.commands.has(
      "Editor: Toggle Read Only Mode",
    );

    // App-bar breadcrumb: root runs "Navigate: Home", intermediate segments
    // open the page navigator, the last segment is the current page.
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
          ? () => void client.runCommandByName("Navigate: Home")
          : undefined,
      },
      ...pathSegments.map((segment, i) => {
        const isLast = i === pathSegments.length - 1;
        return {
          key: `sb-breadcrumb-${i}`,
          label: segment,
          current: isLast,
          onClick: isLast
            ? undefined
            : () => void client.startPageNavigate("page"),
        };
      }),
    ];

    // Only one modal may occupy the slot; close the plug panel before the
    // navigator takes its backdrop and focus.
    const plugModalMode = viewState.panels.modal.mode;
    useEffect(() => {
      if (navSlots.modal && plugModalMode !== undefined) {
        dispatch({ type: "hide-panel", id: "modal" });
      }
    }, [navSlots.modal, plugModalMode]);
    const modalVisible = plugModalMode !== undefined && !navSlots.modal;
    const modalInset = plugModalMode;
    // PanelMode is a px inset (number) or a CSS length (string); m3e-dialog
    // has no inset, so it becomes explicit width/max-height tokens.
    const modalDialogWidth = typeof modalInset === "number"
      ? `calc(100% - ${modalInset * 2}px)`
      : `calc(100% - 2 * (${modalInset}))`;
    const modalDialogHeight = typeof modalInset === "number"
      ? `calc(100dvh - ${modalInset * 2}px)`
      : `calc(100dvh - 2 * (${modalInset}))`;
    // m3e-dialog's `.base` only caps height, so `.sb-modal` needs an explicit
    // one; reserve ~88px for the dialog's own header row inside the cap.
    const modalPanelHeight =
      `calc(${modalDialogHeight} - 88px)`;

    const bhsVisible = viewState.panels.bhs.mode !== undefined;
    const plugBhsMode = viewState.panels.bhs.mode;
    useEffect(() => {
      if (navSlots.bhs && plugBhsMode !== undefined) {
        dispatch({ type: "hide-panel", id: "bhs" });
      }
    }, [navSlots.bhs, plugBhsMode]);

    return (
      <m3e-theme color={themeColor} scheme={themeScheme}>
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
          notifications={viewState.notifications}
          onDismissNotification={(id) => {
            dispatch({ type: "dismiss-notification", id });
          }}
          isOnline={viewState.isOnline}
          unsavedChanges={viewState.unsavedChanges}
          isLoading={viewState.isLoading}
          progressPercentage={viewState.progressPercentage}
          progressType={viewState.progressType}
          progressWithLabel={
            !client.fullIndexCompleted || client.objectIndex.rebuildInProgress
          }
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
          actionButtons={[
            ...(viewState.isMobile &&
            client.config
              .get<string>("mobileMenuStyle", "hamburger")
              .includes("hamburger")
              ? [
                  {
                    icon: featherIcons.Menu,
                    description: "Open Menu",
                    class: "expander",
                    callback: () => {
                      document
                        .querySelector("#sb-top .sb-actions.hamburger")
                        ?.classList.toggle("open");
                    },
                  },
                ]
              : []),
            ...visibleActionButtons(actionButtons, {
              isMobile: viewState.isMobile,
              isStandalone: viewState.isStandalone,
              accountManaged: !!client.bootConfig.accountManaged,
              readOnlyToggleShown,
            })
              // Until the profile request settles we do not know who the
              // visitor is, and offering "Log in" to someone who is signed in
              // is worse than offering nothing.
              .filter(
                (button) =>
                  button.icon !== "profile" || profile.status !== "unavailable",
              )
              .map((button) => {
                const isProfileButton = button.icon === "profile";
                const iconName = kebabToPascal(button.icon);
                const mdiIcon = (mdi as any)[iconName];
                let featherIcon = (featherIcons as any)[iconName];
                if (!featherIcon) {
                  featherIcon = featherIcons.HelpCircle;
                }
                let description = button.description || "";
                if (button.command) {
                  const cmd = viewState.commands.get(button.command);
                  if (cmd) {
                    const hint = keyboardHint(cmd);
                    if (hint) {
                      description = description
                        ? `${description} (${hint})`
                        : hint;
                    }
                  }
                }

                return {
                  icon: isProfileButton
                    ? profileAvatarComponent
                    : mdiIcon
                      ? mdiIcon
                      : featherIcon,
                  description,
                  dropdown: button.dropdown,
                  native: isProfileButton,
                  hasPopup: isProfileButton ? true : undefined,
                  expanded: isProfileButton
                    ? menuTrigger !== undefined
                    : undefined,
                  callback: isProfileButton
                    ? (el?: HTMLElement) => {
                        const items = editorProfileMenuItems(profile, client);
                        if (viewState.isMobile || !el) {
                          void client.ui
                            .filterBox(
                              profileMenuLabel(profile),
                              items.map((i) => ({ name: i.name })),
                            )
                            .then((selected) => {
                              items
                                .find((i) => i.name === selected?.name)
                                ?.run();
                            });
                          return;
                        }
                        setMenuTrigger((current) =>
                          current === el ? undefined : el,
                        );
                      }
                    : button.command
                      ? () => this.client.runCommandByName(button.command!)
                      : button.run ||
                        (() => {
                          this.flashNotification(
                            "actionButton did not specify a command or run() callback",
                            "error",
                          );
                        }),
                  href: "",
                };
              }),
          ]}
          rhs={sidebarSpacer("rhs")}
          lhs={sidebarSpacer("lhs")}
          pageNamePrefix={
            client.currentPageMeta()?.pageDecoration?.prefix ?? ""
          }
          pageIcon={client.currentPageMeta()?.pageDecoration?.icon}
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
          lastModified={client.currentPageMeta()?.lastModified}
          bodyText={computeBodyText(client)}
          readOnlyToggle={
            readOnlyToggleShown
              ? {
                  active: isReadOnly,
                  label: isReadOnly ? "Disable read-only" : "Enable read-only",
                  onClick: () => {
                    void client.runCommandByName(
                      "Editor: Toggle Read Only Mode",
                    );
                  },
                }
              : undefined
          }
        />
        {menuTrigger && (
          <AnchoredMenu
            trigger={menuTrigger}
            header={profileMenuHeader(profile)}
            items={editorProfileMenuItems(profile, client)}
            onClose={() => setMenuTrigger(undefined)}
          />
        )}
        <FloatingToolbar
          onSearchClick={() => {
            void client.startPageNavigate("page");
          }}
          journal={{
            available: viewState.commands.has("Journal: Today"),
            onClick: () => {
              void client.runCommandByName("Journal: Today");
            },
          }}
        />
        <div id="sb-main">
          <NavigatorDock slot="lhs" state={navSlots.lhs} client={client} />
          {viewState.panels.lhs.mode !== undefined && (
            <Panel config={viewState.panels.lhs} editor={client} slot="lhs" />
          )}
          <div id="sb-editor" />
          {viewState.panels.rhs.mode !== undefined && (
            <Panel config={viewState.panels.rhs} editor={client} slot="rhs" />
          )}
          <NavigatorDock slot="rhs" state={navSlots.rhs} client={client} />
        </div>
        <NavigatorModal state={navSlots.modal} client={client} />
        <RevisionPreviewModal />
        {modalVisible && (
          // Escape/backdrop close -> one `closed` event -> one hide-panel.
          // Inner `.sb-modal` kept: extensions.test.ts targets `.sb-modal iframe`.
          <m3e-dialog
            open
            style={{
              "--m3e-dialog-min-width": modalDialogWidth,
              "--m3e-dialog-max-width": modalDialogWidth,
              "--m3e-dialog-max-height": modalDialogHeight,
            }}
            onclosed={() => dispatch({ type: "hide-panel", id: "modal" })}
          >
            <div
              className="sb-modal"
              style={{
                position: "relative",
                width: "100%",
                height: modalPanelHeight,
              }}
            >
              <Panel
                config={viewState.panels.modal}
                editor={client}
                slot="modal"
              />
            </div>
          </m3e-dialog>
        )}
        {navSlots.bhs ? (
          <div className="sb-bhs" style={{ flex: navSlots.bhs.mode }}>
            <NavigatorDock slot="bhs" state={navSlots.bhs} client={client} />
          </div>
        ) : bhsVisible ? (
          <div className="sb-bhs">
            <Panel config={viewState.panels.bhs} editor={client} slot="bhs" />
          </div>
        ) : null}
      </m3e-theme>
    );
  }

  render(container: Element) {
    container.innerHTML = "";
    preactRender(h(this.ViewComponent.bind(this), {}), container);
  }
}
