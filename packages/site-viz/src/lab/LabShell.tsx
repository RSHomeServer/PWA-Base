import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Kbd, Link } from "@platform/ui";
import { adjacentDemos, demoHref } from "../demos/catalog.js";
import { recordDemoView } from "../gallery/storage.js";
import "../site.css";
import { useMountShimmer } from "../flagship/shared/useMountShimmer.js";
import { useResetFeedback } from "../flagship/shared/useResetFeedback.js";
import { LabHelpOverlay } from "./LabHelpOverlay.js";
import { LabModeTabs } from "./LabModeTabs.js";
import { LabParamPanel } from "./LabParamPanel.js";
import { LabToolbar } from "./LabToolbar.js";
import styles from "./LabShell.module.css";
import type { LabShellProps } from "./types.js";
import { useLabShortcuts } from "./useLabShortcuts.js";

export function LabShell({
  title,
  tagline,
  demoPath,
  badge = "Lab",
  badgeVariant = "accent",
  about,
  shortcuts,
  children,
  overlay,
  statusBar,
  params,
  paramPanelTitle = "Parameters",
  modes,
  activeMode,
  onModeChange,
  transport,
  playing = false,
  speed = 1,
  speedOptions = [0.5, 1, 2],
  onReset,
  onExport,
  toolbarExtra,
  frameMaxWidth = 1600,
  frameAspectRatio = "16 / 10",
  stageRef: externalStageRef,
  onImmersiveChange,
  defaultAboutOpen = false,
  backHref,
  backLabel = "← All visualisations",
  hideShortcutStrip = false,
}: LabShellProps) {
  const internalStageRef = useRef<HTMLDivElement>(null);

  const setStageRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalStageRef.current = node;
      if (externalStageRef) {
        externalStageRef.current = node;
      }
    },
    [externalStageRef],
  );
  const [aboutOpen, setAboutOpen] = useState(defaultAboutOpen);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMounting = useMountShimmer();
  const { isResetting, withResetFeedback } = useResetFeedback();

  const resolvedActiveMode = activeMode ?? modes?.[0]?.id ?? "";
  const hasSidebar = Boolean(params || (modes && modes.length > 0 && onModeChange));
  const { prev, next } = demoPath ? adjacentDemos(demoPath) : { prev: null, next: null };

  const handleReset = withResetFeedback(onReset ?? transport?.onReset);
  const handleStep = transport?.onStep;
  const handleSpeedChange = transport?.onSpeedChange;
  const hasReset = Boolean(onReset ?? transport?.onReset);
  const hasStep = Boolean(handleStep);
  const hasPlay = Boolean(transport?.onToggle || transport?.onPlay || transport?.onPause);
  const showTransport = hasReset || hasStep || hasPlay;

  const handleTogglePlay = () => {
    if (transport?.onToggle) {
      transport.onToggle();
      return;
    }
    if (playing) {
      transport?.onPause?.();
    } else {
      transport?.onPlay?.();
    }
  };

  const handleFullscreen = useCallback(() => {
    const stage = internalStageRef.current;
    if (!stage) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void stage.requestFullscreen?.();
    }
  }, []);

  const { showHelp, toggleHelp, closeHelp, previewShortcuts } = useLabShortcuts({
    shortcuts,
    handlers: {
      onTogglePlay: handleTogglePlay,
      onStep: handleStep,
      onReset: handleReset,
      onFullscreen: handleFullscreen,
    },
  });

  useEffect(() => {
    if (!demoPath) {
      return;
    }
    const id = demoPath.replace(/^\//, "");
    if (id) {
      recordDemoView(id);
    }
  }, [demoPath]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const nextImmersive = document.fullscreenElement === internalStageRef.current;
      setIsFullscreen(nextImmersive);
      onImmersiveChange?.(nextImmersive);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onImmersiveChange]);

  const isImmersive = isFullscreen;
  const resolvedBackHref = backHref ?? demoHref("");

  const stageClassName = [
    styles.stage,
    isMounting ? styles.stageMounting : "",
    isResetting ? styles.stageResetting : "",
    isImmersive ? styles.isImmersive : "",
  ]
    .filter(Boolean)
    .join(" ");

  const chromeClassName = (base: string) =>
    [base, isImmersive ? styles.chromeHidden : ""].filter(Boolean).join(" ");

  const showTransportControls = showTransport;

  return (
    <main className="viz-page viz-lab">
      <header className={chromeClassName("viz-page-header")}>
        <Link href={resolvedBackHref} className="viz-back-link">
          {backLabel}
        </Link>
        <div className={styles.titleRow}>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
        <h1>{title}</h1>
        {tagline ? <p className="viz-lead">{tagline}</p> : null}
      </header>

      <div className={styles.shell}>
        <div
          className={[styles.workspace, hasSidebar ? styles.workspaceWithSidebar : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles.stageColumn}>
            <div className={styles.stageStage}>
              <div className={styles.stageGlow} aria-hidden="true" />
              <div
                ref={setStageRef}
                className={stageClassName}
                data-immersive={isImmersive ? "true" : undefined}
                style={{
                  maxWidth: `${frameMaxWidth}px`,
                  aspectRatio: isFullscreen ? undefined : frameAspectRatio,
                }}
              >
                <div className={styles.stageVignette} aria-hidden="true" />
                {isMounting ? <div className={styles.stageShimmer} aria-hidden="true" /> : null}
                {children}
                {overlay ? <div className={styles.overlay}>{overlay}</div> : null}

                <LabHelpOverlay shortcuts={shortcuts} open={showHelp} onClose={closeHelp} />

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
              </div>
            </div>

            <LabToolbar
              playing={playing}
              onTogglePlay={showTransportControls ? handleTogglePlay : undefined}
              onStep={hasStep ? handleStep : undefined}
              onReset={hasReset ? handleReset : undefined}
              onExport={onExport}
              onFullscreen={handleFullscreen}
              onToggleHelp={toggleHelp}
              helpOpen={showHelp}
              showTransport={showTransportControls}
              speed={speed}
              speedOptions={handleSpeedChange ? speedOptions : undefined}
              onSpeedChange={handleSpeedChange}
              extra={toolbarExtra}
              immersive={isImmersive}
            />
          </div>

          {hasSidebar ? (
            <div className={chromeClassName(styles.sidebar)}>
              {modes && modes.length > 0 && onModeChange ? (
                <LabModeTabs
                  modes={modes}
                  activeMode={resolvedActiveMode}
                  onModeChange={onModeChange}
                />
              ) : null}
              {params ? <LabParamPanel title={paramPanelTitle}>{params}</LabParamPanel> : null}
            </div>
          ) : null}
        </div>

        {!hideShortcutStrip ? (
          <div className={chromeClassName(styles.hintStrip)} aria-label="Keyboard shortcuts">
            <button
              type="button"
              className={styles.hintTrigger}
              onClick={toggleHelp}
              aria-label="Show all keyboard shortcuts"
              aria-pressed={showHelp}
              title="All shortcuts"
            >
              ?
            </button>
            <span className={styles.hintDivider} aria-hidden="true" />
            <ul className={styles.hintList}>
              {previewShortcuts.map((shortcut) => (
                <li key={shortcut.keys}>
                  <Kbd className={styles.labKbd}>{shortcut.keys}</Kbd>
                  <span>{shortcut.label}</span>
                </li>
              ))}
            </ul>
            {shortcuts.length > previewShortcuts.length ? (
              <button type="button" className={styles.hintMore} onClick={toggleHelp}>
                +{shortcuts.length - previewShortcuts.length} more
              </button>
            ) : null}
          </div>
        ) : null}

        {statusBar ? <div className={chromeClassName(styles.statusBar)}>{statusBar}</div> : null}

        <details
          className={chromeClassName(
            `${styles.education} ${aboutOpen ? styles.educationOpen : ""}`,
          )}
          open={defaultAboutOpen}
          onToggle={(event) => setAboutOpen(event.currentTarget.open)}
        >
          <summary className={styles.educationSummary}>How this lab works</summary>
          <div className={styles.educationBody}>
            <div className={styles.prose}>{about}</div>
          </div>
        </details>

        {prev || next ? (
          <nav className={chromeClassName(styles.demoNav)} aria-label="Lab navigation">
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

export type { LabShellProps } from "./types.js";
