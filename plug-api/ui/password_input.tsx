import { useState } from "preact/hooks";
import { Input, type InputProps } from "./input.tsx";
import { Button } from "./button.tsx";

export type PasswordInputProps = Omit<InputProps, "type"> & {
  toggleId?: string;
};
export function PasswordInput({ toggleId, ...props }: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div class="password-field sb-password-field">
      <Input {...props} type={revealed ? "text" : "password"} />
      <Button
        id={toggleId}
        // `props.disabled` comes through typed as a native `<input>`
        // attribute (Preact's own jsx.d.ts wraps every native attribute in
        // `Signalish<T>`, whether or not @preact/signals is actually in use
        // here — it isn't), but `Button` now renders `m3e-button`, whose
        // ambient typing (plug-api/ui/m3e-jsx.d.ts) declares `disabled` as a
        // plain `boolean`. No actual Signal ever flows through this
        // hooks-based component, so this narrows the type, not the value.
        disabled={props.disabled as boolean | undefined}
        aria-label={revealed ? "Hide password" : "Show password"}
        aria-pressed={revealed}
        aria-controls={props.id}
        onClick={() => setRevealed(!revealed)}
      >
        {revealed ? "Hide" : "Show"}
      </Button>
    </div>
  );
}
