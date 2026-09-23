<!-- AUTO-GENERATED — DO NOT EDIT. Regenerate via:
     node bin/generate-component-utilities.mjs -->

# M3e CSS Custom Properties

Structured reference for every public CSS custom property exposed by m3e web components, grouped by component, with inferred Tailwind v4 type and (where applicable) the theme namespace used by the matching `@utility` setter class.

Total: **2362 unique** public vars across **100 components**.

## Components

- [`m3e-action-list`](#m3e-action-list)
- [`m3e-app-bar`](#m3e-app-bar)
- [`m3e-assist-chip`](#m3e-assist-chip)
- [`m3e-avatar`](#m3e-avatar)
- [`m3e-badge`](#m3e-badge)
- [`m3e-bottom-sheet`](#m3e-bottom-sheet)
- [`m3e-breadcrumb-item`](#m3e-breadcrumb-item)
- [`m3e-button`](#m3e-button)
- [`m3e-button-group`](#m3e-button-group)
- [`m3e-button-segment`](#m3e-button-segment)
- [`m3e-calendar`](#m3e-calendar)
- [`m3e-card`](#m3e-card)
- [`m3e-checkbox`](#m3e-checkbox)
- [`m3e-chip`](#m3e-chip)
- [`m3e-chip-set`](#m3e-chip-set)
- [`m3e-circular-progress-indicator`](#m3e-circular-progress-indicator)
- [`m3e-collapsible`](#m3e-collapsible)
- [`m3e-content-pane`](#m3e-content-pane)
- [`m3e-date-input`](#m3e-date-input)
- [`m3e-datepicker`](#m3e-datepicker)
- [`m3e-dialog`](#m3e-dialog)
- [`m3e-divider`](#m3e-divider)
- [`m3e-drawer-container`](#m3e-drawer-container)
- [`m3e-elevation`](#m3e-elevation)
- [`m3e-expandable-list-item`](#m3e-expandable-list-item)
- [`m3e-expansion-header`](#m3e-expansion-header)
- [`m3e-expansion-panel`](#m3e-expansion-panel)
- [`m3e-fab`](#m3e-fab)
- [`m3e-fab-menu`](#m3e-fab-menu)
- [`m3e-fab-menu-item`](#m3e-fab-menu-item)
- [`m3e-filter-chip`](#m3e-filter-chip)
- [`m3e-filter-chip-set`](#m3e-filter-chip-set)
- [`m3e-floating-panel`](#m3e-floating-panel)
- [`m3e-focus-ring`](#m3e-focus-ring)
- [`m3e-form-field`](#m3e-form-field)
- [`m3e-heading`](#m3e-heading)
- [`m3e-icon-button`](#m3e-icon-button)
- [`m3e-input-chip`](#m3e-input-chip)
- [`m3e-input-chip-set`](#m3e-input-chip-set)
- [`m3e-linear-progress-indicator`](#m3e-linear-progress-indicator)
- [`m3e-list`](#m3e-list)
- [`m3e-list-action`](#m3e-list-action)
- [`m3e-list-item`](#m3e-list-item)
- [`m3e-list-item-button`](#m3e-list-item-button)
- [`m3e-list-option`](#m3e-list-option)
- [`m3e-loading-indicator`](#m3e-loading-indicator)
- [`m3e-menu`](#m3e-menu)
- [`m3e-menu-item`](#m3e-menu-item)
- [`m3e-menu-item-checkbox`](#m3e-menu-item-checkbox)
- [`m3e-menu-item-radio`](#m3e-menu-item-radio)
- [`m3e-nav-bar`](#m3e-nav-bar)
- [`m3e-nav-item`](#m3e-nav-item)
- [`m3e-nav-menu`](#m3e-nav-menu)
- [`m3e-nav-menu-item`](#m3e-nav-menu-item)
- [`m3e-nav-menu-item-group`](#m3e-nav-menu-item-group)
- [`m3e-nav-rail`](#m3e-nav-rail)
- [`m3e-optgroup`](#m3e-optgroup)
- [`m3e-option`](#m3e-option)
- [`m3e-option-panel`](#m3e-option-panel)
- [`m3e-paginator`](#m3e-paginator)
- [`m3e-pseudo-checkbox`](#m3e-pseudo-checkbox)
- [`m3e-pseudo-radio`](#m3e-pseudo-radio)
- [`m3e-radio`](#m3e-radio)
- [`m3e-rich-tooltip`](#m3e-rich-tooltip)
- [`m3e-ripple`](#m3e-ripple)
- [`m3e-scroll-container`](#m3e-scroll-container)
- [`m3e-search-bar`](#m3e-search-bar)
- [`m3e-search-view`](#m3e-search-view)
- [`m3e-segmented-button`](#m3e-segmented-button)
- [`m3e-select`](#m3e-select)
- [`m3e-selection-indicator`](#m3e-selection-indicator)
- [`m3e-selection-list`](#m3e-selection-list)
- [`m3e-shape`](#m3e-shape)
- [`m3e-skeleton`](#m3e-skeleton)
- [`m3e-slide`](#m3e-slide)
- [`m3e-slide-group`](#m3e-slide-group)
- [`m3e-slider`](#m3e-slider)
- [`m3e-slider-thumb`](#m3e-slider-thumb)
- [`m3e-snackbar`](#m3e-snackbar)
- [`m3e-split-button`](#m3e-split-button)
- [`m3e-split-pane`](#m3e-split-pane)
- [`m3e-state-layer`](#m3e-state-layer)
- [`m3e-step`](#m3e-step)
- [`m3e-step-panel`](#m3e-step-panel)
- [`m3e-stepper`](#m3e-stepper)
- [`m3e-suggestion-chip`](#m3e-suggestion-chip)
- [`m3e-switch`](#m3e-switch)
- [`m3e-tab`](#m3e-tab)
- [`m3e-tabs`](#m3e-tabs)
- [`m3e-text-highlight`](#m3e-text-highlight)
- [`m3e-theme-icon`](#m3e-theme-icon)
- [`m3e-timepicker`](#m3e-timepicker)
- [`m3e-timepicker-dial`](#m3e-timepicker-dial)
- [`m3e-timepicker-input`](#m3e-timepicker-input)
- [`m3e-toc`](#m3e-toc)
- [`m3e-toc-item`](#m3e-toc-item)
- [`m3e-toolbar`](#m3e-toolbar)
- [`m3e-tooltip`](#m3e-tooltip)
- [`m3e-tree`](#m3e-tree)
- [`m3e-tree-item`](#m3e-tree-item)

## `m3e-action-list`

A list of actions.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-divider-inset-end-size` | `length` | — | End inset for dividers within the list. |
| `--m3e-list-divider-inset-start-size` | `length` | — | Start inset for dividers within the list. |
| `--m3e-segmented-list-container-shape` | `length` | `--radius-*` | Border radius of the segmented list container. |
| `--m3e-segmented-list-item-container-color` | `color` | `--color-*` | Background color of items in segmented variant. |
| `--m3e-segmented-list-item-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant. |
| `--m3e-segmented-list-item-disabled-container-color` | `color` | `--color-*` | Background color of disabled items in segmented variant. |
| `--m3e-segmented-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant on focus. |
| `--m3e-segmented-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant on hover. |
| `--m3e-segmented-list-item-selected-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant when selected. |
| `--m3e-segmented-list-segment-gap` | `length` | — | Gap between list items in segmented variant. |

## `m3e-app-bar`

A bar, placed a the top of a screen, used to help users navigate through an application.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-app-bar-container-color` | `color` | `--color-*` | Background color of the app bar container. |
| `--m3e-app-bar-container-color-on-scroll` | `color` | `--color-*` | Background color of the app bar container when scrolled. |
| `--m3e-app-bar-container-elevation` | `*` | `--shadow-*` | Elevation (shadow) of the app bar container. |
| `--m3e-app-bar-container-elevation-on-scroll` | `*` | `--shadow-*` | Elevation (shadow) of the app bar container when scrolled. |
| `--m3e-app-bar-large-container-height` | `length` | — | Height of the large app bar container. |
| `--m3e-app-bar-large-container-height-with-subtitle` | `length` | — | Height of the large app bar container with subtitle. |
| `--m3e-app-bar-large-heading-padding-left` | `length` | — | Left padding for the large app bar heading. |
| `--m3e-app-bar-large-heading-padding-right` | `length` | — | Right padding for the large app bar heading. |
| `--m3e-app-bar-large-padding-bottom` | `length` | — | Bottom padding for the large app bar. |
| `--m3e-app-bar-large-padding-top` | `length` | — | Top padding for the large app bar. |
| `--m3e-app-bar-large-subtitle-max-lines` | `*` | — | Maximum number of lines for the large app bar subtitle. |
| `--m3e-app-bar-large-subtitle-text-font-size` | `length` | `--text-*` | Font size for the large app bar subtitle text. |
| `--m3e-app-bar-large-subtitle-text-font-weight` | `number` | `--font-weight-*` | Font weight for the large app bar subtitle text. |
| `--m3e-app-bar-large-subtitle-text-line-height` | `length` | `--leading-*` | Line height for the large app bar subtitle text. |
| `--m3e-app-bar-large-subtitle-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the large app bar title text. |
| `--m3e-app-bar-large-subtitle-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the large app bar subtitle text. |
| `--m3e-app-bar-large-title-max-lines` | `*` | — | Maximum number of lines for the large app bar title. |
| `--m3e-app-bar-large-title-text-font-size` | `length` | `--text-*` | Font size for the large app bar title text. |
| `--m3e-app-bar-large-title-text-font-weight` | `number` | `--font-weight-*` | Font weight for the large app bar title text. |
| `--m3e-app-bar-large-title-text-line-height` | `length` | `--leading-*` | Line height for the large app bar title text. |
| `--m3e-app-bar-medium-container-height` | `length` | — | Height of the medium app bar container. |
| `--m3e-app-bar-medium-container-height-with-subtitle` | `length` | — | Height of the medium app bar container with subtitle. |
| `--m3e-app-bar-medium-heading-padding-left` | `length` | — | Left padding for the medium app bar heading. |
| `--m3e-app-bar-medium-heading-padding-right` | `length` | — | Right padding for the medium app bar heading. |
| `--m3e-app-bar-medium-padding-bottom` | `length` | — | Bottom padding for the medium app bar. |
| `--m3e-app-bar-medium-padding-top` | `length` | — | Top padding for the medium app bar. |
| `--m3e-app-bar-medium-subtitle-max-lines` | `*` | — | Maximum number of lines for the medium app bar subtitle. |
| `--m3e-app-bar-medium-subtitle-text-font-size` | `length` | `--text-*` | Font size for the medium app bar subtitle text. |
| `--m3e-app-bar-medium-subtitle-text-font-weight` | `number` | `--font-weight-*` | Font weight for the medium app bar subtitle text. |
| `--m3e-app-bar-medium-subtitle-text-line-height` | `length` | `--leading-*` | Line height for the medium app bar subtitle text. |
| `--m3e-app-bar-medium-subtitle-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the medium app bar title text. |
| `--m3e-app-bar-medium-subtitle-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the medium app bar subtitle text. |
| `--m3e-app-bar-medium-title-max-lines` | `*` | — | Maximum number of lines for the medium app bar title. |
| `--m3e-app-bar-medium-title-text-font-size` | `length` | `--text-*` | Font size for the medium app bar title text. |
| `--m3e-app-bar-medium-title-text-font-weight` | `number` | `--font-weight-*` | Font weight for the medium app bar title text. |
| `--m3e-app-bar-medium-title-text-line-height` | `length` | `--leading-*` | Line height for the medium app bar title text. |
| `--m3e-app-bar-padding-left` | `length` | — | Left padding for the app bar container. |
| `--m3e-app-bar-padding-right` | `length` | — | Right padding for the app bar container. |
| `--m3e-app-bar-small-container-height` | `length` | — | Height of the small app bar container. |
| `--m3e-app-bar-small-heading-padding-left` | `length` | — | Left padding for the small app bar heading. |
| `--m3e-app-bar-small-heading-padding-right` | `length` | — | Right padding for the small app bar heading. |
| `--m3e-app-bar-small-subtitle-text-font-size` | `length` | `--text-*` | Font size for the small app bar subtitle text. |
| `--m3e-app-bar-small-subtitle-text-font-weight` | `number` | `--font-weight-*` | Font weight for the small app bar subtitle text. |
| `--m3e-app-bar-small-subtitle-text-line-height` | `length` | `--leading-*` | Line height for the small app bar subtitle text. |
| `--m3e-app-bar-small-subtitle-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the small app bar title text. |
| `--m3e-app-bar-small-subtitle-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the small app bar subtitle text. |
| `--m3e-app-bar-small-title-text-font-size` | `length` | `--text-*` | Font size for the small app bar title text. |
| `--m3e-app-bar-small-title-text-font-weight` | `number` | `--font-weight-*` | Font weight for the small app bar title text. |
| `--m3e-app-bar-small-title-text-line-height` | `length` | `--leading-*` | Line height for the small app bar title text. |
| `--m3e-app-bar-subtitle-text-color` | `color` | `--color-*` | Color of the app bar subtitle text. |
| `--m3e-app-bar-title-text-color` | `color` | `--color-*` | Color of the app bar title text. |

## `m3e-assist-chip`

A chip users interact with to perform a smart or automated action that can span multiple applications.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-container-height` | `length` | — | Base height of the chip container before density adjustment. |
| `--m3e-chip-container-shape` | `length` | `--radius-*` | Border radius of the chip container. |
| `--m3e-chip-disabled-icon-color` | `color` | `--color-*` | Base color for disabled icons. |
| `--m3e-chip-disabled-icon-opacity` | `number` | — | Opacity applied to disabled icons. |
| `--m3e-chip-disabled-label-text-color` | `color` | `--color-*` | Base color for disabled label text. |
| `--m3e-chip-disabled-label-text-opacity` | `number` | — | Opacity applied to disabled label text. |
| `--m3e-chip-icon-color` | `color` | `--color-*` | Icon color in default state. |
| `--m3e-chip-icon-size` | `length` | — | Font size of leading/trailing icons. |
| `--m3e-chip-label-text-color` | `color` | `--color-*` | Label text color in default state. |
| `--m3e-chip-label-text-font-size` | `length` | `--text-*` | Font size of the chip label text. |
| `--m3e-chip-label-text-font-weight` | `number` | `--font-weight-*` | Font weight of the chip label text. |
| `--m3e-chip-label-text-line-height` | `length` | `--leading-*` | Line height of the chip label text. |
| `--m3e-chip-label-text-tracking` | `length` | `--tracking-*` | Letter spacing of the chip label text. |
| `--m3e-chip-padding-end` | `length` | — | Default end padding when no trailing icon is present. |
| `--m3e-chip-padding-start` | `length` | — | Default start padding when no icon is present. |
| `--m3e-chip-spacing` | `length` | — | Horizontal gap between chip content elements. |
| `--m3e-chip-with-icon-padding-end` | `length` | — | End padding when trailing icon is present. |
| `--m3e-chip-with-icon-padding-start` | `length` | — | Start padding when leading icon is present. |
| `--m3e-elevated-chip-container-color` | `color` | `--color-*` | Background color for elevated variant. |
| `--m3e-elevated-chip-disabled-container-color` | `color` | `--color-*` | Background color for disabled elevated variant. |
| `--m3e-elevated-chip-disabled-container-opacity` | `number` | — | Opacity applied to disabled elevated background. |
| `--m3e-elevated-chip-disabled-elevation` | `*` | `--shadow-*` | Elevation level for disabled elevated variant. |
| `--m3e-elevated-chip-elevation` | `*` | `--shadow-*` | Elevation level for elevated variant. |
| `--m3e-elevated-chip-hover-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-outlined-chip-disabled-outline-color` | `color` | `--color-*` | Outline color for disabled outlined variant. |
| `--m3e-outlined-chip-disabled-outline-opacity` | `number` | — | Opacity applied to disabled outline. |
| `--m3e-outlined-chip-outline-color` | `color` | `--color-*` | Outline color for outlined variant. |
| `--m3e-outlined-chip-outline-thickness` | `length` | — | Outline thickness for outlined variant. |

## `m3e-avatar`

An image, icon or textual initials representing a user or other identity.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-avatar-color` | `color` | `--color-*` | Background color of the avatar. |
| `--m3e-avatar-font-size` | `length` | `--text-*` | Font size for the avatar. |
| `--m3e-avatar-font-weight` | `number` | `--font-weight-*` | Font weight for the avatar. |
| `--m3e-avatar-label-color` | `color` | `--color-*` | Text color of the avatar. |
| `--m3e-avatar-line-height` | `length` | `--leading-*` | Line height for the avatar. |
| `--m3e-avatar-shape` | `length` | `--radius-*` | Border radius of the avatar. |
| `--m3e-avatar-size` | `length` | — | Size of the avatar. |
| `--m3e-avatar-tracking` | `length` | `--tracking-*` | Letter spacing for the avatar. |

## `m3e-badge`

A visual indicator used to label content.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-badge-color` | `color` | `--color-*` | Foreground color of badge content. |
| `--m3e-badge-container-color` | `color` | `--color-*` | Background color of the badge. |
| `--m3e-badge-large-font-size` | `length` | `--text-*` | Font size for large badge label. |
| `--m3e-badge-large-font-weight` | `number` | `--font-weight-*` | Font weight for large badge label. |
| `--m3e-badge-large-line-height` | `length` | `--leading-*` | Line height for large badge label. |
| `--m3e-badge-large-size` | `length` | — | Height and min-width for large badge. |
| `--m3e-badge-large-tracking` | `length` | `--tracking-*` | Letter spacing for large badge label. |
| `--m3e-badge-medium-font-size` | `length` | `--text-*` | Font size for medium badge label. |
| `--m3e-badge-medium-font-weight` | `number` | `--font-weight-*` | Font weight for medium badge label. |
| `--m3e-badge-medium-line-height` | `length` | `--leading-*` | Line height for medium badge label. |
| `--m3e-badge-medium-size` | `length` | — | Height and min-width for medium badge. |
| `--m3e-badge-medium-tracking` | `length` | `--tracking-*` | Letter spacing for medium badge label. |
| `--m3e-badge-shape` | `length` | `--radius-*` | Corner radius of the badge. |
| `--m3e-badge-small-size` | `length` | — | Fixed dimensions for small badge. Used for minimal indicators (e.g. dot). |

## `m3e-bottom-sheet`

A sheet used to show secondary content anchored to the bottom of the screen.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-bottom-sheet-color` | `color` | `--color-*` | The foreground (text) color of the sheet. |
| `--m3e-bottom-sheet-compact-top-space` | `length` | — | The top space in compact mode. |
| `--m3e-bottom-sheet-container-color` | `color` | `--color-*` | The background color of the sheet container. |
| `--m3e-bottom-sheet-container-shape` | `length` | `--radius-*` | The border radius of the sheet container. |
| `--m3e-bottom-sheet-content-font-size` | `length` | `--text-*` | Font size for the sheet content. |
| `--m3e-bottom-sheet-content-font-weight` | `number` | `--font-weight-*` | Font weight for the sheet content. |
| `--m3e-bottom-sheet-content-line-height` | `length` | `--leading-*` | Line height for the sheet content. |
| `--m3e-bottom-sheet-content-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the sheet content. |
| `--m3e-bottom-sheet-elevation` | `*` | `--shadow-*` | The elevation level when not modal. |
| `--m3e-bottom-sheet-full-container-shape` | `length` | `--radius-*` | The border radius when full height. |
| `--m3e-bottom-sheet-full-elevation` | `*` | `--shadow-*` | The elevation level when full height. |
| `--m3e-bottom-sheet-handle-color` | `color` | `--color-*` | The color of the drag handle. |
| `--m3e-bottom-sheet-handle-container-height` | `length` | — | The height of the drag handle container. |
| `--m3e-bottom-sheet-handle-focus-ring-offset` | `length` | — | The offset of the focus ring around the handle. |
| `--m3e-bottom-sheet-handle-height` | `length` | — | The height of the drag handle. |
| `--m3e-bottom-sheet-handle-shape` | `length` | `--radius-*` | The border radius of the handle. |
| `--m3e-bottom-sheet-handle-width` | `length` | — | The width of the drag handle. |
| `--m3e-bottom-sheet-header-font-size` | `length` | `--text-*` | Font size for the sheet header. |
| `--m3e-bottom-sheet-header-font-weight` | `number` | `--font-weight-*` | Font weight for the sheet header. |
| `--m3e-bottom-sheet-header-line-height` | `length` | `--leading-*` | Line height for the sheet header. |
| `--m3e-bottom-sheet-header-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the sheet header. |
| `--m3e-bottom-sheet-max-width` | `length` | — | The maximum width of the sheet. |
| `--m3e-bottom-sheet-minimized-container-shape` | `length` | `--radius-*` | The border radius when minimized. |
| `--m3e-bottom-sheet-modal-elevation` | `*` | `--shadow-*` | The elevation level when modal. |
| `--m3e-bottom-sheet-padding-block` | `length` | — | The vertical padding. |
| `--m3e-bottom-sheet-padding-inline` | `length` | — | The horizontal padding. |
| `--m3e-bottom-sheet-peek-height` | `length` | — | The visible height when minimized. |
| `--m3e-bottom-sheet-scrim-color` | `color` | `--color-*` | The color of the scrim overlay. |
| `--m3e-bottom-sheet-scrim-opacity` | `number` | — | The opacity of the scrim overlay. |
| `--m3e-bottom-sheet-top-space` | `length` | — | The top space in standard mode. |
| `--m3e-bottom-sheet-width` | `length` | — | The width of the sheet. |
| `--m3e-bottom-sheet-z-index` | `number` | — | The z-index of the non-modal sheet. |

## `m3e-breadcrumb-item`

An item in a breadcrumb.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-breadcrumb-item-container-height` | `length` | — | Height of the internal breadcrumb item button container. |
| `--m3e-breadcrumb-item-disabled-color` | `color` | `--color-*` | Disabled color used by the breadcrumb item button. |
| `--m3e-breadcrumb-item-disabled-opacity` | `number` | — | Disabled opacity used by the breadcrumb item button. |
| `--m3e-breadcrumb-item-icon-color` | `color` | `--color-*` | Color of breadcrumb item icon-only content. |
| `--m3e-breadcrumb-item-icon-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color for icon-only breadcrumb items. |
| `--m3e-breadcrumb-item-icon-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color for icon-only breadcrumb items. |
| `--m3e-breadcrumb-item-icon-label-space` | `length` | — | Space between icon and label. |
| `--m3e-breadcrumb-item-icon-padding-inline` | `length` | — | Horizontal padding for icon-only breadcrumb items. |
| `--m3e-breadcrumb-item-icon-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color for icon-only breadcrumb items. |
| `--m3e-breadcrumb-item-icon-size` | `length` | — | Size of the icon. |
| `--m3e-breadcrumb-item-label-color` | `color` | `--color-*` | Color of breadcrumb item label content. |
| `--m3e-breadcrumb-item-label-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color for label breadcrumb items. |
| `--m3e-breadcrumb-item-label-font-size` | `length` | `--text-*` | Font size of breadcrumb item label content. |
| `--m3e-breadcrumb-item-label-font-weight` | `number` | `--font-weight-*` | Font weight of breadcrumb item label content. |
| `--m3e-breadcrumb-item-label-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color for label breadcrumb items. |
| `--m3e-breadcrumb-item-label-line-height` | `length` | `--leading-*` | Line height of breadcrumb item label content. |
| `--m3e-breadcrumb-item-label-padding-inline` | `length` | — | Horizontal padding for label breadcrumb items. |
| `--m3e-breadcrumb-item-label-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color for label breadcrumb items. |
| `--m3e-breadcrumb-item-label-tracking` | `length` | `--tracking-*` | Letter spacing of breadcrumb item label content. |
| `--m3e-breadcrumb-item-last-color` | `color` | `--color-*` | Color used for the current breadcrumb item. |
| `--m3e-breadcrumb-item-shape` | `length` | `--radius-*` | Shape of the internal breadcrumb item button. |

## `m3e-button`

A button users interact with to perform an action.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-button-container-color` | `color` | `--color-*` | Container background color, for all variants. |
| `--m3e-button-container-elevation` | `*` | `--shadow-*` | Elevation, for all variants. |
| `--m3e-button-container-height` | `length` | — | Height of the button container, for all size variants. |
| `--m3e-button-disabled-container-color` | `color` | `--color-*` | Disabled container color, for all variants. |
| `--m3e-button-disabled-container-elevation` | `*` | `--shadow-*` | Disabled elevation, for all variants. |
| `--m3e-button-disabled-container-opacity` | `number` | — | Disabled container opacity, for all variants. |
| `--m3e-button-disabled-icon-color` | `color` | `--color-*` | Disabled icon color, for all variants. |
| `--m3e-button-disabled-icon-opacity` | `number` | — | Disabled icon opacity, for all variants. |
| `--m3e-button-disabled-label-text-color` | `color` | `--color-*` | Disabled label color, for all variants. |
| `--m3e-button-disabled-label-text-opacity` | `number` | — | Disabled label opacity, for all variants. |
| `--m3e-button-disabled-outline-color` | `color` | `--color-*` | Disabled outline color, for all variants. |
| `--m3e-button-extra-large-container-height` | `length` | — | Height of the button container, for the extra-large size variant. |
| `--m3e-button-extra-large-icon-label-space` | `length` | — | Space between icon and label, for the extra-large size variant. |
| `--m3e-button-extra-large-icon-size` | `length` | — | Size of the icon, for the extra-large size variant. |
| `--m3e-button-extra-large-label-text-font-size` | `length` | `--text-*` | Font size for the label text, for the extra-large size variant. |
| `--m3e-button-extra-large-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text, for the extra-large size variant. |
| `--m3e-button-extra-large-label-text-line-height` | `length` | `--leading-*` | Line height for the label text, for the extra-large size variant. |
| `--m3e-button-extra-large-label-text-tracking` | `length` | `--tracking-*` | Letter tracking for the label text, for the extra-large size variant. |
| `--m3e-button-extra-large-leading-space` | `length` | — | Space before icon or label, for the extra-large size variant. |
| `--m3e-button-extra-large-outline-thickness` | `length` | — | Thickness of the button outline, for the extra-large size variant. |
| `--m3e-button-extra-large-selected-shape-round` | `length` | `--radius-*` | Corner radius when selected (round), for the extra-large size variant. |
| `--m3e-button-extra-large-selected-shape-square` | `length` | `--radius-*` | Corner radius when selected (square), for the extra-large size variant. |
| `--m3e-button-extra-large-shape-pressed-morph` | `length` | `--radius-*` | Corner radius when pressed, for the extra-large size variant. |
| `--m3e-button-extra-large-shape-round` | `length` | `--radius-*` | Corner radius for round shape, for the extra-large size variant. |
| `--m3e-button-extra-large-shape-square` | `length` | `--radius-*` | Corner radius for square shape, for the extra-large size variant. |
| `--m3e-button-extra-large-trailing-space` | `length` | — | Space after icon or label, for the extra-large size variant. |
| `--m3e-button-extra-small-container-height` | `length` | — | Height of the button container, for the extra-small size variant. |
| `--m3e-button-extra-small-icon-label-space` | `length` | — | Space between icon and label, for the extra-small size variant. |
| `--m3e-button-extra-small-icon-size` | `length` | — | Size of the icon, for the extra-small size variant. |
| `--m3e-button-extra-small-label-text-font-size` | `length` | `--text-*` | Font size for the label text, for the extra-small size variant. |
| `--m3e-button-extra-small-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text, for the extra-small size variant. |
| `--m3e-button-extra-small-label-text-line-height` | `length` | `--leading-*` | Line height for the label text, for the extra-small size variant. |
| `--m3e-button-extra-small-label-text-tracking` | `length` | `--tracking-*` | Letter tracking for the label text, for the extra-small size variant. |
| `--m3e-button-extra-small-leading-space` | `length` | — | Space before icon or label, for the extra-small size variant. |
| `--m3e-button-extra-small-outline-thickness` | `length` | — | Thickness of the button outline, for the extra-small size variant. |
| `--m3e-button-extra-small-selected-shape-round` | `length` | `--radius-*` | Corner radius when selected (round), for the extra-small size variant. |
| `--m3e-button-extra-small-selected-shape-square` | `length` | `--radius-*` | Corner radius when selected (square), for the extra-small size variant. |
| `--m3e-button-extra-small-shape-pressed-morph` | `length` | `--radius-*` | Corner radius when pressed, for the extra-small size variant. |
| `--m3e-button-extra-small-shape-round` | `length` | `--radius-*` | Corner radius for round shape, for the extra-small size variant. |
| `--m3e-button-extra-small-shape-square` | `length` | `--radius-*` | Corner radius for square shape, for the extra-small size variant. |
| `--m3e-button-extra-small-trailing-space` | `length` | — | Space after icon or label, for the extra-small size variant. |
| `--m3e-button-focus-container-elevation` | `*` | `--shadow-*` | Focus elevation, for all variants. |
| `--m3e-button-focus-icon-color` | `color` | `--color-*` | Focus icon color, for all variants. |
| `--m3e-button-focus-label-text-color` | `color` | `--color-*` | Focus label color, for all variants. |
| `--m3e-button-focus-outline-color` | `color` | `--color-*` | Focus outline color, for all variants. |
| `--m3e-button-focus-selected-icon-color` | `color` | `--color-*` | Focus selected icon color, for all variants. |
| `--m3e-button-focus-selected-label-text-color` | `color` | `--color-*` | Focus selected label color, for all variants. |
| `--m3e-button-focus-selected-state-layer-color` | `color` | `--color-*` | Focus selected state layer color, for all variants. |
| `--m3e-button-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color, for all variants. |
| `--m3e-button-focus-state-layer-opacity` | `number` | — | Focus state layer opacity, for all variants. |
| `--m3e-button-focus-unselected-icon-color` | `color` | `--color-*` | Focus unselected icon color, for all variants. |
| `--m3e-button-focus-unselected-label-text-color` | `color` | `--color-*` | Focus unselected label color, for all variants. |
| `--m3e-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Focus unselected state layer color, for all variants. |
| `--m3e-button-hover-container-elevation` | `*` | `--shadow-*` | Hover elevation, for all variants. |
| `--m3e-button-hover-icon-color` | `color` | `--color-*` | Hover icon color, for all variants. |
| `--m3e-button-hover-label-text-color` | `color` | `--color-*` | Hover label color, for all variants. |
| `--m3e-button-hover-outline-color` | `color` | `--color-*` | Hover outline color, for all variants. |
| `--m3e-button-hover-selected-icon-color` | `color` | `--color-*` | Hover selected icon color, for all variants. |
| `--m3e-button-hover-selected-label-text-color` | `color` | `--color-*` | Hover selected label color, for all variants. |
| `--m3e-button-hover-selected-state-layer-color` | `color` | `--color-*` | Hover selected state layer color, for all variants. |
| `--m3e-button-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color, for all variants. |
| `--m3e-button-hover-state-layer-opacity` | `number` | — | Hover state layer opacity, for all variants. |
| `--m3e-button-hover-unselected-icon-color` | `color` | `--color-*` | Hover unselected icon color, for all variants. |
| `--m3e-button-hover-unselected-label-text-color` | `color` | `--color-*` | Hover unselected label color, for all variants. |
| `--m3e-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Hover unselected state layer color, for all variants. |
| `--m3e-button-icon-color` | `color` | `--color-*` | Icon color, for all variants. |
| `--m3e-button-icon-label-space` | `length` | — | Space between icon and label, for all size variants. |
| `--m3e-button-icon-size` | `length` | — | Size of the icon, for all size variants. |
| `--m3e-button-label-text-color` | `color` | `--color-*` | Label color, for all variants. |
| `--m3e-button-label-text-font-size` | `length` | `--text-*` | Font size for the label text, for all size variants. |
| `--m3e-button-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text, for all size variants. |
| `--m3e-button-label-text-line-height` | `length` | `--leading-*` | Line height for the label text, for all size variants. |
| `--m3e-button-label-text-tracking` | `length` | `--tracking-*` | Letter tracking for the label text, for all size variants. |
| `--m3e-button-large-container-height` | `length` | — | Height of the button container, for the large size variant. |
| `--m3e-button-large-icon-label-space` | `length` | — | Space between icon and label, for the large size variant. |
| `--m3e-button-large-icon-size` | `length` | — | Size of the icon, for the large size variant. |
| `--m3e-button-large-label-text-font-size` | `length` | `--text-*` | Font size for the label text, for the large size variant. |
| `--m3e-button-large-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text, for the large size variant. |
| `--m3e-button-large-label-text-line-height` | `length` | `--leading-*` | Line height for the label text, for the large size variant. |
| `--m3e-button-large-label-text-tracking` | `length` | `--tracking-*` | Letter tracking for the label text, for the large size variant. |
| `--m3e-button-large-leading-space` | `length` | — | Space before icon or label, for the large size variant. |
| `--m3e-button-large-outline-thickness` | `length` | — | Thickness of the button outline, for the large size variant. |
| `--m3e-button-large-selected-shape-round` | `length` | `--radius-*` | Corner radius when selected (round), for the large size variant. |
| `--m3e-button-large-selected-shape-square` | `length` | `--radius-*` | Corner radius when selected (square), for the large size variant. |
| `--m3e-button-large-shape-pressed-morph` | `length` | `--radius-*` | Corner radius when pressed, for the large size variant. |
| `--m3e-button-large-shape-round` | `length` | `--radius-*` | Corner radius for round shape, for the large size variant. |
| `--m3e-button-large-shape-square` | `length` | `--radius-*` | Corner radius for square shape, for the large size variant. |
| `--m3e-button-large-trailing-space` | `length` | — | Space after icon or label, for the large size variant. |
| `--m3e-button-leading-space` | `length` | — | Space before icon or label, for all size variants. |
| `--m3e-button-medium-container-height` | `length` | — | Height of the button container, for the medium size variant. |
| `--m3e-button-medium-icon-label-space` | `length` | — | Space between icon and label, for the medium size variant. |
| `--m3e-button-medium-icon-size` | `length` | — | Size of the icon, for the medium size variant. |
| `--m3e-button-medium-label-text-font-size` | `length` | `--text-*` | Font size for the label text, for the medium size variant. |
| `--m3e-button-medium-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text, for the medium size variant. |
| `--m3e-button-medium-label-text-line-height` | `length` | `--leading-*` | Line height for the label text, for the medium size variant. |
| `--m3e-button-medium-label-text-tracking` | `length` | `--tracking-*` | Letter tracking for the label text, for the medium size variant. |
| `--m3e-button-medium-leading-space` | `length` | — | Space before icon or label, for the medium size variant. |
| `--m3e-button-medium-outline-thickness` | `length` | — | Thickness of the button outline, for the medium size variant. |
| `--m3e-button-medium-selected-shape-round` | `length` | `--radius-*` | Corner radius when selected (round), for the medium size variant. |
| `--m3e-button-medium-selected-shape-square` | `length` | `--radius-*` | Corner radius when selected (square), for the medium size variant. |
| `--m3e-button-medium-shape-pressed-morph` | `length` | `--radius-*` | Corner radius when pressed, for the medium size variant. |
| `--m3e-button-medium-shape-round` | `length` | `--radius-*` | Corner radius for round shape, for the medium size variant. |
| `--m3e-button-medium-shape-square` | `length` | `--radius-*` | Corner radius for square shape, for the medium size variant. |
| `--m3e-button-medium-trailing-space` | `length` | — | Space after icon or label, for the medium size variant. |
| `--m3e-button-outline-color` | `color` | `--color-*` | Outline color, for all variants. |
| `--m3e-button-outline-thickness` | `length` | — | Thickness of the button outline, for all size variants. |
| `--m3e-button-pressed-container-elevation` | `*` | `--shadow-*` | Pressed elevation, for all variants. |
| `--m3e-button-pressed-icon-color` | `color` | `--color-*` | Pressed icon color, for all variants. |
| `--m3e-button-pressed-label-text-color` | `color` | `--color-*` | Pressed label color, for all variants. |
| `--m3e-button-pressed-outline-color` | `color` | `--color-*` | Pressed outline color, for all variants. |
| `--m3e-button-pressed-selected-icon-color` | `color` | `--color-*` | Pressed selected icon color, for all variants. |
| `--m3e-button-pressed-selected-label-text-color` | `color` | `--color-*` | Pressed selected label color, for all variants. |
| `--m3e-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Pressed selected state layer color, for all variants. |
| `--m3e-button-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color, for all variants. |
| `--m3e-button-pressed-state-layer-opacity` | `number` | — | Pressed state layer opacity, for all variants. |
| `--m3e-button-pressed-unselected-icon-color` | `color` | `--color-*` | Pressed unselected icon color, for all variants. |
| `--m3e-button-pressed-unselected-label-text-color` | `color` | `--color-*` | Pressed unselected label color, for all variants. |
| `--m3e-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Pressed unselected state layer color, for all variants. |
| `--m3e-button-selected-container-color` | `color` | `--color-*` | Selected container color, for all variants. |
| `--m3e-button-selected-icon-color` | `color` | `--color-*` | Selected icon color, for all variants. |
| `--m3e-button-selected-label-text-color` | `color` | `--color-*` | Selected label color, for all variants. |
| `--m3e-button-selected-shape-round` | `length` | `--radius-*` | Corner radius when selected (round), for all size variants. |
| `--m3e-button-selected-shape-square` | `length` | `--radius-*` | Corner radius when selected (square), for all size variants. |
| `--m3e-button-shape-pressed-morph` | `length` | `--radius-*` | Corner radius when pressed, for all size variants. |
| `--m3e-button-shape-round` | `length` | `--radius-*` | Corner radius for round shape, for all size variants. |
| `--m3e-button-shape-square` | `length` | `--radius-*` | Corner radius for square shape, for all size variants. |
| `--m3e-button-small-container-height` | `length` | — | Height of the button container, for the small size variant. |
| `--m3e-button-small-icon-label-space` | `length` | — | Space between icon and label, for the small size variant. |
| `--m3e-button-small-icon-size` | `length` | — | Size of the icon, for the small size variant. |
| `--m3e-button-small-label-text-font-size` | `length` | `--text-*` | Font size for the label text, for the small size variant. |
| `--m3e-button-small-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text, for the small size variant. |
| `--m3e-button-small-label-text-line-height` | `length` | `--leading-*` | Line height for the label text, for the small size variant. |
| `--m3e-button-small-label-text-tracking` | `length` | `--tracking-*` | Letter tracking for the label text, for the small size variant. |
| `--m3e-button-small-leading-space` | `length` | — | Space before icon or label, for the small size variant. |
| `--m3e-button-small-outline-thickness` | `length` | — | Thickness of the button outline, for the small size variant. |
| `--m3e-button-small-selected-shape-round` | `length` | `--radius-*` | Corner radius when selected (round), for the small size variant. |
| `--m3e-button-small-selected-shape-square` | `length` | `--radius-*` | Corner radius when selected (square), for the small size variant. |
| `--m3e-button-small-shape-pressed-morph` | `length` | `--radius-*` | Corner radius when pressed, for the small size variant. |
| `--m3e-button-small-shape-round` | `length` | `--radius-*` | Corner radius for round shape, for the small size variant. |
| `--m3e-button-small-shape-square` | `length` | `--radius-*` | Corner radius for square shape, for the small size variant. |
| `--m3e-button-small-trailing-space` | `length` | — | Space after icon or label, for the small size variant. |
| `--m3e-button-trailing-space` | `length` | — | Space after icon or label, for all size variants. |
| `--m3e-button-unselected-container-color` | `color` | `--color-*` | Unselected container color, for all variants. |
| `--m3e-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color, for all variants. |
| `--m3e-button-unselected-label-text-color` | `color` | `--color-*` | Unselected label color, for all variants. |
| `--m3e-elevated-button-container-color` | `color` | `--color-*` | Container background color, for the elevated variant. |
| `--m3e-elevated-button-container-elevation` | `*` | `--shadow-*` | Elevation, for the elevated variant. |
| `--m3e-elevated-button-disabled-container-color` | `color` | `--color-*` | Disabled container color, for the elevated variant. |
| `--m3e-elevated-button-disabled-container-elevation` | `*` | `--shadow-*` | Disabled elevation, for the elevated variant. |
| `--m3e-elevated-button-disabled-container-opacity` | `number` | — | Disabled container opacity, for the elevated variant. |
| `--m3e-elevated-button-disabled-icon-color` | `color` | `--color-*` | Disabled icon color, for the elevated variant. |
| `--m3e-elevated-button-disabled-icon-opacity` | `number` | — | Disabled icon opacity, for the elevated variant. |
| `--m3e-elevated-button-disabled-label-text-color` | `color` | `--color-*` | Disabled label color, for the elevated variant. |
| `--m3e-elevated-button-disabled-label-text-opacity` | `number` | — | Disabled label opacity, for the elevated variant. |
| `--m3e-elevated-button-focus-container-elevation` | `*` | `--shadow-*` | Focus elevation, for the elevated variant. |
| `--m3e-elevated-button-focus-icon-color` | `color` | `--color-*` | Focus icon color, for the elevated variant. |
| `--m3e-elevated-button-focus-label-text-color` | `color` | `--color-*` | Focus label color, for the elevated variant. |
| `--m3e-elevated-button-focus-selected-icon-color` | `color` | `--color-*` | Focus selected icon color, for the elevated variant. |
| `--m3e-elevated-button-focus-selected-label-text-color` | `color` | `--color-*` | Focus selected label color, for the elevated variant. |
| `--m3e-elevated-button-focus-selected-state-layer-color` | `color` | `--color-*` | Focus selected state layer color, for the elevated variant. |
| `--m3e-elevated-button-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color, for the elevated variant. |
| `--m3e-elevated-button-focus-state-layer-opacity` | `number` | — | Focus state layer opacity, for the elevated variant. |
| `--m3e-elevated-button-focus-unselected-icon-color` | `color` | `--color-*` | Focus unselected icon color, for the elevated variant. |
| `--m3e-elevated-button-focus-unselected-label-text-color` | `color` | `--color-*` | Focus unselected label color, for the elevated variant. |
| `--m3e-elevated-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Focus unselected state layer color, for the elevated variant. |
| `--m3e-elevated-button-hover-container-elevation` | `*` | `--shadow-*` | Hover elevation, for the elevated variant. |
| `--m3e-elevated-button-hover-icon-color` | `color` | `--color-*` | Hover icon color, for the elevated variant. |
| `--m3e-elevated-button-hover-label-text-color` | `color` | `--color-*` | Hover label color, for the elevated variant. |
| `--m3e-elevated-button-hover-selected-icon-color` | `color` | `--color-*` | Hover selected icon color, for the elevated variant. |
| `--m3e-elevated-button-hover-selected-label-text-color` | `color` | `--color-*` | Hover selected label color, for the elevated variant. |
| `--m3e-elevated-button-hover-selected-state-layer-color` | `color` | `--color-*` | Hover selected state layer color, for the elevated variant. |
| `--m3e-elevated-button-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color, for the elevated variant. |
| `--m3e-elevated-button-hover-state-layer-opacity` | `number` | — | Hover state layer opacity, for the elevated variant. |
| `--m3e-elevated-button-hover-unselected-icon-color` | `color` | `--color-*` | Hover unselected icon color, for the elevated variant. |
| `--m3e-elevated-button-hover-unselected-label-text-color` | `color` | `--color-*` | Hover unselected label color, for the elevated variant. |
| `--m3e-elevated-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Hover unselected state layer color, for the elevated variant. |
| `--m3e-elevated-button-icon-color` | `color` | `--color-*` | Icon color, for the elevated variant. |
| `--m3e-elevated-button-label-text-color` | `color` | `--color-*` | Label color, for the elevated variant. |
| `--m3e-elevated-button-pressed-container-elevation` | `*` | `--shadow-*` | Pressed elevation, for the elevated variant. |
| `--m3e-elevated-button-pressed-icon-color` | `color` | `--color-*` | Pressed icon color, for the elevated variant. |
| `--m3e-elevated-button-pressed-label-text-color` | `color` | `--color-*` | Pressed label color, for the elevated variant. |
| `--m3e-elevated-button-pressed-selected-icon-color` | `color` | `--color-*` | Pressed selected icon color, for the elevated variant. |
| `--m3e-elevated-button-pressed-selected-label-text-color` | `color` | `--color-*` | Pressed selected label color, for the elevated variant. |
| `--m3e-elevated-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Pressed selected state layer color, for the elevated variant. |
| `--m3e-elevated-button-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color, for the elevated variant. |
| `--m3e-elevated-button-pressed-state-layer-opacity` | `number` | — | Pressed state layer opacity, for the elevated variant. |
| `--m3e-elevated-button-pressed-unselected-icon-color` | `color` | `--color-*` | Pressed unselected icon color, for the elevated variant. |
| `--m3e-elevated-button-pressed-unselected-label-text-color` | `color` | `--color-*` | Pressed unselected label color, for the elevated variant. |
| `--m3e-elevated-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Pressed unselected state layer color, for the elevated variant. |
| `--m3e-elevated-button-selected-container-color` | `color` | `--color-*` | Selected container color, for the elevated variant. |
| `--m3e-elevated-button-selected-icon-color` | `color` | `--color-*` | Selected icon color, for the elevated variant. |
| `--m3e-elevated-button-selected-label-text-color` | `color` | `--color-*` | Selected label color, for the elevated variant. |
| `--m3e-elevated-button-unselected-container-color` | `color` | `--color-*` | Unselected container color, for the elevated variant. |
| `--m3e-elevated-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color, for the elevated variant. |
| `--m3e-elevated-button-unselected-label-text-color` | `color` | `--color-*` | Unselected label color, for the elevated variant. |
| `--m3e-filled-button-container-color` | `color` | `--color-*` | Container background color, for the filled variant. |
| `--m3e-filled-button-container-elevation` | `*` | `--shadow-*` | Elevation, for the filled variant. |
| `--m3e-filled-button-disabled-container-color` | `color` | `--color-*` | Disabled container color, for the filled variant. |
| `--m3e-filled-button-disabled-container-elevation` | `*` | `--shadow-*` | Disabled elevation, for the filled variant. |
| `--m3e-filled-button-disabled-container-opacity` | `number` | — | Disabled container opacity, for the filled variant. |
| `--m3e-filled-button-disabled-icon-color` | `color` | `--color-*` | Disabled icon color, for the filled variant. |
| `--m3e-filled-button-disabled-icon-opacity` | `number` | — | Disabled icon opacity, for the filled variant. |
| `--m3e-filled-button-disabled-label-text-color` | `color` | `--color-*` | Disabled label color, for the filled variant. |
| `--m3e-filled-button-disabled-label-text-opacity` | `number` | — | Disabled label opacity, for the filled variant. |
| `--m3e-filled-button-focus-container-elevation` | `*` | `--shadow-*` | Focus elevation, for the filled variant. |
| `--m3e-filled-button-focus-icon-color` | `color` | `--color-*` | Focus icon color, for the filled variant. |
| `--m3e-filled-button-focus-label-text-color` | `color` | `--color-*` | Focus label color, for the filled variant. |
| `--m3e-filled-button-focus-selected-icon-color` | `color` | `--color-*` | Focus selected icon color, for the filled variant. |
| `--m3e-filled-button-focus-selected-label-text-color` | `color` | `--color-*` | Focus selected label color, for the filled variant. |
| `--m3e-filled-button-focus-selected-state-layer-color` | `color` | `--color-*` | Focus selected state layer color, for the filled variant. |
| `--m3e-filled-button-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color, for the filled variant. |
| `--m3e-filled-button-focus-state-layer-opacity` | `number` | — | Focus state layer opacity, for the filled variant. |
| `--m3e-filled-button-focus-unselected-icon-color` | `color` | `--color-*` | Focus unselected icon color, for the filled variant. |
| `--m3e-filled-button-focus-unselected-label-text-color` | `color` | `--color-*` | Focus unselected label color, for the filled variant. |
| `--m3e-filled-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Focus unselected state layer color, for the filled variant. |
| `--m3e-filled-button-hover-container-elevation` | `*` | `--shadow-*` | Hover elevation, for the filled variant. |
| `--m3e-filled-button-hover-icon-color` | `color` | `--color-*` | Hover icon color, for the filled variant. |
| `--m3e-filled-button-hover-label-text-color` | `color` | `--color-*` | Hover label color, for the filled variant. |
| `--m3e-filled-button-hover-selected-icon-color` | `color` | `--color-*` | Hover selected icon color, for the filled variant. |
| `--m3e-filled-button-hover-selected-label-text-color` | `color` | `--color-*` | Hover selected label color, for the filled variant. |
| `--m3e-filled-button-hover-selected-state-layer-color` | `color` | `--color-*` | Hover selected state layer color, for the filled variant. |
| `--m3e-filled-button-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color, for the filled variant. |
| `--m3e-filled-button-hover-state-layer-opacity` | `number` | — | Hover state layer opacity, for the filled variant. |
| `--m3e-filled-button-hover-unselected-icon-color` | `color` | `--color-*` | Hover unselected icon color, for the filled variant. |
| `--m3e-filled-button-hover-unselected-label-text-color` | `color` | `--color-*` | Hover unselected label color, for the filled variant. |
| `--m3e-filled-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Hover unselected state layer color, for the filled variant. |
| `--m3e-filled-button-icon-color` | `color` | `--color-*` | Icon color, for the filled variant. |
| `--m3e-filled-button-label-text-color` | `color` | `--color-*` | Label color, for the filled variant. |
| `--m3e-filled-button-pressed-container-elevation` | `*` | `--shadow-*` | Pressed elevation, for the filled variant. |
| `--m3e-filled-button-pressed-icon-color` | `color` | `--color-*` | Pressed icon color, for the filled variant. |
| `--m3e-filled-button-pressed-label-text-color` | `color` | `--color-*` | Pressed label color, for the filled variant. |
| `--m3e-filled-button-pressed-selected-icon-color` | `color` | `--color-*` | Pressed selected icon color, for the filled variant. |
| `--m3e-filled-button-pressed-selected-label-text-color` | `color` | `--color-*` | Pressed selected label color, for the filled variant. |
| `--m3e-filled-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Pressed selected state layer color, for the filled variant. |
| `--m3e-filled-button-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color, for the filled variant. |
| `--m3e-filled-button-pressed-state-layer-opacity` | `number` | — | Pressed state layer opacity, for the filled variant. |
| `--m3e-filled-button-pressed-unselected-icon-color` | `color` | `--color-*` | Pressed unselected icon color, for the filled variant. |
| `--m3e-filled-button-pressed-unselected-label-text-color` | `color` | `--color-*` | Pressed unselected label color, for the filled variant. |
| `--m3e-filled-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Pressed unselected state layer color, for the filled variant. |
| `--m3e-filled-button-selected-container-color` | `color` | `--color-*` | Selected container color, for the filled variant. |
| `--m3e-filled-button-selected-icon-color` | `color` | `--color-*` | Selected icon color, for the filled variant. |
| `--m3e-filled-button-selected-label-text-color` | `color` | `--color-*` | Selected label color, for the filled variant. |
| `--m3e-filled-button-unselected-container-color` | `color` | `--color-*` | Unselected container color, for the filled variant. |
| `--m3e-filled-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color, for the filled variant. |
| `--m3e-filled-button-unselected-label-text-color` | `color` | `--color-*` | Unselected label color, for the filled variant. |
| `--m3e-outlined-button-disabled-container-color` | `color` | `--color-*` | Disabled container color, for the outlined variant. |
| `--m3e-outlined-button-disabled-container-opacity` | `number` | — | Disabled container opacity, for the outlined variant. |
| `--m3e-outlined-button-disabled-icon-color` | `color` | `--color-*` | Disabled icon color, for the outlined variant. |
| `--m3e-outlined-button-disabled-icon-opacity` | `number` | — | Disabled icon opacity, for the outlined variant. |
| `--m3e-outlined-button-disabled-label-text-color` | `color` | `--color-*` | Disabled label color, for the outlined variant. |
| `--m3e-outlined-button-disabled-label-text-opacity` | `number` | — | Disabled label opacity, for the outlined variant. |
| `--m3e-outlined-button-disabled-outline-color` | `color` | `--color-*` | Disabled outline color, for the outlined variant. |
| `--m3e-outlined-button-focus-icon-color` | `color` | `--color-*` | Focus icon color, for the outlined variant. |
| `--m3e-outlined-button-focus-label-text-color` | `color` | `--color-*` | Focus label color, for the outlined variant. |
| `--m3e-outlined-button-focus-outline-color` | `color` | `--color-*` | Focus outline color, for the outlined variant. |
| `--m3e-outlined-button-focus-selected-icon-color` | `color` | `--color-*` | Focus selected icon color, for the outlined variant. |
| `--m3e-outlined-button-focus-selected-label-text-color` | `color` | `--color-*` | Focus selected label color, for the outlined variant. |
| `--m3e-outlined-button-focus-selected-state-layer-color` | `color` | `--color-*` | Focus selected state layer color, for the outlined variant. |
| `--m3e-outlined-button-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color, for the outlined variant. |
| `--m3e-outlined-button-focus-state-layer-opacity` | `number` | — | Focus state layer opacity, for the outlined variant. |
| `--m3e-outlined-button-focus-unselected-icon-color` | `color` | `--color-*` | Focus unselected icon color, for the outlined variant. |
| `--m3e-outlined-button-focus-unselected-label-text-color` | `color` | `--color-*` | Focus unselected label color, for the outlined variant. |
| `--m3e-outlined-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Focus unselected state layer color, for the outlined variant. |
| `--m3e-outlined-button-hover-icon-color` | `color` | `--color-*` | Hover icon color, for the outlined variant. |
| `--m3e-outlined-button-hover-label-text-color` | `color` | `--color-*` | Hover label color, for the outlined variant. |
| `--m3e-outlined-button-hover-outline-color` | `color` | `--color-*` | Hover outline color, for the outlined variant. |
| `--m3e-outlined-button-hover-selected-icon-color` | `color` | `--color-*` | Hover selected icon color, for the outlined variant. |
| `--m3e-outlined-button-hover-selected-label-text-color` | `color` | `--color-*` | Hover selected label color, for the outlined variant. |
| `--m3e-outlined-button-hover-selected-state-layer-color` | `color` | `--color-*` | Hover selected state layer color, for the outlined variant. |
| `--m3e-outlined-button-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color, for the outlined variant. |
| `--m3e-outlined-button-hover-state-layer-opacity` | `number` | — | Hover state layer opacity, for the outlined variant. |
| `--m3e-outlined-button-hover-unselected-icon-color` | `color` | `--color-*` | Hover unselected icon color, for the outlined variant. |
| `--m3e-outlined-button-hover-unselected-label-text-color` | `color` | `--color-*` | Hover unselected label color, for the outlined variant. |
| `--m3e-outlined-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Hover unselected state layer color, for the outlined variant. |
| `--m3e-outlined-button-icon-color` | `color` | `--color-*` | Icon color, for the outlined variant. |
| `--m3e-outlined-button-label-text-color` | `color` | `--color-*` | Label color, for the outlined variant. |
| `--m3e-outlined-button-outline-color` | `color` | `--color-*` | Outline color, for the outlined variant. |
| `--m3e-outlined-button-pressed-icon-color` | `color` | `--color-*` | Pressed icon color, for the outlined variant. |
| `--m3e-outlined-button-pressed-label-text-color` | `color` | `--color-*` | Pressed label color, for the outlined variant. |
| `--m3e-outlined-button-pressed-outline-color` | `color` | `--color-*` | Pressed outline color, for the outlined variant. |
| `--m3e-outlined-button-pressed-selected-icon-color` | `color` | `--color-*` | Pressed selected icon color, for the outlined variant. |
| `--m3e-outlined-button-pressed-selected-label-text-color` | `color` | `--color-*` | Pressed selected label color, for the outlined variant. |
| `--m3e-outlined-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Pressed selected state layer color, for the outlined variant. |
| `--m3e-outlined-button-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color, for the outlined variant. |
| `--m3e-outlined-button-pressed-state-layer-opacity` | `number` | — | Pressed state layer opacity, for the outlined variant. |
| `--m3e-outlined-button-pressed-unselected-icon-color` | `color` | `--color-*` | Pressed unselected icon color, for the outlined variant. |
| `--m3e-outlined-button-pressed-unselected-label-text-color` | `color` | `--color-*` | Pressed unselected label color, for the outlined variant. |
| `--m3e-outlined-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Pressed unselected state layer color, for the outlined variant. |
| `--m3e-outlined-button-selected-container-color` | `color` | `--color-*` | Selected container color, for the outlined variant. |
| `--m3e-outlined-button-selected-icon-color` | `color` | `--color-*` | Selected icon color, for the outlined variant. |
| `--m3e-outlined-button-selected-label-text-color` | `color` | `--color-*` | Selected label color, for the outlined variant. |
| `--m3e-outlined-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color, for the outlined variant. |
| `--m3e-outlined-button-unselected-label-text-color` | `color` | `--color-*` | Unselected label color, for the outlined variant. |
| `--m3e-text-button-disabled-container-color` | `color` | `--color-*` | Disabled container color, for the text variant. |
| `--m3e-text-button-disabled-container-opacity` | `number` | — | Disabled container opacity, for the text variant. |
| `--m3e-text-button-disabled-icon-color` | `color` | `--color-*` | Disabled icon color, for the text variant. |
| `--m3e-text-button-disabled-icon-opacity` | `number` | — | Disabled icon opacity, for the text variant. |
| `--m3e-text-button-disabled-label-text-color` | `color` | `--color-*` | Disabled label color, for the text variant. |
| `--m3e-text-button-disabled-label-text-opacity` | `number` | — | Disabled label opacity, for the text variant. |
| `--m3e-text-button-focus-icon-color` | `color` | `--color-*` | Focus icon color, for the text variant. |
| `--m3e-text-button-focus-label-text-color` | `color` | `--color-*` | Focus label color, for the text variant. |
| `--m3e-text-button-focus-selected-icon-color` | `color` | `--color-*` | Focus selected icon color, for the text variant. |
| `--m3e-text-button-focus-selected-label-text-color` | `color` | `--color-*` | Focus selected label color, for the text variant. |
| `--m3e-text-button-focus-selected-state-layer-color` | `color` | `--color-*` | Focus selected state layer color, for the text variant. |
| `--m3e-text-button-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color, for the text variant. |
| `--m3e-text-button-focus-state-layer-opacity` | `number` | — | Focus state layer opacity, for the text variant. |
| `--m3e-text-button-focus-unselected-icon-color` | `color` | `--color-*` | Focus unselected icon color, for the text variant. |
| `--m3e-text-button-focus-unselected-label-text-color` | `color` | `--color-*` | Focus unselected label color, for the text variant. |
| `--m3e-text-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Focus unselected state layer color, for the text variant. |
| `--m3e-text-button-hover-icon-color` | `color` | `--color-*` | Hover icon color, for the text variant. |
| `--m3e-text-button-hover-label-text-color` | `color` | `--color-*` | Hover label color, for the text variant. |
| `--m3e-text-button-hover-selected-icon-color` | `color` | `--color-*` | Hover selected icon color, for the text variant. |
| `--m3e-text-button-hover-selected-label-text-color` | `color` | `--color-*` | Hover selected label color, for the text variant. |
| `--m3e-text-button-hover-selected-state-layer-color` | `color` | `--color-*` | Hover selected state layer color, for the text variant. |
| `--m3e-text-button-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color, for the text variant. |
| `--m3e-text-button-hover-state-layer-opacity` | `number` | — | Hover state layer opacity, for the text variant. |
| `--m3e-text-button-hover-unselected-icon-color` | `color` | `--color-*` | Hover unselected icon color, for the text variant. |
| `--m3e-text-button-hover-unselected-label-text-color` | `color` | `--color-*` | Hover unselected label color, for the text variant. |
| `--m3e-text-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Hover unselected state layer color, for the text variant. |
| `--m3e-text-button-icon-color` | `color` | `--color-*` | Icon color, for the text variant. |
| `--m3e-text-button-label-text-color` | `color` | `--color-*` | Label color, for the text variant. |
| `--m3e-text-button-pressed-icon-color` | `color` | `--color-*` | Pressed icon color, for the text variant. |
| `--m3e-text-button-pressed-label-text-color` | `color` | `--color-*` | Pressed label color, for the text variant. |
| `--m3e-text-button-pressed-selected-icon-color` | `color` | `--color-*` | Pressed selected icon color, for the text variant. |
| `--m3e-text-button-pressed-selected-label-text-color` | `color` | `--color-*` | Pressed selected label color, for the text variant. |
| `--m3e-text-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Pressed selected state layer color, for the text variant. |
| `--m3e-text-button-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color, for the text variant. |
| `--m3e-text-button-pressed-state-layer-opacity` | `number` | — | Pressed state layer opacity, for the text variant. |
| `--m3e-text-button-pressed-unselected-icon-color` | `color` | `--color-*` | Pressed unselected icon color, for the text variant. |
| `--m3e-text-button-pressed-unselected-label-text-color` | `color` | `--color-*` | Pressed unselected label color, for the text variant. |
| `--m3e-text-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Pressed unselected state layer color, for the text variant. |
| `--m3e-text-button-selected-icon-color` | `color` | `--color-*` | Selected icon color, for the text variant. |
| `--m3e-text-button-selected-label-text-color` | `color` | `--color-*` | Selected label color, for the text variant. |
| `--m3e-text-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color, for the text variant. |
| `--m3e-text-button-unselected-label-text-color` | `color` | `--color-*` | Unselected label color, for the text variant. |
| `--m3e-tonal-button-container-color` | `color` | `--color-*` | Container background color, for the tonal variant. |
| `--m3e-tonal-button-container-elevation` | `*` | `--shadow-*` | Elevation, for the tonal variant. |
| `--m3e-tonal-button-disabled-container-color` | `color` | `--color-*` | Disabled container color, for the tonal variant. |
| `--m3e-tonal-button-disabled-container-elevation` | `*` | `--shadow-*` | Disabled elevation, for the tonal variant. |
| `--m3e-tonal-button-disabled-container-opacity` | `number` | — | Disabled container opacity, for the tonal variant. |
| `--m3e-tonal-button-disabled-icon-color` | `color` | `--color-*` | Disabled icon color, for the tonal variant. |
| `--m3e-tonal-button-disabled-icon-opacity` | `number` | — | Disabled icon opacity, for the tonal variant. |
| `--m3e-tonal-button-disabled-label-text-color` | `color` | `--color-*` | Disabled label color, for the tonal variant. |
| `--m3e-tonal-button-disabled-label-text-opacity` | `number` | — | Disabled label opacity, for the tonal variant. |
| `--m3e-tonal-button-focus-container-elevation` | `*` | `--shadow-*` | Focus elevation, for the tonal variant. |
| `--m3e-tonal-button-focus-icon-color` | `color` | `--color-*` | Focus icon color, for the tonal variant. |
| `--m3e-tonal-button-focus-label-text-color` | `color` | `--color-*` | Focus label color, for the tonal variant. |
| `--m3e-tonal-button-focus-selected-icon-color` | `color` | `--color-*` | Focus selected icon color, for the tonal variant. |
| `--m3e-tonal-button-focus-selected-label-text-color` | `color` | `--color-*` | Focus selected label color, for the tonal variant. |
| `--m3e-tonal-button-focus-selected-state-layer-color` | `color` | `--color-*` | Focus selected state layer color, for the tonal variant. |
| `--m3e-tonal-button-focus-state-layer-color` | `color` | `--color-*` | Focus state layer color, for the tonal variant. |
| `--m3e-tonal-button-focus-state-layer-opacity` | `number` | — | Focus state layer opacity, for the tonal variant. |
| `--m3e-tonal-button-focus-unselected-icon-color` | `color` | `--color-*` | Focus unselected icon color, for the tonal variant. |
| `--m3e-tonal-button-focus-unselected-label-text-color` | `color` | `--color-*` | Focus unselected label color, for the tonal variant. |
| `--m3e-tonal-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Focus unselected state layer color, for the tonal variant. |
| `--m3e-tonal-button-hover-container-elevation` | `*` | `--shadow-*` | Hover elevation, for the tonal variant. |
| `--m3e-tonal-button-hover-icon-color` | `color` | `--color-*` | Hover icon color, for the tonal variant. |
| `--m3e-tonal-button-hover-label-text-color` | `color` | `--color-*` | Hover label color, for the tonal variant. |
| `--m3e-tonal-button-hover-selected-icon-color` | `color` | `--color-*` | Hover selected icon color, for the tonal variant. |
| `--m3e-tonal-button-hover-selected-label-text-color` | `color` | `--color-*` | Hover selected label color, for the tonal variant. |
| `--m3e-tonal-button-hover-selected-state-layer-color` | `color` | `--color-*` | Hover selected state layer color, for the tonal variant. |
| `--m3e-tonal-button-hover-state-layer-color` | `color` | `--color-*` | Hover state layer color, for the tonal variant. |
| `--m3e-tonal-button-hover-state-layer-opacity` | `number` | — | Hover state layer opacity, for the tonal variant. |
| `--m3e-tonal-button-hover-unselected-icon-color` | `color` | `--color-*` | Hover unselected icon color, for the tonal variant. |
| `--m3e-tonal-button-hover-unselected-label-text-color` | `color` | `--color-*` | Hover unselected label color, for the tonal variant. |
| `--m3e-tonal-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Hover unselected state layer color, for the tonal variant. |
| `--m3e-tonal-button-icon-color` | `color` | `--color-*` | Icon color, for the tonal variant. |
| `--m3e-tonal-button-label-text-color` | `color` | `--color-*` | Label color, for the tonal variant. |
| `--m3e-tonal-button-pressed-container-elevation` | `*` | `--shadow-*` | Pressed elevation, for the tonal variant. |
| `--m3e-tonal-button-pressed-icon-color` | `color` | `--color-*` | Pressed icon color, for the tonal variant. |
| `--m3e-tonal-button-pressed-label-text-color` | `color` | `--color-*` | Pressed label color, for the tonal variant. |
| `--m3e-tonal-button-pressed-selected-icon-color` | `color` | `--color-*` | Pressed selected icon color, for the tonal variant. |
| `--m3e-tonal-button-pressed-selected-label-text-color` | `color` | `--color-*` | Pressed selected label color, for the tonal variant. |
| `--m3e-tonal-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Pressed selected state layer color, for the tonal variant. |
| `--m3e-tonal-button-pressed-state-layer-color` | `color` | `--color-*` | Pressed state layer color, for the tonal variant. |
| `--m3e-tonal-button-pressed-state-layer-opacity` | `number` | — | Pressed state layer opacity, for the tonal variant. |
| `--m3e-tonal-button-pressed-unselected-icon-color` | `color` | `--color-*` | Pressed unselected icon color, for the tonal variant. |
| `--m3e-tonal-button-pressed-unselected-label-text-color` | `color` | `--color-*` | Pressed unselected label color, for the tonal variant. |
| `--m3e-tonal-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Pressed unselected state layer color, for the tonal variant. |
| `--m3e-tonal-button-selected-container-color` | `color` | `--color-*` | Selected container color, for the tonal variant. |
| `--m3e-tonal-button-selected-icon-color` | `color` | `--color-*` | Selected icon color, for the tonal variant. |
| `--m3e-tonal-button-selected-label-text-color` | `color` | `--color-*` | Selected label color, for the tonal variant. |
| `--m3e-tonal-button-unselected-container-color` | `color` | `--color-*` | Unselected container color, for the tonal variant. |
| `--m3e-tonal-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color, for the tonal variant. |
| `--m3e-tonal-button-unselected-label-text-color` | `color` | `--color-*` | Unselected label color, for the tonal variant. |

## `m3e-button-group`

Organizes buttons and adds interactions between them.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-connected-button-group-extra-large-inner-pressed-shape` | `length` | `--radius-*` | Pressed corner shape for connected variant, extra-large size. |
| `--m3e-connected-button-group-extra-large-inner-shape` | `length` | `--radius-*` | Corner shape for connected variant, extra-large size. |
| `--m3e-connected-button-group-extra-small-inner-pressed-shape` | `length` | `--radius-*` | Pressed corner shape for connected variant, extra-small size. |
| `--m3e-connected-button-group-extra-small-inner-shape` | `length` | `--radius-*` | Corner shape for connected variant, extra-small size. |
| `--m3e-connected-button-group-large-inner-pressed-shape` | `length` | `--radius-*` | Pressed corner shape for connected variant, large size. |
| `--m3e-connected-button-group-large-inner-shape` | `length` | `--radius-*` | Corner shape for connected variant, large size. |
| `--m3e-connected-button-group-medium-inner-pressed-shape` | `length` | `--radius-*` | Pressed corner shape for connected variant, medium size. |
| `--m3e-connected-button-group-medium-inner-shape` | `length` | `--radius-*` | Corner shape for connected variant, medium size. |
| `--m3e-connected-button-group-small-inner-pressed-shape` | `length` | `--radius-*` | Pressed corner shape for connected variant, small size. |
| `--m3e-connected-button-group-small-inner-shape` | `length` | `--radius-*` | Corner shape for connected variant, small size. |
| `--m3e-connected-button-group-spacing` | `length` | — | Spacing between buttons in connected variant. |
| `--m3e-standard-button-group-extra-large-spacing` | `length` | — | Spacing between buttons in standard variant, extra-large size. |
| `--m3e-standard-button-group-extra-small-spacing` | `length` | — | Spacing between buttons in standard variant, extra-small size. |
| `--m3e-standard-button-group-large-spacing` | `length` | — | Spacing between buttons in standard variant, large size. |
| `--m3e-standard-button-group-medium-spacing` | `length` | — | Spacing between buttons in standard variant, medium size. |
| `--m3e-standard-button-group-small-spacing` | `length` | — | Spacing between buttons in standard variant, small size. |

## `m3e-button-segment`

A option that can be selected within a segmented button.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-segmented-button-disabled-icon-color` | `color` | `--color-*` | Base color for disabled icons. |
| `--m3e-segmented-button-disabled-icon-opacity` | `number` | — | Opacity applied to disabled icons. |
| `--m3e-segmented-button-disabled-label-text-color` | `color` | `--color-*` | Base color for disabled label text. |
| `--m3e-segmented-button-disabled-label-text-opacity` | `number` | — | Opacity applied to disabled label text. |
| `--m3e-segmented-button-disabled-outline-color` | `color` | `--color-*` | Base color for disabled segment borders. |
| `--m3e-segmented-button-disabled-outline-opacity` | `number` | — | Opacity applied to disabled segment borders. |
| `--m3e-segmented-button-font-size` | `length` | `--text-*` | Font size of the label text. |
| `--m3e-segmented-button-font-weight` | `number` | `--font-weight-*` | Font weight of the label text. |
| `--m3e-segmented-button-height` | `length` | — | Total height of the segmented button. |
| `--m3e-segmented-button-icon-size` | `length` | — | Font size of the icon. |
| `--m3e-segmented-button-line-height` | `length` | `--leading-*` | Line height of the label text. |
| `--m3e-segmented-button-outline-color` | `color` | `--color-*` | Color of the button's border. |
| `--m3e-segmented-button-outline-thickness` | `length` | — | Thickness of the button's border. |
| `--m3e-segmented-button-padding-end` | `length` | — | Padding on the trailing edge of the button content. |
| `--m3e-segmented-button-padding-start` | `length` | — | Padding on the leading edge of the button content. |
| `--m3e-segmented-button-selected-container-color` | `color` | `--color-*` | Background color of a selected segment. |
| `--m3e-segmented-button-selected-container-focus-color` | `color` | `--color-*` | Focus state-layer color for selected segments. |
| `--m3e-segmented-button-selected-container-hover-color` | `color` | `--color-*` | Hover state-layer color for selected segments. |
| `--m3e-segmented-button-selected-icon-color` | `color` | `--color-*` | Icon color for selected segments. |
| `--m3e-segmented-button-selected-label-text-color` | `color` | `--color-*` | Label text color for selected segments. |
| `--m3e-segmented-button-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected segments. |
| `--m3e-segmented-button-spacing` | `length` | — | Horizontal gap between icon and label. |
| `--m3e-segmented-button-tracking` | `length` | `--tracking-*` | Letter spacing of the label text. |
| `--m3e-segmented-button-unselected-container-focus-color` | `color` | `--color-*` | Focus state-layer color for unselected segments. |
| `--m3e-segmented-button-unselected-container-hover-color` | `color` | `--color-*` | Hover state-layer color for unselected segments. |
| `--m3e-segmented-button-unselected-icon-color` | `color` | `--color-*` | Icon color for unselected segments. |
| `--m3e-segmented-button-unselected-label-text-color` | `color` | `--color-*` | Label text color for unselected segments. |
| `--m3e-segmented-button-unselected-ripple-color` | `color` | `--color-*` | Ripple color for unselected segments. |
| `--m3e-segmented-button-with-icon-padding-start` | `length` | — | Leading padding when an icon is present. |

## `m3e-calendar`

A calendar used to select a date.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-calendar-container-color` | `color` | `--color-*` | Background color of the container surface. |
| `--m3e-calendar-container-elevation` | `*` | `--shadow-*` | Elevation shadow applied to the container surface. |
| `--m3e-calendar-container-shape` | `length` | `--radius-*` | Corner radius of the container surface. |
| `--m3e-calendar-date-font-size` | `length` | `--text-*` | Font size of date cells in month view. |
| `--m3e-calendar-date-font-weight` | `number` | `--font-weight-*` | Font weight of date cells in month view. |
| `--m3e-calendar-date-line-height` | `length` | `--leading-*` | Line height of date cells in month view. |
| `--m3e-calendar-date-tracking` | `length` | `--tracking-*` | Letter spacing of date cells in month view. |
| `--m3e-calendar-item-color` | `color` | `--color-*` | Text color for date items. |
| `--m3e-calendar-item-current-outline-color` | `color` | `--color-*` | Outline color used to indicate the current date. |
| `--m3e-calendar-item-current-outline-thickness` | `length` | — | Outline thickness used to indicate the current date. |
| `--m3e-calendar-item-disabled-color` | `color` | `--color-*` | Color used for disabled date items. |
| `--m3e-calendar-item-disabled-color-opacity` | `number` | — | Opacity applied to the disabled item color. |
| `--m3e-calendar-item-font-size` | `length` | `--text-*` | Font size of items in year and multi‑year views. |
| `--m3e-calendar-item-font-weight` | `number` | `--font-weight-*` | Font weight of items in year and multi‑year views. |
| `--m3e-calendar-item-line-height` | `length` | `--leading-*` | Line height of items in year and multi‑year views. |
| `--m3e-calendar-item-selected-color` | `color` | `--color-*` | Text color for selected date items. |
| `--m3e-calendar-item-selected-container-color` | `color` | `--color-*` | Background color for selected date items. |
| `--m3e-calendar-item-selected-focus-color` | `color` | `--color-*` | Focus color used when interacting with selected date items. |
| `--m3e-calendar-item-selected-hover-color` | `color` | `--color-*` | Hover color used when interacting with selected date items. |
| `--m3e-calendar-item-selected-ripple-color` | `color` | `--color-*` | Ripple color used when interacting with selected date items. |
| `--m3e-calendar-item-special-color` | `color` | `--color-*` | Text color for dates marked as special. |
| `--m3e-calendar-item-special-container-color` | `color` | `--color-*` | Background color for dates marked as special. |
| `--m3e-calendar-item-special-focus-color` | `color` | `--color-*` | Focus color used when interacting with dates marked as special. |
| `--m3e-calendar-item-special-hover-color` | `color` | `--color-*` | Hover color used when interacting with dates marked as special. |
| `--m3e-calendar-item-special-ripple-color` | `color` | `--color-*` | Ripple color used when interacting with dates marked as special. |
| `--m3e-calendar-item-tracking` | `length` | `--tracking-*` | Letter spacing of items in year and multi‑year views. |
| `--m3e-calendar-padding` | `length` | — | Padding applied to the calendar header and body. |
| `--m3e-calendar-period-button-text-color` | `color` | `--color-*` | Text color used for the period‑navigation buttons in the header. |
| `--m3e-calendar-range-color` | `color` | `--color-*` | Text color for dates within a selected range. |
| `--m3e-calendar-range-container-color` | `color` | `--color-*` | Background color applied to the selected date range. |
| `--m3e-calendar-slide-animation-duration` | `time` | `--transition-duration-*` | Duration of slide transitions between calendar views. |
| `--m3e-calendar-weekday-color` | `color` | `--color-*` | Text color for weekday labels in month view. |
| `--m3e-calendar-weekday-font-size` | `length` | `--text-*` | Font size of weekday labels in month view. |
| `--m3e-calendar-weekday-font-weight` | `number` | `--font-weight-*` | Font weight of weekday labels in month view. |
| `--m3e-calendar-weekday-line-height` | `length` | `--leading-*` | Line height of weekday labels in month view. |
| `--m3e-calendar-weekday-tracking` | `length` | `--tracking-*` | Letter spacing of weekday labels in month view. |

## `m3e-card`

A content container for text, images (or other media), and actions in the context of a single subject.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-card-padding` | `length` | — | Internal spacing for all slotted regions |
| `--m3e-card-shape` | `length` | `--radius-*` | Corner radius of the card container. |
| `--m3e-elevated-card-container-color` | `color` | `--color-*` | Background color of the elevated card container. |
| `--m3e-elevated-card-container-elevation` | `*` | `--shadow-*` | Elevation level for elevated card container. |
| `--m3e-elevated-card-disabled-container-color` | `color` | `--color-*` | Background color when disabled. |
| `--m3e-elevated-card-disabled-container-elevation` | `*` | `--shadow-*` | Elevation level when disabled. |
| `--m3e-elevated-card-disabled-container-elevation-color` | `color` | `--color-*` | Shadow color when disabled. |
| `--m3e-elevated-card-disabled-container-elevation-opacity` | `number` | — | Shadow opacity when disabled. |
| `--m3e-elevated-card-disabled-container-opacity` | `number` | — | Overall container opacity when disabled. |
| `--m3e-elevated-card-disabled-text-color` | `color` | `--color-*` | Text color when elevated card is disabled. |
| `--m3e-elevated-card-disabled-text-opacity` | `number` | — | Opacity applied to text when disabled. |
| `--m3e-elevated-card-focus-container-elevation` | `*` | `--shadow-*` | Elevation level on focus. |
| `--m3e-elevated-card-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus. |
| `--m3e-elevated-card-focus-state-layer-opacity` | `number` | — | State layer opacity on focus. |
| `--m3e-elevated-card-focus-text-color` | `color` | `--color-*` | Text color on focus. |
| `--m3e-elevated-card-hover-container-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-elevated-card-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover. |
| `--m3e-elevated-card-hover-state-layer-opacity` | `number` | — | State layer opacity on hover. |
| `--m3e-elevated-card-hover-text-color` | `color` | `--color-*` | Text color on hover. |
| `--m3e-elevated-card-pressed-container-elevation` | `*` | `--shadow-*` | Elevation level on press. |
| `--m3e-elevated-card-pressed-state-layer-color` | `color` | `--color-*` | State layer color on press. |
| `--m3e-elevated-card-pressed-state-layer-opacity` | `number` | — | State layer opacity on press. |
| `--m3e-elevated-card-pressed-text-color` | `color` | `--color-*` | Text color on press. |
| `--m3e-elevated-card-text-color` | `color` | `--color-*` | Foreground color for text content in elevated cards. |
| `--m3e-filled-card-container-color` | `color` | `--color-*` | Background color of the filled card container. |
| `--m3e-filled-card-container-elevation` | `*` | `--shadow-*` | Elevation level for filled card container. |
| `--m3e-filled-card-disabled-container-color` | `color` | `--color-*` | Background color when disabled. |
| `--m3e-filled-card-disabled-container-elevation` | `*` | `--shadow-*` | Elevation level when disabled. |
| `--m3e-filled-card-disabled-container-elevation-color` | `color` | `--color-*` | Shadow color when disabled. |
| `--m3e-filled-card-disabled-container-elevation-opacity` | `number` | — | Shadow opacity when disabled. |
| `--m3e-filled-card-disabled-container-opacity` | `number` | — | Overall container opacity when disabled. |
| `--m3e-filled-card-disabled-text-color` | `color` | `--color-*` | Text color when filled card is disabled. |
| `--m3e-filled-card-disabled-text-opacity` | `number` | — | Opacity applied to text when disabled. |
| `--m3e-filled-card-focus-container-elevation` | `*` | `--shadow-*` | Elevation level on focus. |
| `--m3e-filled-card-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus. |
| `--m3e-filled-card-focus-state-layer-opacity` | `number` | — | State layer opacity on focus. |
| `--m3e-filled-card-focus-text-color` | `color` | `--color-*` | Text color on focus. |
| `--m3e-filled-card-hover-container-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-filled-card-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover. |
| `--m3e-filled-card-hover-state-layer-opacity` | `number` | — | State layer opacity on hover. |
| `--m3e-filled-card-hover-text-color` | `color` | `--color-*` | Text color on hover. |
| `--m3e-filled-card-pressed-container-elevation` | `*` | `--shadow-*` | Elevation level on press. |
| `--m3e-filled-card-pressed-state-layer-color` | `color` | `--color-*` | State layer color on press. |
| `--m3e-filled-card-pressed-state-layer-opacity` | `number` | — | State layer opacity on press. |
| `--m3e-filled-card-pressed-text-color` | `color` | `--color-*` | Text color on press. |
| `--m3e-filled-card-text-color` | `color` | `--color-*` | Foreground color for text content in filled cards. |
| `--m3e-outlined-card-container-color` | `color` | `--color-*` | Background color of the outlined card container. |
| `--m3e-outlined-card-container-elevation` | `*` | `--shadow-*` | Elevation level for outlined card container. |
| `--m3e-outlined-card-disabled-container-elevation` | `*` | `--shadow-*` | Elevation level when disabled. |
| `--m3e-outlined-card-disabled-container-elevation-color` | `color` | `--color-*` | Shadow color when disabled. |
| `--m3e-outlined-card-disabled-container-elevation-opacity` | `number` | — | Shadow opacity when disabled. |
| `--m3e-outlined-card-disabled-outline-color` | `color` | `--color-*` | Border color when disabled. |
| `--m3e-outlined-card-disabled-outline-opacity` | `number` | — | Border opacity when disabled. |
| `--m3e-outlined-card-disabled-text-color` | `color` | `--color-*` | Text color when outlined card is disabled. |
| `--m3e-outlined-card-disabled-text-opacity` | `number` | — | Opacity applied to text when disabled. |
| `--m3e-outlined-card-focus-container-elevation` | `*` | `--shadow-*` | Elevation level on focus. |
| `--m3e-outlined-card-focus-outline-color` | `color` | `--color-*` | Border color on focus. |
| `--m3e-outlined-card-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus. |
| `--m3e-outlined-card-focus-state-layer-opacity` | `number` | — | State layer opacity on focus. |
| `--m3e-outlined-card-focus-text-color` | `color` | `--color-*` | Text color on focus. |
| `--m3e-outlined-card-hover-container-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-outlined-card-hover-outline-color` | `color` | `--color-*` | Border color on hover. |
| `--m3e-outlined-card-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover. |
| `--m3e-outlined-card-hover-state-layer-opacity` | `number` | — | State layer opacity on hover. |
| `--m3e-outlined-card-hover-text-color` | `color` | `--color-*` | Text color on hover. |
| `--m3e-outlined-card-outline-color` | `color` | `--color-*` | Border color for outlined cards. |
| `--m3e-outlined-card-outline-thickness` | `length` | — | Border thickness for outlined cards. |
| `--m3e-outlined-card-pressed-container-elevation` | `*` | `--shadow-*` | Elevation level on press. |
| `--m3e-outlined-card-pressed-outline-color` | `color` | `--color-*` | Border color on press. |
| `--m3e-outlined-card-pressed-state-layer-color` | `color` | `--color-*` | State layer color on press. |
| `--m3e-outlined-card-pressed-state-layer-opacity` | `number` | — | State layer opacity on press. |
| `--m3e-outlined-card-pressed-text-color` | `color` | `--color-*` | Text color on press. |
| `--m3e-outlined-card-text-color` | `color` | `--color-*` | Foreground color for text content in outlined cards. |

## `m3e-checkbox`

A checkbox that allows a user to select one or more options from a limited number of choices.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-checkbox-container-shape` | `length` | `--radius-*` | Border radius of the icon container. |
| `--m3e-checkbox-container-size` | `length` | — | Base size of the checkbox container. |
| `--m3e-checkbox-icon-size` | `length` | — | Size of the checkbox icon inside the container. |
| `--m3e-checkbox-selected-container-color` | `color` | `--color-*` | Background color for selected container. |
| `--m3e-checkbox-selected-disabled-container-color` | `color` | `--color-*` | Base color for disabled selected container. |
| `--m3e-checkbox-selected-disabled-container-opacity` | `number` | — | Opacity for disabled selected container. |
| `--m3e-checkbox-selected-disabled-icon-color` | `color` | `--color-*` | Base color for disabled selected icon. |
| `--m3e-checkbox-selected-disabled-icon-opacity` | `number` | — | Opacity for disabled selected icon. |
| `--m3e-checkbox-selected-error-focus-color` | `color` | `--color-*` | Ripple focus color for invalid selected state. |
| `--m3e-checkbox-selected-error-hover-color` | `color` | `--color-*` | Ripple hover color for invalid selected state. |
| `--m3e-checkbox-selected-error-ripple-color` | `color` | `--color-*` | Ripple base color for invalid selected state. |
| `--m3e-checkbox-selected-focus-color` | `color` | `--color-*` | Ripple focus color for selected state. |
| `--m3e-checkbox-selected-hover-color` | `color` | `--color-*` | Ripple hover color for selected state. |
| `--m3e-checkbox-selected-icon-color` | `color` | `--color-*` | Icon color for selected state. |
| `--m3e-checkbox-selected-ripple-color` | `color` | `--color-*` | Ripple base color for selected state. |
| `--m3e-checkbox-unselected-disabled-outline-color` | `color` | `--color-*` | Base color for disabled unselected outline. |
| `--m3e-checkbox-unselected-disabled-outline-opacity` | `number` | — | Opacity for disabled unselected outline. |
| `--m3e-checkbox-unselected-error-focus-color` | `color` | `--color-*` | Ripple focus color for invalid unselected state. |
| `--m3e-checkbox-unselected-error-hover-color` | `color` | `--color-*` | Ripple hover color for invalid unselected state. |
| `--m3e-checkbox-unselected-error-outline-color` | `color` | `--color-*` | Border color for invalid unselected state. |
| `--m3e-checkbox-unselected-error-ripple-color` | `color` | `--color-*` | Ripple base color for invalid unselected state. |
| `--m3e-checkbox-unselected-focus-color` | `color` | `--color-*` | Ripple focus color for unselected state. |
| `--m3e-checkbox-unselected-hover-color` | `color` | `--color-*` | Ripple hover color for unselected state. |
| `--m3e-checkbox-unselected-hover-outline-color` | `color` | `--color-*` | Border color on hover when unselected. |
| `--m3e-checkbox-unselected-outline-color` | `color` | `--color-*` | Border color for unselected state. |
| `--m3e-checkbox-unselected-outline-thickness` | `length` | — | Border thickness for unselected state. |
| `--m3e-checkbox-unselected-ripple-color` | `color` | `--color-*` | Ripple base color for unselected state. |

## `m3e-chip`

A non-interactive chip used to convey small pieces of information.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-container-height` | `length` | — | Base height of the chip container before density adjustment. |
| `--m3e-chip-container-shape` | `length` | `--radius-*` | Border radius of the chip container. |
| `--m3e-chip-icon-color` | `color` | `--color-*` | Icon color in default state. |
| `--m3e-chip-icon-size` | `length` | — | Font size of leading/trailing icons. |
| `--m3e-chip-label-text-color` | `color` | `--color-*` | Label text color in default state. |
| `--m3e-chip-label-text-font-size` | `length` | `--text-*` | Font size of the chip label text. |
| `--m3e-chip-label-text-font-weight` | `number` | `--font-weight-*` | Font weight of the chip label text. |
| `--m3e-chip-label-text-line-height` | `length` | `--leading-*` | Line height of the chip label text. |
| `--m3e-chip-label-text-tracking` | `length` | `--tracking-*` | Letter spacing of the chip label text. |
| `--m3e-chip-padding-end` | `length` | — | Default end padding when no trailing icon is present. |
| `--m3e-chip-padding-start` | `length` | — | Default start padding when no icon is present. |
| `--m3e-chip-spacing` | `length` | — | Horizontal gap between chip content elements. |
| `--m3e-chip-with-icon-padding-end` | `length` | — | End padding when trailing icon is present. |
| `--m3e-chip-with-icon-padding-start` | `length` | — | Start padding when leading icon is present. |
| `--m3e-elevated-chip-container-color` | `color` | `--color-*` | Background color for elevated variant. |
| `--m3e-elevated-chip-elevation` | `*` | `--shadow-*` | Elevation level for elevated variant. |
| `--m3e-elevated-chip-hover-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-outlined-chip-outline-color` | `color` | `--color-*` | Outline color for outlined variant. |
| `--m3e-outlined-chip-outline-thickness` | `length` | — | Outline thickness for outlined variant. |

## `m3e-chip-set`

A container used to organize chips into a cohesive unit.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-set-spacing` | `length` | — | The spacing (gap) between chips in the set. |

## `m3e-circular-progress-indicator`

A circular indicator of progress and activity.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-circular-flat-progress-indicator-diameter` | `*` | — | Diameter of the `flat` variant. |
| `--m3e-circular-progress-indicator-thickness` | `length` | — | Thickness of the progress indicator. |
| `--m3e-circular-wavy-progress-indicator-amplitude` | `*` | — | Amplitude of the `wavy` variant. |
| `--m3e-circular-wavy-progress-indicator-diameter` | `*` | — | Diameter of the `wavy` variant. |
| `--m3e-circular-wavy-progress-indicator-wavelength` | `*` | — | Wavelength of the `wavy` variant. |
| `--m3e-progress-indicator-color` | `color` | `--color-*` | Color of the progress indicator (foreground). |
| `--m3e-progress-indicator-track-color` | `color` | `--color-*` | Track color of the progress indicator (background). |

## `m3e-collapsible`

A container used to expand and collapse content.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-collapsible-animation-duration` | `time` | `--transition-duration-*` | The duration of the expand / collapse animation. |

## `m3e-content-pane`

A shaped surface for vertically scrollable content.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-content-pane-container-color` | `color` | `--color-*` | Background color of the pane's surface. |
| `--m3e-content-pane-container-padding` | `length` | — | Internal padding applied to all sides of the scrollable content. |
| `--m3e-content-pane-container-shape` | `length` | `--radius-*` | Corner radius applied to the pane's outer surface. |

## `m3e-date-input`

A segmented input for entering date and/or time values using a keyboard.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-date-input-color` | `color` | `--color-*` | Color of the date input text when enabled. |
| `--m3e-date-input-disabled-color` | `color` | `--color-*` | Color of the date input text when disabled. |
| `--m3e-date-input-disabled-opacity` | `number` | — | Opacity applied to the disabled date input text. |
| `--m3e-date-input-focused-color` | `color` | `--color-*` | Text color of the selected date input segment when focused. |
| `--m3e-date-input-focused-container-color` | `color` | `--color-*` | Background color of the selected date input segment when focused. |

## `m3e-datepicker`

Presents a date picker on a temporary surface.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-datepicker-actions-padding-inline` | `length` | — | Inline‑axis padding of the action row. |
| `--m3e-datepicker-container-color` | `color` | `--color-*` | Background color of the standard container surface. |
| `--m3e-datepicker-container-elevation` | `*` | `--shadow-*` | Elevation shadow applied to the container surface. |
| `--m3e-datepicker-container-padding-block` | `length` | — | Block‑axis padding of the date picker container. |
| `--m3e-datepicker-container-padding-inline` | `length` | — | Inline‑axis padding of the date picker container. |
| `--m3e-datepicker-docked-container-color` | `color` | `--color-*` | Background color of the container in docked mode. |
| `--m3e-datepicker-docked-container-shape` | `length` | `--radius-*` | Corner radius of the container in docked mode. |
| `--m3e-datepicker-modal-container-color` | `color` | `--color-*` | Background color of the container in modal mode. |
| `--m3e-datepicker-modal-container-shape` | `length` | `--radius-*` | Corner radius of the container in modal mode. |
| `--m3e-datepicker-modal-headline-color` | `color` | `--color-*` | Color used for the modal headline text. |
| `--m3e-datepicker-modal-headline-font-size` | `length` | `--text-*` | Font size used for the modal headline text. |
| `--m3e-datepicker-modal-headline-font-weight` | `number` | `--font-weight-*` | Font weight used for the modal headline text. |
| `--m3e-datepicker-modal-headline-line-height` | `length` | `--leading-*` | Line height used for the modal headline text. |
| `--m3e-datepicker-modal-headline-tracking` | `length` | `--tracking-*` | Letter spacing used for the modal headline text. |
| `--m3e-datepicker-modal-supporting-text-color` | `color` | `--color-*` | Color used for supporting text in modal mode. |
| `--m3e-datepicker-modal-supporting-text-font-size` | `length` | `--text-*` | Font size used for supporting text in modal mode. |
| `--m3e-datepicker-modal-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight used for supporting text in modal mode. |
| `--m3e-datepicker-modal-supporting-text-line-height` | `length` | `--leading-*` | Line height used for supporting text in modal mode. |
| `--m3e-datepicker-modal-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing used for supporting text in modal mode. |
| `--m3e-dialog-scrim-color` | `color` | `--color-*` | Base color used for the modal scrim behind the picker. |
| `--m3e-dialog-scrim-opacity` | `number` | — | Opacity applied to the scrim color in modal mode. |
| `--m3e-divider-color` | `color` | `--color-*` | Color of divider rules within the picker. |
| `--m3e-divider-thickness` | `length` | — | Thickness of divider elements within the picker. |

## `m3e-dialog`

A dialog that provides important prompts in a user flow.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-dialog-color` | `color` | `--color-*` | Foreground color of the dialog. |
| `--m3e-dialog-container-color` | `color` | `--color-*` | Background color of the dialog container. |
| `--m3e-dialog-content-color` | `color` | `--color-*` | Foreground color of the dialog content. |
| `--m3e-dialog-content-font-size` | `length` | `--text-*` | Font size for the dialog content. |
| `--m3e-dialog-content-font-weight` | `number` | `--font-weight-*` | Font weight for the dialog content. |
| `--m3e-dialog-content-line-height` | `length` | `--leading-*` | Line height for the dialog content. |
| `--m3e-dialog-content-tracking` | `length` | `--tracking-*` | Letter spacing for the dialog content. |
| `--m3e-dialog-header-color` | `color` | `--color-*` | Foreground color of the dialog header. |
| `--m3e-dialog-header-container-color` | `color` | `--color-*` | Background color of the dialog header. |
| `--m3e-dialog-header-font-size` | `length` | `--text-*` | Font size for the dialog header. |
| `--m3e-dialog-header-font-weight` | `number` | `--font-weight-*` | Font weight for the dialog header. |
| `--m3e-dialog-header-line-height` | `length` | `--leading-*` | Line height for the dialog header. |
| `--m3e-dialog-header-tracking` | `length` | `--tracking-*` | Letter spacing for the dialog header. |
| `--m3e-dialog-max-height` | `length` | — | Maximum height of the dialog. |
| `--m3e-dialog-max-width` | `length` | — | Maximum width of the dialog. |
| `--m3e-dialog-min-width` | `length` | — | Minimum width of the dialog. |
| `--m3e-dialog-scrim-color` | `color` | `--color-*` | Color of the scrim (backdrop overlay). |
| `--m3e-dialog-scrim-opacity` | `number` | — | Opacity of the scrim when open. |
| `--m3e-dialog-shape` | `length` | `--radius-*` | Border radius of the dialog container. |

## `m3e-divider`

A thin line that separates content in lists or other containers.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-divider-color` | `color` | `--color-*` | Color of the divider line. |
| `--m3e-divider-inset-end-size` | `length` | — | When inset, trailing inset size. |
| `--m3e-divider-inset-size` | `length` | — | When inset, fallback inset size used when no specific start or end inset is provided. |
| `--m3e-divider-inset-start-size` | `length` | — | When inset, leading inset size. |
| `--m3e-divider-thickness` | `length` | — | Thickness of the divider line. |

## `m3e-drawer-container`

A container for one or two sliding drawers.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-drawer-container-color` | `color` | `--color-*` | The background color of the drawer container. |
| `--m3e-drawer-container-elevation` | `*` | `--shadow-*` | The elevation level of the drawer container. |
| `--m3e-drawer-container-scrim-opacity` | `number` | — | The opacity of the scrim behind the drawer. |
| `--m3e-drawer-container-width` | `length` | — | The width of the drawer container. |
| `--m3e-drawer-divider-color` | `color` | `--color-*` | The color of the divider between drawer sections. |
| `--m3e-drawer-divider-thickness` | `length` | — | The thickness of the divider line. |
| `--m3e-modal-drawer-container-color` | `color` | `--color-*` | The background color of the modal drawer container. |
| `--m3e-modal-drawer-elevation` | `*` | `--shadow-*` | The elevation level of the modal drawer container. |
| `--m3e-modal-drawer-end-shape` | `length` | `--radius-*` | The shape of the drawer's end edge (typically right in LTR). |
| `--m3e-modal-drawer-start-shape` | `length` | `--radius-*` | The shape of the drawer's start edge (typically left in LTR). |

## `m3e-elevation`

Visually depicts elevation using a shadow.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-elevation-color` | `color` | `--color-*` | Color used to depict elevation. |
| `--m3e-elevation-focus-level` | `*` | `--shadow-*` | Elevation on focus (box-shadow). |
| `--m3e-elevation-hover-level` | `*` | `--shadow-*` | Elevation on hover (box-shadow). |
| `--m3e-elevation-level` | `*` | `--shadow-*` | Elevation when resting (box-shadow). |
| `--m3e-elevation-lift-duration` | `time` | `--transition-duration-*` | Duration when lifting. |
| `--m3e-elevation-lift-easing` | `*` | `--ease-*` | Easing curve when lifting. |
| `--m3e-elevation-pressed-level` | `*` | `--shadow-*` | Elevation on pressed (box-shadow). |
| `--m3e-elevation-settle-duration` | `time` | `--transition-duration-*` | Duration when settling. |
| `--m3e-elevation-settle-easing` | `*` | `--ease-*` | Easing curve when settling. |

## `m3e-expandable-list-item`

An item in a list that can be expanded to show more items.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-expandable-list-item-bounce-duration` | `time` | `--transition-duration-*` | Duration of the bounce animation when expanding. |
| `--m3e-expandable-list-item-bounce-factor` | `*` | — | Multiplication factor for the bounce effect. |
| `--m3e-expandable-list-item-expand-duration` | `time` | `--transition-duration-*` | Duration of the expand/collapse animation. |
| `--m3e-expandable-list-item-expanded-toggle-icon-container-color` | `color` | `--color-*` | Background color of the toggle icon container when expanded. |
| `--m3e-expandable-list-item-toggle-icon-container-shape` | `length` | `--radius-*` | Border radius of the toggle icon container. |
| `--m3e-expandable-list-item-toggle-icon-container-width` | `length` | — | Width of the toggle icon container. |
| `--m3e-expandable-list-item-toggle-icon-size` | `length` | — | Size of the toggle icon. |
| `--m3e-list-item-between-space` | `length` | — | Horizontal gap between elements. |
| `--m3e-list-item-container-color` | `color` | `--color-*` | Background color of the list item. |
| `--m3e-list-item-container-shape` | `length` | `--radius-*` | Border radius of the list item. |
| `--m3e-list-item-disabled-label-text-color` | `color` | `--color-*` | Color for the main content when disabled. |
| `--m3e-list-item-disabled-label-text-opacity` | `number` | — | Opacity for the main content when disabled. |
| `--m3e-list-item-disabled-leading-color` | `color` | `--color-*` | Color for the leading icon when disabled. |
| `--m3e-list-item-disabled-leading-opacity` | `number` | — | Opacity for the leading icon when disabled. |
| `--m3e-list-item-disabled-media-opacity` | `number` | — | Opacity for media when disabled. |
| `--m3e-list-item-disabled-overline-color` | `color` | `--color-*` | Color for the overline slot when disabled. |
| `--m3e-list-item-disabled-overline-opacity` | `number` | — | Opacity for the overline slot when disabled. |
| `--m3e-list-item-disabled-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot when disabled. |
| `--m3e-list-item-disabled-supporting-text-opacity` | `number` | — | Opacity for the supporting text slot when disabled. |
| `--m3e-list-item-disabled-trailing-color` | `color` | `--color-*` | Color for the trailing icon when disabled. |
| `--m3e-list-item-disabled-trailing-opacity` | `number` | — | Opacity for the trailing icon when disabled. |
| `--m3e-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of the list item on focus. |
| `--m3e-list-item-focus-state-layer-color` | `color` | `--color-*` | Color for the focus state layer. |
| `--m3e-list-item-focus-state-layer-opacity` | `number` | — | Opacity for the focus state layer. |
| `--m3e-list-item-font-size` | `length` | `--text-*` | Font size for main content. |
| `--m3e-list-item-font-weight` | `number` | `--font-weight-*` | Font weight for main content. |
| `--m3e-list-item-height` | `length` | — | Minimum height of the list item. |
| `--m3e-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of the list item on hover. |
| `--m3e-list-item-hover-state-layer-color` | `color` | `--color-*` | Color for the hover state layer. |
| `--m3e-list-item-hover-state-layer-opacity` | `number` | — | Opacity for the hover state layer. |
| `--m3e-list-item-icon-size` | `length` | — | Size for leading/trailing icons. |
| `--m3e-list-item-image-height` | `length` | — | Height of the image slot. |
| `--m3e-list-item-image-shape` | `length` | `--radius-*` | Border radius of the image slot. |
| `--m3e-list-item-image-width` | `length` | — | Width of the image slot. |
| `--m3e-list-item-label-text-color` | `color` | `--color-*` | Color for the main content. |
| `--m3e-list-item-leading-color` | `color` | `--color-*` | Color for the leading content. |
| `--m3e-list-item-leading-space` | `length` | — | Horizontal padding for the leading side. |
| `--m3e-list-item-line-height` | `length` | `--leading-*` | Line height for main content. |
| `--m3e-list-item-one-line-bottom-space` | `length` | — | Bottom padding for one-line items. |
| `--m3e-list-item-one-line-height` | `length` | `--leading-*` | Minimum height of a one line list item. |
| `--m3e-list-item-one-line-top-space` | `length` | — | Top padding for one-line items. |
| `--m3e-list-item-overline-color` | `color` | `--color-*` | Color for the overline slot. |
| `--m3e-list-item-overline-font-size` | `length` | `--text-*` | Font size for overline slot. |
| `--m3e-list-item-overline-font-weight` | `number` | `--font-weight-*` | Font weight for overline slot. |
| `--m3e-list-item-overline-line-height` | `length` | `--leading-*` | Line height for overline slot. |
| `--m3e-list-item-overline-tracking` | `length` | `--tracking-*` | Letter spacing for overline slot. |
| `--m3e-list-item-padding-block` | `length` | — | Vertical padding for the list item. |
| `--m3e-list-item-padding-inline` | `length` | — | Horizontal padding for the list item. |
| `--m3e-list-item-pressed-state-layer-color` | `color` | `--color-*` | Color for the pressed state layer. |
| `--m3e-list-item-pressed-state-layer-opacity` | `number` | — | Opacity for the pressed state layer. |
| `--m3e-list-item-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot. |
| `--m3e-list-item-supporting-text-font-size` | `length` | `--text-*` | Font size for supporting text slot. |
| `--m3e-list-item-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight for supporting text slot. |
| `--m3e-list-item-supporting-text-line-height` | `length` | `--leading-*` | Line height for supporting text slot. |
| `--m3e-list-item-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing for supporting text slot. |
| `--m3e-list-item-three-line-bottom-space` | `length` | — | Bottom padding for three-line items. |
| `--m3e-list-item-three-line-height` | `length` | `--leading-*` | Minimum height of a three line list item. |
| `--m3e-list-item-three-line-top-offset` | `length` | — | Top offset for media in three line items. |
| `--m3e-list-item-three-line-top-space` | `length` | — | Top padding for three-line items. |
| `--m3e-list-item-tracking` | `length` | `--tracking-*` | Letter spacing for main content. |
| `--m3e-list-item-trailing-color` | `color` | `--color-*` | Color for the trailing content. |
| `--m3e-list-item-trailing-space` | `length` | — | Horizontal padding for the trailing side. |
| `--m3e-list-item-trailing-text-font-size` | `length` | `--text-*` | Font size for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-font-weight` | `number` | `--font-weight-*` | Font weight for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-line-height` | `length` | `--leading-*` | Line height for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-tracking` | `length` | `--tracking-*` | Letter spacing for trailing supporting text slot. |
| `--m3e-list-item-two-line-bottom-space` | `length` | — | Bottom padding for two-line items. |
| `--m3e-list-item-two-line-height` | `length` | `--leading-*` | Minimum height of a two line list item. |
| `--m3e-list-item-two-line-top-space` | `length` | — | Top padding for two-line items. |
| `--m3e-list-item-video-height` | `length` | — | Height of the video slot. |
| `--m3e-list-item-video-shape` | `length` | `--radius-*` | Border radius of the video slot. |
| `--m3e-list-item-video-width` | `length` | — | Width of the video slot. |
| `--m3e-segmented-list-container-shape` | `length` | `--radius-*` | Border radius of the segmented list container shape. |
| `--m3e-segmented-list-segment-gap` | `length` | — | Gap between list item segments. |

## `m3e-expansion-header`

A button used to toggle the expanded state of an expansion panel.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-expansion-header-collapsed-height` | `length` | — | Height of the header when the panel is collapsed. |
| `--m3e-expansion-header-expanded-height` | `length` | — | Height of the header when the panel is expanded. |
| `--m3e-expansion-header-font-size` | `length` | `--text-*` | The font size of the header text. |
| `--m3e-expansion-header-font-weight` | `number` | `--font-weight-*` | The font weight of the header text. |
| `--m3e-expansion-header-line-height` | `length` | `--leading-*` | The line height of the header text. |
| `--m3e-expansion-header-padding-left` | `length` | — | Left padding inside the header. |
| `--m3e-expansion-header-padding-right` | `length` | — | Right padding inside the header. |
| `--m3e-expansion-header-spacing` | `length` | — | Spacing between header elements. |
| `--m3e-expansion-header-toggle-icon-size` | `length` | — | Size of the toggle icon (e.g. chevron). |
| `--m3e-expansion-header-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) of the header text. |

## `m3e-expansion-panel`

An expandable details-summary view.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-expansion-header-collapsed-height` | `length` | — | Height of the header when the panel is collapsed. |
| `--m3e-expansion-header-expanded-height` | `length` | — | Height of the header when the panel is expanded. |
| `--m3e-expansion-header-font-size` | `length` | `--text-*` | The font size of the header text. |
| `--m3e-expansion-header-font-weight` | `number` | `--font-weight-*` | The font weight of the header text. |
| `--m3e-expansion-header-line-height` | `length` | `--leading-*` | The line height of the header text. |
| `--m3e-expansion-header-padding-left` | `length` | — | Left padding inside the header. |
| `--m3e-expansion-header-padding-right` | `length` | — | Right padding inside the header. |
| `--m3e-expansion-header-spacing` | `length` | — | Spacing between header elements. |
| `--m3e-expansion-header-toggle-icon-size` | `length` | — | Size of the toggle icon (e.g. chevron). |
| `--m3e-expansion-header-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) of the header text. |
| `--m3e-expansion-panel-actions-divider-color` | `color` | `--color-*` | Color of the divider above actions. |
| `--m3e-expansion-panel-actions-divider-thickness` | `length` | — | Thickness of the divider above actions. |
| `--m3e-expansion-panel-actions-padding` | `length` | — | Padding around the actions section. |
| `--m3e-expansion-panel-actions-spacing` | `length` | — | Spacing between action buttons or elements. |
| `--m3e-expansion-panel-container-color` | `color` | `--color-*` | Background color of the panel container. |
| `--m3e-expansion-panel-content-padding` | `length` | — | Padding around the panel's content area. |
| `--m3e-expansion-panel-disabled-text-color` | `color` | `--color-*` | Color of the panel's text content, when disabled. |
| `--m3e-expansion-panel-disabled-text-opacity` | `number` | — | Opacity of the panel's text content, when disabled. |
| `--m3e-expansion-panel-elevation` | `*` | `--shadow-*` | Elevation level when the panel is collapsed. |
| `--m3e-expansion-panel-open-elevation` | `*` | `--shadow-*` | Elevation level when the panel is expanded. |
| `--m3e-expansion-panel-open-shape` | `length` | `--radius-*` | Shape (e.g. border radius) of the panel when expanded. |
| `--m3e-expansion-panel-shape` | `length` | `--radius-*` | Shape (e.g. border radius) of the panel when collapsed. |
| `--m3e-expansion-panel-text-color` | `color` | `--color-*` | Color of the panel's text content. |

## `m3e-fab`

A floating action button (FAB) used to present important actions.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-fab-container-color` | `color` | `--color-*` | Default container background color for FAB (all variants). |
| `--m3e-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for FAB (all variants). |
| `--m3e-fab-container-height` | `length` | — | Height of the FAB container for all size variants. |
| `--m3e-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (all variants). |
| `--m3e-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (all variants). |
| `--m3e-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (all variants). |
| `--m3e-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (all variants). |
| `--m3e-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (all variants). |
| `--m3e-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (all variants). |
| `--m3e-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (all variants). |
| `--m3e-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (all variants). |
| `--m3e-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (all variants). |
| `--m3e-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (all variants). |
| `--m3e-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (all variants). |
| `--m3e-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (all variants). |
| `--m3e-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (all variants). |
| `--m3e-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (all variants). |
| `--m3e-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (all variants). |
| `--m3e-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (all variants). |
| `--m3e-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (all variants). |
| `--m3e-fab-icon-color` | `color` | `--color-*` | Default icon color for FAB (all variants). |
| `--m3e-fab-icon-label-space` | `length` | — | Space between icon and label for the FAB for all size variants. |
| `--m3e-fab-icon-size` | `length` | — | Icon size for the FAB for all size variants. |
| `--m3e-fab-label-text-color` | `color` | `--color-*` | Default label text color for FAB (all variants). |
| `--m3e-fab-label-text-font-size` | `length` | `--text-*` | Font size for the FAB label text for all size variants. |
| `--m3e-fab-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the FAB label text for all size variants. |
| `--m3e-fab-label-text-line-height` | `length` | `--leading-*` | Line height for the FAB label text for all size variants. |
| `--m3e-fab-label-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the FAB label text for all size variants. |
| `--m3e-fab-large-container-height` | `length` | — | Height of the large FAB container. |
| `--m3e-fab-large-icon-label-space` | `length` | — | Space between icon and label for the large FAB. |
| `--m3e-fab-large-icon-size` | `length` | — | Icon size for the large FAB. |
| `--m3e-fab-large-label-text-font-size` | `length` | `--text-*` | Font size for the large FAB label text. |
| `--m3e-fab-large-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the large FAB label text. |
| `--m3e-fab-large-label-text-line-height` | `length` | `--leading-*` | Line height for the large FAB label text. |
| `--m3e-fab-large-label-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the large FAB label text. |
| `--m3e-fab-large-leading-space` | `length` | — | Leading space for the large FAB. |
| `--m3e-fab-large-shape` | `length` | `--radius-*` | Border radius for the large FAB. |
| `--m3e-fab-large-trailing-space` | `length` | — | Trailing space for the large FAB. |
| `--m3e-fab-leading-space` | `length` | — | Leading space for the FAB for all size variants. |
| `--m3e-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for FAB (all variants). |
| `--m3e-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (all variants). |
| `--m3e-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (all variants). |
| `--m3e-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (all variants). |
| `--m3e-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (all variants). |
| `--m3e-fab-medium-container-height` | `length` | — | Height of the medium FAB container. |
| `--m3e-fab-medium-icon-label-space` | `length` | — | Space between icon and label for the medium FAB. |
| `--m3e-fab-medium-icon-size` | `length` | — | Icon size for the medium FAB. |
| `--m3e-fab-medium-label-text-font-size` | `length` | `--text-*` | Font size for the medium FAB label text. |
| `--m3e-fab-medium-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the medium FAB label text. |
| `--m3e-fab-medium-label-text-line-height` | `length` | `--leading-*` | Line height for the medium FAB label text. |
| `--m3e-fab-medium-label-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the medium FAB label text. |
| `--m3e-fab-medium-leading-space` | `length` | — | Leading space for the medium FAB. |
| `--m3e-fab-medium-shape` | `length` | `--radius-*` | Border radius for the medium FAB. |
| `--m3e-fab-medium-trailing-space` | `length` | — | Trailing space for the medium FAB. |
| `--m3e-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (all variants). |
| `--m3e-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (all variants). |
| `--m3e-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (all variants). |
| `--m3e-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (all variants). |
| `--m3e-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (all variants). |
| `--m3e-fab-shape` | `length` | `--radius-*` | Border radius for the FAB for all size variants. |
| `--m3e-fab-small-container-height` | `length` | — | Height of the small FAB container. |
| `--m3e-fab-small-icon-label-space` | `length` | — | Space between icon and label for the small FAB. |
| `--m3e-fab-small-icon-size` | `length` | — | Icon size for the small FAB. |
| `--m3e-fab-small-label-text-font-size` | `length` | `--text-*` | Font size for the small FAB label text. |
| `--m3e-fab-small-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the small FAB label text. |
| `--m3e-fab-small-label-text-line-height` | `length` | `--leading-*` | Line height for the small FAB label text. |
| `--m3e-fab-small-label-text-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) for the small FAB label text. |
| `--m3e-fab-small-leading-space` | `length` | — | Leading space for the small FAB. |
| `--m3e-fab-small-shape` | `length` | `--radius-*` | Border radius for the small FAB. |
| `--m3e-fab-small-trailing-space` | `length` | — | Trailing space for the small FAB. |
| `--m3e-fab-trailing-space` | `length` | — | Trailing space for the FAB for all size variants. |
| `--m3e-primary-container-fab-container-color` | `color` | `--color-*` | Default container background color for primary-container FAB. |
| `--m3e-primary-container-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for primary-container FAB. |
| `--m3e-primary-container-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (primary-container). |
| `--m3e-primary-container-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (primary-container). |
| `--m3e-primary-container-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (primary-container). |
| `--m3e-primary-container-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (primary-container). |
| `--m3e-primary-container-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (primary-container). |
| `--m3e-primary-container-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (primary-container). |
| `--m3e-primary-container-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (primary-container). |
| `--m3e-primary-container-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (primary-container). |
| `--m3e-primary-container-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (primary-container). |
| `--m3e-primary-container-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (primary-container). |
| `--m3e-primary-container-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (primary-container). |
| `--m3e-primary-container-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (primary-container). |
| `--m3e-primary-container-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (primary-container). |
| `--m3e-primary-container-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (primary-container). |
| `--m3e-primary-container-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (primary-container). |
| `--m3e-primary-container-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (primary-container). |
| `--m3e-primary-container-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (primary-container). |
| `--m3e-primary-container-fab-icon-color` | `color` | `--color-*` | Default icon color for primary-container FAB. |
| `--m3e-primary-container-fab-label-text-color` | `color` | `--color-*` | Default label text color for primary-container FAB. |
| `--m3e-primary-container-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for primary-container FAB. |
| `--m3e-primary-container-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (primary-container). |
| `--m3e-primary-container-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (primary-container). |
| `--m3e-primary-container-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (primary-container). |
| `--m3e-primary-container-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (primary-container). |
| `--m3e-primary-container-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (primary-container). |
| `--m3e-primary-container-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (primary-container). |
| `--m3e-primary-container-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (primary-container). |
| `--m3e-primary-container-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (primary-container). |
| `--m3e-primary-container-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (primary-container). |
| `--m3e-primary-fab-container-color` | `color` | `--color-*` | Default container background color for primary FAB. |
| `--m3e-primary-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for primary FAB. |
| `--m3e-primary-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (primary). |
| `--m3e-primary-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (primary). |
| `--m3e-primary-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (primary). |
| `--m3e-primary-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (primary). |
| `--m3e-primary-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (primary). |
| `--m3e-primary-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (primary). |
| `--m3e-primary-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (primary). |
| `--m3e-primary-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (primary). |
| `--m3e-primary-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (primary). |
| `--m3e-primary-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (primary). |
| `--m3e-primary-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (primary). |
| `--m3e-primary-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (primary). |
| `--m3e-primary-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (primary). |
| `--m3e-primary-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (primary). |
| `--m3e-primary-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (primary). |
| `--m3e-primary-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (primary). |
| `--m3e-primary-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (primary). |
| `--m3e-primary-fab-icon-color` | `color` | `--color-*` | Default icon color for primary FAB. |
| `--m3e-primary-fab-label-text-color` | `color` | `--color-*` | Default label text color for primary FAB. |
| `--m3e-primary-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for primary FAB. |
| `--m3e-primary-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (primary). |
| `--m3e-primary-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (primary). |
| `--m3e-primary-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (primary). |
| `--m3e-primary-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (primary). |
| `--m3e-primary-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (primary). |
| `--m3e-primary-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (primary). |
| `--m3e-primary-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (primary). |
| `--m3e-primary-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (primary). |
| `--m3e-primary-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (primary). |
| `--m3e-secondary-container-fab-container-color` | `color` | `--color-*` | Default container background color for secondary-container FAB. |
| `--m3e-secondary-container-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for secondary-container FAB. |
| `--m3e-secondary-container-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (secondary-container). |
| `--m3e-secondary-container-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (secondary-container). |
| `--m3e-secondary-container-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (secondary-container). |
| `--m3e-secondary-container-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (secondary-container). |
| `--m3e-secondary-container-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (secondary-container). |
| `--m3e-secondary-container-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (secondary-container). |
| `--m3e-secondary-container-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (secondary-container). |
| `--m3e-secondary-container-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (secondary-container). |
| `--m3e-secondary-container-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (secondary-container). |
| `--m3e-secondary-container-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (secondary-container). |
| `--m3e-secondary-container-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (secondary-container). |
| `--m3e-secondary-container-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (secondary-container). |
| `--m3e-secondary-container-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (secondary-container). |
| `--m3e-secondary-container-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (secondary-container). |
| `--m3e-secondary-container-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (secondary-container). |
| `--m3e-secondary-container-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (secondary-container). |
| `--m3e-secondary-container-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (secondary-container). |
| `--m3e-secondary-container-fab-icon-color` | `color` | `--color-*` | Default icon color for secondary-container FAB. |
| `--m3e-secondary-container-fab-label-text-color` | `color` | `--color-*` | Default label text color for secondary-container FAB. |
| `--m3e-secondary-container-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for secondary-container FAB. |
| `--m3e-secondary-container-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (secondary-container). |
| `--m3e-secondary-container-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (secondary-container). |
| `--m3e-secondary-container-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (secondary-container). |
| `--m3e-secondary-container-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (secondary-container). |
| `--m3e-secondary-container-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (secondary-container). |
| `--m3e-secondary-container-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (secondary-container). |
| `--m3e-secondary-container-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (secondary-container). |
| `--m3e-secondary-container-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (secondary-container). |
| `--m3e-secondary-container-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (secondary-container). |
| `--m3e-secondary-fab-container-color` | `color` | `--color-*` | Default container background color for secondary FAB. |
| `--m3e-secondary-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for secondary FAB. |
| `--m3e-secondary-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (secondary). |
| `--m3e-secondary-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (secondary). |
| `--m3e-secondary-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (secondary). |
| `--m3e-secondary-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (secondary). |
| `--m3e-secondary-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (secondary). |
| `--m3e-secondary-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (secondary). |
| `--m3e-secondary-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (secondary). |
| `--m3e-secondary-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (secondary). |
| `--m3e-secondary-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (secondary). |
| `--m3e-secondary-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (secondary). |
| `--m3e-secondary-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (secondary). |
| `--m3e-secondary-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (secondary). |
| `--m3e-secondary-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (secondary). |
| `--m3e-secondary-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (secondary). |
| `--m3e-secondary-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (secondary). |
| `--m3e-secondary-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (secondary). |
| `--m3e-secondary-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (secondary). |
| `--m3e-secondary-fab-icon-color` | `color` | `--color-*` | Default icon color for secondary FAB. |
| `--m3e-secondary-fab-label-text-color` | `color` | `--color-*` | Default label text color for secondary FAB. |
| `--m3e-secondary-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for secondary FAB. |
| `--m3e-secondary-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (secondary). |
| `--m3e-secondary-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (secondary). |
| `--m3e-secondary-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (secondary). |
| `--m3e-secondary-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (secondary). |
| `--m3e-secondary-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (secondary). |
| `--m3e-secondary-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (secondary). |
| `--m3e-secondary-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (secondary). |
| `--m3e-secondary-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (secondary). |
| `--m3e-secondary-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (secondary). |
| `--m3e-surface-fab-container-color` | `color` | `--color-*` | Default container background color for surface FAB. |
| `--m3e-surface-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for surface FAB. |
| `--m3e-surface-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (surface). |
| `--m3e-surface-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (surface). |
| `--m3e-surface-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (surface). |
| `--m3e-surface-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (surface). |
| `--m3e-surface-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (surface). |
| `--m3e-surface-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (surface). |
| `--m3e-surface-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (surface). |
| `--m3e-surface-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (surface). |
| `--m3e-surface-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (surface). |
| `--m3e-surface-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (surface). |
| `--m3e-surface-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (surface). |
| `--m3e-surface-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (surface). |
| `--m3e-surface-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (surface). |
| `--m3e-surface-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (surface). |
| `--m3e-surface-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (surface). |
| `--m3e-surface-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (surface). |
| `--m3e-surface-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (surface). |
| `--m3e-surface-fab-icon-color` | `color` | `--color-*` | Default icon color for surface FAB. |
| `--m3e-surface-fab-label-text-color` | `color` | `--color-*` | Default label text color for surface FAB. |
| `--m3e-surface-fab-lowered-container-color` | `color` | `--color-*` | Lowered container background color for surface FAB. |
| `--m3e-surface-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for surface FAB. |
| `--m3e-surface-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (surface). |
| `--m3e-surface-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (surface). |
| `--m3e-surface-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (surface). |
| `--m3e-surface-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (surface). |
| `--m3e-surface-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (surface). |
| `--m3e-surface-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (surface). |
| `--m3e-surface-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (surface). |
| `--m3e-surface-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (surface). |
| `--m3e-surface-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (surface). |
| `--m3e-tertiary-container-fab-container-color` | `color` | `--color-*` | Default container background color for tertiary-container FAB. |
| `--m3e-tertiary-container-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for tertiary-container FAB. |
| `--m3e-tertiary-container-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (tertiary-container). |
| `--m3e-tertiary-container-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (tertiary-container). |
| `--m3e-tertiary-container-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (tertiary-container). |
| `--m3e-tertiary-container-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (tertiary-container). |
| `--m3e-tertiary-container-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (tertiary-container). |
| `--m3e-tertiary-container-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (tertiary-container). |
| `--m3e-tertiary-container-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (tertiary-container). |
| `--m3e-tertiary-container-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (tertiary-container). |
| `--m3e-tertiary-container-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (tertiary-container). |
| `--m3e-tertiary-container-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (tertiary-container). |
| `--m3e-tertiary-container-fab-icon-color` | `color` | `--color-*` | Default icon color for tertiary-container FAB. |
| `--m3e-tertiary-container-fab-label-text-color` | `color` | `--color-*` | Default label text color for tertiary-container FAB. |
| `--m3e-tertiary-container-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for tertiary-container FAB. |
| `--m3e-tertiary-container-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (tertiary-container). |
| `--m3e-tertiary-container-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (tertiary-container). |
| `--m3e-tertiary-container-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (tertiary-container). |
| `--m3e-tertiary-container-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (tertiary-container). |
| `--m3e-tertiary-container-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (tertiary-container). |
| `--m3e-tertiary-container-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (tertiary-container). |
| `--m3e-tertiary-container-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (tertiary-container). |
| `--m3e-tertiary-container-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (tertiary-container). |
| `--m3e-tertiary-container-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (tertiary-container). |
| `--m3e-tertiary-fab-container-color` | `color` | `--color-*` | Default container background color for tertiary FAB. |
| `--m3e-tertiary-fab-container-elevation` | `*` | `--shadow-*` | Resting elevation for tertiary FAB. |
| `--m3e-tertiary-fab-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (tertiary). |
| `--m3e-tertiary-fab-disabled-container-elevation` | `*` | `--shadow-*` | Elevation when disabled (tertiary). |
| `--m3e-tertiary-fab-disabled-container-opacity` | `number` | — | Opacity of container when disabled (tertiary). |
| `--m3e-tertiary-fab-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (tertiary). |
| `--m3e-tertiary-fab-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (tertiary). |
| `--m3e-tertiary-fab-disabled-label-text-color` | `color` | `--color-*` | Label text color when disabled (tertiary). |
| `--m3e-tertiary-fab-disabled-label-text-opacity` | `number` | — | Label text opacity when disabled (tertiary). |
| `--m3e-tertiary-fab-focus-container-elevation` | `*` | `--shadow-*` | Elevation on focus (tertiary). |
| `--m3e-tertiary-fab-focus-icon-color` | `color` | `--color-*` | Icon color on focus (tertiary). |
| `--m3e-tertiary-fab-focus-label-text-color` | `color` | `--color-*` | Label text color on focus (tertiary). |
| `--m3e-tertiary-fab-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (tertiary). |
| `--m3e-tertiary-fab-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (tertiary). |
| `--m3e-tertiary-fab-hover-container-elevation` | `*` | `--shadow-*` | Elevation on hover (tertiary). |
| `--m3e-tertiary-fab-hover-icon-color` | `color` | `--color-*` | Icon color on hover (tertiary). |
| `--m3e-tertiary-fab-hover-label-text-color` | `color` | `--color-*` | Label text color on hover (tertiary). |
| `--m3e-tertiary-fab-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (tertiary). |
| `--m3e-tertiary-fab-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (tertiary). |
| `--m3e-tertiary-fab-icon-color` | `color` | `--color-*` | Default icon color for tertiary FAB. |
| `--m3e-tertiary-fab-label-text-color` | `color` | `--color-*` | Default label text color for tertiary FAB. |
| `--m3e-tertiary-fab-lowered-container-elevation` | `*` | `--shadow-*` | Lowered resting elevation for tertiary FAB. |
| `--m3e-tertiary-fab-lowered-disabled-container-elevation` | `*` | `--shadow-*` | Lowered elevation when disabled (tertiary). |
| `--m3e-tertiary-fab-lowered-focus-container-elevation` | `*` | `--shadow-*` | Lowered elevation on focus (tertiary). |
| `--m3e-tertiary-fab-lowered-hover-container-elevation` | `*` | `--shadow-*` | Lowered elevation on hover (tertiary). |
| `--m3e-tertiary-fab-lowered-pressed-container-elevation` | `*` | `--shadow-*` | Lowered elevation on pressed (tertiary). |
| `--m3e-tertiary-fab-pressed-container-elevation` | `*` | `--shadow-*` | Elevation on pressed (tertiary). |
| `--m3e-tertiary-fab-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (tertiary). |
| `--m3e-tertiary-fab-pressed-label-text-color` | `color` | `--color-*` | Label text color on pressed (tertiary). |
| `--m3e-tertiary-fab-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (tertiary). |
| `--m3e-tertiary-fab-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (tertiary). |

## `m3e-fab-menu`

A menu, opened from a floating action button (FAB), used to display multiple related actions.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-fab-menu-max-width` | `length` | — | Maximum width of the menu. |
| `--m3e-fab-menu-spacing` | `length` | — | Vertical gap between menu items. |
| `--m3e-primary-fab-color` | `color` | `--color-*` | Foreground color for primary variant items. |
| `--m3e-primary-fab-container-color` | `color` | `--color-*` | Container color for primary variant items. |
| `--m3e-primary-fab-focus-color` | `color` | `--color-*` | Focus background color for primary variant items. |
| `--m3e-primary-fab-hover-color` | `color` | `--color-*` | Hover background color for primary variant items. |
| `--m3e-primary-fab-ripple-color` | `color` | `--color-*` | Ripple color for primary variant items. |
| `--m3e-secondary-fab-color` | `color` | `--color-*` | Foreground color for secondary variant items. |
| `--m3e-secondary-fab-container-color` | `color` | `--color-*` | Container color for secondary variant items. |
| `--m3e-secondary-fab-focus-color` | `color` | `--color-*` | Focus background color for secondary variant items. |
| `--m3e-secondary-fab-hover-color` | `color` | `--color-*` | Hover background color for secondary variant items. |
| `--m3e-secondary-fab-ripple-color` | `color` | `--color-*` | Ripple color for secondary variant items. |
| `--m3e-tertiary-fab-color` | `color` | `--color-*` | Foreground color for tertiary variant items. |
| `--m3e-tertiary-fab-container-color` | `color` | `--color-*` | Container color for tertiary variant items. |
| `--m3e-tertiary-fab-focus-color` | `color` | `--color-*` | Focus background color for tertiary variant items. |
| `--m3e-tertiary-fab-hover-color` | `color` | `--color-*` | Hover background color for tertiary variant items. |
| `--m3e-tertiary-fab-ripple-color` | `color` | `--color-*` | Ripple color for tertiary variant items. |

## `m3e-fab-menu-item`

An item of a floating action button (FAB) menu.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-fab-menu-item-bottom-space` | `length` | — | Padding at the bottom of the menu item. |
| `--m3e-fab-menu-item-font-size` | `length` | `--text-*` | Font size of the menu item label. |
| `--m3e-fab-menu-item-font-weight` | `number` | `--font-weight-*` | Font weight of the menu item label. |
| `--m3e-fab-menu-item-height` | `length` | — | Height of the menu item. |
| `--m3e-fab-menu-item-icon-size` | `length` | — | Size of the icon in the menu item. |
| `--m3e-fab-menu-item-leading-space` | `length` | — | Padding at the start of the menu item. |
| `--m3e-fab-menu-item-line-height` | `length` | `--leading-*` | Line height of the menu item label. |
| `--m3e-fab-menu-item-shape` | `length` | `--radius-*` | Border radius of the menu item. |
| `--m3e-fab-menu-item-spacing` | `length` | — | Gap between icon and label. |
| `--m3e-fab-menu-item-top-space` | `length` | — | Padding at the top of the menu item. |
| `--m3e-fab-menu-item-tracking` | `length` | `--tracking-*` | Letter spacing of the menu item label. |
| `--m3e-fab-menu-item-trailing-space` | `length` | — | Padding at the end of the menu item. |

## `m3e-filter-chip`

A chip users interact with to select/deselect options.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-container-height` | `length` | — | Base height of the chip container before density adjustment. |
| `--m3e-chip-container-shape` | `length` | `--radius-*` | Border radius of the chip container. |
| `--m3e-chip-disabled-icon-color` | `color` | `--color-*` | Base color for disabled icons. |
| `--m3e-chip-disabled-icon-opacity` | `number` | — | Opacity applied to disabled icons. |
| `--m3e-chip-disabled-label-text-color` | `color` | `--color-*` | Base color for disabled label text. |
| `--m3e-chip-disabled-label-text-opacity` | `number` | — | Opacity applied to disabled label text. |
| `--m3e-chip-icon-color` | `color` | `--color-*` | Icon color in default state. |
| `--m3e-chip-icon-size` | `length` | — | Font size of leading/trailing icons. |
| `--m3e-chip-label-text-color` | `color` | `--color-*` | Label text color in default state. |
| `--m3e-chip-label-text-font-size` | `length` | `--text-*` | Font size of the chip label text. |
| `--m3e-chip-label-text-font-weight` | `number` | `--font-weight-*` | Font weight of the chip label text. |
| `--m3e-chip-label-text-line-height` | `length` | `--leading-*` | Line height of the chip label text. |
| `--m3e-chip-label-text-tracking` | `length` | `--tracking-*` | Letter spacing of the chip label text. |
| `--m3e-chip-padding-end` | `length` | — | Default end padding when no trailing icon is present. |
| `--m3e-chip-padding-start` | `length` | — | Default start padding when no icon is present. |
| `--m3e-chip-selected-container-color` | `color` | `--color-*` | Background color in selected state. |
| `--m3e-chip-selected-container-focus-color` | `color` | `--color-*` | Focus state layer color in selected state. |
| `--m3e-chip-selected-container-hover-color` | `color` | `--color-*` | Hover state layer color in selected state. |
| `--m3e-chip-selected-hover-elevation` | `*` | `--shadow-*` | Elevation on hover in selected state. |
| `--m3e-chip-selected-label-text-color` | `color` | `--color-*` | Text color in selected state. |
| `--m3e-chip-selected-leading-icon-color` | `color` | `--color-*` | Leading icon color in selected state. |
| `--m3e-chip-selected-outline-thickness` | `length` | — | Outline thickness for selected state. |
| `--m3e-chip-selected-ripple-color` | `color` | `--color-*` | Ripple color in selected state. |
| `--m3e-chip-selected-state-layer-focus-color` | `color` | `--color-*` | Focus state layer color in selected state. |
| `--m3e-chip-selected-state-layer-hover-color` | `color` | `--color-*` | Hover state layer color in selected state. |
| `--m3e-chip-selected-trailing-icon-color` | `color` | `--color-*` | Trailing icon color in selected state. |
| `--m3e-chip-spacing` | `length` | — | Horizontal gap between chip content elements. |
| `--m3e-chip-unselected-label-text-color` | `color` | `--color-*` | Text color in unselected state. |
| `--m3e-chip-unselected-leading-icon-color` | `color` | `--color-*` | Leading icon color in unselected state. |
| `--m3e-chip-unselected-ripple-color` | `color` | `--color-*` | Ripple color in unselected state. |
| `--m3e-chip-unselected-state-layer-focus-color` | `color` | `--color-*` | Focus state layer color in unselected state. |
| `--m3e-chip-unselected-state-layer-hover-color` | `color` | `--color-*` | Hover state layer color in unselected state. |
| `--m3e-chip-unselected-trailing-icon-color` | `color` | `--color-*` | Trailing icon color in unselected state. |
| `--m3e-chip-with-icon-padding-end` | `length` | — | End padding when trailing icon is present. |
| `--m3e-chip-with-icon-padding-start` | `length` | — | Start padding when leading icon is present. |
| `--m3e-elevated-chip-container-color` | `color` | `--color-*` | Background color for elevated variant. |
| `--m3e-elevated-chip-disabled-container-color` | `color` | `--color-*` | Background color for disabled elevated variant. |
| `--m3e-elevated-chip-disabled-container-opacity` | `number` | — | Opacity applied to disabled elevated background. |
| `--m3e-elevated-chip-disabled-elevation` | `*` | `--shadow-*` | Elevation level for disabled elevated variant. |
| `--m3e-elevated-chip-elevation` | `*` | `--shadow-*` | Elevation level for elevated variant. |
| `--m3e-elevated-chip-hover-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-outlined-chip-disabled-outline-color` | `color` | `--color-*` | Outline color for disabled outlined variant. |
| `--m3e-outlined-chip-disabled-outline-opacity` | `number` | — | Opacity applied to disabled outline. |
| `--m3e-outlined-chip-outline-color` | `color` | `--color-*` | Outline color for outlined variant. |
| `--m3e-outlined-chip-outline-thickness` | `length` | — | Outline thickness for outlined variant. |

## `m3e-filter-chip-set`

A container that organizes filter chips into a cohesive group, enabling selection and
deselection of values used to refine content or trigger contextual behavior.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-set-spacing` | `length` | — | The spacing (gap) between chips in the set. |

## `m3e-floating-panel`

A lightweight, generic floating surface used to present content above the page.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-floating-panel-container-color` | `color` | `--color-*` | Background color of the panel container. |
| `--m3e-floating-panel-container-elevation` | `*` | `--shadow-*` | Box shadow elevation of the panel container. |
| `--m3e-floating-panel-container-max-height` | `length` | — | Maximum height of the panel container. |
| `--m3e-floating-panel-container-max-width` | `length` | — | Maximum width of the panel container. |
| `--m3e-floating-panel-container-min-width` | `length` | — | Minimum width of the panel container. |
| `--m3e-floating-panel-container-padding-block` | `length` | — | Vertical padding inside the panel container. |
| `--m3e-floating-panel-container-padding-inline` | `length` | — | Horizontal padding inside the panel container. |
| `--m3e-floating-panel-container-shape` | `length` | `--radius-*` | Corner radius of the panel container. |

## `m3e-focus-ring`

A focus ring used to depict a strong focus indicator.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-focus-ring-color` | `color` | `--color-*` | The color of the focus ring. |
| `--m3e-focus-ring-duration` | `time` | `--transition-duration-*` | The duration of the focus ring animation. |
| `--m3e-focus-ring-growth-factor` | `*` | — | The factor by which the focus ring grows. |
| `--m3e-focus-ring-inward-offset` | `length` | — | Offset of an inward focus ring. |
| `--m3e-focus-ring-outward-offset` | `length` | — | Offset of an outward focus ring. |
| `--m3e-focus-ring-thickness` | `length` | — | The thickness of the focus ring. |
| `--m3e-focus-ring-visibility` | `*` | — | The visibility of the focus ring. |

## `m3e-form-field`

A container for form controls that applies Material Design styling and behavior.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-form-field-color` | `color` | `--color-*` | Text color for the form field container. |
| `--m3e-form-field-container-color` | `color` | `--color-*` | Background color in filled variant. |
| `--m3e-form-field-container-shape` | `length` | `--radius-*` | Corner radius for filled container. |
| `--m3e-form-field-disabled-container-opacity` | `number` | — | Opacity for disabled container background. |
| `--m3e-form-field-disabled-opacity` | `number` | — | Opacity for disabled text. |
| `--m3e-form-field-focused-color` | `color` | `--color-*` | Label color when focused. |
| `--m3e-form-field-focused-outline-color` | `color` | `--color-*` | Outline color when focused. |
| `--m3e-form-field-font-size` | `length` | `--text-*` | Font size for the form field container text. |
| `--m3e-form-field-font-weight` | `number` | `--font-weight-*` | Font weight for the form field container text. |
| `--m3e-form-field-hover-container-color` | `color` | `--color-*` | Hover background color in filled variant. |
| `--m3e-form-field-hover-container-opacity` | `number` | — | Opacity for hover background in filled variant. |
| `--m3e-form-field-icon-size` | `length` | — | Size of prefix and suffix icons. |
| `--m3e-form-field-invalid-color` | `color` | `--color-*` | Color used when the control is invalid. |
| `--m3e-form-field-label-font-size` | `length` | `--text-*` | Font size for the floating label. |
| `--m3e-form-field-label-font-weight` | `number` | `--font-weight-*` | Font weight for the floating label. |
| `--m3e-form-field-label-line-height` | `length` | `--leading-*` | Line height for the floating label. |
| `--m3e-form-field-label-tracking` | `length` | `--tracking-*` | Letter spacing for the floating label. |
| `--m3e-form-field-line-height` | `length` | `--leading-*` | Line height for the form field container text. |
| `--m3e-form-field-outline-color` | `color` | `--color-*` | Outline color in outlined variant. |
| `--m3e-form-field-subscript-color` | `color` | `--color-*` | Color for hint and error text. |
| `--m3e-form-field-subscript-font-size` | `length` | `--text-*` | Font size for hint and error text. |
| `--m3e-form-field-subscript-font-weight` | `number` | `--font-weight-*` | Font weight for hint and error text. |
| `--m3e-form-field-subscript-line-height` | `length` | `--leading-*` | Line height for hint and error text. |
| `--m3e-form-field-subscript-tracking` | `length` | `--tracking-*` | Letter spacing for hint and error text. |
| `--m3e-form-field-tracking` | `length` | `--tracking-*` | Letter spacing for the form field container text. |
| `--m3e-form-field-width` | `length` | — | Width of the form field container. |
| `--m3e-outlined-form-field-container-shape` | `length` | `--radius-*` | Corner radius for outlined container. |

## `m3e-heading`

A heading to a page or section.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--md-sys-typescale-display-large-font-size` | `length` | `--text-*` | Font size for Display Large text, ideal for hero headlines |
| `--md-sys-typescale-display-large-font-weight` | `number` | `--font-weight-*` | Font weight for Display Large text |
| `--md-sys-typescale-display-large-line-height` | `length` | `--leading-*` | Line height for Display Large text |
| `--md-sys-typescale-display-large-tracking` | `length` | `--tracking-*` | Letter spacing for Display Large text |
| `--md-sys-typescale-display-medium-font-size` | `length` | `--text-*` | Font size for Display Medium text |
| `--md-sys-typescale-display-medium-font-weight` | `number` | `--font-weight-*` | Font weight for Display Medium text |
| `--md-sys-typescale-display-medium-line-height` | `length` | `--leading-*` | Line height for Display Medium text |
| `--md-sys-typescale-display-medium-tracking` | `length` | `--tracking-*` | Letter spacing for Display Medium text |
| `--md-sys-typescale-display-small-font-size` | `length` | `--text-*` | Font size for Display Small text |
| `--md-sys-typescale-display-small-font-weight` | `number` | `--font-weight-*` | Font weight for Display Small text |
| `--md-sys-typescale-display-small-line-height` | `length` | `--leading-*` | Line height for Display Small text |
| `--md-sys-typescale-display-small-tracking` | `length` | `--tracking-*` | Letter spacing for Display Small text |
| `--md-sys-typescale-emphasized-display-large-font-size` | `length` | `--text-*` | Font size for emphasized Display Large text |
| `--md-sys-typescale-emphasized-display-large-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Display Large text |
| `--md-sys-typescale-emphasized-display-large-line-height` | `length` | `--leading-*` | Line height for emphasized Display Large text |
| `--md-sys-typescale-emphasized-display-large-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Display Large text |
| `--md-sys-typescale-emphasized-display-medium-font-size` | `length` | `--text-*` | Font size for emphasized Display Medium text |
| `--md-sys-typescale-emphasized-display-medium-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Display Medium text |
| `--md-sys-typescale-emphasized-display-medium-line-height` | `length` | `--leading-*` | Line height for emphasized Display Medium text |
| `--md-sys-typescale-emphasized-display-medium-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Display Medium text |
| `--md-sys-typescale-emphasized-display-small-font-size` | `length` | `--text-*` | Font size for emphasized Display Small text |
| `--md-sys-typescale-emphasized-display-small-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Display Small text |
| `--md-sys-typescale-emphasized-display-small-line-height` | `length` | `--leading-*` | Line height for emphasized Display Small text |
| `--md-sys-typescale-emphasized-display-small-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Display Small text |
| `--md-sys-typescale-emphasized-headline-large-font-size` | `length` | `--text-*` | Font size for emphasized Headline Large text |
| `--md-sys-typescale-emphasized-headline-large-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Headline Large text |
| `--md-sys-typescale-emphasized-headline-large-line-height` | `length` | `--leading-*` | Line height for emphasized Headline Large text |
| `--md-sys-typescale-emphasized-headline-large-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Headline Large text |
| `--md-sys-typescale-emphasized-headline-medium-font-size` | `length` | `--text-*` | Font size for emphasized Headline Medium text |
| `--md-sys-typescale-emphasized-headline-medium-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Headline Medium text |
| `--md-sys-typescale-emphasized-headline-medium-line-height` | `length` | `--leading-*` | Line height for emphasized Headline Medium text |
| `--md-sys-typescale-emphasized-headline-medium-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Headline Medium text |
| `--md-sys-typescale-emphasized-headline-small-font-size` | `length` | `--text-*` | Font size for emphasized Headline Small text |
| `--md-sys-typescale-emphasized-headline-small-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Headline Small text |
| `--md-sys-typescale-emphasized-headline-small-line-height` | `length` | `--leading-*` | Line height for emphasized Headline Small text |
| `--md-sys-typescale-emphasized-headline-small-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Headline Small text |
| `--md-sys-typescale-emphasized-label-large-font-size` | `length` | `--text-*` | Font size for emphasized Label Large text |
| `--md-sys-typescale-emphasized-label-large-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Label Large text |
| `--md-sys-typescale-emphasized-label-large-line-height` | `length` | `--leading-*` | Line height for emphasized Label Large text |
| `--md-sys-typescale-emphasized-label-large-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Label Large text |
| `--md-sys-typescale-emphasized-label-medium-font-size` | `length` | `--text-*` | Font size for emphasized Label Medium text |
| `--md-sys-typescale-emphasized-label-medium-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Label Medium text |
| `--md-sys-typescale-emphasized-label-medium-line-height` | `length` | `--leading-*` | Line height for emphasized Label Medium text |
| `--md-sys-typescale-emphasized-label-medium-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Label Medium text |
| `--md-sys-typescale-emphasized-label-small-font-size` | `length` | `--text-*` | Font size for emphasized Label Small text |
| `--md-sys-typescale-emphasized-label-small-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Label Small text |
| `--md-sys-typescale-emphasized-label-small-line-height` | `length` | `--leading-*` | Line height for emphasized Label Small text |
| `--md-sys-typescale-emphasized-label-small-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Label Small text |
| `--md-sys-typescale-emphasized-title-large-font-size` | `length` | `--text-*` | Font size for emphasized Title Large text |
| `--md-sys-typescale-emphasized-title-large-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Title Large text |
| `--md-sys-typescale-emphasized-title-large-line-height` | `length` | `--leading-*` | Line height for emphasized Title Large text |
| `--md-sys-typescale-emphasized-title-large-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Title Large text |
| `--md-sys-typescale-emphasized-title-medium-font-size` | `length` | `--text-*` | Font size for emphasized Title Medium text |
| `--md-sys-typescale-emphasized-title-medium-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Title Medium text |
| `--md-sys-typescale-emphasized-title-medium-line-height` | `length` | `--leading-*` | Line height for emphasized Title Medium text |
| `--md-sys-typescale-emphasized-title-medium-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Title Medium text |
| `--md-sys-typescale-emphasized-title-small-font-size` | `length` | `--text-*` | Font size for emphasized Title Small text |
| `--md-sys-typescale-emphasized-title-small-font-weight` | `number` | `--font-weight-*` | Font weight for emphasized Title Small text |
| `--md-sys-typescale-emphasized-title-small-line-height` | `length` | `--leading-*` | Line height for emphasized Title Small text |
| `--md-sys-typescale-emphasized-title-small-tracking` | `length` | `--tracking-*` | Letter spacing for emphasized Title Small text |
| `--md-sys-typescale-headline-large-font-size` | `length` | `--text-*` | Font size for Headline Large text |
| `--md-sys-typescale-headline-large-font-weight` | `number` | `--font-weight-*` | Font weight for Headline Large text |
| `--md-sys-typescale-headline-large-line-height` | `length` | `--leading-*` | Line height for Headline Large text |
| `--md-sys-typescale-headline-large-tracking` | `length` | `--tracking-*` | Letter spacing for Headline Large text |
| `--md-sys-typescale-headline-medium-font-size` | `length` | `--text-*` | Font size for Headline Medium text |
| `--md-sys-typescale-headline-medium-font-weight` | `number` | `--font-weight-*` | Font weight for Headline Medium text |
| `--md-sys-typescale-headline-medium-line-height` | `length` | `--leading-*` | Line height for Headline Medium text |
| `--md-sys-typescale-headline-medium-tracking` | `length` | `--tracking-*` | Letter spacing for Headline Medium text |
| `--md-sys-typescale-headline-small-font-size` | `length` | `--text-*` | Font size for Headline Small text |
| `--md-sys-typescale-headline-small-font-weight` | `number` | `--font-weight-*` | Font weight for Headline Small text |
| `--md-sys-typescale-headline-small-line-height` | `length` | `--leading-*` | Line height for Headline Small text |
| `--md-sys-typescale-headline-small-tracking` | `length` | `--tracking-*` | Letter spacing for Headline Small text |
| `--md-sys-typescale-label-large-font-size` | `length` | `--text-*` | Font size for Label Large text |
| `--md-sys-typescale-label-large-font-weight` | `number` | `--font-weight-*` | Font weight for Label Large text |
| `--md-sys-typescale-label-large-line-height` | `length` | `--leading-*` | Line height for Label Large text |
| `--md-sys-typescale-label-large-tracking` | `length` | `--tracking-*` | Letter spacing for Label Large text |
| `--md-sys-typescale-label-medium-font-size` | `length` | `--text-*` | Font size for Label Medium text |
| `--md-sys-typescale-label-medium-font-weight` | `number` | `--font-weight-*` | Font weight for Label Medium text |
| `--md-sys-typescale-label-medium-line-height` | `length` | `--leading-*` | Line height for Label Medium text |
| `--md-sys-typescale-label-medium-tracking` | `length` | `--tracking-*` | Letter spacing for Label Medium text |
| `--md-sys-typescale-label-small-font-size` | `length` | `--text-*` | Font size for Label Small text |
| `--md-sys-typescale-label-small-font-weight` | `number` | `--font-weight-*` | Font weight for Label Small text |
| `--md-sys-typescale-label-small-line-height` | `length` | `--leading-*` | Line height for Label Small text |
| `--md-sys-typescale-label-small-tracking` | `length` | `--tracking-*` | Letter spacing for Label Small text |
| `--md-sys-typescale-title-large-font-size` | `length` | `--text-*` | Font size for Title Large text |
| `--md-sys-typescale-title-large-font-weight` | `number` | `--font-weight-*` | Font weight for Title Large text |
| `--md-sys-typescale-title-large-line-height` | `length` | `--leading-*` | Line height for Title Large text |
| `--md-sys-typescale-title-large-tracking` | `length` | `--tracking-*` | Letter spacing for Title Large text |
| `--md-sys-typescale-title-medium-font-size` | `length` | `--text-*` | Font size for Title Medium text |
| `--md-sys-typescale-title-medium-font-weight` | `number` | `--font-weight-*` | Font weight for Title Medium text |
| `--md-sys-typescale-title-medium-line-height` | `length` | `--leading-*` | Line height for Title Medium text |
| `--md-sys-typescale-title-medium-tracking` | `length` | `--tracking-*` | Letter spacing for Title Medium text |
| `--md-sys-typescale-title-small-font-size` | `length` | `--text-*` | Font size for Title Small text |
| `--md-sys-typescale-title-small-font-weight` | `number` | `--font-weight-*` | Font weight for Title Small text |
| `--md-sys-typescale-title-small-line-height` | `length` | `--leading-*` | Line height for Title Small text |
| `--md-sys-typescale-title-small-tracking` | `length` | `--tracking-*` | Letter spacing for Title Small text |

## `m3e-icon-button`

An icon button users interact with to perform a supplementary action.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-filled-icon-button-container-color` | `color` | `--color-*` | Default container background color for filled variant. |
| `--m3e-filled-icon-button-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (filled). |
| `--m3e-filled-icon-button-disabled-container-opacity` | `number` | — | Opacity of container when disabled (filled). |
| `--m3e-filled-icon-button-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (filled). |
| `--m3e-filled-icon-button-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (filled). |
| `--m3e-filled-icon-button-focus-icon-color` | `color` | `--color-*` | Icon color on focus (filled). |
| `--m3e-filled-icon-button-focus-selected-icon-color` | `color` | `--color-*` | Selected icon color on focus (filled). |
| `--m3e-filled-icon-button-focus-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on focus (filled). |
| `--m3e-filled-icon-button-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (filled). |
| `--m3e-filled-icon-button-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (filled). |
| `--m3e-filled-icon-button-focus-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on focus (filled). |
| `--m3e-filled-icon-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on focus (filled). |
| `--m3e-filled-icon-button-hover-icon-color` | `color` | `--color-*` | Icon color on hover (filled). |
| `--m3e-filled-icon-button-hover-selected-icon-color` | `color` | `--color-*` | Selected icon color on hover (filled). |
| `--m3e-filled-icon-button-hover-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on hover (filled). |
| `--m3e-filled-icon-button-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (filled). |
| `--m3e-filled-icon-button-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (filled). |
| `--m3e-filled-icon-button-hover-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on hover (filled). |
| `--m3e-filled-icon-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on hover (filled). |
| `--m3e-filled-icon-button-icon-color` | `color` | `--color-*` | Default icon color for filled variant. |
| `--m3e-filled-icon-button-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (filled). |
| `--m3e-filled-icon-button-pressed-selected-icon-color` | `color` | `--color-*` | Selected icon color on pressed (filled). |
| `--m3e-filled-icon-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on pressed (filled). |
| `--m3e-filled-icon-button-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (filled). |
| `--m3e-filled-icon-button-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (filled). |
| `--m3e-filled-icon-button-pressed-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on pressed (filled). |
| `--m3e-filled-icon-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on pressed (filled). |
| `--m3e-filled-icon-button-selected-container-color` | `color` | `--color-*` | Selected container background color for filled variant. |
| `--m3e-filled-icon-button-selected-icon-color` | `color` | `--color-*` | Selected icon color for filled variant. |
| `--m3e-filled-icon-button-unselected-container-color` | `color` | `--color-*` | Unselected container background color for filled variant. |
| `--m3e-filled-icon-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color for filled variant. |
| `--m3e-icon-button-container-color` | `color` | `--color-*` | Default container background color for all variants. |
| `--m3e-icon-button-container-color` | `color` | `--color-*` | Default container background color for tonal variant. |
| `--m3e-icon-button-container-height` | `length` | — | Height of the container for all size variants. |
| `--m3e-icon-button-default-leading-space` | `length` | — | Leading space for all size variants (default). |
| `--m3e-icon-button-default-trailing-space` | `length` | — | Trailing space for all size variants (default). |
| `--m3e-icon-button-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (all variants). |
| `--m3e-icon-button-disabled-container-opacity` | `number` | — | Opacity of container when disabled (all variants). |
| `--m3e-icon-button-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (all variants). |
| `--m3e-icon-button-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (all variants). |
| `--m3e-icon-button-disabled-outline-color` | `color` | `--color-*` | Outline color when disabled (all variants). |
| `--m3e-icon-button-extra-large-container-height` | `length` | — | Height of the extra-large container. |
| `--m3e-icon-button-extra-large-default-leading-space` | `length` | — | Leading space for extra-large (default). |
| `--m3e-icon-button-extra-large-default-trailing-space` | `length` | — | Trailing space for extra-large (default). |
| `--m3e-icon-button-extra-large-icon-size` | `length` | — | Icon size for extra-large. |
| `--m3e-icon-button-extra-large-narrow-leading-space` | `length` | — | Leading space for extra-large (narrow). |
| `--m3e-icon-button-extra-large-narrow-trailing-space` | `length` | — | Trailing space for extra-large (narrow). |
| `--m3e-icon-button-extra-large-outline-thickness` | `length` | — | Outline thickness for extra-large. |
| `--m3e-icon-button-extra-large-selected-shape-round` | `length` | `--radius-*` | Corner radius for selected round extra-large. |
| `--m3e-icon-button-extra-large-selected-shape-square` | `length` | `--radius-*` | Corner radius for selected square extra-large. |
| `--m3e-icon-button-extra-large-shape-pressed-morph` | `length` | `--radius-*` | Corner radius for pressed extra-large. |
| `--m3e-icon-button-extra-large-shape-round` | `length` | `--radius-*` | Corner radius for round extra-large. |
| `--m3e-icon-button-extra-large-shape-square` | `length` | `--radius-*` | Corner radius for square extra-large. |
| `--m3e-icon-button-extra-large-wide-leading-space` | `length` | — | Leading space for extra-large (wide). |
| `--m3e-icon-button-extra-large-wide-trailing-space` | `length` | — | Trailing space for extra-large (wide). |
| `--m3e-icon-button-extra-small-container-height` | `length` | — | Height of the extra-small container. |
| `--m3e-icon-button-extra-small-default-leading-space` | `length` | — | Leading space for extra-small (default). |
| `--m3e-icon-button-extra-small-default-trailing-space` | `length` | — | Trailing space for extra-small (default). |
| `--m3e-icon-button-extra-small-icon-size` | `length` | — | Icon size for extra-small. |
| `--m3e-icon-button-extra-small-narrow-leading-space` | `length` | — | Leading space for extra-small (narrow). |
| `--m3e-icon-button-extra-small-narrow-trailing-space` | `length` | — | Trailing space for extra-small (narrow). |
| `--m3e-icon-button-extra-small-outline-thickness` | `length` | — | Outline thickness for extra-small. |
| `--m3e-icon-button-extra-small-selected-shape-round` | `length` | `--radius-*` | Corner radius for selected round extra-small. |
| `--m3e-icon-button-extra-small-selected-shape-square` | `length` | `--radius-*` | Corner radius for selected square extra-small. |
| `--m3e-icon-button-extra-small-shape-pressed-morph` | `length` | `--radius-*` | Corner radius for pressed extra-small. |
| `--m3e-icon-button-extra-small-shape-round` | `length` | `--radius-*` | Corner radius for round extra-small. |
| `--m3e-icon-button-extra-small-shape-square` | `length` | `--radius-*` | Corner radius for square extra-small. |
| `--m3e-icon-button-extra-small-wide-leading-space` | `length` | — | Leading space for extra-small (wide). |
| `--m3e-icon-button-extra-small-wide-trailing-space` | `length` | — | Trailing space for extra-small (wide). |
| `--m3e-icon-button-focus-icon-color` | `color` | `--color-*` | Icon color on focus (all variants). |
| `--m3e-icon-button-focus-outline-color` | `color` | `--color-*` | Outline color on focus (all variants). |
| `--m3e-icon-button-focus-selected-icon-color` | `color` | `--color-*` | Selected icon color on focus (all variants). |
| `--m3e-icon-button-focus-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on focus (all variants). |
| `--m3e-icon-button-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (all variants). |
| `--m3e-icon-button-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (all variants). |
| `--m3e-icon-button-focus-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on focus (all variants). |
| `--m3e-icon-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on focus (all variants). |
| `--m3e-icon-button-hover-icon-color` | `color` | `--color-*` | Icon color on hover (all variants). |
| `--m3e-icon-button-hover-outline-color` | `color` | `--color-*` | Outline color on hover (all variants). |
| `--m3e-icon-button-hover-selected-icon-color` | `color` | `--color-*` | Selected icon color on hover (all variants). |
| `--m3e-icon-button-hover-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on hover (all variants). |
| `--m3e-icon-button-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (all variants). |
| `--m3e-icon-button-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (all variants). |
| `--m3e-icon-button-hover-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on hover (all variants). |
| `--m3e-icon-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on hover (all variants). |
| `--m3e-icon-button-icon-color` | `color` | `--color-*` | Default icon color for tonal variant. |
| `--m3e-icon-button-icon-color` | `color` | `--color-*` | Default icon color for all variants. |
| `--m3e-icon-button-icon-size` | `length` | — | Icon size for all size variants. |
| `--m3e-icon-button-large-container-height` | `length` | — | Height of the large container. |
| `--m3e-icon-button-large-default-leading-space` | `length` | — | Leading space for large (default). |
| `--m3e-icon-button-large-default-trailing-space` | `length` | — | Trailing space for large (default). |
| `--m3e-icon-button-large-icon-size` | `length` | — | Icon size for large. |
| `--m3e-icon-button-large-narrow-leading-space` | `length` | — | Leading space for large (narrow). |
| `--m3e-icon-button-large-narrow-trailing-space` | `length` | — | Trailing space for large (narrow). |
| `--m3e-icon-button-large-outline-thickness` | `length` | — | Outline thickness for large. |
| `--m3e-icon-button-large-selected-shape-round` | `length` | `--radius-*` | Corner radius for selected round large. |
| `--m3e-icon-button-large-selected-shape-square` | `length` | `--radius-*` | Corner radius for selected square large. |
| `--m3e-icon-button-large-shape-pressed-morph` | `length` | `--radius-*` | Corner radius for pressed large. |
| `--m3e-icon-button-large-shape-round` | `length` | `--radius-*` | Corner radius for round large. |
| `--m3e-icon-button-large-shape-square` | `length` | `--radius-*` | Corner radius for square large. |
| `--m3e-icon-button-large-wide-leading-space` | `length` | — | Leading space for large (wide). |
| `--m3e-icon-button-large-wide-trailing-space` | `length` | — | Trailing space for large (wide). |
| `--m3e-icon-button-medium-container-height` | `length` | — | Height of the medium container. |
| `--m3e-icon-button-medium-default-leading-space` | `length` | — | Leading space for medium (default). |
| `--m3e-icon-button-medium-default-trailing-space` | `length` | — | Trailing space for medium (default). |
| `--m3e-icon-button-medium-icon-size` | `length` | — | Icon size for medium. |
| `--m3e-icon-button-medium-narrow-leading-space` | `length` | — | Leading space for medium (narrow). |
| `--m3e-icon-button-medium-narrow-trailing-space` | `length` | — | Trailing space for medium (narrow). |
| `--m3e-icon-button-medium-outline-thickness` | `length` | — | Outline thickness for medium. |
| `--m3e-icon-button-medium-selected-shape-round` | `length` | `--radius-*` | Corner radius for selected round medium. |
| `--m3e-icon-button-medium-selected-shape-square` | `length` | `--radius-*` | Corner radius for selected square medium. |
| `--m3e-icon-button-medium-shape-pressed-morph` | `length` | `--radius-*` | Corner radius for pressed medium. |
| `--m3e-icon-button-medium-shape-round` | `length` | `--radius-*` | Corner radius for round medium. |
| `--m3e-icon-button-medium-shape-square` | `length` | `--radius-*` | Corner radius for square medium. |
| `--m3e-icon-button-medium-wide-leading-space` | `length` | — | Leading space for medium (wide). |
| `--m3e-icon-button-medium-wide-trailing-space` | `length` | — | Trailing space for medium (wide). |
| `--m3e-icon-button-narrow-leading-space` | `length` | — | Leading space for all size variants (narrow). |
| `--m3e-icon-button-narrow-trailing-space` | `length` | — | Trailing space for all size variants (narrow). |
| `--m3e-icon-button-outline-color` | `color` | `--color-*` | Default outline color for all variants. |
| `--m3e-icon-button-outline-thickness` | `length` | — | Outline thickness for all size variants. |
| `--m3e-icon-button-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (all variants). |
| `--m3e-icon-button-pressed-outline-color` | `color` | `--color-*` | Outline color on pressed (all variants). |
| `--m3e-icon-button-pressed-selected-icon-color` | `color` | `--color-*` | Selected icon color on pressed (all variants). |
| `--m3e-icon-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on pressed (all variants). |
| `--m3e-icon-button-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (all variants). |
| `--m3e-icon-button-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (all variants). |
| `--m3e-icon-button-pressed-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on pressed (all variants). |
| `--m3e-icon-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on pressed (all variants). |
| `--m3e-icon-button-selected-container-color` | `color` | `--color-*` | Selected container background color for all variants. |
| `--m3e-icon-button-selected-container-color` | `color` | `--color-*` | Selected container background color for tonal variant. |
| `--m3e-icon-button-selected-icon-color` | `color` | `--color-*` | Selected icon color for tonal variant. |
| `--m3e-icon-button-selected-icon-color` | `color` | `--color-*` | Selected icon color for all variants. |
| `--m3e-icon-button-selected-shape-round` | `length` | `--radius-*` | Corner radius for all selected round size variants. |
| `--m3e-icon-button-selected-shape-square` | `length` | `--radius-*` | Corner radius for all selected square size variants. |
| `--m3e-icon-button-shape-pressed-morph` | `length` | `--radius-*` | Corner radius for all pressed size variants. |
| `--m3e-icon-button-shape-round` | `length` | `--radius-*` | Corner radius for all round size variants. |
| `--m3e-icon-button-shape-square` | `length` | `--radius-*` | Corner radius for all square size variants. |
| `--m3e-icon-button-small-container-height` | `length` | — | Height of the small container. |
| `--m3e-icon-button-small-default-leading-space` | `length` | — | Leading space for small (default). |
| `--m3e-icon-button-small-default-trailing-space` | `length` | — | Trailing space for small (default). |
| `--m3e-icon-button-small-icon-size` | `length` | — | Icon size for small. |
| `--m3e-icon-button-small-narrow-leading-space` | `length` | — | Leading space for small (narrow). |
| `--m3e-icon-button-small-narrow-trailing-space` | `length` | — | Trailing space for small (narrow). |
| `--m3e-icon-button-small-outline-thickness` | `length` | — | Outline thickness for small. |
| `--m3e-icon-button-small-selected-shape-round` | `length` | `--radius-*` | Corner radius for selected round small. |
| `--m3e-icon-button-small-selected-shape-square` | `length` | `--radius-*` | Corner radius for selected square small. |
| `--m3e-icon-button-small-shape-pressed-morph` | `length` | `--radius-*` | Corner radius for pressed small. |
| `--m3e-icon-button-small-shape-round` | `length` | `--radius-*` | Corner radius for round small. |
| `--m3e-icon-button-small-shape-square` | `length` | `--radius-*` | Corner radius for square small. |
| `--m3e-icon-button-small-wide-leading-space` | `length` | — | Leading space for small (wide). |
| `--m3e-icon-button-small-wide-trailing-space` | `length` | — | Trailing space for small (wide). |
| `--m3e-icon-button-unselected-container-color` | `color` | `--color-*` | Unselected container background color for all variants. |
| `--m3e-icon-button-unselected-container-color` | `color` | `--color-*` | Unselected container background color for tonal variant. |
| `--m3e-icon-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color for tonal variant. |
| `--m3e-icon-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color for all variants. |
| `--m3e-icon-button-wide-leading-space` | `length` | — | Leading space for all size variants (wide). |
| `--m3e-icon-button-wide-trailing-space` | `length` | — | Trailing space for all size variants (wide). |
| `--m3e-outlined-icon-button-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (outlined). |
| `--m3e-outlined-icon-button-disabled-container-opacity` | `number` | — | Opacity of container when disabled (outlined). |
| `--m3e-outlined-icon-button-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (outlined). |
| `--m3e-outlined-icon-button-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (outlined). |
| `--m3e-outlined-icon-button-disabled-outline-color` | `color` | `--color-*` | Outline color when disabled (outlined). |
| `--m3e-outlined-icon-button-focus-icon-color` | `color` | `--color-*` | Icon color on focus (outlined). |
| `--m3e-outlined-icon-button-focus-outline-color` | `color` | `--color-*` | Outline color on focus (outlined). |
| `--m3e-outlined-icon-button-focus-selected-icon-color` | `color` | `--color-*` | Selected icon color on focus (outlined). |
| `--m3e-outlined-icon-button-focus-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on focus (outlined). |
| `--m3e-outlined-icon-button-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (outlined). |
| `--m3e-outlined-icon-button-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (outlined). |
| `--m3e-outlined-icon-button-focus-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on focus (outlined). |
| `--m3e-outlined-icon-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on focus (outlined). |
| `--m3e-outlined-icon-button-hover-icon-color` | `color` | `--color-*` | Icon color on hover (outlined). |
| `--m3e-outlined-icon-button-hover-outline-color` | `color` | `--color-*` | Outline color on hover (outlined). |
| `--m3e-outlined-icon-button-hover-selected-icon-color` | `color` | `--color-*` | Selected icon color on hover (outlined). |
| `--m3e-outlined-icon-button-hover-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on hover (outlined). |
| `--m3e-outlined-icon-button-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (outlined). |
| `--m3e-outlined-icon-button-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (outlined). |
| `--m3e-outlined-icon-button-hover-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on hover (outlined). |
| `--m3e-outlined-icon-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on hover (outlined). |
| `--m3e-outlined-icon-button-icon-color` | `color` | `--color-*` | Default icon color for outlined variant. |
| `--m3e-outlined-icon-button-outline-color` | `color` | `--color-*` | Default outline color for outlined variant. |
| `--m3e-outlined-icon-button-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-outline-color` | `color` | `--color-*` | Outline color on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-selected-icon-color` | `color` | `--color-*` | Selected icon color on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on pressed (outlined). |
| `--m3e-outlined-icon-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on pressed (outlined). |
| `--m3e-outlined-icon-button-selected-container-color` | `color` | `--color-*` | Selected container background color for outlined variant. |
| `--m3e-outlined-icon-button-selected-icon-color` | `color` | `--color-*` | Selected icon color for outlined variant. |
| `--m3e-outlined-icon-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color for outlined variant. |
| `--m3e-standard-icon-button-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (standard). |
| `--m3e-standard-icon-button-disabled-container-opacity` | `number` | — | Opacity of container when disabled (standard). |
| `--m3e-standard-icon-button-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (standard). |
| `--m3e-standard-icon-button-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (standard). |
| `--m3e-standard-icon-button-focus-icon-color` | `color` | `--color-*` | Icon color on focus (standard). |
| `--m3e-standard-icon-button-focus-selected-icon-color` | `color` | `--color-*` | Selected icon color on focus (standard). |
| `--m3e-standard-icon-button-focus-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on focus (standard). |
| `--m3e-standard-icon-button-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (standard). |
| `--m3e-standard-icon-button-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (standard). |
| `--m3e-standard-icon-button-focus-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on focus (standard). |
| `--m3e-standard-icon-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on focus (standard). |
| `--m3e-standard-icon-button-hover-icon-color` | `color` | `--color-*` | Icon color on hover (standard). |
| `--m3e-standard-icon-button-hover-selected-icon-color` | `color` | `--color-*` | Selected icon color on hover (standard). |
| `--m3e-standard-icon-button-hover-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on hover (standard). |
| `--m3e-standard-icon-button-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (standard). |
| `--m3e-standard-icon-button-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (standard). |
| `--m3e-standard-icon-button-hover-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on hover (standard). |
| `--m3e-standard-icon-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on hover (standard). |
| `--m3e-standard-icon-button-icon-color` | `color` | `--color-*` | Default icon color for standard variant. |
| `--m3e-standard-icon-button-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (standard). |
| `--m3e-standard-icon-button-pressed-selected-icon-color` | `color` | `--color-*` | Selected icon color on pressed (standard). |
| `--m3e-standard-icon-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on pressed (standard). |
| `--m3e-standard-icon-button-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (standard). |
| `--m3e-standard-icon-button-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (standard). |
| `--m3e-standard-icon-button-pressed-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on pressed (standard). |
| `--m3e-standard-icon-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on pressed (standard). |
| `--m3e-standard-icon-button-selected-icon-color` | `color` | `--color-*` | Selected icon color for standard variant. |
| `--m3e-standard-icon-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color for standard variant. |
| `--m3e-tonal-icon-button-container-color` | `color` | `--color-*` | Default container background color for tonal variant. |
| `--m3e-tonal-icon-button-disabled-container-color` | `color` | `--color-*` | Container background color when disabled (tonal). |
| `--m3e-tonal-icon-button-disabled-container-opacity` | `number` | — | Opacity of container when disabled (tonal). |
| `--m3e-tonal-icon-button-disabled-icon-color` | `color` | `--color-*` | Icon color when disabled (tonal). |
| `--m3e-tonal-icon-button-disabled-icon-opacity` | `number` | — | Icon opacity when disabled (tonal). |
| `--m3e-tonal-icon-button-focus-icon-color` | `color` | `--color-*` | Icon color on focus (tonal). |
| `--m3e-tonal-icon-button-focus-selected-icon-color` | `color` | `--color-*` | Selected icon color on focus (tonal). |
| `--m3e-tonal-icon-button-focus-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on focus (tonal). |
| `--m3e-tonal-icon-button-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus (tonal). |
| `--m3e-tonal-icon-button-focus-state-layer-opacity` | `number` | — | State layer opacity on focus (tonal). |
| `--m3e-tonal-icon-button-focus-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on focus (tonal). |
| `--m3e-tonal-icon-button-focus-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on focus (tonal). |
| `--m3e-tonal-icon-button-hover-icon-color` | `color` | `--color-*` | Icon color on hover (tonal). |
| `--m3e-tonal-icon-button-hover-selected-icon-color` | `color` | `--color-*` | Selected icon color on hover (tonal). |
| `--m3e-tonal-icon-button-hover-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on hover (tonal). |
| `--m3e-tonal-icon-button-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover (tonal). |
| `--m3e-tonal-icon-button-hover-state-layer-opacity` | `number` | — | State layer opacity on hover (tonal). |
| `--m3e-tonal-icon-button-hover-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on hover (tonal). |
| `--m3e-tonal-icon-button-hover-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on hover (tonal). |
| `--m3e-tonal-icon-button-icon-color` | `color` | `--color-*` | Default icon color for tonal variant. |
| `--m3e-tonal-icon-button-pressed-icon-color` | `color` | `--color-*` | Icon color on pressed (tonal). |
| `--m3e-tonal-icon-button-pressed-selected-icon-color` | `color` | `--color-*` | Selected icon color on pressed (tonal). |
| `--m3e-tonal-icon-button-pressed-selected-state-layer-color` | `color` | `--color-*` | Selected state layer color on pressed (tonal). |
| `--m3e-tonal-icon-button-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed (tonal). |
| `--m3e-tonal-icon-button-pressed-state-layer-opacity` | `number` | — | State layer opacity on pressed (tonal). |
| `--m3e-tonal-icon-button-pressed-unselected-icon-color` | `color` | `--color-*` | Unselected icon color on pressed (tonal). |
| `--m3e-tonal-icon-button-pressed-unselected-state-layer-color` | `color` | `--color-*` | Unselected state layer color on pressed (tonal). |
| `--m3e-tonal-icon-button-selected-container-color` | `color` | `--color-*` | Selected container background color for tonal variant. |
| `--m3e-tonal-icon-button-selected-icon-color` | `color` | `--color-*` | Selected icon color for tonal variant. |
| `--m3e-tonal-icon-button-unselected-container-color` | `color` | `--color-*` | Unselected container background color for tonal variant. |
| `--m3e-tonal-icon-button-unselected-icon-color` | `color` | `--color-*` | Unselected icon color for tonal variant. |

## `m3e-input-chip`

A chip which represents a discrete piece of information entered by a user.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-avatar-font-size` | `length` | `--text-*` | Font size of text initials inside the avatar when used in a chip. |
| `--m3e-chip-avatar-font-weight` | `number` | `--font-weight-*` | Font weight of text initials inside the avatar when used in a chip. |
| `--m3e-chip-avatar-icon-size` | `length` | — | Size of the icon displayed inside the avatar when used in a chip. |
| `--m3e-chip-avatar-line-height` | `length` | `--leading-*` | Line height of text initials inside the avatar when used in a chip. |
| `--m3e-chip-avatar-size` | `length` | — | Font size of the avatar slot content. |
| `--m3e-chip-avatar-tracking` | `length` | `--tracking-*` | Letter spacing (tracking) of text initials inside the avatar when used in a chip. |
| `--m3e-chip-container-height` | `length` | — | Base height of the chip container before density adjustment. |
| `--m3e-chip-container-shape` | `length` | `--radius-*` | Border radius of the chip container. |
| `--m3e-chip-disabled-avatar-opacity` | `number` | — | Opacity applied to the avatar when disabled. |
| `--m3e-chip-disabled-icon-color` | `color` | `--color-*` | Base color for disabled icons. |
| `--m3e-chip-disabled-icon-opacity` | `number` | — | Opacity applied to disabled icons. |
| `--m3e-chip-disabled-label-text-color` | `color` | `--color-*` | Base color for disabled label text. |
| `--m3e-chip-disabled-label-text-opacity` | `number` | — | Opacity applied to disabled label text. |
| `--m3e-chip-icon-color` | `color` | `--color-*` | Icon color in default state. |
| `--m3e-chip-icon-size` | `length` | — | Font size of leading/trailing icons. |
| `--m3e-chip-label-text-color` | `color` | `--color-*` | Label text color in default state. |
| `--m3e-chip-label-text-font-size` | `length` | `--text-*` | Font size of the chip label text. |
| `--m3e-chip-label-text-font-weight` | `number` | `--font-weight-*` | Font weight of the chip label text. |
| `--m3e-chip-label-text-line-height` | `length` | `--leading-*` | Line height of the chip label text. |
| `--m3e-chip-label-text-tracking` | `length` | `--tracking-*` | Letter spacing of the chip label text. |
| `--m3e-chip-padding-end` | `length` | — | Default end padding when no trailing icon is present. |
| `--m3e-chip-padding-start` | `length` | — | Default start padding when no icon is present. |
| `--m3e-chip-spacing` | `length` | — | Horizontal gap between chip content elements. |
| `--m3e-chip-with-avatar-padding-start` | `length` | — | Start padding when an avatar is present. |
| `--m3e-chip-with-icon-padding-end` | `length` | — | End padding when trailing icon is present. |
| `--m3e-chip-with-icon-padding-start` | `length` | — | Start padding when leading icon is present. |
| `--m3e-elevated-chip-container-color` | `color` | `--color-*` | Background color for elevated variant. |
| `--m3e-elevated-chip-disabled-container-color` | `color` | `--color-*` | Background color for disabled elevated variant. |
| `--m3e-elevated-chip-disabled-container-opacity` | `number` | — | Opacity applied to disabled elevated background. |
| `--m3e-elevated-chip-disabled-elevation` | `*` | `--shadow-*` | Elevation level for disabled elevated variant. |
| `--m3e-elevated-chip-elevation` | `*` | `--shadow-*` | Elevation level for elevated variant. |
| `--m3e-elevated-chip-hover-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-outlined-chip-disabled-outline-color` | `color` | `--color-*` | Outline color for disabled outlined variant. |
| `--m3e-outlined-chip-disabled-outline-opacity` | `number` | — | Opacity applied to disabled outline. |
| `--m3e-outlined-chip-outline-color` | `color` | `--color-*` | Outline color for outlined variant. |
| `--m3e-outlined-chip-outline-thickness` | `length` | — | Outline thickness for outlined variant. |

## `m3e-input-chip-set`

A container that transforms user input into a cohesive set of interactive chips, supporting entry, editing, and removal of discrete values.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-set-spacing` | `length` | — | The spacing (gap) between chips in the set. |

## `m3e-linear-progress-indicator`

A horizontal bar for indicating progress and activity.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-linear-progress-indicator-shape` | `length` | `--radius-*` | Border radius of the progress bar. |
| `--m3e-linear-progress-indicator-thickness` | `length` | — | Thickness (height) of the progress bar. |
| `--m3e-linear-wavy-indeterminate-progress-indicator-wavelength` | `*` | — | Wavelength of the indeterminate/query `wavy` variant. |
| `--m3e-linear-wavy-progress-indicator-amplitude` | `*` | — | Amplitude of the `wavy` variant. |
| `--m3e-linear-wavy-progress-indicator-wavelength` | `*` | — | Wavelength of the `wavy` variant. |
| `--m3e-progress-indicator-color` | `color` | `--color-*` | Color of the progress indicator (foreground). |
| `--m3e-progress-indicator-track-color` | `color` | `--color-*` | Track color of the progress bar (background/buffer). |

## `m3e-list`

A list of items.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-divider-inset-end-size` | `length` | — | End inset for dividers within the list. |
| `--m3e-list-divider-inset-start-size` | `length` | — | Start inset for dividers within the list. |
| `--m3e-segmented-list-container-shape` | `length` | `--radius-*` | Border radius of the segmented list container. |
| `--m3e-segmented-list-item-container-color` | `color` | `--color-*` | Background color of items in segmented variant. |
| `--m3e-segmented-list-item-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant. |
| `--m3e-segmented-list-item-disabled-container-color` | `color` | `--color-*` | Background color of disabled items in segmented variant. |
| `--m3e-segmented-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant on focus. |
| `--m3e-segmented-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant on hover. |
| `--m3e-segmented-list-item-selected-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant when selected. |
| `--m3e-segmented-list-segment-gap` | `length` | — | Gap between list items in segmented variant. |

## `m3e-list-action`

An item in a list that performs an action.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-item-between-space` | `length` | — | Horizontal gap between elements. |
| `--m3e-list-item-container-color` | `color` | `--color-*` | Background color of the list item. |
| `--m3e-list-item-container-shape` | `length` | `--radius-*` | Border radius of the list item. |
| `--m3e-list-item-disabled-container-color` | `color` | `--color-*` | Background color of the list item when disabled. |
| `--m3e-list-item-disabled-label-text-color` | `color` | `--color-*` | Color for the main content when disabled. |
| `--m3e-list-item-disabled-label-text-opacity` | `number` | — | Opacity for the main content when disabled. |
| `--m3e-list-item-disabled-leading-color` | `color` | `--color-*` | Color for the leading icon when disabled. |
| `--m3e-list-item-disabled-leading-opacity` | `number` | — | Opacity for the leading icon when disabled. |
| `--m3e-list-item-disabled-media-opacity` | `number` | — | Opacity for media when disabled. |
| `--m3e-list-item-disabled-overline-color` | `color` | `--color-*` | Color for the overline slot when disabled. |
| `--m3e-list-item-disabled-overline-opacity` | `number` | — | Opacity for the overline slot when disabled. |
| `--m3e-list-item-disabled-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot when disabled. |
| `--m3e-list-item-disabled-supporting-text-opacity` | `number` | — | Opacity for the supporting text slot when disabled. |
| `--m3e-list-item-disabled-trailing-color` | `color` | `--color-*` | Color for the trailing icon when disabled. |
| `--m3e-list-item-disabled-trailing-opacity` | `number` | — | Opacity for the trailing icon when disabled. |
| `--m3e-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of the list item on focus. |
| `--m3e-list-item-focus-state-layer-color` | `color` | `--color-*` | Color for the focus state layer. |
| `--m3e-list-item-focus-state-layer-opacity` | `number` | — | Opacity for the focus state layer. |
| `--m3e-list-item-font-size` | `length` | `--text-*` | Font size for main content. |
| `--m3e-list-item-font-weight` | `number` | `--font-weight-*` | Font weight for main content. |
| `--m3e-list-item-height` | `length` | — | Minimum height of the list item. |
| `--m3e-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of the list item on hover. |
| `--m3e-list-item-hover-state-layer-color` | `color` | `--color-*` | Color for the hover state layer. |
| `--m3e-list-item-hover-state-layer-opacity` | `number` | — | Opacity for the hover state layer. |
| `--m3e-list-item-icon-size` | `length` | — | Size for leading/trailing icons. |
| `--m3e-list-item-image-height` | `length` | — | Height of the image slot. |
| `--m3e-list-item-image-shape` | `length` | `--radius-*` | Border radius of the image slot. |
| `--m3e-list-item-image-width` | `length` | — | Width of the image slot. |
| `--m3e-list-item-label-text-color` | `color` | `--color-*` | Color for the main content. |
| `--m3e-list-item-leading-color` | `color` | `--color-*` | Color for the leading content. |
| `--m3e-list-item-leading-space` | `length` | — | Horizontal padding for the leading side. |
| `--m3e-list-item-line-height` | `length` | `--leading-*` | Line height for main content. |
| `--m3e-list-item-one-line-bottom-space` | `length` | — | Bottom padding for one-line items. |
| `--m3e-list-item-one-line-height` | `length` | `--leading-*` | Minimum height of a one line list item. |
| `--m3e-list-item-one-line-top-space` | `length` | — | Top padding for one-line items. |
| `--m3e-list-item-overline-color` | `color` | `--color-*` | Color for the overline slot. |
| `--m3e-list-item-overline-font-size` | `length` | `--text-*` | Font size for overline slot. |
| `--m3e-list-item-overline-font-weight` | `number` | `--font-weight-*` | Font weight for overline slot. |
| `--m3e-list-item-overline-line-height` | `length` | `--leading-*` | Line height for overline slot. |
| `--m3e-list-item-overline-tracking` | `length` | `--tracking-*` | Letter spacing for overline slot. |
| `--m3e-list-item-padding-block` | `length` | — | Vertical padding for the list item. |
| `--m3e-list-item-padding-inline` | `length` | — | Horizontal padding for the list item. |
| `--m3e-list-item-pressed-state-layer-color` | `color` | `--color-*` | Color for the pressed state layer. |
| `--m3e-list-item-pressed-state-layer-opacity` | `number` | — | Opacity for the pressed state layer. |
| `--m3e-list-item-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot. |
| `--m3e-list-item-supporting-text-font-size` | `length` | `--text-*` | Font size for supporting text slot. |
| `--m3e-list-item-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight for supporting text slot. |
| `--m3e-list-item-supporting-text-line-height` | `length` | `--leading-*` | Line height for supporting text slot. |
| `--m3e-list-item-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing for supporting text slot. |
| `--m3e-list-item-three-line-bottom-space` | `length` | — | Bottom padding for three-line items. |
| `--m3e-list-item-three-line-height` | `length` | `--leading-*` | Minimum height of a three line list item. |
| `--m3e-list-item-three-line-top-offset` | `length` | — | Top offset for media in three line items. |
| `--m3e-list-item-three-line-top-space` | `length` | — | Top padding for three-line items. |
| `--m3e-list-item-tracking` | `length` | `--tracking-*` | Letter spacing for main content. |
| `--m3e-list-item-trailing-color` | `color` | `--color-*` | Color for the trailing content. |
| `--m3e-list-item-trailing-space` | `length` | — | Horizontal padding for the trailing side. |
| `--m3e-list-item-trailing-text-font-size` | `length` | `--text-*` | Font size for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-font-weight` | `number` | `--font-weight-*` | Font weight for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-line-height` | `length` | `--leading-*` | Line height for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-tracking` | `length` | `--tracking-*` | Letter spacing for trailing supporting text slot. |
| `--m3e-list-item-two-line-bottom-space` | `length` | — | Bottom padding for two-line items. |
| `--m3e-list-item-two-line-height` | `length` | `--leading-*` | Minimum height of a two line list item. |
| `--m3e-list-item-two-line-top-space` | `length` | — | Top padding for two-line items. |
| `--m3e-list-item-video-height` | `length` | — | Height of the video slot. |
| `--m3e-list-item-video-shape` | `length` | `--radius-*` | Border radius of the video slot. |
| `--m3e-list-item-video-width` | `length` | — | Width of the video slot. |

## `m3e-list-item`

An item in a list.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-item-between-space` | `length` | — | Horizontal gap between elements. |
| `--m3e-list-item-container-color` | `color` | `--color-*` | Background color of the list item. |
| `--m3e-list-item-container-shape` | `length` | `--radius-*` | Border radius of the list item. |
| `--m3e-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of the list item on focus. |
| `--m3e-list-item-font-size` | `length` | `--text-*` | Font size for main content. |
| `--m3e-list-item-font-weight` | `number` | `--font-weight-*` | Font weight for main content. |
| `--m3e-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of the list item on hover. |
| `--m3e-list-item-icon-size` | `length` | — | Size for leading/trailing icons. |
| `--m3e-list-item-image-height` | `length` | — | Height of the image slot. |
| `--m3e-list-item-image-shape` | `length` | `--radius-*` | Border radius of the image slot. |
| `--m3e-list-item-image-width` | `length` | — | Width of the image slot. |
| `--m3e-list-item-label-text-color` | `color` | `--color-*` | Color for the main content. |
| `--m3e-list-item-leading-color` | `color` | `--color-*` | Color for the leading content. |
| `--m3e-list-item-leading-space` | `length` | — | Horizontal padding for the leading side. |
| `--m3e-list-item-line-height` | `length` | `--leading-*` | Line height for main content. |
| `--m3e-list-item-one-line-bottom-space` | `length` | — | Bottom padding for one-line items. |
| `--m3e-list-item-one-line-height` | `length` | `--leading-*` | Minimum height of a one line list item. |
| `--m3e-list-item-one-line-top-space` | `length` | — | Top padding for one-line items. |
| `--m3e-list-item-overline-color` | `color` | `--color-*` | Color for the overline slot. |
| `--m3e-list-item-overline-font-size` | `length` | `--text-*` | Font size for overline slot. |
| `--m3e-list-item-overline-font-weight` | `number` | `--font-weight-*` | Font weight for overline slot. |
| `--m3e-list-item-overline-line-height` | `length` | `--leading-*` | Line height for overline slot. |
| `--m3e-list-item-overline-tracking` | `length` | `--tracking-*` | Letter spacing for overline slot. |
| `--m3e-list-item-padding-block` | `length` | — | Vertical padding for the list item. |
| `--m3e-list-item-padding-inline` | `length` | — | Horizontal padding for the list item. |
| `--m3e-list-item-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot. |
| `--m3e-list-item-supporting-text-font-size` | `length` | `--text-*` | Font size for supporting text slot. |
| `--m3e-list-item-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight for supporting text slot. |
| `--m3e-list-item-supporting-text-line-height` | `length` | `--leading-*` | Line height for supporting text slot. |
| `--m3e-list-item-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing for supporting text slot. |
| `--m3e-list-item-three-line-bottom-space` | `length` | — | Bottom padding for three-line items. |
| `--m3e-list-item-three-line-height` | `length` | `--leading-*` | Minimum height of a three line list item. |
| `--m3e-list-item-three-line-top-offset` | `length` | — | Top offset for media in three line items. |
| `--m3e-list-item-three-line-top-space` | `length` | — | Top padding for three-line items. |
| `--m3e-list-item-tracking` | `length` | `--tracking-*` | Letter spacing for main content. |
| `--m3e-list-item-trailing-color` | `color` | `--color-*` | Color for the trailing content. |
| `--m3e-list-item-trailing-space` | `length` | — | Horizontal padding for the trailing side. |
| `--m3e-list-item-trailing-text-font-size` | `length` | `--text-*` | Font size for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-font-weight` | `number` | `--font-weight-*` | Font weight for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-line-height` | `length` | `--leading-*` | Line height for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-tracking` | `length` | `--tracking-*` | Letter spacing for trailing supporting text slot. |
| `--m3e-list-item-two-line-bottom-space` | `length` | — | Bottom padding for two-line items. |
| `--m3e-list-item-two-line-height` | `length` | `--leading-*` | Minimum height of a two line list item. |
| `--m3e-list-item-two-line-top-space` | `length` | — | Top padding for two-line items. |
| `--m3e-list-item-video-height` | `length` | — | Height of the video slot. |
| `--m3e-list-item-video-shape` | `length` | `--radius-*` | Border radius of the video slot. |
| `--m3e-list-item-video-width` | `length` | — | Width of the video slot. |

## `m3e-list-item-button`

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-item-between-space` | `length` | — | Horizontal gap between elements. |
| `--m3e-list-item-container-color` | `color` | `--color-*` | Background color of the list item. |
| `--m3e-list-item-container-shape` | `length` | `--radius-*` | Border radius of the list item. |
| `--m3e-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of the list item on focus. |
| `--m3e-list-item-font-size` | `length` | `--text-*` | Font size for main content. |
| `--m3e-list-item-font-weight` | `number` | `--font-weight-*` | Font weight for main content. |
| `--m3e-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of the list item on hover. |
| `--m3e-list-item-icon-size` | `length` | — | Size for leading/trailing icons. |
| `--m3e-list-item-image-height` | `length` | — | Height of the image slot. |
| `--m3e-list-item-image-shape` | `length` | `--radius-*` | Border radius of the image slot. |
| `--m3e-list-item-image-width` | `length` | — | Width of the image slot. |
| `--m3e-list-item-label-text-color` | `color` | `--color-*` | Color for the main content. |
| `--m3e-list-item-leading-color` | `color` | `--color-*` | Color for the leading content. |
| `--m3e-list-item-leading-space` | `length` | — | Horizontal padding for the leading side. |
| `--m3e-list-item-line-height` | `length` | `--leading-*` | Line height for main content. |
| `--m3e-list-item-one-line-bottom-space` | `length` | — | Bottom padding for one-line items. |
| `--m3e-list-item-one-line-height` | `length` | `--leading-*` | Minimum height of a one line list item. |
| `--m3e-list-item-one-line-top-space` | `length` | — | Top padding for one-line items. |
| `--m3e-list-item-overline-color` | `color` | `--color-*` | Color for the overline slot. |
| `--m3e-list-item-overline-font-size` | `length` | `--text-*` | Font size for overline slot. |
| `--m3e-list-item-overline-font-weight` | `number` | `--font-weight-*` | Font weight for overline slot. |
| `--m3e-list-item-overline-line-height` | `length` | `--leading-*` | Line height for overline slot. |
| `--m3e-list-item-overline-tracking` | `length` | `--tracking-*` | Letter spacing for overline slot. |
| `--m3e-list-item-padding-block` | `length` | — | Vertical padding for the list item. |
| `--m3e-list-item-padding-inline` | `length` | — | Horizontal padding for the list item. |
| `--m3e-list-item-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot. |
| `--m3e-list-item-supporting-text-font-size` | `length` | `--text-*` | Font size for supporting text slot. |
| `--m3e-list-item-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight for supporting text slot. |
| `--m3e-list-item-supporting-text-line-height` | `length` | `--leading-*` | Line height for supporting text slot. |
| `--m3e-list-item-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing for supporting text slot. |
| `--m3e-list-item-three-line-bottom-space` | `length` | — | Bottom padding for three-line items. |
| `--m3e-list-item-three-line-height` | `length` | `--leading-*` | Minimum height of a three line list item. |
| `--m3e-list-item-three-line-top-offset` | `length` | — | Top offset for media in three line items. |
| `--m3e-list-item-three-line-top-space` | `length` | — | Top padding for three-line items. |
| `--m3e-list-item-tracking` | `length` | `--tracking-*` | Letter spacing for main content. |
| `--m3e-list-item-trailing-color` | `color` | `--color-*` | Color for the trailing content. |
| `--m3e-list-item-trailing-space` | `length` | — | Horizontal padding for the trailing side. |
| `--m3e-list-item-trailing-text-font-size` | `length` | `--text-*` | Font size for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-font-weight` | `number` | `--font-weight-*` | Font weight for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-line-height` | `length` | `--leading-*` | Line height for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-tracking` | `length` | `--tracking-*` | Letter spacing for trailing supporting text slot. |
| `--m3e-list-item-two-line-bottom-space` | `length` | — | Bottom padding for two-line items. |
| `--m3e-list-item-two-line-height` | `length` | `--leading-*` | Minimum height of a two line list item. |
| `--m3e-list-item-two-line-top-space` | `length` | — | Top padding for two-line items. |
| `--m3e-list-item-video-height` | `length` | — | Height of the video slot. |
| `--m3e-list-item-video-shape` | `length` | `--radius-*` | Border radius of the video slot. |
| `--m3e-list-item-video-width` | `length` | — | Width of the video slot. |

## `m3e-list-option`

A selectable option in a list.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-item-between-space` | `length` | — | Horizontal gap between elements. |
| `--m3e-list-item-container-color` | `color` | `--color-*` | Background color of the list item. |
| `--m3e-list-item-container-shape` | `length` | `--radius-*` | Border radius of the list item. |
| `--m3e-list-item-disabled-container-color` | `color` | `--color-*` | Background color of the list item when disabled. |
| `--m3e-list-item-disabled-label-text-color` | `color` | `--color-*` | Color for the main content when disabled. |
| `--m3e-list-item-disabled-label-text-opacity` | `number` | — | Opacity for the main content when disabled. |
| `--m3e-list-item-disabled-leading-color` | `color` | `--color-*` | Color for the leading icon when disabled. |
| `--m3e-list-item-disabled-leading-opacity` | `number` | — | Opacity for the leading icon when disabled. |
| `--m3e-list-item-disabled-media-opacity` | `number` | — | Opacity for media when disabled. |
| `--m3e-list-item-disabled-overline-color` | `color` | `--color-*` | Color for the overline slot when disabled. |
| `--m3e-list-item-disabled-overline-opacity` | `number` | — | Opacity for the overline slot when disabled. |
| `--m3e-list-item-disabled-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot when disabled. |
| `--m3e-list-item-disabled-supporting-text-opacity` | `number` | — | Opacity for the supporting text slot when disabled. |
| `--m3e-list-item-disabled-trailing-color` | `color` | `--color-*` | Color for the trailing icon when disabled. |
| `--m3e-list-item-disabled-trailing-opacity` | `number` | — | Opacity for the trailing icon when disabled. |
| `--m3e-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of the list item on focus. |
| `--m3e-list-item-focus-state-layer-color` | `color` | `--color-*` | Color for the focus state layer. |
| `--m3e-list-item-focus-state-layer-opacity` | `number` | — | Opacity for the focus state layer. |
| `--m3e-list-item-font-size` | `length` | `--text-*` | Font size for main content. |
| `--m3e-list-item-font-weight` | `number` | `--font-weight-*` | Font weight for main content. |
| `--m3e-list-item-height` | `length` | — | Minimum height of the list item. |
| `--m3e-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of the list item on hover. |
| `--m3e-list-item-hover-state-layer-color` | `color` | `--color-*` | Color for the hover state layer. |
| `--m3e-list-item-hover-state-layer-opacity` | `number` | — | Opacity for the hover state layer. |
| `--m3e-list-item-icon-size` | `length` | — | Size for leading/trailing icons. |
| `--m3e-list-item-image-height` | `length` | — | Height of the image slot. |
| `--m3e-list-item-image-shape` | `length` | `--radius-*` | Border radius of the image slot. |
| `--m3e-list-item-image-width` | `length` | — | Width of the image slot. |
| `--m3e-list-item-label-text-color` | `color` | `--color-*` | Color for the main content. |
| `--m3e-list-item-leading-color` | `color` | `--color-*` | Color for the leading content. |
| `--m3e-list-item-leading-space` | `length` | — | Horizontal padding for the leading side. |
| `--m3e-list-item-line-height` | `length` | `--leading-*` | Line height for main content. |
| `--m3e-list-item-one-line-bottom-space` | `length` | — | Bottom padding for one-line items. |
| `--m3e-list-item-one-line-height` | `length` | `--leading-*` | Minimum height of a one line list item. |
| `--m3e-list-item-one-line-top-space` | `length` | — | Top padding for one-line items. |
| `--m3e-list-item-overline-color` | `color` | `--color-*` | Color for the overline slot. |
| `--m3e-list-item-overline-font-size` | `length` | `--text-*` | Font size for overline slot. |
| `--m3e-list-item-overline-font-weight` | `number` | `--font-weight-*` | Font weight for overline slot. |
| `--m3e-list-item-overline-line-height` | `length` | `--leading-*` | Line height for overline slot. |
| `--m3e-list-item-overline-tracking` | `length` | `--tracking-*` | Letter spacing for overline slot. |
| `--m3e-list-item-padding-block` | `length` | — | Vertical padding for the list item. |
| `--m3e-list-item-padding-inline` | `length` | — | Horizontal padding for the list item. |
| `--m3e-list-item-pressed-state-layer-color` | `color` | `--color-*` | Color for the pressed state layer. |
| `--m3e-list-item-pressed-state-layer-opacity` | `number` | — | Opacity for the pressed state layer. |
| `--m3e-list-item-selected-container-color` | `color` | `--color-*` | Selected background color of the list item. |
| `--m3e-list-item-selected-container-shape` | `length` | `--radius-*` | Selected border radius of the list item. |
| `--m3e-list-item-selected-disabled-container-color` | `color` | `--color-*` | Selected background color when disabled. |
| `--m3e-list-item-selected-disabled-container-opacity` | `number` | — | Selected opacity when disabled. |
| `--m3e-list-item-selected-focus-state-layer-color` | `color` | `--color-*` | Color for the focus state layer when selected. |
| `--m3e-list-item-selected-focus-state-layer-opacity` | `number` | — | Opacity for the focus state layer when selected. |
| `--m3e-list-item-selected-hover-state-layer-color` | `color` | `--color-*` | Color for the hover state layer when selected. |
| `--m3e-list-item-selected-hover-state-layer-opacity` | `number` | — | Opacity for the hover state layer when selected. |
| `--m3e-list-item-selected-label-text-color` | `color` | `--color-*` | Selected color for the main content. |
| `--m3e-list-item-selected-leading-color` | `color` | `--color-*` | Selected color for the leading content. |
| `--m3e-list-item-selected-overline-color` | `color` | `--color-*` | Selected color for the overline slot. |
| `--m3e-list-item-selected-pressed-state-layer-color` | `color` | `--color-*` | Color for the pressed state layer when selected. |
| `--m3e-list-item-selected-pressed-state-layer-opacity` | `number` | — | Opacity for the pressed state layer when selected. |
| `--m3e-list-item-selected-supporting-text-color` | `color` | `--color-*` | Selected color for the supporting text slot. |
| `--m3e-list-item-selected-trailing-color` | `color` | `--color-*` | Selected color for the trailing content. |
| `--m3e-list-item-supporting-text-color` | `color` | `--color-*` | Color for the supporting text slot. |
| `--m3e-list-item-supporting-text-font-size` | `length` | `--text-*` | Font size for supporting text slot. |
| `--m3e-list-item-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight for supporting text slot. |
| `--m3e-list-item-supporting-text-line-height` | `length` | `--leading-*` | Line height for supporting text slot. |
| `--m3e-list-item-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing for supporting text slot. |
| `--m3e-list-item-three-line-bottom-space` | `length` | — | Bottom padding for three-line items. |
| `--m3e-list-item-three-line-height` | `length` | `--leading-*` | Minimum height of a three line list item. |
| `--m3e-list-item-three-line-top-offset` | `length` | — | Top offset for media in three line items. |
| `--m3e-list-item-three-line-top-space` | `length` | — | Top padding for three-line items. |
| `--m3e-list-item-tracking` | `length` | `--tracking-*` | Letter spacing for main content. |
| `--m3e-list-item-trailing-color` | `color` | `--color-*` | Color for the trailing content. |
| `--m3e-list-item-trailing-space` | `length` | — | Horizontal padding for the trailing side. |
| `--m3e-list-item-trailing-text-font-size` | `length` | `--text-*` | Font size for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-font-weight` | `number` | `--font-weight-*` | Font weight for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-line-height` | `length` | `--leading-*` | Line height for trailing supporting text slot. |
| `--m3e-list-item-trailing-text-tracking` | `length` | `--tracking-*` | Letter spacing for trailing supporting text slot. |
| `--m3e-list-item-two-line-bottom-space` | `length` | — | Bottom padding for two-line items. |
| `--m3e-list-item-two-line-height` | `length` | `--leading-*` | Minimum height of a two line list item. |
| `--m3e-list-item-two-line-top-space` | `length` | — | Top padding for two-line items. |
| `--m3e-list-item-video-height` | `length` | — | Height of the video slot. |
| `--m3e-list-item-video-shape` | `length` | `--radius-*` | Border radius of the video slot. |
| `--m3e-list-item-video-width` | `length` | — | Width of the video slot. |

## `m3e-loading-indicator`

Shows indeterminate progress for a short wait time.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-loading-indicator-active-indicator-color` | `color` | `--color-*` | Uncontained active indicator color. |
| `--m3e-loading-indicator-active-indicator-size` | `length` | — | Size of the active indicator. |
| `--m3e-loading-indicator-contained-active-indicator-color` | `color` | `--color-*` | Contained active indicator color. |
| `--m3e-loading-indicator-contained-container-color` | `color` | `--color-*` | Contained container (background) color. |
| `--m3e-loading-indicator-container-shape` | `length` | `--radius-*` | Container shape. |
| `--m3e-loading-indicator-container-size` | `length` | — | Container size. |

## `m3e-menu`

Presents a list of choices on a temporary surface.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-menu-active-container-shape` | `length` | `--radius-*` | Controls the corner radius of the menu container when active. |
| `--m3e-menu-container-color` | `color` | `--color-*` | Background color of the menu container. |
| `--m3e-menu-container-elevation` | `*` | `--shadow-*` | Box shadow elevation of the menu container. |
| `--m3e-menu-container-max-height` | `length` | — | Maximum height of the menu container. |
| `--m3e-menu-container-max-width` | `length` | — | Maximum width of the menu container. |
| `--m3e-menu-container-min-width` | `length` | — | Minimum width of the menu container. |
| `--m3e-menu-container-padding-block` | `length` | — | Vertical padding inside the menu container. |
| `--m3e-menu-container-padding-inline` | `length` | — | Horizontal padding inside the menu container. |
| `--m3e-menu-container-shape` | `length` | `--radius-*` | Controls the corner radius of the menu container. |
| `--m3e-menu-divider-spacing` | `length` | — | Vertical spacing around slotted `m3e-divider` elements. |
| `--m3e-menu-gap` | `length` | — | Gap between content in the menu. |
| `--m3e-vibrant-menu-container-color` | `color` | `--color-*` | Background color of the menu container for vibrant variant. |

## `m3e-menu-item`

An item of a menu.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-menu-item-active-state-layer-color` | `color` | `--color-*` | State layer color for expanded items. |
| `--m3e-menu-item-active-state-layer-opacity` | `number` | — | State layer opacity for expanded items. |
| `--m3e-menu-item-color` | `color` | `--color-*` | Text color for unselected, enabled menu items. |
| `--m3e-menu-item-container-focus-color` | `color` | `--color-*` | State layer focus color for unselected items. |
| `--m3e-menu-item-container-height` | `length` | — | Height of the menu item container. |
| `--m3e-menu-item-container-hover-color` | `color` | `--color-*` | State layer hover color for unselected items. |
| `--m3e-menu-item-disabled-color` | `color` | `--color-*` | Base color for disabled items. |
| `--m3e-menu-item-disabled-opacity` | `number` | — | Opacity percentage for disabled item color mix. |
| `--m3e-menu-item-first-child-shape` | `length` | `--radius-*` | Shape for the first menu item in a menu. |
| `--m3e-menu-item-focus-ring-shape` | `length` | `--radius-*` | Border radius for the focus ring. |
| `--m3e-menu-item-icon-label-space` | `length` | — | Horizontal gap between icon and content. |
| `--m3e-menu-item-icon-size` | `length` | — | Font size for leading and trailing icons. |
| `--m3e-menu-item-label-text-font-size` | `length` | `--text-*` | Font size for menu item text. |
| `--m3e-menu-item-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for menu item text. |
| `--m3e-menu-item-label-text-line-height` | `length` | `--leading-*` | Line height for menu item text. |
| `--m3e-menu-item-label-text-tracking` | `length` | `--tracking-*` | Letter spacing for menu item text. |
| `--m3e-menu-item-last-child-shape` | `length` | `--radius-*` | Shape for the last menu item in a menu. |
| `--m3e-menu-item-padding-end` | `length` | — | End padding for the item wrapper. |
| `--m3e-menu-item-padding-start` | `length` | — | Start padding for the item wrapper. |
| `--m3e-menu-item-ripple-color` | `color` | `--color-*` | Ripple color for unselected items. |
| `--m3e-menu-item-selected-color` | `color` | `--color-*` | Text color for selected items. |
| `--m3e-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected items. |
| `--m3e-menu-item-selected-container-focus-color` | `color` | `--color-*` | State layer focus color for selected items. |
| `--m3e-menu-item-selected-container-hover-color` | `color` | `--color-*` | State layer hover color for selected items. |
| `--m3e-menu-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected items. |
| `--m3e-menu-item-shape` | `length` | `--radius-*` | Base shape of the menu item. |
| `--m3e-vibrant-menu-item-active-state-layer-color` | `color` | `--color-*` | State layer color for expanded items for vibrant variant. |
| `--m3e-vibrant-menu-item-color` | `color` | `--color-*` | Text color for unselected, enabled menu items for vibrant variant. |
| `--m3e-vibrant-menu-item-container-focus-color` | `color` | `--color-*` | State layer focus color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-container-hover-color` | `color` | `--color-*` | State layer hover color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-disabled-color` | `color` | `--color-*` | Base color for disabled items for vibrant variant. |
| `--m3e-vibrant-menu-item-ripple-color` | `color` | `--color-*` | Ripple color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-color` | `color` | `--color-*` | Text color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-focus-color` | `color` | `--color-*` | State layer focus color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-hover-color` | `color` | `--color-*` | State layer hover color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected items for vibrant variant. |

## `m3e-menu-item-checkbox`

An item of a menu which supports a checkable state.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-menu-item-active-state-layer-color` | `color` | `--color-*` | State layer color for expanded items. |
| `--m3e-menu-item-active-state-layer-opacity` | `number` | — | State layer opacity for expanded items. |
| `--m3e-menu-item-color` | `color` | `--color-*` | Text color for unselected, enabled menu items. |
| `--m3e-menu-item-container-focus-color` | `color` | `--color-*` | State layer focus color for unselected items. |
| `--m3e-menu-item-container-height` | `length` | — | Height of the menu item container. |
| `--m3e-menu-item-container-hover-color` | `color` | `--color-*` | State layer hover color for unselected items. |
| `--m3e-menu-item-disabled-color` | `color` | `--color-*` | Base color for disabled items. |
| `--m3e-menu-item-disabled-opacity` | `number` | — | Opacity percentage for disabled item color mix. |
| `--m3e-menu-item-first-child-shape` | `length` | `--radius-*` | Shape for the first menu item in a menu. |
| `--m3e-menu-item-focus-ring-shape` | `length` | `--radius-*` | Border radius for the focus ring. |
| `--m3e-menu-item-icon-label-space` | `length` | — | Horizontal gap between icon and content. |
| `--m3e-menu-item-icon-size` | `length` | — | Font size for leading and trailing icons. |
| `--m3e-menu-item-label-text-font-size` | `length` | `--text-*` | Font size for menu item text. |
| `--m3e-menu-item-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for menu item text. |
| `--m3e-menu-item-label-text-line-height` | `length` | `--leading-*` | Line height for menu item text. |
| `--m3e-menu-item-label-text-tracking` | `length` | `--tracking-*` | Letter spacing for menu item text. |
| `--m3e-menu-item-last-child-shape` | `length` | `--radius-*` | Shape for the last menu item in a menu. |
| `--m3e-menu-item-padding-end` | `length` | — | End padding for the item wrapper. |
| `--m3e-menu-item-padding-start` | `length` | — | Start padding for the item wrapper. |
| `--m3e-menu-item-ripple-color` | `color` | `--color-*` | Ripple color for unselected items. |
| `--m3e-menu-item-selected-color` | `color` | `--color-*` | Text color for selected items. |
| `--m3e-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected items. |
| `--m3e-menu-item-selected-container-focus-color` | `color` | `--color-*` | State layer focus color for selected items. |
| `--m3e-menu-item-selected-container-hover-color` | `color` | `--color-*` | State layer hover color for selected items. |
| `--m3e-menu-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected items. |
| `--m3e-menu-item-selected-shape` | `length` | `--radius-*` | Shape used for a selected menu item. |
| `--m3e-menu-item-shape` | `length` | `--radius-*` | Base shape of the menu item. |
| `--m3e-vibrant-menu-item-active-state-layer-color` | `color` | `--color-*` | State layer color for expanded items for vibrant variant. |
| `--m3e-vibrant-menu-item-color` | `color` | `--color-*` | Text color for unselected, enabled menu items for vibrant variant. |
| `--m3e-vibrant-menu-item-container-focus-color` | `color` | `--color-*` | State layer focus color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-container-hover-color` | `color` | `--color-*` | State layer hover color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-disabled-color` | `color` | `--color-*` | Base color for disabled items for vibrant variant |
| `--m3e-vibrant-menu-item-ripple-color` | `color` | `--color-*` | Ripple color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-color` | `color` | `--color-*` | Text color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-focus-color` | `color` | `--color-*` | State layer focus color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-hover-color` | `color` | `--color-*` | State layer hover color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected items for vibrant variant. |

## `m3e-menu-item-radio`

An item of a menu which supports a mutually exclusive checkable state.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-menu-item-active-state-layer-color` | `color` | `--color-*` | State layer color for expanded items. |
| `--m3e-menu-item-active-state-layer-opacity` | `number` | — | State layer opacity for expanded items. |
| `--m3e-menu-item-color` | `color` | `--color-*` | Text color for unselected, enabled menu items. |
| `--m3e-menu-item-container-focus-color` | `color` | `--color-*` | State layer focus color for unselected items. |
| `--m3e-menu-item-container-height` | `length` | — | Height of the menu item container. |
| `--m3e-menu-item-container-hover-color` | `color` | `--color-*` | State layer hover color for unselected items. |
| `--m3e-menu-item-disabled-color` | `color` | `--color-*` | Base color for disabled items. |
| `--m3e-menu-item-disabled-opacity` | `number` | — | Opacity percentage for disabled item color mix. |
| `--m3e-menu-item-first-child-shape` | `length` | `--radius-*` | Shape for the first menu item in a menu. |
| `--m3e-menu-item-focus-ring-shape` | `length` | `--radius-*` | Border radius for the focus ring. |
| `--m3e-menu-item-icon-label-space` | `length` | — | Horizontal gap between icon and content. |
| `--m3e-menu-item-icon-size` | `length` | — | Font size for leading and trailing icons. |
| `--m3e-menu-item-label-text-font-size` | `length` | `--text-*` | Font size for menu item text. |
| `--m3e-menu-item-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for menu item text. |
| `--m3e-menu-item-label-text-line-height` | `length` | `--leading-*` | Line height for menu item text. |
| `--m3e-menu-item-label-text-tracking` | `length` | `--tracking-*` | Letter spacing for menu item text. |
| `--m3e-menu-item-last-child-shape` | `length` | `--radius-*` | Shape for the last menu item in a menu. |
| `--m3e-menu-item-padding-end` | `length` | — | End padding for the item wrapper. |
| `--m3e-menu-item-padding-start` | `length` | — | Start padding for the item wrapper. |
| `--m3e-menu-item-ripple-color` | `color` | `--color-*` | Ripple color for unselected items. |
| `--m3e-menu-item-selected-color` | `color` | `--color-*` | Text color for selected items. |
| `--m3e-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected items. |
| `--m3e-menu-item-selected-container-focus-color` | `color` | `--color-*` | State layer focus color for selected items. |
| `--m3e-menu-item-selected-container-hover-color` | `color` | `--color-*` | State layer hover color for selected items. |
| `--m3e-menu-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected items. |
| `--m3e-menu-item-selected-shape` | `length` | `--radius-*` | Shape used for a selected menu item. |
| `--m3e-menu-item-shape` | `length` | `--radius-*` | Base shape of the menu item. |
| `--m3e-vibrant-menu-item-active-state-layer-color` | `color` | `--color-*` | State layer color for expanded items for vibrant variant. |
| `--m3e-vibrant-menu-item-color` | `color` | `--color-*` | Text color for unselected, enabled menu items for vibrant variant. |
| `--m3e-vibrant-menu-item-container-focus-color` | `color` | `--color-*` | State layer focus color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-container-hover-color` | `color` | `--color-*` | State layer hover color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-disabled-color` | `color` | `--color-*` | Base color for disabled items for vibrant variant |
| `--m3e-vibrant-menu-item-ripple-color` | `color` | `--color-*` | Ripple color for unselected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-color` | `color` | `--color-*` | Text color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-focus-color` | `color` | `--color-*` | State layer focus color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-container-hover-color` | `color` | `--color-*` | State layer hover color for selected items for vibrant variant. |
| `--m3e-vibrant-menu-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected items for vibrant variant. |

## `m3e-nav-bar`

A horizontal bar, typically used on smaller devices, that allows a user to switch between 3-5 views.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-nav-bar-container-color` | `color` | `--color-*` | Background color of the navigation bar container. |
| `--m3e-nav-bar-height` | `length` | — | Height of the navigation bar. |
| `--m3e-nav-bar-horizontal-nav-item-leading-space` | `length` | — | Leading space for horizontal nav items. |
| `--m3e-nav-bar-horizontal-nav-item-trailing-space` | `length` | — | Trailing space for horizontal nav items. |
| `--m3e-nav-bar-vertical-item-width` | `length` | — | Minimum width of vertical nav items. |

## `m3e-nav-item`

An item, placed in a navigation bar or rail, used to navigate to destinations in an application.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-horizontal-nav-item-active-indicator-height` | `length` | — | Height of the active indicator in horizontal orientation. |
| `--m3e-horizontal-nav-item-padding` | `length` | — | Padding for horizontal orientation. |
| `--m3e-nav-item-active-container-color` | `color` | `--color-*` | Container color when active/selected. |
| `--m3e-nav-item-active-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus when active. |
| `--m3e-nav-item-active-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover when active. |
| `--m3e-nav-item-active-icon-color` | `color` | `--color-*` | Color of the icon when active/selected. |
| `--m3e-nav-item-active-label-text-color` | `color` | `--color-*` | Color of the label text when active/selected. |
| `--m3e-nav-item-active-pressed-state-layer-color` | `color` | `--color-*` | State layer color on press when active. |
| `--m3e-nav-item-disabled-icon-color` | `color` | `--color-*` | Color of the icon when disabled. |
| `--m3e-nav-item-disabled-icon-opacity` | `number` | — | Opacity of the icon when disabled. |
| `--m3e-nav-item-disabled-label-text-color` | `color` | `--color-*` | Color of the label text when disabled. |
| `--m3e-nav-item-disabled-label-text-opacity` | `number` | — | Opacity of the label text when disabled. |
| `--m3e-nav-item-focus-ring-shape` | `length` | `--radius-*` | Border radius for the focus ring. |
| `--m3e-nav-item-icon-size` | `length` | — | Size of the icon. |
| `--m3e-nav-item-inactive-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus when inactive. |
| `--m3e-nav-item-inactive-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover when inactive. |
| `--m3e-nav-item-inactive-icon-color` | `color` | `--color-*` | Color of the icon when inactive. |
| `--m3e-nav-item-inactive-label-text-color` | `color` | `--color-*` | Color of the label text when inactive. |
| `--m3e-nav-item-inactive-pressed-state-layer-color` | `color` | `--color-*` | State layer color on press when inactive. |
| `--m3e-nav-item-label-text-font-size` | `length` | `--text-*` | Font size for the label text. |
| `--m3e-nav-item-label-text-font-weight` | `number` | `--font-weight-*` | Font weight for the label text. |
| `--m3e-nav-item-label-text-line-height` | `length` | `--leading-*` | Line height for the label text. |
| `--m3e-nav-item-label-text-tracking` | `length` | `--tracking-*` | Letter spacing for the label text. |
| `--m3e-nav-item-shape` | `length` | `--radius-*` | Border radius of the nav item. |
| `--m3e-nav-item-spacing` | `length` | — | Spacing between icon and label. |
| `--m3e-vertical-nav-item-active-indicator-height` | `length` | — | Height of the active indicator in vertical orientation. |
| `--m3e-vertical-nav-item-active-indicator-margin` | `length` | — | Margin for the active indicator in vertical orientation. |
| `--m3e-vertical-nav-item-active-indicator-width` | `length` | — | Width of the active indicator in vertical orientation. |

## `m3e-nav-menu`

A hierarchical menu, typically used on larger devices, that allows a user to switch between views.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-nav-menu-divider-margin` | `length` | — | Margin for divider elements in the menu. |
| `--m3e-nav-menu-padding-bottom` | `length` | — | Bottom padding for the menu. |
| `--m3e-nav-menu-padding-left` | `length` | — | Left padding for the menu. |
| `--m3e-nav-menu-padding-right` | `length` | — | Right padding for the menu. |
| `--m3e-nav-menu-padding-top` | `length` | — | Top padding for the menu. |
| `--m3e-nav-menu-scrollbar-color` | `color` | `--color-*` | Color of the menu scrollbar. |
| `--m3e-nav-menu-scrollbar-width` | `length` | — | Width of the menu scrollbar. |

## `m3e-nav-menu-item`

An expandable item, selectable item within a navigation menu.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-nav-menu-divider-margin` | `length` | — | Margin for divider elements. |
| `--m3e-nav-menu-item-badge-font-size` | `length` | `--text-*` | Font size for badge slot. |
| `--m3e-nav-menu-item-badge-font-weight` | `number` | `--font-weight-*` | Font weight for badge slot. |
| `--m3e-nav-menu-item-badge-line-height` | `length` | `--leading-*` | Line height for badge slot. |
| `--m3e-nav-menu-item-badge-tracking` | `length` | `--tracking-*` | Letter spacing for badge slot. |
| `--m3e-nav-menu-item-disabled-color` | `color` | `--color-*` | Text color for disabled item. |
| `--m3e-nav-menu-item-disabled-color-opacity` | `number` | — | Opacity for disabled item text color. |
| `--m3e-nav-menu-item-font-size` | `length` | `--text-*` | Font size for the item label. |
| `--m3e-nav-menu-item-font-weight` | `number` | `--font-weight-*` | Font weight for the item label. |
| `--m3e-nav-menu-item-height` | `length` | — | Height of the item. |
| `--m3e-nav-menu-item-icon-size` | `length` | — | Size of the icon. |
| `--m3e-nav-menu-item-inset` | `length` | — | Indentation for nested items. |
| `--m3e-nav-menu-item-label-color` | `color` | `--color-*` | Text color for the item label. |
| `--m3e-nav-menu-item-line-height` | `length` | `--leading-*` | Line height for the item label. |
| `--m3e-nav-menu-item-open-container-color` | `color` | `--color-*` | Background color for open item with children. |
| `--m3e-nav-menu-item-open-container-focus-color` | `color` | `--color-*` | Focus color for open item container. |
| `--m3e-nav-menu-item-open-container-hover-color` | `color` | `--color-*` | Hover color for open item container. |
| `--m3e-nav-menu-item-open-container-pressed-color` | `color` | `--color-*` | Pressed color for open item. |
| `--m3e-nav-menu-item-padding` | `length` | — | Inline padding for the item. |
| `--m3e-nav-menu-item-selected-container-color` | `color` | `--color-*` | Background color for selected item. |
| `--m3e-nav-menu-item-selected-container-focus-color` | `color` | `--color-*` | Focus color for selected item container. |
| `--m3e-nav-menu-item-selected-container-hover-color` | `color` | `--color-*` | Hover color for selected item container. |
| `--m3e-nav-menu-item-selected-container-pressed-color` | `color` | `--color-*` | Pressed color for selected item. |
| `--m3e-nav-menu-item-selected-label-color` | `color` | `--color-*` | Text color for selected item label. |
| `--m3e-nav-menu-item-shape` | `length` | `--radius-*` | Border radius of the item and focus ring. |
| `--m3e-nav-menu-item-spacing` | `length` | — | Spacing between icon and label. |
| `--m3e-nav-menu-item-tracking` | `length` | `--tracking-*` | Letter spacing for the item label. |
| `--m3e-nav-menu-item-unselected-container-focus-color` | `color` | `--color-*` | Focus color for unselected item container. |
| `--m3e-nav-menu-item-unselected-container-hover-color` | `color` | `--color-*` | Hover color for unselected item container. |
| `--m3e-nav-menu-item-unselected-container-pressed-color` | `color` | `--color-*` | Pressed color for unselected item. |
| `--m3e-nav-menu-item-vertical-inset` | `length` | — | Vertical margin for first/last child items. |

## `m3e-nav-menu-item-group`

A top-level semantic grouping of items in a navigation menu.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-nav-menu-item-group-label-inset` | `length` | — | Insets the label from the start edge of the group. |
| `--m3e-nav-menu-item-group-label-space` | `length` | — | Vertical spacing around the group's label. |

## `m3e-nav-rail`

A vertical bar, typically used on larger devices, that allows a user to switch between views.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-nav-bar-container-color` | `color` | `--color-*` | Background color of the navigation bar container. |
| `--m3e-nav-bar-height` | `length` | — | Height of the navigation bar. |
| `--m3e-nav-bar-horizontal-nav-item-leading-space` | `length` | — | Leading space for horizontal nav items. |
| `--m3e-nav-bar-horizontal-nav-item-trailing-space` | `length` | — | Trailing space for horizontal nav items. |
| `--m3e-nav-bar-vertical-item-width` | `length` | — | Minimum width of vertical nav items. |
| `--m3e-nav-rail-bottom-space` | `length` | — | Bottom block padding for the nav rail. |
| `--m3e-nav-rail-button-item-space` | `length` | — | Space below icon buttons and FABs. |
| `--m3e-nav-rail-compact-width` | `length` | — | Width of the nav rail in compact mode. |
| `--m3e-nav-rail-expanded-icon-button-inset` | `length` | — | Deprecated, use `--m3e-nav-rail-icon-button-inset`. |
| `--m3e-nav-rail-expanded-inline-padding` | `length` | — | Deprecated, use `--m3e-nav-rail-inline-padding`. |
| `--m3e-nav-rail-expanded-item-height` | `length` | — | Height of nav items in expanded mode. |
| `--m3e-nav-rail-expanded-max-width` | `length` | — | Deprecated, use `--m3e-nav-rail-expanded-width`. |
| `--m3e-nav-rail-expanded-min-width` | `length` | — | Deprecated, use `--m3e-nav-rail-expanded-width`. |
| `--m3e-nav-rail-expanded-width` | `length` | — | Width of the nav rail in expanded mode. |
| `--m3e-nav-rail-icon-button-inset` | `length` | — | Inset for icon buttons. |
| `--m3e-nav-rail-inline-padding` | `length` | — | Inline padding for nav rail. |
| `--m3e-nav-rail-top-space` | `length` | — | Top block padding for the nav rail. |

## `m3e-optgroup`

Groups options under a subheading.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-option-color` | `color` | `--color-*` | The text color of the group label. |
| `--m3e-option-font-size` | `length` | `--text-*` | The font size of the group label. |
| `--m3e-option-font-weight` | `number` | `--font-weight-*` | The font weight of the group label. |
| `--m3e-option-height` | `length` | — | The height of the group label container. |
| `--m3e-option-line-height` | `length` | `--leading-*` | The line height of the group label. |
| `--m3e-option-padding-end` | `length` | — | The right padding of the label. |
| `--m3e-option-padding-start` | `length` | — | The left padding of the label. |
| `--m3e-option-tracking` | `length` | `--tracking-*` | The letter spacing of the group label. |

## `m3e-option`

An option that can be selected.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-option-color` | `color` | `--color-*` | The text color of the option. |
| `--m3e-option-container-focus-color` | `color` | `--color-*` | The color for the focus state layer. |
| `--m3e-option-container-height` | `length` | — | The height of the option container. |
| `--m3e-option-container-hover-color` | `color` | `--color-*` | The color for the hover state layer. |
| `--m3e-option-disabled-color` | `color` | `--color-*` | The text color when the option is disabled. |
| `--m3e-option-disabled-opacity` | `number` | — | The opacity level applied to the disabled text color. |
| `--m3e-option-first-child-shape` | `length` | `--radius-*` | Shape for the first option in a list. |
| `--m3e-option-focus-ring-shape` | `length` | `--radius-*` | The corner radius of the focus ring. |
| `--m3e-option-icon-label-space` | `length` | — | The spacing between the icon and label. |
| `--m3e-option-icon-size` | `length` | — | The size of the option icons. |
| `--m3e-option-label-text-font-size` | `length` | `--text-*` | The font size of the option label. |
| `--m3e-option-label-text-font-weight` | `number` | `--font-weight-*` | The font weight of the option label. |
| `--m3e-option-label-text-line-height` | `length` | `--leading-*` | The line height of the option label. |
| `--m3e-option-label-text-tracking` | `length` | `--tracking-*` | The letter spacing of the option label. |
| `--m3e-option-last-child-shape` | `length` | `--radius-*` | Shape for the last option in a list. |
| `--m3e-option-padding-end` | `length` | — | The right padding of the option content. |
| `--m3e-option-padding-start` | `length` | — | The left padding of the option content. |
| `--m3e-option-ripple-color` | `color` | `--color-*` | The color of the ripple effect. |
| `--m3e-option-selected-color` | `color` | `--color-*` | The text color when the option is selected. |
| `--m3e-option-selected-container-color` | `color` | `--color-*` | The background color when the option is selected. |
| `--m3e-option-selected-container-focus-color` | `color` | `--color-*` | The focus color for the selected state layer. |
| `--m3e-option-selected-container-hover-color` | `color` | `--color-*` | The hover color for the selected state layer. |
| `--m3e-option-selected-ripple-color` | `color` | `--color-*` | The ripple color when the option is selected. |
| `--m3e-option-selected-shape` | `length` | `--radius-*` | Shape used for a selected option. |
| `--m3e-option-shape` | `length` | `--radius-*` | Base shape of the option. |

## `m3e-option-panel`

Presents a list of options on a temporary surface.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-floating-panel-container-color` | `color` | `--color-*` | Background color of the panel container. |
| `--m3e-floating-panel-container-elevation` | `*` | `--shadow-*` | Box shadow elevation of the panel container. |
| `--m3e-floating-panel-container-max-height` | `length` | — | Maximum height of the panel container. |
| `--m3e-floating-panel-container-max-width` | `length` | — | Maximum width of the panel container. |
| `--m3e-floating-panel-container-min-width` | `length` | — | Minimum width of the panel container. |
| `--m3e-floating-panel-container-padding-block` | `length` | — | Vertical padding inside the panel container. |
| `--m3e-floating-panel-container-padding-inline` | `length` | — | Horizontal padding inside the panel container. |
| `--m3e-floating-panel-container-shape` | `length` | `--radius-*` | Corner radius of the panel container. |
| `--m3e-option-panel-container-color` | `color` | `--color-*` | Background color of the panel container. |
| `--m3e-option-panel-container-elevation` | `*` | `--shadow-*` | Box shadow elevation of the panel container. |
| `--m3e-option-panel-container-max-height` | `length` | — | Maximum height of the panel container. |
| `--m3e-option-panel-container-max-width` | `length` | — | Maximum width of the panel container. |
| `--m3e-option-panel-container-min-width` | `length` | — | Minimum width of the panel container. |
| `--m3e-option-panel-container-padding-block` | `length` | — | Vertical padding inside the panel container. |
| `--m3e-option-panel-container-padding-inline` | `length` | — | Horizontal padding inside the panel container. |
| `--m3e-option-panel-container-shape` | `length` | `--radius-*` | Corner radius of the panel container. |
| `--m3e-option-panel-divider-spacing` | `length` | — | Vertical spacing around slotted `m3e-divider` elements. |
| `--m3e-option-panel-gap` | `length` | — | Vertical spacing between option items. |
| `--m3e-option-panel-text-highlight-color` | `color` | `--color-*` | Text color used for text highlight matches. |
| `--m3e-option-panel-text-highlight-container-color` | `color` | `--color-*` | Background color used for text highlight matches. |

## `m3e-paginator`

Provides navigation for paged information, typically used with a table.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-paginator-font-size` | `length` | `--text-*` | The font size used for paginator text. |
| `--m3e-paginator-font-weight` | `number` | `--font-weight-*` | The font weight used for paginator text. |
| `--m3e-paginator-line-height` | `length` | `--leading-*` | The line height used for paginator text. |
| `--m3e-paginator-tracking` | `length` | `--tracking-*` | The letter-spacing used for paginator text. |

## `m3e-pseudo-checkbox`

An element which looks like a checkbox.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-checkbox-container-shape` | `length` | `--radius-*` | Border radius of the checkbox container. |
| `--m3e-checkbox-icon-size` | `length` | — | Size of the checkbox icon. |
| `--m3e-checkbox-selected-container-color` | `color` | `--color-*` | Background color for selected state. |
| `--m3e-checkbox-selected-disabled-container-color` | `color` | `--color-*` | Background color for selected disabled state. |
| `--m3e-checkbox-selected-disabled-container-opacity` | `number` | — | Background opacity for selected disabled state. |
| `--m3e-checkbox-selected-disabled-icon-color` | `color` | `--color-*` | Icon color for selected disabled state. |
| `--m3e-checkbox-selected-disabled-icon-opacity` | `number` | — | Icon opacity for selected disabled state. |
| `--m3e-checkbox-selected-icon-color` | `color` | `--color-*` | Icon color for selected state. |
| `--m3e-checkbox-unselected-disabled-outline-color` | `color` | `--color-*` | Outline color for unselected disabled state. |
| `--m3e-checkbox-unselected-disabled-outline-opacity` | `number` | — | Outline opacity for unselected disabled state. |
| `--m3e-checkbox-unselected-outline-color` | `color` | `--color-*` | Outline color for unselected state. |
| `--m3e-checkbox-unselected-outline-thickness` | `length` | — | Outline thickness for unselected state. |

## `m3e-pseudo-radio`

An element which looks like a radio button.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-radio-disabled-icon-color` | `color` | `--color-*` | Color of the disabled radio icon. |
| `--m3e-radio-icon-size` | `length` | — | Size of the radio icon. |
| `--m3e-radio-selected-icon-color` | `color` | `--color-*` | Color of the selected radio icon. |
| `--m3e-radio-unselected-icon-color` | `color` | `--color-*` | Color of the unselected radio icon. |

## `m3e-radio`

A radio button that allows a user to select one option from a set of options.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-radio-container-size` | `length` | — | Base size of the radio button container. |
| `--m3e-radio-disabled-icon-color` | `color` | `--color-*` | Icon color when radio is disabled. |
| `--m3e-radio-error-focus-color` | `color` | `--color-*` | Fallback focus color used when the radio is invalid and touched. |
| `--m3e-radio-error-hover-color` | `color` | `--color-*` | Fallback hover color used when the radio is invalid and touched. |
| `--m3e-radio-error-icon-color` | `color` | `--color-*` | Fallback icon color used when the radio is invalid and touched. |
| `--m3e-radio-error-ripple-color` | `color` | `--color-*` | Fallback ripple color used when the radio is invalid and touched. |
| `--m3e-radio-icon-size` | `length` | — | Size of the radio icon inside the wrapper. |
| `--m3e-radio-selected-focus-color` | `color` | `--color-*` | Focus state layer color when radio is selected. |
| `--m3e-radio-selected-hover-color` | `color` | `--color-*` | Hover state layer color when radio is selected. |
| `--m3e-radio-selected-icon-color` | `color` | `--color-*` | Icon color when radio is selected. |
| `--m3e-radio-selected-ripple-color` | `color` | `--color-*` | Ripple color when radio is selected. |
| `--m3e-radio-unselected-focus-color` | `color` | `--color-*` | Focus state layer color when radio is not selected. |
| `--m3e-radio-unselected-hover-color` | `color` | `--color-*` | Hover state layer color when radio is not selected. |
| `--m3e-radio-unselected-icon-color` | `color` | `--color-*` | Icon color when radio is not selected. |
| `--m3e-radio-unselected-ripple-color` | `color` | `--color-*` | Ripple color when radio is not selected. |

## `m3e-rich-tooltip`

Provides contextual details for a control, such as explaining the value or purpose of a feature.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-rich-tooltip-actions-bottom-space` | `length` | — | Space below the actions slot. |
| `--m3e-rich-tooltip-actions-padding-inline` | `length` | — | Horizontal padding applied to the actions slot area. |
| `--m3e-rich-tooltip-actions-top-space` | `length` | — | Space above the actions slot. |
| `--m3e-rich-tooltip-container-color` | `color` | `--color-*` | Background color of the tooltip surface. |
| `--m3e-rich-tooltip-max-width` | `length` | — | Maximum width of the tooltip surface. |
| `--m3e-rich-tooltip-padding-bottom` | `length` | — | Bottom padding of the tooltip container (when no actions are present). |
| `--m3e-rich-tooltip-padding-inline` | `length` | — | Horizontal padding of the tooltip container. |
| `--m3e-rich-tooltip-padding-top` | `length` | — | Top padding of the tooltip container. |
| `--m3e-rich-tooltip-shape` | `length` | `--radius-*` | Border‑radius of the tooltip container. |
| `--m3e-rich-tooltip-subhead-bottom-space` | `length` | — | Space below the subhead before the supporting text. |
| `--m3e-rich-tooltip-subhead-color` | `color` | `--color-*` | Color of the subhead text. |
| `--m3e-rich-tooltip-subhead-font-size` | `length` | `--text-*` | Font size of the subhead text. |
| `--m3e-rich-tooltip-subhead-font-weight` | `number` | `--font-weight-*` | Font weight of the subhead text. |
| `--m3e-rich-tooltip-subhead-line-height` | `length` | `--leading-*` | Line height of the subhead text. |
| `--m3e-rich-tooltip-subhead-tracking` | `length` | `--tracking-*` | Letter‑spacing of the subhead text. |
| `--m3e-rich-tooltip-supporting-text-color` | `color` | `--color-*` | Color of the supporting text. |
| `--m3e-rich-tooltip-supporting-text-font-size` | `length` | `--text-*` | Font size of the supporting text. |
| `--m3e-rich-tooltip-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight of the supporting text. |
| `--m3e-rich-tooltip-supporting-text-line-height` | `length` | `--leading-*` | Line height of the supporting text. |
| `--m3e-rich-tooltip-supporting-text-tracking` | `length` | `--tracking-*` | Letter‑spacing of the supporting text. |

## `m3e-ripple`

Connects user input to screen reactions using ripples.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-ripple-color` | `color` | `--color-*` | The color of the ripple. |
| `--m3e-ripple-enter-duration` | `time` | `--transition-duration-*` | The duration for the enter animation (expansion from point of contact). |
| `--m3e-ripple-exit-duration` | `time` | `--transition-duration-*` | The duration for the exit animation (fade-out). |
| `--m3e-ripple-opacity` | `number` | — | The opacity of the ripple. |

## `m3e-scroll-container`

A vertically oriented content container which presents dividers above and below content when scrolled.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-divider-color` | `color` | `--color-*` | Color of the divider lines when visible. |
| `--m3e-divider-thickness` | `length` | — | Thickness of the divider lines above and below content. |
| `--m3e-focus-ring-color` | `color` | `--color-*` | Color of the focus ring outline. |
| `--m3e-focus-ring-duration` | `time` | `--transition-duration-*` | Duration of the focus ring animation. |
| `--m3e-focus-ring-factor` | `*` | — | Animation factor for focus ring thickness. |
| `--m3e-focus-ring-thickness` | `length` | — | Thickness of the focus ring outline. |

## `m3e-search-bar`

A bar that provides a prominent entry point for search.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-search-bar-actions-gap` | `length` | — | Gap between action icons. |
| `--m3e-search-bar-container-color` | `color` | `--color-*` | Background color of the search bar container. |
| `--m3e-search-bar-container-height` | `length` | — | Height of the search bar container. |
| `--m3e-search-bar-container-shape` | `length` | `--radius-*` | Shape (border radius) of the search bar container. |
| `--m3e-search-bar-icon-size` | `length` | — | Size of icons inside the search bar. |
| `--m3e-search-bar-input-color` | `color` | `--color-*` | Color of the input text. |
| `--m3e-search-bar-input-text-font-size` | `length` | `--text-*` | Font size of the input text. |
| `--m3e-search-bar-input-text-font-weight` | `number` | `--font-weight-*` | Font weight of the input text. |
| `--m3e-search-bar-input-text-line-height` | `length` | `--leading-*` | Line height of the input text. |
| `--m3e-search-bar-input-text-tracking` | `length` | `--tracking-*` | Letter spacing of the input text. |
| `--m3e-search-bar-leading-actions-trailing-space` | `length` | — | Space between leading actions and the input. |
| `--m3e-search-bar-leading-icon-color` | `color` | `--color-*` | Color of the leading icon. |
| `--m3e-search-bar-leading-space` | `length` | — | Space before the leading icon. |
| `--m3e-search-bar-no-actions-leading-space` | `length` | — | Leading padding when no actions are present. |
| `--m3e-search-bar-no-actions-trailing-space` | `length` | — | Trailing padding when no actions are present. |
| `--m3e-search-bar-supporting-text-color` | `color` | `--color-*` | Color of the supporting text. |
| `--m3e-search-bar-supporting-text-font-size` | `length` | `--text-*` | Font size of the supporting text. |
| `--m3e-search-bar-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight of the supporting text. |
| `--m3e-search-bar-supporting-text-line-height` | `length` | `--leading-*` | Line height of the supporting text. |
| `--m3e-search-bar-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing of the supporting text. |
| `--m3e-search-bar-trailing-actions-leading-space` | `length` | — | Space between the input and trailing actions. |
| `--m3e-search-bar-trailing-icon-color` | `color` | `--color-*` | Color of the trailing icon. |
| `--m3e-search-bar-trailing-space` | `length` | — | Space after the trailing icon. |

## `m3e-search-view`

A surface that presents suggestions and results for a search.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-search-view-contained-container-color` | `color` | `--color-*` | Background color of the contained view container. |
| `--m3e-search-view-contained-docked-bar-results-gap` | `length` | — | Gap between the contained docked bar and results. |
| `--m3e-search-view-contained-docked-bar-shape` | `length` | `--radius-*` | Shape of the bar in contained docked mode. |
| `--m3e-search-view-contained-docked-results-shape` | `length` | `--radius-*` | Shape of the results container in contained docked mode. |
| `--m3e-search-view-contained-docked-results-space` | `length` | — | Space above the results in contained docked mode. |
| `--m3e-search-view-contained-focused-leading-margin` | `length` | — | Leading margin when the contained view is focused. |
| `--m3e-search-view-contained-focused-trailing-margin` | `length` | — | Trailing margin when the contained view is focused. |
| `--m3e-search-view-contained-full-screen-bar-container-height` | `length` | — | Height of the bar container in contained fullscreen mode. |
| `--m3e-search-view-contained-leading-margin` | `length` | — | Leading margin for the contained view. |
| `--m3e-search-view-contained-trailing-margin` | `length` | — | Trailing margin for the contained view. |
| `--m3e-search-view-container-color` | `color` | `--color-*` | Background color of the view container. |
| `--m3e-search-view-divider-color` | `color` | `--color-*` | Color of the divider separating header and results. |
| `--m3e-search-view-divider-thickness` | `length` | — | Thickness of the divider separating header and results. |
| `--m3e-search-view-docked-container-max-height` | `length` | — | Maximum height of the docked view container. |
| `--m3e-search-view-docked-container-min-height` | `length` | — | Minimum height of the docked view container. |
| `--m3e-search-view-docked-container-shape` | `length` | `--radius-*` | Shape of the docked view container. |
| `--m3e-search-view-docked-header-container-height` | `length` | — | Height of the header container in docked mode. |
| `--m3e-search-view-docked-results-bottom-space` | `length` | — | Space below the results in docked mode. |
| `--m3e-search-view-docked-scrim-color` | `color` | `--color-*` | Color of the scrim behind the docked view. |
| `--m3e-search-view-docked-scrim-opacity` | `number` | — | Opacity of the scrim behind the docked view. |
| `--m3e-search-view-full-screen-container-shape` | `length` | `--radius-*` | Shape of the fullscreen view container. |
| `--m3e-search-view-full-screen-header-container-height` | `length` | — | Height of the header container in fullscreen mode. |

## `m3e-segmented-button`

A button that allows a user to select from a limited set of options.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-segmented-button-end-shape` | `length` | `--radius-*` | Border radius for the last segment in a segmented button. |
| `--m3e-segmented-button-start-shape` | `length` | `--radius-*` | Border radius for the first segment in a segmented button. |

## `m3e-select`

A form control that allows users to select a value from a set of predefined options.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-form-field-font-size` | `length` | `--text-*` | The font size of the select control. |
| `--m3e-form-field-font-weight` | `number` | `--font-weight-*` | The font weight of the select control. |
| `--m3e-form-field-line-height` | `length` | `--leading-*` | The line height of the select control. |
| `--m3e-form-field-tracking` | `length` | `--tracking-*` | The letter spacing of the select control. |
| `--m3e-select-container-shape` | `length` | `--radius-*` | The corner radius of the select container. |
| `--m3e-select-disabled-color` | `color` | `--color-*` | The text color when the select is disabled. |
| `--m3e-select-disabled-color-opacity` | `number` | — | The opacity level applied to the disabled text color. |
| `--m3e-select-icon-size` | `length` | — | The size of the dropdown arrow icon. |

## `m3e-selection-indicator`

Provides selection, focus, and hover state layer treatment for an interactive element that supports selection.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-selection-indicator-color` | `color` | `--color-*` | Color of the indicator. |
| `--m3e-selection-indicator-state-layer-duration` | `time` | `--transition-duration-*` | Duration of state layer changes. |
| `--m3e-selection-indicator-state-layer-easing` | `*` | `--ease-*` | Easing curve of state layer changes. |
| `--m3e-selection-indicator-state-layer-focus-color` | `color` | `--color-*` | Color on focus. |
| `--m3e-selection-indicator-state-layer-focus-opacity` | `number` | — | Opacity on focus. |
| `--m3e-selection-indicator-state-layer-hover-color` | `color` | `--color-*` | Color on hover. |
| `--m3e-selection-indicator-state-layer-hover-opacity` | `number` | — | Opacity on hover. |
| `--m3e-selection-indicator-state-layer-pressed-color` | `color` | `--color-*` | Color on pressed. |
| `--m3e-selection-indicator-state-layer-pressed-opacity` | `number` | — | Opacity on pressed. |

## `m3e-selection-list`

A list of selectable options.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-list-divider-inset-end-size` | `length` | — | End inset for dividers within the list. |
| `--m3e-list-divider-inset-start-size` | `length` | — | Start inset for dividers within the list. |
| `--m3e-segmented-list-container-shape` | `length` | `--radius-*` | Border radius of the segmented list container. |
| `--m3e-segmented-list-item-container-color` | `color` | `--color-*` | Background color of items in segmented variant. |
| `--m3e-segmented-list-item-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant. |
| `--m3e-segmented-list-item-disabled-container-color` | `color` | `--color-*` | Background color of disabled items in segmented variant. |
| `--m3e-segmented-list-item-focus-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant on focus. |
| `--m3e-segmented-list-item-hover-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant on hover. |
| `--m3e-segmented-list-item-selected-container-shape` | `length` | `--radius-*` | Border radius of items in segmented variant when selected. |
| `--m3e-segmented-list-segment-gap` | `length` | — | Gap between list items in segmented variant. |

## `m3e-shape`

A shape used to add emphasis and decorative flair.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-shape-container-color` | `color` | `--color-*` | Container (background) color of the shape. |
| `--m3e-shape-size` | `length` | `--radius-*` | Default size of the shape. |
| `--m3e-shape-transition` | `length` | `--radius-*` | Transition used to morph between shapes. |

## `m3e-skeleton`

A visual placeholder that mimics the layout of content while it's still loading.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-skeleton-accent-color` | `color` | `--color-*` | Accent color used in wave animation. |
| `--m3e-skeleton-accent-opacity` | `number` | — | Opacity of the accent effect in animations. |
| `--m3e-skeleton-circular-shape` | `length` | `--radius-*` | Corner radius for the circular skeleton shape. |
| `--m3e-skeleton-color` | `color` | `--color-*` | Base fill color for the skeleton surface. |
| `--m3e-skeleton-rounded-shape` | `length` | `--radius-*` | Corner radius for the rounded skeleton shape. |
| `--m3e-skeleton-shape` | `length` | `--radius-*` | Corner radius for the skeleton shape. |
| `--m3e-skeleton-square-shape` | `length` | `--radius-*` | Corner radius for the square skeleton shape. |
| `--m3e-skeleton-tint-color` | `color` | `--color-*` | Tint fill color for the skeleton surface. |
| `--m3e-skeleton-tint-opacity` | `number` | — | Tint Opacity applied when the skeleton animation is not pulsating. |

## `m3e-slide`

A carousel-like container used to horizontally cycle through slotted items.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-slide-animation-duration` | `time` | `--transition-duration-*` | The duration of transitions between slotted items. |

## `m3e-slide-group`

Presents pagination controls used to scroll overflowing content.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-slide-group-button-icon-size` | `length` | — | Sets icon size for scroll buttons; overrides default small icon size. |
| `--m3e-slide-group-button-size` | `length` | — | Defines scroll button size; used for width (horizontal) or height (vertical). |
| `--m3e-slide-group-divider-bottom` | `length` | — | Adds bottom border to content container for visual separation. |
| `--m3e-slide-group-divider-top` | `length` | — | Adds top border to content container for visual separation. |

## `m3e-slider`

Allows for the selection of numeric values from a range.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-slider-active-track-color` | `color` | `--color-*` | Background color of the active track when enabled. |
| `--m3e-slider-disabled-active-track-color` | `color` | `--color-*` | Base color of the active track when disabled. |
| `--m3e-slider-disabled-active-track-opacity` | `number` | — | Opacity of the active track when disabled. |
| `--m3e-slider-disabled-inactive-track-color` | `color` | `--color-*` | Base color of the inactive track when disabled. |
| `--m3e-slider-disabled-inactive-track-opacity` | `number` | — | Opacity of the inactive track when disabled. |
| `--m3e-slider-disabled-tick-active-color` | `color` | `--color-*` | Color of active ticks when disabled. |
| `--m3e-slider-disabled-tick-inactive-color` | `color` | `--color-*` | Color of inactive ticks when disabled. |
| `--m3e-slider-extra-large-active-track-shape` | `length` | `--radius-*` | Corner shape of the active track for extra-large sliders. |
| `--m3e-slider-extra-large-height` | `length` | — | Height of the slider when size is extra-large. |
| `--m3e-slider-extra-large-inactive-active-track-start-shape` | `length` | `--radius-*` | Corner shape of the inactive track start for extra-large sliders. |
| `--m3e-slider-extra-large-inactive-track-end-shape` | `length` | `--radius-*` | Corner shape of the inactive track end for extra-large sliders. |
| `--m3e-slider-extra-large-track-height` | `length` | — | Height of the track for extra-large sliders. |
| `--m3e-slider-extra-small-track-height` | `length` | — | Height of the track for extra-small sliders. |
| `--m3e-slider-inactive-track-color` | `color` | `--color-*` | Background color of the inactive track when enabled. |
| `--m3e-slider-large-active-track-shape` | `length` | `--radius-*` | Corner shape of the active track for large sliders. |
| `--m3e-slider-large-height` | `length` | — | Height of the slider when size is large. |
| `--m3e-slider-large-inactive-active-track-start-shape` | `length` | `--radius-*` | Corner shape of the inactive track start for large sliders. |
| `--m3e-slider-large-inactive-track-end-shape` | `length` | `--radius-*` | Corner shape of the inactive track end for large sliders. |
| `--m3e-slider-large-track-height` | `length` | — | Height of the track for large sliders. |
| `--m3e-slider-medium-active-track-shape` | `length` | `--radius-*` | Corner shape of the active track for medium sliders. |
| `--m3e-slider-medium-height` | `length` | — | Height of the slider when size is medium. |
| `--m3e-slider-medium-inactive-active-track-start-shape` | `length` | `--radius-*` | Corner shape of the inactive track start for medium sliders. |
| `--m3e-slider-medium-inactive-track-end-shape` | `length` | `--radius-*` | Corner shape of the inactive track end for medium sliders. |
| `--m3e-slider-medium-track-height` | `length` | — | Height of the track for medium sliders. |
| `--m3e-slider-min-width` | `length` | — | Minimum inline size of the slider host. |
| `--m3e-slider-small-active-track-shape` | `length` | `--radius-*` | Corner shape of the active track for small sliders. |
| `--m3e-slider-small-height` | `length` | — | Height of the slider when size is small or extra-small. |
| `--m3e-slider-small-inactive-active-track-start-shape` | `length` | `--radius-*` | Corner shape of the inactive track start for small sliders. |
| `--m3e-slider-small-inactive-track-end-shape` | `length` | `--radius-*` | Corner shape of the inactive track end for small sliders. |
| `--m3e-slider-small-track-height` | `length` | — | Height of the track for small sliders. |
| `--m3e-slider-tick-active-color` | `color` | `--color-*` | Color of active ticks when enabled. |
| `--m3e-slider-tick-inactive-color` | `color` | `--color-*` | Color of inactive ticks when enabled. |
| `--m3e-slider-tick-shape` | `length` | `--radius-*` | Corner shape of each tick mark. |
| `--m3e-slider-tick-size` | `length` | — | Size of each tick mark. |

## `m3e-slider-thumb`

A thumb used to select a value in a slider.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-slider-label-color` | `color` | `--color-*` | Text color of the label. |
| `--m3e-slider-label-container-color` | `color` | `--color-*` | Background color of the label container. |
| `--m3e-slider-label-font-size` | `length` | `--text-*` | Font size of the label text. |
| `--m3e-slider-label-font-weight` | `number` | `--font-weight-*` | Font weight of the label text. |
| `--m3e-slider-label-line-height` | `length` | `--leading-*` | Line height of the label text. |
| `--m3e-slider-label-tracking` | `length` | `--tracking-*` | Letter spacing of the label text. |
| `--m3e-slider-label-width` | `length` | — | Width of the floating label above the thumb. |
| `--m3e-slider-thumb-color` | `color` | `--color-*` | Active color of the slider thumb when enabled. |
| `--m3e-slider-thumb-disabled-color` | `color` | `--color-*` | Color of the thumb when disabled. |
| `--m3e-slider-thumb-disabled-opacity` | `number` | — | Opacity of the thumb when disabled. |
| `--m3e-slider-thumb-padding` | `length` | — | Horizontal padding around the thumb. |
| `--m3e-slider-thumb-pressed-width` | `length` | — | Width of the thumb when pressed. |
| `--m3e-slider-thumb-width` | `length` | — | Width of the slider thumb. |

## `m3e-snackbar`

Presents short updates about application processes at the bottom of the screen.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-snackbar-container-color` | `color` | `--color-*` | Background color of the snackbar. |
| `--m3e-snackbar-container-shape` | `length` | `--radius-*` | Border radius of the snackbar container. |
| `--m3e-snackbar-margin` | `length` | — | Vertical offset from the bottom of the viewport. |
| `--m3e-snackbar-max-width` | `length` | — | Maximum width of the snackbar. |
| `--m3e-snackbar-min-width` | `length` | — | Minimum width of the snackbar. |
| `--m3e-snackbar-padding` | `length` | — | Internal spacing of the snackbar container. |

## `m3e-split-button`

A button used to show an action with a menu of related actions.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-split-button-extra-large-between-spacing` | `length` | — | Spacing between leading and trailing buttons (extra-large). |
| `--m3e-split-button-extra-large-inner-corner-hover-size` | `length` | `--radius-*` | Inner corner size on hover (extra-large). |
| `--m3e-split-button-extra-large-inner-corner-pressed-size` | `length` | `--radius-*` | Inner corner size on press (extra-large). |
| `--m3e-split-button-extra-large-inner-corner-size` | `length` | `--radius-*` | Inner corner size for the leading/trailing button (extra-large). |
| `--m3e-split-button-extra-large-trailing-button-selected-leading-space` | `length` | — | Leading space for the trailing button (extra-large, selected). |
| `--m3e-split-button-extra-large-trailing-button-selected-trailing-space` | `length` | — | Trailing space for the trailing button (extra-large, selected). |
| `--m3e-split-button-extra-large-trailing-button-unselected-leading-space` | `length` | — | Leading space for the trailing button (extra-large, unselected). |
| `--m3e-split-button-extra-large-trailing-button-unselected-trailing-space` | `length` | — | Trailing space for the trailing button (extra-large, unselected). |
| `--m3e-split-button-extra-small-between-spacing` | `length` | — | Spacing between leading and trailing buttons (extra-small). |
| `--m3e-split-button-extra-small-inner-corner-hover-size` | `length` | `--radius-*` | Inner corner size on hover (extra-small). |
| `--m3e-split-button-extra-small-inner-corner-pressed-size` | `length` | `--radius-*` | Inner corner size on press (extra-small). |
| `--m3e-split-button-extra-small-inner-corner-size` | `length` | `--radius-*` | Inner corner size for the leading/trailing button (extra-small). |
| `--m3e-split-button-extra-small-trailing-button-selected-leading-space` | `length` | — | Leading space for the trailing button (extra-small, selected). |
| `--m3e-split-button-extra-small-trailing-button-selected-trailing-space` | `length` | — | Trailing space for the trailing button (extra-small, selected). |
| `--m3e-split-button-extra-small-trailing-button-unselected-leading-space` | `length` | — | Leading space for the trailing button (extra-small, unselected). |
| `--m3e-split-button-extra-small-trailing-button-unselected-trailing-space` | `length` | — | Trailing space for the trailing button (extra-small, unselected). |
| `--m3e-split-button-large-between-spacing` | `length` | — | Spacing between leading and trailing buttons (large). |
| `--m3e-split-button-large-inner-corner-hover-size` | `length` | `--radius-*` | Inner corner size on hover (large). |
| `--m3e-split-button-large-inner-corner-pressed-size` | `length` | `--radius-*` | Inner corner size on press (large). |
| `--m3e-split-button-large-inner-corner-size` | `length` | `--radius-*` | Inner corner size for the leading/trailing button (large). |
| `--m3e-split-button-large-trailing-button-selected-leading-space` | `length` | — | Leading space for the trailing button (large, selected). |
| `--m3e-split-button-large-trailing-button-selected-trailing-space` | `length` | — | Trailing space for the trailing button (large, selected). |
| `--m3e-split-button-large-trailing-button-unselected-leading-space` | `length` | — | Leading space for the trailing button (large, unselected). |
| `--m3e-split-button-large-trailing-button-unselected-trailing-space` | `length` | — | Trailing space for the trailing button (large, unselected). |
| `--m3e-split-button-medium-between-spacing` | `length` | — | Spacing between leading and trailing buttons (medium). |
| `--m3e-split-button-medium-inner-corner-hover-size` | `length` | `--radius-*` | Inner corner size on hover (medium). |
| `--m3e-split-button-medium-inner-corner-pressed-size` | `length` | `--radius-*` | Inner corner size on press (medium). |
| `--m3e-split-button-medium-inner-corner-size` | `length` | `--radius-*` | Inner corner size for the leading/trailing button (medium). |
| `--m3e-split-button-medium-trailing-button-selected-leading-space` | `length` | — | Leading space for the trailing button (medium, selected). |
| `--m3e-split-button-medium-trailing-button-selected-trailing-space` | `length` | — | Trailing space for the trailing button (medium, selected). |
| `--m3e-split-button-medium-trailing-button-unselected-leading-space` | `length` | — | Leading space for the trailing button (medium, unselected). |
| `--m3e-split-button-medium-trailing-button-unselected-trailing-space` | `length` | — | Trailing space for the trailing button (medium, unselected). |
| `--m3e-split-button-small-between-spacing` | `length` | — | Spacing between leading and trailing buttons (small). |
| `--m3e-split-button-small-inner-corner-hover-size` | `length` | `--radius-*` | Inner corner size on hover (small). |
| `--m3e-split-button-small-inner-corner-pressed-size` | `length` | `--radius-*` | Inner corner size on press (small). |
| `--m3e-split-button-small-inner-corner-size` | `length` | `--radius-*` | Inner corner size for the leading/trailing button (small). |
| `--m3e-split-button-small-trailing-button-selected-leading-space` | `length` | — | Leading space for the trailing button (small, selected). |
| `--m3e-split-button-small-trailing-button-selected-trailing-space` | `length` | — | Trailing space for the trailing button (small, selected). |
| `--m3e-split-button-small-trailing-button-unselected-leading-space` | `length` | — | Leading space for the trailing button (small, unselected). |
| `--m3e-split-button-small-trailing-button-unselected-trailing-space` | `length` | — | Trailing space for the trailing button (small, unselected). |

## `m3e-split-pane`

A dual-view layout that separates content with a movable drag handle.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-split-pane-drag-handle-color` | `color` | `--color-*` | Background color of the drag handle when not pressed. |
| `--m3e-split-pane-drag-handle-container-width` | `length` | — | Width of the drag handle container. |
| `--m3e-split-pane-drag-handle-focus-color` | `color` | `--color-*` | Color used for the drag handle focus state. |
| `--m3e-split-pane-drag-handle-focus-opacity` | `number` | — | Opacity used for the drag handle focus state. |
| `--m3e-split-pane-drag-handle-height` | `length` | — | Length of the drag handle when not pressed. |
| `--m3e-split-pane-drag-handle-hover-color` | `color` | `--color-*` | Color used for the drag handle hover state. |
| `--m3e-split-pane-drag-handle-hover-opacity` | `number` | — | Opacity used for the drag handle hover state. |
| `--m3e-split-pane-drag-handle-pressed-color` | `color` | `--color-*` | Background color of the drag handle when pressed. |
| `--m3e-split-pane-drag-handle-pressed-height` | `length` | — | Length of the drag handle when pressed. |
| `--m3e-split-pane-drag-handle-pressed-shape` | `length` | `--radius-*` | Corner shape of the drag handle when pressed. |
| `--m3e-split-pane-drag-handle-pressed-width` | `length` | — | Thickness of the drag handle when pressed. |
| `--m3e-split-pane-drag-handle-shape` | `length` | `--radius-*` | Corner shape of the drag handle when not pressed. |
| `--m3e-split-pane-drag-handle-width` | `length` | — | Thickness of the drag handle when not pressed. |

## `m3e-state-layer`

Provides focus and hover state layer treatment for an interactive element.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-state-layer-duration` | `time` | `--transition-duration-*` | Duration of state layer changes. |
| `--m3e-state-layer-easing` | `*` | `--ease-*` | Easing curve of state layer changes. |
| `--m3e-state-layer-focus-color` | `color` | `--color-*` | Color on focus. |
| `--m3e-state-layer-focus-opacity` | `number` | — | Opacity on focus. |
| `--m3e-state-layer-hover-color` | `color` | `--color-*` | Color on hover. |
| `--m3e-state-layer-hover-opacity` | `number` | — | Opacity on hover. |
| `--m3e-state-layer-pressed-color` | `color` | `--color-*` | Color on pressed. |
| `--m3e-state-layer-pressed-opacity` | `number` | — | Opacity on pressed. |

## `m3e-step`

A step in a wizard-like workflow.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-step-completed-icon-color` | `color` | `--color-*` | Foreground color of the icon when the step is completed. |
| `--m3e-step-completed-icon-container-color` | `color` | `--color-*` | Background color of the icon when the step is completed. |
| `--m3e-step-disabled-hint-color` | `color` | `--color-*` | Base color used to mix the disabled hint foreground. |
| `--m3e-step-disabled-icon-color` | `color` | `--color-*` | Base color used to mix the disabled icon foreground. |
| `--m3e-step-disabled-icon-container-color` | `color` | `--color-*` | Base color used to mix the disabled icon background. |
| `--m3e-step-disabled-label-color` | `color` | `--color-*` | Base color used to mix the disabled label foreground. |
| `--m3e-step-font-size` | `length` | `--text-*` | Font size of the step label. |
| `--m3e-step-font-weight` | `number` | `--font-weight-*` | Font weight of the step label. |
| `--m3e-step-hint-color` | `color` | `--color-*` | Text color of hint messages in valid state. |
| `--m3e-step-hint-font-size` | `length` | `--text-*` | Font size of hint and error messages. |
| `--m3e-step-hint-font-weight` | `number` | `--font-weight-*` | Font weight of hint and error messages. |
| `--m3e-step-hint-line-height` | `length` | `--leading-*` | Line height of hint and error messages. |
| `--m3e-step-hint-tracking` | `length` | `--tracking-*` | Letter spacing of hint and error messages. |
| `--m3e-step-icon-error-color` | `color` | `--color-*` | Foreground color of the icon when the step is invalid. |
| `--m3e-step-icon-label-space` | `length` | — | Gap between icon and label. |
| `--m3e-step-icon-shape` | `length` | `--radius-*` | Border radius of the icon container, controlling its geometric form. |
| `--m3e-step-icon-size` | `length` | — | Width and height of the icon container and icon glyph. |
| `--m3e-step-label-color` | `color` | `--color-*` | Text color of the step label in its default state. |
| `--m3e-step-label-error-color` | `color` | `--color-*` | Text color of the step label when the step is invalid. |
| `--m3e-step-line-height` | `length` | `--leading-*` | Line height of the step label. |
| `--m3e-step-padding` | `length` | — | Internal padding of the step container, used for layout spacing. |
| `--m3e-step-selected-icon-color` | `color` | `--color-*` | Foreground color of the icon when the step is selected. |
| `--m3e-step-selected-icon-container-color` | `color` | `--color-*` | Background color of the icon when the step is selected. |
| `--m3e-step-shape` | `length` | `--radius-*` | Border radius of the step container, defining its visual shape. |
| `--m3e-step-tracking` | `length` | `--tracking-*` | Letter spacing of the step label. |
| `--m3e-step-unselected-icon-color` | `color` | `--color-*` | Foreground color of the icon when the step is inactive. |
| `--m3e-step-unselected-icon-container-color` | `color` | `--color-*` | Background color of the icon when the step is inactive. |

## `m3e-step-panel`

A panel presented for a step in a wizard-like workflow.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-step-panel-actions-height` | `length` | — | Minimum height of the slotted actions container. |
| `--m3e-step-panel-padding` | `length` | — | Padding inside the step panel container, defining internal spacing around content. |
| `--m3e-step-panel-spacing` | `length` | — | Vertical gap between stacked elements within the step panel. |

## `m3e-stepper`

Provides a wizard-like workflow by dividing content into logical steps.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-step-divider-color` | `color` | `--color-*` | Color of the divider line between steps. |
| `--m3e-step-divider-inset` | `length` | — | Inset offset for divider alignment within step layout. |
| `--m3e-step-divider-thickness` | `length` | — | Thickness of the divider line between steps. |

## `m3e-suggestion-chip`

A chip used to help narrow a user's intent by presenting dynamically generated suggestions, such as
suggested responses or search filters.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-chip-container-height` | `length` | — | Base height of the chip container before density adjustment. |
| `--m3e-chip-container-shape` | `length` | `--radius-*` | Border radius of the chip container. |
| `--m3e-chip-disabled-icon-color` | `color` | `--color-*` | Base color for disabled icons. |
| `--m3e-chip-disabled-icon-opacity` | `number` | — | Opacity applied to disabled icons. |
| `--m3e-chip-disabled-label-text-color` | `color` | `--color-*` | Base color for disabled label text. |
| `--m3e-chip-disabled-label-text-opacity` | `number` | — | Opacity applied to disabled label text. |
| `--m3e-chip-icon-color` | `color` | `--color-*` | Icon color in default state. |
| `--m3e-chip-icon-size` | `length` | — | Font size of leading/trailing icons. |
| `--m3e-chip-label-text-color` | `color` | `--color-*` | Label text color in default state. |
| `--m3e-chip-label-text-font-size` | `length` | `--text-*` | Font size of the chip label text. |
| `--m3e-chip-label-text-font-weight` | `number` | `--font-weight-*` | Font weight of the chip label text. |
| `--m3e-chip-label-text-line-height` | `length` | `--leading-*` | Line height of the chip label text. |
| `--m3e-chip-label-text-tracking` | `length` | `--tracking-*` | Letter spacing of the chip label text. |
| `--m3e-chip-padding-end` | `length` | — | Default end padding when no trailing icon is present. |
| `--m3e-chip-padding-start` | `length` | — | Default start padding when no icon is present. |
| `--m3e-chip-spacing` | `length` | — | Horizontal gap between chip content elements. |
| `--m3e-chip-with-icon-padding-end` | `length` | — | End padding when trailing icon is present. |
| `--m3e-chip-with-icon-padding-start` | `length` | — | Start padding when leading icon is present. |
| `--m3e-elevated-chip-container-color` | `color` | `--color-*` | Background color for elevated variant. |
| `--m3e-elevated-chip-disabled-container-color` | `color` | `--color-*` | Background color for disabled elevated variant. |
| `--m3e-elevated-chip-disabled-container-opacity` | `number` | — | Opacity applied to disabled elevated background. |
| `--m3e-elevated-chip-disabled-elevation` | `*` | `--shadow-*` | Elevation level for disabled elevated variant. |
| `--m3e-elevated-chip-elevation` | `*` | `--shadow-*` | Elevation level for elevated variant. |
| `--m3e-elevated-chip-hover-elevation` | `*` | `--shadow-*` | Elevation level on hover. |
| `--m3e-outlined-chip-disabled-outline-color` | `color` | `--color-*` | Outline color for disabled outlined variant. |
| `--m3e-outlined-chip-disabled-outline-opacity` | `number` | — | Opacity applied to disabled outline. |
| `--m3e-outlined-chip-outline-color` | `color` | `--color-*` | Outline color for outlined variant. |
| `--m3e-outlined-chip-outline-thickness` | `length` | — | Outline thickness for outlined variant. |

## `m3e-switch`

An on/off control that can be toggled by clicking.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-switch-disabled-selected-handle-color` | `color` | `--color-*` | Handle color when selected and disabled. |
| `--m3e-switch-disabled-selected-handle-opacity` | `number` | — | Handle opacity when selected and disabled. |
| `--m3e-switch-disabled-selected-icon-color` | `color` | `--color-*` | Icon color when selected and disabled. |
| `--m3e-switch-disabled-selected-icon-opacity` | `number` | — | Icon opacity when selected and disabled. |
| `--m3e-switch-disabled-selected-track-color` | `color` | `--color-*` | Track color when selected and disabled. |
| `--m3e-switch-disabled-track-opacity` | `number` | — | Track opacity when disabled. |
| `--m3e-switch-disabled-unselected-handle-color` | `color` | `--color-*` | Handle color when unselected and disabled. |
| `--m3e-switch-disabled-unselected-handle-opacity` | `number` | — | Handle opacity when unselected and disabled. |
| `--m3e-switch-disabled-unselected-icon-color` | `color` | `--color-*` | Icon color when unselected and disabled. |
| `--m3e-switch-disabled-unselected-icon-opacity` | `number` | — | Icon opacity when unselected and disabled. |
| `--m3e-switch-disabled-unselected-track-color` | `color` | `--color-*` | Track color when unselected and disabled. |
| `--m3e-switch-disabled-unselected-track-outline-color` | `color` | `--color-*` | Outline color when unselected and disabled. |
| `--m3e-switch-handle-shape` | `length` | `--radius-*` | Corner shape of the handle. |
| `--m3e-switch-pressed-handle-height` | `length` | — | Height of the handle during press. |
| `--m3e-switch-pressed-handle-width` | `length` | — | Width of the handle during press. |
| `--m3e-switch-selected-focus-handle-color` | `color` | `--color-*` | Handle color when selected and focused. |
| `--m3e-switch-selected-focus-icon-color` | `color` | `--color-*` | Icon color when selected and focused. |
| `--m3e-switch-selected-focus-state-layer-color` | `color` | `--color-*` | State layer color when selected and focused. |
| `--m3e-switch-selected-focus-state-layer-opacity` | `number` | — | State layer opacity when selected and focused. |
| `--m3e-switch-selected-focus-track-color` | `color` | `--color-*` | Track color when selected and focused. |
| `--m3e-switch-selected-handle-color` | `color` | `--color-*` | Handle color when selected. |
| `--m3e-switch-selected-handle-height` | `length` | — | Height of the handle when selected. |
| `--m3e-switch-selected-handle-width` | `length` | — | Width of the handle when selected. |
| `--m3e-switch-selected-hover-handle-color` | `color` | `--color-*` | Handle color when selected and hovered. |
| `--m3e-switch-selected-hover-icon-color` | `color` | `--color-*` | Icon color when selected and hovered. |
| `--m3e-switch-selected-hover-state-layer-color` | `color` | `--color-*` | State layer color when selected and hovered. |
| `--m3e-switch-selected-hover-state-layer-opacity` | `number` | — | State layer opacity when selected and hovered. |
| `--m3e-switch-selected-hover-track-color` | `color` | `--color-*` | Track color when selected and hovered. |
| `--m3e-switch-selected-icon-color` | `color` | `--color-*` | Color of the icon when the switch is selected. |
| `--m3e-switch-selected-icon-size` | `length` | — | Size of the icon in the selected state. |
| `--m3e-switch-selected-pressed-handle-color` | `color` | `--color-*` | Handle color when selected and pressed. |
| `--m3e-switch-selected-pressed-icon-color` | `color` | `--color-*` | Icon color when selected and pressed. |
| `--m3e-switch-selected-pressed-state-layer-color` | `color` | `--color-*` | State layer color when selected and pressed. |
| `--m3e-switch-selected-pressed-state-layer-opacity` | `number` | — | State layer opacity when selected and pressed. |
| `--m3e-switch-selected-pressed-track-color` | `color` | `--color-*` | Track color when selected and pressed. |
| `--m3e-switch-selected-track-color` | `color` | `--color-*` | Track color when selected. |
| `--m3e-switch-state-layer-shape` | `length` | `--radius-*` | Corner shape of the state layer. |
| `--m3e-switch-state-layer-size` | `length` | — | Diameter of the state layer overlay. |
| `--m3e-switch-track-height` | `length` | — | Height of the switch track. |
| `--m3e-switch-track-outline-color` | `color` | `--color-*` | Color of the track's outline. |
| `--m3e-switch-track-outline-width` | `length` | — | Thickness of the track's outline. |
| `--m3e-switch-track-shape` | `length` | `--radius-*` | Corner shape of the track. |
| `--m3e-switch-track-width` | `length` | — | Width of the switch track. |
| `--m3e-switch-unselected-focus-handle-color` | `color` | `--color-*` | Handle color when unselected and focused. |
| `--m3e-switch-unselected-focus-icon-color` | `color` | `--color-*` | Icon color when unselected and focused. |
| `--m3e-switch-unselected-focus-state-layer-color` | `color` | `--color-*` | State layer color when unselected and focused. |
| `--m3e-switch-unselected-focus-state-layer-opacity` | `number` | — | State layer opacity when unselected and focused. |
| `--m3e-switch-unselected-focus-track-color` | `color` | `--color-*` | Track color when unselected and focused. |
| `--m3e-switch-unselected-focus-track-outline-color` | `color` | `--color-*` | Outline color when unselected and focused. |
| `--m3e-switch-unselected-handle-color` | `color` | `--color-*` | Handle color when unselected. |
| `--m3e-switch-unselected-handle-height` | `length` | — | Height of the handle when unselected. |
| `--m3e-switch-unselected-handle-width` | `length` | — | Width of the handle when unselected. |
| `--m3e-switch-unselected-hover-handle-color` | `color` | `--color-*` | Handle color when unselected and hovered. |
| `--m3e-switch-unselected-hover-icon-color` | `color` | `--color-*` | Icon color when unselected and hovered. |
| `--m3e-switch-unselected-hover-state-layer-color` | `color` | `--color-*` | State layer color when unselected and hovered. |
| `--m3e-switch-unselected-hover-state-layer-opacity` | `number` | — | State layer opacity when unselected and hovered. |
| `--m3e-switch-unselected-hover-track-color` | `color` | `--color-*` | Track color when unselected and hovered. |
| `--m3e-switch-unselected-hover-track-outline-color` | `color` | `--color-*` | Outline color when unselected and hovered. |
| `--m3e-switch-unselected-icon-color` | `color` | `--color-*` | Color of the icon when the switch is unselected. |
| `--m3e-switch-unselected-icon-size` | `length` | — | Size of the icon in the unselected state. |
| `--m3e-switch-unselected-pressed-handle-color` | `color` | `--color-*` | Handle color when unselected and pressed. |
| `--m3e-switch-unselected-pressed-icon-color` | `color` | `--color-*` | Icon color when unselected and pressed. |
| `--m3e-switch-unselected-pressed-state-layer-color` | `color` | `--color-*` | State layer color when unselected and pressed. |
| `--m3e-switch-unselected-pressed-state-layer-opacity` | `number` | — | State layer opacity when unselected and pressed. |
| `--m3e-switch-unselected-pressed-track-color` | `color` | `--color-*` | Track color when unselected and pressed. |
| `--m3e-switch-unselected-pressed-track-outline-color` | `color` | `--color-*` | Outline color when unselected and pressed. |
| `--m3e-switch-unselected-track-color` | `color` | `--color-*` | Track color when unselected. |
| `--m3e-switch-with-icon-handle-height` | `length` | — | Height of the handle when icons are present. |
| `--m3e-switch-with-icon-handle-width` | `length` | — | Width of the handle when icons are present. |

## `m3e-tab`

An interactive element that, when activated, presents an associated tab panel.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-tab-disabled-color` | `color` | `--color-*` | Text color for disabled tab. |
| `--m3e-tab-disabled-opacity` | `number` | — | Text opacity for disabled tab. |
| `--m3e-tab-focus-ring-shape` | `length` | `--radius-*` | Border radius for the focus ring. |
| `--m3e-tab-font-size` | `length` | `--text-*` | Font size for tab label. |
| `--m3e-tab-font-weight` | `number` | `--font-weight-*` | Font weight for tab label. |
| `--m3e-tab-icon-size` | `length` | — | Font size for slotted icon. |
| `--m3e-tab-line-height` | `length` | `--leading-*` | Line height for tab label. |
| `--m3e-tab-padding-end` | `length` | — | Padding on the inline end of the tab. |
| `--m3e-tab-padding-start` | `length` | — | Padding on the inline start of the tab. |
| `--m3e-tab-selected-color` | `color` | `--color-*` | Text color for selected tab. |
| `--m3e-tab-selected-container-focus-color` | `color` | `--color-*` | Focus state-layer color for selected tab. |
| `--m3e-tab-selected-container-hover-color` | `color` | `--color-*` | Hover state-layer color for selected tab. |
| `--m3e-tab-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected tab. |
| `--m3e-tab-spacing` | `length` | — | Column gap between icon and label. |
| `--m3e-tab-tracking` | `length` | `--tracking-*` | Letter spacing for tab label. |
| `--m3e-tab-unselected-color` | `color` | `--color-*` | Text color for unselected tab. |
| `--m3e-tab-unselected-container-focus-color` | `color` | `--color-*` | Focus state-layer color for unselected tab. |
| `--m3e-tab-unselected-container-hover-color` | `color` | `--color-*` | Hover state-layer color for unselected tab. |
| `--m3e-tab-unselected-ripple-color` | `color` | `--color-*` | Ripple color for unselected tab. |

## `m3e-tabs`

Organizes content into separate views where only one view can be visible at a time.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-tabs-active-indicator-color` | `color` | `--color-*` | Color of the active tab indicator. |
| `--m3e-tabs-paginator-button-icon-size` | `length` | — | Overrides the icon size for paginator buttons. |
| `--m3e-tabs-primary-active-indicator-inset` | `length` | — | Inset for primary variant's active indicator. |
| `--m3e-tabs-primary-active-indicator-thickness` | `length` | — | Thickness for primary variant's active indicator. |
| `--m3e-tabs-primary-after-active-indicator-shape` | `length` | `--radius-*` | Border radius for active indicator when header is after and variant is primary. |
| `--m3e-tabs-primary-before-active-indicator-shape` | `length` | `--radius-*` | Border radius for active indicator when header is before and variant is primary. |
| `--m3e-tabs-secondary-active-indicator-thickness` | `length` | — | Thickness for secondary variant's active indicator. |

## `m3e-text-highlight`

Highlights text which matches a given search term.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-text-highlight-color` | `color` | `--color-*` | Foreground color of highlighted text content. |
| `--m3e-text-highlight-container-color` | `color` | `--color-*` | Background color applied to highlighted text ranges. |
| `--m3e-text-highlight-decoration` | `*` | — | Optional text decoration (e.g., underline, line-through) for highlighted text. |
| `--m3e-text-highlight-shadow` | `*` | — | Optional text shadow for emphasis or contrast. |

## `m3e-theme-icon`

An icon that visually presents a preview of a theme.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-theme-icon-color` | `color` | `--color-*` | Fill color for the primary layer of the previewed theme. |
| `--m3e-theme-icon-container-color` | `color` | `--color-*` | Fill color for the container layer of the previewed theme. |
| `--m3e-theme-icon-outline-color` | `color` | `--color-*` | Outline stroke color of the icon border. |
| `--m3e-theme-icon-outline-opacity` | `number` | — | Opacity percentage applied to the outline color. |
| `--m3e-theme-icon-shape` | `length` | `--radius-*` | Border radius of the icon container. |
| `--m3e-theme-icon-size` | `length` | — | Size of the theme icon. |

## `m3e-timepicker`

Presents a time picker on a temporary surface.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-timepicker-actions-space` | `length` | — | Space above the action buttons. |
| `--m3e-timepicker-container-color` | `color` | `--color-*` | Background color of the picker container. |
| `--m3e-timepicker-container-elevation` | `*` | `--shadow-*` | Box shadow / elevation of the picker container. |
| `--m3e-timepicker-container-padding-block` | `length` | — | Block padding inside the picker container. |
| `--m3e-timepicker-container-padding-inline` | `length` | — | Inline padding inside the picker container. |
| `--m3e-timepicker-dial-center-size` | `length` | — | Size of the dial center. |
| `--m3e-timepicker-dial-container-color` | `color` | `--color-*` | Background color of the dial container. |
| `--m3e-timepicker-dial-container-shape` | `length` | `--radius-*` | Corner radius of the dial container. |
| `--m3e-timepicker-dial-container-size` | `length` | — | Size of the dial container. |
| `--m3e-timepicker-dial-dial-inset` | `length` | — | Inset applied to the handle area. |
| `--m3e-timepicker-dial-handle-center-size` | `length` | — | Size of the handle center indicator. |
| `--m3e-timepicker-dial-handle-color` | `color` | `--color-*` | Color of the active handle. |
| `--m3e-timepicker-dial-handle-disabled-color` | `color` | `--color-*` | Color of a disabled handle. |
| `--m3e-timepicker-dial-handle-disabled-opacity` | `number` | — | Opacity of a disabled handle. |
| `--m3e-timepicker-dial-handle-size` | `length` | — | Size of the handle. |
| `--m3e-timepicker-dial-inner-numeral-font-size` | `length` | `--text-*` | Font size of the inner numerals. |
| `--m3e-timepicker-dial-inner-numeral-font-weight` | `number` | `--font-weight-*` | Font weight of the inner numerals. |
| `--m3e-timepicker-dial-inner-numeral-line-height` | `length` | `--leading-*` | Line height of the inner numerals. |
| `--m3e-timepicker-dial-inner-numeral-tracking` | `length` | `--tracking-*` | Letter spacing of the inner numerals. |
| `--m3e-timepicker-dial-inset` | `length` | — | Inset offset applied to the dial surface. |
| `--m3e-timepicker-dial-numeral-active-color` | `color` | `--color-*` | Color of active numerals. |
| `--m3e-timepicker-dial-numeral-color` | `color` | `--color-*` | Text color of inactive numerals. |
| `--m3e-timepicker-dial-numeral-disabled-color` | `color` | `--color-*` | Color of disabled numerals. |
| `--m3e-timepicker-dial-numeral-disabled-opacity` | `number` | — | Opacity of disabled numerals. |
| `--m3e-timepicker-dial-numeral-font-size` | `length` | `--text-*` | Font size of the outer numerals. |
| `--m3e-timepicker-dial-numeral-font-weight` | `number` | `--font-weight-*` | Font weight of the outer numerals. |
| `--m3e-timepicker-dial-numeral-line-height` | `length` | `--leading-*` | Line height of the outer numerals. |
| `--m3e-timepicker-dial-numeral-shape` | `length` | `--radius-*` | Corner radius of the numerals. |
| `--m3e-timepicker-dial-numeral-size` | `length` | — | Size of the dial numerals. |
| `--m3e-timepicker-dial-numeral-tracking` | `length` | `--tracking-*` | Letter spacing of the outer numerals. |
| `--m3e-timepicker-docked-container-color` | `color` | `--color-*` | Background color of the docked picker container. |
| `--m3e-timepicker-docked-container-shape` | `length` | `--radius-*` | Border radius of the docked picker container. |
| `--m3e-timepicker-headline-color` | `color` | `--color-*` | Color of the headline. |
| `--m3e-timepicker-headline-font-size` | `length` | `--text-*` | Font size of the headline. |
| `--m3e-timepicker-headline-font-weight` | `number` | `--font-weight-*` | Font weight of the headline. |
| `--m3e-timepicker-headline-line-height` | `length` | `--leading-*` | Line height of the headline. |
| `--m3e-timepicker-headline-top-space` | `length` | — | Top margin above the headline. |
| `--m3e-timepicker-headline-tracking` | `length` | `--tracking-*` | Letter spacing of the headline. |
| `--m3e-timepicker-horizontal-input-dial-space` | `length` | — | Space between the input and dial in horizontal orientation. |
| `--m3e-timepicker-input-field-container-shape` | `length` | `--radius-*` | Corner radius of the input field container. |
| `--m3e-timepicker-input-field-container-width` | `length` | — | Width of the input field container. |
| `--m3e-timepicker-input-field-font-size` | `length` | `--text-*` | Font size of the input field text. |
| `--m3e-timepicker-input-field-font-weight` | `number` | `--font-weight-*` | Font weight of the input field text. |
| `--m3e-timepicker-input-field-height` | `length` | — | Height of the input fields. |
| `--m3e-timepicker-input-field-invalid-container-color` | `color` | `--color-*` | Background color of invalid input fields. |
| `--m3e-timepicker-input-field-invalid-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus for invalid input fields. |
| `--m3e-timepicker-input-field-invalid-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover for invalid input fields. |
| `--m3e-timepicker-input-field-invalid-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed for invalid input fields. |
| `--m3e-timepicker-input-field-label-invalid-color` | `color` | `--color-*` | Text color of invalid input field labels. |
| `--m3e-timepicker-input-field-label-selected-color` | `color` | `--color-*` | Text color of selected input field labels. |
| `--m3e-timepicker-input-field-label-unselected-color` | `color` | `--color-*` | Text color of unselected input field labels. |
| `--m3e-timepicker-input-field-line-height` | `length` | `--leading-*` | Line height of the input field text. |
| `--m3e-timepicker-input-field-selected-container-color` | `color` | `--color-*` | Background color of selected input fields. |
| `--m3e-timepicker-input-field-selected-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus for selected input fields. |
| `--m3e-timepicker-input-field-selected-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover for selected input fields. |
| `--m3e-timepicker-input-field-selected-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed for selected input fields. |
| `--m3e-timepicker-input-field-separator-color` | `color` | `--color-*` | Color of the field separator. |
| `--m3e-timepicker-input-field-separator-font-size` | `length` | `--text-*` | Font size of the field separator. |
| `--m3e-timepicker-input-field-separator-font-weight` | `number` | `--font-weight-*` | Font weight of the field separator. |
| `--m3e-timepicker-input-field-separator-tracking` | `length` | `--tracking-*` | Letter spacing of the field separator. |
| `--m3e-timepicker-input-field-separator-width` | `length` | — | Width of the field separator. |
| `--m3e-timepicker-input-field-supporting-text-color` | `color` | `--color-*` | Text color of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-font-size` | `length` | `--text-*` | Font size of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-line-height` | `length` | `--leading-*` | Line height of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing of supporting labels. |
| `--m3e-timepicker-input-field-tracking` | `length` | `--tracking-*` | Letter spacing of the input field text. |
| `--m3e-timepicker-input-field-unselected-container-color` | `color` | `--color-*` | Background color of unselected input fields. |
| `--m3e-timepicker-input-field-unselected-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus for unselected input fields. |
| `--m3e-timepicker-input-field-unselected-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover for unselected input fields. |
| `--m3e-timepicker-input-field-unselected-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed for unselected input fields. |
| `--m3e-timepicker-input-horizontal-period-toggle-space` | `length` | — | Space between the fields and period toggle in horizontal orientation. |
| `--m3e-timepicker-input-vertical-period-toggle-space` | `length` | — | Space between the fields and period toggle in vertical orientation. |
| `--m3e-timepicker-label-input-space` | `length` | — | Space between Label and the input. |
| `--m3e-timepicker-modal-container-color` | `color` | `--color-*` | Background color of the modal picker container. |
| `--m3e-timepicker-modal-container-shape` | `length` | `--radius-*` | Border radius of the modal picker container. |
| `--m3e-timepicker-vertical-input-dial-space` | `length` | — | Space between the input and dial in vertical orientation. |

## `m3e-timepicker-dial`

A clock‑face surface for selecting hours and minutes using a movable hand.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-timepicker-dial-center-size` | `length` | — | Size of the dial center. |
| `--m3e-timepicker-dial-container-color` | `color` | `--color-*` | Background color of the dial container. |
| `--m3e-timepicker-dial-container-shape` | `length` | `--radius-*` | Corner radius of the dial container. |
| `--m3e-timepicker-dial-container-size` | `length` | — | Size of the dial container. |
| `--m3e-timepicker-dial-dial-inset` | `length` | — | Inset applied to the handle area. |
| `--m3e-timepicker-dial-handle-center-size` | `length` | — | Size of the handle center indicator. |
| `--m3e-timepicker-dial-handle-color` | `color` | `--color-*` | Color of the active handle. |
| `--m3e-timepicker-dial-handle-disabled-color` | `color` | `--color-*` | Color of a disabled handle. |
| `--m3e-timepicker-dial-handle-disabled-opacity` | `number` | — | Opacity of a disabled handle. |
| `--m3e-timepicker-dial-handle-size` | `length` | — | Size of the handle. |
| `--m3e-timepicker-dial-inner-numeral-font-size` | `length` | `--text-*` | Font size of the inner numerals. |
| `--m3e-timepicker-dial-inner-numeral-font-weight` | `number` | `--font-weight-*` | Font weight of the inner numerals. |
| `--m3e-timepicker-dial-inner-numeral-line-height` | `length` | `--leading-*` | Line height of the inner numerals. |
| `--m3e-timepicker-dial-inner-numeral-tracking` | `length` | `--tracking-*` | Letter spacing of the inner numerals. |
| `--m3e-timepicker-dial-inset` | `length` | — | Inset offset applied to the dial surface. |
| `--m3e-timepicker-dial-numeral-active-color` | `color` | `--color-*` | Color of active numerals. |
| `--m3e-timepicker-dial-numeral-color` | `color` | `--color-*` | Text color of inactive numerals. |
| `--m3e-timepicker-dial-numeral-disabled-color` | `color` | `--color-*` | Color of disabled numerals. |
| `--m3e-timepicker-dial-numeral-disabled-opacity` | `number` | — | Opacity of disabled numerals. |
| `--m3e-timepicker-dial-numeral-font-size` | `length` | `--text-*` | Font size of the outer numerals. |
| `--m3e-timepicker-dial-numeral-font-weight` | `number` | `--font-weight-*` | Font weight of the outer numerals. |
| `--m3e-timepicker-dial-numeral-line-height` | `length` | `--leading-*` | Line height of the outer numerals. |
| `--m3e-timepicker-dial-numeral-shape` | `length` | `--radius-*` | Corner radius of the numerals. |
| `--m3e-timepicker-dial-numeral-size` | `length` | — | Size of the dial numerals. |
| `--m3e-timepicker-dial-numeral-tracking` | `length` | `--tracking-*` | Letter spacing of the outer numerals. |

## `m3e-timepicker-input`

A keyboard‑based time surface for choosing hours and minutes.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-timepicker-input-field-container-shape` | `length` | `--radius-*` | Corner radius of the input field container. |
| `--m3e-timepicker-input-field-container-width` | `length` | — | Width of the input field container. |
| `--m3e-timepicker-input-field-font-size` | `length` | `--text-*` | Font size of the input field text. |
| `--m3e-timepicker-input-field-font-weight` | `number` | `--font-weight-*` | Font weight of the input field text. |
| `--m3e-timepicker-input-field-height` | `length` | — | Height of the input fields. |
| `--m3e-timepicker-input-field-invalid-container-color` | `color` | `--color-*` | Background color of invalid input fields. |
| `--m3e-timepicker-input-field-invalid-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus for invalid input fields. |
| `--m3e-timepicker-input-field-invalid-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover for invalid input fields. |
| `--m3e-timepicker-input-field-invalid-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed for invalid input fields. |
| `--m3e-timepicker-input-field-label-invalid-color` | `color` | `--color-*` | Text color of invalid input field labels. |
| `--m3e-timepicker-input-field-label-selected-color` | `color` | `--color-*` | Text color of selected input field labels. |
| `--m3e-timepicker-input-field-label-unselected-color` | `color` | `--color-*` | Text color of unselected input field labels. |
| `--m3e-timepicker-input-field-line-height` | `length` | `--leading-*` | Line height of the input field text. |
| `--m3e-timepicker-input-field-selected-container-color` | `color` | `--color-*` | Background color of selected input fields. |
| `--m3e-timepicker-input-field-selected-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus for selected input fields. |
| `--m3e-timepicker-input-field-selected-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover for selected input fields. |
| `--m3e-timepicker-input-field-selected-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed for selected input fields. |
| `--m3e-timepicker-input-field-separator-color` | `color` | `--color-*` | Color of the field separator. |
| `--m3e-timepicker-input-field-separator-font-size` | `length` | `--text-*` | Font size of the field separator. |
| `--m3e-timepicker-input-field-separator-font-weight` | `number` | `--font-weight-*` | Font weight of the field separator. |
| `--m3e-timepicker-input-field-separator-tracking` | `length` | `--tracking-*` | Letter spacing of the field separator. |
| `--m3e-timepicker-input-field-separator-width` | `length` | — | Width of the field separator. |
| `--m3e-timepicker-input-field-supporting-text-color` | `color` | `--color-*` | Text color of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-font-size` | `length` | `--text-*` | Font size of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-line-height` | `length` | `--leading-*` | Line height of supporting labels. |
| `--m3e-timepicker-input-field-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing of supporting labels. |
| `--m3e-timepicker-input-field-tracking` | `length` | `--tracking-*` | Letter spacing of the input field text. |
| `--m3e-timepicker-input-field-unselected-container-color` | `color` | `--color-*` | Background color of unselected input fields. |
| `--m3e-timepicker-input-field-unselected-focus-state-layer-color` | `color` | `--color-*` | State layer color on focus for unselected input fields. |
| `--m3e-timepicker-input-field-unselected-hover-state-layer-color` | `color` | `--color-*` | State layer color on hover for unselected input fields. |
| `--m3e-timepicker-input-field-unselected-pressed-state-layer-color` | `color` | `--color-*` | State layer color on pressed for unselected input fields. |
| `--m3e-timepicker-input-horizontal-period-toggle-space` | `length` | — | Space between the fields and period toggle in horizontal orientation. |
| `--m3e-timepicker-input-vertical-period-toggle-space` | `length` | — | Space between the fields and period toggle in vertical orientation. |

## `m3e-toc`

A table of contents that provides in-page scroll navigation.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-toc-active-indicator-animation-duration` | `time` | `--transition-duration-*` | Animation duration for the active indicator. |
| `--m3e-toc-active-indicator-color` | `color` | `--color-*` | Border color of the active indicator. |
| `--m3e-toc-container-color` | `color` | `--color-*` | Background color of the table of contents container. |
| `--m3e-toc-container-padding-block` | `length` | — | Block padding of the table of contents container. |
| `--m3e-toc-container-padding-inline` | `length` | — | Inline padding of the table of contents container. |
| `--m3e-toc-header-space` | `length` | — | Block space below and between header elements. |
| `--m3e-toc-item-padding` | `length` | — | Inline padding for TOC items and header. |
| `--m3e-toc-item-shape` | `length` | `--radius-*` | Border radius of TOC items and active indicator. |
| `--m3e-toc-overline-color` | `color` | `--color-*` | Text color for the overline slot. |
| `--m3e-toc-overline-font-size` | `length` | `--text-*` | Font size for the overline slot. |
| `--m3e-toc-overline-font-weight` | `number` | `--font-weight-*` | Font weight for the overline slot. |
| `--m3e-toc-overline-line-height` | `length` | `--leading-*` | Line height for the overline slot. |
| `--m3e-toc-overline-tracking` | `length` | `--tracking-*` | Letter spacing for the overline slot. |
| `--m3e-toc-title-color` | `color` | `--color-*` | Text color for the title slot. |
| `--m3e-toc-title-font-size` | `length` | `--text-*` | Font size for the title slot. |
| `--m3e-toc-title-font-weight` | `number` | `--font-weight-*` | Font weight for the title slot. |
| `--m3e-toc-title-line-height` | `length` | `--leading-*` | Line height for the title slot. |
| `--m3e-toc-title-tracking` | `length` | `--tracking-*` | Letter spacing for the title slot. |
| `--m3e-toc-width` | `length` | — | Width of the table of contents. |

## `m3e-toc-item`

An item in a table of contents.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-toc-active-indicator-animation-duration` | `time` | `--transition-duration-*` | Animation duration for the active indicator. |
| `--m3e-toc-item-color` | `color` | `--color-*` | Text color for unselected items. |
| `--m3e-toc-item-font-size` | `length` | `--text-*` | Font size for unselected items. |
| `--m3e-toc-item-font-weight` | `number` | `--font-weight-*` | Font weight for unselected items. |
| `--m3e-toc-item-inset` | `length` | — | Indentation per level for the TOC item. |
| `--m3e-toc-item-line-height` | `length` | `--leading-*` | Line height for unselected items. |
| `--m3e-toc-item-padding` | `length` | — | Inline padding for the TOC item. |
| `--m3e-toc-item-padding-block` | `length` | — | Block padding for the TOC item. |
| `--m3e-toc-item-selected-color` | `color` | `--color-*` | Text color for selected items. |
| `--m3e-toc-item-selected-font-size` | `length` | `--text-*` | Font size for selected items. |
| `--m3e-toc-item-selected-font-weight` | `number` | `--font-weight-*` | Font weight for selected items. |
| `--m3e-toc-item-selected-line-height` | `length` | `--leading-*` | Line height for selected items. |
| `--m3e-toc-item-selected-tracking` | `length` | `--tracking-*` | Letter spacing for selected items. |
| `--m3e-toc-item-shape` | `length` | `--radius-*` | Border radius of the TOC item. |
| `--m3e-toc-item-tracking` | `length` | `--tracking-*` | Letter spacing for unselected items. |

## `m3e-toolbar`

Presents frequently used actions relevant to the current page.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-toolbar-rounded-bottom-space` | `length` | — | Bottom space for rounded shape. |
| `--m3e-toolbar-rounded-leading-space` | `length` | — | Leading space for rounded shape. |
| `--m3e-toolbar-rounded-shape` | `length` | `--radius-*` | Border radius for rounded shape. |
| `--m3e-toolbar-rounded-top-space` | `length` | — | Top space for rounded shape. |
| `--m3e-toolbar-rounded-trailing-space` | `length` | — | Trailing space for rounded shape. |
| `--m3e-toolbar-size` | `length` | — | The size (height or width) of the toolbar. |
| `--m3e-toolbar-spacing` | `length` | — | The gap between toolbar items. |
| `--m3e-toolbar-square-bottom-space` | `length` | — | Bottom space for square shape. |
| `--m3e-toolbar-square-leading-space` | `length` | — | Leading space for square shape. |
| `--m3e-toolbar-square-top-space` | `length` | — | Top space for square shape. |
| `--m3e-toolbar-square-trailing-space` | `length` | — | Trailing space for square shape. |
| `--m3e-toolbar-standard-color` | `color` | `--color-*` | Foreground color for the standard variant. |
| `--m3e-toolbar-standard-container-color` | `color` | `--color-*` | Container color for the standard variant. |
| `--m3e-toolbar-vibrant-color` | `color` | `--color-*` | Foreground color for the vibrant variant. |
| `--m3e-toolbar-vibrant-container-color` | `color` | `--color-*` | Container color for the vibrant variant. |

## `m3e-tooltip`

Adds additional context to a button or other UI element.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-tooltip-container-color` | `color` | `--color-*` | Background color of the tooltip. |
| `--m3e-tooltip-max-height` | `length` | — | Maximum height of the tooltip. |
| `--m3e-tooltip-max-width` | `length` | — | Maximum width of the tooltip. |
| `--m3e-tooltip-min-height` | `length` | — | Minimum height of the tooltip container. |
| `--m3e-tooltip-min-width` | `length` | — | Minimum width of the tooltip. |
| `--m3e-tooltip-padding` | `length` | — | Internal spacing of the tooltip container. |
| `--m3e-tooltip-shape` | `length` | `--radius-*` | Border radius of the tooltip container. |
| `--m3e-tooltip-supporting-text-color` | `color` | `--color-*` | Text color of supporting text. |
| `--m3e-tooltip-supporting-text-font-size` | `length` | `--text-*` | Font size of supporting text. |
| `--m3e-tooltip-supporting-text-font-weight` | `number` | `--font-weight-*` | Font weight of supporting text. |
| `--m3e-tooltip-supporting-text-line-height` | `length` | `--leading-*` | Line height of supporting text. |
| `--m3e-tooltip-supporting-text-tracking` | `length` | `--tracking-*` | Letter spacing of supporting text. |

## `m3e-tree`

Presents hierarchical data in a tree structure.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-tree-scrollbar-color` | `color` | `--color-*` | Color of the tree scrollbar. |
| `--m3e-tree-scrollbar-width` | `length` | — | Width of the tree scrollbar. |

## `m3e-tree-item`

An expandable item in a tree.

| Var | Type | Theme namespace | Description |
|---|---|---|---|
| `--m3e-tree-item-bottom-space` | `length` | — | Bottom space for the item. |
| `--m3e-tree-item-checkbox-label-space` | `length` | — | Space between checkbox and label. |
| `--m3e-tree-item-disabled-color` | `color` | `--color-*` | Text color for disabled item. |
| `--m3e-tree-item-disabled-color-opacity` | `number` | — | Opacity for disabled item text color. |
| `--m3e-tree-item-font-size` | `length` | `--text-*` | Font size for the item label. |
| `--m3e-tree-item-font-weight` | `number` | `--font-weight-*` | Font weight for the item label. |
| `--m3e-tree-item-height` | `length` | — | Height of the item. |
| `--m3e-tree-item-icon-label-space` | `length` | — | Space between icon and label. |
| `--m3e-tree-item-icon-size` | `length` | — | Size of the icon. |
| `--m3e-tree-item-inset` | `length` | — | Indentation for nested items. |
| `--m3e-tree-item-label-color` | `color` | `--color-*` | Text color for the item label. |
| `--m3e-tree-item-leading-space` | `length` | — | Leading space for the item. |
| `--m3e-tree-item-line-height` | `length` | `--leading-*` | Line height for the item label. |
| `--m3e-tree-item-selected-container-color` | `color` | `--color-*` | Background color for selected item. |
| `--m3e-tree-item-selected-container-focus-color` | `color` | `--color-*` | Focus color for selected item container. |
| `--m3e-tree-item-selected-container-hover-color` | `color` | `--color-*` | Hover color for selected item container. |
| `--m3e-tree-item-selected-label-color` | `color` | `--color-*` | Text color for selected item label. |
| `--m3e-tree-item-selected-ripple-color` | `color` | `--color-*` | Ripple color for selected item. |
| `--m3e-tree-item-shape` | `length` | `--radius-*` | Border radius of the item and focus ring. |
| `--m3e-tree-item-toggle-label-space` | `length` | — | Space between toggle and label. |
| `--m3e-tree-item-top-space` | `length` | — | Top space for the item. |
| `--m3e-tree-item-tracking` | `length` | `--tracking-*` | Letter spacing for the item label. |
| `--m3e-tree-item-trailing-space` | `length` | — | Trailing space for the item. |
| `--m3e-tree-item-unselected-container-focus-color` | `color` | `--color-*` | Focus color for unselected item container. |
| `--m3e-tree-item-unselected-container-hover-color` | `color` | `--color-*` | Hover color for unselected item container. |
| `--m3e-tree-item-unselected-ripple-color` | `color` | `--color-*` | Ripple color for unselected item. |
