import { createElement, type HTMLAttributes, type ElementType } from "react";
import styles from "./Stack.module.css";

export type StackDirection = "row" | "column";
export type StackGap = "none" | "sm" | "md" | "lg";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between";

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** Flex direction (default: column). */
  direction?: StackDirection;
  /** Gap between children using spacing tokens. */
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  /** Semantic or structural element (default: div). */
  as?: ElementType;
}

export function Stack({
  direction = "column",
  gap = "md",
  align = "stretch",
  justify = "start",
  as: Component = "div",
  className,
  ...props
}: StackProps) {
  const classes = [
    styles.stack,
    styles[direction],
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(Component, { className: classes, ...props });
}
