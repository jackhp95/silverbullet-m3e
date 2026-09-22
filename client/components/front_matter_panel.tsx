import { useRef, useState } from "preact/hooks";
import { isolateHistory } from "@codemirror/commands";
import { unfoldEffect } from "@codemirror/language";
import YAML from "js-yaml";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import "@m3e/web/textarea-autosize";
import type { Client } from "../client.ts";
import {
  type FrontmatterBlock,
  frontmatterKeyLinePos,
} from "../codemirror/frontmatter_folding.ts";
import {
  type FrontMatterFieldShape,
  type FrontMatterFieldSpan,
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

/** How a field's current parsed value is shown when not being edited. */
function displayValue(value: unknown, shape: FrontMatterFieldShape): string {
  if (value === undefined || value === null) return "";
  if (shape === "flow" && Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  if (shape === "flow" && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return String(value);
}

/** Turns an edited flow-field's comma-joined display text back into a raw
 * value to hand `commitFieldEdit`. Arrays are the common case (tags); a
 * flow object is re-parsed as YAML flow-mapping syntax so `k: v, k2: v2`
 * keeps working, falling back to the raw text (which `tryParseFrontMatter`
 * will then reject as invalid, surfacing the usual error toast) if that
 * fails outright. */
function parseFlowInput(text: string, originalValue: unknown): unknown {
  if (Array.isArray(originalValue)) {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  try {
    return YAML.load(`{${text}}`);
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
};

/** Plain scalar or single-line flow value — the only two shapes this leaf
 * (L4.2) wires up; block shapes render read-only until L4.3 gives them
 * their own per-shape editor controls. */
function ScalarOrFlowValue(
  { field, value, client, block, editingKey, onEditingKeyChange, onCommitted }:
    FrontMatterRowProps,
) {
  const isEditing = editingKey === field.key;
  const escapedRef = useRef(false);

  const commit = (text: string) => {
    const newValue = field.shape === "flow"
      ? parseFlowInput(text, value)
      : text;
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
        {displayValue(value, field.shape)}
      </span>
    );
  }

  return (
    <Input
      bare
      class="sb-fm-value-input"
      autofocus
      value={displayValue(value, field.shape)}
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
  const { field, client, block } = props;
  const isStructuredShape = field.shape !== "scalar" && field.shape !== "flow";

  return (
    <div className="sb-fm-row" data-shape={field.shape}>
      <m3e-icon className="sb-fm-icon" name={iconForKey(field.key)}></m3e-icon>
      <span className="sb-fm-key">{field.key}</span>
      {isStructuredShape
        ? <StructuredValue {...props} />
        : <ScalarOrFlowValue {...props} />}
      <EditAsYamlButton field={field} client={client} block={block} />
    </div>
  );
}
