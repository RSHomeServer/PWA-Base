import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { sectionId } from "./showcaseTocUtils.js";
import { useShowcaseToc } from "./useShowcaseToc.js";
import styles from "./ShowcaseSection.module.css";

export interface ShowcaseSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Include in the sticky page TOC. Defaults to true. */
  inToc?: boolean;
}

export function ShowcaseSection({
  title,
  description,
  children,
  inToc = true,
}: ShowcaseSectionProps) {
  const toc = useShowcaseToc();
  const id = sectionId(title);
  const registerRef = useRef(toc?.register);
  registerRef.current = toc?.register;

  useEffect(() => {
    if (!inToc || !registerRef.current) {
      return;
    }

    return registerRef.current({ id, title });
  }, [id, inToc, title]);

  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.heading}>
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
