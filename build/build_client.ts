import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import * as sass from "sass";

const execFileAsync = promisify(execFile);

/**
 * Compile `client/styles/tailwind.css` with the Tailwind v4 CLI and return
 * the generated CSS.
 *
 * WHY THE CLI AND NOT POSTCSS
 * ---------------------------
 * Tailwind v4 offers three integration surfaces: a Vite plugin, a PostCSS
 * plugin (`@tailwindcss/postcss`), and this standalone CLI
 * (`@tailwindcss/cli`). This repo has neither Vite nor PostCSS — the entire
 * client CSS build is the bespoke `sass.compileString()` loop below, and the
 * wider build is already a hand-sequenced series of discrete steps (esbuild,
 * file copies, bundle string-patching).
 *
 * Choosing the PostCSS plugin would mean adding PostCSS itself, wiring a
 * processor, and maintaining a second plugin pipeline — a whole toolchain
 * introduced solely as a host for one plugin, with no other consumer in the
 * repo. The CLI needs none of that: it is one devDependency whose input is a
 * CSS file and whose output is a CSS file, which is exactly the shape of the
 * existing Sass step it sits beside. It is also the surface Tailwind
 * documents for precisely this case (a project with no supported bundler).
 *
 * The cost is a subprocess per build. That is already the norm here (see
 * build/version.ts, which spawns `git`), and it is a few hundred ms on a
 * build that runs esbuild over the whole client.
 *
 * `--output -` would be the natural choice, but the CLI writes its banner to
 * stdout too, so we go through a file in the dist dir and read it back.
 */
async function buildTailwind(dist: string): Promise<string> {
  const out = `${dist}/.tailwind.tmp.css`;
  await execFileAsync(
    process.execPath,
    [
      "node_modules/@tailwindcss/cli/dist/index.mjs",
      "--input",
      "client/styles/tailwind.css",
      "--output",
      out,
      "--minify",
    ],
    { cwd: process.cwd() },
  );
  const css = await readFile(out, "utf-8");
  await rm(out, { force: true });
  return css;
}

import { patchBundledJS } from "../client/plugos/plug_compile.ts";

export async function buildClient(): Promise<void> {
  await mkdir("client_bundle/client", { recursive: true });
  await mkdir("client_bundle/base_fs", { recursive: true });

  console.log("Now ESBuilding the client and service workers...");

  const baseBuildConfig: esbuild.BuildOptions = {
    outdir: "client_bundle/client",
    absWorkingDir: process.cwd(),
    bundle: true,
    treeShaking: true,
    // Safari 16.4 is the oldest engine the client actually works on (regex lookbehind and CSS
    // @property need it) and corresponds to macOS 12 Monterey
    target: ["safari16.4"],
    sourcemap: "linked",
    minify: true,
    jsxFactory: "h",
    format: "esm",
    chunkNames: ".client/[name]-[hash]",
    jsx: "automatic",
    jsxFragment: "Fragment",
    jsxImportSource: "preact",
  };

  const buildConfigs: Array<[String, esbuild.BuildOptions]> = [
    [
      "client",
      {
        ...baseBuildConfig,
        entryPoints: [
          {
            in: "client/boot.ts",
            out: ".client/client",
          },
        ],
        splitting: true,
      },
    ],
    [
      "service worker",
      {
        ...baseBuildConfig,
        entryPoints: [
          {
            in: "client/service_worker.ts",
            out: "service_worker",
          },
        ],
        splitting: false,
      },
    ],
    [
      "spaces ui",
      {
        ...baseBuildConfig,
        entryPoints: [
          {
            in: "client/spaces_ui/spaces.tsx",
            out: ".client/spaces",
          },
        ],
        splitting: false,
      },
    ],
    [
      "setup ui",
      {
        ...baseBuildConfig,
        entryPoints: [
          {
            in: "client/spaces_ui/setup.tsx",
            out: ".client/setup",
          },
        ],
        splitting: false,
      },
    ],
    [
      "auth ui",
      {
        ...baseBuildConfig,
        entryPoints: [
          {
            in: "client/spaces_ui/auth.tsx",
            out: ".client/auth",
          },
          { in: "client/spaces_ui/central.tsx", out: ".client/central" },
        ],
        splitting: false,
      },
    ],
  ];

  for (const [buildName, buildConfig] of buildConfigs) {
    const result = await esbuild.build(buildConfig);

    if (result.metafile) {
      const text = await esbuild.analyzeMetafile(result.metafile!);
      console.log(`Bundle info for ${buildName}`, text);
    }
  }

  await copyAssets("client_bundle/client/.client");
  await patchServiceWorker();

  console.log("Built!");
}

async function copyAssets(dist: string) {
  await mkdir(dist, { recursive: true });
  await cp("client/fonts", dist, { recursive: true });
  await cp("client/html", dist, { recursive: true });
  await cp("client/images/favicon-96x96.png", `${dist}/favicon-96x96.png`);
  await cp("client/images/favicon.svg", `${dist}/favicon.svg`);
  await cp("client/images/favicon.ico", `${dist}/favicon.ico`);
  await cp(
    "client/images/apple-touch-icon.png",
    `${dist}/apple-touch-icon.png`,
  );
  await cp("client/images/logo.png", `${dist}/logo.png`);
  await cp("client/images/logo-dock.png", `${dist}/logo-dock.png`);
  // Avoid loading the 405 KB original for a ~26 CSS px wordmark.
  await cp("client/images/logo-dock-96x96.png", `${dist}/logo-dock-96x96.png`);

  // Three stylesheets, all compiled from the same partials so they cannot
  // drift: main.css for the editor, app.css for the standalone pages (login,
  // setup wizard, Space Manager) and components.css for plug panel iframes —
  // the last kept under that name because `panelStyles()` and the plug docs
  // reference it.
  // Tailwind v4 runs as a separate pass (see buildTailwind above for why it
  // cannot go through Sass) and its output is appended to the bundles that
  // have authored, scannable markup behind them.
  //
  // Appended, not prepended, but the order is not what decides the cascade:
  // everything Tailwind emits is inside `@layer theme/utilities`, and layered
  // rules always lose to unlayered ones regardless of source order. Every
  // rule in the SCSS bundles is unlayered. That is the safety property that
  // makes this drop-in: adding Tailwind cannot outrank a single existing
  // rule, so an unconverted `.sb-*` rule keeps winning until the day it is
  // deleted. It also means a Phase 2 conversion is only complete when the
  // SCSS rule is removed — leaving both in place silently keeps the old one.
  const tailwindCss = await buildTailwind(dist);
  const withTailwind = new Set([
    "main.css", // editor surface
    "app.css", // standalone pages (login, setup wizard, Space Manager)
    // NOT components.css — plug-panel iframes render HTML authored outside
    // this repo, so its classes can never be scanned. See the @source note
    // in client/styles/tailwind.css.
  ]);

  for (const [entry, output] of [
    ["main.scss", "main.css"],
    ["app.scss", "app.css"],
    ["components_bundle.scss", "components.css"],
  ]) {
    const scss = await readFile(`client/styles/${entry}`, "utf-8");
    const compiled = sass.compileString(scss, {
      loadPaths: ["client/styles"],
      style: "compressed",
    });
    const css = withTailwind.has(output)
      ? `${compiled.css}\n${tailwindCss}`
      : compiled.css;
    await writeFile(`${dist}/${output}`, css, "utf-8");
  }

  // HACK: Patch the JS by removing an invalid regex
  let bundleJs = await readFile(`${dist}/client.js`, "utf-8");
  bundleJs = patchBundledJS(bundleJs);
  bundleJs = patchPushConfig(bundleJs);
  await writeFile(`${dist}/client.js`, bundleJs, "utf-8");
}

// Web Push (spec §5.1): fill in the `{{VAPID_PUBLIC_KEY}}` /
// `{{PUSH_SIDECAR_URL}}` placeholders `augmentBootConfig` (client/boot.ts)
// stamps into BootConfig, same technique as `patchServiceWorker`'s
// `{{CACHE_NAME}}`/`{{PRECACHE_FILES}}` below — neither value is known at
// dispatch/authoring time (the sidecar, built in parallel in a different
// repo, hasn't reported its real VAPID key or port yet), so both come from
// env vars read at build time and default to "" when unset. An unset key
// means the push toggle renders as "not configured" instead of guessing.
//
// PUSH_SIDECAR_URL should be set to a relative same-origin proxy path, e.g.
// `/.proxy/localhost:8791`, NOT an absolute `http://localhost:8791`. The
// sidecar has no CORS headers, so an absolute cross-origin URL makes the
// browser preflight the POST, the sidecar 404s the OPTIONS, and the
// subscribe call fails with "Failed to fetch" (this bit a live deploy — the
// bundle baked the absolute form while the page was served cross-origin).
// Routing through this server's own `/.proxy/{*path}` handler
// (`server/src/handlers/proxy.rs`) is same-origin, so no preflight happens;
// see `client/lib/push_subscribe.ts` for the corresponding
// `X-Proxy-Header-Content-Type` header rewrite that proxy requires. An
// absolute URL is still supported for a sidecar with its own CORS handling.
function patchPushConfig(code: string): string {
  return code
    .replaceAll("{{VAPID_PUBLIC_KEY}}", process.env.VAPID_PUBLIC_KEY ?? "")
    .replaceAll("{{PUSH_SIDECAR_URL}}", process.env.PUSH_SIDECAR_URL ?? "");
}

// Shells and bundles for the server-level surfaces (Space Manager at /.spaces,
// the setup wizard at /.setup) and the per-space login page. None of these are
// part of the offline app shell: they are entry points the service worker must
// never answer from cache. Add an entry here when adding a bundle entry point.
const NOT_PRECACHED = new Set([
  "auth.html",
  "authorize.html",
  "auth.js",
  "index.html",
  "central.html",
  "central.js",
  "spaces.html",
  "spaces.js",
  "setup.html",
  "setup.js",
  "app.css",
  "LICENSE.md",
]);

async function patchServiceWorker() {
  const clientDir = "client_bundle/client/.client";
  const allFiles = await readdir(clientDir);
  const precacheFiles = [
    "/", // The index page
    "/.client/manifest.json", // Dynamically generated by the server, but needed for PWA
    ...allFiles
      .filter((f) => !f.endsWith(".map") && !NOT_PRECACHED.has(f))
      .map((f) => `/.client/${f}`),
  ];
  const precacheFilesStr = precacheFiles.join(",");

  let swCode = await readFile(
    "client_bundle/client/service_worker.js",
    "utf-8",
  );
  swCode = swCode.replaceAll("{{CACHE_NAME}}", `cache-${Date.now()}`);
  swCode = swCode.replaceAll("{{PRECACHE_FILES}}", precacheFilesStr);
  await writeFile("client_bundle/client/service_worker.js", swCode, "utf-8");
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await buildClient();
  await esbuild.stop();
}
