import type { CSSProperties, ReactNode } from "react";
import { useAppReady } from "./useAppReady.js";
import styles from "./PackReadyGate.module.css";

export type PackReadyGateCopy = {
  /** Shown while packs install. */
  preparingTitle: string;
  preparingBody: string;
  /** Status line when no progress message is available yet. */
  preparingDetail: string;
  /** Shown when installation fails. */
  errorTitle: string;
  /**
   * Hint under the error. Use `{packsRoot}` for `/packs/<appId>/`.
   */
  errorHint: string;
};

const DEFAULT_COPY: PackReadyGateCopy = {
  preparingTitle: "Preparing content",
  preparingBody: "Installing required offline content packs…",
  preparingDetail: "Downloading pack entries…",
  errorTitle: "Content could not finish installing",
  errorHint: "Check that Content Packs are available under {packsRoot}, then reload.",
};

export type PackReadyGateClassNames = {
  gate?: string;
  title?: string;
  body?: string;
  hint?: string;
};

export type PackReadyGateProps = {
  appId: string;
  packIds: readonly string[];
  children: ReactNode;
  /** Override default neutral copy (Birthday supplies themed strings). */
  copy?: Partial<PackReadyGateCopy>;
  /** Optional CSS module / class overrides for themed shells. */
  classNames?: PackReadyGateClassNames;
  style?: CSSProperties;
};

function resolveCopy(partial?: Partial<PackReadyGateCopy>): PackReadyGateCopy {
  return { ...DEFAULT_COPY, ...partial };
}

/**
 * Complete-first-install gate (ADR-005): withhold product UI until required
 * Content Packs are installed and active.
 */
export function PackReadyGate({
  appId,
  packIds,
  children,
  copy: copyPartial,
  classNames,
  style,
}: PackReadyGateProps) {
  const ready = useAppReady(appId, packIds);
  const copy = resolveCopy(copyPartial);
  const packsRoot = `/packs/${appId}/`;
  const errorHint = copy.errorHint.replaceAll("{packsRoot}", packsRoot);

  // Prefer consumer classNames so themed shells (e.g. Birthday) fully own styling.
  const gateClass = classNames?.gate ?? styles.gate;
  const titleClass = classNames?.title ?? styles.title;
  const bodyClass = classNames?.body ?? styles.body;
  const hintClass = classNames?.hint ?? styles.hint;

  if (ready.status === "ready") {
    return children;
  }

  if (ready.status === "error") {
    return (
      <div className={gateClass} style={style} role="alert">
        <h1 className={titleClass}>{copy.errorTitle}</h1>
        <p className={bodyClass}>{ready.message}</p>
        <p className={hintClass}>
          {errorHint.includes(packsRoot) ? (
            <>
              {errorHint.split(packsRoot)[0]}
              <code>{packsRoot}</code>
              {errorHint.split(packsRoot).slice(1).join(packsRoot)}
            </>
          ) : (
            errorHint
          )}
        </p>
      </div>
    );
  }

  const progress = ready.progress;
  const detail =
    progress?.message ??
    (progress?.phase === "done" ? "Almost ready…" : copy.preparingDetail);

  return (
    <div className={gateClass} style={style} aria-busy="true" aria-live="polite">
      <h1 className={titleClass}>{copy.preparingTitle}</h1>
      <p className={bodyClass}>{copy.preparingBody}</p>
      <p className={hintClass}>{detail}</p>
      {progress && progress.totalEntries > 0 ? (
        <p className={hintClass}>
          {progress.completedEntries}/{progress.totalEntries} files · {progress.phase}
        </p>
      ) : null}
    </div>
  );
}
