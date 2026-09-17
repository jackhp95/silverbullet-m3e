import { useEffect, useRef, useState } from "preact/hooks";
import { FilterList } from "./filter.tsx";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import { tagRegex as mdTagRegex } from "../markdown_parser/constants.ts";
import {
  extractHashtag,
  isMetaTag,
} from "@silverbulletmd/silverbullet/lib/tags";
import type {
  DocumentMeta,
  PageMeta,
} from "@silverbulletmd/silverbullet/type/index";
import {
  getNameFromPath,
  getPathExtension,
  isMarkdownPath,
  isValidName,
  parseToRef,
  type Path,
  type Ref,
} from "@silverbulletmd/silverbullet/lib/ref";
import { folderName } from "@silverbulletmd/silverbullet/lib/resolve";
import { safeRun } from "@silverbulletmd/silverbullet/lib/async";
import { type AnchorObject, anchorsToFilterOptions } from "./anchor_options.ts";

const tagRegex = new RegExp(mdTagRegex.source, "g");

// Strips `#tag` tokens out of a search phrase before it's fuzzy-matched
// against page names — mirrors the exact `phrasePreprocessor` AnythingPicker
// passes to FilterList below. Exported so search_sheet.tsx's "open" mode
// (which reuses buildAnythingPickerOptions with mode:"all", see that file)
// preprocesses its query the same way instead of re-deriving this from
// scratch.
export function stripHashtags(phrase: string): string {
  return phrase.replaceAll(tagRegex, "").trim();
}

// Lazily loads anchor objects (`$`-prefixed anchor search) exactly once per
// mount, the first time `anchorMode` goes true — extracted out of
// AnythingPicker's body so search_sheet.tsx's "open" mode can offer the same
// `$anchor` search without re-implementing the load-once/error-flash
// bookkeeping.
export function useAnchorOptions(
  anchorMode: boolean,
): AnchorObject[] | null {
  // null = not loaded yet. Loaded at most once per component lifetime, and
  // only if the user actually types "$" — costs nothing otherwise.
  const [anchors, setAnchors] = useState<AnchorObject[] | null>(null);
  // Tracks whether the load has already been kicked off, independent of
  // whether it has resolved yet. `anchors` stays null for the whole
  // duration of the in-flight request, so gating on `anchors !== null`
  // would let a second query fire if the user toggles anchor mode off
  // and back on before the first request completes. This ref is set
  // synchronously before the request starts and never cleared, so at
  // most one request is ever issued per component lifetime (a failed load
  // is not retried either).
  const loadStarted = useRef(false);

  useEffect(() => {
    if (!anchorMode || loadStarted.current) {
      return;
    }
    loadStarted.current = true;
    client
      .queryLuaObjects<AnchorObject>("anchor", {})
      .then(setAnchors)
      .catch((e: Error) => {
        console.error("Failed to load anchors", e);
        client.ui.flashNotification(
          `Failed to load anchors: ${e.message}`,
          "error",
        );
        setAnchors([]);
      });
  }, [anchorMode]);

  return anchors;
}

function isMetaPageOption(page: FilterOption) {
  return (
    page.meta.tags?.includes("template") ||
    page.meta.tags?.find((tag: string) => isMetaTag(tag))
  );
}

/**
 * Builds the raw (unfiltered-by-phrase) option list for a given page-picker
 * mode — the exact pages/documents/tags/anchors option-building AnythingPicker
 * has always done, extracted so search_sheet.tsx's "open" and "search" modes
 * (spec §2 items 3+4+5) can reuse it instead of re-deriving option shapes
 * from scratch. Behavior-identical to AnythingPicker's own inline
 * construction below (that component now just calls this).
 */
export function buildAnythingPickerOptions({
  mode,
  allPages,
  allDocuments,
  extensions,
  currentPath,
  anchorMode,
  anchors,
}: {
  mode: "page" | "meta" | "document" | "all";
  allPages: PageMeta[];
  allDocuments: DocumentMeta[];
  extensions: Set<string>;
  currentPath: Path;
  anchorMode: boolean;
  anchors: AnchorObject[] | null;
}): FilterOption[] {
  const options: FilterOption[] = [];

  if (!anchorMode && (mode === "document" || mode === "all")) {
    for (const documentMeta of allDocuments) {
      const isViewable = extensions.has(documentMeta.extension);

      let orderId = isViewable
        ? -new Date(documentMeta.lastModified).getTime()
        : Number.MAX_VALUE - new Date(documentMeta.lastModified).getTime();

      if (currentPath === documentMeta.name) {
        orderId = Infinity;
      }

      // Can't really add tags to document as of right now, but maybe in the future
      let description: string | undefined;
      if (documentMeta.tags) {
        description =
          (description || "") +
          documentMeta.tags.map((tag) => `#${tag}`).join(" ");
      }

      if (!isViewable && client.clientSystem.readOnlyMode) {
        continue;
      }

      options.push({
        type: "document",
        meta: documentMeta,
        name: documentMeta.name,
        description,
        orderId: orderId,
        hint: documentMeta.name.split(".").pop()?.toUpperCase(),
        hintInactive: !isViewable,
      });
    }
  }

  if (!anchorMode && mode !== "document") {
    for (const pageMeta of allPages) {
      // Sanitize the page name
      if (!pageMeta.name) {
        pageMeta.name = pageMeta.ref;
      }
      // Order by last modified date in descending order
      let orderId = -new Date(pageMeta.lastModified).getTime();
      // Unless it was opened in this session
      if (pageMeta.lastOpened) {
        orderId = -pageMeta.lastOpened;
      }
      // Or it's the currently open page
      if (currentPath === `${pageMeta.name}.md` || pageMeta._isAspiring) {
        // ... then we put it all the way to the end
        orderId = Infinity;
      }
      const cssClass = (pageMeta.pageDecoration?.cssClasses || [])
        .join(" ")
        .replaceAll(/[^a-zA-Z0-9-_ ]/g, "");

      if (mode === "page") {
        // Special behavior for regular pages
        let description: string | undefined;
        let aliases: string[] = [];
        if (pageMeta.displayName) {
          aliases.push(pageMeta.displayName);
        }
        if (Array.isArray(pageMeta.aliases)) {
          aliases = aliases.concat(pageMeta.aliases);
        }
        if (aliases.length > 0) {
          description = `(a.k.a. ${aliases.join(", ")}) `;
        }
        if (pageMeta.tags) {
          description =
            (description || "") +
            pageMeta.tags.map((tag) => `#${tag}`).join(" ");
        }
        options.push({
          type: "page",
          meta: pageMeta,
          name: pageMeta.name,
          prefix: pageMeta.pageDecoration?.prefix,
          description,
          orderId: orderId,
          hint: pageMeta._isAspiring ? "Create page" : undefined,
          cssClass,
        });
      } else if (mode === "meta") {
        // Special behavior for #meta pages
        if (pageMeta._isAspiring) {
          // Skip over broken links
          continue;
        }
        options.push({
          type: "page",
          meta: pageMeta,
          name: pageMeta.name,
          description: pageMeta.description
            ? pageMeta.description.slice(0, 200)
            : "",
          hint: pageMeta.tags![0],
          orderId: orderId,
          cssClass,
        });
      } else {
        // all
        // In mode "all" just show the full path and all tags
        let description: string | undefined;
        if (pageMeta.tags) {
          description = pageMeta.tags.map((tag) => `#${tag}`).join(" ");
        }
        options.push({
          type: "page",
          meta: pageMeta,
          name: pageMeta.name,
          description,
          orderId: orderId,
          cssClass,
        });
      }
    }
  }

  if (anchorMode) {
    options.push(...anchorsToFilterOptions(anchors ?? []));
  }

  return options;
}

/**
 * Resolves a selected (or undefined, i.e. dismissed) FilterOption into a
 * navigate call — AnythingPicker's own `onSelect` body, extracted so
 * search_sheet.tsx's "open" mode reuses the identical anchor-ref-vs-plain-
 * name resolution instead of reimplementing it (spec §2 items 3+4+5: "reuses
 * anything_picker.tsx's ... navigate handlers").
 */
export function resolveAnythingPickerSelection(
  opt: FilterOption | undefined,
  handlers: {
    onNavigate: (name: string | null) => void;
    onNavigateRef: (ref: Ref) => void;
  },
) {
  if (!opt) {
    handlers.onNavigate(null);
    return;
  }

  if (opt.type === "anchor") {
    const anchor = opt.meta as AnchorObject;
    // Page-qualified on purpose: duplicate anchor names each get
    // their own row, and this navigates to the one actually picked
    // instead of tripping the duplicate-anchor error path.
    handlers.onNavigateRef({
      path: `${anchor.page}.md` as Path,
      details: { type: "anchor", name: anchor.ref },
    });
    return;
  }

  const ref: string | undefined = opt.meta?.ref;
  const path = ref ? parseToRef(ref)?.path : null;
  const name = path ? getNameFromPath(path) : opt.name;
  handlers.onNavigate(name);
}

/**
 * The actual "navigate to this name" implementation editor_ui.tsx's
 * AnythingPicker call site used to define inline as its `onNavigate` prop —
 * extracted here (self-contained via the ambient `client`/`client.ui`,
 * exactly how this file already calls `client.queryLuaObjects`/
 * `client.ui.flashNotification` above) so both the standalone AnythingPicker
 * modal AND search_sheet.tsx's "open" mode share one implementation of
 * "resolve a typed/selected name into a real navigation, prompting for
 * invalid names or non-editable documents along the way" instead of two
 * diverging copies. `close` runs first (matching the original's own
 * ordering) so the picker/sheet dismisses immediately, before the
 * (possibly slow) name-resolution work below.
 */
export function navigateToAnythingPickerName(
  name: string | null,
  close: () => void,
) {
  close();
  setTimeout(() => client.focus());
  if (!name) {
    return;
  }
  safeRun(async () => {
    const ref = parseToRef(name);

    // Check beforehand, because we don't want to allow any link stuff like
    // #header here. The `!ref` check is just for Typescript.
    if (!isValidName(name) || !ref) {
      // It's not a valid name so either the user tried to create a page or
      // we have an invalid file in the space. Names are only unique for
      // files which follow our rules, so we are kind of in unknown
      // territory now.
      if (client.clientSystem.allKnownFiles.has(name)) {
        // Try it as a document name === path
        await client.ui.promptDocumentOperation(
          name as Path,
          `'${name}' has an invalid name. You can now modify it`,
        );
      } else if (client.clientSystem.allKnownFiles.has(`${name}.md`)) {
        // Try it as a page
        await client.ui.promptDocumentOperation(
          `${name}.md` as Path,
          `'${name}.md' has an invalid name. You can now modify it`,
        );
      } else {
        client.ui.flashNotification(
          `Couldn't create page ${name}, name is invalid`,
          "error",
        );
      }
      return;
    }

    if (
      !isMarkdownPath(ref.path) &&
      !Array.from(
        client.clientSystem.documentEditorHook.documentEditors.values(),
      ).some(({ extensions }) => extensions.includes(getPathExtension(ref.path)))
    ) {
      await client.ui.promptDocumentOperation(
        ref.path,
        "This file cannot be edited, select your desired action.",
      );
    } else {
      void client.open(ref);
    }
  });
}

/** `onNavigateRef` counterpart to `navigateToAnythingPickerName` above. */
export function navigateToAnythingPickerRef(ref: Ref, close: () => void) {
  close();
  setTimeout(() => client.focus());
  // client.navigate resolves $-anchor refs to a page + position.
  safeRun(async () => {
    await client.navigate(ref);
  });
}

export function AnythingPicker({
  allPages,
  allDocuments,
  extensions,
  onNavigate,
  onNavigateRef,
  onModeSwitch,
  mode,
  darkMode,
  currentPath,
}: {
  allDocuments: DocumentMeta[];
  allPages: PageMeta[];
  extensions: Set<string>;
  darkMode?: boolean;
  mode: "page" | "meta" | "document" | "all";
  onNavigate: (name: string | null) => void;
  onNavigateRef: (ref: Ref) => void;
  onModeSwitch: (mode: "page" | "meta" | "document" | "all") => void;
  currentPath: Path;
}) {
  const [anchorMode, setAnchorMode] = useState(false);
  const anchors = useAnchorOptions(anchorMode);

  const options: FilterOption[] = buildAnythingPickerOptions({
    mode,
    allPages,
    allDocuments,
    extensions,
    currentPath,
    anchorMode,
    anchors,
  });

  const completePrefix = `${folderName(currentPath) || getNameFromPath(currentPath)}/`;

  const allowNew = mode !== "document";
  const creatablePageNoun = mode !== "all" ? mode : "page";
  const openablePageNoun = mode !== "all" ? mode : "page or document";

  return (
    <FilterList
      placeholder={
        anchorMode
          ? "Anchor"
          : mode === "page"
            ? "Page"
            : mode === "meta"
              ? "#meta page"
              : mode === "document"
                ? "Document"
                : "Any page or Document, also hidden"
      }
      label="Open"
      options={options}
      darkMode={darkMode}
      onPhraseChange={(phrase) => {
        const next = phrase.startsWith("$");
        // Only touch state at the mode boundary. Setting it on every
        // keystroke would re-render this component and remap the entire
        // page list each time.
        if (next !== anchorMode) {
          setAnchorMode(next);
        }
      }}
      phrasePreprocessor={anchorMode ? undefined : stripHashtags}
      onKeyPress={(value, event) => {
        const text = value;
        // Pages cannot start with ^, as documented in Page Name Rules
        if (event.key === "^" && text === "^") {
          switch (mode) {
            case "page":
              onModeSwitch("meta");
              break;
            case "meta":
              onModeSwitch("document");
              break;
            case "document":
              onModeSwitch("all");
              break;
            case "all":
              onModeSwitch("page");
              break;
          }
          return true;
        }
        return false;
      }}
      preFilter={
        anchorMode
          ? undefined
          : (options, phrase) => {
              if (mode === "page") {
                const allTags = phrase.match(tagRegex);
                if (allTags) {
                  // Search phrase contains hash tags, let's pre-filter the results based on this
                  const filterTags = allTags.map((t) => extractHashtag(t));
                  options = options.filter((page) => {
                    if (!page.meta.tags) {
                      return false;
                    }
                    return filterTags.every((tag) =>
                      page.meta.tags.find((itemTag: string) =>
                        itemTag.startsWith(tag),
                      ),
                    );
                  });
                }
                // Remove pages that are tagged as templates or meta
                options = options.filter((page) => !isMetaPageOption(page));
              } else if (mode === "meta") {
                // Filter on pages tagged with "template" or "meta" prefix
                options = options.filter(isMetaPageOption);
              }

              if (mode !== "all") {
                // Filter out hidden pages
                options = options.filter(
                  (page) => !(page.meta.pageDecoration?.hide === true),
                );
              }
              return options;
            }
      }
      allowNew={anchorMode ? false : allowNew}
      helpText={
        anchorMode
          ? "Press <code>Enter</code> to jump to the selected anchor. If the list below is empty, your space has no anchors yet."
          : `Press <code>Enter</code> to open the selected ${openablePageNoun}` +
            (allowNew
              ? `, or <code>Shift-Enter</code> to create a new ${creatablePageNoun} with this exact name.`
              : "")
      }
      newHint={`Create ${creatablePageNoun}`}
      completePrefix={anchorMode ? undefined : completePrefix}
      onSelect={(opt) =>
        resolveAnythingPickerSelection(opt, { onNavigate, onNavigateRef })
      }
    />
  );
}
