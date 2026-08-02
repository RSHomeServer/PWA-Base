import { useState, type CSSProperties } from "react";
import { detectBrowserIdentity } from "../lib/browserDetect.js";
import { getWebglInfo } from "../lib/webgl.js";
import { formatNumber } from "../lib/format.js";
import styles from "./SecondaryTelemetry.module.css";

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function SecondaryTelemetry() {
  const [cores] = useState(() => navigator.hardwareConcurrency ?? 0);
  const [dpr] = useState(() => window.devicePixelRatio);
  const [res] = useState(() => `${screen.width}×${screen.height}`);
  const [gpu] = useState(() => getWebglInfo());
  const identity = detectBrowserIdentity();
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  const tiles: { key: string; label: string; value: string | number; title?: string }[] = [
    { key: "browser", label: "Browser", value: `${identity.browser} ${identity.browserVersion}` },
    { key: "cores", label: "Cores", value: cores || "—" },
    { key: "memory", label: "Memory", value: mem ? `${mem} GB+` : "N/A" },
    { key: "display", label: "Display", value: `${res} @ ${dpr}×` },
    { key: "engine", label: "Engine", value: identity.engine },
    {
      key: "gpu",
      label: "GPU",
      value: gpu.supported ? truncate(gpu.renderer, 28) : "Unavailable",
      title: gpu.supported ? gpu.renderer : undefined,
    },
  ];

  return (
    <aside className={styles.rack} aria-label="Secondary instrument readings">
      <p className={styles.rackLabel}>Instrument rack · ambient readings</p>
      <div className={styles.meters}>
        {tiles.map((tile, index) => (
          <div
            className={styles.meter}
            key={tile.key}
            style={{ "--reveal-index": index } as CSSProperties}
            title={tile.title}
          >
            <span className={styles.meterLabel}>{tile.label}</span>
            <span className={styles.meterValue}>
              {typeof tile.value === "number" ? formatNumber(tile.value) : tile.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
