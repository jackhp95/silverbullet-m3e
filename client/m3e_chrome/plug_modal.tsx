// The plug modal surface (`showPanel("modal", ...)`), reskinned onto
// `m3e-dialog`. No `@m3e/web` import here (see `register.ts`) — the tag
// itself is plain JSX, registration happens once at the app root.

import type { ComponentChildren } from "preact";
import { plugModalSizing } from "./chrome_model.ts";

export function PlugModal({
  inset,
  onClose,
  children,
}: {
  inset: number | string;
  onClose: () => void;
  children: ComponentChildren;
}) {
  const sizing = plugModalSizing(inset);
  return (
    // Escape/backdrop close -> one `closed` event -> one hide-panel.
    // Inner `.sb-modal` kept: extensions.test.ts targets `.sb-modal iframe`.
    <m3e-dialog
      open
      style={{
        "--m3e-dialog-min-width": sizing.dialogWidth,
        "--m3e-dialog-max-width": sizing.dialogWidth,
        "--m3e-dialog-max-height": sizing.dialogHeight,
      }}
      onclosed={onClose}
    >
      <div
        className="sb-modal"
        style={{
          position: "relative",
          width: "100%",
          height: sizing.panelHeight,
        }}
      >
        {children}
      </div>
    </m3e-dialog>
  );
}
