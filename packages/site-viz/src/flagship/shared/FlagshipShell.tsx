import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Button, Kbd, Link } from "@platform/ui";
import { adjacentDemos, demoHref } from "../../demos/catalog.js";
import { recordDemoView } from "../../gallery/storage.js";
import "../../site.css";
import styles from "./FlagshipShell.module.css";
import { useMountShimmer } from "./useMountShimmer.js";
import { useResetFeedback } from "./useResetFeedback.js";

export interface FlagshipShortcut {
  keys: string;
  label: string;
}

export interface FlagshipShellProps {
  title: string;
  tagline: string;
  /** Route path segment, e.g. "/mandelbrot-explorer" */
  demoPath: string;
  shortcuts: FlagshipShortcut[];
  onReset?: () => void;
  onExport?: () => void;
  /** Extra controls rendered in the toolbar, e.g. palette picker, mode buttons. */
  toolbarExtra?: ReactNode;
  /** Absolutely positioned HUD content layered on top of the canvas frame. */
  overlay?: ReactNode;
  /** Live readouts rendered below the canvas (energy, FPS, generation, etc). */
  statusBar?: ReactNode;
  /** Explanation of the underlying science / math, shown in a collapsible panel. */
  about: ReactNode;
  frameMaxWidth?: number;
  frameAspectRatio?: string;
  /**
   * Notified whenever immersive fullscreen is entered/exited, so the exhibit can
   * boost particle counts, detail, or bloom while it's filling a conference wall.
   * Immersive state is also exposed as `data-immersive` on the frame element for
   * consumers that would rather query the DOM than thread a callback through.
   */
  onImmersiveChange?: (immersive: boolean) => void;
  children: ReactNode;
}

interface ToolbarActionProps {
  tooltip: string;
  children: ReactNode;
}

function ToolbarAction({ tooltip, children }: ToolbarActionProps) {
  const tipId = useId();

  return (
    <span className={styles.toolWrap} data-tooltip={tooltip}>
      <span id={tipId} className={styles.srOnly}>
        {tooltip}
      </span>
      <span aria-describedby={tipId}>{children}</span>
    </span>
  );
}

export function FlagshipShell({
  title,
  tagline,
  demoPath,
  shortcuts,
  onReset,
  onExport,
  toolbarExtra,
  overlay,
  statusBar,
  about,
  frameMaxWidth = 1440,
  frameAspectRatio = "4 / 3",
  onImmersiveChange,
  children,
}: FlagshipShellProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMounting = useMountShimmer();
  const { isResetting, withResetFeedback } = useResetFeedback();
  const { prev, next } = adjacentDemos(demoPath);

  const handleReset = withResetFeedback(onReset);
  const previewShortcuts = shortcuts.slice(0, 3);
  const isImmersive = isFullscreen;

  useEffect(() => {
    const id = demoPath.replace(/^\//, "");
    if (id) recordDemoView(id);
  }, [demoPath]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const next = document.fullscreenElement === frameRef.current;
      setIsFullscreen(next);
      onImmersiveChange?.(next);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onImmersiveChange]);

  const handleFullscreen = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void frame.requestFullscreen?.();
    }
  }, []);

  const frameClassName = [
    styles.frame,
    isMounting ? styles.frameMounting : "",
    isResetting ? styles.frameResetting : "",
    isImmersive ? styles.isImmersive : "",
  ]
    .filter(Boolean)
    .join(" ");

  const chromeClassName = (base: string) =>
    [base, isImmersive ? styles.chromeHidden : ""].filter(Boolean).join(" ");

  return (
    <main className="viz-page viz-flagship">
      <header className={chromeClassName("viz-page-header")}>
        <Link href={demoHref("")} className="viz-back-link">
          ← All visualisations
        </Link>
        <div className={styles.titleRow}>
          <Badge variant="accent">Flagship</Badge>
        </div>
        <h1>{title}</h1>
        <p className="viz-lead">{tagline}</p>
      </header>

      <div className={styles.shell}>
        <div className={styles.frameStage}>
          <div className={styles.frameGlow} aria-hidden="true" />
          <div
            ref={frameRef}
            className={frameClassName}
            data-immersive={isImmersive ? "true" : undefined}
            style={{
              maxWidth: `${frameMaxWidth}px`,
              aspectRatio: isFullscreen ? undefined : frameAspectRatio,
            }}
          >
            <div className={styles.frameVignette} aria-hidden="true" />
            {isMounting ? <div className={styles.frameShimmer} aria-hidden="true" /> : null}
            {children}
            {overlay ? <div className={styles.overlay}>{overlay}</div> : null}

            {isImmersive ? (
              <button
                type="button"
                className={styles.immersiveExit}
                onClick={handleFullscreen}
                title="Exit fullscreen"
                aria-label="Exit fullscreen"
              >
                ✕ Exit fullscreen
              </button>
            ) : null}

            {showShortcuts ? (
              <div className={styles.shortcutPanel}>
                <div className={styles.shortcutHeader}>
                  <span>Keyboard &amp; mouse</span>
                  <button
                    type="button"
                    className={styles.shortcutClose}
                    onClick={() => setShowShortcuts(false)}
                    aria-label="Close shortcut legend"
                  >
                    ×
                  </button>
                </div>
                <ul className={styles.shortcutList}>
                  {shortcuts.map((s) => (
                    <li key={s.keys}>
                      <Kbd className={styles.flagshipKbd}>{s.keys}</Kbd>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className={chromeClassName(styles.toolbarFloat)}>
          <div className={styles.toolbar} role="toolbar" aria-label="Canvas controls">
            {onReset ? (
              <ToolbarAction tooltip="Reset simulation to its initial state">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  title="Reset simulation"
                >
                  ⟲ Reset
                </Button>
              </ToolbarAction>
            ) : null}
            {onExport ? (
              <ToolbarAction tooltip="Download the current canvas as a PNG image">
                <Button variant="secondary" size="sm" onClick={onExport} title="Export PNG">
                  ⬇ Export PNG
                </Button>
              </ToolbarAction>
            ) : null}
            <ToolbarAction tooltip="Expand the canvas to fill your screen">
              <Button variant="secondary" size="sm" onClick={handleFullscreen} title="Fullscreen">
                ⛶ Fullscreen
              </Button>
            </ToolbarAction>
            <ToolbarAction tooltip="Show all keyboard and mouse shortcuts">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowShortcuts((v) => !v)}
                title="Keyboard shortcuts"
                aria-pressed={showShortcuts}
              >
                ⌨ Shortcuts
              </Button>
            </ToolbarAction>
            {toolbarExtra}
          </div>
        </div>

        <div className={chromeClassName(styles.hintStrip)} aria-label="Keyboard shortcuts">
          <button
            type="button"
            className={styles.hintTrigger}
            onClick={() => setShowShortcuts((v) => !v)}
            aria-label="Show all keyboard shortcuts"
            aria-pressed={showShortcuts}
            title="All shortcuts"
          >
            ?
          </button>
          <span className={styles.hintDivider} aria-hidden="true" />
          <ul className={styles.hintList}>
            {previewShortcuts.map((s) => (
              <li key={s.keys}>
                <Kbd className={styles.flagshipKbd}>{s.keys}</Kbd>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
          {shortcuts.length > previewShortcuts.length ? (
            <button
              type="button"
              className={styles.hintMore}
              onClick={() => setShowShortcuts(true)}
            >
              +{shortcuts.length - previewShortcuts.length} more
            </button>
          ) : null}
        </div>

        {statusBar ? <div className={chromeClassName(styles.statusBar)}>{statusBar}</div> : null}

        <details
          className={chromeClassName(`${styles.about} ${aboutOpen ? styles.aboutOpen : ""}`)}
          onToggle={(e) => setAboutOpen(e.currentTarget.open)}
        >
          <summary className={styles.aboutSummary}>What am I looking at?</summary>
          <div className={styles.aboutBody}>
            <div className={styles.prose}>{about}</div>
          </div>
        </details>

        {prev || next ? (
          <nav className={chromeClassName(styles.demoNav)} aria-label="Flagship navigation">
            {prev ? (
              <Link href={demoHref(prev.path)}>← {prev.title}</Link>
            ) : (
              <span aria-hidden="true">←</span>
            )}
            {next ? (
              <Link href={demoHref(next.path)}>{next.title} →</Link>
            ) : (
              <span aria-hidden="true">→</span>
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
