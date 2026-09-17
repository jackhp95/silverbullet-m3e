import { expect, test } from "vitest";
import reducer from "./reducer.ts";
import { initialViewState } from "./types/ui.ts";

// V1 (docs/plans/2026-09-17-vertical-toolbar-search-nav-redesign-spec.md):
// replaces select-nav-destination/close-nav-panel with independent boolean
// setters for the search and navigation sheets. Each is a pure setter, so
// these assertions only check the resulting boolean per action.

test("show-search-sheet sets searchSheetOpen to true", () => {
  const state = reducer(initialViewState, { type: "show-search-sheet" });
  expect(state.searchSheetOpen).toBe(true);
});

test("show-search-sheet on an already-open sheet stays true", () => {
  let state = reducer(initialViewState, { type: "show-search-sheet" });
  state = reducer(state, { type: "show-search-sheet" });
  expect(state.searchSheetOpen).toBe(true);
});

test("hide-search-sheet clears searchSheetOpen to false", () => {
  const opened = reducer(initialViewState, { type: "show-search-sheet" });
  expect(opened.searchSheetOpen).toBe(true);

  const closed = reducer(opened, { type: "hide-search-sheet" });
  expect(closed.searchSheetOpen).toBe(false);
});

test("hide-search-sheet on an already-closed sheet stays false", () => {
  expect(initialViewState.searchSheetOpen).toBe(false);
  const state = reducer(initialViewState, { type: "hide-search-sheet" });
  expect(state.searchSheetOpen).toBe(false);
});

test("show-navigation-sheet / hide-navigation-sheet toggle navigationSheetOpen independently of searchSheetOpen", () => {
  const opened = reducer(initialViewState, { type: "show-navigation-sheet" });
  expect(opened.navigationSheetOpen).toBe(true);
  expect(opened.searchSheetOpen).toBe(false);

  const closed = reducer(opened, { type: "hide-navigation-sheet" });
  expect(closed.navigationSheetOpen).toBe(false);
});
