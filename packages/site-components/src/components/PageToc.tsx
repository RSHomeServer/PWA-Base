import { useShowcaseToc } from "./useShowcaseToc.js";
import styles from "./PageToc.module.css";

export function PageToc() {
  const context = useShowcaseToc();
  const entries = context?.entries ?? [];

  if (entries.length === 0) {
    return null;
  }

  return (
    <nav className={styles.toc} aria-labelledby="page-toc-heading">
      <h2 id="page-toc-heading" className={styles.heading}>
        On this page
      </h2>
      <ol className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a className={styles.link} href={`#${entry.id}`}>
              {entry.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
