import type { JSX, Ref } from "preact";
import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT `import "@m3e/web/form-field";` here — see button.tsx's
// matching comment. Every real DOM-side consumer that renders `Input` in
// its default (non-`bare`) mode must add `import "@m3e/web/form-field";`
// itself; `bare` consumers don't need it (no `m3e-form-field` is ever
// rendered for them).

export type InputProps = Omit<
  JSX.IntrinsicElements["input"],
  "class" | "ref"
> & {
  class?: string;
  /** Ref to the underlying <input> (Preact function components don't forward `ref`). */
  inputRef?: Ref<HTMLInputElement>;
  /** Called with the current value when Enter is pressed in the field. */
  onConfirm?: (value: string) => void;
  /** Called with the current value when Escape is pressed in the field. */
  onExit?: (value: string) => void;
  /**
   * Render a bare `<input class="sb-input">` — skip the `m3e-form-field`
   * wrapper this component uses by default. Needed wherever a parent's slot
   * contract demands a plain `<input>` (`m3e-search-view`'s `input` slot —
   * see client/components/filter.tsx), the caller already supplies its own
   * surrounding `m3e-form-field` (client/components/item_capture_sheet.tsx),
   * or the field is deliberately chrome-less inline text, not a boxed
   * Material field (the top-bar page-title editor —
   * client/components/top_bar.tsx). Wrapping unconditionally would nest two
   * `m3e-form-field`s or paint a bordered/floating-label box where none
   * belongs.
   */
  bare?: boolean;
};

export function Input({
  class: extra,
  type,
  inputRef,
  onConfirm,
  onExit,
  onKeyDown,
  bare,
  ...rest
}: InputProps) {
  const input = (
    <input
      ref={inputRef}
      type={type ?? "text"}
      class={bare ? cx("sb-input", extra) : undefined}
      onKeyDown={
        onConfirm || onExit || onKeyDown
          ? (e) => {
              // Run any caller-supplied handler first; it may call preventDefault().
              onKeyDown?.(e);
              // Ignore Enter/Escape that are part of an IME composition (e.g. CJK
              // candidate confirmation), so they don't submit a half-composed value.
              if (e.defaultPrevented || e.isComposing) {
                return;
              }
              if (onConfirm && e.key === "Enter") {
                e.preventDefault();
                onConfirm(e.currentTarget.value);
              } else if (onExit && e.key === "Escape") {
                e.preventDefault();
                onExit(e.currentTarget.value);
              }
            }
          : undefined
      }
      {...rest}
    />
  );

  if (bare) {
    return input;
  }

  return <m3e-form-field class={extra}>{input}</m3e-form-field>;
}
