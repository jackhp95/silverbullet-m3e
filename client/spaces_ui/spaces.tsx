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
import { App } from "./components/App.tsx";

import { NotificationProvider } from "./notifications.tsx";

render(
  <NotificationProvider>
    <App />
  </NotificationProvider>,
  document.getElementById("root")!,
);
