import { test } from "./fixtures.ts";

// The pre-existing version of this file (2026-09-16 toolbar-search-feedback
// spec, leaf L13) tested a since-deleted 4-item toolbar (read-only/search/
// journal/add) that no longer exists — that design was itself superseded by
// the nav-bar redesign (N2 deleted floating_toolbar.tsx outright), which is
// in turn reverted by docs/plans/2026-09-17-vertical-toolbar-search-nav-
// redesign-spec.md (this plan). Both prior versions are stale; there is no
// carry-forward content here.
//
// This plan's `client/components/floating_toolbar.tsx` (leaf V4, spec §2.1)
// is REAL and unit-tested today (see the co-located, currently-passing
// `client/components/floating_toolbar.test.ts` — a Preact render test using
// `preact-render-to-string`, since this repo's e2e fixtures
// (`e2e/fixtures.ts`'s `sbServer`/`sbPage`) only know how to boot the full
// SilverBullet app shell; there is no pattern anywhere in `e2e/` for
// mounting a single component in isolation). But the component is NOT yet
// wired into the live app (`client/editor_ui.tsx` doesn't render it — that's
// leaf V8, a later, separate worktree, per the spec's §5 P2/§5.1). A real
// `sbPage` today has no `.sb-floating-toolbar` in its DOM at all, so any
// assertion here would either vacuously fail or assert on nothing.
//
// `test.fixme` below records the exact live-app assertions this file should
// carry once V8 lands and wires FloatingToolbar into editor_ui.tsx — V9 (e2e
// reconciliation, spec §5 P3) is the leaf responsible for un-skipping these
// (or superseding them, if V8's wiring changes the details) and running them
// for real. Left as `fixme`, not deleted, so the gap stays visible in the
// test runner's summary rather than disappearing silently.

test.describe("Floating toolbar (client/components/floating_toolbar.tsx, V4)", () => {
  test.fixme(
    "renders exactly 4 icon-buttons in .sb-floating-toolbar, in order Search/Navigation/Journal/Notifications, once V8 wires FloatingToolbar into editor_ui.tsx",
    async ({ sbPage }) => {
      const buttons = sbPage.locator(".sb-floating-toolbar m3e-icon-button");
      // Order: Search, Navigation, Journal, Notifications.
      // await expect(buttons).toHaveCount(4);
      // await expect(buttons.nth(0)).toHaveAttribute("aria-label", "Search");
      // await expect(buttons.nth(1)).toHaveAttribute("aria-label", "Navigation");
      // await expect(buttons.nth(2)).toHaveAttribute("aria-label", "Journal");
      // await expect(buttons.nth(3)).toHaveAttribute("aria-label", "Notifications");
      void buttons;
    },
  );

  test.fixme(
    "Search button opens the search sheet (once V6 search_sheet.tsx + V8 wiring land)",
    async ({ sbPage }) => {
      void sbPage;
    },
  );

  test.fixme(
    "Journal button runs \"Journal: Today\" (once V8 wiring lands)",
    async ({ sbPage }) => {
      void sbPage;
    },
  );
});
