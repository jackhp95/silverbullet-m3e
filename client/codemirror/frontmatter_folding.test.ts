import { EditorState } from "@codemirror/state";
import { describe, expect, test } from "vitest";
import { buildExtendedMarkdownLanguage } from "../markdown_parser/parser.ts";
import {
  defaultFrontmatterFoldingConfig,
  findFrontmatterBlock,
  frontmatterFoldingExtension,
  frontmatterKeyLinePos,
  frontmatterFoldPlaceholderDOM,
  frontmatterFoldPlaceholderText,
  frontmatterFoldTags,
  frontmatterFoldTagTarget,
  normalizeFrontmatterFoldingConfig,
  prepareFrontmatterFoldPlaceholder,
  selectionIntersectsRange,
  shouldAutoFoldFrontmatter,
} from "./frontmatter_folding.ts";
import type { EditorView } from "@codemirror/view";
import { foldService } from "@codemirror/language";

function stateWithDoc(doc: string, selection = 0) {
  return EditorState.create({
    doc,
    selection: { anchor: selection },
    extensions: [buildExtendedMarkdownLanguage()],
  });
}

describe("frontmatter folding config", () => {
  test("uses defaults when config is missing", () => {
    expect(normalizeFrontmatterFoldingConfig(undefined)).toEqual(
      defaultFrontmatterFoldingConfig,
    );
  });

  test("returns a fresh default config copy", () => {
    expect(normalizeFrontmatterFoldingConfig(undefined)).not.toBe(
      defaultFrontmatterFoldingConfig,
    );
  });

  test("accepts never, long, and always fold policies", () => {
    expect(
      normalizeFrontmatterFoldingConfig({ foldByDefault: "never" })
        .foldByDefault,
    ).toBe("never");
    expect(
      normalizeFrontmatterFoldingConfig({ foldByDefault: "long" })
        .foldByDefault,
    ).toBe("long");
    expect(
      normalizeFrontmatterFoldingConfig({ foldByDefault: "always" })
        .foldByDefault,
    ).toBe("always");
  });

  test("falls back for invalid values", () => {
    expect(
      normalizeFrontmatterFoldingConfig({
        foldByDefault: "sometimes",
        foldByDefaultLines: 0,
      }),
    ).toEqual(defaultFrontmatterFoldingConfig);
  });

  test("keeps valid partial overrides", () => {
    expect(
      normalizeFrontmatterFoldingConfig({
        enabled: false,
        foldByDefault: "always",
        foldByDefaultLines: 12,
      }),
    ).toEqual({
      foldByDefault: "always",
      foldByDefaultLines: 12,
    });
  });
});

describe("frontmatter folding defaults", () => {
  test("documents the TypeScript default values", () => {
    expect(defaultFrontmatterFoldingConfig).toEqual({
      foldByDefault: "long",
      foldByDefaultLines: 5,
    });
  });
});

describe("frontmatter block policy", () => {
  test("finds the top frontmatter block and counts marker-inclusive lines", () => {
    const state = stateWithDoc("---\na: 1\nb: 2\n---\nBody");

    expect(findFrontmatterBlock(state)).toEqual({
      from: 0,
      to: 17,
      lines: 4,
    });
  });

  test("does not find malformed frontmatter", () => {
    const state = stateWithDoc("---\na: 1\nBody");

    expect(findFrontmatterBlock(state)).toBeUndefined();
  });

  test("detects selections intersecting the frontmatter range", () => {
    const state = stateWithDoc("---\na: 1\n---\nBody", 5);
    expect(selectionIntersectsRange(state, 0, 12)).toBe(true);
    expect(selectionIntersectsRange(state, 13, 17)).toBe(false);
  });

  test("uses half-open range boundaries for cursors", () => {
    expect(selectionIntersectsRange(stateWithDoc("abcdef", 1), 1, 4)).toBe(
      true,
    );
    expect(selectionIntersectsRange(stateWithDoc("abcdef", 3), 1, 4)).toBe(
      true,
    );
    expect(selectionIntersectsRange(stateWithDoc("abcdef", 4), 1, 4)).toBe(
      false,
    );
  });

  test("uses half-open range boundaries for non-empty selections", () => {
    const selectionEndingAtFrom = EditorState.create({
      doc: "abcdef",
      selection: { anchor: 0, head: 1 },
    });
    const selectionStartingAtTo = EditorState.create({
      doc: "abcdef",
      selection: { anchor: 4, head: 5 },
    });
    const selectionOverlappingRange = EditorState.create({
      doc: "abcdef",
      selection: { anchor: 3, head: 5 },
    });

    expect(selectionIntersectsRange(selectionEndingAtFrom, 1, 4)).toBe(false);
    expect(selectionIntersectsRange(selectionStartingAtTo, 1, 4)).toBe(false);
    expect(selectionIntersectsRange(selectionOverlappingRange, 1, 4)).toBe(
      true,
    );
  });

  // V5b (2026-09-22): frontmatter now always auto-folds while the selection
  // is outside it, regardless of "never"/"long"/"always" — the inline
  // property list (FrontMatterPanel, L4) is the only rendering of
  // frontmatter a reader sees now, so the old per-policy opt-outs no longer
  // have a chip placeholder to opt out of.
  test("always folds regardless of policy or line count, when selection is outside", () => {
    for (const foldByDefault of ["never", "long", "always"] as const) {
      expect(
        shouldAutoFoldFrontmatter({
          config: { ...defaultFrontmatterFoldingConfig, foldByDefault },
          lines: 1,
          selectionInside: false,
        }),
      ).toBe(true);
      expect(
        shouldAutoFoldFrontmatter({
          config: {
            ...defaultFrontmatterFoldingConfig,
            foldByDefault,
            foldByDefaultLines: 100,
          },
          lines: 200,
          selectionInside: false,
        }),
      ).toBe(true);
    }
  });

  test("never folds while the selection is inside the block, regardless of policy", () => {
    for (const foldByDefault of ["never", "long", "always"] as const) {
      expect(
        shouldAutoFoldFrontmatter({
          config: { ...defaultFrontmatterFoldingConfig, foldByDefault },
          lines: 20,
          selectionInside: true,
        }),
      ).toBe(false);
    }
  });
});

describe("frontmatterKeyLinePos", () => {
  test("finds a top-level scalar key's line start", () => {
    const doc = "---\nstatus: draft\ntags: [a, b]\n---\nBody";
    const state = stateWithDoc(doc);
    const block = findFrontmatterBlock(state)!;

    expect(frontmatterKeyLinePos(state, block, "status")).toBe(
      doc.indexOf("status: draft"),
    );
    expect(frontmatterKeyLinePos(state, block, "tags")).toBe(
      doc.indexOf("tags: [a, b]"),
    );
  });

  test("returns undefined for a key that doesn't exist in the block", () => {
    const doc = "---\nstatus: draft\n---\nBody";
    const state = stateWithDoc(doc);
    const block = findFrontmatterBlock(state)!;

    expect(frontmatterKeyLinePos(state, block, "missing")).toBeUndefined();
  });

  test("skips indented continuation lines of a block value, matching only the top-level key", () => {
    const doc =
      "---\nowner:\n  name: Jack\n  email: j@x.com\ntags:\n  - one\n---\nBody";
    const state = stateWithDoc(doc);
    const block = findFrontmatterBlock(state)!;

    // "name" only appears as an indented continuation line under "owner" —
    // it must not be matched as a top-level key.
    expect(frontmatterKeyLinePos(state, block, "name")).toBeUndefined();
    expect(frontmatterKeyLinePos(state, block, "owner")).toBe(
      doc.indexOf("owner:"),
    );
    expect(frontmatterKeyLinePos(state, block, "tags")).toBe(
      doc.indexOf("tags:"),
    );
  });
});

describe("frontmatter fold placeholder", () => {
  const domTest = typeof document === "undefined" ? test.skip : test;

  test("returns frontmatter line count for a matching fold range", () => {
    const state = stateWithDoc("---\na: 1\nb: 2\n---\nBody");

    expect(
      prepareFrontmatterFoldPlaceholder(state, { from: 0, to: 17 }),
    ).toEqual({
      type: "frontmatter",
      from: 0,
      to: 17,
      editPos: 4,
      lines: 4,
      tags: [],
    });
  });

  test("extracts folded frontmatter tags from scalar and list values", () => {
    expect(frontmatterFoldTags("---\ntags: feature beta\n---")).toEqual([
      "feature",
      "beta",
    ]);
    expect(frontmatterFoldTags("---\ntags:\n- feature\n- beta\n---")).toEqual([
      "feature",
      "beta",
    ]);
    expect(frontmatterFoldTags("---\ntags: [feature, beta]\n---")).toEqual([
      "feature",
      "beta",
    ]);
  });

  test("resolves folded frontmatter tags to configured tag pages", () => {
    expect(frontmatterFoldTagTarget(undefined, "feature")).toBe("tag:feature");
    expect(
      frontmatterFoldTagTarget(
        {
          config: {
            get(path: unknown, defaultValue: unknown) {
              expect(path).toEqual(["tags", "feature", "tagPage"]);
              expect(defaultValue).toBe(null);
              return "Tags/Feature";
            },
          },
        } as any,
        "feature",
      ),
    ).toBe("Tags/Feature");
  });

  test("returns generic placeholder data for non-frontmatter ranges", () => {
    const state = stateWithDoc("# Heading\n\nBody");

    expect(
      prepareFrontmatterFoldPlaceholder(state, { from: 0, to: 9 }),
    ).toEqual({ type: "generic" });
  });

  test("omits visible placeholder text for folded frontmatter", () => {
    expect(
      frontmatterFoldPlaceholderText({
        type: "frontmatter",
        from: 0,
        to: 17,
        editPos: 4,
        lines: 4,
        tags: [],
      }),
    ).toBe("");
    expect(frontmatterFoldPlaceholderText({ type: "generic" })).toBe("…");
  });

  // V5b (2026-09-22): frontmatter is now fully hidden instead of rendered as
  // a chip placeholder — FrontMatterPanel (L4) is the only rendering of
  // frontmatter a reader sees. These tests now assert the placeholder is
  // empty (no tag chips, no "N lines hidden" status text), replacing the
  // old tag-chip-rendering assertions.
  domTest(
    "renders an empty placeholder for folded frontmatter, even with tags present",
    () => {
      const placeholder = frontmatterFoldPlaceholderDOM(
        { state: { phrase: (phrase: string) => phrase } } as EditorView,
        () => {},
        {
          type: "frontmatter",
          from: 0,
          to: 17,
          editPos: 4,
          lines: 4,
          tags: ["feature", "beta"],
        },
      );

      expect(placeholder.textContent).toBe("");
      expect(placeholder.childElementCount).toBe(0);
      expect(placeholder.classList.contains("cm-foldPlaceholder")).toBe(true);
      expect(
        placeholder.classList.contains("cm-frontmatterFoldPlaceholder"),
      ).toBe(true);
    },
  );

  domTest(
    "clicking folded frontmatter empty space places the cursor inside it",
    () => {
      const dispatches: any[] = [];
      const placeholder = frontmatterFoldPlaceholderDOM(
        {
          state: { phrase: (phrase: string) => phrase },
          dispatch(transaction: unknown) {
            dispatches.push(transaction);
          },
          focus() {},
        } as EditorView,
        () => {},
        {
          type: "frontmatter",
          from: 0,
          to: 17,
          editPos: 4,
          lines: 4,
          tags: ["feature"],
        },
      );

      placeholder.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

      expect(dispatches).toHaveLength(1);
      expect(dispatches[0].selection).toEqual({ anchor: 4 });
    },
  );

  domTest("renders the generic placeholder for non-frontmatter folds", () => {
    const placeholder = frontmatterFoldPlaceholderDOM(
      { state: { phrase: (phrase: string) => phrase } } as EditorView,
      () => {},
      { type: "generic" },
    );

    expect(placeholder.textContent).toBe("…");
  });
});

describe("frontmatter folding extension", () => {
  function clientWithFrontmatterFolding(config: unknown) {
    return {
      config: {
        get(path: string, defaultValue: unknown) {
          expect(path).toBe("frontmatterFolding");
          expect(defaultValue).toBe(defaultFrontmatterFoldingConfig);
          return config;
        },
      },
    };
  }

  function stateWithExtension(doc: string, config: unknown, selection = 0) {
    return EditorState.create({
      doc,
      selection: { anchor: selection },
      extensions: [
        buildExtendedMarkdownLanguage(),
        frontmatterFoldingExtension(
          clientWithFrontmatterFolding(config) as any,
        ),
      ],
    });
  }

  test("does not expose additional frontmatter section fold services", () => {
    const doc = "---\naliases:\n  - one\n  - two\n---\nBody";
    const state = stateWithExtension(doc, {});

    expect(state.facet(foldService)).toHaveLength(0);
  });
});
