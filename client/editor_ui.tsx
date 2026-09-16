import { Confirm, Prompt } from "./components/basic_modals.tsx";
import { CommandPalette, keyboardHint } from "./components/command_palette.tsx";
import { FilterList } from "./components/filter.tsx";
import { AnythingPicker } from "./components/anything_picker.tsx";
import { TopBar } from "./components/top_bar.tsx";
import { FloatingToolbar } from "./components/floating_toolbar.tsx";
import { IdeaCaptureSheet } from "./components/idea_capture_sheet.tsx";
import reducer from "./reducer.ts";
import {
  type Action,
  type AppViewState,
  initialViewState,
} from "./types/ui.ts";
import * as featherIcons from "preact-feather";
import * as mdi from "./filtered_material_icons.ts";
import "@m3e/web/theme";
import "@m3e/web/snackbar";
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
  getPathExtension,
  isMarkdownPath,
  isValidName,
  parseToRef,
  type Path,
} from "@silverbulletmd/silverbullet/lib/ref";

// Quick-capture helper for the FAB speed-dial's "New task"/"Jot down an
// idea" items: append one line to a dedicated inbox page (created on first
// use), no navigation. This is the generic, schema-free capture mechanism —
// it only assumes SB's own core task notation (`* [ ] text`, see
// docs/Task.md, indexed automatically wherever it appears) and a plain
// bullet for ideas, not any space-specific `tag.define`d shape (a given
// space, e.g. a bare demo space, may not define one). Zero-navigation is
// the point: capture without leaving whatever page you were on.
async function appendCaptureLine(
  client: Client,
  pageName: string,
  header: string,
  line: string,
): Promise<void> {
  let text: string;
  try {
    text = (await client.space.readPage(pageName)).text;
  } catch {
    text = `${header}\n\n`;
  }
  const separator = text.endsWith("\n") ? "" : "\n";
  await client.space.writePage(pageName, `${text}${separator}${line}\n`);
}

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
  // One real simplification, noted rather than hidden: m3e-snackbar has no
  // `type`/severity attribute (single neutral Material style), so error/
  // warning severity is now conveyed by a text prefix instead of color. The
  // old system also allowed multiple stacked toasts; Material's snackbar
  // pattern is deliberately one-at-a-time (`M3eSnackbarElement.current`), so
  // a second flashNotification while one is showing replaces it rather than
  // stacking — matches the component's own designed behavior, not a bug.
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
    // Controls the "Jot down an idea" m3e-bottom-sheet (floating toolbar's
    // New menu) — fully Preact-controlled, see idea_capture_sheet.tsx.
    const [ideaSheetOpen, setIdeaSheetOpen] = useState(false);

    const client = this.client;

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
    const actionButtons = client.config.get<ActionButton[]>(
      "actionButtons",
      [],
    );
    // Same filter/priority/icon-resolution logic the old TopBar
    // `actionButtons` prop used to run inline — moved here, unchanged,
    // because it's now shared: the floating toolbar is the only consumer
    // (the app bar's kebab is gone), not TopBar.
    const toolbarActions = actionButtons
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
            button.description === "Toggle read-only mode"),
      )
      .map((button, index) => ({
        ...button,
        priority: button.priority ?? actionButtons.length - index,
      }))
      .sort((a, b) => b.priority - a.priority)
      .map((button) => {
        const mdiIcon = (mdi as any)[kebabToCamel(button.icon)];
        let featherIcon = (featherIcons as any)[kebabToCamel(button.icon)];
        if (!featherIcon) {
          featherIcon = featherIcons.HelpCircle;
        }
        let description = button.description || "";
        if (button.command) {
          const cmd = viewState.commands.get(button.command);
          if (cmd) {
            const hint = keyboardHint(cmd);
            if (hint) {
              description = description ? `${description} (${hint})` : hint;
            }
          }
        }
        return {
          icon: mdiIcon ? mdiIcon : featherIcon,
          description,
          callback: button.command
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
      });
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
      // Seed color is SB's own accent (client/styles/_tokens.scss
      // `--ui-accent-color: #464cfc`), not a guessed brand color. scheme
      // mirrors the same darkMode resolution the effect above already
      // applies to `document.documentElement.dataset.theme`, so m3e and
      // SB's own Flexoki theme never disagree about light/dark.
      <m3e-theme
        color="#464cfc"
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
            extensions={
              new Set(
                Array.from(
                  client.clientSystem.documentEditorHook.documentEditors.values(),
                ).flatMap(({ extensions }) => extensions),
              )
            }
            currentPath={client.currentPath()}
            mode={viewState.pageNavigatorMode}
            darkMode={viewState.uiOptions.darkMode}
            onModeSwitch={(mode) => {
              dispatch({ type: "stop-navigate" });
              setTimeout(() => {
                dispatch({ type: "start-navigate", mode });
              });
            }}
            onNavigate={(name) => {
              dispatch({ type: "stop-navigate" });
              setTimeout(() => {
                client.focus();
              });

              if (!name) {
                return;
              }

              safeRun(async () => {
                const ref = parseToRef(name);

                // Check beforhand, because we don't want to allow any link
                // stuff like #header here. The `!ref` check is just for
                // Typescript
                if (!isValidName(name) || !ref) {
                  // It's not a valid name so either, the user tried to create a
                  // page or we have an invalid file in the space. Names are
                  // only unique for files which follow our rules, so we are
                  // kind of in unknown territory now.

                  if (client.clientSystem.allKnownFiles.has(name)) {
                    // Try it as a document name === path
                    await this.promptDocumentOperation(
                      name as Path,
                      `'${name}' has an invalid name. You can now modify it`,
                    );
                  } else if (
                    client.clientSystem.allKnownFiles.has(`${name}.md`)
                  ) {
                    // Try it as a page
                    await this.promptDocumentOperation(
                      `${name}.md`,
                      `'${name}.md' has an invalid name. You can now modify it`,
                    );
                  } else {
                    this.flashNotification(
                      `Couldn't create page ${name}, name is invalid`,
                      "error",
                    );
                  }

                  return;
                }

                if (
                  !isMarkdownPath(ref.path) &&
                  !Array.from(
                    client.clientSystem.documentEditorHook.documentEditors.values(),
                  ).some(({ extensions }) =>
                    extensions.includes(getPathExtension(ref.path)),
                  )
                ) {
                  await this.promptDocumentOperation(
                    ref.path,
                    "This file cannot be edited, select your desired action.",
                  );
                } else {
                  void client.open(ref);
                }
              });
            }}
            onNavigateRef={(ref) => {
              dispatch({ type: "stop-navigate" });
              setTimeout(() => {
                client.focus();
              });
              // client.navigate resolves $-anchor refs to a page + position.
              safeRun(async () => {
                await client.navigate(ref);
              });
            }}
          />
        )}
        {viewState.showCommandPalette && (
          <CommandPalette
            onTrigger={(cmd) => {
              safeRun(async () => {
                dispatch({ type: "hide-palette" });
                if (cmd) {
                  await this.client.registerCommandRun(cmd.name);
                  try {
                    const returnValue = await cmd.run!();
                    if (returnValue !== false) {
                      client.focus();
                    }
                  } catch (e: any) {
                    this.client.reportError(e, "Command invocation");
                  }
                } else {
                  setTimeout(() => client.focus());
                }
              });
            }}
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
        />
        <div id="sb-main">
          {viewState.panels.lhs.mode !== undefined && (
            <Panel config={viewState.panels.lhs} editor={client} />
          )}
          <div id="sb-editor" />
          {viewState.panels.rhs.mode !== undefined && (
            <Panel config={viewState.panels.rhs} editor={client} />
          )}
        </div>
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
          // ONE floating vertical toolbar, bottom-right — replaces both the
          // old app-bar kebab (former OverflowMenu, top_bar.tsx) and the old
          // FAB speed-dial that used to live right here. `toolbarActions`
          // (computed above) is exactly the old kebab's contents (home/book/
          // any CONFIG-defined actionButton.define entries); "New journal
          // entry" stays a direct top-level action (Journal is already a
          // first-class SB feature, worth one click rather than a submenu
          // hop); "New" opens the expanded add-menu. Quick-capture actions
          // (task/event/contact/idea) append one line to a dedicated inbox
          // page and never navigate — "New note" is the one exception, since
          // creating a page is inherently "go write in it," not a one-line
          // capture, so it reuses the exact same valid-name-check +
          // client.open(ref) path the page picker's own "type a name that
          // doesn't exist yet" flow already uses (see the onNavigate handler
          // above) rather than reinventing page creation.
        }
        <FloatingToolbar
          actions={toolbarActions}
          recentPages={{
            label: "Recently visited",
            items: client.recentPaths
              .filter((p) => p.path !== client.currentPath())
              .slice(0, 10)
              .map((p) => ({
                key: p.path,
                label: getNameFromPath(p.path),
                onClick: () =>
                  safeRun(async () => {
                    await client.navigate({ path: p.path });
                  }),
              })),
          }}
          readOnlyToggle={
            viewState.commands.has("Editor: Toggle Read Only Mode")
              ? {
                active: isReadOnly,
                label: isReadOnly
                  ? "Read-only mode is on — click to turn off"
                  : "Read-only mode is off — click to turn on",
                onClick: () =>
                  safeRun(async () => {
                    await client.runCommandByName(
                      "Editor: Toggle Read Only Mode",
                    );
                  }),
              }
              : undefined
          }
          journal={{
            iconName: "edit_calendar",
            label: "New journal entry",
            onClick: () =>
              safeRun(async () => {
                await client.runCommandByName("Journal: Today");
              }),
          }}
          newMenuItems={[
            {
              iconName: "checklist",
              label: "New task",
              onClick: () =>
                safeRun(async () => {
                  const text = await this.prompt("New task");
                  if (!text) return;
                  await appendCaptureLine(
                    client,
                    "Tasks",
                    "# Tasks",
                    `* [ ] ${text}`,
                  );
                  this.flashNotification(`Task added: ${text}`);
                }),
            },
            {
              iconName: "event",
              label: "New event",
              onClick: () =>
                safeRun(async () => {
                  const text = await this.prompt("New event");
                  if (!text) return;
                  await appendCaptureLine(
                    client,
                    "Events",
                    "# Events",
                    `- ${text}`,
                  );
                  this.flashNotification(`Event added: ${text}`);
                }),
            },
            {
              iconName: "person_add",
              label: "New contact",
              onClick: () =>
                safeRun(async () => {
                  const text = await this.prompt("New contact");
                  if (!text) return;
                  await appendCaptureLine(
                    client,
                    "Contacts",
                    "# Contacts",
                    `- ${text}`,
                  );
                  this.flashNotification(`Contact added: ${text}`);
                }),
            },
            {
              iconName: "lightbulb",
              label: "New idea",
              onClick: () => setIdeaSheetOpen(true),
            },
            {
              iconName: "note_add",
              label: "New note",
              onClick: () =>
                safeRun(async () => {
                  const name = await this.prompt("New note");
                  if (!name) return;
                  const ref = parseToRef(name);
                  if (!isValidName(name) || !ref) {
                    this.flashNotification(
                      `Couldn't create page ${name}, name is invalid`,
                      "error",
                    );
                    return;
                  }
                  await client.open(ref);
                }),
            },
          ]}
        />
        <IdeaCaptureSheet
          open={ideaSheetOpen}
          onCancel={() => setIdeaSheetOpen(false)}
          onSubmit={(text) =>
            safeRun(async () => {
              setIdeaSheetOpen(false);
              if (!text.trim()) return;
              await appendCaptureLine(client, "Ideas", "# Ideas", `- ${text}`);
              this.flashNotification("Idea captured");
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

// TODO: Parking this here for now, this is very similar to the definition in top_bar.tsx

type ActionButton = {
  icon: string;
  description?: string;
  command?: string;
  mobile?: boolean;
  standalone?: boolean;
  dropdown?: boolean;
  priority?: number;
  run?: () => void;
};

function kebabToCamel(str: string) {
  return str
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^./, (g) => g.toUpperCase());
}
