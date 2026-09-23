import { useEffect, useRef } from "preact/hooks";
import "@m3e/web/dialog";
import "@m3e/web/button";
import "../m3e-jsx.d.ts";

/**
 * spaces_ui's own `window.confirm()` replacement, built on `m3e-dialog` —
 * the same technique client/components/basic_modals.tsx's Confirm() uses for
 * the main editor. Deliberately a separate, local component rather than an
 * import from basic_modals.tsx: spaces_ui is a fully separate esbuild entry
 * point (build/build_client.ts's "spaces ui"/"setup ui"/"auth ui" configs,
 * split from the editor's "client" entry) that has never imported anything
 * from client/components, and this is the only one of basic_modals.tsx's two
 * surfaces spaces_ui needs — no text-entry Prompt() anywhere in these
 * screens — so this reimplements just Confirm() rather than reaching across
 * that bundle boundary for the other half.
 */
function dialogReturnValue(e: Event): string | undefined {
  return (e.target as (HTMLElement & { returnValue?: string }) | null)
    ?.returnValue;
}

export function Confirm({
  message,
  destructive,
  callback,
}: {
  message: string;
  /** Recolors the Ok action to the Material error role — see .sb-button-error. */
  destructive?: boolean;
  callback: (value: boolean) => void;
}) {
  // m3e-button wraps a real internal <button>; `autofocus` (a real DOM
  // attribute) handles initial-render focus in most cases, with this as a
  // belt-and-suspenders nudge — same as basic_modals.tsx's Confirm().
  const okButtonRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setTimeout(() => okButtonRef.current?.focus());
  }, []);

  const cancel = () => callback(false);
  const confirm = () => callback(true);

  return (
    <m3e-dialog
      open
      alert
      // Non-closable via backdrop click / Escape; the onKeyDown handler
      // below restores Escape -> cancel explicitly, matching
      // basic_modals.tsx's AlwaysShownModal.
      disable-close
      // Deliberately lowercase `onclosed` — see ../m3e-jsx.d.ts's
      // M3eDialogAttributes comment.
      onclosed={(e: Event) => {
        if (dialogReturnValue(e) === "ok") confirm();
        else cancel();
      }}
      onKeyDown={(e: KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
    >
      <span slot="header">{message}</span>
      <div
        slot="actions"
        class="flex justify-end gap-2"
        // A single listener at the row level, not per-button — an
        // m3e-dialog-action already drives hide(returnValue) on its own
        // click; a second listener on the button would race it (see
        // basic_modals.tsx's identical comment).
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <m3e-button variant="text">
          <m3e-dialog-action return-value="cancel">Cancel</m3e-dialog-action>
        </m3e-button>
        <m3e-button
          ref={okButtonRef}
          variant="filled"
          autofocus
          class={destructive ? "sb-button-error" : undefined}
        >
          <m3e-dialog-action return-value="ok">Ok</m3e-dialog-action>
        </m3e-button>
      </div>
    </m3e-dialog>
  );
}
