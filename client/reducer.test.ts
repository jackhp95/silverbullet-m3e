import { expect, test } from "vitest";
import reducer from "./reducer.ts";
import { initialViewState } from "./types/ui.ts";

// N1 (docs/plans/2026-09-17-nav-bar-fab-search-redesign-spec.md): replaces
// show-/hide-search-sheet with select-nav-destination/close-nav-panel. The
// reducer is a pure setter — toggle-if-already-selected logic lives in
// nav_bar.tsx, not here — so these assertions only check the resulting
// `navDestination` value per action, not any toggle behavior.

test("select-nav-destination sets navDestination to the given destination", () => {
  const state = reducer(initialViewState, {
    type: "select-nav-destination",
    destination: "recent",
  });
  expect(state.navDestination).toBe("recent");
});

test("select-nav-destination overwrites a previously-selected destination", () => {
  let state = reducer(initialViewState, {
    type: "select-nav-destination",
    destination: "recent",
  });
  state = reducer(state, {
    type: "select-nav-destination",
    destination: "search",
  });
  expect(state.navDestination).toBe("search");
});

test("select-nav-destination with the already-active destination is a no-op value-wise", () => {
  let state = reducer(initialViewState, {
    type: "select-nav-destination",
    destination: "run",
  });
  state = reducer(state, {
    type: "select-nav-destination",
    destination: "run",
  });
  expect(state.navDestination).toBe("run");
});

test("close-nav-panel clears navDestination to null", () => {
  const opened = reducer(initialViewState, {
    type: "select-nav-destination",
    destination: "notifications",
  });
  expect(opened.navDestination).toBe("notifications");

  const closed = reducer(opened, { type: "close-nav-panel" });
  expect(closed.navDestination).toBeNull();
});

test("close-nav-panel on an already-closed panel stays null", () => {
  expect(initialViewState.navDestination).toBeNull();
  const state = reducer(initialViewState, { type: "close-nav-panel" });
  expect(state.navDestination).toBeNull();
});

test.each([
  "recent",
  "search",
  "run",
  "notifications",
] as const)("select-nav-destination(%s) yields navDestination = %s", (destination) => {
  const state = reducer(initialViewState, {
    type: "select-nav-destination",
    destination,
  });
  expect(state.navDestination).toBe(destination);
});
