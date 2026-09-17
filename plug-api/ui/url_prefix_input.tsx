import { Input } from "./input.tsx";

export type UrlPrefixInputProps = {
  id?: string;
  origin: string;
  value: string;
  onInput: (v: string) => void;
};

/**
 * The URL-prefix field, dressed up as the URL it will produce: a fixed origin
 * affix followed by the editable path segment.
 */
export function UrlPrefixInput({
  id,
  origin,
  value,
  onInput,
}: UrlPrefixInputProps) {
  return (
    <div class="sb-url-input">
      <span class="sb-url-affix">{origin.replace(/\/+$/, "")}</span>
      <Input
        // This component is its own compound "field" (affix span + input,
        // styled as one control by .sb-url-input in components.scss, which
        // targets the inner `.sb-input` class directly) — see the `bare`
        // prop's doc comment on ./input.tsx.
        bare
        id={id}
        value={value}
        onInput={(e) => onInput(e.currentTarget.value)}
        spellcheck={false}
        autocomplete="off"
      />
    </div>
  );
}
