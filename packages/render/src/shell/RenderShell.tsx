import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Button, Kbd, Link } from "@platform/ui";
import "../styles/render-page.css";
import styles from "./RenderShell.module.css";
import { useMountShimmer } from "../hooks/useMountShimmer.js";
import { useResetFeedback } from "../hooks/useResetFeedback.js";
import type { RenderShellProps } from "../lab/types.js";

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

export function RenderShell({
  title,
  tagline,
  badge = "Render",
  badgeVariant = "accent",
  shortcuts,
  onReset,
  onExport,
  toolbarExtra,
  overlay,
  statusBar,
  about,
  aboutSummary = "About",
  frameMaxWidth = 1440,
  frameAspectRatio = "4 / 3",
  onImmersiveChange,
  backHref,
  backLabel = "← Back",
  demoNav,
  onMount,
  children,
}: RenderShellProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMounting = useMountShimmer();
  const { isResetting, withResetFeedback } = useResetFeedback();

  const handleReset = withResetFeedback(onReset);
  const previewShortcuts = shortcuts.slice(0, 3);
  const isImmersive = isFullscreen;
  const prev = demoNav?.prev;
  const next = demoNav?.next;

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const nextImmersive = document.fullscreenElement === frameRef.current;
      setIsFullscreen(nextImmersive);
      onImmersiveChange?.(nextImmersive);
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
    <main className="render-page render-shell">
      <header className={chromeClassName("render-page-header")}>
        {backHref ? (
          <Link href={backHref} className="render-back-link">
            {backLabel}
          </Link>
        ) : null}
        <div className={styles.titleRow}>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
        <h1>{title}</h1>
        {tagline ? <p className="render-lead">{tagline}</p> : null}
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
                      <Kbd className={styles.renderKbd}>{s.keys}</Kbd>
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
                <Kbd className={styles.renderKbd}>{s.keys}</Kbd>
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
          <summary className={styles.aboutSummary}>{aboutSummary}</summary>
          <div className={styles.aboutBody}>
            <div className={styles.prose}>{about}</div>
          </div>
        </details>

        {prev || next ? (
          <nav className={chromeClassName(styles.demoNav)} aria-label="Demo navigation">
            {prev ? (
              <Link href={prev.href}>← {prev.title}</Link>
            ) : (
              <span aria-hidden="true">←</span>
            )}
            {next ? (
              <Link href={next.href}>{next.title} →</Link>
            ) : (
              <span aria-hidden="true">→</span>
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}

export type { RenderShellProps };
