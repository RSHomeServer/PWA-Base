import { useMemo, useState } from "react";
import { Badge, Panel } from "@platform/ui";
import type { RunArtifact, RunCompletionSummary } from "../api/types.js";
import { artifactContentUrl } from "../lib/artifact-url.js";
import { formatTimestamp } from "../lib/format.js";
import { buildScreenshotContext, type ScreenshotContext } from "../lib/screenshot-context.js";
import { ScreenshotLightbox, type LightboxItem } from "./ScreenshotLightbox.js";
import styles from "../pages/pages.module.css";

export interface VisualValidationGalleryProps {
  artifacts: RunArtifact[];
  /** Used to generate storytelling context for each screenshot. */
  completionSummary?: RunCompletionSummary | null;
}

interface WalkthroughStep {
  artifact: RunArtifact;
  context: ScreenshotContext;
}

const FILES_PREVIEW = 3;

function orderedScreenshots(artifacts: RunArtifact[]): RunArtifact[] {
  return artifacts
    .filter((a) => a.kind === "screenshot" || a.kind === "image_diff")
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/**
 * Visual Validation — compact horizontal walkthrough: screenshot left,
 * purpose / expected change / files right on one row.
 */
export function VisualValidationGallery({
  artifacts,
  completionSummary = null,
}: VisualValidationGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const screenshots = useMemo(() => orderedScreenshots(artifacts), [artifacts]);
  const steps: WalkthroughStep[] = useMemo(
    () =>
      screenshots.map((artifact, index) => ({
        artifact,
        context: buildScreenshotContext({
          artifact,
          completionSummary,
          index,
          total: screenshots.length,
        }),
      })),
    [screenshots, completionSummary],
  );

  const logs = artifacts.filter((a) => a.kind === "build_log" || a.kind === "test_report");

  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      steps.map(({ artifact, context }) => ({
        id: artifact.id,
        src: artifactContentUrl(artifact.runId, artifact.id),
        alt: context.caption,
        pageName: context.pageName,
        caption: context.caption,
        capturedAt: artifact.createdAt,
        downloadName: artifact.filename,
      })),
    [steps],
  );

  if (steps.length === 0 && logs.length === 0) {
    return null;
  }

  return (
    <div className={styles.visualValidation}>
      {steps.length > 0 ? (
        <Panel title="Visual Validation">
          <ol className={styles.walkthroughList}>
            {steps.map(({ artifact, context }, i) => {
              const files = context.filesResponsible;
              const shown = files.slice(0, FILES_PREVIEW);
              const extra = files.length - shown.length;
              return (
                <li key={artifact.id} className={styles.walkthroughStep}>
                  <div className={styles.walkthroughRow}>
                    <button
                      type="button"
                      className={styles.walkthroughThumbBtn}
                      onClick={() => setLightboxIndex(i)}
                      aria-label={`Open ${context.pageName} screenshot in fullscreen viewer`}
                    >
                      <img
                        src={artifactContentUrl(artifact.runId, artifact.id)}
                        alt={context.caption}
                        className={styles.walkthroughThumb}
                        loading="lazy"
                      />
                    </button>

                    <div className={styles.walkthroughBody}>
                      <div className={styles.walkthroughStepHead}>
                        <span className={styles.walkthroughIndex}>{i + 1}</span>
                        <div className={styles.walkthroughStepTitle}>
                          <h3 className={styles.artifactPageTitle}>{context.pageName}</h3>
                          <PhaseBadge artifact={artifact} />
                        </div>
                      </div>

                      <dl className={styles.walkthroughMetaInline}>
                        <div>
                          <dt>Purpose</dt>
                          <dd>{context.purpose}</dd>
                        </div>
                        <div>
                          <dt>Expected User Change</dt>
                          <dd>{context.expectedUserChange}</dd>
                        </div>
                        <div>
                          <dt>Files</dt>
                          <dd className={styles.walkthroughFilesInline}>
                            {shown.map((f, fi) => (
                              <span key={f}>
                                {fi > 0 ? ", " : null}
                                <code>{shortFile(f)}</code>
                              </span>
                            ))}
                            {extra > 0 ? (
                              <span className={styles.muted}> +{extra} more</span>
                            ) : null}
                          </dd>
                        </div>
                        <div className={styles.walkthroughMetaFooter}>
                          <span>{context.capturedAfter}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={artifact.createdAt}>
                            {formatTimestamp(artifact.createdAt)}
                          </time>
                        </div>
                      </dl>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      ) : null}

      {logs.length > 0 ? (
        <Panel title="Build & Test Artifacts">
          <ul className={styles.artifactFileList}>
            {logs.map((a) => (
              <li key={a.id}>
                <a href={artifactContentUrl(a.runId, a.id)} target="_blank" rel="noreferrer">
                  {a.filename}
                </a>
                <span className={styles.muted}>
                  {" "}
                  · {a.kind.replace(/_/g, " ")} · {formatBytes(a.byteSize)} ·{" "}
                  {formatTimestamp(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {lightboxIndex !== null ? (
        <ScreenshotLightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}

function shortFile(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function PhaseBadge({ artifact }: { artifact: RunArtifact }) {
  if (artifact.kind === "image_diff") {
    return <Badge variant="accent">diff</Badge>;
  }
  if (artifact.phase === "before") {
    return <Badge variant="default">before</Badge>;
  }
  if (artifact.phase === "after") {
    return <Badge variant="success">after</Badge>;
  }
  return null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
