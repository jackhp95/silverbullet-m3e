import type { JSX } from "preact";
import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/checkbox"` here — same
// reason as button.tsx: this module is reachable from plug FUNCTION code (no
// DOM) via the package barrel, so every real DOM-side consumer of
// `Checkbox` must self-import `@m3e/web/checkbox` (or, for the app's own
// bundles, rely on the browser entry point that already covers it).
//
// Renders as `.m3e-checkbox` (NOT `.sb-checkbox`): `.sb-checkbox` forces a
// fixed 16x16 box, sized for a native `<input type=checkbox>`. Reusing it on
// the `<m3e-checkbox>` host clips the component's own ~48px touch
// target/ripple/icon internals inside its shadow root — a real visual
// regression (this is the root cause of the 3ad56b46 -> 5e0efa84 revert:
// the component rendered squished/clipped). `.sb-checkbox` stays reserved
// for CodeMirror's native task-list checkbox widget only (client/codemirror/
// task.ts) — see components.scss.

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
  return <m3e-checkbox class={cx("m3e-checkbox", extra)} {...rest} />;
}
