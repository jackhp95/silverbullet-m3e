import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";
import { decoratorStateField } from "./util.ts";
import * as Constants from "../../plugs/index/constants.ts";
import { extractHashtag } from "../../plug-api/lib/tags.ts";
import { encodePageURI } from "@silverbulletmd/silverbullet/lib/ref";
import type { Client } from "../client.ts";
// NOTE: no `import "@m3e/web/chips"` here on purpose — this module (and
// frontmatter_folding.ts, markdown_render.ts) is imported by plain-Node
// vitest unit tests with no DOM (see frontmatter_folding.test.ts's
// `domTest` guard). `@m3e/web/chips` defines a `class ... extends
// LitElement` at import time, which throws immediately without a global
// `HTMLElement`. The registration instead lives in editor_ui.tsx (the
// browser-only app root) — custom-element registration is global, so one
// import there covers every module that renders `<m3e-assist-chip>`.

export function hashtagPlugin(client: Client) {
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
        const tagPage = client.config.get<string | null>(
          ["tags", tagName, "tagPage"],
          null,
        );
        const target = tagPage ?? Constants.tagPrefix + tagName;

        // Wrap the tag in a real m3e-assist-chip (a chip that carries a
        // native `href`, not a decorative m3e-chip — see the chips skill
        // card: "Navigable: carries a native href — do not wrap it in an
        // <a>"). Decoration.mark just re-parents the existing tag text
        // inside this wrapper, so the raw `#tagname` stays live, editable
        // text — same as the old `<a>` wrapper did.
        widgets.push(
          Decoration.mark({
            tagName: "m3e-assist-chip",
            attributes: {
              href: `/${encodePageURI(target)}`,
              rel: "tag",
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
