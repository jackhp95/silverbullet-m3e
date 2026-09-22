import type { JSX } from "preact";
import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/checkbox"` here — same
// reason as button.tsx: this module is reachable from plug FUNCTION code (no
// DOM) via the package barrel, so every real DOM-side consumer of
// `Checkbox` must self-import `@m3e/web/checkbox`.

/** An `m3e-checkbox`, typed with a `.checked` property for change handlers. */
interface M3eCheckboxElement extends HTMLElement {
  checked: boolean;
}

export type CheckboxProps = Omit<
  JSX.IntrinsicElements["m3e-checkbox"],
  "class" | "onChange"
> & {
  class?: string;
  onChange?: JSX.EventHandler<JSX.TargetedEvent<M3eCheckboxElement, Event>>;
};

export function Checkbox({ class: extra, ...rest }: CheckboxProps) {
  return <m3e-checkbox class={cx("sb-checkbox", extra)} {...rest} />;
}
