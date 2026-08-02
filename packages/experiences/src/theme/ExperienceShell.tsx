import type { CSSProperties, ReactNode } from "react";
import type { ExperienceInstance } from "../types.js";
import styles from "./ExperienceShell.module.css";
import "./tokens.css";

export function ExperienceShell({
  instance,
  children,
  actions,
}: {
  instance: ExperienceInstance;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const style = {
    "--mx-wood": instance.palette?.wood,
    "--mx-brass": instance.palette?.brass,
    "--mx-glass": instance.palette?.glass,
    "--mx-paper": instance.palette?.paper,
    "--mx-accent": instance.palette?.accent,
    "--mx-atmosphere": instance.palette?.atmosphere,
  } as CSSProperties;

  return (
    <article className={`mx ${styles.shell}`} style={style} data-kind={instance.kind}>
      <header className={styles.header}>
        <p className={styles.kind}>{instance.kind.replace("-", " ")}</p>
        <h1 className={styles.title}>{instance.title}</h1>
        {instance.subtitle ? <p className={styles.subtitle}>{instance.subtitle}</p> : null}
        {instance.description ? <p className={styles.description}>{instance.description}</p> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.stage}>{children}</div>
    </article>
  );
}
