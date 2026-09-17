import { useEffect, useRef, useState } from "preact/hooks";
import { Input } from "@silverbulletmd/silverbullet/ui";
import "@m3e/web/bottom-sheet";
import "@m3e/web/form-field";
import "@m3e/web/textarea-autosize";
import "@m3e/web/segmented-button";
import "@m3e/web/button";
import "@m3e/web/icon";
import "./m3e-jsx.d.ts";

// Real m3e-bottom-sheet (node_modules/@m3e/web/dist/src/bottom-sheet/
// BottomSheetElement.d.ts, v2.7.12) hosting ONE unified item-creation form,
// replacing three separate flows this round:
//  1. the old 5-item "New" `m3e-fab-menu` speed-dial (floating_toolbar.tsx),
//  2. the old idea_capture_sheet.tsx (a single-purpose "Jot down an idea"
//     sheet — its `m3e-bottom-sheet` usage and Preact-controlled-`open`
//     rationale are carried over verbatim into this file, see below),
//  3. the old top-aligned native-`<dialog>` `this.prompt()` flow that used
//     to ask for a short title per type (task/event/contact/idea) and,
//     separately, a page name for "New note" (client/editor_ui.tsx's old
//     `newMenuItems`).
//
// Fully Preact-controlled via the `open` boolean property (Preact assigns
// real element properties on custom elements it recognizes, not stringified
// attributes — see the fork's own researched note in the m3e integration
// report, Addendum 2), so no m3e-bottom-sheet-trigger indirection is needed:
// the floating toolbar's "New" button (floating_toolbar.tsx) just flips
// `open` to true directly. `modal` (scrim + focus trap) + `handle`
// (drag-to-dismiss affordance) + `hideable` (swipe-to-dismiss) match the
// component's own documented example for a modal action sheet.

export type CaptureItemType = "task" | "event" | "contact" | "idea" | "note";

// Ordered to match the old fab-menu's own item order (task, event, contact,
// idea, note) so the segmented button reads the same left-to-right as the
// menu it replaces. `contentLabel`/`placeholder` describe the *non-note*
// (multi-line capture) case; "note" overrides both — see the `isNote`
// special-case below.
const ITEM_TYPES: ReadonlyArray<{
  type: CaptureItemType;
  label: string;
  icon: string;
  contentLabel: string;
  placeholder: string;
}> = [
  {
    type: "task",
    label: "Task",
    icon: "checklist",
    contentLabel: "Task",
    placeholder: "What needs doing?",
  },
  {
    type: "event",
    label: "Event",
    icon: "event",
    contentLabel: "Event",
    placeholder: "What's happening, and when?",
  },
  {
    type: "contact",
    label: "Contact",
    icon: "person_add",
    contentLabel: "Contact",
    placeholder: "Name and any details",
  },
  {
    type: "idea",
    label: "Idea",
    icon: "lightbulb",
    contentLabel: "Idea",
    placeholder: "Jot it down before it's gone",
  },
  {
    type: "note",
    label: "Note",
    icon: "note_add",
    contentLabel: "Page name",
    placeholder: "e.g. Projects/Roadmap",
  },
];

const DEFAULT_TYPE: CaptureItemType = "task";

export function ItemCaptureSheet({
  open,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  onCancel: () => void;
  // `text` is already trimmed and non-empty by the time this fires — see
  // `trySubmit` below.
  onSubmit: (type: CaptureItemType, text: string) => void;
}) {
  const [type, setType] = useState<CaptureItemType>(DEFAULT_TYPE);
  const [text, setText] = useState("");
  const singleLineRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  // Verified live 2026-09-16 (computed-style inspection, not a guess): Preact
  // sets known custom-element boolean props — the `handle` JSX shorthand
  // below — as a real DOM PROPERTY (`el.handle = true`), per this file's own
  // Addendum-2 rationale. But `M3eBottomSheetElement`'s compiled stylesheet
  // (node_modules/@m3e/web/dist/bottom-sheet.js) gates its ENTIRE `.header`
  // region — the drag-handle row AND the `slot="header"` title text — behind
  // a plain CSS *attribute* selector, `:host(:not([handle])) .header {
  // display: none }`, and `handle` is not a reflecting property here (setting
  // the JS property alone never adds the HTML attribute). Net effect without
  // this: the sheet opened with no visible title and no drag dimple, both
  // silently `display: none`. Force the real attribute once the element
  // exists so the component's own CSS sees it.
  useEffect(() => {
    sheetRef.current?.setAttribute("handle", "");
  }, []);

  // "note" is the one type whose single text field means the page NAME, not
  // free-form content (see the module doc comment above the component for
  // the full rationale) — everything from the visible label down to which
  // control renders (single-line `Input` vs a real multi-line
  // `m3e-textarea-autosize`d `<textarea>`) branches on this one flag.
  const isNote = type === "note";
  const config = ITEM_TYPES.find((t) => t.type === type)!;

  useEffect(() => {
    if (open) {
      setType(DEFAULT_TYPE);
      setText("");
      // Focus after the sheet's own open transition/animation has started,
      // same as idea_capture_sheet.tsx's original timing rationale. Default
      // type is "task" (non-note), so the textarea is what's focused.
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  const trySubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(type, trimmed);
  };

  return (
    <m3e-bottom-sheet
      id="sb-item-capture-sheet"
      ref={sheetRef}
      modal
      handle
      hideable
      open={open}
      onCancel={() => onCancel()}
      onClosed={() => onCancel()}
    >
      <span slot="header">New {config.label.toLowerCase()}</span>
      <div className="sb-item-capture-sheet-body">
        {
          // A small, fixed, mutually-exclusive set of choices — exactly the
          // documented single-select `m3e-segmented-button` use case
          // (SegmentedButtonElement.d.ts's own first example is this same
          // shape: 4 mutually-exclusive `m3e-button-segment`s). `checked` is
          // set per-segment from Preact state (not `name`+native radio
          // semantics) because the component tracks selection itself
          // (`M3eSegmentedButtonElement.value`/`.selected`) and fires
          // `input` on change, matching every other controlled element in
          // this file.
        }
        <m3e-segmented-button
          aria-label="Item type"
          onInput={(e: Event) => {
            const target = e.currentTarget as unknown as {
              value: string | readonly string[] | null;
            };
            const value = Array.isArray(target.value)
              ? target.value[0]
              : target.value;
            if (value) setType(value as CaptureItemType);
          }}
        >
          {ITEM_TYPES.map((t) => (
            <m3e-button-segment
              key={t.type}
              value={t.type}
              checked={t.type === type}
            >
              <m3e-icon slot="icon" name={t.icon}></m3e-icon>
              {t.label}
            </m3e-button-segment>
          ))}
        </m3e-segmented-button>
        <m3e-form-field>
          <label slot="label" for="sb-item-capture-field">
            {config.contentLabel}
          </label>
          {isNote
            ? (
              // "note" doesn't capture content, it names a page to create
              // and navigate to — same single-line `Input` + Enter-to-
              // confirm pattern idea_capture_sheet.tsx used for its one
              // field, reused here as-is for this one type.
              <Input
                // This call site already supplies its own surrounding
                // `m3e-form-field` (below) shared with the textarea branch —
                // see the `bare` prop's doc comment on plug-api/ui/input.tsx.
                bare
                id="sb-item-capture-field"
                inputRef={singleLineRef}
                value={text}
                placeholder={config.placeholder}
                onInput={(e) => setText(e.currentTarget.value)}
                onConfirm={() => trySubmit()}
                onExit={() => onCancel()}
              />
            )
            : (
              // task/event/contact/idea capture free-form content, which the
              // old this.prompt()-per-type flow only ever gave a single
              // native <input> line for — a real, auto-growing multi-line
              // `textarea` (m3e-textarea-autosize, its own doc's exact
              // `m3e-form-field` + `for`-linked-`textarea` composition) is a
              // straightforward upgrade for the ones that generalize now
              // (idea, one-line-forever, but task/event/contact benefit from
              // any followed line breaks).
              <>
                <textarea
                  id="sb-item-capture-field"
                  ref={textareaRef}
                  value={text}
                  placeholder={config.placeholder}
                  rows={1}
                  onInput={(e) =>
                    setText((e.currentTarget as HTMLTextAreaElement).value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      onCancel();
                    } else if (
                      e.key === "Enter" && (e.metaKey || e.ctrlKey)
                    ) {
                      // Cmd/Ctrl-Enter submits — plain Enter must stay a
                      // real newline in a multi-line field.
                      e.preventDefault();
                      trySubmit();
                    }
                  }}
                >
                </textarea>
                <m3e-textarea-autosize
                  for="sb-item-capture-field"
                  min-rows={2}
                  max-rows={8}
                >
                </m3e-textarea-autosize>
              </>
            )}
        </m3e-form-field>
        <m3e-button
          variant="filled"
          type="button"
          disabled={!text.trim()}
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            trySubmit();
          }}
        >
          {isNote ? "Create page" : `Add ${config.label.toLowerCase()}`}
        </m3e-button>
      </div>
    </m3e-bottom-sheet>
  );
}
