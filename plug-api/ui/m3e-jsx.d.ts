// Ambient JSX typings for the @m3e/web custom elements used directly inside
// this package's own Button/Input/Alert wrappers (button.tsx, input.tsx,
// alert.tsx).
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

type M3eLinearProgressIndicatorAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  mode?: "determinate" | "indeterminate" | "buffer" | "query";
  /** @default 0 */
  value?: number;
  /** @default 100 */
  max?: number;
  "buffer-value"?: number;
};

type M3eCheckboxAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  name?: string;
  required?: boolean;
  /** @default "on" */
  value?: string;
};

type M3eChipAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  value?: string;
  /** @default "outlined" */
  variant?: "elevated" | "outlined";
};

type M3eTabsAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  "disable-pagination"?: boolean;
  "disable-swipe"?: boolean;
  "header-position"?: string;
  stretch?: boolean;
  /** @default "secondary" */
  variant?: "primary" | "secondary";
};

type M3eTabAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  /** Id of the panel this tab is associated with (same-page switching, not a URL). */
  for?: string | null;
  selected?: boolean;
};

type M3eSnackbarAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  action?: string;
  "close-label"?: string;
  dismissible?: boolean;
  /** @default 3000 */
  duration?: number;
  open?: boolean;
};

interface M3eIntrinsicElements {
  "m3e-button": M3eButtonAttributes;
  "m3e-form-field": M3eFormFieldAttributes;
  "m3e-linear-progress-indicator": M3eLinearProgressIndicatorAttributes;
  "m3e-checkbox": M3eCheckboxAttributes;
  "m3e-chip": M3eChipAttributes;
  "m3e-tabs": M3eTabsAttributes;
  "m3e-tab": M3eTabAttributes;
  "m3e-snackbar": M3eSnackbarAttributes;
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
