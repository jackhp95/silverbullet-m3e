// Ambient JSX typings for the @m3e/web custom elements used directly as
// Preact intrinsics across filter.tsx and top_bar.tsx. @m3e/web ships no
// framework-specific JSX bindings (it's a plain Lit custom-element package),
// so we declare the minimal attribute surface actually used in this fork
// rather than pulling in a generic "any-attribute" escape hatch. Attribute
// names/types are taken verbatim from the m3e skill's verified component
// cards (generated from @m3e/web's build-time Custom Elements Manifest), not
// guessed from generic Material Design knowledge. Augmenting both module
// specifiers keeps this working regardless of whether a given tsconfig
// resolves JSX types through "preact" or through "preact/jsx-runtime" (this
// repo's jsxImportSource is "preact" with the automatic runtime).
import type { JSX as PreactJSX } from "preact";

type M3eSearchViewAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  mode?: "fullscreen" | "docked" | "auto";
  contained?: boolean;
  open?: boolean;
  "hide-search-icon"?: boolean;
  "clear-label"?: string;
  "close-label"?: string;
};

type M3eListAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  variant?: "standard" | "segmented";
};

type M3eListItemAttributes = PreactJSX.HTMLAttributes<HTMLElement>;

type M3eAppBarAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Whether the title and subtitle are centered. @default false */
  centered?: boolean;
  /** Id of the interactive control this app bar is attached to. */
  for?: string | null;
  /** The size of the bar. @default "small" */
  size?: "small" | "medium" | "large";
};

type M3eIconButtonAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disabled-interactive"?: boolean;
  download?: string | null;
  /** Native link support — renders as a link; do not wrap in an `<a>`. */
  href?: string;
  name?: string;
  rel?: string;
  /** Whether the toggle button is selected. @default false */
  selected?: boolean;
  shape?: "rounded" | "square";
  /** @default "small" */
  size?: "extra-small" | "small" | "medium" | "large" | "extra-large";
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  /** Whether the button toggles between selected/unselected. @default false */
  toggle?: boolean;
  /** @default "button" */
  type?: "button" | "submit" | "reset";
  value?: string;
  /** @default "standard" */
  variant?: "filled" | "tonal" | "outlined" | "standard";
  /** @default "default" */
  width?: "default" | "narrow" | "wide";
};

// m3e-theme: applies dynamic Material color-role (--md-sys-color-*) custom
// properties to its subtree. Display: contents — safe drop-in for a bare
// Preact Fragment. See @m3e/web/theme card, ThemeElement.ts.
type M3eThemeAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Hex seed color the dynamic palette is derived from. @default "#6750A4" */
  color?: string;
  contrast?: "high" | "medium" | "standard";
  density?: number;
  /** @default "auto" */
  scheme?: "light" | "dark" | "auto";
  "strong-focus"?: boolean;
  variant?:
    | "monochrome"
    | "neutral"
    | "tonal-spot"
    | "vibrant"
    | "expressive"
    | "fidelity"
    | "content"
    | "rainbow"
    | "fruit-salad";
  motion?: "standard" | "expressive";
};

type M3eIconAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  name?: string;
  filled?: boolean;
  weight?: "100" | "200" | "300" | "400" | "500" | "600" | "700";
  grade?: "low" | "medium" | "high";
  "optical-size"?: number;
  variant?: "outlined" | "rounded" | "sharp";
};

// m3e-menu family: anchored dropdown, replaces the hand-rolled
// hover/CSS-class hamburger overflow. See @m3e/web/menu card.
type M3eMenuAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  id?: string;
  "position-x"?: "before" | "after";
  "position-y"?: "above" | "below";
  variant?: "standard" | "vibrant";
  submenu?: boolean;
};

type M3eMenuItemAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  href?: string;
  rel?: string;
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
};

type M3eMenuTriggerAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  for?: string | null;
};

// m3e-fab: the single primary constructive action for the screen. See
// @m3e/web/fab card.
type M3eFabAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disabled-interactive"?: boolean;
  extended?: boolean;
  href?: string;
  lowered?: boolean;
  /** @default "medium" */
  size?: "small" | "medium" | "large";
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  /** @default "primary-container" */
  variant?:
    | "primary"
    | "primary-container"
    | "secondary"
    | "secondary-container"
    | "tertiary"
    | "tertiary-container"
    | "surface";
};

// m3e-fab-menu family: a speed-dial menu opened from an m3e-fab via an
// m3e-fab-menu-trigger. See @m3e/web/fab-menu card.
type M3eFabMenuAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  id?: string;
  /** @default "primary" */
  variant?: "primary" | "secondary" | "tertiary";
};

type M3eFabMenuItemAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  download?: string | null;
  href?: string;
  rel?: string;
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
};

type M3eFabMenuTriggerAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  for?: string | null;
};

interface M3eIntrinsicElements {
  "m3e-search-view": M3eSearchViewAttributes;
  "m3e-list": M3eListAttributes;
  "m3e-list-item": M3eListItemAttributes;
  "m3e-app-bar": M3eAppBarAttributes;
  "m3e-icon-button": M3eIconButtonAttributes;
  "m3e-theme": M3eThemeAttributes;
  "m3e-icon": M3eIconAttributes;
  "m3e-menu": M3eMenuAttributes;
  "m3e-menu-item": M3eMenuItemAttributes;
  "m3e-menu-trigger": M3eMenuTriggerAttributes;
  "m3e-fab": M3eFabAttributes;
  "m3e-fab-menu": M3eFabMenuAttributes;
  "m3e-fab-menu-item": M3eFabMenuItemAttributes;
  "m3e-fab-menu-trigger": M3eFabMenuTriggerAttributes;
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
