import type { ReactNode } from "react";
import { Link, Stack } from "@platform/ui";
import { componentHref } from "../catalog.js";
import { PageToc } from "./PageToc.js";
import { ShowcaseTocProvider } from "./ShowcaseTocProvider.js";
import "../site.css";
import styles from "./ShowcaseShell.module.css";

export interface ShowcaseShellProps {
  title: string;
  summary: string;
  children: ReactNode;
}

export function ShowcaseShell({ title, summary, children }: ShowcaseShellProps) {
  return (
    <main className="components-page">
      <ShowcaseTocProvider>
        <div className={styles.layout}>
          <div className={styles.page}>
            <header className={styles.header}>
              <Stack gap="sm">
                <Link href={componentHref("")}>← All components</Link>
                <h1>{title}</h1>
              </Stack>
              <p className={styles.summary}>{summary}</p>
            </header>

            <article className={styles.content}>{children}</article>
          </div>

          <PageToc />
        </div>
      </ShowcaseTocProvider>
    </main>
  );
}
