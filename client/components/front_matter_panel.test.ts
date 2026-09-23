// Component-level coverage for client/components/front_matter_panel.tsx —
// FrontMatterPanel, redesigned 2026-09-22 per Jack's direct "readonly-gated
// raw-YAML-card" ask (front_matter_panel.tsx's own file-header comment has
// the full rationale, superseding the earlier per-field structured editor
// this file used to test): editable (non-read-only) mode is one plain
// textarea holding the whole block's raw YAML; read-only mode is a
// non-interactive icon+key+value row list.
//
// Seams under test:
//  - `<FrontMatterPanel>` itself, rendered with `preact-render-to-string`
//    for static structure (matches top_bar.test.ts's own pattern).
//  - The editable card's commit path (valid edit dispatches a transaction;
//    invalid YAML doesn't and flashes an error) needs a real DOM to
//    dispatch a `blur` event against — guarded by the same `domTest`
//    pattern client/codemirror/frontmatter_folding.test.ts already
//    established (`typeof document === "undefined" ? test.skip : test`),
//    and legitimately SKIPS under this repo's plain `vitest run` (no jsdom
//    environment configured in vitest.config.ts) — a pre-existing, expected
//    gap, not a regression introduced here.
//  - `frontMatterSyncExtension`'s own bidirectional doc<->panel wiring is
//    independent of this redesign (front_matter_folding.ts, unchanged) —
//    kept verbatim from the prior version of this file.
import { EditorState } from "@codemirror/state";
import { h, render as preactRender } from "preact";
import render from "preact-render-to-string";
import { describe, expect, test } from "vitest";
import { buildExtendedMarkdownLanguage } from "../markdown_parser/parser.ts";
import { frontMatterSyncExtension } from "../codemirror/frontmatter_folding.ts";
import { FrontMatterPanel } from "./front_matter_panel.tsx";
import { EditorView } from "@codemirror/view";

const domTest = typeof document === "undefined" ? test.skip : test;

function docWithFrontMatter(doc: string) {
  // The extended markdown language extension is needed so
  // `findFrontmatterBlock` (a real syntax-tree walk, used internally by
  // `<FrontMatterPanel>`) can actually locate the FrontMatter node.
  return EditorState.create({
    doc,
    extensions: [buildExtendedMarkdownLanguage()],
  });
}

function fakeClient(state: EditorState) {
  const dispatched: any[] = [];
  const flashed: { message: string; type?: string }[] = [];
  const editorView = {
    state,
    dispatch: (tx: any) => {
      dispatched.push(tx);
      if (tx.changes) {
        const newState = state.update(tx).state;
        (editorView as any).state = newState;
      }
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

describe("<FrontMatterPanel> — no frontmatter", () => {
  test("renders null (no panel at all) when there's no frontmatter block, in either mode", () => {
    const state = EditorState.create({ doc: "Just body text" });
    const { client } = fakeClient(state);

    expect(render(h(FrontMatterPanel, { client, readOnly: false }))).toBe(
      "",
    );
    expect(render(h(FrontMatterPanel, { client, readOnly: true }))).toBe(
      "",
    );
  });
});

describe("<FrontMatterPanel readOnly={false}> — editable raw-YAML card", () => {
  test("renders one textarea holding the inner YAML, fences stripped", () => {
    const state = docWithFrontMatter(
      "---\nstatus: draft\ntags: [journal, retro]\n---\nBody",
    );
    const { client } = fakeClient(state);

    const html = render(h(FrontMatterPanel, { client, readOnly: false }));

    expect(html).toContain("sb-fm-panel");
    expect(html).toContain("sb-fm-yaml-textarea");
    expect(html).toContain("status: draft");
    expect(html).toContain("tags: [journal, retro]");
    // The fences themselves are structural, not editable content.
    expect(html).not.toContain("---\nstatus");
    expect(html).toContain("m3e-textarea-autosize");
  });

  test(
    "integration fixture — every shape at once round-trips verbatim, no per-field misattribution possible",
    () => {
      // The old structured editor could misattribute one multi-line field's
      // span to a neighbor; a single whole-block textarea can't have that
      // bug class at all (there's only one span, the whole block) — this
      // just confirms the raw text really does come through unmodified.
      const doc = [
        "---",
        "title: My Page",
        "tags: [journal, retro]",
        "authors:",
        "  - jack",
        "  - alex",
        "owner:",
        "  name: Jack",
        "  email: j@x.com",
        "notes: |",
        "  line one",
        "  line two",
        "status: draft",
        "---",
        "Body",
      ].join("\n");
      const state = docWithFrontMatter(doc);
      const { client } = fakeClient(state);

      const html = render(h(FrontMatterPanel, { client, readOnly: false }));

      const innerYaml = doc.split("\n").slice(1, -2).join("\n");
      expect(html).toContain(innerYaml);
    },
  );

  domTest(
    "a valid edit, on blur, dispatches a transaction that replaces the whole block (requires real DOM)",
    () => {
      const state = docWithFrontMatter("---\nstatus: draft\n---\nBody");
      const { client } = fakeClient(state);
      const container = document.createElement("div");
      document.body.appendChild(container);

      preactRender(h(FrontMatterPanel, { client, readOnly: false }), container);

      const textarea = container.querySelector(
        ".sb-fm-yaml-textarea",
      ) as HTMLTextAreaElement;
      textarea.value = "status: final\nauthor: Jack";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("blur", { bubbles: true }));

      const resultState = client.editorView.state as EditorState;
      const doc = resultState.sliceDoc(0, resultState.doc.length);
      expect(doc).toContain("status: final");
      expect(doc).toContain("author: Jack");
      expect(doc).toContain("Body");

      document.body.removeChild(container);
    },
  );

  domTest(
    "invalid YAML on blur does not touch the doc and flashes an error (requires real DOM)",
    () => {
      const state = docWithFrontMatter("---\nstatus: draft\n---\nBody");
      const { client, dispatched, flashed } = fakeClient(state);
      const container = document.createElement("div");
      document.body.appendChild(container);

      preactRender(h(FrontMatterPanel, { client, readOnly: false }), container);

      const textarea = container.querySelector(
        ".sb-fm-yaml-textarea",
      ) as HTMLTextAreaElement;
      textarea.value = "status: [unterminated";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("blur", { bubbles: true }));

      expect(dispatched).toHaveLength(0);
      expect(flashed).toHaveLength(1);
      expect(flashed[0].type).toBe("error");
      const resultState = client.editorView.state as EditorState;
      expect(resultState.sliceDoc(0, resultState.doc.length)).toContain(
        "status: draft",
      );

      document.body.removeChild(container);
    },
  );
});

describe("<FrontMatterPanel readOnly={true}> — non-interactive row list", () => {
  test("renders one row per top-level key, in document order, with no add/remove/edit affordances", () => {
    const state = docWithFrontMatter(
      "---\nstatus: draft\ntags: [journal, retro]\n---\nBody",
    );
    const { client } = fakeClient(state);

    const html = render(h(FrontMatterPanel, { client, readOnly: true }));

    expect(html).toContain("sb-fm-panel");
    const statusIndex = html.indexOf("status");
    const tagsIndex = html.indexOf("tags");
    expect(statusIndex).toBeGreaterThan(-1);
    expect(tagsIndex).toBeGreaterThan(-1);
    expect(statusIndex).toBeLessThan(tagsIndex);
    expect(html).toContain("draft");
    expect(html).toContain("journal, retro");
    // No editable textarea, and none of the old edit/add/remove controls.
    expect(html).not.toContain("sb-fm-yaml-textarea");
    expect(html).not.toContain("sb-fm-add-property");
    expect(html).not.toContain("sb-fm-remove");
    expect(html).not.toContain("sb-fm-edit-as-yaml");
  });

  test("uses the tags icon for a `tags` key, default icon for an unmapped key", () => {
    const state = docWithFrontMatter(
      "---\nstatus: draft\ntags: [journal, retro]\n---\nBody",
    );
    const { client } = fakeClient(state);

    const html = render(h(FrontMatterPanel, { client, readOnly: true }));

    expect(html).toContain('name="sell"'); // tags
    expect(html).toContain('name="label"'); // default, for `status`
  });

  test("a `date` value displays as its raw authored text, not a stringified JS Date", () => {
    // Regression coverage: js-yaml parses a `date:` scalar into a real JS
    // `Date`; the raw-text display path (`rawValueText`) slices the
    // document's own source instead of stringifying the parsed value, so
    // this can never regress into `Date.toString()`'s
    // wrong-format/wrong-timezone output.
    const state = docWithFrontMatter("---\ndate: 2026-09-21\n---\nBody");
    const { client } = fakeClient(state);

    const html = render(h(FrontMatterPanel, { client, readOnly: true }));

    expect(html).toContain("2026-09-21");
    expect(html).not.toContain("GMT");
    expect(html).not.toContain("00:00:00");
  });

  test("block-shaped fields render their raw multi-line YAML as plain wrapped text, not a structured editor", () => {
    const doc = [
      "---",
      "authors:",
      "  - jack",
      "  - alex",
      "owner:",
      "  name: Jack",
      "  email: j@x.com",
      "notes: |",
      "  line one",
      "  line two",
      "status: draft",
      "---",
      "Body",
    ].join("\n");
    const state = docWithFrontMatter(doc);
    const { client } = fakeClient(state);

    const html = render(h(FrontMatterPanel, { client, readOnly: true }));

    expect(html).toContain("sb-fm-value-multiline");
    expect(html).toContain("jack");
    expect(html).toContain("alex");
    expect(html).toContain("name: Jack");
    expect(html).toContain("email: j@x.com");
    // Raw SOURCE text (rawValueText slices the doc, doesn't decode) — the
    // `|` indicator and indentation stay, unlike the old BlockScalarEditor's
    // decoded display. That's correct for a "raw YAML" read-only view.
    expect(html).toContain("line one");
    expect(html).toContain("line two");
    // The scalar `status` field trailing the block scalar must still be
    // its own row, not swallowed as a continuation of `notes`.
    const notesIndex = html.indexOf("line one");
    const statusValueIndex = html.lastIndexOf("draft");
    expect(notesIndex).toBeLessThan(statusValueIndex);
  });
});

describe("frontMatterSyncExtension — bidirectional doc<->panel sync (requires a real EditorView)", () => {
  domTest(
    "fires the callback when a change intersects the frontmatter block, not when it only touches the body",
    () => {
      let callCount = 0;
      const container = document.createElement("div");
      const view = new EditorView({
        doc: "---\nstatus: draft\n---\nBody",
        extensions: [frontMatterSyncExtension(() => callCount++)],
        parent: container,
      });

      // Body-only edit: must NOT fire.
      view.dispatch({
        changes: { from: view.state.doc.length, insert: "!" },
      });
      expect(callCount).toBe(0);

      // Frontmatter-intersecting edit: must fire.
      const statusValueFrom = view.state.doc.toString().indexOf("draft");
      view.dispatch({
        changes: {
          from: statusValueFrom,
          to: statusValueFrom + 5,
          insert: "final",
        },
      });
      expect(callCount).toBe(1);

      view.destroy();
    },
  );
});
