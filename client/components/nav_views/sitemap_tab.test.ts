import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { render } from "preact-render-to-string";
import { expect, test, vi } from "vitest";

const navigateToAnythingPickerName = vi.fn();
vi.mock("../anything_picker.tsx", () => ({
  navigateToAnythingPickerName: (...args: unknown[]) =>
    navigateToAnythingPickerName(...args),
}));

const { SitemapTab } = await import("./sitemap_tab.tsx");

function page(overrides: Partial<PageMeta>): PageMeta {
  return {
    name: "untitled",
    created: "2026-01-01T00:00:00.000Z",
    lastModified: "2026-01-01T00:00:00.000Z",
    perm: "rw",
    ...overrides,
  } as PageMeta;
}

test("flat list renders exactly one row per allPages entry", () => {
  const pages = [page({ name: "a" }), page({ name: "b" }), page({ name: "c" })];
  const html = render(SitemapTab({ allPages: pages, onNavigate: () => {} }));
  expect(html).toContain('class="sb-sitemap-all"');
  // 3 distinct pages, none opened -> no lead section, so exactly 3 rows total.
  const nameOccurrences = (html.match(/sb-name/g) ?? []).length;
  expect(nameOccurrences).toBe(3);
});

test("'commonly navigated' lead section: only pages with lastOpened, sorted descending", () => {
  const untouched = page({ name: "untouched" });
  const openedOld = page({ name: "opened-old", lastOpened: 100 });
  const openedNew = page({ name: "opened-new", lastOpened: 300 });
  const openedMid = page({ name: "opened-mid", lastOpened: 200 });

  const html = render(
    SitemapTab({
      allPages: [untouched, openedOld, openedNew, openedMid],
      onNavigate: () => {},
    }),
  );

  expect(html).toContain("Commonly navigated");
  expect(html).toContain('class="sb-sitemap-commonly-navigated"');

  const leadSection = html.split('class="sb-sitemap-all"')[0];
  expect(leadSection).not.toContain(">untouched<");

  const order = ["opened-new", "opened-mid", "opened-old"].map((n) =>
    leadSection.indexOf(`>${n}<`),
  );
  expect(order.every((i) => i >= 0)).toBe(true);
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);

  // Full list below still contains every page, including the untouched one
  // and the commonly-navigated ones again (pinned-at-top + full-list-below
  // is the intended, non-deduped pattern).
  const fullSection = html.split('class="sb-sitemap-all"')[1];
  for (const name of ["untouched", "opened-old", "opened-new", "opened-mid"]) {
    expect(fullSection).toContain(`>${name}<`);
  }
});

test("no pages with lastOpened -> no 'commonly navigated' lead section at all", () => {
  const html = render(
    SitemapTab({ allPages: [page({ name: "a" })], onNavigate: () => {} }),
  );
  expect(html).not.toContain("Commonly navigated");
  expect(html).not.toContain("sb-sitemap-commonly-navigated");
});

test("empty allPages renders an empty state instead of an empty list", () => {
  const html = render(SitemapTab({ allPages: [], onNavigate: () => {} }));
  expect(html).toContain("No pages yet.");
});

test("activating a row navigates by page name and closes the sheet", () => {
  navigateToAnythingPickerName.mockClear();
  const onNavigate = vi.fn();
  const vnode = SitemapTab({
    allPages: [page({ name: "widget" })],
    onNavigate,
  }) as any;

  // <>{allPages.length===0 ? ... : <m3e-list>{rows}</m3e-list>}</> — no lead
  // section here (no lastOpened), so children[1] is the all-pages list.
  const fragmentChildren = ([] as any[]).concat(vnode.props.children);
  const list = fragmentChildren.find((c) => c && c.type === "m3e-list");
  const rows = ([] as any[]).concat(list.props.children);
  expect(rows).toHaveLength(1);
  rows[0].props.onActivate();

  expect(navigateToAnythingPickerName).toHaveBeenCalledWith(
    "widget",
    onNavigate,
  );
});
