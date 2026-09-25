import { expect, test } from "vitest";
import { h } from "preact";
import { render } from "preact-render-to-string";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
  Progress,
  Select,
  SegmentedControl,
  Tabs,
  UrlPrefixInput,
} from "./index.ts";

test("Button renders m3e-button, primary emits both classes and merges consumer class", () => {
  const html = render(h(Button, { variant: "primary", class: "x" }, "Ok"));
  expect(html).toContain("<m3e-button");
  expect(html).toContain("sb-button sb-button-primary x");
  expect(html).toContain('variant="filled"');
  expect(html).toContain(">Ok</m3e-button>");
  expect(html).toContain('type="button"');
});

test("Button danger/icon variants map to m3e-button variants + class hooks", () => {
  const danger = render(h(Button, { variant: "danger" }, "D"));
  expect(danger).toContain("sb-button-danger");
  expect(danger).toContain('variant="filled"');

  const icon = render(h(Button, { variant: "icon" }, "I"));
  expect(icon).toContain("sb-button-icon");
  expect(icon).toContain('variant="text"');
});

test("Button default variant renders outlined m3e-button", () => {
  const html = render(h(Button, {}, "Ok"));
  expect(html).toContain('variant="outlined"');
  expect(html).toContain("sb-button");
});

test("Input wraps in m3e-form-field by default", () => {
  const html = render(h(Input, { value: "hi" }));
  expect(html).toContain("<m3e-form-field");
  expect(html).toContain('type="text"');
  expect(html).toContain('value="hi"');
});

test("Input bare renders a plain sb-input with default type text, no wrapper", () => {
  const html = render(h(Input, { value: "hi", bare: true }));
  expect(html).not.toContain("m3e-form-field");
  expect(html).toContain('class="sb-input"');
  expect(html).toContain('type="text"');
});

test("Input renders cleanly when onConfirm/onExit are provided", () => {
  const html = render(
    h(Input, {
      value: "hi",
      bare: true,
      onConfirm: () => {},
      onExit: () => {},
    }),
  );
  expect(html).toContain('class="sb-input"');
  expect(html).toContain('value="hi"');
  // Callback props must not leak as DOM attributes
  expect(html).not.toContain("onConfirm");
  expect(html).not.toContain("onExit");
});

test("Select wraps options", () => {
  const html = render(h(Select, {}, h("option", {}, "A")));
  expect(html).toContain('class="sb-select"');
  expect(html).toContain(">A</option>");
});

test("Checkbox renders an m3e-checkbox with the checked attribute", () => {
  const html = render(h(Checkbox, { checked: true }));
  expect(html).toContain("<m3e-checkbox");
  expect(html).toContain("m3e-checkbox");
  expect(html).toContain("checked");
});

test("Tabs marks the active tab and wires per-item onSelect", () => {
  let picked = "";
  const items = [
    { label: "A", active: false, onSelect: () => (picked = "a") },
    { label: "B", active: true, onSelect: () => (picked = "b") },
  ];
  const html = render(h(Tabs, { items }));
  expect(html).toContain("<m3e-tabs");
  expect(html).toContain("sb-tab sb-active");
  expect(html).toContain("selected");
  // each tab carries its own handler
  items[0].onSelect();
  expect(picked).toBe("a");
});

test("Tabs with href items renders plain nav anchors, not m3e-tab", () => {
  const items = [
    { label: "A", href: "#a", active: true },
    { label: "B", href: "#b", active: false, dirty: true },
  ];
  const html = render(h(Tabs, { items }));
  expect(html).toContain('role="navigation"');
  expect(html).not.toContain("<m3e-tab");
  expect(html).toContain('href="#a"');
  expect(html).toContain("data-dirty");
});

test("Alert variant class", () => {
  expect(render(h(Alert, { variant: "error" }, "e"))).toContain(
    "sb-alert sb-alert-error",
  );
  expect(render(h(Alert, { variant: "warning" }, "w"))).toContain(
    "sb-alert-warning",
  );
  expect(render(h(Alert, { variant: "info" }, "i"))).toContain("sb-alert-info");
});

test("Badge", () => {
  expect(render(h(Badge, {}, "b"))).toContain('class="sb-badge">b<');
});

test("Progress clamps value to the m3e-linear-progress-indicator value attribute", () => {
  expect(render(h(Progress, { value: 0.5 }))).toMatch(/value="50"/);
  expect(render(h(Progress, { value: 2 }))).toMatch(/value="100"/);
  expect(render(h(Progress, { value: -1 }))).toMatch(/value="0"/);
});

test("UrlPrefixInput shows the origin it is given, not the ambient one", () => {
  // The desktop app configures a *remote* sync server, so the origin cannot
  // be read from `location` the way the server-hosted Space Manager does.
  const html = render(
    h(UrlPrefixInput, {
      origin: "https://sb.example.com",
      value: "/notes",
      onInput: () => {},
    }),
  );
  expect(html).toContain("sb-url-input");
  expect(html).toContain(">https://sb.example.com</span>");
  expect(html).toContain('value="/notes"');
});

test("SegmentedControl defaults to tabIndex -1, so a caller's own input keeps focus", () => {
  const items = [{ label: "Pages" }, { label: "Meta" }];
  const html = render(
    h(SegmentedControl, { items, activeIndex: 0, onPick: () => {} }),
  );
  expect(html).toContain('tabindex="-1"');
  expect(html).not.toContain('tabindex="0"');
});

test("SegmentedControl takeFocus makes items ordinary tab stops", () => {
  const items = [{ label: "A" }];
  const html = render(
    h(SegmentedControl, {
      items,
      activeIndex: 0,
      onPick: () => {},
      takeFocus: true,
    }),
  );
  expect(html).toContain('tabindex="0"');
});

test("SegmentedControl marks the active item and defaults aria-label to Options", () => {
  const items = [{ label: "A" }, { label: "B" }];
  const html = render(
    h(SegmentedControl, { items, activeIndex: 1, onPick: () => {} }),
  );
  expect(html).toContain("sb-segment sb-segment-active");
  expect(html).toContain('aria-label="Options"');
});

test("SegmentedControl prefers the caller's tooltip over the label", () => {
  const items = [{ label: "Anchors", tooltip: "Anchors ($)" }];
  const html = render(
    h(SegmentedControl, { items, activeIndex: 0, onPick: () => {} }),
  );
  expect(html).toContain('title="Anchors ($)"');
});

test("Icon renders a span carrying the caller's class", () => {
  const node = {} as unknown as Element;
  const html = render(h(Icon, { node, class: "sb-nav-icon" }));
  expect(html).toContain('class="sb-nav-icon"');
  expect(html).toMatch(/<span[^>]*><\/span>/);
});

test("UrlPrefixInput trims a trailing slash off the origin", () => {
  // Sync server URLs are commonly stored with one; without trimming the
  // assembled URL reads "https://h//notes".
  const html = render(
    h(UrlPrefixInput, {
      origin: "https://sb.example.com/",
      value: "/notes",
      onInput: () => {},
    }),
  );
  expect(html).toContain(">https://sb.example.com</span>");
});
