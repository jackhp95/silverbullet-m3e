// Pure-function unit coverage for client/lib/frontmatter_yaml.ts — the
// line-based field-span locator + shape-aware YAML (de)serializer that
// backs FrontMatterPanel's inline editing (L4 of
// docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md).
//
// Seam under test: the exported pure functions themselves
// (`locateFrontMatterFields`, `serializeYamlValue`, `tryParseFrontMatter`),
// fed a plain CodeMirror `EditorState` built directly from a doc string — no
// Preact, no DOM, no real markdown-language parse needed since
// `locateFrontMatterFields` takes an already-located `FrontmatterBlock`
// (from `findFrontmatterBlock`, tested separately in
// frontmatter_folding.test.ts) rather than re-deriving it.
import { EditorState } from "@codemirror/state";
import { describe, expect, test } from "vitest";
import type { FrontmatterBlock } from "../codemirror/frontmatter_folding.ts";
import {
  locateFrontMatterFields,
  serializeYamlValue,
  tryParseFrontMatter,
} from "./frontmatter_yaml.ts";

function stateWithDoc(doc: string) {
  return EditorState.create({ doc });
}

/** Locates the `---`-delimited frontmatter block by literal text scan — a
 * test-only helper (production code uses `findFrontmatterBlock`'s real
 * syntax-tree walk); doc fixtures below always start with `---\n`. */
function blockOf(state: EditorState): FrontmatterBlock {
  const text = state.doc.toString();
  const secondFence = text.indexOf("\n---", 3);
  const to = state.doc.lineAt(secondFence + 1).to;
  const startLine = 1;
  const endLine = state.doc.lineAt(to).number;
  return { from: 0, to, lines: endLine - startLine + 1 };
}

describe("locateFrontMatterFields — shapes", () => {
  test("plain scalar", () => {
    const state = stateWithDoc("---\nstatus: draft\n---\nBody");
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe("status");
    expect(fields[0].shape).toBe("scalar");
    expect(fields[0].isBlockValue).toBe(false);
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      "draft",
    );
  });

  test("flow array on one line", () => {
    const state = stateWithDoc("---\ntags: [journal, retro]\n---\nBody");
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields[0].shape).toBe("flow");
    expect(fields[0].isBlockValue).toBe(false);
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      "[journal, retro]",
    );
  });

  test("block sequence — valueTo extends through the last item line", () => {
    const state = stateWithDoc(
      "---\ntags:\n  - journal\n  - retro\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe("tags");
    expect(fields[0].shape).toBe("blockSequence");
    expect(fields[0].isBlockValue).toBe(true);
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      "\n  - journal\n  - retro",
    );
  });

  test("block mapping", () => {
    const state = stateWithDoc(
      "---\nowner:\n  name: Jack\n  email: j@x.com\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe("owner");
    expect(fields[0].shape).toBe("blockMapping");
    expect(fields[0].isBlockValue).toBe(true);
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      "\n  name: Jack\n  email: j@x.com",
    );
  });

  test("literal block scalar", () => {
    const state = stateWithDoc(
      "---\nnotes: |\n  line one\n  line two\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields[0].shape).toBe("blockScalarLiteral");
    expect(fields[0].isBlockValue).toBe(true);
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      "|\n  line one\n  line two",
    );
  });

  test("folded block scalar", () => {
    const state = stateWithDoc(
      "---\nnotes: >\n  line one\n  line two\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields[0].shape).toBe("blockScalarFolded");
    expect(fields[0].isBlockValue).toBe(true);
  });

  test("block value immediately followed by another top-level key", () => {
    const state = stateWithDoc(
      "---\ntags:\n  - journal\n  - retro\nstatus: draft\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields).toHaveLength(2);
    expect(fields[0].key).toBe("tags");
    // valueTo must stop exactly at the dedent, not swallowing `status`.
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      "\n  - journal\n  - retro",
    );
    expect(fields[1].key).toBe("status");
    expect(fields[1].shape).toBe("scalar");
  });

  test("block value as the LAST key before the closing ---, with a trailing blank line", () => {
    const state = stateWithDoc(
      "---\nstatus: draft\ntags:\n  - journal\n  - retro\n\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields).toHaveLength(2);
    const tagsField = fields[1];
    expect(tagsField.key).toBe("tags");
    // The trailing blank line before `---` is NOT part of the value.
    expect(state.sliceDoc(tagsField.valueFrom, tagsField.valueTo)).toBe(
      "\n  - journal\n  - retro",
    );
  });

  test("quoted string value with an embedded colon", () => {
    const state = stateWithDoc('---\ntitle: "Has: a colon"\n---\nBody');
    const fields = locateFrontMatterFields(state, blockOf(state));
    expect(fields[0].shape).toBe("scalar");
    expect(state.sliceDoc(fields[0].valueFrom, fields[0].valueTo)).toBe(
      '"Has: a colon"',
    );
  });

  test("lineFrom/lineTo cover the full field including its own trailing newline", () => {
    const state = stateWithDoc(
      "---\nstatus: draft\ntags:\n  - a\n  - b\n---\nBody",
    );
    const fields = locateFrontMatterFields(state, blockOf(state));
    const statusLine = state.doc.line(2);
    expect(fields[0].lineFrom).toBe(statusLine.from);
    expect(fields[0].lineTo).toBe(statusLine.to + 1);
    const tagsField = fields[1];
    const lastItemLine = state.doc.line(5); // "  - b"
    expect(tagsField.lineTo).toBe(lastItemLine.to + 1);
  });
});

describe("serializeYamlValue", () => {
  test("string with special characters stays a scalar", () => {
    expect(serializeYamlValue("Has: a colon", "scalar")).toBe(
      "'Has: a colon'",
    );
  });

  test("number", () => {
    expect(serializeYamlValue(42, "scalar")).toBe("42");
  });

  test("boolean", () => {
    expect(serializeYamlValue(true, "scalar")).toBe("true");
  });

  test("small array as flow", () => {
    expect(serializeYamlValue(["journal", "retro"], "flow")).toBe(
      "[journal, retro]",
    );
  });

  test("small array as blockSequence", () => {
    expect(serializeYamlValue(["journal", "retro"], "blockSequence")).toBe(
      "\n  - journal\n  - retro",
    );
  });

  test("blockMapping value dumps as an indented block", () => {
    expect(
      serializeYamlValue({ name: "Jack", email: "j@x.com" }, "blockMapping"),
    ).toBe("\n  name: Jack\n  email: j@x.com");
  });

  // Splicing convention matched here: `locateFrontMatterFields` positions
  // `valueFrom` right after `key:` PLUS one inline space whenever the doc
  // actually has inline content there (a scalar/flow value, a block
  // scalar's ` |`/` >` indicator, or js-yaml collapsing an empty sequence
  // to flow `[]`) — so `serializeYamlValue` strips that same leading space
  // from its own output (see its doc comment), and these fixtures glue
  // `key: ` (colon + space) back on to reconstruct what the real
  // pre-`valueFrom` document text would be. A stray space before a bare
  // newline (the non-empty block-sequence/mapping case) is harmless YAML,
  // so gluing `key: ` uniformly is safe for every shape here.

  test("multi-line string round-trips through blockScalarLiteral, keeping `|`", () => {
    const value = "line one\nline two";
    const dumped = serializeYamlValue(value, "blockScalarLiteral");
    expect(dumped.startsWith("|")).toBe(true);
    const reparsed = tryParseFrontMatter(`---\nnotes: ${dumped}\n---`);
    expect(reparsed?.notes).toBe(value);
  });

  test("multi-line string round-trips through blockScalarFolded, keeping `>`", () => {
    const value = "line one\nline two";
    const dumped = serializeYamlValue(value, "blockScalarFolded");
    expect(dumped.startsWith(">")).toBe(true);
    const reparsed = tryParseFrontMatter(`---\nnotes: ${dumped}\n---`);
    expect(reparsed?.notes).toBe(value);
  });

  test("blockSequence round-trips item order and 2-space indent", () => {
    const value = ["one", "two", "three"];
    const dumped = serializeYamlValue(value, "blockSequence");
    expect(dumped).toBe("\n  - one\n  - two\n  - three");
    const reparsed = tryParseFrontMatter(`---\ntags: ${dumped}\n---`);
    expect(reparsed?.tags).toEqual(value);
  });

  test("empty array serializes without erroring and round-trips", () => {
    // js-yaml collapses an empty sequence to flow `[]` even under
    // `flowLevel: -1` — the one case where a `blockSequence`-shaped value's
    // own dump isn't actually block-style. Still round-trips correctly.
    const dumped = serializeYamlValue([], "blockSequence");
    expect(dumped).toBe("[]");
    const reparsed = tryParseFrontMatter(`---\ntags: ${dumped}\n---`);
    expect(reparsed?.tags).toEqual([]);
  });

  test("empty string block scalar serializes without erroring", () => {
    const dumped = serializeYamlValue("", "blockScalarLiteral");
    const reparsed = tryParseFrontMatter(`---\nnotes: ${dumped}\n---`);
    expect(reparsed?.notes).toBe("");
  });
});

describe("tryParseFrontMatter", () => {
  test("valid YAML object", () => {
    expect(tryParseFrontMatter("---\nstatus: draft\n---")).toEqual({
      status: "draft",
    });
  });

  test("invalid YAML returns undefined", () => {
    expect(tryParseFrontMatter("---\nstatus: [unterminated\n---")).toBe(
      undefined,
    );
  });

  test("a YAML array (not an object) returns undefined", () => {
    expect(tryParseFrontMatter("---\n- a\n- b\n---")).toBe(undefined);
  });

  test("empty body returns undefined", () => {
    expect(tryParseFrontMatter("---\n---")).toBe(undefined);
  });
});
