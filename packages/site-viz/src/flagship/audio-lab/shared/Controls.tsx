import type { ReactNode } from "react";
import styles from "./Controls.module.css";

export interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
}

/** A labelled range slider with a live, formatted value readout — the workhorse control of the lab. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  disabled,
}: SliderRowProps) {
  const display = format ? format(value) : value.toFixed(2);
  return (
    <label className={styles.sliderRow}>
      <span className={styles.sliderLabel}>
        <span>{label}</span>
        <span className={styles.sliderValue}>{display}</span>
      </span>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export interface MeterBarProps {
  /** Level in `[0, 1]`. */
  value: number;
  /** Optional secondary peak-hold marker in `[0, 1]`. */
  peak?: number;
  label?: string;
  tone?: "accent" | "warning" | "danger";
  vertical?: boolean;
}

/** A simple DAW-style level meter, filled left-to-right (or bottom-to-top when vertical). */
export function MeterBar({ value, peak, label, tone = "accent", vertical = false }: MeterBarProps) {
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
  const peakPct =
    peak !== undefined ? `${Math.round(Math.max(0, Math.min(1, peak)) * 100)}%` : undefined;
  return (
    <div
      className={[styles.meter, vertical ? styles.meterVertical : ""].filter(Boolean).join(" ")}
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(Math.max(0, Math.min(1, value)) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      data-tone={tone}
    >
      {label ? <span className={styles.meterLabel}>{label}</span> : null}
      <div className={styles.meterTrack}>
        <div className={styles.meterFill} style={vertical ? { height: pct } : { width: pct }} />
        {peakPct !== undefined ? (
          <div
            className={styles.meterPeak}
            style={vertical ? { bottom: peakPct } : { left: peakPct }}
          />
        ) : null}
      </div>
    </div>
  );
}

export interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "accent" | "warning" | "danger";
  title?: string;
}

/** Small pill toggle used for mute/solo/on-off state across the drum machine, stems, and synth. */
export function ToggleChip({ active, onClick, children, tone = "accent", title }: ToggleChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, active ? styles.chipActive : ""].filter(Boolean).join(" ")}
      data-tone={tone}
      aria-pressed={active}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export interface SectionLabelProps {
  children: ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return <div className={styles.sectionLabel}>{children}</div>;
}
