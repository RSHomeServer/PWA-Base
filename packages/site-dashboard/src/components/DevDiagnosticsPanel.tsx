import { Badge, Panel } from "@platform/ui";
import type { FileAreaGroup } from "../api/types.js";
import { detectRestartActions } from "../lib/restart-detection.js";
import styles from "../pages/pages.module.css";

export interface DevDiagnosticsPanelProps {
  filesModified: FileAreaGroup[] | null | undefined;
  livePaths?: string[] | null;
}

/**
 * Compact developer diagnostics: Vite assumed running, HMR via import.meta.hot,
 * restart required from the same rule engine, session start via performance.timeOrigin.
 */
export function DevDiagnosticsPanel({ filesModified, livePaths }: DevDiagnosticsPanelProps) {
  const result = detectRestartActions(filesModified, livePaths);
  const hmrConnected = Boolean(
    (import.meta as ImportMeta & { hot?: unknown }).hot,
  );
  const sessionStarted = new Date(performance.timeOrigin).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Panel title="Dev Diagnostics" className={styles.devDiagnosticsPanel}>
      <div className={styles.devDiagnosticsGrid}>
        <div>
          <span className={styles.statLabel}>Vite</span>
          <Badge variant="success">Assumed running</Badge>
        </div>
        <div>
          <span className={styles.statLabel}>HMR</span>
          <Badge variant={hmrConnected ? "success" : "default"}>
            {hmrConnected ? "Connected" : "Not available"}
          </Badge>
        </div>
        <div>
          <span className={styles.statLabel}>Restart</span>
          <Badge variant={result.restartRequired ? "error" : "success"}>
            {result.restartRequired ? "Required" : "Not required"}
          </Badge>
        </div>
        <div>
          <span className={styles.statLabel}>Session started</span>
          <strong>{sessionStarted}</strong>
        </div>
      </div>
      {result.restartRequired && result.items[0] ? (
        <p className={styles.devDiagnosticsReason}>{result.items[0].reason}</p>
      ) : null}
    </Panel>
  );
}
