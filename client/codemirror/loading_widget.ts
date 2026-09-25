import { WidgetType } from "@codemirror/view";

/**
 * Placeholder widget rendered while the client is still gathering the
 * state required to render real widgets (system ready, scripts loaded,
 * full index, page list). Shown in place of the raw widget source so
 * the editor doesn't flash unrendered code during boot.
 */
export class LoadingWidget extends WidgetType {
  constructor(readonly block: boolean = false) {
    super();
  }

  override eq(other: WidgetType): boolean {
    return other instanceof LoadingWidget && other.block === this.block;
  }

  override toDOM(): HTMLElement {
    const wrapper = document.createElement("span");
    // Layout/color moved to Tailwind utilities — see editor.scss's audit
    // note. `inline-flex`/`flex` are kept mutually exclusive (rather than
    // both present with one overridden by source order) since two
    // same-specificity utility classes racing for `display` would depend
    // on Tailwind's generated CSS order, not classList order.
    wrapper.className =
      "sb-loading-widget items-center gap-[0.4em] opacity-70 align-middle " +
      "text-[color:var(--top-loading-color,#888)] " +
      (this.block
        ? "sb-loading-widget-block flex py-[0.2em]"
        : "sb-loading-widget-inline inline-flex");
    const spinner = document.createElement("span");
    // Box-model moved to Tailwind utilities; `animate-[spin_0.8s_linear_infinite]`
    // reuses Tailwind's own built-in `spin` @keyframes (theme.css) at our
    // original 0.8s duration, so the custom `sb-loading-spin` keyframes
    // block in editor.scss was deleted as redundant.
    // Side-scoped color utilities (border-x-/-b-/-t-) rather than the
    // `border-color` shorthand + an override, so no two utility classes
    // compete for the same longhand property (cascade order between two
    // Tailwind-generated rules of equal specificity isn't something a
    // classList string can pin down).
    spinner.className =
      "sb-loading-spinner inline-block size-[0.9em] border-2 border-solid " +
      "border-x-current border-b-current border-t-transparent " +
      "rounded-full animate-[spin_0.8s_linear_infinite] box-border";
    wrapper.appendChild(spinner);
    return wrapper;
  }

  override get estimatedHeight(): number {
    return this.block ? 24 : -1;
  }
}
