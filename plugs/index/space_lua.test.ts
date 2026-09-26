import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { describe, expect, test } from "vitest";
import { parseMarkdown } from "../../client/markdown_parser/parser.ts";
import { createMockSystem } from "../../plug-api/system_mock.ts";
import { extractFrontMatter } from "./frontmatter.ts";
import { indexSpaceLua, isSpaceLuaObject } from "./space_lua.ts";
import { isSpaceStyleObject } from "./space_style.ts";

const testPage = `
Hello
\`\`\`space-lua
function sup()
end
\`\`\`

\`\`\`space-lua
-- priority: 10
function sup()
end
\`\`\`
`.trim();

test("Test space lua indexing", async () => {
  createMockSystem();

  const tree = parseMarkdown(testPage);
  const frontmatter = extractFrontMatter(tree);

  const pageMeta: PageMeta = {
    ref: "folder/test",
    name: "folder/test",
    tag: "page",
    created: "",
    lastModified: "",
    perm: "rw",
  };

  const objects = await indexSpaceLua(pageMeta, frontmatter, tree);
  expect(objects.length).toEqual(2);
  expect(objects[0].priority).toEqual(undefined);
  expect(objects[1].priority).toEqual(10);

  // range covers the inner code text, not the ``` fences
  for (const o of objects) {
    const [from, to] = o.range as unknown as [number, number];
    expect(testPage.slice(from, to)).toBe(o.script);
    expect(testPage.slice(from, to)).not.toContain("```");
  }
});

// A page with `tags: [space-lua]` is returned by a `space-lua` tag query too,
// but carries no `script` — the loader used to call parseBlock(undefined).
describe("script/style tag-collision guards", () => {
  const taggedPage = {
    ref: "okf/lua-okf/index",
    tag: "page",
    tags: ["lua", "space-lua", "space-style"],
    name: "okf/lua-okf/index",
  };

  test("fenced space-lua block passes", () => {
    expect(
      isSpaceLuaObject({ ref: "CONFIG@10", tag: "space-lua", script: "x = 1" }),
    ).toBe(true);
  });

  test("page merely tagged space-lua is rejected", () => {
    expect(isSpaceLuaObject(taggedPage)).toBe(false);
  });

  test("fenced space-style block passes", () => {
    expect(
      isSpaceStyleObject({
        ref: "CONFIG@20",
        tag: "space-style",
        style: "a{}",
      }),
    ).toBe(true);
  });

  test("page merely tagged space-style is rejected", () => {
    expect(isSpaceStyleObject(taggedPage)).toBe(false);
  });
});
