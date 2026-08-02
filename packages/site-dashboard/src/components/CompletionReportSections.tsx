import { Badge, Panel } from "@platform/ui";
import type { FileAreaGroup, TestResultItem } from "../api/types.js";
import { testBadge } from "../lib/completion-report.js";
import styles from "../pages/pages.module.css";

/**
 * Shared render blocks for a structured completion report (`RunCompletionSummary`).
 * Used by both the per-Run report (`RunSummaryCard`) and the per-Task report
 * (`TaskSummaryCard`) so the two stay visually and behaviourally in sync.
 */

export function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Panel title={title}>
      <ul className={styles.summaryList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function FilesByArea({ groups }: { groups: FileAreaGroup[] }) {
  if (!groups?.length) return null;
  return (
    <Panel title="Files Modified" className={styles.filesCompactCard}>
      <ul className={styles.filesCompactList}>
        {groups.map((g) => (
          <li key={g.area} className={styles.filesCompactRow}>
            <span className={styles.filesCompactArea}>{g.area}</span>
            <span className={styles.filesCompactFiles}>
              {g.files.map((f, i) => (
                <span key={f}>
                  {i > 0 ? ", " : null}
                  <code>{f}</code>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function TestsTable({ tests }: { tests: TestResultItem[] }) {
  if (!tests?.length) return null;
  const showDetail = tests.some((t) => t.detail && t.detail.trim().length > 0);
  return (
    <Panel title="Testing Performed">
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>Test</th>
              <th>Status</th>
              {showDetail ? <th>Detail</th> : null}
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={`${t.check}:${t.status}`}>
                <td>
                  <span
                    className={[
                      styles.testDot,
                      t.status === "pass" ? styles.testPass : "",
                      t.status === "fail" ? styles.testFail : "",
                      t.status === "skip" ? styles.testSkip : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={t.status}
                  />
                </td>
                <td>{t.check}</td>
                <td>
                  <Badge variant={testBadge(t.status)}>{t.status}</Badge>
                </td>
                {showDetail ? (
                  <td className={styles.muted}>{t.detail?.trim() ? t.detail : "—"}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function WarningSection({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <Panel title="Known Limitations" className={styles.warningCard}>
      <ul className={styles.summaryList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  );
}
