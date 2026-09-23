import { useEffect, useRef, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import "@m3e/web/dialog";
import "@m3e/web/form-field";
import "@m3e/web/button";
import "./m3e-jsx.d.ts";

/** The `returnValue` an `m3e-dialog` reports on its `closed` event once an
 * `m3e-dialog-action` inside it has been clicked (DialogElement.d.ts's
 * `returnValue` property, set synchronously by `hide()` before `closed`
 * dispatches — verified in node_modules/@m3e/web/dist/dialog.js). Read off
 * `e.target`, not `e.currentTarget`: the dialog dispatches `closed` on
 * itself directly (not a bubbled child event), so `target` is reliable. */
function dialogReturnValue(e: Event): string | undefined {
  return (e.target as (HTMLElement & { returnValue?: string }) | null)
    ?.returnValue;
}

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
    <AlwaysShownModal
      onCancel={cancel}
      // The action buttons below don't carry their own onClick — an
      // `m3e-dialog-action` handles its own click (see DialogActionElement's
      // `_onClick`, which calls `closest("m3e-dialog").hide(returnValue)`
      // directly on the button it's nested in, independent of any sibling
      // listener) and this `closed` handler is the single place that reads
      // the result back out via `returnValue`, matching the library's own
      // documented `onclosed="...this.returnValue..."` pattern instead of a
      // second, redundant click listener racing it.
      onClosed={(e: Event) => {
        if (dialogReturnValue(e) === "ok") {
          submit();
        } else {
          cancel();
        }
      }}
    >
      <span slot="header">{message}</span>
      <m3e-form-field class="w-full">
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
      <div
        slot="actions"
        class="flex justify-end gap-2"
        // Buttons don't stop propagation individually (see the comment on
        // AlwaysShownModal's onClosed above — an extra per-button listener
        // is what raced m3e-dialog-action's own click handling last time);
        // one listener at the row level still keeps the click from leaking
        // to whatever's behind the dialog, same as the old code's intent.
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <m3e-button variant="text">
          <m3e-dialog-action return-value="cancel">Cancel</m3e-dialog-action>
        </m3e-button>
        <m3e-button variant="filled">
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
    <AlwaysShownModal
      onCancel={cancel}
      alert
      // See the identical comment in Prompt() above — the actions' own
      // m3e-dialog-actions drive `hide(returnValue)`; this is the one place
      // that turns the resulting `closed`/`returnValue` back into the real
      // app-level confirm/cancel callback.
      onClosed={(e: Event) => {
        if (dialogReturnValue(e) === "ok") {
          confirm();
        } else {
          cancel();
        }
      }}
    >
      <span slot="header">{message}</span>
      <div
        slot="actions"
        class="flex justify-end gap-2"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <m3e-button variant="text">
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
  onClosed,
  alert,
}: {
  children: ComponentChildren;
  onCancel?: () => void;
  /** Fired after an m3e-dialog-action inside `children` closes the dialog —
   * read `dialogReturnValue(e)` to see which action. Not fired by the
   * Escape path below (disable-close means the dialog itself never enters a
   * hide/closed transition from Escape — see that handler's own comment). */
  onClosed?: (e: Event) => void;
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
      // component swallow Escape/backdrop-click entirely (no "closed" event
      // fires for it at all), so the app's own action buttons (which call
      // hide() directly, unaffected by disable-close) and this handler are
      // the only ways out, matching "AlwaysShownModal"'s own name).
      disable-close
      alert={alert}
      // Deliberately lowercase `onclosed`, not `onClosed` — see
      // m3e-jsx.d.ts's M3eDialogAttributes comment: Preact only lowercases
      // an "on"-prefixed prop name when the lowercased form is already a
      // real DOM property (true for native events, false for this custom
      // element's `closed` event), so a camelCase prop here silently
      // listens for the wrong ("Closed") event name and this handler would
      // never fire.
      onclosed={onClosed}
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
