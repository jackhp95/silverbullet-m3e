import { Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
// `Input` renders `m3e-form-field` — see plug-api/ui/input.tsx's doc comment.
import "@m3e/web/form-field";
// The browse panel's breadcrumb trail and subdirectory list render
// `m3e-breadcrumb`/`m3e-list` directly (not through the shared kit — neither
// has a plug-api/ui wrapper), so this file self-imports their side effects,
// matching the fork's established per-consumer convention (see
// plug-api/ui/button.tsx's doc comment on why these live at the DOM-side
// consumer rather than a shared barrel).
import "@m3e/web/breadcrumb";
import "@m3e/web/list";
import "./m3e-jsx.d.ts";

/**
 * Reusable server-side folder picker shared by the setup wizard
 * (`apiBase="/.setup/api"`) and the space manager (`apiBase="api/admin"`), both
 * built from `client/spaces_ui`. It is deliberately functional rather than
 * fancy:
 *
 * - a text input for typing a path directly (relative paths resolve against
 *   the server root; absolute paths are allowed),
 * - a debounced status line driven by `GET <apiBase>/fs/dirs?path=…`
 *   (exists / will be created / not a directory / not writable),
 * - an optional "Browse…" panel that walks the server's directory tree using
 *   the same endpoint's `suggestions`: breadcrumb segments ascend, the
 *   subdirectory list descends. Every navigation immediately prefills the
 *   text input with the current path — extend it by hand afterwards if the
 *   target folder doesn't exist yet.
 *
 * The endpoint answers `{ status, writable, suggestions }`; see the server's
 * `dir_completion`. This component owns its own `fetch` (no api.ts dependency)
 * so it can be imported by either bundle entry point (`spaces.tsx`,
 * `setup.tsx`).
 */

type DirsResponse = {
  status: "exists" | "missing" | "notADirectory";
  writable: boolean;
  suggestions: string[];
};

async function fetchDirs(
  apiBase: string,
  path: string,
): Promise<DirsResponse | null> {
  try {
    const r = await fetch(
      `${apiBase}/fs/dirs?path=${encodeURIComponent(path)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    return (await r.json()) as DirsResponse;
  } catch {
    return null;
  }
}

/** Breadcrumb entries for a browse path, outermost (root) first. */
function crumbsFor(path: string): Array<{ label: string; target: string }> {
  const absolute = path.startsWith("/");
  const segments = path.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; target: string }> = [
    { label: absolute ? "/" : "root", target: absolute ? "/" : "" },
  ];
  let acc = absolute ? "" : "";
  for (const seg of segments) {
    acc = acc === "" ? seg : `${acc}/${seg}`;
    crumbs.push({ label: seg, target: absolute ? `/${acc}` : acc });
  }
  return crumbs;
}

export function FolderPicker({
  value,
  onChange,
  apiBase,
  id,
  placeholder = "spaces/notes",
  browseStart,
}: {
  value: string;
  onChange: (v: string) => void;
  apiBase: string;
  id?: string;
  placeholder?: string;
  /**
   * Where "Browse…" opens. Defaults to the current value (list its own
   * subdirectories). The wizard passes the value's *parent*, since its
   * prepopulated `<root>/spaces/<slug>` folder doesn't exist yet — browsing
   * its parent shows the real sibling folders to pick from.
   */
  browseStart?: string;
}) {
  const [status, setStatus] = useState<DirsResponse | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [browsePath, setBrowsePath] = useState("");
  const [browseDirs, setBrowseDirs] = useState<string[]>([]);

  /** Browse navigation: descend/ascend AND prefill the input with the path,
   * so picking a folder is just navigating to it (extend by hand for a
   * folder that doesn't exist yet). */
  function navigate(path: string) {
    setBrowsePath(path);
    onChange(path);
  }

  // Debounced status line for the typed value.
  useEffect(() => {
    if (!value) {
      setStatus(null);
      return;
    }
    const t = setTimeout(async () => {
      setStatus(await fetchDirs(apiBase, value));
    }, 300);
    return () => clearTimeout(t);
  }, [value, apiBase]);

  // Listing for the browse panel: subdirectories of `browsePath`.
  useEffect(() => {
    if (!browsing) return;
    let cancelled = false;
    void (async () => {
      const listPath = browsePath ? `${browsePath.replace(/\/+$/, "")}/` : "";
      const r = await fetchDirs(apiBase, listPath);
      if (!cancelled) setBrowseDirs(r?.suggestions ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [browsing, browsePath, apiBase]);

  function statusLine() {
    if (!value || !status) return null;
    if (status.status === "exists") {
      return status.writable ? (
        <span class="sb-spaces-ok">✓ directory exists</span>
      ) : (
        <span class="sb-spaces-error">not writable</span>
      );
    }
    if (status.status === "missing") return <span>will be created</span>;
    return <span class="sb-spaces-error">not a directory</span>;
  }

  return (
    <Fragment>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.value)}
      />
      <div class="sb-folder-picker-status flex items-center gap-3 mt-1">
        {statusLine()}
        <button
          type="button"
          class="sb-link-button bg-transparent border-none shadow-none p-0 underline cursor-pointer hover:bg-transparent focus:outline-none focus:shadow-none focus-visible:outline-offset-2 focus-visible:rounded-sm"
          onClick={() => {
            setBrowsing((b) => !b);
            const start = (browseStart ?? value).replace(/\/+$/, "");
            setBrowsePath(start);
          }}
        >
          {browsing ? "Close" : "Browse…"}
        </button>
      </div>
      {browsing && (
        <div class="sb-folder-browser mt-2 py-2 px-3">
          <m3e-breadcrumb class="block mb-2" aria-label="Folder path" wrap>
            {crumbsFor(browsePath).map((c, i, crumbs) => (
              <m3e-breadcrumb-item
                key={`${c.target}-${i}`}
                item-label={c.label}
                // Marks the last crumb (the folder currently being browsed)
                // as the trail's current location for assistive tech — it
                // stays clickable like every other crumb (navigating to the
                // folder you're already in is a harmless no-op, same as the
                // original plain-button implementation).
                current={i === crumbs.length - 1 ? "location" : undefined}
                onClick={() => navigate(c.target)}
              >
                {c.label}
              </m3e-breadcrumb-item>
            ))}
          </m3e-breadcrumb>
          {browseDirs.length === 0 ? (
            <p class="sb-folder-empty">No subdirectories</p>
          ) : (
            <m3e-list class="block max-h-48 overflow-y-auto">
              {browseDirs.map((dir) => (
                <m3e-list-action key={dir} onClick={() => navigate(dir)}>
                  {dir.split("/").filter(Boolean).pop() || dir}
                </m3e-list-action>
              ))}
            </m3e-list>
          )}
        </div>
      )}
    </Fragment>
  );
}
