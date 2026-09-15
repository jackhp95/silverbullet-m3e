import { Confirm, Prompt } from "./components/basic_modals.tsx";
import { CommandPalette, keyboardHint } from "./components/command_palette.tsx";
import { FilterList } from "./components/filter.tsx";
import { AnythingPicker } from "./components/anything_picker.tsx";
import { TopBar } from "./components/top_bar.tsx";
import reducer from "./reducer.ts";
import {
  type Action,
  type AppViewState,
  initialViewState,
} from "./types/ui.ts";
import * as featherIcons from "preact-feather";
import * as mdi from "./filtered_material_icons.ts";
import "@m3e/web/theme";
import "@m3e/web/fab";
import "@m3e/web/fab-menu";
import "@m3e/web/icon";
import "./components/m3e-jsx.d.ts";
import { h, render as preactRender } from "preact";
import { useEffect, useReducer } from "preact/hooks";
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

  flashNotification(
    message: string,
    type: NotificationType = "info",
    options?: {
      timeout?: number;
      actions?: NotificationAction[];
    },
  ) {
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

    const client = this.client;

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
          notifications={viewState.notifications}
          onDismissNotification={(id) => {
            dispatch({ type: "dismiss-notification", id });
          }}
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
          actionButtons={[
            // Custom action buttons. The overflow trigger itself is no
            // longer a synthetic entry in this array — TopBar's OverflowMenu
            // renders a real m3e-menu-trigger/m3e-menu when mobileMenuStyle
            // is set, replacing the old hand-toggled ".hamburger.open" hack.
            ...actionButtons
              .filter(
                (
                  // Filter out buttons without icons (invalid) and mobile buttons when not in mobile mode
                  button,
                ) =>
                  button.icon &&
                  (typeof button.mobile === "undefined" ||
                    button.mobile === viewState.isMobile) &&
                  (typeof button.standalone === "undefined" ||
                    button.standalone === viewState.isStandalone),
              )
              // Then ensure all buttons have a priority set (by default based on array index)
              .map((button, index) => ({
                ...button,
                priority: button.priority ?? actionButtons.length - index,
              }))
              .sort((a, b) => b.priority - a.priority)
              .map((button) => {
                const mdiIcon = (mdi as any)[kebabToCamel(button.icon)];
                let featherIcon = (featherIcons as any)[
                  kebabToCamel(button.icon)
                ];
                if (!featherIcon) {
                  featherIcon = featherIcons.HelpCircle;
                }
                // Build description with keyboard shortcut hint
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
                  icon: mdiIcon ? mdiIcon : featherIcon,
                  description,
                  dropdown: button.dropdown,
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
              }),
          ]}
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
          readOnly={
            viewState.uiOptions.forcedROMode || client.bootConfig.readOnly
          }
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
          // Real, persistent FAB speed-dial — not a widget.sandbox hack.
          // 2026-09-15 fix: this previously called
          // client.startPageNavigate("page"), which opens the fuzzy PAGE
          // PICKER — i.e. search — not page creation; a mislabel/miswire
          // (the button said "New page" but behaved like Ctrl-K). None of
          // the three actions below touch search or page-navigate at all.
          //
          // Opens a real m3e-fab-menu (@m3e/web/fab-menu) of quick-capture
          // actions instead of doing anything directly on click — "the FAB
          // would be a way to capture possible ideas," per the brief.
          // "New task"/"Jot down an idea" use appendCaptureLine (above):
          // a single prompt, then append one line to a dedicated inbox
          // page, zero navigation — the fastest possible capture, doesn't
          // interrupt whatever page you're on. "New journal entry" reuses
          // SB's own built-in `Journal: Today` command
          // (Library/Std/Journal/Journal.md) via client.runCommandByName
          // rather than reinventing journaling — that one does navigate,
          // because a journal entry is a canvas to write in, not a
          // one-line capture. size="small" (not the "medium" default) per
          // Jack's ask — this FAB sits over page content, not a full-page
          // action surface, so the default/large sizing read as too heavy.
        }
        <m3e-fab id="sb-fab" size="small" aria-label="Quick capture" title="Quick capture">
          <m3e-fab-menu-trigger for="sb-fab-menu">
            <m3e-icon name="add"></m3e-icon>
          </m3e-fab-menu-trigger>
        </m3e-fab>
        <m3e-fab-menu id="sb-fab-menu" variant="primary">
          <m3e-fab-menu-item
            onClick={() =>
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
              })
            }
          >
            <m3e-icon slot="icon" name="checklist"></m3e-icon>
            New task
          </m3e-fab-menu-item>
          <m3e-fab-menu-item
            onClick={() =>
              safeRun(async () => {
                await client.runCommandByName("Journal: Today");
              })
            }
          >
            <m3e-icon slot="icon" name="edit_calendar"></m3e-icon>
            New journal entry
          </m3e-fab-menu-item>
          <m3e-fab-menu-item
            onClick={() =>
              safeRun(async () => {
                const text = await this.prompt("Jot down an idea");
                if (!text) return;
                await appendCaptureLine(client, "Ideas", "# Ideas", `- ${text}`);
                this.flashNotification("Idea captured");
              })
            }
          >
            <m3e-icon slot="icon" name="lightbulb"></m3e-icon>
            Jot down an idea
          </m3e-fab-menu-item>
        </m3e-fab-menu>
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
