import { useEffect, useRef, useState } from "preact/hooks";
import { isolateHistory } from "@codemirror/commands";
import { unfoldEffect } from "@codemirror/language";
import YAML from "js-yaml";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import "@m3e/web/textarea-autosize";
import type { Client } from "../client.ts";
import {
  findFrontmatterBlock,
  type FrontmatterBlock,
  frontmatterKeyLinePos,
} from "../codemirror/frontmatter_folding.ts";
import {
  type FrontMatterFieldSpan,
  locateFrontMatterFields,
  serializeYamlValue,
  tryParseFrontMatter,
} from "../lib/frontmatter_yaml.ts";
import "./m3e-jsx.d.ts";

// §3 of docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md: a
// small fixed lookup, not meant to be exhaustive — unknown keys fall back
// to the default icon.
function iconForKey(key: string): string {
  switch (key) {
    case "tags":
      return "sell";
    case "date":
    case "created":
      return "calendar_today";
    case "author":
      return "person";
    default:
      return "label";
  }
}

/** How a scalar/flow field's value is shown when not being edited — the
 * RAW source text of `[field.valueFrom, field.valueTo)`, trimmed, NOT
 * `String(parsedValue)`. Defect fix (2026-09-22 live verification): js-yaml
 * parses a `date:` value into a JS `Date`, and `String(date)` produces the
 * full `Date.toString()` form (`Sun Sep 20 2026 19:00:00 GMT-0500 ...`) —
 * both visually wrong AND, since `Date.toString()` renders in the browser's
 * local timezone, capable of showing the WRONG CALENDAR DAY relative to
 * what's actually written in the document. Slicing the document's own text
 * keeps the panel faithful to whatever the user actually typed for ANY
 * scalar (not just dates — this also stops lossy re-formatting of numbers,
 * quoted strings, etc.) and needs no per-type special-casing. Block shapes
 * (sequence/mapping/scalar) never call this — each has its own structured
 * editor (`BlockSequenceEditor`/`BlockMappingEditor`/`BlockScalarEditor`
 * below) that already works from the parsed `value`, which is fine there:
 * a `date` can only appear as a top-level scalar in practice, and each of
 * those editors is reconstructing a list/mapping/decoded-string shape, not
 * stringifying a single scalar. */
function rawValueText(client: Client, field: FrontMatterFieldSpan): string {
  return client.editorView.state.sliceDoc(field.valueFrom, field.valueTo)
    .trim();
}

/** Turns an edited flow-field's raw text (e.g. `[journal, retro]`,
 * `{name: Jack}` — same bracketed/braced syntax `rawValueText` now displays
 * it in) back into a JS value to hand `commitFieldEdit`, which re-dumps it
 * through `serializeYamlValue`. The text is already valid standalone YAML
 * flow syntax (that's what qualified it as `shape === "flow"` in the first
 * place, per `classifyShape`), so `YAML.load` parses it directly — no
 * bracket-stripping/comma-splitting needed. Falls back to the raw text
 * (which `tryParseFrontMatter` will then reject as invalid, surfacing the
 * usual error toast) if the user's edit isn't valid YAML on its own. */
function parseFlowInput(text: string): unknown {
  try {
    return YAML.load(text);
  } catch {
    return text;
  }
}

/**
 * Splices `newValueText` into `[field.valueFrom, field.valueTo)`, validating
 * BEFORE dispatching: re-parses the WHOLE block with the candidate text
 * spliced in, not just the one field, catching cases where the new value's
 * own YAML is fine in isolation but breaks the surrounding document.
 * Mirrors PageNameEditor's own commit-with-catch pattern (top_bar.tsx)
 * rather than trusting the edit optimistically. This is the one mechanism
 * EVERY shape's commit path funnels through — `commitFieldEdit` (scalar,
 * flow, blockSequence, blockScalar*) and `commitBlockMappingEdit` (the one
 * shape that skips `serializeYamlValue`, see its own doc comment) both call
 * this directly rather than duplicating the validate-then-dispatch dance.
 */
function writeFieldValueText(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
  newValueText: string,
): boolean {
  const state = client.editorView.state;
  const candidateBlockText = state.sliceDoc(block.from, field.valueFrom) +
    newValueText +
    state.sliceDoc(field.valueTo, block.to);
  if (tryParseFrontMatter(candidateBlockText) === undefined) {
    client.ui.flashNotification(
      `Couldn't save "${field.key}" — invalid YAML`,
      "error",
    );
    return false;
  }
  client.editorView.dispatch({
    changes: {
      from: field.valueFrom,
      to: field.valueTo,
      insert: newValueText,
    },
    // Same undo-grouping annotation content_manager.ts's setEditorText /
    // applyExternalPatches already use — a front-matter field edit should
    // undo as one step, not merge into whatever edit history the body
    // happens to be in.
    annotations: [isolateHistory.of("full")],
  });
  return true;
}

/**
 * Edits a single field's value and writes it back to the live CM document —
 * the writeback path every shape EXCEPT `blockMapping` funnels through
 * (L4.2/L4.3): scalar, flow, blockSequence, and both block-scalar shapes
 * alike, since `serializeYamlValue` already knows how to dump each of
 * those. `blockMapping` uses `commitBlockMappingEdit` instead — see its own
 * doc comment for why.
 */
export function commitFieldEdit(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
  newRawValue: unknown,
): boolean {
  const newValueText = serializeYamlValue(newRawValue, field.shape);
  return writeFieldValueText(client, block, field, newValueText);
}

/**
 * `blockMapping`'s own commit path — deliberately NOT `serializeYamlValue`.
 * Per §4/L4.3's scope line, a block mapping is edited via a raw nested-YAML
 * textarea (its source text as-is), not decomposed into a recursive
 * property-row UI — so there is no structured JS value to hand
 * `serializeYamlValue`, only the textarea's own edited text. Validates the
 * textarea's raw text IN ISOLATION first (a cheap early rejection of
 * obviously-broken YAML, e.g. inconsistent internal indentation) before the
 * expensive whole-block splice-and-reparse `writeFieldValueText` already
 * does — then re-indents every line by 2 spaces (the nesting level under a
 * top-level key) and splices.
 */
export function commitBlockMappingEdit(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
  textareaText: string,
): boolean {
  try {
    const parsed = YAML.load(textareaText);
    if (parsed !== null && typeof parsed !== "object") {
      throw new Error("not a mapping");
    }
  } catch {
    client.ui.flashNotification(
      `Couldn't save "${field.key}" — invalid YAML`,
      "error",
    );
    return false;
  }
  const reindented = "\n" + textareaText
    .split("\n")
    .map((line) => (line.length > 0 ? "  " + line : line))
    .join("\n");
  return writeFieldValueText(client, block, field, reindented);
}

/** The per-row "Edit as YAML" escape hatch (all shapes) — unfolds the raw
 * frontmatter block and places the cursor at this field's own key line,
 * the same affordance L3's fold-placeholder click already gives. Kept as a
 * fallback alongside every shape's structured control (not instead of it)
 * for the rare case a shape's editor can't represent something the user
 * needs (a YAML anchor/alias, a comment inside a block value, a style this
 * plan's classifier mis-detects). */
export function editFieldAsRawYaml(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
): void {
  const state = client.editorView.state;
  const keyLinePos = frontmatterKeyLinePos(state, block, field.key) ??
    field.lineFrom;
  client.editorView.dispatch({
    effects: unfoldEffect.of({ from: block.from, to: block.to }),
    selection: { anchor: keyLinePos },
  });
  client.editorView.focus();
}

export type FrontMatterRowProps = {
  field: FrontMatterFieldSpan;
  value: unknown;
  client: Client;
  block: FrontmatterBlock;
  /** The key of the row currently being edited across the whole panel, or
   * `null` — lifted to the parent (rather than kept as this row's own
   * state) so the panel's doc<->list sync (L4.4) can skip re-rendering
   * whichever row is actively mid-edit without needing shape-specific
   * logic of its own. */
  editingKey: string | null;
  onEditingKeyChange: (key: string | null) => void;
  /** Called after a successful commit so the parent can re-derive rows
   * from the freshly-dispatched document state. */
  onCommitted: () => void;
  /** How many fields the frontmatter block currently has — threaded down
   * so the delete button knows whether removing THIS field would remove
   * the last one (L4.4's "remove the whole block, with confirmation"
   * path). Omitted in standalone-row tests/usages that don't need a
   * delete button at all (no callback below, no button rendered). */
  remainingFieldCount?: number;
  /** Called after a successful remove so the parent can re-derive rows. */
  onRemoved?: () => void;
};

/** Plain scalar or single-line flow value — the only two shapes this leaf
 * (L4.2) wires up; block shapes render read-only until L4.3 gives them
 * their own per-shape editor controls. */
function ScalarOrFlowValue(
  { field, client, block, editingKey, onEditingKeyChange, onCommitted }:
    FrontMatterRowProps,
) {
  const isEditing = editingKey === field.key;
  const escapedRef = useRef(false);
  // Guards against a second commit for the SAME edit session. Root cause
  // (2026-09-22 live verification, data-corruption bug): confirming via
  // Enter (`onConfirm`) calls `commitFieldEdit`, which dispatches a CM
  // transaction; `frontMatterSyncExtension` (client/codemirror/
  // frontmatter_folding.ts) runs its update listener SYNCHRONOUSLY inside
  // that very `dispatch()` call, invoking `client.onFrontMatterChanged` —
  // i.e. this panel's `refresh()` — before `commit` even reaches its own
  // `onEditingKeyChange(null)` line. Once `onEditingKeyChange(null)` does
  // run, Preact's next (same-tick, microtask-scheduled) re-render unmounts
  // this `<Input>` because `isEditing` has gone false. Removing a FOCUSED
  // element from the DOM makes the browser fire a native `blur` on it as
  // part of that same removal — which this component's own `onBlur` handler
  // (still attached during teardown) receives, re-running `commit` with
  // `e.currentTarget.value` (unchanged DOM text, e.g. "journal, verified")
  // against the STALE closed-over `field` span (`field.valueFrom`/
  // `valueTo`), which the first commit's own dispatch has already shifted.
  // Splicing the same text in again at now-wrong offsets is what produces
  // the duplicate ("journal, verified, verified"). Same Enter/blur race
  // `PageNameEditor` (top_bar.tsx) already solved with its `committing`
  // ref — mirrored here as a simpler one-shot latch: this component has no
  // async gap to guard (unlike `PageNameEditor`'s awaited `onRename`), so
  // once a commit has fired for this edit session, every later call
  // (blur-after-Enter, or Escape's own guarded path) is a no-op. Reset back
  // to `false` whenever a fresh edit session starts.
  const committedRef = useRef(false);
  useEffect(() => {
    if (isEditing) committedRef.current = false;
  }, [isEditing]);

  const commit = (text: string) => {
    if (committedRef.current) return;
    committedRef.current = true;
    const newValue = field.shape === "flow" ? parseFlowInput(text) : text;
    const ok = commitFieldEdit(client, block, field, newValue);
    onEditingKeyChange(null);
    if (ok) onCommitted();
  };

  if (!isEditing) {
    return (
      <span
        className="sb-fm-value"
        tabIndex={0}
        onClick={() => onEditingKeyChange(field.key)}
      >
        {rawValueText(client, field)}
      </span>
    );
  }

  return (
    <Input
      bare
      class="sb-fm-value-input"
      autofocus
      value={rawValueText(client, field)}
      onConfirm={(text) => commit(text)}
      onExit={() => {
        escapedRef.current = true;
        onEditingKeyChange(null);
      }}
      onBlur={(e) => {
        if (escapedRef.current) {
          escapedRef.current = false;
          return;
        }
        commit((e.currentTarget as HTMLInputElement).value);
      }}
    />
  );
}

/** Notion-style list-row editor for a `blockSequence` field. Reordering
 * existing items is NOT supported in this pass (§4/L4.3 — a reorder-by-drag
 * control is a materially separate feature, a natural follow-up rather
 * than silently missing). On any item's add/edit/delete, reconstructs the
 * full JS array from the currently-rendered item rows (in their current DOM
 * order) and commits through `commitFieldEdit` — `serializeYamlValue`
 * (L4.1) produces the multi-line `- item` YAML for it. */
function BlockSequenceEditor(
  { field, value, client, block, onCommitted }: FrontMatterRowProps,
) {
  const items = Array.isArray(value) ? value.map((item) => String(item)) : [];
  // Local draft buffer so a keystroke in one row doesn't have to survive a
  // full commit round-trip before the next keystroke can land; committed
  // (and re-synced from the freshly re-parsed doc) on blur/add/remove.
  const [draft, setDraft] = useState<string[] | null>(null);
  const current = draft ?? items;

  const commit = (next: string[]) => {
    setDraft(next);
    if (commitFieldEdit(client, block, field, next)) onCommitted();
  };

  return (
    <div className="sb-fm-block-sequence">
      {current.map((item, index) => (
        <div className="sb-fm-seq-row" key={index}>
          <input
            className="sb-fm-seq-item-input"
            value={item}
            onInput={(e) => {
              const next = [...current];
              next[index] = (e.currentTarget as HTMLInputElement).value;
              setDraft(next);
            }}
            onBlur={() => commit(current)}
          />
          <m3e-icon-button
            title={`Remove ${item || "item"}`}
            aria-label={`Remove ${item || "item"}`}
            onClick={() => commit(current.filter((_, i) => i !== index))}
          >
            <m3e-icon name="close"></m3e-icon>
          </m3e-icon-button>
        </div>
      ))}
      <button
        type="button"
        className="sb-fm-seq-add"
        onClick={() => commit([...current, ""])}
      >
        <m3e-icon name="add"></m3e-icon>
        Add item
      </button>
    </div>
  );
}

/** Raw nested-YAML textarea for a `blockMapping` field — a deliberate scope
 * line, not decomposed into a recursive property-row UI (§4/L4.3). Shows
 * the nested block's YAML source text as-is; commits via
 * `commitBlockMappingEdit`, which re-indents and validates before
 * splicing. */
function BlockMappingEditor(
  { field, value, client, block, onCommitted }: FrontMatterRowProps,
) {
  const sourceText = typeof value === "object" && value !== null
    ? YAML.dump(value, { indent: 2 }).trimEnd()
    : "";
  const [draft, setDraft] = useState<string | null>(null);
  const textareaId = `sb-fm-textarea-${field.key}`;

  return (
    <div className="sb-fm-block-mapping">
      <textarea
        id={textareaId}
        className="sb-fm-block-mapping-textarea"
        value={draft ?? sourceText}
        onInput={(e) =>
          setDraft((e.currentTarget as HTMLTextAreaElement).value)}
        onBlur={(e) => {
          const text = (e.currentTarget as HTMLTextAreaElement).value;
          if (commitBlockMappingEdit(client, block, field, text)) {
            onCommitted();
          }
        }}
      >
      </textarea>
      <m3e-textarea-autosize for={textareaId} min-rows={2}>
      </m3e-textarea-autosize>
    </div>
  );
}

/** Textarea for a `blockScalarLiteral`/`blockScalarFolded` field, showing
 * the DECODED multi-line string (real newlines, not the raw `|`-fenced YAML
 * source). Commits through the normal `commitFieldEdit` path —
 * `serializeYamlValue` (L4.1) re-encodes with the field's own indicator
 * forced, so editing a `|` value can never silently turn it into a `>`
 * value or vice versa. */
function BlockScalarEditor(
  { field, value, client, block, onCommitted }: FrontMatterRowProps,
) {
  const decoded = typeof value === "string" ? value : "";
  const [draft, setDraft] = useState<string | null>(null);
  const textareaId = `sb-fm-textarea-${field.key}`;

  return (
    <div className="sb-fm-block-scalar">
      <textarea
        id={textareaId}
        className="sb-fm-block-scalar-textarea"
        value={draft ?? decoded}
        onInput={(e) =>
          setDraft((e.currentTarget as HTMLTextAreaElement).value)}
        onBlur={(e) => {
          const text = (e.currentTarget as HTMLTextAreaElement).value;
          if (commitFieldEdit(client, block, field, text)) onCommitted();
        }}
      >
      </textarea>
      <m3e-textarea-autosize for={textareaId} min-rows={2}>
      </m3e-textarea-autosize>
    </div>
  );
}

/** All-shapes escape hatch — see `editFieldAsRawYaml`'s own doc comment. */
function EditAsYamlButton(
  { field, client, block }: Pick<FrontMatterRowProps, "field" | "client" | "block">,
) {
  return (
    <m3e-icon-button
      className="sb-fm-edit-as-yaml"
      title="Edit as YAML"
      aria-label={`Edit "${field.key}" as raw YAML`}
      onClick={() => editFieldAsRawYaml(client, block, field)}
    >
      <m3e-icon name="code"></m3e-icon>
    </m3e-icon-button>
  );
}

function StructuredValue(props: FrontMatterRowProps) {
  switch (props.field.shape) {
    case "blockSequence":
      return <BlockSequenceEditor {...props} />;
    case "blockMapping":
      return <BlockMappingEditor {...props} />;
    case "blockScalarLiteral":
    case "blockScalarFolded":
      return <BlockScalarEditor {...props} />;
    default:
      return null;
  }
}

export function FrontMatterRow(props: FrontMatterRowProps) {
  const { field, client, block, remainingFieldCount, onRemoved } = props;
  const isStructuredShape = field.shape !== "scalar" && field.shape !== "flow";

  return (
    <div className="sb-fm-row" data-shape={field.shape}>
      <m3e-icon className="sb-fm-icon" name={iconForKey(field.key)}></m3e-icon>
      <span className="sb-fm-key">{field.key}</span>
      {isStructuredShape
        ? <StructuredValue {...props} />
        : <ScalarOrFlowValue {...props} />}
      <EditAsYamlButton field={field} client={client} block={block} />
      {remainingFieldCount !== undefined && (
        <m3e-icon-button
          className="sb-fm-remove"
          title={`Remove "${field.key}"`}
          aria-label={`Remove "${field.key}"`}
          onClick={() => {
            removeProperty(client, block, field, remainingFieldCount).then(
              (removed) => {
                if (removed) onRemoved?.();
              },
            );
          }}
        >
          <m3e-icon name="delete"></m3e-icon>
        </m3e-icon-button>
      )}
    </div>
  );
}

/**
 * Inserts a new `key: \n` line immediately before the block's closing
 * `---` fence. Rejects (with a `flashNotification`) a key name that
 * case-sensitively collides with an existing one, rather than dispatching a
 * transaction that would silently shadow the earlier key.
 */
export function insertNewProperty(
  client: Client,
  block: FrontmatterBlock,
  key: string,
): boolean {
  const state = client.editorView.state;
  const existing = tryParseFrontMatter(state.sliceDoc(block.from, block.to));
  if (existing && Object.prototype.hasOwnProperty.call(existing, key)) {
    client.ui.flashNotification(`"${key}" already exists`, "error");
    return false;
  }
  // NOTE — deviates from this leaf's own illustrative snippet, which
  // computed this as `doc.lineAt(Math.max(block.from, block.to - 4)).from`
  // ("---\n" is 4 chars). Verified against this codebase's real
  // `findFrontmatterBlock`/CM `Line` semantics: `block.to` is the closing
  // fence LINE's own end offset, NOT one-past-its-trailing-newline — so
  // `block.to - 4` under-shoots by landing on the newline that terminates
  // the PRECEDING line instead of inside the closing "---" itself (CM's
  // `lineAt` attributes a line-terminating newline's own position to the
  // line it terminates, not the line after it — confirmed empirically:
  // this produced a real bug, insertNewProperty prepending before the
  // FIRST key instead of before the closing fence). `block.to - 1` always
  // lands on the closing fence's own last literal `-` character (or, if
  // `block.to` ever did include the trailing newline, on that newline
  // itself — which the same CM convention still attributes to the closing
  // fence's line) — robust either way, unlike the snippet's fixed offset.
  const closingLineStart = state.doc.lineAt(
    Math.max(block.from, block.to - 1),
  ).from;
  client.editorView.dispatch({
    changes: { from: closingLineStart, insert: `${key}: \n` },
    annotations: [isolateHistory.of("full")],
  });
  return true;
}

/**
 * Removes a field's own full line span (`field.lineFrom`/`lineTo`, from
 * L4.1) — deleting a line can't produce invalid YAML on its own. The one
 * exception: if this is the LAST remaining field, deleting just its line
 * would leave a technically-empty (`tryParseFrontMatter`-invalid)
 * frontmatter block rather than no frontmatter at all. That case is
 * treated as "remove the whole page's frontmatter" instead (the entire
 * `---`-delimited block, fences included), gated behind
 * `client.ui.confirm` rather than silently producing the empty-block edge
 * case. Returns a promise resolving to whether a removal actually
 * happened (`false` if the confirm was declined) — the caller uses this to
 * decide whether to re-derive its rows.
 */
export async function removeProperty(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
  remainingFieldCount: number,
): Promise<boolean> {
  if (remainingFieldCount > 1) {
    client.editorView.dispatch({
      changes: { from: field.lineFrom, to: field.lineTo, insert: "" },
      annotations: [isolateHistory.of("full")],
    });
    return true;
  }
  const confirmed = await client.ui.confirm(
    `Remove all front matter from this page? "${field.key}" is the last property.`,
    { destructive: true },
  );
  if (!confirmed) return false;
  const state = client.editorView.state;
  client.editorView.dispatch({
    changes: {
      from: block.from,
      to: Math.min(block.to + 1, state.doc.length),
      insert: "",
    },
    annotations: [isolateHistory.of("full")],
  });
  return true;
}

/** Trailing "+ Add property" row (L4.4). Prompts for a key name via the
 * same `client.ui.prompt` mechanism `PageNameEditor`/basic_modals.tsx's
 * `Prompt` component is already wired to elsewhere in this app. */
export function AddPropertyRow({ client, block, onAdded }: {
  client: Client;
  block: FrontmatterBlock;
  onAdded: () => void;
}) {
  const activate = async () => {
    const key = await client.ui.prompt("New property name");
    if (!key) return; // cancelled
    if (insertNewProperty(client, block, key)) onAdded();
  };
  return (
    <button type="button" className="sb-fm-add-property" onClick={activate}>
      <m3e-icon name="add"></m3e-icon>
      Add property
    </button>
  );
}

/** The focused-row echo-guard (L4.4), factored out as a small pure
 * function so it works identically for every L4.3 control type without
 * needing shape-specific logic: given the freshly re-derived rows (from
 * re-parsing the live doc after ANY change — the panel's own edit, a
 * manual hand-edit, a remote sync, or an undo) and whichever row is
 * currently mid-edit, keeps that ONE row's previous value in place while
 * every other row updates live. This is what stops an unrelated concurrent
 * doc change from blowing away a block-sequence's in-progress item edits,
 * a block-mapping/block-scalar textarea's in-progress text, or a plain
 * scalar input's in-progress keystrokes alike — the guard only cares about
 * "which key is active," never how that key's control represents its
 * value. */
export function reconcileEditingRow<T extends { key: string }>(
  freshRows: T[],
  previousRows: T[],
  editingKey: string | null,
): T[] {
  if (editingKey === null) return freshRows;
  return freshRows.map((row) => {
    if (row.key !== editingKey) return row;
    const previous = previousRows.find((p) => p.key === editingKey);
    return previous ?? row;
  });
}

type FrontMatterRowData = {
  key: string;
  field: FrontMatterFieldSpan;
  value: unknown;
};

/** Re-derives the current frontmatter block + its rows from the LIVE CM
 * parse (§1.4 — never `currentPageMeta()`, which lags a save+reindex
 * round-trip behind whatever's actually been typed). Single source both
 * the panel's initial render and every `onFrontMatterChanged`-triggered
 * refresh call through, so "how rows are computed" only has one
 * implementation. */
function deriveFrontMatterRows(
  client: Client,
): { block: FrontmatterBlock | undefined; rows: FrontMatterRowData[] } {
  // `client.editorView` is declared non-optional (`editorView!: EditorView`
  // in client.ts) but is genuinely `undefined` for one real window: `client.
  // ts`'s boot sequence calls `this.ui.render(this.parent)` (which mounts
  // this panel via L5's `<FrontMatterPanel>` and runs this function inside
  // `useState`'s lazy initializer, synchronously, during that very render)
  // BEFORE the very next line constructs `this.editorView = new
  // EditorView(...)`. Guard here rather than deferring the whole
  // computation into an effect (tried first — broke every
  // preact-render-to-string test in this file, which mounts a `client` mock
  // that already has `editorView` set and expects the first synchronous
  // render to already show real rows, no effect flush available under SSR-
  // style rendering). `FrontMatterPanel`'s mount effect below still calls
  // `refresh()` once mounted for real, picking up the real editorView.
  if (!client.editorView) return { block: undefined, rows: [] };
  const state = client.editorView.state;
  const block = findFrontmatterBlock(state);
  if (!block) return { block: undefined, rows: [] };
  const parsed = tryParseFrontMatter(state.sliceDoc(block.from, block.to));
  const fields = locateFrontMatterFields(state, block);
  return {
    block,
    rows: fields.map((field) => ({
      key: field.key,
      field,
      value: parsed?.[field.key],
    })),
  };
}

/**
 * The inline, editable frontmatter property list (§3/§4 of
 * docs/plans/2026-09-22-appbar-large-frontmatter-scroll-snap.md). With
 * L4.1-L4.4's pieces in hand this is mostly composition: derive rows from
 * the live CM parse, wire each row to the editing/add/remove behaviors
 * those leaves already built, and keep the list in sync with the document
 * via `frontMatterSyncExtension` (client/codemirror/frontmatter_folding.ts)
 * — registered unconditionally in `createEditorState`'s static extension
 * list (client/codemirror/editor_state.ts), the same way
 * `frontmatterFoldingExtension` already is, NOT via a one-time
 * `StateEffect.appendConfig` call from this component's mount effect: both
 * `content_manager.ts`'s `navigateWithinPage` and `client.ts`'s own boot
 * load a page via `editorView.setState(...)` (a full state replacement
 * built fresh from `createEditorState`), which would silently drop an
 * `appendConfig`-appended extension on the very first navigation. Instead
 * this component just assigns `client.onFrontMatterChanged = refresh` once
 * on mount — a stable field on the long-lived `Client` (client.ts) that
 * `frontMatterSyncExtension` reads dynamically, so it keeps working across
 * every subsequent state swap.
 *
 * Renders `null` when there's no frontmatter block at all — no empty card.
 */
export function FrontMatterPanel({ client }: { client: Client }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [{ block, rows: freshRows }, setDerived] = useState(() =>
    deriveFrontMatterRows(client)
  );
  const previousRowsRef = useRef<FrontMatterRowData[]>(freshRows);

  const refresh = () => setDerived(deriveFrontMatterRows(client));

  useEffect(() => {
    // Re-derive once mounted for real: `deriveFrontMatterRows`'s initial
    // synchronous call above (in `useState`'s lazy initializer) may have
    // run before `client.editorView` existed yet (see that function's own
    // comment) and returned the empty placeholder — this picks up the real
    // frontmatter once `client.ts`'s boot sequence has actually constructed
    // the editor. A no-op (re-derives the same rows) on every render after
    // the first, and in every test that mounts a `client` mock whose
    // `editorView` already exists at construction time.
    refresh();
    // Register this instance's `refresh` as the callback
    // `frontMatterSyncExtension` (registered once, unconditionally, in
    // `createEditorState`) invokes on every doc change that touches the
    // frontmatter block — see this function's own doc comment for why a
    // stable field on `client` is used instead of appending the extension
    // here. No cleanup: this panel is expected to live for as long as its
    // editor does (L5 mounts it once, alongside <TopBar>, not conditionally
    // per-render) — same lifetime assumption `frontmatterFoldingExtension`
    // already makes.
    client.onFrontMatterChanged = refresh;
  }, [client]);

  const rows = reconcileEditingRow(freshRows, previousRowsRef.current, editingKey);
  previousRowsRef.current = rows;

  if (!block) return null;

  return (
    <div className="sb-fm-panel">
      {rows.map((row) => (
        <FrontMatterRow
          key={row.key}
          field={row.field}
          value={row.value}
          client={client}
          block={block}
          editingKey={editingKey}
          onEditingKeyChange={setEditingKey}
          onCommitted={refresh}
          remainingFieldCount={rows.length}
          onRemoved={refresh}
        />
      ))}
      <AddPropertyRow client={client} block={block} onAdded={refresh} />
    </div>
  );
}
