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
import {
  commitBlockMappingEdit,
  commitFieldEdit,
  editFieldAsRawYaml,
  FrontMatterRow,
} from "./front_matter_panel.tsx";

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
  const dispatched: any[] = [];
  const flashed: { message: string; type?: string }[] = [];
  let focusCalls = 0;
  const editorView = {
    state,
    dispatch: (tx: any) => {
      dispatched.push(tx);
      // Apply document-changing transactions so subsequent reads (and
      // multi-step tests) see the resulting document, mirroring a real
      // EditorView. Effect-only transactions (e.g. the unfold + selection
      // dispatch from `editFieldAsRawYaml`) are recorded but not replayed
      // through `state.update` — CM's fold machinery needs its own
      // registered StateField, which these minimal test fixtures
      // deliberately don't set up (unit-testing the intent, not CM's own
      // fold plumbing, which frontmatter_folding.test.ts already covers).
      if (tx.changes) {
        const newState = state.update(tx).state;
        (editorView as any).state = newState;
      }
    },
    focus: () => {
      focusCalls++;
    },
  };
  const client = {
    editorView,
    get focusCalls() {
      return focusCalls;
    },
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

  test("a block-shaped field renders its own structured editor control, not the scalar input", () => {
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
    // L4.3 gives every block shape its own control (BlockMappingEditor
    // here) — confirmed in more detail by the "block-mapping field" /
    // "block-sequence field" / "block-scalar fields" describe blocks below.
    expect(html).toContain("sb-fm-block-mapping");
    expect(html).not.toContain("sb-fm-value-input");
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

// L4.3 — full editing for every value shape, including block-style YAML.
describe("block-sequence field", () => {
  test("renders the list-row editor with one input per item plus an add row", () => {
    const { state, block } = docWithFrontMatter(
      "---\ntags:\n  - journal\n  - retro\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "tags"
    )!;

    const html = render(
      h(FrontMatterRow, {
        field,
        value: ["journal", "retro"],
        client,
        block,
        editingKey: null,
        onEditingKeyChange: () => {},
        onCommitted: () => {},
      }),
    );

    expect(html).toContain("sb-fm-seq-row");
    expect(html).toContain('value="journal"');
    expect(html).toContain('value="retro"');
    expect(html).toContain("sb-fm-seq-add");
  });

  test("adding an item via commitFieldEdit produces the expected multi-line doc text", () => {
    const { state, block } = docWithFrontMatter(
      "---\ntags:\n  - journal\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "tags"
    )!;

    const ok = commitFieldEdit(client, block, field, ["journal", "retro"]);

    expect(ok).toBe(true);
    const resultState = client.editorView.state as EditorState;
    const doc = resultState.sliceDoc(0, resultState.doc.length);
    expect(doc).toContain("- journal");
    expect(doc).toContain("- retro");
  });
});

describe("block-mapping field", () => {
  test("renders a textarea pre-filled with the raw nested YAML", () => {
    const { state, block } = docWithFrontMatter(
      "---\nowner:\n  name: Jack\n  email: j@x.com\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "owner"
    )!;

    const html = render(
      h(FrontMatterRow, {
        field,
        value: { name: "Jack", email: "j@x.com" },
        client,
        block,
        editingKey: null,
        onEditingKeyChange: () => {},
        onCommitted: () => {},
      }),
    );

    expect(html).toContain("sb-fm-block-mapping-textarea");
    expect(html).toContain("name: Jack");
    expect(html).toContain("email: j@x.com");
    expect(html).toContain("m3e-textarea-autosize");
  });

  test("commitBlockMappingEdit re-indents and splices valid edited YAML", () => {
    const { state, block } = docWithFrontMatter(
      "---\ntitle: Doc\nowner:\n  name: Jack\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "owner"
    )!;

    const ok = commitBlockMappingEdit(
      client,
      block,
      field,
      "name: Jack\nemail: j@x.com",
    );

    expect(ok).toBe(true);
    const resultState = client.editorView.state as EditorState;
    const doc = resultState.sliceDoc(0, resultState.doc.length);
    expect(doc).toContain("title: Doc");
    expect(doc).toContain("  name: Jack");
    expect(doc).toContain("  email: j@x.com");
  });

  test("commitBlockMappingEdit rejects inconsistently-indented text without touching the doc", () => {
    const { state, block } = docWithFrontMatter(
      "---\nowner:\n  name: Jack\n---\nBody",
    );
    const { client, dispatched, flashed } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "owner"
    )!;

    // Inconsistent indentation within a mapping is invalid YAML on its own.
    const ok = commitBlockMappingEdit(
      client,
      block,
      field,
      "name: Jack\n  email: j@x.com",
    );

    expect(ok).toBe(false);
    expect(dispatched).toHaveLength(0);
    expect(flashed).toHaveLength(1);
    expect(flashed[0].type).toBe("error");
  });
});

describe("block-scalar fields", () => {
  test("blockScalarLiteral renders a textarea with DECODED newlines, not the raw `|`-prefixed source", () => {
    const { state, block } = docWithFrontMatter(
      "---\nnotes: |\n  line one\n  line two\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "notes"
    )!;

    const html = render(
      h(FrontMatterRow, {
        field,
        value: "line one\nline two",
        client,
        block,
        editingKey: null,
        onEditingKeyChange: () => {},
        onCommitted: () => {},
      }),
    );

    expect(html).toContain("sb-fm-block-scalar-textarea");
    expect(html).toContain("line one\nline two");
    expect(html).not.toContain("|-\n  line one");
  });

  test("committing a blockScalarLiteral edit keeps the `|` indicator", () => {
    const { state, block } = docWithFrontMatter(
      "---\nnotes: |\n  line one\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "notes"
    )!;

    const ok = commitFieldEdit(client, block, field, "line one\nline two");

    expect(ok).toBe(true);
    const resultState = client.editorView.state as EditorState;
    const doc = resultState.sliceDoc(0, resultState.doc.length);
    expect(doc).toContain("notes: |");
    expect(doc).not.toContain("notes: >");
  });

  test("committing a blockScalarFolded edit keeps the `>` indicator", () => {
    const { state, block } = docWithFrontMatter(
      "---\nnotes: >\n  line one\n---\nBody",
    );
    const { client } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "notes"
    )!;

    const ok = commitFieldEdit(client, block, field, "line one\nline two");

    expect(ok).toBe(true);
    const resultState = client.editorView.state as EditorState;
    const doc = resultState.sliceDoc(0, resultState.doc.length);
    expect(doc).toContain("notes: >");
  });
});

describe("editFieldAsRawYaml — escape hatch, all shapes", () => {
  test("unfolds the block and places the cursor at the field's own key line", () => {
    const { state, block } = docWithFrontMatter(
      "---\ntitle: Doc\nowner:\n  name: Jack\n---\nBody",
    );
    const { client, dispatched } = fakeClient(state);
    const field = locateFrontMatterFields(state, block).find((f) =>
      f.key === "owner"
    )!;

    editFieldAsRawYaml(client, block, field);

    expect(dispatched).toHaveLength(1);
    const tx = dispatched[0];
    expect(tx.selection.anchor).toBe(field.lineFrom);
    expect(tx.effects).toBeDefined();
    expect(client.focusCalls).toBe(1);
  });
});
