import { expect, test } from "vitest";
import { accentSeed } from "./theme_seed.ts";

test("accentSeed expands #rgb shorthand", () => {
  expect(accentSeed("#abc", "#000000")).toBe("#aabbcc");
});

test("accentSeed lowercases and passes through #rrggbb", () => {
  expect(accentSeed("#D00000", "#000000")).toBe("#d00000");
});

test("accentSeed converts rgb() to hex", () => {
  expect(accentSeed("rgb(208, 0, 0)", "#000000")).toBe("#d00000");
});

test("accentSeed falls back on an empty string", () => {
  expect(accentSeed("", "#3569b8")).toBe("#3569b8");
});

test("accentSeed falls back on a named color", () => {
  expect(accentSeed("red", "#3569b8")).toBe("#3569b8");
});

test("accentSeed falls back on garbage", () => {
  expect(accentSeed("not-a-color", "#3569b8")).toBe("#3569b8");
});
