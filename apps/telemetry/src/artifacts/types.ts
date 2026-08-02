/** Run artifact metadata (bytes live on disk; SQLite stores paths only). */

export type ArtifactKind =
  | "screenshot"
  | "image_diff"
  | "build_log"
  | "test_report"
  | "markdown_summary";

export type ArtifactPhase = "before" | "after" | null;

export interface RunArtifact {
  id: string;
  runId: string;
  kind: ArtifactKind;
  /** Stable page id for pairing before/after (e.g. `history`). */
  pageKey: string | null;
  pageLabel: string | null;
  phase: ArtifactPhase;
  filename: string;
  /** Path relative to artifacts root, e.g. `<run-id>/history-after.png`. */
  relativePath: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  caption: string | null;
}

export interface CreateArtifactInput {
  kind: ArtifactKind;
  pageKey?: string | null;
  pageLabel?: string | null;
  phase?: ArtifactPhase;
  filename: string;
  mimeType: string;
  caption?: string | null;
  /** Raw file bytes */
  bytes: Buffer;
}

export interface CapturePageTarget {
  pageKey: string;
  pageLabel: string;
  path: string;
}
