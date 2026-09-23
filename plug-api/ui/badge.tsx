import type { ComponentChildren } from "preact";
import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/chips"` here — same reason
// as button.tsx: reachable from plug FUNCTION code (no DOM), so every real
// DOM-side consumer self-imports it (or, for the app's own bundles, relies
// on the browser entry point that already covers it).
//
// `m3e-badge` was the wrong primitive: it's a self-positioning overlay
// indicator anchored via `for` (BadgeElement.d.ts's `position` attribute is
// 8 corner-anchor values, meaningless unanchored) — built for notification
// dots on icons/buttons, not a label sitting in text flow. `m3e-chip` (the
// base, non-interactive one — NOT m3e-assist-chip/filter-chip/input-chip/
// suggestion-chip, which layer on click/remove/selected affordances) is
// exactly "a non-interactive chip used to convey small pieces of
// information" per ChipElement.d.ts — no events, no disabled, no href. Sized
// down to badge-scale via --m3e-chip-* tokens in components.scss.

export type BadgeProps = { class?: string; children?: ComponentChildren };

export function Badge({ class: extra, children }: BadgeProps) {
  return <m3e-chip class={cx("sb-badge", extra)}>{children}</m3e-chip>;
}
