import { useEffect } from "react";
import { RenderShell, type RenderShellProps } from "@platform/render";
import { adjacentDemos, demoHref } from "../../demos/catalog.js";
import { recordDemoView } from "../../gallery/storage.js";

export interface FlagshipShortcut {
  keys: string;
  label: string;
}

export interface FlagshipShellProps extends Omit<
  RenderShellProps,
  "demoNav" | "onMount" | "badge" | "aboutSummary" | "shortcuts"
> {
  /** Route path segment, e.g. "/mandelbrot-explorer" */
  demoPath: string;
  shortcuts: FlagshipShortcut[];
}

export function FlagshipShell({
  demoPath,
  backHref,
  backLabel = "← All visualisations",
  ...props
}: FlagshipShellProps) {
  const { prev, next } = adjacentDemos(demoPath);

  useEffect(() => {
    const id = demoPath.replace(/^\//, "");
    if (id) {
      recordDemoView(id);
    }
  }, [demoPath]);

  return (
    <RenderShell
      {...props}
      badge="Flagship"
      aboutSummary="What am I looking at?"
      backHref={backHref ?? demoHref("")}
      backLabel={backLabel}
      demoNav={{
        prev: prev ? { href: demoHref(prev.path), title: prev.title } : null,
        next: next ? { href: demoHref(next.path), title: next.title } : null,
      }}
    />
  );
}
