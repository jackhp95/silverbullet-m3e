// Pure parse/locate/serialize logic backing FrontMatterPanel's inline
// editing (L4 of docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md).
// Kept out of the component so it's unit-testable without DOM/Preact —
// matches this repo's client/lib/ convention of small, focused, directly
// testable modules.
//
// Field spans are located by a line-based scan of the frontmatter block's
// raw text, not a structural YAML-position API — js-yaml's `YAML.load()`
// gives values but not source positions, and adopting a full YAML-position-
// tracking library would be a real dependency addition out of proportion to
// this feature. This is the same "ad-hoc but honest" approach
// `findFrontmatterBlock` and `content_manager.ts`'s `frontMatterRegex`
// already take elsewhere in this codebase.
import type { EditorState } from "@codemirror/state";
import YAML from "js-yaml";
import type { FrontmatterBlock } from "../codemirror/frontmatter_folding.ts";

export type FrontMatterFieldShape =
  | "scalar" // `status: draft`
  | "flow" // single-line `tags: [journal, retro]` / `owner: {name: Jack}`
  | "blockSequence" // `tags:\n  - journal\n  - retro`
  | "blockMapping" // `owner:\n  name: Jack\n  email: j@x.com`
  | "blockScalarLiteral" // `notes: |\n  line one\n  line two`
  | "blockScalarFolded"; // `notes: >\n  line one\n  line two`

export type FrontMatterFieldSpan = {
  key: string;
  shape: FrontMatterFieldShape;
  /**
   * Absolute CM doc offset where the value text starts. For `scalar`/`flow`
   * this is right after `key: ` on the key's own line. For every block
   * shape this is ALSO right after `key:` on the key's own line (including
   * any inline block-scalar indicator, ` |`/` >`) — the full multi-line
   * value, indicator included, is one contiguous replaceable span; there is
   * no separate "header span" vs "body span".
   */
  valueFrom: number;
  /**
   * Absolute CM doc offset where the value text ends. For `scalar`/`flow`,
   * end of the key's own line. For a block shape, extended through the END
   * of the LAST line that is still part of this value — i.e. the last line
   * before either a new top-level key (indentation returns to 0) or the
   * block's closing `---`.
   */
  valueTo: number;
  /** Absolute CM doc offset of the key's line start (for delete-property). */
  lineFrom: number;
  /**
   * Absolute CM doc offset of the END of this field's full span, including
   * its trailing newline — for `scalar`/`flow` this is the key's own line
   * + 1; for a block shape this is `valueTo` + 1 (or `state.doc.length` if
   * the block is the very last thing before EOF). Used by delete-property.
   */
  lineTo: number;
  /** Convenience flag — `true` for any of the four block shapes above. */
  isBlockValue: boolean;
};

const KEY_LINE = /^([\w.$-]+):[ \t]?(.*)$/;
const BLOCK_SCALAR_INDICATOR = /^[|>][+-]?\d*$/;

function lineIndent(text: string): number {
  return text.match(/^[ \t]*/)![0].length;
}

/**
 * Scans forward from a key's line to find where its block-style value ends
 * — the "ad-hoc but honest" dedent rule this codebase already uses
 * elsewhere: a line belongs to the current key's block value if it's blank
 * AND followed eventually by more indented content, OR indented deeper than
 * column 0 (top-level frontmatter keys are always at column 0, so ANY
 * indentation marks a continuation line). A run of trailing blank lines
 * immediately before the closing `---` or the next top-level key is NOT
 * part of the value — implemented by only advancing `lastContentLine` on an
 * actually-indented line, so trailing blank lines are naturally excluded
 * from `valueTo` without needing a separate lookahead pass.
 */
function blockValueEndLine(
  state: EditorState,
  keyLineNumber: number,
  blockEndLineNumber: number, // the line number of the closing `---`
): number {
  let lastContentLine = keyLineNumber;
  for (let n = keyLineNumber + 1; n < blockEndLineNumber; n++) {
    const line = state.doc.line(n);
    if (line.text.trim().length === 0) continue; // tentative — only counts if a later indented line follows
    if (lineIndent(line.text) === 0) break; // next top-level key
    lastContentLine = n;
  }
  return lastContentLine;
}

function classifyShape(
  inlineValue: string,
  firstContinuationText: string | undefined,
): FrontMatterFieldShape {
  const trimmed = inlineValue.trim();
  if (BLOCK_SCALAR_INDICATOR.test(trimmed)) {
    return trimmed[0] === "|" ? "blockScalarLiteral" : "blockScalarFolded";
  }
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return "flow";
  if (trimmed.length > 0) return "scalar";
  // Empty inline value: a block sequence/mapping follows on subsequent
  // indented lines — peek at the first continuation line's own shape.
  const firstTrimmed = firstContinuationText?.trim() ?? "";
  return firstTrimmed.startsWith("- ") || firstTrimmed === "-"
    ? "blockSequence"
    // Default when there's no continuation at all either (an empty/null
    // value) — treated as an empty block mapping, which FrontMatterPanel
    // (L4.5) renders as an empty editable group rather than erroring.
    : "blockMapping";
}

export function locateFrontMatterFields(
  state: EditorState,
  block: FrontmatterBlock,
): FrontMatterFieldSpan[] {
  const fields: FrontMatterFieldSpan[] = [];
  const startLine = state.doc.lineAt(block.from).number;
  const endLine = state.doc.lineAt(Math.max(block.from, block.to - 1)).number;
  // Skip the opening `---` (startLine) and closing `---` (endLine).
  for (let n = startLine + 1; n < endLine; n++) {
    const line = state.doc.line(n);
    if (lineIndent(line.text) > 0) continue; // continuation line of a prior block value, already consumed below
    const match = KEY_LINE.exec(line.text);
    if (!match) continue;
    const [, key, inlineValue] = match;
    const firstContinuation = n + 1 < endLine
      ? state.doc.line(n + 1).text
      : undefined;
    const shape = classifyShape(inlineValue, firstContinuation);
    const isBlockValue = shape !== "scalar" && shape !== "flow";
    const endLineForField = isBlockValue
      ? blockValueEndLine(state, n, endLine)
      : n;
    const fieldEndLine = state.doc.line(endLineForField);
    const keyColonLength = key.length + 1; // "key:"
    const hasInlineSpace = line.text[keyColonLength] === " ";
    fields.push({
      key,
      shape,
      valueFrom: line.from + keyColonLength + (hasInlineSpace ? 1 : 0),
      valueTo: fieldEndLine.to,
      lineFrom: line.from,
      lineTo: Math.min(fieldEndLine.to + 1, state.doc.length),
      isBlockValue,
    });
    if (isBlockValue) n = endLineForField; // skip past the continuation lines already claimed
  }
  return fields;
}

/**
 * Forces js-yaml to pick the requested block-scalar indicator (`|` literal
 * vs `>` folded) for a multi-line string. NOTE — this deviates from this
 * plan leaf's own illustrative snippet, which assumed js-yaml's `styles:
 * {"!!str": "literal" | "folded"}` dump option controls this. Verified
 * against the real pinned `js-yaml@4.1.1`: the built-in `tag:yaml.org,2002:str`
 * type registers no `represent` map (only custom/explicit types do,
 * `node_modules/js-yaml/dist/js-yaml.mjs`'s `detectType`), so `styleMap`
 * (built from the `styles` option) is never consulted for plain JS strings
 * — `styles` is silently inert here, confirmed by direct `node -e` probing.
 * The snippet was wrong, not this test/behavior. The real, verified lever
 * is `lineWidth`: js-yaml's `chooseScalarStyle` only ever emits
 * `STYLE_FOLDED` when `lineWidth !== -1` AND at least one line exceeds it
 * ("foldable"); otherwise multi-line strings always dump `STYLE_LITERAL`.
 * So: `lineWidth: -1` (disables width tracking) reliably forces literal
 * regardless of line length, and `lineWidth: 1` (every non-empty line
 * exceeds it) reliably forces folded — both verified round-tripping
 * correctly back through `YAML.load` for long lines, short lines, and
 * multi-line values alike.
 */
function blockScalarLineWidth(shape: "blockScalarLiteral" | "blockScalarFolded"): number {
  return shape === "blockScalarFolded" ? 1 : -1;
}

/**
 * Dumps a value for splicing back in as `key:<this>`, using js-yaml's own
 * dumper rather than hand-rolled quoting/indentation rules — dumping a
 * one-key object and stripping the synthetic key back off, so js-yaml's
 * real escaping/indentation logic runs unmodified.
 *  - `scalar`/`flow` → single line (`flowLevel: 1`).
 *  - `blockSequence`/`blockMapping` → block style (`flowLevel: -1`),
 *    2-space indent (js-yaml's default block indent, verified to match this
 *    repo's own frontmatter convention).
 *  - `blockScalarLiteral`/`blockScalarFolded` → `flowLevel: -1` plus the
 *    `lineWidth` trick above so editing an existing `|` value can't
 *    silently flip it to `>` (or vice versa).
 */
export function serializeYamlValue(
  value: unknown,
  shape: FrontMatterFieldShape,
): string {
  const isBlock = shape !== "scalar" && shape !== "flow";
  const isBlockScalar = shape === "blockScalarLiteral" ||
    shape === "blockScalarFolded";
  const dumped = YAML.dump({ __v: value }, {
    flowLevel: isBlock ? -1 : 1,
    lineWidth: isBlockScalar ? blockScalarLineWidth(shape) : undefined,
  });
  // `locateFrontMatterFields` positions `valueFrom` right after `key:` PLUS
  // one inline space when the doc actually has one there — true whenever
  // there's inline content right after the colon (a scalar/flow value, or a
  // block scalar's ` |`/` >` indicator), and a no-op for block
  // sequence/mapping keys (`key:` with nothing but a newline after it, so
  // there's no inline space to consume in the first place). Stripping
  // `^__v: ?` here mirrors that uniformly across every shape, so the
  // dumped text always lines up with wherever `valueFrom` actually points
  // for that shape.
  const withoutKey = dumped.replace(/^__v: ?/, "");
  return withoutKey.trimEnd();
}

/**
 * Strips the leading/trailing `---` fence lines off a full frontmatter
 * block's raw text, leaving just the inner YAML. Shared by
 * `tryParseFrontMatter` (below) and `FrontMatterEditableCard`
 * (front_matter_panel.tsx, 2026-09-22 raw-YAML-card task) — the card shows
 * this same inner text as the editable textarea's value, so both must agree
 * on exactly what counts as "the YAML" versus "the fences".
 */
export function stripFrontMatterFences(rawBlockText: string): string {
  return rawBlockText
    .replace(/^---[ \t]*(?:\r?\n|$)/, "")
    .replace(/(?:\r?\n)?---[ \t]*$/, "");
}

/**
 * Re-parses a candidate full frontmatter block text and returns the parsed
 * object, or `undefined` if it's invalid YAML — the writeback validation
 * gate (L4.2, and `FrontMatterEditableCard`'s own commit path) always calls
 * this on the SPLICED result before dispatching a CM transaction, never
 * trusts the edit blind.
 */
export function tryParseFrontMatter(
  rawBlockText: string,
): Record<string, unknown> | undefined {
  const yamlText = stripFrontMatterFences(rawBlockText);
  try {
    const parsed = YAML.load(yamlText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
