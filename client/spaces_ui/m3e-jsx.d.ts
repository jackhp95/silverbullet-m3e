// Ambient JSX typings for the @m3e/web custom elements used directly as
// Preact intrinsics across client/spaces_ui (FolderPicker.tsx, UsersView.tsx,
// components/ConfirmDialog.tsx). Deliberately NOT imported from
// client/components/m3e-jsx.d.ts: spaces_ui is its own esbuild entry point
// (build/build_client.ts's "spaces ui"/"setup ui"/"auth ui" configs) that
// never imports from client/components (see client/spaces_ui/components/
// ConfirmDialog.tsx's doc comment), so it gets its own small ambient d.ts
// rather than reaching across that bundle boundary — same reasoning
// plug-api/ui/m3e-jsx.d.ts's own doc comment gives for not sharing this one.
// Attribute names/types are copied verbatim from client/components/
// m3e-jsx.d.ts, which sourced them from the m3e skill's verified component
// cards — not reconstructed from generic Material Design knowledge.
import type { JSX as PreactJSX } from "preact";

// m3e-dialog / m3e-dialog-action: ConfirmDialog.tsx's Confirm() replacement
// for the native window.confirm(). See @m3e/web/dialog card /
// DialogElement.d.ts, DialogActionElement.d.ts. `oncancel` is already
// covered by PreactJSX.HTMLAttributes (shared with native <dialog>).
//
// These four are deliberately spelled ALL LOWERCASE (`onclosed`, not
// `onClosed`) — see client/components/m3e-jsx.d.ts's identical comment on
// its own M3eDialogAttributes: Preact only lowercases an "on"-prefixed prop
// name when the lowercased form is already a real DOM property, which is
// false for this custom element's `closed` event, so a camelCase prop here
// would silently listen for the wrong event name and never fire.
type M3eDialogAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Whether the dialog is an alert (sets role="alertdialog"). @default false */
  alert?: boolean;
  "close-label"?: string;
  /** Whether backdrop click / Escape are disabled. @default false */
  "disable-close"?: boolean;
  /** Whether a close ("x") button is rendered. @default false */
  dismissible?: boolean;
  "no-focus-trap"?: boolean;
  /** Whether the dialog is open. @default false */
  open?: boolean;
  onopening?: (e: Event) => void;
  onopened?: (e: Event) => void;
  onclosing?: (e: Event) => void;
  onclosed?: (e: Event) => void;
};

type M3eDialogActionAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** The value returned by the dialog when this action is used to close it. */
  "return-value"?: string;
};

// m3e-list / m3e-list-item / m3e-list-action: FolderPicker.tsx's server
// directory browser and UsersView.tsx's API-token list. See @m3e/web/list
// card / ListElement.d.ts, ListItemElement.d.ts, ListActionElement.d.ts.
type M3eListAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** @default "standard" */
  variant?: "standard" | "segmented";
};

type M3eListItemAttributes = PreactJSX.HTMLAttributes<HTMLElement>;

// m3e-list-action: an interactive list item (button/link semantics) — used
// for FolderPicker's clickable subdirectory rows, where the whole row is one
// action rather than a display row with a separate trailing control.
type M3eListActionAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  download?: string | null;
  href?: string;
  rel?: string;
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
};

// m3e-breadcrumb / m3e-breadcrumb-item: FolderPicker.tsx's browse-path trail
// — the exact same "folder-path trail" use case top_bar.tsx already uses
// this pair for (see client/components/m3e-jsx.d.ts's identical comment).
// See @m3e/web/breadcrumb card / BreadcrumbElement.d.ts,
// BreadcrumbItemElement.d.ts.
type M3eBreadcrumbAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Whether breadcrumb items wrap onto a new line. @default false */
  wrap?: boolean;
};

type M3eBreadcrumbItemAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Accessible label for the item's internal button. */
  "item-label"?: string;
  disabled?: boolean;
  /** Marks this item as the current location in the trail. */
  current?: "page" | "step" | "location" | "date" | "time" | "true" | null;
  href?: string;
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  download?: string | null;
  rel?: string;
};

interface M3eIntrinsicElements {
  "m3e-dialog": M3eDialogAttributes;
  "m3e-dialog-action": M3eDialogActionAttributes;
  "m3e-list": M3eListAttributes;
  "m3e-list-item": M3eListItemAttributes;
  "m3e-list-action": M3eListActionAttributes;
  "m3e-breadcrumb": M3eBreadcrumbAttributes;
  "m3e-breadcrumb-item": M3eBreadcrumbItemAttributes;
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
