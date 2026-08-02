import { Badge, Panel } from "@platform/ui";
import type { FileAreaGroup } from "../api/types.js";
import { detectRestartActions, type RestartPriority } from "../lib/restart-detection.js";
import styles from "../pages/pages.module.css";

export interface ActionsRequiredPanelProps {
  filesModified: FileAreaGroup[] | null | undefined;
  /** Optional live file paths from events. */
  livePaths?: string[] | null;
}

function priorityTone(priority: RestartPriority): "success" | "warning" | "error" | "default" {
  switch (priority) {
    case "required":
      return "error";
    case "recommended":
      return "warning";
    case "optional":
      return "default";
    case "none":
      return "success";
    default:
      return "default";
  }
}

/**
 * Restart / HMR guidance from modified paths — shown inside the report (after
 * Overview) for a single Run, and standalone in the Task Detail "Developer
 * Actions" tab. Renders a plain empty-state copy when nothing is required.
 */
export function ActionsRequiredPanel({ filesModified, livePaths }: ActionsRequiredPanelProps) {
  const result = detectRestartActions(filesModified, livePaths);
  const isEmpty = result.priority === "none" && result.items.every((item) => item.priority === "none");

  return (
    <Panel title="Actions Required" className={styles.actionsRequiredPanel}>
      {isEmpty ? (
        <p className={styles.actionsRequiredEmpty}>No developer action required.</p>
      ) : (
        <ul className={styles.actionsRequiredList}>
          {result.items.map((item) => (
            <li key={`${item.priority}:${item.action}`} className={styles.actionsRequiredItem}>
              <div className={styles.actionsRequiredHead}>
                <strong>{item.action}</strong>
                <Badge variant={priorityTone(item.priority)}>{item.priority}</Badge>
              </div>
              <p className={styles.actionsRequiredReason}>{item.reason}</p>
              <p className={styles.actionsRequiredOutcome}>
                <span className={styles.statLabel}>Expected outcome</span> {item.expectedOutcome}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
