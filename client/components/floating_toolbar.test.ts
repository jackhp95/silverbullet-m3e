import { expect, test, vi } from "vitest";
import { render } from "preact-render-to-string";
import { FloatingToolbar } from "./floating_toolbar.tsx";

// e2e coverage now lives at `e2e/flows/floating-toolbar.test.ts` (CS-6,
// docs/plans/2026-09-24-core-shell-decomposition.md) once
// `client/editor_ui.tsx` renders this component into the live app. This
// stays as a direct component-level render test for the button-set/props
// contract itself (a Preact function component is just a plain function).

test("renders exactly 2 icon-buttons, in order Search/Journal", () => {
  const vnode = FloatingToolbar({
    onSearchClick: () => {},
    journal: { available: true, onClick: () => {} },
  });

  expect(vnode.type).toBe("m3e-toolbar");
  const buttons = ([] as unknown[]).concat(vnode.props.children as never);
  expect(buttons).toHaveLength(2);

  const labels = buttons.map((b: any) => b.props["aria-label"]);
  expect(labels).toEqual(["Search", "Journal"]);

  const titles = buttons.map((b: any) => b.props.title);
  expect(titles).toEqual(["Search", "Journal"]);
});

test("each button's slotted m3e-icon carries the expected, glyph-verified icon name", () => {
  const vnode = FloatingToolbar({
    onSearchClick: () => {},
    journal: { available: true, onClick: () => {} },
  });

  const buttons = vnode.props.children as any[];
  const iconNames = buttons.map((b) => b.props.children.props.name);
  expect(iconNames).toEqual(["search", "edit_calendar"]);
});

test("clicking Search calls onSearchClick and prevents default", () => {
  const onSearchClick = vi.fn();
  const vnode = FloatingToolbar({
    onSearchClick,
    journal: { available: true, onClick: () => {} },
  });
  const [searchBtn] = vnode.props.children as any[];

  const fakeEvent = { preventDefault: vi.fn() } as unknown as MouseEvent;
  searchBtn.props.onClick(fakeEvent);

  expect(onSearchClick).toHaveBeenCalledOnce();
  expect(fakeEvent.preventDefault).toHaveBeenCalledOnce();
});

test("Journal button: disabled-interactive + onClick reflect journal.available", () => {
  const onClick = vi.fn();

  const available = FloatingToolbar({
    onSearchClick: () => {},
    journal: { available: true, onClick },
  });
  const journalBtnAvailable = (available.props.children as any[])[1];
  expect(journalBtnAvailable.props["disabled-interactive"]).toBe(false);
  journalBtnAvailable.props.onClick({ preventDefault: () => {} } as MouseEvent);
  expect(onClick).toHaveBeenCalledOnce();

  const unavailable = FloatingToolbar({
    onSearchClick: () => {},
    journal: { available: false, onClick },
  });
  const journalBtnUnavailable = (unavailable.props.children as any[])[1];
  expect(journalBtnUnavailable.props["disabled-interactive"]).toBe(true);
  expect(journalBtnUnavailable.props.onClick).toBeUndefined();
});

test("renders to a real (non-empty, non-tofu) HTML string via preact-render-to-string", () => {
  const html = render(
    FloatingToolbar({
      onSearchClick: () => {},
      journal: { available: true, onClick: () => {} },
    }),
  );

  expect(html).toContain('class="sb-floating-toolbar"');
  expect(html).toContain('<m3e-icon name="search">');
  expect(html).toContain('<m3e-icon name="edit_calendar">');
});
