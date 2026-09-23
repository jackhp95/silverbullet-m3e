import type { ComponentChildren } from "preact";
import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/snackbar"` here — same
// reason as button.tsx/badge.tsx: reachable from plug FUNCTION code (no
// DOM), so every real DOM-side consumer self-imports it.
//
// Migrated from a bare `<div class="sb-alert">` to `m3e-snackbar`'s
// DECLARATIVE API (SnackbarElement.d.ts — an `open`/`dismissible`/`duration`
// attribute surface, as opposed to editor_ui.tsx's IMPERATIVE
// `M3eSnackbar.open()` global) per Jack's standing instruction. `variant` has
// no snackbar equivalent (SnackbarElement.d.ts has no severity/color attr at
// all — same finding editor_ui.tsx's `SEVERITY_CONTAINER_COLOR` already
// documented for the imperative path): mapped onto the one real styling seam,
// `--m3e-snackbar-container-color`, against the matching M3 system-color
// token. "info" stays the library's own neutral default (undefined).
//
// FLAGGED, not silently done: every current `.sb-alert` consumer —
// client/spaces_ui/components/{App,LoginForm,SpaceList,SpaceEditor,
// SpaceForm,UsersView}.tsx + client/spaces_ui/space_fields.tsx (12 call
// sites) AND plugs/configuration-manager/ui/components/{app,libraries_tab}
// .tsx (2 more, `grep -rln "<Alert" client plugs`) — renders it as a
// PERSISTENT INLINE banner gated on component error state
// (`{error && <Alert>}` / `if (error) return <Alert>`), not a one-shot
// toast — the exact semantic mismatch this file's own migration task called
// out to watch for. `m3e-snackbar` is real Material "short updates ... at
// the bottom of the screen" (SnackbarElement.d.ts's own doc comment):
// fixed-position (`:host { position: fixed }`, decompiled snackbar.js — DOM
// placement doesn't matter, it always renders at the viewport's bottom
// edge), so every one of these moves from an INLINE banner sitting next to
// the field/section it's about to a floating bottom-of-screen overlay.
// `duration={0}` (real, documented: SnackbarElement's own duration handling
// — decompiled snackbar.js's `if (this.duration > 0) setTimeout(...)` — a
// duration of exactly 0 sets no auto-dismiss timer at all) preserves the
// original's PERSISTENCE: it does not vanish on a timer while the
// underlying error is still true, matching `.sb-alert`.
//
// Deliberately NOT `dismissible`: the component's own close button has no
// way to route back to the CALLER's error state (Alert takes no
// `onDismiss`), so it would only ever hide the snackbar VISUALLY while
// `error` stayed truthy in the parent — the next unrelated re-render would
// silently reopen it, a confusing half-working affordance. Worse,
// `plugs/configuration-manager/ui/components/app.tsx` (~line 72) and
// `libraries_tab.tsx` (~line 95) already pass their OWN dismiss button as a
// CHILD of `<Alert>`, wired to a real `dismissError` callback — adding the
// snackbar's native dismiss on top would have shipped two close affordances
// side by side, one that actually works and one that doesn't.
//
// NOT mitigated, and worth Jack's eyes before this ships further: (1) the
// POSITION change itself (inline -> fixed overlay) loses the visual
// association with the field/section the error is about; (2) `.supporting-
// text` (decompiled snackbar.js) is a hard `-webkit-line-clamp: 2` — the
// old `<div>` had no length limit, and `space_fields.tsx`'s per-field
// validation-error loop can plausibly produce longer messages; (3)
// `M3eSnackbarElement` is a hard singleton (`__current`, `_handleBeforeToggle`
// force-closes whatever else is open) — `SpaceForm.tsx` conditionally
// renders BOTH an error and a warning `<Alert>` in the same view, and only
// one snackbar can ever be visibly open at once, so simultaneous
// error+warning would silently drop one.

export type AlertVariant = "error" | "warning" | "info";

// Same mapping shape as editor_ui.tsx's SEVERITY_CONTAINER_COLOR, kept as an
// independent copy here rather than a shared import: plug-api is published
// standalone (`@silverbulletmd/silverbullet/ui`) and must not reach into the
// app's client/ source tree (same boundary m3e-jsx.d.ts's file header
// documents).
const VARIANT_CONTAINER_COLOR: Record<AlertVariant, string | undefined> = {
  info: undefined,
  warning: "var(--md-sys-color-tertiary)",
  error: "var(--md-sys-color-error)",
};

export type AlertProps = {
  variant: AlertVariant;
  class?: string;
  children?: ComponentChildren;
};

export function Alert({ variant, class: extra, children }: AlertProps) {
  const containerColor = VARIANT_CONTAINER_COLOR[variant];
  return (
    <m3e-snackbar
      class={cx("sb-alert", `sb-alert-${variant}`, extra)}
      open
      duration={0}
      style={containerColor
        ? { "--m3e-snackbar-container-color": containerColor }
        : undefined}
    >
      {children}
    </m3e-snackbar>
  );
}
