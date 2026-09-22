// Component-level unit coverage for the V5 `readOnlyToggle` prop
// (docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md §2.2).
//
// `e2e/app-bar-leading-trailing.test.ts` is a full Playwright e2e suite that
// drives `<TopBar>` through the real running app (client/editor_ui.tsx). This
// leaf is component-only per its brief — `editor_ui.tsx` isn't touched, so
// there is no live code path that constructs a real `readOnlyToggle` object
// yet (that's V8's job). Asserting this prop through the e2e suite would
// therefore either need a fake wiring path in editor_ui.tsx (out of scope,
// V8's job) or silently pass by testing nothing. Instead this file uses the
// repo's plain-unit-test pattern (vitest, see client/config.test.ts etc.)
// plus `preact-render-to-string` (already a devDependency) to render
// `<TopBar>` directly with a hand-built prop, independent of live app state.
//
// Known gap (expected, not introduced by this leaf): this does not prove the
// button shows up in the real running app — only V8's wiring in
// `editor_ui.tsx` can do that.
import { expect, test } from "vitest";
import { h } from "preact";
import render from "preact-render-to-string";
import { TopBar } from "./top_bar.tsx";

const baseProps = {
  unsavedChanges: false,
  isOnline: true,
  isLoading: false,
  onRename: async () => {},
  readOnly: false,
  breadcrumbItems: [],
  bodyText: "",
};

// 2026-09-22 V5b (docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md
// L8): the app bar is now `size="large"`, non-sticky, with the breadcrumb as
// its own `slot="leading"` content (first item icon-only) and a computed
// "Edited … · N min read" subtitle — replacing the old `size="small"` +
// standalone leading icon-button + separate breadcrumb row above it.
test("renders a size=large app bar with the breadcrumb as leading content, first item icon-only", () => {
  const html = render(
    h(TopBar, {
      ...baseProps,
      breadcrumbItems: [
        { key: "space", label: "Space", current: false, onClick: () => {} },
        { key: "journal", label: "Journal", current: false },
        { key: "page", label: "2026-09-21", current: true },
      ],
    }),
  );

  expect(html).toContain('<m3e-app-bar size="large">');
  // No more standalone leading icon-button or separate breadcrumb row.
  expect(html).not.toContain('<m3e-icon-button slot="leading"');
  expect(html).not.toContain("sb-breadcrumb-row");

  const bar = html.slice(html.indexOf("<m3e-app-bar"));
  const breadcrumbIndex = bar.indexOf('<m3e-breadcrumb slot="leading"');
  expect(breadcrumbIndex).toBeGreaterThan(-1);
  const breadcrumb = bar.slice(
    breadcrumbIndex,
    bar.indexOf("</m3e-breadcrumb>"),
  );
  // First item is icon-only (asterisk), not a repeated "Space" text item.
  const firstItemEnd = breadcrumb.indexOf("</m3e-breadcrumb-item>");
  const firstItem = breadcrumb.slice(0, firstItemEnd);
  expect(firstItem).toContain('name="asterisk"');
  expect(firstItem).not.toContain("Space");
  // The rest of the trail renders as ordinary label items.
  const restItems = breadcrumb.slice(firstItemEnd);
  expect(restItems).toContain("Journal");
  expect(restItems).toContain("2026-09-21");
});

test("renders the Edited/reading-time subtitle from lastModified + bodyText", () => {
  const html = render(
    h(TopBar, {
      ...baseProps,
      lastModified: new Date(Date.now() - 60_000).toISOString(),
      bodyText: "word ".repeat(450),
    }),
  );

  const bar = html.slice(html.indexOf("<m3e-app-bar"));
  const subtitle = bar.slice(
    bar.indexOf('slot="subtitle"'),
    bar.indexOf("</span>", bar.indexOf('slot="subtitle"')),
  );
  expect(subtitle).toContain("Edited");
  expect(subtitle).toContain("min read");
  expect(subtitle).toContain("2 min read");
});

test("readOnlyToggle active:true renders a lock icon-button before the kebab trigger", () => {
  const html = render(
    h(TopBar, {
      ...baseProps,
      readOnlyToggle: { active: true, label: "Disable read-only", onClick: () => {} },
    }),
  );

  // Anchored on the app bar itself, not on the first `slot="trailing"`
  // occurrence: each trailing item now carries that attribute directly (the
  // old wrapper span is gone), so slicing at the attribute would start
  // mid-tag and cut off the very element being looked for.
  const trailing = html.slice(html.indexOf("<m3e-app-bar"));
  const lockIndex = trailing.indexOf('name="lock"');
  const kebabIndex = trailing.indexOf("more_vert");
  expect(lockIndex).toBeGreaterThan(-1);
  expect(kebabIndex).toBeGreaterThan(-1);
  expect(lockIndex).toBeLessThan(kebabIndex);
  expect(trailing.slice(0, lockIndex)).toContain('title="Disable read-only"');
});

test("readOnlyToggle active:false renders a lock_open icon", () => {
  const html = render(
    h(TopBar, {
      ...baseProps,
      readOnlyToggle: { active: false, label: "Enable read-only", onClick: () => {} },
    }),
  );

  expect(html).toContain('name="lock_open"');
  expect(html).not.toContain('name="lock"');
  expect(html).toContain('title="Enable read-only"');
});

test("omitting readOnlyToggle renders no read-only button", () => {
  const html = render(h(TopBar, { ...baseProps }));

  expect(html).not.toContain('name="lock"');
  expect(html).not.toContain('name="lock_open"');
  // Kebab trigger still renders regardless.
  expect(html).toContain("more_vert");
});

// V11: persistent offline chip (trailing slot, left of the kebab trigger) —
// replaces the old anchored `m3e-badge` dot on the page title.
test("isOnline:false renders a labeled offline chip before the kebab trigger", () => {
  const html = render(h(TopBar, { ...baseProps, isOnline: false }));

  const trailing = html.slice(html.indexOf("<m3e-app-bar"));
  const chipIndex = trailing.indexOf("<m3e-chip");
  const kebabIndex = trailing.indexOf("more_vert");
  expect(chipIndex).toBeGreaterThan(-1);
  expect(kebabIndex).toBeGreaterThan(-1);
  expect(chipIndex).toBeLessThan(kebabIndex);
  expect(trailing.slice(chipIndex, kebabIndex)).toContain("Offline");
  expect(trailing.slice(chipIndex, kebabIndex)).toContain(
    'title="Offline — changes will sync once reconnected"',
  );
  expect(trailing.slice(chipIndex, kebabIndex)).toContain(
    'aria-label="Offline"',
  );
  // Old anchored badge is gone entirely.
  expect(html).not.toContain("m3e-badge");
});

test("isOnline:true renders no offline chip", () => {
  const html = render(h(TopBar, { ...baseProps, isOnline: true }));

  expect(html).not.toContain("<m3e-chip");
  expect(html).not.toContain("m3e-badge");
});
