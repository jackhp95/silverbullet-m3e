import "@m3e/web/list";
import "../m3e-jsx.d.ts";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import type { PageMeta } from "@silverbulletmd/silverbullet/type/index";
import { navigateToAnythingPickerName } from "../anything_picker.tsx";
import { NavListRow } from "../nav_list_row.tsx";

// Navigation sheet's Changelog tab (2026-09-17 nav redesign spec §2.7).
// `PageMeta.lastModified` is already a populated ISO string flowing through
// `viewState.allPages` — no new plumbing, just sort + render.
//
// v1 deliberately ships "when" only. "Who" is genuinely absent server-side
// (no git-log/blame/author capability anywhere in server/src today, per the
// spec's exhaustive grep) — this is a scoped decision (spec §2.7 option 1),
// not an oversight, so no author column and no TODO implying one is coming
// by accident.
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const diffMs = now - then;
  const sign = diffMs >= 0 ? -1 : 1; // past -> negative delta for RelativeTimeFormat
  const absSec = Math.round(Math.abs(diffMs) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Infinity, "year"],
  ];

  let value = absSec;
  for (const [span, unit] of units) {
    if (value < span || span === Infinity) {
      return rtf.format(sign * Math.round(value), unit);
    }
    value = value / span;
  }
  // Unreachable — the last unit's span is Infinity, which always returns above.
  return rtf.format(sign * Math.round(value), "year");
}

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
