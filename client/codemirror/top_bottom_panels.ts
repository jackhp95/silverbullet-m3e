import type { EditorState } from "@codemirror/state";
import { Decoration, WidgetType } from "@codemirror/view";
import { h, render as preactRender } from "preact";
import type { Client } from "../client.ts";
import { decoratorStateField } from "./util.ts";
import { LuaWidget, type LuaWidgetContent } from "./lua_widget.ts";
import { activeWidgets } from "./code_widget.ts";
import { pageSlotViews } from "../navigator/page_slots.ts";
import {
  renderPageSlot,
  unmountPageSlot,
} from "../navigator/ui/components/page_widget.tsx";
import { FrontMatterPanel } from "../components/front_matter_panel.tsx";

class ArrayWidget extends WidgetType {
  public dom?: HTMLElement;

  constructor(
    readonly client: Client,
    readonly cacheKey: string,
    readonly callback: (pageName: string) => Promise<LuaWidgetContent[] | null>,
    readonly childClass: string,
  ) {
    super();
  }

  override get estimatedHeight(): number {
    return this.client.widgetCache.getCachedWidgetHeight(this.cacheKey);
  }

  invalidatePrewarm() {
    // ArrayWidget doesn't itself go through the prewarm cache (its callback
    // runs directly in renderContent), and the inner LuaWidgets it creates
    // get fresh prewarms via their constructors against a cleared cache, so
    // nothing to do here.
  }

  toDOM(): HTMLElement {
    activeWidgets.add(this);

    const div = document.createElement("div");
    // Layout moved to Tailwind utilities — see editor.scss's audit note.
    div.className = "sb-widget-array flex flex-col";

    // Reserve vertical space from the cached height so layout doesn't
    // shift when async render fills in content (see lua_widget.ts for why
    // we don't reinsert cached HTML).
    const cachedHeight = this.client.widgetCache.getCachedWidgetHeight(
      this.cacheKey,
    );
    if (cachedHeight > 0) {
      div.style.minHeight = `${cachedHeight}px`;
    }

    this.renderContent(div).catch(console.error);
    this.dom = div;
    return div;
  }

  async renderContent(div: HTMLElement) {
    const content = await this.callback(this.client.currentName());
    if (!content) return;

    const renderedWidgets: HTMLElement[] = [];

    for (const [i, widgetContent] of content.entries()) {
      // Filter out any "empty" widgets. Leaving the content empty, but
      // returning a valid widgets, seems to be a common pattern
      if (
        !widgetContent ||
        widgetContent === "" ||
        (widgetContent instanceof Object &&
          !widgetContent.markdown &&
          !widgetContent.html)
      )
        continue;

      const widget = new LuaWidget({
        client: this.client,
        cacheKey: `${this.cacheKey}:${i}`,
        expressionText: "",
        callback: () => Promise.resolve(widgetContent),
        inPage: false,
      });

      const html = widget.toDOM().querySelector<HTMLDivElement>(":scope > div");
      if (!html) {
        console.log("There was an error rendering one of the panel widgets");
        continue;
      }

      html.classList.add(this.childClass);

      renderedWidgets.push(html);
    }

    if (renderedWidgets.length === 0) {
      div.style.display = "none";
      div.style.minHeight = "";
      return;
    }

    div.replaceChildren(...renderedWidgets);
    div.style.minHeight = "";

    // Wait for the clientHeight to settle
    setTimeout(() => {
      this.client.widgetCache.setCachedWidgetMeta(this.cacheKey, {
        height: div.clientHeight,
        block: true,
      });
    });
  }

  override eq(other: WidgetType): boolean {
    return other instanceof ArrayWidget && other.cacheKey === this.cacheKey;
  }
}

/** A page slot: every navigator view whose resolved dock is this slot. */
class NavPageSlotWidget extends WidgetType {
  private destroyed = false;
  private measureTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly client: Client,
    readonly slot: "page-top" | "page-bottom",
    readonly cacheKey: string,
  ) {
    super();
  }

  override get estimatedHeight(): number {
    return this.client.widgetCache.getCachedWidgetHeight(this.cacheKey);
  }

  toDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = `sb-page-slot sb-page-slot-${this.slot}`;

    const cachedHeight = this.client.widgetCache.getCachedWidgetHeight(
      this.cacheKey,
    );
    if (cachedHeight > 0) {
      div.style.minHeight = `${cachedHeight}px`;
    }

    pageSlotViews(this.slot)
      .then((views) => {
        if (this.destroyed) return;
        renderPageSlot(div, views, this.slot, this.client, () =>
          this.measure(div),
        );
      })
      .catch(console.error);

    return div;
  }

  /**
   * Measures only once the slot's views have all resolved.
   */
  private measure(div: HTMLElement): void {
    clearTimeout(this.measureTimer);
    this.measureTimer = setTimeout(() => {
      if (this.destroyed) return;
      div.style.minHeight = "";
      div.dataset.settled = "1";
      if (!div.isConnected) return;
      this.client.widgetCache.setCachedWidgetMeta(this.cacheKey, {
        height: div.clientHeight,
        block: true,
      });
    }, 0);
  }

  override destroy(dom: HTMLElement): void {
    this.destroyed = true;
    clearTimeout(this.measureTimer);
    unmountPageSlot(dom);
  }

  override eq(other: WidgetType): boolean {
    return (
      other instanceof NavPageSlotWidget && other.cacheKey === this.cacheKey
    );
  }
}

/** CS-8 / D7: the frontmatter raw-YAML card, mounted as a CM block widget
 * at document start (`side: -3`, above the navigator's `page-top` slot at
 * `-2`) so it scrolls with the page like the fork's own placement, without
 * reviving the fork's now-dead `#sb-page-scroll` container (§2.3 of
 * docs/plans/2026-09-24-core-shell-decomposition.md). Renders Preact the
 * way `renderPageSlot` (navigator/ui/components/page_widget.tsx) does --
 * `render(<Component/>, div)` directly into the widget's own DOM node.
 *
 * `ignoreEvent()` -> `true`: the card's own `<textarea>` (editable mode) or
 * plain read-only rows must own every keystroke/click themselves --
 * CodeMirror must never intercept an event inside this widget's DOM and
 * try to reinterpret it as an editor command/selection change.
 *
 * `FrontMatterPanel` itself renders `null` (an empty wrapper) when there is
 * no frontmatter block, so this widget is unconditionally present in the
 * decoration set -- no separate "does this page have frontmatter" check
 * needed here, and `.sb-fm-panel` legitimately has zero matches on a page
 * without frontmatter.
 *
 * `eq()` is keyed on page path + the combined read-only flag (mirroring
 * the same `perm === "ro" || forcedROMode || bootConfig.readOnly`
 * expression `createEditorState` already uses to decide the underlying
 * CM state's own editability) -- NOT on frontmatter content, since content
 * sync is handled independently and continuously by
 * `frontMatterSyncExtension` -> `client.onFrontMatterChanged` ->
 * `<FrontMatterPanel>`'s own internal `refresh()`. Keeping `eq` stable
 * across ordinary typing means `toDOM`/Preact re-render only happens once
 * per real navigation or read-only-mode change, not on every keystroke.
 */
class FrontMatterCardWidget extends WidgetType {
  private destroyed = false;
  private measureTimer?: ReturnType<typeof setTimeout>;
  private resizeObserver?: ResizeObserver;

  constructor(
    readonly client: Client,
    readonly cacheKey: string,
    readonly readOnly: boolean,
  ) {
    super();
  }

  // Same caching pattern as the sibling `NavPageSlotWidget`/`ArrayWidget`
  // widgets in this file -- gives CM a real initial height estimate instead
  // of the unknown (-1) default.
  override get estimatedHeight(): number {
    return this.client.widgetCache.getCachedWidgetHeight(this.cacheKey);
  }

  override ignoreEvent(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "sb-frontmatter-card-widget";

    const cachedHeight = this.client.widgetCache.getCachedWidgetHeight(
      this.cacheKey,
    );
    if (cachedHeight > 0) {
      div.style.minHeight = `${cachedHeight}px`;
    }

    preactRender(
      h(FrontMatterPanel, { client: this.client, readOnly: this.readOnly }),
      div,
    );

    // The card resizes after CM's first measure (textarea autosize, YAML
    // edits); tell CM so its height map (click/cursor mapping) stays in sync.
    // Margins are kept inside this box by `display: flow-root` (top.scss).
    this.resizeObserver = new ResizeObserver(() => {
      if (this.destroyed) return;
      this.client.editorView?.requestMeasure();
    });
    this.resizeObserver.observe(div);

    this.measure(div);
    return div;
  }

  private measure(div: HTMLElement): void {
    clearTimeout(this.measureTimer);
    this.measureTimer = setTimeout(() => {
      if (this.destroyed) return;
      div.style.minHeight = "";
      if (!div.isConnected) return;
      this.client.widgetCache.setCachedWidgetMeta(this.cacheKey, {
        height: div.clientHeight,
        block: true,
      });
      this.client.editorView?.requestMeasure();
    }, 0);
  }

  override destroy(dom: HTMLElement): void {
    this.destroyed = true;
    clearTimeout(this.measureTimer);
    this.resizeObserver?.disconnect();
    preactRender(null, dom);
  }

  override eq(other: WidgetType): boolean {
    return (
      other instanceof FrontMatterCardWidget &&
      other.cacheKey === this.cacheKey &&
      other.readOnly === this.readOnly
    );
  }
}

/** Same combined read-only expression `createEditorState` uses to decide
 * the underlying CM state's own editability (client/codemirror/
 * editor_state.ts) -- the card must never claim to be editable when the
 * doc underneath it actually isn't. */
function isFrontMatterReadOnly(client: Client): boolean {
  return (
    client.currentPageMeta()?.perm === "ro" ||
    client.ui.viewState.uiOptions.forcedROMode ||
    client.bootConfig.readOnly
  );
}

export function postScriptPrefacePlugin(editor: Client) {
  return decoratorStateField((state: EditorState) => {
    if (!editor.clientSystem.scriptsLoaded) {
      return Decoration.none;
    }
    const widgets: any[] = [];

    // side -3: above (outside) the navigator's page-top slot (-2) -- the
    // outermost top-of-document widget, so the frontmatter card is the
    // very first thing rendered on a page (D7,
    // docs/plans/2026-09-24-core-shell-decomposition.md).
    widgets.push(
      Decoration.widget({
        widget: new FrontMatterCardWidget(
          editor,
          `frontmatter:${editor.currentPath()}`,
          isFrontMatterReadOnly(editor),
        ),
        side: -3,
        block: true,
      }).range(0),
    );

    // side -2/2 puts the navigator's page slots outside the legacy Lua top and bottom widgets
    widgets.push(
      Decoration.widget({
        widget: new NavPageSlotWidget(
          editor,
          "page-top",
          `pageslot:top:${editor.currentPath()}`,
        ),
        side: -2,
        block: true,
      }).range(0),
    );

    widgets.push(
      Decoration.widget({
        widget: new ArrayWidget(
          editor,
          `top:lua:${editor.currentPath()}`,
          async () => await client.dispatchAppEvent("hooks:renderTopWidgets"),
          "sb-lua-top-widget",
        ),
        side: -1,
        block: true,
      }).range(0),
    );

    widgets.push(
      Decoration.widget({
        widget: new ArrayWidget(
          editor,
          `bottom:lua:${editor.currentPath()}`,
          async () =>
            await client.dispatchAppEvent("hooks:renderBottomWidgets"),
          "sb-lua-bottom-widget",
        ),
        side: 1,
        block: true,
      }).range(state.doc.length),
    );

    widgets.push(
      Decoration.widget({
        widget: new NavPageSlotWidget(
          editor,
          "page-bottom",
          `pageslot:bottom:${editor.currentPath()}`,
        ),
        side: 2,
        block: true,
      }).range(state.doc.length),
    );

    return Decoration.set(widgets);
  });
}
