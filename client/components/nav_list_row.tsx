import "@m3e/web/list";
import "./m3e-jsx.d.ts";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";

// Shared `m3e-list-item` row shape duplicated across nav_views/recent.tsx
// (:182-207), nav_views/search.tsx (:210-235) and nav_views/run.tsx
// (:154-174) — name + optional trailing hint + optional supporting-text
// description, selected/hover/click wiring identical in all three. Past
// the "three similar lines" threshold (coding-preferences), so pulled out
// once instead of kept as a fourth near-duplicate. Markup and class names
// (`sb-option`/`sb-selected-option`/`sb-name`/`sb-hint`/`sb-description`)
// are verbatim from those call sites — this component changes nothing
// about what renders, only where the JSX lives.
export function NavListRow(
  { option, selected, onSelect, onActivate }: {
    option: FilterOption;
    selected: boolean;
    onSelect: () => void;
    onActivate: (opt: FilterOption) => void;
  },
) {
  return (
    <m3e-list-item
      class={selected ? "sb-option sb-selected-option" : "sb-option"}
      onMouseMove={onSelect}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        onActivate(option);
      }}
    >
      <span class="sb-name">{option.name}</span>
      {option.hint && (
        <span slot="trailing" class="sb-hint">{option.hint}</span>
      )}
      {option.description && (
        <span slot="supporting-text" class="sb-description">
          {option.description}
        </span>
      )}
    </m3e-list-item>
  );
}
