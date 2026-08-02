import type { ButtonHTMLAttributes } from "react";
import styles from "./IconButton.module.css";

export type IconButtonVariant = "ghost" | "subtle" | "outline";
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (required — icon-only buttons must name their action). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} aria-label={label} {...props}>
      {children}
    </button>
  );
}
