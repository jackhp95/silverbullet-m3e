import { expect, test, vi } from "vitest";
import { render } from "preact-render-to-string";
import { FloatingToolbar } from "./floating_toolbar.tsx";

// This repo's e2e suite (e2e/*.test.ts, Playwright) has no pattern for
// mounting a single component in isolation — every fixture in e2e/fixtures.ts
// boots the full SilverBullet server + app shell (`sbServer`/`sbPage`) and
// navigates a real page. `floating_toolbar.tsx` is intentionally NOT wired
// into `client/editor_ui.tsx` yet (that's leaf V8, a later, separate
// worktree, per docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-
// spec.md §5 P2) — so a real `sbPage` would never render `.sb-floating-
// toolbar` at all, and an e2e test against it would just assert on an empty
// page. Rather than write a Playwright test that can't pass (or silently
// skip coverage), this is a direct component-level render test: it calls
// `FloatingToolbar(...)` as a plain function (a Preact function component is
// just that) and inspects the returned vnode tree / its `preact-render-to-
// string` output. `e2e/floating-toolbar.test.ts` carries a `test.fixme`
// stub recording the real e2e assertions for V9 (full e2e reconciliation,
// once V8 wires this component into the live app) to fill in.

test("renders exactly 4 icon-buttons, in order Search/Navigation/Journal/Notifications", () => {
  const vnode = FloatingToolbar({
    onSearchClick: () => {},
    onNavigationClick: () => {},
    journal: { available: true, onClick: () => {} },
    notifications: { iconName: "notifications", onClick: () => {} },
  });

  expect(vnode.type).toBe("m3e-toolbar");
  const buttons = ([] as unknown[]).concat(vnode.props.children as never);
  expect(buttons).toHaveLength(4);

  const labels = buttons.map((b: any) => b.props["aria-label"]);
  expect(labels).toEqual(["Search", "Navigation", "Journal", "Notifications"]);

  const titles = buttons.map((b: any) => b.props.title);
  expect(titles).toEqual(["Search", "Navigation", "Journal", "Notifications"]);
});

test("each button's slotted m3e-icon carries the expected, glyph-verified icon name", () => {
  // "search"/"edit_calendar" were already proven live elsewhere in this
  // fork; "explore" was newly verified for this leaf by decompiling
  // client/fonts/MaterialSymbolsOutlined.woff2 with fontTools (ttx) and
  // confirming a real GlyphID/hmtx/cmap(0xe87a)/TTGlyph/post entry exists —
  // not a tofu/missing glyph. Notifications' icon is caller-supplied
  // (notificationsIconFor() in client/lib/push_ui.ts), asserted dynamic here.
  const vnode = FloatingToolbar({
    onSearchClick: () => {},
    onNavigationClick: () => {},
    journal: { available: true, onClick: () => {} },
    notifications: { iconName: "notifications_active", onClick: () => {} },
  });

  const buttons = vnode.props.children as any[];
  const iconNames = buttons.map((b) => b.props.children.props.name);
  expect(iconNames).toEqual([
    "search",
    "explore",
    "edit_calendar",
    "notifications_active",
  ]);
});

test("clicking Search/Navigation/Notifications calls the matching handler and prevents default", () => {
  const onSearchClick = vi.fn();
  const onNavigationClick = vi.fn();
  const notificationsOnClick = vi.fn();
  const vnode = FloatingToolbar({
    onSearchClick,
    onNavigationClick,
    journal: { available: true, onClick: () => {} },
    notifications: { iconName: "notifications", onClick: notificationsOnClick },
  });
  const [searchBtn, navBtn, , notifBtn] = vnode.props.children as any[];

  const fakeEvent = { preventDefault: vi.fn() } as unknown as MouseEvent;
  searchBtn.props.onClick(fakeEvent);
  navBtn.props.onClick(fakeEvent);
  notifBtn.props.onClick(fakeEvent);

  expect(onSearchClick).toHaveBeenCalledOnce();
  expect(onNavigationClick).toHaveBeenCalledOnce();
  expect(notificationsOnClick).toHaveBeenCalledOnce();
  expect((fakeEvent.preventDefault as ReturnType<typeof vi.fn>))
    .toHaveBeenCalledTimes(3);
});

test("Journal button: disabled-interactive + onClick reflect journal.available", () => {
  const onClick = vi.fn();

  const available = FloatingToolbar({
    onSearchClick: () => {},
    onNavigationClick: () => {},
    journal: { available: true, onClick },
    notifications: { iconName: "notifications", onClick: () => {} },
  });
  const journalBtnAvailable = (available.props.children as any[])[2];
  expect(journalBtnAvailable.props["disabled-interactive"]).toBe(false);
  journalBtnAvailable.props.onClick({ preventDefault: () => {} } as MouseEvent);
  expect(onClick).toHaveBeenCalledOnce();

  const unavailable = FloatingToolbar({
    onSearchClick: () => {},
    onNavigationClick: () => {},
    journal: { available: false, onClick },
    notifications: { iconName: "notifications", onClick: () => {} },
  });
  const journalBtnUnavailable = (unavailable.props.children as any[])[2];
  expect(journalBtnUnavailable.props["disabled-interactive"]).toBe(true);
  expect(journalBtnUnavailable.props.onClick).toBeUndefined();
});

test("renders to a real (non-empty, non-tofu) HTML string via preact-render-to-string", () => {
  const html = render(
    FloatingToolbar({
      onSearchClick: () => {},
      onNavigationClick: () => {},
      journal: { available: true, onClick: () => {} },
      notifications: { iconName: "notifications", onClick: () => {} },
    }),
  );

  expect(html).toContain('class="sb-floating-toolbar"');
  expect(html).toContain('<m3e-icon name="search">');
  expect(html).toContain('<m3e-icon name="explore">');
  expect(html).toContain('<m3e-icon name="edit_calendar">');
  expect(html).toContain('<m3e-icon name="notifications">');
});
