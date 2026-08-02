import { Button } from "@platform/ui";
import type { LabToolbarProps } from "./types.js";
import styles from "./LabShell.module.css";
import { LabTooltip } from "./LabTooltip.js";
import { LabTransport } from "./LabTransport.js";

export function LabToolbar({
  playing = false,
  onTogglePlay,
  onStep,
  onReset,
  onExport,
  onFullscreen,
  onToggleHelp,
  helpOpen = false,
  showTransport = true,
  speed = 1,
  speedOptions,
  onSpeedChange,
  extra,
  immersive = false,
}: LabToolbarProps) {
  const showPlayControls = showTransport && (onTogglePlay || onStep || onReset);

  return (
    <div
      className={[styles.toolbarFloat, immersive ? styles.chromeHidden : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.toolbar} role="toolbar" aria-label="Lab controls">
        {showPlayControls ? (
          <LabTransport
            playing={playing}
            speed={speed}
            speedOptions={speedOptions}
            onToggle={onTogglePlay}
            onStep={onStep}
            onReset={onReset}
            onSpeedChange={onSpeedChange}
            compact
          />
        ) : null}

        {showPlayControls && (onExport || onFullscreen || onToggleHelp || extra) ? (
          <span className={styles.toolbarDivider} aria-hidden="true" />
        ) : null}

        {onExport ? (
          <LabTooltip label="Download the current stage as a PNG image">
            <Button variant="secondary" size="sm" onClick={onExport} title="Export PNG">
              ⬇ Export
            </Button>
          </LabTooltip>
        ) : null}

        {onFullscreen ? (
          <LabTooltip label="Expand the stage to fill your screen (F)">
            <Button variant="secondary" size="sm" onClick={onFullscreen} title="Fullscreen">
              ⛶ Fullscreen
            </Button>
          </LabTooltip>
        ) : null}

        {onToggleHelp ? (
          <LabTooltip label="Show keyboard shortcuts (?)">
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleHelp}
              title="Keyboard shortcuts"
              aria-pressed={helpOpen}
            >
              ⌨ Help
            </Button>
          </LabTooltip>
        ) : null}

        {extra}
      </div>
    </div>
  );
}

export type { LabToolbarProps };
