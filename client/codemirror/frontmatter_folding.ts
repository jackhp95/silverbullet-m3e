import {
  ensureSyntaxTree,
  foldEffect,
  syntaxTree,
  unfoldEffect,
} from "@codemirror/language";
import type { EditorState, Extension } from "@codemirror/state";
import { type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import YAML from "js-yaml";
import type { Client } from "../client.ts";
import { tagPrefix } from "../../plugs/index/constants.ts";
// NOTE: no `m3e-assist-chip`/ref-navigation imports here — V5b (2026-09-22)
// removed the folded-frontmatter tag-chip placeholder; frontmatterFoldTags/
// frontmatterFoldTagTarget stay (still exported + tested), but nothing in
// this file renders them into DOM anymore.

export type FrontmatterFoldByDefault = "never" | "long" | "always";

export type FrontmatterFoldingConfig = {
  foldByDefault: FrontmatterFoldByDefault;
  foldByDefaultLines: number;
};

export const defaultFrontmatterFoldingConfig: FrontmatterFoldingConfig = {
  foldByDefault: "long",
  foldByDefaultLines: 5,
};

export type FrontmatterBlock = {
  from: number;
  to: number;
  lines: number;
};

type FoldRange = {
  from: number;
  to: number;
};

export type FrontmatterFoldPlaceholder =
  | {
      type: "frontmatter";
      from: number;
      to: number;
      editPos: number;
      lines: number;
      tags: string[];
    }
  | { type: "generic" };

function frontmatterParseUpto(state: EditorState): number {
  const firstLine = state.doc.line(1);
  if (firstLine.text.trimEnd() !== "---") {
    return firstLine.to;
  }

  for (let lineNumber = 2; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    if (line.text.trimEnd() === "---") {
      return line.to;
    }
  }

  return state.doc.length;
}

function isFrontmatterFoldByDefault(
  value: unknown,
): value is FrontmatterFoldByDefault {
  return value === "never" || value === "long" || value === "always";
}

export function normalizeFrontmatterFoldingConfig(
  value: unknown,
): FrontmatterFoldingConfig {
  if (!value || typeof value !== "object") {
    return { ...defaultFrontmatterFoldingConfig };
  }

  const config = value as Record<string, unknown>;
  return {
    foldByDefault: isFrontmatterFoldByDefault(config.foldByDefault)
      ? config.foldByDefault
      : defaultFrontmatterFoldingConfig.foldByDefault,
    foldByDefaultLines:
      typeof config.foldByDefaultLines === "number" &&
      Number.isInteger(config.foldByDefaultLines) &&
      config.foldByDefaultLines > 0
        ? config.foldByDefaultLines
        : defaultFrontmatterFoldingConfig.foldByDefaultLines,
  };
}

export function findFrontmatterBlock(
  state: EditorState,
): FrontmatterBlock | undefined {
  let block: FrontmatterBlock | undefined;

  const tree =
    ensureSyntaxTree(state, frontmatterParseUpto(state)) ?? syntaxTree(state);

  tree.iterate({
    enter(node) {
      if (node.name !== "FrontMatter") {
        return;
      }

      const startLine = state.doc.lineAt(node.from);
      const endLine = state.doc.lineAt(Math.max(node.from, node.to - 1));
      block = {
        from: node.from,
        to: node.to,
        lines: endLine.number - startLine.number + 1,
      };
      return false;
    },
  });

  return block;
}

/**
 * Locates the document position of a top-level frontmatter key's own line
 * (the `key:` line itself, not any indented continuation of a block value)
 * inside `block`. Returns `undefined` if the block has no such key. Used by
 * `FrontMatterPanel` (L4) to move the cursor to a specific key's line when
 * a property row is activated — a line-based scan, deliberately not a
 * structural YAML-position API, matching the "ad-hoc but honest" approach
 * `findFrontmatterBlock` and `content_manager.ts`'s `frontMatterRegex`
 * already take elsewhere in this codebase.
 */
export function frontmatterKeyLinePos(
  state: EditorState,
  block: FrontmatterBlock,
  key: string,
): number | undefined {
  const startLine = state.doc.lineAt(block.from).number;
  const endLine = state.doc.lineAt(Math.max(block.from, block.to - 1)).number;
  for (let lineNumber = startLine + 1; lineNumber < endLine; lineNumber++) {
    const line = state.doc.line(lineNumber);
    if (/^[ \t]/.test(line.text)) {
      continue; // indented continuation line of a prior key's block value
    }
    const match = /^([\w.$-]+):/.exec(line.text);
    if (match && match[1] === key) {
      return line.from;
    }
  }
  return undefined;
}

export function selectionIntersectsRange(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  return state.selection.ranges.some((range) => {
    if (range.empty) {
      return range.from >= from && range.from < to;
    }
    return range.from < to && range.to > from;
  });
}

// V5b (2026-09-22): frontmatter always auto-folds while the selection is
// outside it, regardless of the space's `"never"/"long"/"always"` config —
// the inline property list (FrontMatterPanel, L4) is now the only rendering
// of frontmatter a reader sees, so the old "don't fold at all" opt-out no
// longer has a chip-placeholder to opt out of. `config`/`lines` are kept in
// the signature (rather than narrowed away) so callers and the config type
// itself don't need to change shape for a behavior that may become
// configurable again later.
export function shouldAutoFoldFrontmatter(args: {
  config: FrontmatterFoldingConfig;
  lines: number;
  selectionInside: boolean;
}): boolean {
  return !args.selectionInside;
}

export function prepareFrontmatterFoldPlaceholder(
  state: EditorState,
  range: FoldRange,
): FrontmatterFoldPlaceholder {
  const block = findFrontmatterBlock(state);
  if (block && block.from === range.from && block.to === range.to) {
    return {
      type: "frontmatter",
      from: block.from,
      to: block.to,
      editPos: state.doc.lineAt(block.from).to + 1,
      lines: block.lines,
      tags: frontmatterFoldTags(state.sliceDoc(block.from, block.to)),
    };
  }
  return { type: "generic" };
}

function normalizeFoldTag(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return;
  }
  const tag = value.trim().replace(/^#/, "");
  return tag.length > 0 ? tag : undefined;
}

function normalizeFoldTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeFoldTag).filter((tag) => tag !== undefined);
  }
  if (typeof value === "string") {
    return value
      .split(/\s+/)
      .map(normalizeFoldTag)
      .filter((tag) => tag !== undefined);
  }
  return [];
}

export function frontmatterFoldTags(frontmatterText: string): string[] {
  const yamlText = frontmatterText
    .replace(/^---[ \t]*(?:\r?\n|$)/, "")
    .replace(/(?:\r?\n)?---[ \t]*$/, "");
  try {
    const parsed = YAML.load(yamlText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }
    return normalizeFoldTags((parsed as Record<string, unknown>).tags);
  } catch {
    return [];
  }
}

export function frontmatterFoldPlaceholderText(
  prepared: FrontmatterFoldPlaceholder,
): string {
  if (prepared.type === "frontmatter") {
    return "";
  }
  return "…";
}

export function frontmatterFoldTagTarget(
  client: Client | undefined,
  tag: string,
): string {
  return (
    client?.config.get<string | null>(["tags", tag, "tagPage"], null) ??
    `${tagPrefix}${tag}`
  );
}

export function frontmatterFoldPlaceholderDOM(
  view: EditorView,
  onclick: (event: Event) => void,
  prepared: FrontmatterFoldPlaceholder,
  client?: Client,
): HTMLElement {
  const element = document.createElement("span");
  element.className = "cm-foldPlaceholder";
  element.onclick = onclick;
  element.setAttribute("aria-label", view.state.phrase("folded code"));
  element.title = view.state.phrase("unfold");

  if (prepared.type === "frontmatter") {
    // V5b (2026-09-22): fully hide frontmatter instead of a chip placeholder
    // — the inline property list (FrontMatterPanel, L4) is now the only
    // rendering of frontmatter a reader sees, so this placeholder paints
    // nothing (no tag chips, no "N lines hidden" status text). The
    // click-to-unfold wiring is unchanged: clicking the (empty) placeholder
    // still unfolds the range and places the cursor at `editPos`, which
    // remains the fallback affordance for block-style values a structured
    // editor can't represent (§4/L4.3's "Edit as YAML" escape hatch).
    element.classList.add("cm-frontmatterFoldPlaceholder");
    element.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    element.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      view.dispatch({
        effects: unfoldEffect.of({ from: prepared.from, to: prepared.to }),
        selection: { anchor: prepared.editPos },
      });
      view.focus();
    };
    return element;
  }
  element.textContent = frontmatterFoldPlaceholderText(prepared);

  return element;
}

function clientFrontmatterFoldingConfig(
  client: Client,
): FrontmatterFoldingConfig {
  return normalizeFrontmatterFoldingConfig(
    client.config.get("frontmatterFolding", defaultFrontmatterFoldingConfig),
  );
}

export function frontmatterFoldingExtension(client: Client): Extension {
  return ViewPlugin.fromClass(
    class {
      private destroyed = false;

      constructor(private view: EditorView) {
        queueMicrotask(() => {
          if (this.destroyed) {
            return;
          }
          this.foldInitialFrontmatter();
        });
      }

      update(_update: ViewUpdate): void {}

      destroy(): void {
        this.destroyed = true;
      }

      private foldInitialFrontmatter(): void {
        if (this.destroyed) {
          return;
        }

        const block = findFrontmatterBlock(this.view.state);
        if (!block) {
          return;
        }

        const config = clientFrontmatterFoldingConfig(client);
        if (
          shouldAutoFoldFrontmatter({
            config,
            lines: block.lines,
            selectionInside: selectionIntersectsRange(
              this.view.state,
              block.from,
              block.to,
            ),
          })
        ) {
          this.view.dispatch({
            effects: foldEffect.of({ from: block.from, to: block.to }),
          });
        }
      }
    },
  );
}
