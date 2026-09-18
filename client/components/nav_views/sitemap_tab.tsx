import "@m3e/web/list";
import "../m3e-jsx.d.ts";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { navigateToAnythingPickerName } from "../anything_picker.tsx";
import { NavListRow } from "../nav_list_row.tsx";

// Navigation sheet's Sitemap tab (2026-09-17 nav redesign spec §2.8).
// Two sections:
//  1. "Commonly navigated" lead section — pages with a `lastOpened`
//     timestamp, sorted descending. Exact same computation
//     `anything_picker.tsx:159-160` already uses for its own default
//     ordering (`orderId = -pageMeta.lastOpened`) — a proven, shipped
//     recency proxy, not a guess. Caveat (same one AnythingPicker already
//     carries): this is recency-of-last-open, not true visit frequency.
//  2. A flat list of every page in `allPages`, unsorted (browse-everything).
// The two sections may repeat a page (a commonly-navigated page also shows
// up in the full list below) — that's intentional, matching the "pinned
// recents + full list" pattern, not a dedup bug.
function toOption(page: PageMeta): FilterOption {
  return { name: page.name };
}

export function SitemapTab({
  allPages,
  onNavigate,
}: {
  allPages: PageMeta[];
  onNavigate: () => void;
}) {
  const commonlyNavigated = allPages
    .filter(
      (p): p is PageMeta & { lastOpened: number } =>
        typeof p.lastOpened === "number",
    )
    .sort((a, b) => b.lastOpened - a.lastOpened);

  const activate = (page: PageMeta) => () =>
    navigateToAnythingPickerName(page.name, onNavigate);

  return (
    <>
      {commonlyNavigated.length > 0 && (
        <>
          <p class="sb-nav-sheet-section-label">Commonly navigated</p>
          <m3e-list
            aria-label="Commonly navigated"
            class="sb-sitemap-commonly-navigated"
          >
            {commonlyNavigated.map((page) => (
              <NavListRow
                key={`common-${page.name}`}
                option={toOption(page)}
                selected={false}
                onSelect={() => {}}
                onActivate={activate(page)}
              />
            ))}
          </m3e-list>
        </>
      )}
      {allPages.length === 0 ? (
        <p class="sb-nav-sheet-empty">No pages yet.</p>
      ) : (
        <m3e-list aria-label="All pages" class="sb-sitemap-all">
          {allPages.map((page) => (
            <NavListRow
              key={page.name}
              option={toOption(page)}
              selected={false}
              onSelect={() => {}}
              onActivate={activate(page)}
            />
          ))}
        </m3e-list>
      )}
    </>
  );
}
