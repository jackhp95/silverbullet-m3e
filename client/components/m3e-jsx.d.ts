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

// m3e-search-bar: search_sheet.tsx's (client/components/search_sheet.tsx,
// L10) query input chrome. See @m3e/web/search card / SearchBarElement.ts —
// registered by the SAME `@m3e/web/search` module filter.tsx already imports
// for m3e-search-view. `clear` is NOT a standard GlobalEventHandlers event
// name (unlike click/input/change), so per the m3e-dialog comment above,
// Preact only resolves the handler correctly if the prop is spelled
// all-lowercase (`onclear`, not `onClear`) — verified against the same
// Preact props.js behavior documented there.
type M3eSearchBarAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  clearable?: boolean;
  "clear-label"?: string;
  onclear?: (e: Event) => void;
};

// m3e-autocomplete / m3e-option: search_sheet.tsx's suggestion dropdown
// attached to the plain `<input>` inside m3e-search-bar's `input` slot. See
// @m3e/web/autocomplete card / AutocompleteElement.ts, OptionElement.ts
// (importing `@m3e/web/autocomplete` registers both tags — verified against
// node_modules/@m3e/web/dist/autocomplete.js). `change`/`toggle` ARE
// standard GlobalEventHandlers event names (onchange/ontoggle already exist
// as native HTMLElement IDL properties), so camelCase `onChange`/`onToggle`
// resolve correctly; `query` is not, so `onquery` must stay lowercase (same
// pitfall as m3e-search-bar's `onclear` above).
type M3eAutocompleteAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Id of the input element this autocomplete augments. */
  for?: string | null;
  /** @default "contains" */
  filter?: "contains" | "starts-with" | "ends-with" | "none";
  "auto-activate"?: boolean;
  "case-sensitive"?: boolean;
  "hide-selection-indicator"?: boolean;
  "hide-loading"?: boolean;
  "hide-no-data"?: boolean;
  loading?: boolean;
  "loading-label"?: string;
  "no-data-label"?: string;
  "panel-class"?: string;
  required?: boolean;
  onChange?: (e: Event) => void;
  onquery?: (e: CustomEvent) => void;
  onToggle?: (e: Event) => void;
};

type M3eOptionAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disable-highlight"?: boolean;
  "highlight-mode"?: string;
  selected?: boolean;
  term?: string;
  value?: string;
};

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

// m3e-toolbar: the floating vertical toolbar shell (bottom-right of the
// page) that consolidates the old kebab overflow menu + FAB speed-dial.
// See @m3e/web/toolbar card / ToolbarElement.d.ts.
type M3eToolbarAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** @default false */
  elevated?: boolean;
  /** @default "square" */
  shape?: "rounded" | "square";
  /** @default "standard" */
  variant?: "standard" | "vibrant";
  /** Whether the element is oriented vertically. @default false */
  vertical?: boolean;
};

// m3e-bottom-sheet: hosts the "Jot down an idea" capture input. See
// @m3e/web/bottom-sheet card / BottomSheetElement.d.ts.
type M3eBottomSheetAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Zero-based index of the detent the sheet should open to. */
  detent?: number;
  /** Detents (discrete height states) the sheet can snap to. */
  detents?: string;
  /** Whether to display a drag handle (and enable drag-to-resize). @default false */
  handle?: boolean;
  "handle-label"?: string;
  /** Whether the sheet can be dismissed by swiping down. @default false */
  hideable?: boolean;
  "hide-friction"?: number;
  /** Whether the sheet behaves as modal (scrim + focus trap). @default false */
  modal?: boolean;
  /** Whether the sheet is open. @default false */
  open?: boolean;
  "overshoot-limit"?: number;
  // Custom (non-native) events — `oncancel` is already covered by
  // PreactJSX.HTMLAttributes (shared with native <dialog>), these aren't.
  onOpening?: (e: Event) => void;
  onOpened?: (e: Event) => void;
  onClosing?: (e: Event) => void;
  onClosed?: (e: Event) => void;
};

// m3e-form-field: Material container for a native form control (label,
// prefix/suffix, hint/error subscript). See @m3e/web/form-field card /
// FormFieldElement.d.ts.
type M3eFormFieldAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  "float-label"?: "always" | "auto";
  "hide-required-marker"?: boolean;
  "hide-subscript"?: "always" | "auto" | "never";
  /** @default "outlined" */
  variant?: "filled" | "outlined";
};

// m3e-textarea-autosize: non-visual element that grows a linked <textarea>
// to fit its content, used by item_capture_sheet.tsx's multi-line capture
// field. See @m3e/web/textarea-autosize card / TextareaAutosizeElement.d.ts.
type M3eTextareaAutosizeAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  /** Id of the `textarea` this element resizes. */
  for?: string | null;
  "max-rows"?: number;
  "min-rows"?: number;
};

// m3e-button: used for item_capture_sheet.tsx's submit action. See
// @m3e/web/button card / ButtonElement.d.ts.
type M3eButtonAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disabled-interactive"?: boolean;
  /** @default "rounded" */
  shape?: "rounded" | "square";
  /** @default "small" */
  size?: "extra-small" | "small" | "medium" | "large" | "extra-large";
  /** @default "button" */
  type?: "button" | "submit" | "reset";
  /** @default "text" */
  variant?: "elevated" | "filled" | "tonal" | "outlined" | "text";
};

// m3e-segmented-button / m3e-button-segment: item_capture_sheet.tsx's
// task/event/contact/idea/note type selector — a small, mutually-exclusive
// choice set is exactly the documented single-select use case. See
// @m3e/web/segmented-button card / SegmentedButtonElement.d.ts,
// ButtonSegmentElement.d.ts.
type M3eSegmentedButtonAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "hide-selection-indicator"?: boolean;
  /** @default false */
  multi?: boolean;
  name?: string;
};

type M3eButtonSegmentAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  checked?: boolean;
  disabled?: boolean;
  /** @default "on" */
  value?: string;
};

// m3e-breadcrumb / m3e-breadcrumb-item: top_bar.tsx's folder-path trail
// above the app bar. See @m3e/web/breadcrumb card / BreadcrumbElement.d.ts,
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

// m3e-dialog / m3e-dialog-action: basic_modals.tsx's Prompt/Confirm/
// AlwaysShownModal replacement for the native <dialog>. See @m3e/web/dialog
// card / DialogElement.d.ts, DialogActionElement.d.ts. `oncancel` is already
// covered by PreactJSX.HTMLAttributes (shared with native <dialog>, same as
// m3e-bottom-sheet above); `opening`/`opened`/`closing`/`closed` are not.
//
// These four are deliberately spelled ALL LOWERCASE (`onclosed`, not
// `onClosed`) — verified live (a console.log inside the handler never fired
// with the camelCase spelling) and confirmed by reading
// node_modules/preact/src/diff/props.js's setProperty(): for a prop name
// starting with "on", Preact only lowercases it before stripping the "on"
// prefix when `lowerCaseName in dom` is true (true for native events, since
// e.g. HTMLElement already has a real `onclick` IDL property) — otherwise it
// falls back to `name.slice(2)` on the ORIGINAL, un-lowercased string. A
// plain Lit custom element has no `onclosed` IDL property, so `onClosed`
// (camelCase) resolves to `addEventListener("Closed", ...)` — capital C —
// which never matches the component's actual `dispatchEvent(new
// Event("closed"))`. The prop name must already be all-lowercase so that
// wrong branch still produces the right string. (The identical camelCase
// spelling on m3e-bottom-sheet above is very likely equally dead — not fixed
// here since it's outside this file's owning feature; flagged separately.)
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

// m3e-circular-progress-indicator: top_bar.tsx's SyncProgressIndicator,
// replacing the hand-rolled conic-gradient spinner. See
// @m3e/web/progress-indicator card / CircularProgressIndicatorElement.d.ts.
type M3eCircularProgressIndicatorAttributes =
  PreactJSX.HTMLAttributes<HTMLElement> & {
    /** Whether to show activity without conveying progress. @default false */
    indeterminate?: boolean;
    /** The maximum progress value. @default 100 */
    max?: number;
    /** A fractional value, between 0 and `max`, indicating progress. @default 0 */
    value?: number;
    /** The appearance of the indicator. @default "flat" */
    variant?: "flat" | "wavy";
  };

// m3e-badge: top_bar.tsx's offline marker, attached via `for` to
// `#sb-current-page`. See @m3e/web/badge card / BadgeElement.d.ts.
type M3eBadgeAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** @default "medium" */
  size?: "small" | "medium" | "large";
  /** Position relative to the attached `for` element. @default "above-after" */
  position?:
    | "above-after"
    | "above-before"
    | "below-before"
    | "below-after"
    | "before"
    | "after"
    | "above"
    | "below";
  /** Id of the interactive control this badge is attached to. */
  for?: string | null;
};

// m3e-drawer-container / m3e-drawer-toggle: editor_ui.tsx's `#sb-main`
// chrome hosting the lhs/rhs side panels — see @m3e/web/drawer-container
// card / DrawerContainerElement.ts, DrawerToggleElement.ts. Only the
// start/end drawer host is reskinned here; Panel (panel.tsx), the
// plug-owned iframe/Shadow-DOM content slotted into it, is untouched.
type M3eDrawerContainerAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Whether the end drawer is open. @default false */
  end?: boolean;
  /** @default "side" */
  "end-mode"?: "over" | "push" | "side" | "auto";
  "end-divider"?: boolean;
  /** Whether the start drawer is open. @default false */
  start?: boolean;
  /** @default "side" */
  "start-mode"?: "over" | "push" | "side" | "auto";
  "start-divider"?: boolean;
};

type M3eDrawerToggleAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** Id of the drawer (slotted start/end element) this toggle controls. */
  for?: string | null;
};

// m3e-nav-bar / m3e-nav-item: client/components/nav_bar.tsx's bottom
// navigation shell (2026-09-17 nav-bar redesign spec, leaf N2). Verified
// against node_modules/@m3e/web/dist/custom-elements.json (src/nav-bar/
// NavBarElement.ts, NavItemElement.ts) AND the compiled dist/nav-bar.js
// (see nav_bar.tsx's own header comment for the decompiled
// `_M3eNavItemElement_handleClick` this depends on). `beforeinput` and
// `change` are NOT standard GlobalEventHandlers event names on a plain
// custom element (no native `onbeforeinput`/`onchange` IDL semantics apply
// the same way here as on a real <input>), but per the m3e-autocomplete
// comment above and Preact's own props.js behavior, `onChange` still
// resolves correctly because `onchange` DOES already exist as a native
// HTMLElement IDL property — verified live, same reasoning as
// M3eAutocompleteAttributes.onChange. `onBeforeInput` likewise resolves
// correctly because `onbeforeinput` is a real (if less commonly used)
// native HTMLElement IDL property (Input Events Level 2) — unlike
// M3eDialogAttributes' `onclosed`/etc, which have no native counterpart and
// must stay all-lowercase.
type M3eNavBarAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  /** @default "compact" */
  mode?: "auto" | "compact" | "expanded";
  onChange?: (e: Event) => void;
  onBeforeInput?: (e: Event) => void;
};

type M3eNavItemAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disabled-interactive"?: boolean;
  download?: string | null;
  href?: string;
  /** @default "vertical" */
  orientation?: "vertical" | "horizontal";
  rel?: string;
  /** Whether the element is selected. @default false */
  selected?: boolean;
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  onBeforeInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
};

// m3e-fab: client/components/nav_bar.tsx's Add trigger (leaf N3), opening
// the existing, unchanged ItemCaptureSheet. See @m3e/web/fab card /
// FabElement.ts. Deliberately NOT paired with m3e-fab-menu — spec §2.2's
// fully-reasoned rejection (item_capture_sheet.tsx's own segmented picker
// already is "the fab menu", one tap later, where it's editable).
type M3eFabAttributes = PreactJSX.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  "disabled-interactive"?: boolean;
  download?: string | null;
  /** Whether the button is extended to show the label. @default false */
  extended?: boolean;
  href?: string;
  /** Whether to present a lowered elevation. @default false */
  lowered?: boolean;
  name?: string;
  rel?: string;
  /** @default "medium" */
  size?: "small" | "medium" | "large";
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  /** @default "button" */
  type?: "button" | "submit" | "reset";
  value?: string;
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

interface M3eIntrinsicElements {
  "m3e-search-view": M3eSearchViewAttributes;
  "m3e-list": M3eListAttributes;
  "m3e-list-item": M3eListItemAttributes;
  "m3e-search-bar": M3eSearchBarAttributes;
  "m3e-autocomplete": M3eAutocompleteAttributes;
  "m3e-option": M3eOptionAttributes;
  "m3e-app-bar": M3eAppBarAttributes;
  "m3e-icon-button": M3eIconButtonAttributes;
  "m3e-theme": M3eThemeAttributes;
  "m3e-icon": M3eIconAttributes;
  "m3e-menu": M3eMenuAttributes;
  "m3e-menu-item": M3eMenuItemAttributes;
  "m3e-menu-trigger": M3eMenuTriggerAttributes;
  "m3e-toolbar": M3eToolbarAttributes;
  "m3e-bottom-sheet": M3eBottomSheetAttributes;
  "m3e-form-field": M3eFormFieldAttributes;
  "m3e-textarea-autosize": M3eTextareaAutosizeAttributes;
  "m3e-button": M3eButtonAttributes;
  "m3e-segmented-button": M3eSegmentedButtonAttributes;
  "m3e-button-segment": M3eButtonSegmentAttributes;
  "m3e-breadcrumb": M3eBreadcrumbAttributes;
  "m3e-breadcrumb-item": M3eBreadcrumbItemAttributes;
  "m3e-dialog": M3eDialogAttributes;
  "m3e-dialog-action": M3eDialogActionAttributes;
  "m3e-circular-progress-indicator": M3eCircularProgressIndicatorAttributes;
  "m3e-badge": M3eBadgeAttributes;
  "m3e-drawer-container": M3eDrawerContainerAttributes;
  "m3e-drawer-toggle": M3eDrawerToggleAttributes;
  "m3e-nav-bar": M3eNavBarAttributes;
  "m3e-nav-item": M3eNavItemAttributes;
  "m3e-fab": M3eFabAttributes;
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
