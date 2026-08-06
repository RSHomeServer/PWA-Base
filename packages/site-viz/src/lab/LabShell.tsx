import { useEffect } from "react";
import { LabShell as BaseLabShell, type LabShellProps as BaseLabShellProps } from "@platform/render";
import { adjacentDemos, demoHref } from "../demos/catalog.js";
import { recordDemoView } from "../gallery/storage.js";

export type LabShellProps = BaseLabShellProps & {
  /** Route path segment for gallery analytics and adjacent demo nav. */
  demoPath?: string;
};

export function LabShell({
  demoPath,
  backHref,
  backLabel = "← All visualisations",
  aboutSummary = "How this lab works",
  ...props
}: LabShellProps) {
  const { prev, next } = demoPath ? adjacentDemos(demoPath) : { prev: null, next: null };

  useEffect(() => {
    if (!demoPath) {
      return;
    }
    const id = demoPath.replace(/^\//, "");
    if (id) {
      recordDemoView(id);
    }
  }, [demoPath]);

  return (
    <BaseLabShell
      {...props}
      aboutSummary={aboutSummary}
      backHref={backHref ?? (demoPath ? demoHref("") : undefined)}
      backLabel={backLabel}
      demoNav={{
        prev: prev ? { href: demoHref(prev.path), title: prev.title } : null,
        next: next ? { href: demoHref(next.path), title: next.title } : null,
      }}
    />
  );
}