import "@m3e/web/list";
import "../m3e-jsx.d.ts";
import type { Path } from "@silverbulletmd/silverbullet/lib/ref";
import { navigateToAnythingPickerRef } from "../anything_picker.tsx";
import { NavListRow } from "../nav_list_row.tsx";
import { getOpenHistory, type RecentPathOption } from "../search_modes.ts";

// Navigation sheet's History tab (2026-09-17 nav redesign spec §2.6) — a
// purely passive browse list of `client.recentPaths`. Deliberately NO input
// box here: typed jump-to-page lives exclusively in the Search sheet's Open
// mode (search_modes.ts's getOpenResults, V6), so History and Open stay
// cleanly non-overlapping by construction rather than by convention.
//
// Reuses `getOpenHistory` verbatim (same recentPaths -> row mapping the Open
// mode's own empty-query state already uses) instead of re-deriving the
// currentPath-exclusion/naming logic a second time.
export function HistoryTab({
  recentPaths,
  currentPath,
  onNavigate,
}: {
  recentPaths: { path: Path; ts: number }[];
  currentPath: Path;
  onNavigate: () => void;
}) {
  const rows: RecentPathOption[] = getOpenHistory(recentPaths, currentPath);

  if (rows.length === 0) {
    return <p class="sb-nav-sheet-empty">No recently visited pages yet.</p>;
  }

  return (
    <m3e-list aria-label="History">
      {rows.map((option) => (
        <NavListRow
          key={option.recentPath}
          option={option}
          selected={false}
          onSelect={() => {}}
          onActivate={() => {
            navigateToAnythingPickerRef(
              { path: option.recentPath },
              onNavigate,
            );
          }}
        />
      ))}
    </m3e-list>
  );
}
