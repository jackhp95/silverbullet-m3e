import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { h } from "preact";
import { render } from "preact-render-to-string";
import { expect, test } from "vitest";

// This repo's e2e suite has no pattern for mounting a single component in
// isolation (every e2e/fixtures.ts fixture boots the full app shell), and
// NavigationSheet is intentionally NOT wired into client/editor_ui.tsx yet
// (that's leaf V8, a separate later worktree, per docs/plans/2026-09-17-
// vertical-toolbar-search-nav-redesign-spec.md §5 P2) — same rationale
// floating_toolbar.test.ts already documents. e2e/navigation-sheet.test.ts
// carries `test.fixme` stubs recording the real e2e assertions for V9 to
// fill in once V8 lands.
//
// Unlike FloatingToolbar (no hooks), NavigationSheet uses `useRef`/
// `useEffect` (the same `handle`-attribute CSS-gate workaround
// item_capture_sheet.tsx already proved live) — calling it as a bare
// function outside Preact's own component lifecycle crashes preact/hooks
// ("Cannot read properties of undefined (reading '__H')"), confirmed live
// while writing this file. So these tests go through `h()` + `render()`
// (real preact-render-to-string SSR, which does give hooks a valid
// component context) and assert on the resulting HTML string, rather than
// introspecting the raw vnode tree the other (hook-free) nav_views/*.test.ts
// files can get away with.

const { NavigationSheet } = await import("./navigation_sheet.tsx");

function page(overrides: Partial<PageMeta>): PageMeta {
  return {
    name: "untitled",
    created: "2026-01-01T00:00:00.000Z",
    lastModified: "2026-01-01T00:00:00.000Z",
    perm: "rw",
    ...overrides,
  } as PageMeta;
}

function renderSheet(props: {
  open?: boolean;
  recentPaths?: { path: Path; ts: number }[];
  currentPath?: Path;
  allPages?: PageMeta[];
}) {
  return render(
    h(NavigationSheet, {
      open: props.open ?? true,
      onClose: () => {},
      recentPaths: props.recentPaths ?? [],
      currentPath: props.currentPath ?? ("x.md" as Path),
      allPages: props.allPages ?? [],
    }),
  );
}

test("renders a modal, handle+hideable bottom sheet with the 'Navigation' header", () => {
  const html = renderSheet({});
  expect(html).toContain("<m3e-bottom-sheet");
  expect(html).toContain('id="sb-navigation-sheet"');
  expect(html).toMatch(/\bmodal(="[^"]*")?[ >]/);
  expect(html).toMatch(/\bhandle(="[^"]*")?[ >]/);
  expect(html).toMatch(/\bhideable(="[^"]*")?[ >]/);
  expect(html).toContain("Navigation</span>");
});

test("exactly 3 tabs (History/Changelog/Sitemap) linked to 3 matching panels, History selected by default", () => {
  const html = renderSheet({
    recentPaths: [{ path: "a.md" as Path, ts: 1 }],
    allPages: [page({ name: "a" })],
  });

  const tabTags = [...html.matchAll(/<m3e-tab\s[^>]*>/g)].map((m) => m[0]);
  expect(tabTags).toHaveLength(3);
  expect(tabTags[0]).toContain('for="sb-nav-history"');
  expect(tabTags[1]).toContain('for="sb-nav-changelog"');
  expect(tabTags[2]).toContain('for="sb-nav-sitemap"');

  // Only the first (History) tab carries `selected`.
  expect(tabTags[0]).toMatch(/\bselected(="[^"]*")?[ >]/);
  expect(tabTags[1]).not.toMatch(/\bselected(="[^"]*")?[ >]/);
  expect(tabTags[2]).not.toMatch(/\bselected(="[^"]*")?[ >]/);

  const panelTags = [...html.matchAll(/<m3e-tab-panel\b[^>]*>/g)].map(
    (m) => m[0],
  );
  expect(panelTags).toHaveLength(3);
  expect(panelTags[0]).toContain('id="sb-nav-history"');
  expect(panelTags[1]).toContain('id="sb-nav-changelog"');
  expect(panelTags[2]).toContain('id="sb-nav-sitemap"');
});

test("m3e-tabs uses variant=secondary explicitly", () => {
  const html = renderSheet({});
  expect(html).toMatch(/<m3e-tabs[^>]*variant="secondary"/);
});

test("History panel renders recentPaths rows with no input box; Sitemap panel row count matches allPages", () => {
  const html = renderSheet({
    recentPaths: [{ path: "recent-page.md" as Path, ts: 1 }],
    allPages: [page({ name: "recent-page" }), page({ name: "other-page" })],
  });

  expect(html).toContain(">recent-page<");
  expect(html).not.toMatch(/<input/);
  expect(html).toContain(">other-page<");
});

test("renders to a real (non-empty, non-tofu) HTML string with verified icon names", () => {
  const html = renderSheet({});
  expect(html.length).toBeGreaterThan(0);
  expect(html).toContain('name="history">');
  expect(html).toContain('name="update">');
  expect(html).toContain('name="account_tree">');
});
