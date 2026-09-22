import { useEffect, useState } from "preact/hooks";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Input,
} from "@silverbulletmd/silverbullet/ui";
// `Button`/`Input` render `m3e-button`/`m3e-form-field` — see
// plug-api/ui/button.tsx's doc comment on why these side-effect imports
// belong at each DOM-side consumer, not the kit files themselves.
import "@m3e/web/button";
import "@m3e/web/form-field";
import "@m3e/web/checkbox";
// The API-token list renders `m3e-list`/`m3e-list-item` directly — see
// FolderPicker.tsx's identical self-import comment.
import "@m3e/web/list";
import "../m3e-jsx.d.ts";
import {
  createToken,
  createUser,
  deleteToken,
  deleteUser,
  formatApiError,
  getUser,
  listUsers,
  setUserAdmin,
  setUserPassword,
} from "../api.ts";
import { useNavigate } from "../navigation.ts";
import { spacesUrl } from "../routes.ts";
import type { UserInfo } from "../types.ts";
import { Confirm } from "./ConfirmDialog.tsx";

/** A pending confirmation, staged from a click handler and resolved once the
 * user answers the `m3e-dialog` — see UserDetail's `confirmState`. */
type PendingConfirm = {
  message: string;
  destructive?: boolean;
  onConfirm: () => void;
};

function useUserList(onUnauthorized: () => void) {
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    listUsers()
      .then((users) => {
        setUsers(users);
        setLoaded(true);
      })
      .catch((error: any) => {
        if (error.unauthorized) onUnauthorized();
        else setError(formatApiError(error));
        setLoaded(true);
      });
  }, []);
  return { users, loaded, error };
}

export function UserList({
  currentUsername,
  onUnauthorized,
}: {
  currentUsername: string;
  onUnauthorized: () => void;
}) {
  const { users, loaded, error } = useUserList(onUnauthorized);
  return (
    <div>
      {/* No heading: this screen is only ever reached from the tab bar, which
          already names it. See SpaceList for the non-admin case. */}
      {error && <Alert variant="error">{error}</Alert>}
      {!loaded && <p>Loading…</p>}
      {loaded && Object.keys(users).length === 0 && <p>No users yet.</p>}
      {loaded && Object.keys(users).length > 0 && (
        <table class="sb-user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              {/* Actions column; the header stays empty. */}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(users)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([name, user]) => {
                const href = spacesUrl(`/users/${encodeURIComponent(name)}`);
                return (
                  <tr key={name}>
                    <td>
                      <a class="sb-user-link" href={href}>
                        {name}
                      </a>{" "}
                      {name === currentUsername && <Badge>you</Badge>}
                    </td>
                    <td>{user.admin ? "admin" : "user"}</td>
                    <td>
                      {/* Same destination as the name — an explicit control
                          for anyone who doesn't read the name as clickable,
                          mirroring the spaces list. */}
                      <a class="sb-button sb-user-edit" href={href}>
                        Edit
                      </a>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
      {loaded && (
        <div class="row">
          <a class="sb-button sb-button-primary" href={spacesUrl("/users/new")}>
            Create user
          </a>
        </div>
      )}
    </div>
  );
}

export function NewUser({ onUnauthorized }: { onUnauthorized: () => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        createUser(username, password, admin)
          .then(() =>
            navigate(
              spacesUrl(`/users/${encodeURIComponent(username.trim())}`),
            ),
          )
          .catch((error: any) => {
            if (error.unauthorized) onUnauthorized();
            else setError(formatApiError(error));
          });
      }}
    >
      <h1>Create user</h1>
      {error && <Alert variant="error">{error}</Alert>}
      <label for="new-user-username">Username</label>
      <Input
        id="new-user-username"
        value={username}
        onInput={(event) => setUsername(event.currentTarget.value)}
      />
      <label for="new-user-password">Password</label>
      <Input
        id="new-user-password"
        type="password"
        value={password}
        onInput={(event) => setPassword(event.currentTarget.value)}
      />
      <label>
        <Checkbox
          checked={admin}
          onChange={(event) => setAdmin(event.currentTarget.checked)}
        />{" "}
        Admin
      </label>
      <div class="row">
        <Button type="submit" variant="primary">
          Create user
        </Button>
        <a class="sb-button" href={spacesUrl("/users")}>
          Cancel
        </a>
      </div>
    </form>
  );
}

export function UserDetail({
  username,
  currentUsername,
  onUnauthorized,
}: {
  username: string;
  currentUsername: string;
  onUnauthorized: () => void;
}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [shownToken, setShownToken] = useState<string | undefined>();
  // Staged confirmation for a destructive/self-affecting action — replaces
  // the three `window.confirm()` calls this screen used to make (remove
  // own-admin, revoke token, delete user) with the `m3e-dialog`-backed
  // Confirm() rendered near the bottom of this component's JSX.
  const [confirmState, setConfirmState] = useState<PendingConfirm | null>(
    null,
  );
  const isSelf = username === currentUsername;

  async function reload() {
    try {
      setUser(await getUser(username));
      setError("");
    } catch (error: any) {
      if (error.unauthorized) onUnauthorized();
      else if (error.notFound) setNotFound(true);
      else setError(formatApiError(error));
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void reload();
  }, [username]);

  async function run(action: () => Promise<void>) {
    try {
      await action();
      setError("");
    } catch (error: any) {
      if (error.unauthorized) onUnauthorized();
      else setError(formatApiError(error));
    }
  }

  if (!loaded) return <p>Loading…</p>;
  if (notFound) {
    return (
      <div>
        <h1>User not found</h1>
        <p>
          <a href={spacesUrl("/users")}>Return to users</a>
        </p>
      </div>
    );
  }
  if (!user) return <Alert variant="error">{error || "User not found"}</Alert>;
  const tokenNames = Object.keys(user.tokens);
  return (
    <div>
      <h1>
        {username} {isSelf && <Badge>you</Badge>}
      </h1>
      {error && <Alert variant="error">{error}</Alert>}
      <section>
        <h2>Role</h2>
        <label>
          <Checkbox
            checked={user.admin}
            onChange={(event) => {
              const admin = event.currentTarget.checked;
              // The checkbox is controlled by `user.admin`, which does not
              // change until this resolves — cancelling just leaves the
              // dialog closed and the checkbox showing its unchanged value,
              // no manual revert needed (the old `window.confirm()` version
              // needed one, since the DOM checkbox flips before that
              // blocking call returns).
              if (isSelf && !admin) {
                setConfirmState({
                  message:
                    `Remove admin rights from your own account "${username}"? Your session will lose admin access immediately.`,
                  onConfirm: () => {
                    void run(async () => {
                      await setUserAdmin(username, admin);
                      location.assign("/");
                    });
                  },
                });
                return;
              }
              void run(async () => {
                await setUserAdmin(username, admin);
                await reload();
              });
            }}
          />{" "}
          Administrator
        </label>
      </section>
      <section>
        <h2>Password</h2>
        <div class="row">
          <Input
            type="password"
            aria-label="New password"
            placeholder="New password"
            value={password}
            onInput={(event) => setPassword(event.currentTarget.value)}
          />
          <Button
            variant="primary"
            onClick={() =>
              void run(async () => {
                await setUserPassword(username, password);
                setPassword("");
                if (isSelf) location.assign(loginUrlForUser(username));
              })
            }
          >
            Set password
          </Button>
        </div>
      </section>
      <section>
        <h2>API tokens</h2>
        {tokenNames.length === 0 && <p>No tokens.</p>}
        {tokenNames.length > 0 && (
          <m3e-list class="sb-token-list">
            {tokenNames.map((name) => (
              <m3e-list-item key={name}>
                {name}
                <span slot="supporting-text">
                  created{" "}
                  {new Date(user.tokens[name].createdAt).toLocaleString()}
                </span>
                <Button
                  slot="trailing"
                  onClick={() => {
                    setConfirmState({
                      message: `Revoke token "${name}" for "${username}"?`,
                      destructive: true,
                      onConfirm: () => {
                        void run(async () => {
                          await deleteToken(username, name);
                          await reload();
                        });
                      },
                    });
                  }}
                >
                  Revoke
                </Button>
              </m3e-list-item>
            ))}
          </m3e-list>
        )}
        <div class="row">
          <Input
            aria-label="Token name"
            placeholder="Token name"
            value={tokenName}
            onInput={(event) => setTokenName(event.currentTarget.value)}
          />
          <Button
            variant="primary"
            onClick={() => {
              const name = tokenName.trim();
              if (!name) return;
              void run(async () => {
                setShownToken(await createToken(username, name));
                setTokenName("");
                await reload();
              });
            }}
          >
            Create token
          </Button>
        </div>
        {shownToken && (
          <div class="flex flex-col gap-1 mt-2 sb-token-reveal">
            <Alert variant="warning">
              This token is shown only once — copy it now.
            </Alert>
            <Input
              readOnly
              value={shownToken}
              onClick={(event) => event.currentTarget.select()}
            />
            <Button onClick={() => setShownToken(undefined)}>Dismiss</Button>
          </div>
        )}
      </section>
      <div class="sb-danger-zone">
        <Button
          variant="danger"
          onClick={() => {
            const message = isSelf
              ? `Delete your own account "${username}"? You will be logged out immediately.`
              : `Delete user "${username}"?`;
            setConfirmState({
              message,
              destructive: true,
              onConfirm: () => {
                void run(async () => {
                  await deleteUser(username);
                  // Deleting your own account ends the session, so that one
                  // has to be a real navigation out of the app.
                  if (isSelf) location.assign("/");
                  else navigate(spacesUrl("/users"));
                });
              },
            });
          }}
        >
          Delete user
        </Button>
      </div>
      {confirmState && (
        <Confirm
          message={confirmState.message}
          destructive={confirmState.destructive}
          callback={(ok) => {
            const { onConfirm } = confirmState;
            setConfirmState(null);
            if (ok) onConfirm();
          }}
        />
      )}
    </div>
  );
}

function loginUrlForUser(username: string): string {
  const next = spacesUrl(`/users/${encodeURIComponent(username)}`);
  return `${spacesUrl("/login")}?next=${encodeURIComponent(next)}`;
}
