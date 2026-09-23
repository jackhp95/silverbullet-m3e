import { expect, test } from "vitest";
import "fake-indexeddb/auto";
import { IndexedDBKvPrimitives } from "../data/indexeddb_kv_primitives.ts";
import { DataStore } from "../data/datastore.ts";
import { pushRecent } from "./recency.ts";

test("pushRecent dedupes (moving the re-recorded entry to the front) and orders most-recent-first", () => {
  const isSameTerm = (a: { term: string }, b: { term: string }) =>
    a.term === b.term;
  let list: { term: string; ts: number }[] = [];
  list = pushRecent(list, { term: "a", ts: 1 }, isSameTerm);
  list = pushRecent(list, { term: "b", ts: 2 }, isSameTerm);
  // Re-recording "a" must dedupe the earlier entry, not add a second one.
  list = pushRecent(list, { term: "a", ts: 3 }, isSameTerm);
  expect(list.map((e) => e.term)).toEqual(["a", "b"]);
});

test("pushRecent caps the list at the given size", () => {
  const isSameTerm = (a: { term: string }, b: { term: string }) =>
    a.term === b.term;
  let list: { term: string; ts: number }[] = [];
  for (let i = 0; i < 25; i++) {
    list = pushRecent(list, { term: `t${i}`, ts: i }, isSameTerm, 20);
  }
  expect(list.length).toBe(20);
  // Most recently pushed stays at the front.
  expect(list[0].term).toBe("t24");
});

// L9 acceptance: record 3 terms, simulate a reload (fresh KV primitives +
// DataStore over the same underlying fake-indexeddb database), and read
// back deduped + capped — the exact same `ds` round-trip `recentPaths`
// already relies on (client.ts: `["client", "recentPaths"]`), just under
// the new `["client", "recentSearchTerms"]` key.
test("recentSearchTerms survives a simulated reload, deduped and capped, via the same ds pattern as recentPaths", async () => {
  const dbName = "recency-test-recent-search-terms";
  const isSameTerm = (a: { term: string }, b: { term: string }) =>
    a.term === b.term;

  const kv1 = new IndexedDBKvPrimitives(dbName);
  await kv1.init();
  const ds1 = new DataStore(kv1);

  let recentSearchTerms: { term: string; ts: number }[] = [];
  for (const term of ["foo", "bar", "foo"]) {
    recentSearchTerms = pushRecent(
      recentSearchTerms,
      { term, ts: Date.now() },
      isSameTerm,
    );
    await ds1.set(["client", "recentSearchTerms"], recentSearchTerms);
  }
  kv1.close();

  // Simulate a reload: brand new primitives + DataStore instances, same
  // underlying (fake-indexeddb) database name — mirrors how a real page
  // reload re-opens the same IndexedDB database from scratch.
  const kv2 = new IndexedDBKvPrimitives(dbName);
  await kv2.init();
  const ds2 = new DataStore(kv2);
  const reloaded = await ds2.get<{ term: string; ts: number }[]>([
    "client",
    "recentSearchTerms",
  ]);
  kv2.close();

  expect(reloaded).not.toBeNull();
  // "foo" recorded twice deduped down to one entry, most-recent-first.
  expect(reloaded!.map((e) => e.term)).toEqual(["foo", "bar"]);
  expect(reloaded!.length).toBe(2);
});
