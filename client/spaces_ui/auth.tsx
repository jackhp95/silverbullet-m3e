import { render } from "preact";
// Global custom-element registration for the shared UI kit's m3e-backed
// components — see client/spaces_ui/spaces.tsx's matching comment. This is
// the per-space login page's own separate browser entry point (a space's
// `<space>/.auth`, built from the same esbuild config as central.tsx but as
// an independent bundle with no shared runtime state); `SpaceLogin.tsx`
// renders `LoginForm.tsx` directly, which reaches Button/Input/Checkbox
// (via CheckboxField) but never Badge/UrlPrefixInput. No `@m3e/web/snackbar`
// here — `Alert`'s own swap is DEFERRED, see plug-api/ui/alert.tsx's file
// header.
import "@m3e/web/button";
import "@m3e/web/form-field";
import "@m3e/web/checkbox";
import { type AuthConfig, SpaceLogin } from "./components/SpaceLogin.tsx";

/**
 * Read the server-templated config off `#root`'s data attributes. Attributes
 * rather than a JSON island because the shell is autoescaped and a
 * user-controlled space name has to survive that intact — see auth.html.
 */
export function readAuthConfig(root: HTMLElement): AuthConfig {
  return {
    spaceName: root.dataset.spaceName ?? "",
    encryptionSalt: root.dataset.encryptionSalt ?? "",
    rememberMeDays: Number(root.dataset.rememberMeDays ?? 0),
    accountManaged: root.dataset.accountManaged === "true",
  };
}

const root = document.getElementById("root")!;
render(<SpaceLogin config={readAuthConfig(root)} />, root);
