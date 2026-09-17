// Ambient JSX typings for the @m3e/web custom elements used directly inside
// this package's own Button/Input wrappers (button.tsx, input.tsx).
//
// Deliberately NOT imported from client/components/m3e-jsx.d.ts: plug-api is
// published standalone as `@silverbulletmd/silverbullet/ui` for plug authors
// (see docs/CHANGELOG.md) and must not reach into the app's client/ source
// tree. This duplicates just the two element shapes this package renders —
// attribute names/types taken verbatim from the m3e skill's verified
// component cards (button.md, form-field.md), same source of truth
// client/components/m3e-jsx.d.ts uses, kept in sync by hand since @m3e/web
// ships no framework-specific JSX bindings of its own.
import type { JSX as PreactJSX } from "preact";

type M3eButtonAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disabled-interactive"?: boolean;
  download?: string | null;
  href?: string;
  name?: string;
  rel?: string;
  selected?: boolean;
  /** @default "rounded" */
  shape?: "rounded" | "square";
  /** @default "small" */
  size?: "extra-small" | "small" | "medium" | "large" | "extra-large";
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  toggle?: boolean;
  /** @default "button" */
  type?: "button" | "submit" | "reset";
  value?: string;
  /** @default "text" */
  variant?: "elevated" | "filled" | "tonal" | "outlined" | "text";
};

type M3eFormFieldAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  "float-label"?: "always" | "auto";
  "hide-required-marker"?: boolean;
  "hide-subscript"?: "always" | "auto" | "never";
  /** @default "outlined" */
  variant?: "filled" | "outlined";
};

interface M3eIntrinsicElements {
  "m3e-button": M3eButtonAttributes;
  "m3e-form-field": M3eFormFieldAttributes;
}

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements extends M3eIntrinsicElements {}
  }
}

declare module "preact/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements extends M3eIntrinsicElements {}
  }
}
