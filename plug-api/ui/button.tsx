import type { ComponentChildren, JSX, Ref } from "preact";
import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT `import "@m3e/web/button";` here (a real, side-effecting
// `customElements.define()` at module scope, unlike the type-only d.ts
// above): this file is reachable from plug FUNCTION code too, not just plug
// UI code — e.g. plugs/configuration-manager/configuration_html.ts imports
// `panelStyles` from this same package's barrel (./index.ts), which pulls in
// every sibling module including this one. Plug functions run in a
// WorkerSandbox with no DOM (`ReferenceError: HTMLElement is not defined`,
// confirmed live via e2e — @m3e/web/button's LitElement subclass touches
// `HTMLElement` at module-eval time), so a top-level side-effect import here
// would crash every builtin plug that imports anything from
// `@silverbulletmd/silverbullet/ui`, not just the ones using `Button`.
// Matching this fork's own established convention (filter.tsx,
// item_capture_sheet.tsx, basic_modals.tsx, top_bar.tsx all self-import their
// own `@m3e/web/*` tags) — every real DOM-side consumer of `Button` must add
// `import "@m3e/web/button";` itself. (For the app's own bundles this has
// since been centralized one level up, at each browser entry point — see
// client/editor_ui.tsx's `@m3e/web/*` imports for why — but the underlying
// per-file rule below still governs anything reached from plug UI panel
// bundles, which register per-consumer instead.)

export type ButtonVariant = "default" | "primary" | "danger" | "icon";

// Kit-level class hooks kept stable across the m3e-button swap: consumers
// (e.g. object-graph's `.gv-close-button`) compose their own CSS on top of
// these, and modals.scss's `.sb-button-danger` custom-property override
// (client/styles/modals.scss, same technique as its `.sb-button-error`
// sibling) targets `.sb-button-danger` by name.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "sb-button",
  primary: "sb-button sb-button-primary",
  danger: "sb-button sb-button-danger",
  icon: "sb-button-icon",
};

// m3e-button has no "default"/"danger"/"icon" variant of its own (CEM:
// elevated | filled | tonal | outlined | text only — see the m3e skill's
// button card). Danger is recolored via the `.sb-button-danger` custom-
// property override above, same as Confirm()'s `.sb-button-error` in
// basic_modals.tsx; "icon" (a compact "×"-style close affordance, not an
// `m3e-icon-button`) just gets the subtlest variant plus its own class hook.
const M3E_VARIANT: Record<ButtonVariant, "filled" | "outlined" | "text"> = {
  default: "outlined",
  primary: "filled",
  danger: "filled",
  icon: "text",
};

export type ButtonProps = Omit<
  JSX.IntrinsicElements["m3e-button"],
  "class" | "ref" | "variant"
> & {
  variant?: ButtonVariant;
  class?: string;
  /** Ref to the underlying `m3e-button` (Preact function components don't forward `ref`). */
  buttonRef?: Ref<HTMLElement>;
  /**
   * Optional keyboard-shortcut hint rendered after the label (e.g. "esc",
   * "⏎"). Only add it where that key actually triggers this button.
   */
  shortcut?: string;
  children?: ComponentChildren;
};

export function Button({
  variant = "default",
  class: extra,
  type,
  buttonRef,
  shortcut,
  children,
  ...rest
}: ButtonProps) {
  return (
    <m3e-button
      ref={buttonRef}
      type={type ?? "button"}
      variant={M3E_VARIANT[variant]}
      class={cx(VARIANT_CLASS[variant], extra)}
      {...rest}
    >
      {children}
      {shortcut ? <span class="sb-kbd">{shortcut}</span> : null}
    </m3e-button>
  );
}

// Added after this file's m3e-button swap (4cfc3763) landed on the fork —
// a plain native `<a>` styled with the same VARIANT_CLASS hooks, for the
// nav-link call sites (SpaceList/UsersView) that need real link semantics
// (href/target/download), not a button. m3e-button DOES support `href` (it
// renders as an `<a>` internally when one is set — see ButtonElement.d.ts),
// but these call sites predate that swap and were never migrated off a bare
// `<a>`; left as-is rather than folded into Button, since ButtonLink's own
// props (Omit<"a">, no `variant?: ButtonVariant` beyond styling) don't need
// any of m3e-button's surface.
export type ButtonLinkProps = Omit<JSX.IntrinsicElements["a"], "class"> & {
  variant?: ButtonVariant;
  class?: string;
};
export function ButtonLink({
  variant = "default",
  class: extra,
  ...props
}: ButtonLinkProps) {
  return <a {...props} class={cx(VARIANT_CLASS[variant], extra)} />;
}
