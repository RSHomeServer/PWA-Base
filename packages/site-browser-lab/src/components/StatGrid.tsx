import type { ReactNode } from "react";
import styles from "./StatGrid.module.css";

export interface StatItem {
  key: string;
  label: string;
  value: ReactNode;
  hint?: string;
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <dl className={styles.grid}>
      {items.map((item) => (
        <div className={styles.tile} key={item.key}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
          {item.hint ? <p className={styles.hint}>{item.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}
