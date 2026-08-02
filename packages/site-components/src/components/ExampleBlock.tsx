import type { ReactNode } from "react";
import { UsageNote } from "./UsageNote.js";
import styles from "./ExampleBlock.module.css";

export interface ExampleBlockProps {
  title?: string;
  children: ReactNode;
  /** Optional usage snippet shown beside preview at wide breakpoints. */
  usageNote?: ReactNode;
  /** Stack preview items vertically. */
  column?: boolean;
  /** Use muted surface background. */
  muted?: boolean;
  /** Center preview content. */
  center?: boolean;
  /** Stretch items to full width. */
  stretch?: boolean;
  /** Minimum height for loading/empty demos. */
  minHeight?: boolean;
}

export function ExampleBlock({
  title,
  children,
  usageNote,
  column = false,
  muted = false,
  center = false,
  stretch = false,
  minHeight = false,
}: ExampleBlockProps) {
  const previewClasses = [
    styles.preview,
    column ? styles.previewColumn : null,
    muted ? styles.previewMuted : null,
    center ? styles.previewCenter : null,
    stretch ? styles.previewStretch : null,
    minHeight ? styles.previewMinHeight : null,
  ]
    .filter(Boolean)
    .join(" ");

  const preview = (
    <div className={previewClasses} aria-label={title} role={title ? "group" : undefined}>
      {children}
    </div>
  );

  if (!usageNote) {
    return preview;
  }

  return (
    <div className={styles.block}>
      {preview}
      <UsageNote>{usageNote}</UsageNote>
    </div>
  );
}
