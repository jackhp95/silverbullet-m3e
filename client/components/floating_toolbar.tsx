// Bottom-right vertical floating toolbar (decomposition D3): Search opens
// main's page picker, Journal runs "Journal: Today" when that command exists.
// `m3e-toolbar` has no selection state, so every button is a stateless
// onClick icon-button. Registrations live in editor_ui.tsx (vitest sibling).

export function FloatingToolbar({
  onSearchClick,
  journal,
}: {
  onSearchClick: () => void;
  journal: { available: boolean; onClick: () => void };
}) {
  return (
    <m3e-toolbar
      vertical
      shape="rounded"
      elevated
      className="sb-floating-toolbar"
      aria-label="Toolbar"
    >
      <m3e-icon-button
        title="Search"
        aria-label="Search"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          onSearchClick();
        }}
      >
        <m3e-icon name="search"></m3e-icon>
      </m3e-icon-button>
      <m3e-icon-button
        title="Journal"
        aria-label="Journal"
        disabled-interactive={!journal.available}
        onClick={journal.available
          ? (e: MouseEvent) => {
            e.preventDefault();
            journal.onClick();
          }
          : undefined}
      >
        <m3e-icon name="edit_calendar"></m3e-icon>
      </m3e-icon-button>
    </m3e-toolbar>
  );
}
