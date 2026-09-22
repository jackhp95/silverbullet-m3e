import { useRef, useState } from "preact/hooks";
import { isolateHistory } from "@codemirror/commands";
import YAML from "js-yaml";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import type { Client } from "../client.ts";
import type { FrontmatterBlock } from "../codemirror/frontmatter_folding.ts";
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
 * Edits a single field's value and writes it back to the live CM document —
 * the single writeback path every value shape funnels through (L4.2/L4.3).
 * Validates BEFORE dispatching: splices the candidate text into the WHOLE
 * block and re-parses it, not just the one field, catching cases where the
 * new value's own YAML is fine in isolation but breaks the surrounding
 * document. Mirrors PageNameEditor's own commit-with-catch pattern
 * (top_bar.tsx) rather than trusting the edit optimistically.
 */
export function commitFieldEdit(
  client: Client,
  block: FrontmatterBlock,
  field: FrontMatterFieldSpan,
  newRawValue: unknown,
): boolean {
  const state = client.editorView.state;
  const newValueText = serializeYamlValue(newRawValue, field.shape);
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

export function FrontMatterRow(props: FrontMatterRowProps) {
  const { field, value } = props;
  const isStructuredShape = field.shape !== "scalar" && field.shape !== "flow";

  return (
    <div className="sb-fm-row" data-shape={field.shape}>
      <m3e-icon className="sb-fm-icon" name={iconForKey(field.key)}></m3e-icon>
      <span className="sb-fm-key">{field.key}</span>
      {isStructuredShape
        ? (
          // L4.3 gives each block shape its own editor control; until then
          // (and as this leaf's own test coverage confirms) the value
          // renders read-only rather than silently pretending to be
          // editable via the scalar input.
          <span className="sb-fm-value sb-fm-value-readonly">
            {displayValue(value, field.shape)}
          </span>
        )
        : <ScalarOrFlowValue {...props} />}
    </div>
  );
}
