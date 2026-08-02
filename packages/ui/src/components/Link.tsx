import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Link.module.css";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Opens in a new tab with safe rel attributes and an external indicator. */
  external?: boolean;
  /** Visible text appended for external links (default: " (opens in new tab)"). */
  externalLabel?: string;
  children: ReactNode;
}

export function Link({
  external = false,
  externalLabel = " (opens in new tab)",
  href,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) {
  const classes = [styles.link, className].filter(Boolean).join(" ");

  const linkTarget = external ? "_blank" : target;
  const linkRel = external ? ["noopener", "noreferrer", rel].filter(Boolean).join(" ") : rel;

  return (
    <a href={href} className={classes} target={linkTarget} rel={linkRel} {...props}>
      {children}
      {external ? <span className={styles.srOnly}>{externalLabel}</span> : null}
    </a>
  );
}
