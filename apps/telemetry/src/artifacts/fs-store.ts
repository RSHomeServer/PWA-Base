import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
  statSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { CreateArtifactInput, RunArtifact } from "./types.js";

/**
 * On-disk layout:
 *   <artifactsRoot>/<runId>/<filename>
 */
export class ArtifactFsStore {
  constructor(readonly root: string) {
    mkdirSync(this.root, { recursive: true });
  }

  runDir(runId: string): string {
    return join(this.root, safeSegment(runId));
  }

  absolutePath(relativePath: string): string {
    const abs = resolve(this.root, relativePath);
    if (!abs.startsWith(resolve(this.root) + sep) && abs !== resolve(this.root)) {
      throw new Error("Invalid artifact path");
    }
    return abs;
  }

  /**
   * Write bytes under the run directory. Refuses to overwrite an existing file
   * when `overwrite` is false (default) — protects successful screenshots.
   */
  writeFile(
    runId: string,
    filename: string,
    bytes: Buffer,
    overwrite = false,
  ): { relativePath: string; byteSize: number; absolutePath: string } {
    const safeName = safeFilename(filename);
    const dir = this.runDir(runId);
    mkdirSync(dir, { recursive: true });
    const absolutePath = join(dir, safeName);
    if (existsSync(absolutePath) && !overwrite) {
      throw new Error(`Artifact file already exists: ${safeName}`);
    }
    writeFileSync(absolutePath, bytes);
    const relativePath = `${safeSegment(runId)}/${safeName}`;
    return { relativePath, byteSize: bytes.byteLength, absolutePath };
  }

  readFile(relativePath: string): Buffer {
    return readFileSync(this.absolutePath(relativePath));
  }

  deleteFile(relativePath: string): void {
    const abs = this.absolutePath(relativePath);
    if (existsSync(abs)) unlinkSync(abs);
  }

  /** Remove the entire on-disk directory for a run (and all artifact files). */
  deleteRunDir(runId: string): void {
    const dir = this.runDir(runId);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }

  fileExists(relativePath: string): boolean {
    return existsSync(this.absolutePath(relativePath));
  }

  fileSize(relativePath: string): number {
    return statSync(this.absolutePath(relativePath)).size;
  }
}

export function buildArtifactRecord(
  runId: string,
  input: CreateArtifactInput,
  relativePath: string,
  byteSize: number,
  now = new Date().toISOString(),
): RunArtifact {
  return {
    id: randomUUID(),
    runId,
    kind: input.kind,
    pageKey: input.pageKey ?? null,
    pageLabel: input.pageLabel ?? null,
    phase: input.phase ?? null,
    filename: safeFilename(input.filename),
    relativePath,
    mimeType: input.mimeType || "application/octet-stream",
    byteSize,
    createdAt: now,
    caption: input.caption ?? null,
  };
}

function safeSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!cleaned) throw new Error("Invalid path segment");
  return cleaned;
}

function safeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "artifact.bin";
  return safeSegment(base);
}

export { dirname };
