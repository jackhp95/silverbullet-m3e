import { useEffect, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet";
import "@m3e/web/form-field";
import "./m3e-jsx.d.ts";

// Real m3e-bottom-sheet (node_modules/@m3e/web/dist/src/bottom-sheet/
// BottomSheetElement.d.ts, v2.7.12) hosting the "Jot down an idea" text
// input, replacing the old this.prompt()-based native <dialog> flow (see
// basic_modals.tsx's Prompt — still used for "New task", unchanged this
// round; only idea capture was asked to move to a bottom sheet).
//
// Fully Preact-controlled via the `open` boolean property (Preact assigns
// real element properties on custom elements it recognizes, not stringified
// attributes — see the fork's own researched note in the m3e integration
// report, Addendum 2), so no m3e-bottom-sheet-trigger indirection is needed:
// the "New idea" fab-menu-item just flips `open` to true directly.
// `modal` (scrim + focus trap) + `handle` (drag-to-dismiss affordance) match
// the component's own documented example for a modal action sheet.

export function IdeaCaptureSheet({
  open,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      // Focus after the sheet's own open transition/animation has started.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <m3e-bottom-sheet
      modal
      handle
      hideable
      open={open}
      onCancel={() => onCancel()}
      onClosed={() => onCancel()}
    >
      <span slot="header">Jot down an idea</span>
      <div className="sb-idea-sheet-body">
        <m3e-form-field>
          <label slot="label">Idea</label>
          <Input
            inputRef={inputRef}
            value={text}
            onInput={(e) => setText(e.currentTarget.value)}
            onConfirm={(value) => onSubmit(value)}
            onExit={() => onCancel()}
          />
        </m3e-form-field>
      </div>
    </m3e-bottom-sheet>
  );
}
