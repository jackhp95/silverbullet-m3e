/**
 * Scrolls `#sb-top` (the app bar) into view within its scrolling ancestor,
 * resting the page with the front matter panel hidden above it — the shared
 * "no cached scroll position" default for both cold boot and every
 * subsequent in-app navigation (decision #3,
 * docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md §11).
 *
 * Lives in its own module rather than `editor_ui.tsx` (where the app bar is
 * actually rendered) because its one caller, `content_manager.ts`'s
 * `navigateWithinPage` (§11.1), is a data/content-management layer —
 * importing a view-layer module from there would run the dependency
 * direction (data → domain → view → page, per coding-preferences)
 * backwards.
 *
 * Deferred until the `m3e-*` custom elements the app bar depends on for
 * layout have upgraded (past their pre-upgrade, un-styled placeholder box)
 * and fonts have loaded, plus a settle `requestAnimationFrame` pair —
 * otherwise `scrollIntoView` measures the placeholder's much shorter box and
 * lands short. `scroll-initial-target: nearest` (the pure-CSS alternative)
 * was confirmed unreliable for exactly this reason during this plan's own
 * mockup investigation (§11.2): it resolves once, before upgrade, and never
 * re-resolves.
 *
 * Cheap to call on every navigation, not just cold boot: `whenDefined` on an
 * already-upgraded tag resolves on the very next microtask, and
 * `document.fonts.ready` is already resolved after the first page — so the
 * awaited work here only actually blocks on the first call in a session.
 */
export async function snapToAppBar(topBarId = "sb-top"): Promise<void> {
  await Promise.all([
    customElements.whenDefined("m3e-app-bar"),
    customElements.whenDefined("m3e-breadcrumb"),
    customElements.whenDefined("m3e-icon"),
    document.fonts.ready,
  ]);
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  document.getElementById(topBarId)?.scrollIntoView({
    behavior: "instant",
    block: "start",
  });
}
