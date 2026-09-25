import { render } from "preact";
// Global custom-element registration for the shared UI kit's m3e-backed
// components used by the wizard steps (plug-api/ui/{button,input}.tsx —
// see client/spaces_ui/spaces.tsx's matching comment for why this lives
// here rather than in the kit files themselves). Wizard.tsx's SpaceStep +
// AdminStep both render `Button`/`Input`; `@m3e/web/checkbox`/`chips` are
// not needed here — nothing in this wizard renders Checkbox or Badge.
// `Alert` (via space_fields.tsx's `FieldErrors`, also reachable from both
// steps) needs no registration either way right now: its own swap is
// DEFERRED (see plug-api/ui/alert.tsx's file header), so `FieldErrors` still
// renders a plain `<div>`; when that swap lands, `@m3e/web/snackbar` is
// registered here, not in space_fields.tsx (SpaceForm.test.ts loads it).
import "@m3e/web/button";
import "@m3e/web/form-field";
// SpaceStep.tsx's FolderPicker renders `m3e-breadcrumb`/`m3e-list`/
// `m3e-list-action` directly — registered here rather than in
// FolderPicker.tsx, which SpaceForm.test.ts loads under plain-Node vitest.
import "@m3e/web/list";
import "@m3e/web/breadcrumb";
import { AuthHeader } from "./components/AuthHeader.tsx";
import { Wizard } from "./components/Wizard.tsx";

render(
  <>
    <AuthHeader logo="assets/logo-dock-96x96.png" />
    <div class="sb-auth-content sb-setup-content">
      <Wizard />
    </div>
  </>,
  document.getElementById("root")!,
);
