import type { ComponentProps } from "preact";
import type { X } from "preact-feather";

type FeatherProps = ComponentProps<typeof X>;
import type { FunctionalComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import { Input } from "@silverbulletmd/silverbullet/ui";
import { fuzzySearchAndSort } from "../lib/fuzzy_search.ts";
import { isMobileDevice } from "../lib/mobile.ts";
import { deepEqual } from "../../plug-api/lib/json.ts";
import "@m3e/web/list";
import "./m3e-jsx.d.ts";

export function FilterList({
  placeholder,
  options,
  label,
  onSelect,
  onKeyPress,
  onPhraseChange,
  preFilter,
  phrasePreprocessor,
  allowNew = false,
  helpText = "",
  completePrefix,
  icon: Icon,
  newHint,
}: {
  placeholder: string;
  options: FilterOption[];
  label: string;
  onKeyPress?: (value: string, event: KeyboardEvent) => boolean;
  onPhraseChange?: (phrase: string) => void;
  onSelect: (option: FilterOption | undefined) => void;
  preFilter?: (options: FilterOption[], phrase: string) => FilterOption[];
  phrasePreprocessor?: (phrase: string) => string;
  darkMode?: boolean;
  allowNew?: boolean;
  completePrefix?: string;
  helpText: string;
  newHint?: string;
  icon?: FunctionalComponent<FeatherProps>;
}) {
  const [text, setText] = useState("");
  const [matchingOptions, setMatchingOptions] = useState(
    fuzzySearchAndSort(preFilter ? preFilter(options, "") : options, ""),
  );
  const [selectedOption, setSelectionOption] = useState(0);

  // m3e-list-item (not a div) is the selected-row DOM node we scroll into view.
  const selectedElementRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // See the matching skip in the navigator's `focusInput`: on a touch device
    // this focus leaves the field focused with no on-screen keyboard, and no
    // tap can recover one.
    if (isMobileDevice()) return;
    inputRef.current?.focus();
  }, []);

  function updateFilter(originalPhrase: string) {
    const prefilteredOptions = preFilter
      ? preFilter(options, originalPhrase)
      : options;
    if (phrasePreprocessor) {
      originalPhrase = phrasePreprocessor(originalPhrase);
    }
    const results = fuzzySearchAndSort(prefilteredOptions, originalPhrase);
    const foundExactMatch = !!results.find(
      (result) => result.name === originalPhrase,
    );
    if (allowNew && !foundExactMatch && originalPhrase) {
      results.splice(1, 0, {
        name: originalPhrase,
        hint: newHint,
      });
    }

    if (!deepEqual(matchingOptions, results)) {
      // Only do this (=> rerender of UI) if the results have changed
      setMatchingOptions(results);
      setSelectionOption(0);
    }
  }

  useEffect(() => {
    updateFilter(text);
  }, [options, text]);

  useEffect(() => {
    onPhraseChange?.(text);
  }, [text]);

  useEffect(() => {
    function closer() {
      onSelect(undefined);
    }

    document.addEventListener("click", closer);

    return () => {
      document.removeEventListener("click", closer);
    };
  }, []);

  // Clicks anywhere inside the search view (label, input, results) must not
  // reach the document-level `closer` above.
  function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  const returnEl = (
    // mode="fullscreen", not "docked": FilterList is always-mounted-when-
    // shown (no separate closed/collapsed search-bar state to preserve),
    // and "docked" mode renders its own persistent anchored container +
    // scrim on top of the .sb-modal-box chrome below — literally the
    // "container within a container within a container" nesting Jack
    // flagged (confirmed live: DOM-inspecting the open modal showed
    // .sb-modal-box's own border/box-shadow/background wrapping
    // m3e-search-view's own docked-mode container/scrim wrapping the
    // results list). "fullscreen" gives m3e-search-view a single native
    // top-level chrome instead. The .sb-modal-box CLASS stays (its child
    // selectors in modals.scss/colors.scss still theme .sb-help-text/
    // .sb-result-list/.sb-option/.sb-hint here) — see the
    // `m3e-search-view.sb-modal-box` override in modals.scss that cancels
    // just the outer box-chrome properties (border/shadow/background/
    // fixed width) so they don't stack on top of the native chrome.
    <m3e-search-view
      class="sb-modal-box"
      mode="fullscreen"
      open
      hide-search-icon
    >
      <label
        slot="open-leading"
        class="sb-header-label"
        onClick={stopPropagation}
      >
        {label}
      </label>
      <Input
        // m3e-search-view's "input" slot contract requires a plain <input>
        // (see the m3e skill's search card) — see the `bare` prop's doc
        // comment on plug-api/ui/input.tsx.
        bare
        slot="input"
        inputRef={inputRef}
        class="sb-filter-input"
        autocapitalize="off"
        autocorrect="off"
        spellcheck={false}
        value={text}
        placeholder={placeholder}
        onClick={stopPropagation}
        onInput={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          // While composing with an IME (e.g. selecting a CJK candidate),
          // let the input/IME handle every key — don't select/navigate.
          if (e.isComposing) {
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            onSelect(
              e.shiftKey && allowNew
                ? { name: text, type: "page" }
                : matchingOptions[selectedOption],
            );
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onSelect(undefined);
            return;
          }
          if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
            setSelectionOption(Math.max(0, selectedOption - 1));
          } else if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
            setSelectionOption(
              Math.min(matchingOptions.length - 1, selectedOption + 1),
            );
          } else if (e.key === "PageUp") {
            setSelectionOption(Math.max(0, selectedOption - 5));
          } else if (e.key === "PageDown") {
            setSelectionOption(
              Math.min(matchingOptions.length - 1, selectedOption + 5),
            );
          } else if (e.key === "Home") {
            setSelectionOption(0);
          } else if (e.key === "End") {
            setSelectionOption(matchingOptions.length - 1);
          } else if (
            e.key === " " &&
            completePrefix &&
            e.currentTarget.value === ""
          ) {
            setText(completePrefix);
          } else {
            return;
          }
          e.preventDefault();
          setTimeout(() => {
            selectedElementRef.current?.scrollIntoView({ block: "nearest" });
          });
        }}
        onKeyUp={(e) => {
          if (e.code === "Space" && e.altKey) {
            if (matchingOptions.length > 0) {
              const value = e.currentTarget.value.trimEnd();
              const option = matchingOptions[0];
              if (option.name.toLowerCase().startsWith(value.toLowerCase())) {
                let nextSlash = option.name.indexOf("/", value.length + 1);
                if (nextSlash === -1) {
                  nextSlash = Infinity;
                }
                setText(option.name.slice(0, nextSlash));
              } else {
                setText(`${option.name.split("/")[0]}/`);
              }
            }
            return;
          }
          if (onKeyPress) {
            onKeyPress(e.currentTarget.value, e);
          }
        }}
      />
      <div
        className="sb-help-text"
        onClick={stopPropagation}
        dangerouslySetInnerHTML={{ __html: helpText }}
      ></div>
      <m3e-list class="sb-result-list" tabIndex={-1} onClick={stopPropagation}>
        {matchingOptions && matchingOptions.length > 0
          ? (() => {
              let optionIndex = 0;

              return matchingOptions.map((option) => {
                const currentOptionIndex = optionIndex;
                optionIndex++;

                return (
                  <m3e-list-item
                    key={`option-${currentOptionIndex}`}
                    ref={
                      selectedOption === currentOptionIndex
                        ? selectedElementRef
                        : undefined
                    }
                    class={
                      (selectedOption === currentOptionIndex
                        ? "sb-option sb-selected-option"
                        : "sb-option") +
                      (option.cssClass
                        ? ` sb-decorated-object ${option.cssClass}`
                        : "")
                    }
                    onMouseMove={() => {
                      if (selectedOption !== currentOptionIndex) {
                        setSelectionOption(currentOptionIndex);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(option);
                    }}
                  >
                    {Icon && (
                      <span slot="leading" className="sb-icon">
                        <Icon width={16} height={16} />
                      </span>
                    )}
                    <span className="sb-name">
                      {(option.prefix ?? "") + option.name}
                    </span>
                    {option.hint && (
                      <span
                        slot="trailing"
                        className={
                          "sb-hint" +
                          (option.hintInactive ? " sb-hint-inactive" : "")
                        }
                      >
                        {option.hint}
                      </span>
                    )}
                    {option.description && (
                      <span slot="supporting-text" className="sb-description">
                        {option.description}
                      </span>
                    )}
                  </m3e-list-item>
                );
              });
            })()
          : null}
      </m3e-list>
    </m3e-search-view>
  );

  return returnEl;
}
