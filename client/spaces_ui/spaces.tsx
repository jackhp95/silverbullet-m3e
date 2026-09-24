import { render } from "preact";
// Global custom-element registration for the shared UI kit's m3e-backed
// components (plug-api/ui/{button,input,checkbox,badge}.tsx — `alert.tsx`'s
// own swap is DEFERRED, see its file header, so no `@m3e/web/snackbar` import
// belongs here). Those kit files deliberately don't self-register (they're
// also reachable from plug FUNCTION code with no DOM — see button.tsx's doc
// comment), so every real DOM-side consumer must. This is the Space Manager
// / login app's browser entry point, and `App.tsx`'s component tree
// (AdminView, Login, ProfileView, SpaceEditor/SpaceForm/GitSyncPage/
// AccessGrid/BindingFields, SpaceList, UsersView, ServerSettingsView,
// AuthenticationView/OidcWizard, RuntimesView) is the one place that reaches
// every consumer of these four kit components in this bundle — see the
// client/spaces_ui/setup.tsx and central.tsx entries for the
// wizard/central-admin equivalents.
import "@m3e/web/button";
import "@m3e/web/form-field";
import "@m3e/web/checkbox";
import "@m3e/web/chips";
// Elements this bundle's components render directly rather than through the
// kit: `m3e-dialog`/`m3e-dialog-action` (components/ConfirmDialog.tsx, the
// staged destructive-action confirm used by SpaceForm.tsx and UsersView.tsx),
// `m3e-list`/`m3e-list-item`/`m3e-list-action` (UsersView.tsx's API-token
// list, FolderPicker.tsx's subdirectory rows) and `m3e-breadcrumb` (the
// FolderPicker browse trail). Registered here, not in those files, because
// SpaceForm.tsx/UsersView.tsx are loaded by plain-Node vitest tests.
import "@m3e/web/dialog";
import "@m3e/web/list";
import "@m3e/web/breadcrumb";
import { App } from "./components/App.tsx";

import { NotificationProvider } from "./notifications.tsx";

render(
  <NotificationProvider>
    <App />
  </NotificationProvider>,
  document.getElementById("root")!,
);
