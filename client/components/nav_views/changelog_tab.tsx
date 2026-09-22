import "@m3e/web/list";
import "../m3e-jsx.d.ts";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { navigateToAnythingPickerName } from "../anything_picker.tsx";
import { NavListRow } from "../nav_list_row.tsx";
import { relativeTime } from "../../lib/relative_time.ts";

// Navigation sheet's Changelog tab (2026-09-17 nav redesign spec §2.7).
// `PageMeta.lastModified` is already a populated ISO string flowing through
// `viewState.allPages` — no new plumbing, just sort + render.
//
// v1 deliberately ships "when" only. "Who" is genuinely absent server-side
// (no git-log/blame/author capability anywhere in server/src today, per the
// spec's exhaustive grep) — this is a scoped decision (spec §2.7 option 1),
// not an oversight, so no author column and no TODO implying one is coming
// by accident.
export function ChangelogTab({
  allPages,
  onNavigate,
}: {
  allPages: PageMeta[];
  onNavigate: () => void;
}) {
  const sorted = [...allPages].sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );

  if (sorted.length === 0) {
    return <p class="sb-nav-sheet-empty">No pages yet.</p>;
  }

  return (
    <m3e-list aria-label="Changelog">
      {sorted.map((page) => {
        const option: FilterOption = {
          name: page.name,
          hint: `modified ${relativeTime(page.lastModified)}`,
        };
        return (
          <NavListRow
            key={page.name}
            option={option}
            selected={false}
            onSelect={() => {}}
            onActivate={() =>
              navigateToAnythingPickerName(page.name, onNavigate)
            }
          />
        );
      })}
    </m3e-list>
  );
}
