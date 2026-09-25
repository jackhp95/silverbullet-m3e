import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";
import { decoratorStateField } from "./util.ts";
import { extractHashtag } from "../../plug-api/lib/tags.ts";
// NOTE: no `import "@m3e/web/chips"` here on purpose — this module (and
// frontmatter_folding.ts, markdown_render.ts) is imported by plain-Node
// vitest unit tests with no DOM (see frontmatter_folding.test.ts's
// `domTest` guard). `@m3e/web/chips` defines a `class ... extends
// LitElement` at import time, which throws immediately without a global
// `HTMLElement`. The registration instead lives in editor_ui.tsx (the
// browser-only app root) — custom-element registration is global, so one
// import there covers every module that renders `<m3e-assist-chip>`.

export function hashtagPlugin() {
  return decoratorStateField((state) => {
    const widgets: any[] = [];

    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name !== "Hashtag") {
          return;
        }

        const tag = state.sliceDoc(from, to);

        if (tag.length === 1) {
          // Invalid Hashtag, a length of 1 means its just #
          return;
        }

        const tagName = extractHashtag(tag);

        // m3e-assist-chip WITHOUT `href`: an href makes the chip navigate
        // itself (full page load) and swallow the mousedown CodeMirror's
        // click handler needs. Unlinked, the click reaches editor_state.ts's
        // `[data-tag-name]` intercept -> `page:click` -> navigate.ts's Hashtag
        // case (which honours `tags.<name>.tagPage`), like main's old `<a>`.
        // Decoration.mark re-parents the raw `#tagname`, so it stays editable.
        widgets.push(
          Decoration.mark({
            tagName: "m3e-assist-chip",
            attributes: {
              variant: "outlined",
              "data-tag-name": tagName,
            },
          }).range(from, to),
        );
      },
    });

    return Decoration.set(widgets, true);
  });
}
