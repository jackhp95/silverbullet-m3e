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

// The sheet's header title is the ACTIVE-SECTION indicator now that the
// switcher is icon-only, so it reads "History" (the default section) rather
// than a static "Navigation".
test("renders a modal, handle+hideable bottom sheet titled by the active section", () => {
  const html = renderSheet({});
  expect(html).toContain("<m3e-bottom-sheet");
  expect(html).toContain('id="sb-navigation-sheet"');
  expect(html).toMatch(/\bmodal(="[^"]*")?[ >]/);
  expect(html).toMatch(/\bhandle(="[^"]*")?[ >]/);
  expect(html).toMatch(/\bhideable(="[^"]*")?[ >]/);
  expect(html).toContain('<span slot="header">History</span>');
});

// Jack's round-3 direction: the tabs are REPLACED by the same floating
// icon-only toolbar idiom floating_toolbar.tsx uses. This is the load-bearing
// negative assertion for that reversal — if m3e-tabs ever comes back, so does
// the @m3e/web tab-panel visibility bug the V13 workaround existed to paper
// over (see navigation_sheet.tsx's header comment).
test("NO tabs anywhere — the section switcher is a floating m3e-toolbar", () => {
  const html = renderSheet({});
  expect(html).not.toContain("m3e-tabs");
  expect(html).not.toContain("m3e-tab-panel");
  expect(html).not.toContain("<m3e-tab ");
  expect(html).toMatch(
    /<m3e-toolbar[^>]*class="sb-sheet-section-toolbar"/,
  );
  expect(html).toMatch(/<m3e-toolbar[^>]*shape="rounded"/);
  expect(html).toMatch(/<m3e-toolbar[^>]*\belevated(="[^"]*")?[ >]/);
});

test("exactly 3 icon-only switcher buttons, History filled by default", () => {
  const html = renderSheet({
    recentPaths: [{ path: "a.md" as Path, ts: 1 }],
    allPages: [page({ name: "a" })],
  });

  const buttons = [...html.matchAll(/<m3e-icon-button\b[^>]*>/g)].map(
    (m) => m[0],
  );
  expect(buttons).toHaveLength(3);
  expect(buttons[0]).toContain('aria-label="History"');
  expect(buttons[1]).toContain('aria-label="Changelog"');
  expect(buttons[2]).toContain('aria-label="Sitemap"');

  // Only the active (History) button is `variant="filled"`.
  expect(buttons[0]).toContain('variant="filled"');
  expect(buttons[1]).toContain('variant="standard"');
  expect(buttons[2]).toContain('variant="standard"');

  // Icon-ONLY: no section label text is rendered inside the toolbar. The
  // labels survive as `title`/`aria-label` only, which is what makes the
  // header title the sole visible indicator.
  const toolbar = html.slice(html.indexOf("<m3e-toolbar"));
  expect(toolbar).not.toContain(">History<");
  expect(toolbar).not.toContain(">Changelog<");
  expect(toolbar).not.toContain(">Sitemap<");
});

// Only the ACTIVE section is rendered — there is no hidden second panel any
// more, which is precisely why the m3e-tabs visibility bug cannot recur.
test("renders only the default History section, not Changelog/Sitemap content", () => {
  const html = renderSheet({
    recentPaths: [{ path: "recent-page.md" as Path, ts: 1 }],
    allPages: [page({ name: "recent-page" }), page({ name: "other-page" })],
  });

  expect(html).toContain(">recent-page<");
  expect(html).not.toMatch(/<input/);
  // `other-page` is only reachable from the Sitemap section, which is not
  // rendered while History is active.
  expect(html).not.toContain(">other-page<");
});

test("renders to a real (non-empty, non-tofu) HTML string with verified icon names", () => {
  const html = renderSheet({});
  expect(html.length).toBeGreaterThan(0);
  expect(html).toContain('name="history">');
  expect(html).toContain('name="update">');
  expect(html).toContain('name="account_tree">');
});
