import { useEffect, useState } from "preact/hooks";
import { isolateHistory } from "@codemirror/commands";
import type { Client } from "../client.ts";
import {
  findFrontmatterBlock,
  type FrontmatterBlock,
} from "../codemirror/frontmatter_folding.ts";
import {
  type FrontMatterFieldSpan,
  locateFrontMatterFields,
  stripFrontMatterFences,
  tryParseFrontMatter,
} from "../lib/frontmatter_yaml.ts";
import "./m3e-jsx.d.ts";

// 2026-09-22 (frontmatter read-only-gate + raw-YAML-card task, live
// direction from Jack — replaces the earlier per-field structured editor
// this file used to build, §3/§4 of docs/plans/2026-09-22-appbar-large-
// frontmatter-scroll-snap.md/L4.1-L4.4): "frontmatter should only be
// editable when it's not in readonly mode. in editable mode, it should just
// be the yaml in a card or something." Two confirmed decisions (asked
// directly rather than guessed, given the size of the change — this ripped
// out a real, working, previously-tested click-to-edit scalar/flow input,
// list-row sequence editor, nested-YAML mapping/block-scalar textareas, and
// add/remove-property affordances):
//  1. Editable (non-read-only) mode: ONE plain textarea holding the whole
//     block's raw YAML text, in a card — `FrontMatterEditableCard` below.
//  2. Read-only mode: the nicer icon+key+value row list stays, but every
//     interactive affordance (click-to-edit, add/remove, edit-as-YAML) is
//     gone — `FrontMatterReadOnlyList` below, plain display only.
// The whole structured-editor machinery this replaced (per-shape commit
// paths, the Enter/blur double-commit race guard, the focused-row echo-
// guard) is gone with it — a single whole-block textarea only has one
// editing session at a time and one commit trigger (blur), so none of that
// class of bug is reachable here by construction.
//
// Ported into main (CS-8, core-shell decomposition) with the two
// `@m3e/web/{icon,textarea-autosize}` self-imports stripped — this file
// has a sibling `.test.ts` run under vitest's DOM-less `node` environment,
// where importing an `@m3e/web/*` module at module scope crashes on load
// (lit-html's module-load side effect touches `document.createTreeWalker`).
// Registration moves to `client/editor_ui.tsx`, the browser-only app root.

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

/** A field's value exactly as written in the document — the RAW source
 * text of `[field.valueFrom, field.valueTo)`, trimmed, NOT
 * `String(parsedValue)`. Defect fix (2026-09-22 live verification): js-yaml
 * parses a `date:` value into a JS `Date`, and `String(date)` produces the
 * full `Date.toString()` form (`Sun Sep 20 2026 19:00:00 GMT-0500 ...`) —
 * both visually wrong AND, since `Date.toString()` renders in the browser's
 * local timezone, capable of showing the WRONG CALENDAR DAY relative to
 * what's actually written in the document. Slicing the document's own text
 * keeps the panel faithful to whatever the user actually typed for ANY
 * scalar or block shape alike, with no per-type special-casing. */
function rawValueText(client: Client, field: FrontMatterFieldSpan): string {
  return client.editorView.state.sliceDoc(field.valueFrom, field.valueTo)
    .trim();
}

/** One non-interactive row in the read-only list: icon, key, raw value
 * text. Block shapes (sequence/mapping/block-scalar) render their raw
 * multi-line YAML text as-is via `white-space: pre-wrap`
 * (`.sb-fm-value-multiline`, top.scss) — no per-shape rendering logic
 * needed, unlike the old structured editors, since nothing here is
 * editable. */
function FrontMatterReadOnlyRow(
  { client, field }: { client: Client; field: FrontMatterFieldSpan },
) {
  const isMultiline = field.shape !== "scalar" && field.shape !== "flow";
  return (
    <div className="sb-fm-row" data-shape={field.shape}>
      <m3e-icon className="sb-fm-icon" name={iconForKey(field.key)}></m3e-icon>
      <span className="sb-fm-key">{field.key}</span>
      <span
        className={isMultiline
          ? "sb-fm-value sb-fm-value-multiline"
          : "sb-fm-value"}
      >
        {rawValueText(client, field)}
      </span>
    </div>
  );
}

function FrontMatterReadOnlyList(
  { client, block }: { client: Client; block: FrontmatterBlock },
) {
  const fields = locateFrontMatterFields(client.editorView.state, block);
  return (
    <div className="sb-fm-panel">
      {fields.map((field) => (
        <FrontMatterReadOnlyRow key={field.key} client={client} field={field} />
      ))}
    </div>
  );
}

/**
 * The whole-block raw-YAML editable card. Shows `stripFrontMatterFences`'d
 * inner text (the fences themselves aren't user-editable — they're
 * structural, not content); on blur, re-wraps with `---`/`---` and
 * validates the FULL candidate block through `tryParseFrontMatter` before
 * splicing `[block.from, block.to]` — same validate-before-dispatch
 * discipline the old per-field commit paths used (and `PageNameEditor`,
 * top_bar.tsx), just at whole-block granularity now instead of per-field.
 *
 * `draft` holds the in-progress edit locally so a keystroke doesn't have to
 * survive a full commit round-trip; reset to `null` after a successful
 * commit so the textarea falls back to the freshly-derived live-doc text on
 * the very next render (picking up e.g. a `refresh()` retriggered by this
 * same dispatch via `frontMatterSyncExtension`, or any later external doc
 * change) rather than staying stuck on stale local state indefinitely.
 */
function FrontMatterEditableCard(
  { client, block }: { client: Client; block: FrontmatterBlock },
) {
  const liveInnerText = () =>
    stripFrontMatterFences(
      client.editorView.state.sliceDoc(block.from, block.to),
    );
  const [draft, setDraft] = useState<string | null>(null);
  const textareaId = "sb-fm-yaml-textarea";

  const commit = (text: string) => {
    const candidate = `---\n${text.replace(/\n+$/, "")}\n---`;
    if (tryParseFrontMatter(candidate) === undefined) {
      client.ui.flashNotification(
        "Couldn't save front matter — invalid YAML",
        "error",
      );
      return;
    }
    client.editorView.dispatch({
      changes: { from: block.from, to: block.to, insert: candidate },
      // Same undo-grouping annotation the old per-field commits used — a
      // front-matter edit should undo as one step, not merge into whatever
      // edit history the body happens to be in.
      annotations: [isolateHistory.of("full")],
    });
    setDraft(null);
  };

  return (
    <div className="sb-fm-panel">
      <textarea
        id={textareaId}
        className="sb-fm-yaml-textarea"
        value={draft ?? liveInnerText()}
        onInput={(e) =>
          setDraft((e.currentTarget as HTMLTextAreaElement).value)}
        onBlur={(e) => commit((e.currentTarget as HTMLTextAreaElement).value)}
      >
      </textarea>
      <m3e-textarea-autosize for={textareaId} min-rows={2}>
      </m3e-textarea-autosize>
    </div>
  );
}

/**
 * The frontmatter panel (§3 of docs/plans/2026-09-22-appbar-large-
 * frontmatter-scroll-snap.md, redesigned 2026-09-22 per Jack's direct
 * "readonly-gated raw-YAML-card" ask above). Re-derives the current
 * frontmatter block from the LIVE CM parse (never `currentPageMeta()`,
 * which lags a save+reindex round-trip behind whatever's actually been
 * typed) and stays in sync via `frontMatterSyncExtension` (client/
 * codemirror/frontmatter_folding.ts) — registered unconditionally in
 * `createEditorState`'s static extension list, the same way
 * `frontmatterFoldingExtension` already is, NOT via a one-time
 * `StateEffect.appendConfig` call from this component's mount effect: both
 * `content_manager.ts`'s `navigateWithinPage` and `client.ts`'s own boot
 * load a page via `editorView.setState(...)` (a full state replacement),
 * which would silently drop an `appendConfig`-appended extension on the
 * very first navigation. Instead this component just assigns
 * `client.onFrontMatterChanged = refresh` once on mount — a stable field on
 * the long-lived `Client` (client.ts) that `frontMatterSyncExtension` reads
 * dynamically, so it keeps working across every subsequent state swap.
 *
 * Renders `null` when there's no frontmatter block at all — no empty card.
 */
export function FrontMatterPanel(
  { client, readOnly }: { client: Client; readOnly: boolean },
) {
  const deriveBlock = () =>
    client.editorView ? findFrontmatterBlock(client.editorView.state) : undefined;
  const [block, setBlock] = useState<FrontmatterBlock | undefined>(
    deriveBlock,
  );

  const refresh = () => setBlock(deriveBlock());

  useEffect(() => {
    // Re-derive once mounted for real: `deriveBlock`'s initial synchronous
    // call above (in `useState`'s lazy initializer) may have run before
    // `client.editorView` existed yet — `client.ts`'s boot sequence calls
    // `this.ui.render(this.parent)` (which mounts this panel synchronously
    // during that very render) BEFORE the next line constructs
    // `this.editorView = new EditorView(...)`. A no-op (re-derives the same
    // block) on every render after the first, and in every test that
    // mounts a `client` mock whose `editorView` already exists at
    // construction time.
    refresh();
    // See this function's own doc comment for why this stable-field
    // pattern is used instead of appending the sync extension here.
    client.onFrontMatterChanged = refresh;
  }, [client]);

  if (!block) return null;

  return readOnly
    ? <FrontMatterReadOnlyList client={client} block={block} />
    : <FrontMatterEditableCard client={client} block={block} />;
}
