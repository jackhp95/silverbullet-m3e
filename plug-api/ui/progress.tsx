import { cx } from "./cx.ts";
import "./m3e-jsx.d.ts";

// Deliberately NOT a top-level `import "@m3e/web/progress-indicator"` here —
// same reason as button.tsx: this module is reachable from plug FUNCTION
// code (no DOM) via the package barrel, so every real DOM-side consumer of
// `Progress` must self-import `@m3e/web/progress-indicator`.

export type ProgressProps = {
  /** 0..1 */
  value: number;
  class?: string;
};

export function Progress({ value, class: extra }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <m3e-linear-progress-indicator
      class={cx("sb-progress", extra)}
      value={pct}
      max={100}
    ></m3e-linear-progress-indicator>
  );
}
