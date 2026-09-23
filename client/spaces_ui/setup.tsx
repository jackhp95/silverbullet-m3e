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
// renders a plain `<div>`. space_fields.tsx's own pre-staged
// `@m3e/web/snackbar` self-import is consequently unused until that swap
// lands — left alone since space_fields.tsx isn't one of this slice's files.
import "@m3e/web/button";
import "@m3e/web/form-field";
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
