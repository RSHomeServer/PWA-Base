import { catalogAppOrigin, getCatalogEntries } from "@platform/catalog";
import { Kbd, useTheme } from "@platform/ui";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CommandPalette.module.css";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  meta?: string;
  group: "Navigate" | "Theme";
  action: () => void;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.searchIcon}>
      <circle cx="7" cy="7" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 10l3.25 3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const entries = useMemo(() => getCatalogEntries(), []);

  const commands = useMemo<CommandItem[]>(
    () => [
      { id: "home", label: "Catalogue home", meta: "apps.songara.uk", group: "Navigate", action: () => navigate("/") },
      ...entries.map((entry) => ({
        id: entry.id,
        label: entry.title,
        meta: entry.host,
        group: "Navigate" as const,
        action: () => {
          window.location.assign(catalogAppOrigin(entry));
        },
      })),
      {
        id: "theme-light",
        label: "Light theme",
        group: "Theme",
        action: () => setTheme("light"),
      },
      {
        id: "theme-dark",
        label: "Dark theme",
        group: "Theme",
        action: () => setTheme("dark"),
      },
      {
        id: "theme-system",
        label: "System theme",
        group: "Theme",
        action: () => setTheme("system"),
      },
    ],
    [entries, navigate, setTheme],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(normalized) ||
        cmd.meta?.toLowerCase().includes(normalized),
    );
  }, [commands, query]);

  const runCommand = useCallback(
    (command: CommandItem) => {
      command.action();
      onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlightIndex(0);
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex(
          (prev) => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1),
        );
        return;
      }

      if (event.key === "Enter" && filtered[highlightIndex]) {
        event.preventDefault();
        runCommand(filtered[highlightIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, highlightIndex, onClose, runCommand]);

  if (!open) return null;

  const groups = ["Navigate", "Theme"] as const;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className={styles.searchRow}>
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder="Jump to an application or change theme…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-controls="command-palette-list"
          />
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>No matching commands.</p>
        ) : (
          <ul id="command-palette-list" className={styles.list} role="listbox">
            {groups.map((group) => {
              const items = filtered.filter((cmd) => cmd.group === group);
              if (items.length === 0) return null;

              return (
                <li key={group}>
                  <p className={styles.groupLabel}>{group}</p>
                  <ul className={styles.list}>
                    {items.map((cmd) => {
                      const index = filtered.indexOf(cmd);
                      const highlighted = index === highlightIndex;

                      return (
                        <li key={cmd.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={highlighted}
                            className={[styles.item, highlighted ? styles.itemHighlighted : null]
                              .filter(Boolean)
                              .join(" ")}
                            style={{ "--item-index": index } as CSSProperties}
                            onClick={() => runCommand(cmd)}
                            onMouseEnter={() => setHighlightIndex(index)}
                          >
                            <span>{cmd.label}</span>
                            {cmd.meta ? <span className={styles.itemMeta}>{cmd.meta}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        <div className={styles.footer}>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate · <Kbd>Enter</Kbd> select · <Kbd>Esc</Kbd> close
        </div>
      </div>
    </div>
  );
}
