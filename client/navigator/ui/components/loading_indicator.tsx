// m3e reskin: the hand-rolled conic-gradient spinner replaced with the
// library's own indeterminate circular indicator (registered by
// client/editor_ui.tsx's `@m3e/web/progress-indicator` import -- this file
// has no `.test.ts` sibling of its own, but lives under client/navigator/,
// several of whose siblings run under vitest's DOM-less `node` environment,
// so it must not self-import the custom-element module at module scope).
// `role="status"`/`aria-label` are plain global ARIA attributes, unaffected
// by the tag swap.
export function LoadingIndicator() {
  return (
    <m3e-circular-progress-indicator
      class="sb-nav-spinner"
      indeterminate
      role="status"
      aria-label="Loading"
    />
  );
}
