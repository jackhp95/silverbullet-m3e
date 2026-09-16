import { useEffect, useRef, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import "@m3e/web/dialog";
import "@m3e/web/form-field";
import "@m3e/web/button";
import "./m3e-jsx.d.ts";

export function Prompt({
  message,
  defaultValue,
  callback,
}: {
  message: string;
  defaultValue?: string;
  darkMode: boolean | undefined;
  callback: (value?: string) => void;
}) {
  const [text, setText] = useState(defaultValue || "");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end); // caret at end of default value
    }
  }, []);

  const cancel = () => callback();
  const submit = () => callback(text);

  return (
    <AlwaysShownModal onCancel={cancel}>
      <span slot="header">{message}</span>
      <m3e-form-field class="sb-prompt-field">
        <input
          ref={inputRef}
          aria-label={message}
          class="sb-prompt-input"
          value={text}
          onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => {
            // Ignore Enter that's part of an IME composition (e.g. CJK
            // candidate confirmation), so it doesn't submit a half-composed
            // value — same guard plug-api/ui/input.tsx's onConfirm used.
            if (e.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </m3e-form-field>
      <div slot="actions" class="sb-dialog-actions">
        <m3e-button
          variant="text"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            cancel();
          }}
        >
          <m3e-dialog-action return-value="cancel">Cancel</m3e-dialog-action>
        </m3e-button>
        <m3e-button
          variant="filled"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            submit();
          }}
        >
          <m3e-dialog-action return-value="ok">Ok</m3e-dialog-action>
        </m3e-button>
      </div>
    </AlwaysShownModal>
  );
}

export function Confirm({
  message,
  destructive,
  callback,
}: {
  message: string;
  destructive?: boolean;
  callback: (value: boolean) => void;
}) {
  // m3e-button is a Lit custom element wrapping a real internal <button>;
  // `autofocus` below (a real DOM/content attribute) does the initial-render
  // focus in most cases, but a `setTimeout` nudge is kept as a safety net —
  // same belt-and-suspenders the original native-<dialog> implementation
  // used for its own autofocus'd <button ref={okButtonRef}>.
  const okButtonRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setTimeout(() => okButtonRef.current?.focus());
  }, []);

  const cancel = () => callback(false);
  const confirm = () => callback(true);

  return (
    <AlwaysShownModal onCancel={cancel} alert>
      <span slot="header">{message}</span>
      <div slot="actions" class="sb-dialog-actions">
        <m3e-button
          variant="text"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            cancel();
          }}
        >
          <m3e-dialog-action return-value="cancel">Cancel</m3e-dialog-action>
        </m3e-button>
        <m3e-button
          ref={okButtonRef}
          variant="filled"
          autofocus
          // No dedicated "danger"/"destructive" variant exists on m3e-button
          // (verified against @m3e/web 2.7.12's Custom Elements Manifest —
          // ButtonVariant is elevated | filled | tonal | outlined | text
          // only). Material 3's own spec response to this is to recolor a
          // filled button with the error color role, so `.sb-button-error`
          // (modals.scss) overrides the filled variant's `--m3e-*` container/
          // label/state-layer custom properties to `--md-sys-color-error` /
          // `-on-error` — the sanctioned per-instance override point, not a
          // hand-rolled hex color.
          class={destructive ? "sb-button-error" : undefined}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            confirm();
          }}
        >
          <m3e-dialog-action return-value="ok">Ok</m3e-dialog-action>
        </m3e-button>
      </div>
    </AlwaysShownModal>
  );
}

export function AlwaysShownModal({
  children,
  onCancel,
  alert,
}: {
  children: ComponentChildren;
  onCancel?: () => void;
  /** Sets role="alertdialog" — used by Confirm(), not Prompt(). */
  alert?: boolean;
}) {
  return (
    <m3e-dialog
      open
      // Non-closable via backdrop click / Escape, same as the old raw
      // `<dialog>.showModal()` (which never wired up a backdrop-click
      // listener and only ever *routed* Escape through onCancel rather than
      // letting the browser auto-close it — see the onKeyDown handler
      // below, which restores exactly that routing: verified against
      // node_modules/@m3e/web/dist/dialog.js that `disable-close` makes the
      // component swallow Escape/backdrop-click entirely, so the app's own
      // Cancel button + this handler are the only way out, matching
      // "AlwaysShownModal" 's own name).
      disable-close
      alert={alert}
      onKeyDown={(e: KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel?.();
        }
      }}
    >
      {children}
    </m3e-dialog>
  );
}
