import type { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration, type EditorView } from "@codemirror/view";
import { decoratorStateField, isCursorInRange, LinkWidget } from "./util.ts";
import type { Client } from "../client.ts";
import {
  frontmatterMailtoRegex,
  frontmatterQuotesRegex,
  frontmatterUrlRegex,
  frontmatterWikiLinkRegex,
} from "../markdown_parser/constants.ts";
import { processWikiLink, type WikiLinkMatch } from "./wiki_link_processor.ts";

export function shouldRenderFrontmatterLivePreview({
  state,
  client,
  from,
  to,
}: {
  state: EditorState;
  client: Client;
  from: number;
  to: number;
}): boolean {
  return (
    !client.ui.viewState.uiOptions.markdownSyntaxRendering &&
    !isCursorInRange(state, [from, to])
  );
}

export function frontmatterPlugin(client: Client) {
  return decoratorStateField((state: EditorState) => {
    const widgets: any[] = [];
    const shortWikiLinks = client.config.get("shortWikiLinks", true);

    syntaxTree(state).iterate({
      enter(node) {
        // V5b (2026-09-22): this used to also handle "FrontMatterMarker" —
        // painting a `sb-line-frontmatter-outside` line decoration plus a
        // "▾/◂ frontmatter" `FrontmatterMarkerWidget` banner whenever the
        // cursor sat outside the block. That system predates (and, once the
        // real fold effect landed, actively fought with)
        // `frontmatter_folding.ts`'s `frontmatterFoldingExtension` +
        // `frontmatterFoldPlaceholderDOM`: frontmatter now ALWAYS auto-folds
        // while the selection is outside it (`shouldAutoFoldFrontmatter`),
        // and the inline `<FrontMatterPanel>` (client/components/
        // front_matter_panel.tsx) is the only rendering of frontmatter a
        // reader sees. With both systems live, the merged folded line still
        // carried this branch's line class/widget (verified via live
        // Playwright + computed-style inspection on :3333 — the folded
        // line's own DOM node had class `sb-line-frontmatter-outside
        // sb-frontmatter` and contained the `◂ frontmatter` marker span),
        // producing a leftover highlighted band + label the fold
        // placeholder's own now-empty content (see that file's L3 comment)
        // was supposed to have eliminated. Removed outright rather than
        // conditioned on fold state: the marker's own click-to-toggle-fold
        // affordance is now redundant with the placeholder's own
        // click-to-unfold handler AND the row-level "Edit as YAML" button
        // (`editFieldAsRawYaml`), so there's no remaining behavior to
        // preserve. The `FrontMatterCode` branch below (frontmatter link
        // rendering) is untouched — that fires only while the block is
        // genuinely unfolded and is unrelated to this defect.

        // Render links inside frontmatter code as clickable anchors (external and wiki links)
        if (node.name === "FrontMatterCode") {
          const oFrom = node.from;
          const oTo = node.to;
          const otext = state.sliceDoc(oFrom, oTo);

          let oMatch: RegExpExecArray | null;
          while ((oMatch = frontmatterQuotesRegex.exec(otext)) !== null) {
            const from = oFrom + (oMatch.index ?? 0);
            const to = from + oMatch[0].length;
            const text = state.sliceDoc(from, to);

            // 1) External links: http(s), <scheme>:// URLs
            frontmatterUrlRegex.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = frontmatterUrlRegex.exec(text)) !== null) {
              const mFrom = from + (match.index ?? 0);
              const mTo = mFrom + match[0].length;
              const url = match[1];
              if (
                !shouldRenderFrontmatterLivePreview({
                  state,
                  client,
                  from: mFrom,
                  to: mTo,
                })
              ) {
                continue;
              }
              widgets.push(
                Decoration.replace({
                  widget: new LinkWidget({
                    text: url,
                    title: `Open ${url}`,
                    href: url,
                    cssClass: "sb-external-link",
                    from: mFrom,
                    callback: (e) => {
                      if (e.altKey) {
                        // Move cursor into the link
                        client.editorView.dispatch({
                          selection: { anchor: mFrom },
                        });
                        client.focus();
                        return;
                      }
                      try {
                        // Open http(s) links in a new window/tab, open
                        // alternate schemes in the same page, as they'll
                        // bounce to another application.
                        if (/^https?:\/\//i.test(url)) {
                          globalThis.open(url, "_blank");
                        } else {
                          globalThis.open(url, "_self");
                        }
                      } catch (err) {
                        console.error("Failed to open external link", err);
                      }
                    },
                  }),
                }).range(mFrom, mTo),
              );
            }

            // 2) Internal links: WikiLinks [[...]] (make navigable)
            frontmatterWikiLinkRegex.lastIndex = 0;
            let wMatch: RegExpExecArray | null;
            while ((wMatch = frontmatterWikiLinkRegex.exec(text)) !== null) {
              if (!wMatch || !wMatch.groups) {
                return;
              }
              const mFrom = from + (wMatch.index ?? 0);
              const mTo = mFrom + wMatch[0].length;

              const wikiLinkMatch: WikiLinkMatch = {
                leadingTrivia: wMatch.groups.leadingTrivia,
                stringRef: wMatch.groups.stringRef,
                alias: wMatch.groups.alias,
                trailingTrivia: wMatch.groups.trailingTrivia,
              };

              const decorations = processWikiLink({
                from: mFrom,
                to: mTo,
                match: wikiLinkMatch,
                matchFrom: mFrom,
                matchTo: mTo,
                client,
                shortWikiLinks,
                state,
                callback: (e, ref) => {
                  if (e.altKey) {
                    // Move cursor into the link's content
                    client.editorView.dispatch({
                      selection: {
                        anchor: mFrom + wikiLinkMatch.leadingTrivia.length,
                      },
                    });
                    client.focus();
                    return;
                  }
                  void client.navigate(ref, false, e.ctrlKey || e.metaKey);
                },
              });

              widgets.push(...decorations);
            }

            // 3) mailto:... links
            frontmatterMailtoRegex.lastIndex = 0;
            let mMatch: RegExpExecArray | null;
            while ((mMatch = frontmatterMailtoRegex.exec(text)) !== null) {
              const mFrom = from + (mMatch.index ?? 0);
              const mTo = mFrom + mMatch[0].length;
              const url = mMatch[1];
              const address = url.slice(7);
              if (
                !shouldRenderFrontmatterLivePreview({
                  state,
                  client,
                  from: mFrom,
                  to: mTo,
                })
              ) {
                continue;
              }
              widgets.push(
                Decoration.replace({
                  widget: new LinkWidget({
                    text: url,
                    title: `Mail ${address}`,
                    href: url,
                    cssClass: "sb-external-link",
                    from: mFrom,
                    callback: (e) => {
                      if (e.altKey) {
                        // Move cursor into the link
                        client.editorView.dispatch({
                          selection: { anchor: mFrom },
                        });
                        client.focus();
                        return;
                      }
                      try {
                        globalThis.open(url, "_self");
                      } catch (err) {
                        console.error("Failed to open external link", err);
                      }
                    },
                  }),
                }).range(mFrom, mTo),
              );
            }
          }
        }
      },
    });
    return Decoration.set(widgets, true);
  });
}
