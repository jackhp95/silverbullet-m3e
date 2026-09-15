// Minimal JSX typings for the `@m3e/web` custom elements used directly as
// intrinsic tags in top_bar.tsx (no `@m3e/react` wrapper, per the top-bar
// reskin's direct-JSX approach). Attribute names/types are taken verbatim
// from the m3e skill's verified component cards (generated from @m3e/web's
// build-time Custom Elements Manifest) — not guessed from generic Material
// Design knowledge.
import type { JSX as PreactJSX } from "preact";

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

declare module "preact/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "m3e-app-bar": M3eAppBarAttributes;
      "m3e-icon-button": M3eIconButtonAttributes;
    }
  }
}
