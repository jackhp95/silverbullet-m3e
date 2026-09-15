// Ambient JSX typings for the @m3e/web custom elements used directly as
// Preact intrinsics in filter.tsx. @m3e/web ships no framework-specific JSX
// bindings (it's a plain Lit custom-element package), so we declare the
// minimal attribute surface we actually use here rather than pulling in a
// generic "any-attribute" escape hatch. Augmenting both module specifiers
// keeps this working regardless of whether a given tsconfig resolves JSX
// types through "preact" or through "preact/jsx-runtime" (this repo's
// jsxImportSource is "preact" with the automatic runtime).
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

interface M3eIntrinsicElements {
  "m3e-search-view": M3eSearchViewAttributes;
  "m3e-list": M3eListAttributes;
  "m3e-list-item": M3eListItemAttributes;
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
