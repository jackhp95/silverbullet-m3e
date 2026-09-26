import {
  collectNodesOfType,
  findNodeOfType,
  type ParseTree,
} from "@silverbulletmd/silverbullet/lib/tree";
import type {
  ObjectValue,
  PageMeta,
} from "@silverbulletmd/silverbullet/type/index";
import type { FrontMatter } from "./frontmatter.ts";

export type SpaceLuaObject = ObjectValue<{
  script: string;
  priority?: number;
}>;

/**
 * A `space-lua` tag query also returns any object merely *tagged* `space-lua`
 * (e.g. a page with `tags: [space-lua]`), which has no `script`. Only fenced
 * blocks emitted by `indexSpaceLua` are runnable.
 */
export function isSpaceLuaObject(o: ObjectValue<any>): o is SpaceLuaObject {
  return o.tag === "space-lua" && typeof o.script === "string";
}

export function indexSpaceLua(
  pageMeta: PageMeta,
  _frontmatter: FrontMatter,
  tree: ParseTree,
) {
  const allSpaceLuas: SpaceLuaObject[] = [];
  collectNodesOfType(tree, "FencedCode").map((t) => {
    const codeInfoNode = findNodeOfType(t, "CodeInfo");
    if (!codeInfoNode) {
      return;
    }
    const fenceType = codeInfoNode.children![0].text!;
    if (fenceType !== "space-lua") {
      return;
    }
    const codeTextNode = findNodeOfType(t, "CodeText");
    if (!codeTextNode) {
      // Honestly, this shouldn't happen
      return;
    }
    const codeText = codeTextNode.children![0].text!;
    // Parse out "-- priority: <number>"
    const priority = codeText.match(/--\s*priority:\s*(-?\d+)/)?.[1];

    allSpaceLuas.push({
      ref: `${pageMeta.name}@${t.from!}`,
      tag: "space-lua",
      range: [codeTextNode.from!, codeTextNode.to!],
      script: codeText,
      priority: priority !== undefined ? +priority : undefined,
    });
  });
  return Promise.resolve(allSpaceLuas);
}
