export interface ContentPackEntry {
  /** Path relative to the pack version root. */
  path: string;
  /** Integrity digest, e.g. `sha256:<hex>`. */
  hash: string;
  size: number;
}

/**
 * Content Pack manifest (ADR-005) — served as `pack.json` under
 * `/packs/<appId>/<packId>/<version>/`.
 */
export interface ContentPackManifest {
  id: string;
  version: string;
  appId: string;
  entries: readonly ContentPackEntry[];
}

export interface PackInstallProgress {
  packId: string;
  version: string;
  phase: "manifest" | "download" | "verify" | "activate" | "done" | "error";
  completedEntries: number;
  totalEntries: number;
  message?: string;
}

export interface PackInstallResult {
  packId: string;
  version: string;
  activated: boolean;
}

export interface PackClientOptions {
  /** Origin + base path prefix ending without trailing slash issues handled in client. */
  packsRoot?: string;
  /** When true, skip network if the exact version is already active. */
  skipIfActive?: boolean;
  onProgress?: (progress: PackInstallProgress) => void;
  /**
   * Optional explicit version. When omitted, the client fetches
   * `/packs/<appId>/<packId>/current.json` `{ "version": "…" }` if present,
   * otherwise defaults to `1.0.0` for v1 static packs.
   */
  version?: string;
  signal?: AbortSignal;
}
