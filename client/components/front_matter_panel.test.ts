// Component-level coverage for client/components/front_matter_panel.tsx —
// FrontMatterPanel's inline editing (L4 of
// docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md).
//
// Seams under test:
//  - `commitFieldEdit`, a plain function taking a fake `Client`-shaped
//    object — no DOM/Preact rendering needed, so this coverage runs under
//    plain `vitest run`.
//  - `<FrontMatterRow>`, rendered with `preact-render-to-string` for static
//    structure (matches top_bar.test.ts's own pattern) where possible.
//  - True interactive behavior (click a row to edit, type, blur/Enter to
//    commit) needs a real DOM to dispatch events against — those cases are
//    written but guarded by the same `domTest` pattern
//    client/codemirror/frontmatter_folding.test.ts already established
//    (`typeof document === "undefined" ? test.skip : test`), and — same as
//    that file — legitimately SKIP under this repo's plain `vitest run`
//    (no jsdom environment configured in vitest.config.ts). This is a
//    pre-existing, expected gap, not a regression introduced here.
import { EditorState } from "@codemirror/state";
import { h, render as preactRender } from "preact";
import render from "preact-render-to-string";
import { describe, expect, test, vi } from "vitest";
import type { FrontmatterBlock } from "../codemirror/frontmatter_folding.ts";
import type { FrontMatterFieldSpan } from "../lib/frontmatter_yaml.ts";
import * as frontmatterYaml from "../lib/frontmatter_yaml.ts";
import { locateFrontMatterFields } from "../lib/frontmatter_yaml.ts";
import { commitFieldEdit, FrontMatterRow } from "./front_matter_panel.tsx";

const domTest = typeof document === "undefined" ? test.skip : test;

function docWithFrontMatter(doc: string) {
  const state = EditorState.create({ doc });
  const text = doc;
  const secondFence = text.indexOf("\n---", 3);
  const to = state.doc.lineAt(secondFence + 1).to;
  const block: FrontmatterBlock = {
    from: 0,
    to,
    lines: state.doc.lineAt(to).number,
  };
  return { state, block };
}

function fakeClient(state: EditorState) {
  const dispatched: unknown[] = [];
  const flashed: { message: string; type?: string }[] = [];
  const editorView = {
    state,
    dispatch: (tx: any) => {
      dispatched.push(tx);
      // Apply the transaction so subsequent reads (and multi-step tests)
      // see the resulting document, mirroring a real EditorView.
      const newState = state.update(tx).state;
      (editorView as any).state = newState;
    },
  };
  const client = {
    editorView,
    ui: {
      flashNotification: (message: string, type?: string) => {
        flashed.push({ message, type });
      },
    },
  };
  return { client: client as any, dispatched, flashed };
}

describe("commitFieldEdit", () => {
  test("a valid scalar edit dispatches a transaction with the new value at the right span", () => {
    const { state, block } = docWithFrontMatter(
      "---\nstatus: draft\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, block);
    const field = fields.find((f) => f.key === "status")!;
    const { client, dispatched } = fakeClient(state);

    const ok = commitFieldEdit(client, block, field, "final");

    expect(ok).toBe(true);
    expect(dispatched).toHaveLength(1);
    const resultState = client.editorView.state as EditorState;
    expect(resultState.sliceDoc(0, resultState.doc.length)).toContain(
      "status: final",
    );
    expect(resultState.sliceDoc(0, resultState.doc.length)).toContain("Body");
  });

  test("an invalid edit does not change the doc and flashes an error", () => {
    const { state, block } = docWithFrontMatter(
      "---\nstatus: draft\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, block);
    const field = fields.find((f) => f.key === "status")!;
    const { client, dispatched, flashed } = fakeClient(state);

    // `serializeYamlValue` (thoroughly covered on its own in
    // frontmatter_yaml.test.ts) always produces syntactically valid YAML
    // for any real JS value it's given — genuinely malformed YAML can only
    // reach `commitFieldEdit`'s splice if something upstream of it breaks.
    // This test exercises `commitFieldEdit`'s OWN validation gate directly
    // by forcing that upstream failure: mock `serializeYamlValue` to hand
    // back deliberately-broken YAML text for this one call, and assert the
    // gate (whole-block `tryParseFrontMatter`, unmocked and real) catches
    // it — never dispatches, flashes the expected error.
    const spy = vi.spyOn(frontmatterYaml, "serializeYamlValue")
      .mockReturnValueOnce("[unterminated");

    const ok = commitFieldEdit(client, block, field, "irrelevant");

    expect(ok).toBe(false);
    expect(dispatched).toHaveLength(0);
    expect(flashed).toHaveLength(1);
    expect(flashed[0].type).toBe("error");
    expect(flashed[0].message).toContain("status");

    spy.mockRestore();
  });

  test("a valid block-shaped (blockSequence) edit replaces the full multi-line span, leaving surrounding keys untouched", () => {
    const { state, block } = docWithFrontMatter(
      "---\ntitle: My Page\ntags:\n  - journal\n  - retro\nstatus: draft\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, block);
    const tagsField = fields.find((f) => f.key === "tags")!;
    const { client } = fakeClient(state);

    const ok = commitFieldEdit(client, block, tagsField, [
      "one",
      "two",
      "three",
    ]);

    expect(ok).toBe(true);
    const resultDoc = (client.editorView.state as EditorState).sliceDoc(
      0,
      (client.editorView.state as EditorState).doc.length,
    );
    expect(resultDoc).toContain("title: My Page");
    expect(resultDoc).toContain("status: draft");
    expect(resultDoc).toContain("- one");
    expect(resultDoc).toContain("- two");
    expect(resultDoc).toContain("- three");
    expect(resultDoc).not.toContain("journal");
    expect(resultDoc).not.toContain("retro");
  });
});

describe("<FrontMatterRow> — static rendering", () => {
  function renderRow(field: FrontMatterFieldSpan, value: unknown) {
    const { state, block } = docWithFrontMatter(
      "---\nstatus: draft\n---\nBody",
    );
    const { client } = fakeClient(state);
    return render(
      h(FrontMatterRow, {
        field,
        value,
        client,
        block,
        editingKey: null,
        onEditingKeyChange: () => {},
        onCommitted: () => {},
      }),
    );
  }

  test("renders the key, icon, and display value for a scalar field", () => {
    const field: FrontMatterFieldSpan = {
      key: "status",
      shape: "scalar",
      valueFrom: 0,
      valueTo: 0,
      lineFrom: 0,
      lineTo: 0,
      isBlockValue: false,
    };
    const html = renderRow(field, "draft");
    expect(html).toContain("status");
    expect(html).toContain("draft");
    expect(html).toContain('name="label"'); // default icon for an unmapped key
  });

  test("uses the tags icon for a `tags` key", () => {
    const field: FrontMatterFieldSpan = {
      key: "tags",
      shape: "flow",
      valueFrom: 0,
      valueTo: 0,
      lineFrom: 0,
      lineTo: 0,
      isBlockValue: false,
    };
    const html = renderRow(field, ["journal", "retro"]);
    expect(html).toContain('name="sell"');
    expect(html).toContain("journal, retro");
  });

  test("a block-shaped field renders read-only (structured editors land in L4.3)", () => {
    const field: FrontMatterFieldSpan = {
      key: "owner",
      shape: "blockMapping",
      valueFrom: 0,
      valueTo: 0,
      lineFrom: 0,
      lineTo: 0,
      isBlockValue: true,
    };
    const html = renderRow(field, { name: "Jack" });
    expect(html).toContain("sb-fm-value-readonly");
  });
});

describe("<FrontMatterRow> — interactive editing (requires real DOM)", () => {
  domTest(
    "clicking the value swaps in an input, and Enter commits the new value",
    () => {
      const { state, block } = docWithFrontMatter(
        "---\nstatus: draft\n---\nBody",
      );
      const { client } = fakeClient(state);
      const field = locateFrontMatterFields(state, block).find((f) =>
        f.key === "status"
      )!;

      let editingKey: string | null = null;
      const onEditingKeyChange = vi.fn((key: string | null) => {
        editingKey = key;
      });
      const onCommitted = vi.fn();

      const container = document.createElement("div");
      document.body.appendChild(container);

      preactRender(
        h(FrontMatterRow, {
          field,
          value: "draft",
          client,
          block,
          editingKey,
          onEditingKeyChange,
          onCommitted,
        }),
        container,
      );

      const valueSpan = container.querySelector(".sb-fm-value")!;
      valueSpan.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onEditingKeyChange).toHaveBeenCalledWith("status");

      preactRender(
        h(FrontMatterRow, {
          field,
          value: "draft",
          client,
          block,
          editingKey: "status",
          onEditingKeyChange,
          onCommitted,
        }),
        container,
      );

      const input = container.querySelector(
        ".sb-fm-value-input",
      ) as HTMLInputElement;
      input.value = "final";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );

      expect(onCommitted).toHaveBeenCalled();
      const resultState = client.editorView.state as EditorState;
      expect(resultState.sliceDoc(0, resultState.doc.length)).toContain(
        "status: final",
      );

      document.body.removeChild(container);
    },
  );
});
