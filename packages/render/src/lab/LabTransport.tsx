import { Button, IconButton } from "@platform/ui";
import type { LabTransportProps } from "./types.js";
import styles from "./LabShell.module.css";
import { LabTooltip } from "./LabTooltip.js";

const DEFAULT_SPEEDS = [0.5, 1, 2];

function formatSpeed(speed: number): string {
  return speed % 1 === 0 ? `${speed}×` : `${speed.toFixed(2).replace(/\.?0+$/, "")}×`;
}

export function LabTransport({
  playing,
  speed = 1,
  speedOptions = DEFAULT_SPEEDS,
  onToggle,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  compact = false,
}: LabTransportProps) {
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
      return;
    }
    if (playing) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  const playLabel = playing ? "Pause simulation" : "Play simulation";

  return (
    <div
      className={[styles.transport, compact ? styles.transportCompact : ""]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="Simulation transport"
    >
      <div className={styles.transportPrimary}>
        <LabTooltip label={playLabel}>
          <IconButton
            variant="outline"
            size="sm"
            label={playLabel}
            className={[styles.transportPlay, playing ? styles.transportPlaying : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={handleToggle}
            aria-pressed={playing}
            title={playLabel}
          >
            {playing ? "❚❚" : "▶"}
          </IconButton>
        </LabTooltip>

        {onStep ? (
          <LabTooltip label="Advance one simulation step (.)">
            <IconButton
              variant="ghost"
              size="sm"
              label="Step one frame"
              onClick={onStep}
              title="Step"
            >
              ⏭
            </IconButton>
          </LabTooltip>
        ) : null}

        {onReset ? (
          <LabTooltip label="Reset simulation to initial state (R)">
            <IconButton
              variant="ghost"
              size="sm"
              label="Reset simulation"
              onClick={onReset}
              title="Reset"
            >
              ⟲
            </IconButton>
          </LabTooltip>
        ) : null}
      </div>

      {onSpeedChange && speedOptions.length > 0 ? (
        <div className={styles.transportSpeed} role="group" aria-label="Playback speed">
          <span className={styles.transportSpeedLabel}>Speed</span>
          <div className={styles.speedGroup}>
            {speedOptions.map((option) => (
              <Button
                key={option}
                variant={option === speed ? "primary" : "secondary"}
                size="sm"
                className={styles.speedButton}
                onClick={() => onSpeedChange(option)}
                aria-pressed={option === speed}
                title={`${formatSpeed(option)} playback`}
              >
                {formatSpeed(option)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { LabTransportProps };
