import type { ComponentChildren } from "preact";
import { cx } from "./cx.ts";

// DEFERRED (2026-09-23, m3e-fork reconciliation slice 6b): a fork commit
// (4cfc3763) swaps this to `m3e-snackbar`, and its own header comment already
// flagged the semantic mismatch — every real `.sb-alert` consumer renders
// this as a PERSISTENT INLINE banner gated on error/warning state, not a
// one-shot toast. Landing it anyway surfaced a concrete, reproducible,
// non-flaky break, not just a style regression: `m3e-snackbar` renders via
// the native Popover API (`popover="manual"`, confirmed in
// node_modules/@m3e/web/dist/snackbar.js), which promotes it to the
// document's top layer regardless of where it sits in the DOM tree — no CSS
// override exists anywhere in this repo to pin it back into normal flow.
// Concretely, `GitSyncPage.tsx`'s always-inline "Uses the server's existing
// Git credentials..." info alert ends up floating over the "Check
// connection" button below it, permanently intercepting its clicks
// (e2e/flows/git.test.ts's connect-and-pull flow times out at 120s retrying
// a click Playwright reports as blocked by exactly that element). This is a
// real product decision — inline-banner semantics vs. toast semantics, and
// if the latter, an app-wide re-layout of every current `.sb-alert` call
// site — not a registration-wiring gap, so it's left for Jack rather than
// forced. See client/spaces_ui/spaces.tsx / central.tsx / auth.tsx for the
// matching "no `@m3e/web/snackbar` import here" notes.

export type AlertVariant = "error" | "warning" | "info";

export type AlertProps = {
  variant: AlertVariant;
  class?: string;
  children?: ComponentChildren;
};

export function Alert({ variant, class: extra, children }: AlertProps) {
  return (
    <div class={cx("sb-alert", `sb-alert-${variant}`, extra)}>{children}</div>
  );
}
