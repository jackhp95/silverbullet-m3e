import { FilterList } from "./filter.tsx";
import { Terminal } from "preact-feather";
import type { Command } from "../types/command.ts";
import type { FilterOption } from "@silverbulletmd/silverbullet/type/client";
import { isMacLike, prettifyShortcut } from "../../plug-api/lib/shortcut.ts";
import { safeRun } from "@silverbulletmd/silverbullet/lib/async";

/**
 * Builds the command-palette option list (name/keyboard-hint/recency-or-
 * priority order) from a commands map — extracted out of CommandPalette's
 * body so search_sheet.tsx's "run" mode (spec §2 items 3+4+5) reuses the
 * exact same option-building instead of re-deriving it. `orderId` doubles as
 * the recency sort: most-recently-run commands get the most negative
 * orderId, so an *empty*-query `fuzzySearchAndSort` call (which just sorts
 * by orderId, see lib/fuzzy_search.ts) already yields "commands sorted by
 * def.lastRun" for free — exactly what L12's run-mode history needs.
 */
export function buildCommandPaletteOptions(
  commands: Map<string, Command>,
): FilterOption[] {
  const options: FilterOption[] = [];
  for (const [name, def] of commands.entries()) {
    if (def.hide) {
      continue;
    }

    options.push({
      name: name,
      hint: keyboardHint(def),
      orderId:
        def.lastRun !== undefined ? -def.lastRun : -(Number(def.priority) || 0),
    });
  }
  return options;
}

/** Resolves a selected FilterOption back to its Command, by name. */
export function commandFromOption(
  opt: FilterOption | undefined,
  commands: Map<string, Command>,
): Command | undefined {
  return opt ? commands.get(opt.name) : undefined;
}

/**
 * The actual "run this command" implementation editor_ui.tsx's
 * CommandPalette call site used to define inline as its `onTrigger` prop —
 * extracted (self-contained via the ambient `client`) so both the
 * standalone CommandPalette modal AND search_sheet.tsx's "run" mode share
 * one implementation of "register the run, execute it, report errors"
 * instead of two diverging copies. `close` runs first, matching the
 * original's own ordering.
 */
export function triggerCommand(cmd: Command | undefined, close: () => void) {
  safeRun(async () => {
    close();
    if (cmd) {
      await client.registerCommandRun(cmd.name);
      try {
        const returnValue = await cmd.run!();
        if (returnValue !== false) {
          client.focus();
        }
      } catch (e: any) {
        client.reportError(e, "Command invocation");
      }
    } else {
      setTimeout(() => client.focus());
    }
  });
}

export function CommandPalette({
  commands,
  onTrigger,
  darkMode,
}: {
  commands: Map<string, Command>;
  darkMode?: boolean;
  onTrigger: (command: Command | undefined) => void;
}) {
  const options: FilterOption[] = buildCommandPaletteOptions(commands);
  return (
    <FilterList
      label="Run"
      placeholder="Command"
      options={options}
      allowNew={false}
      icon={Terminal}
      darkMode={darkMode}
      helpText="Start typing the command name to filter results, press <code>Enter</code> to run."
      onSelect={(opt) => onTrigger(commandFromOption(opt, commands))}
    />
  );
}

export function keyboardHint(def: {
  key?: string | string[];
  mac?: string | string[];
}): string | undefined {
  const shortcuts: string[] = [];
  if (isMacLike && def.mac) {
    if (Array.isArray(def.mac)) {
      shortcuts.push(...def.mac);
    } else {
      shortcuts.push(def.mac);
    }
  } else if (def.key) {
    if (Array.isArray(def.key)) {
      shortcuts.push(...def.key);
    } else {
      shortcuts.push(def.key);
    }
  }
  return shortcuts.length > 0
    ? shortcuts.map(prettifyShortcut).join(" | ")
    : undefined;
}
