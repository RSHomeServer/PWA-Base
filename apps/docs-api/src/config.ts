import { readFileSync, existsSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";

export interface DocsRootConfig {
  id: string;
  title: string;
  description?: string;
  /** Path relative to baseDir (or absolute). */
  path: string;
  /** Extra directory names to hide when listing this root. */
  skipDirs?: string[];
}

export interface DocsExplorerConfig {
  /** Workspace / content root. Defaults to process.cwd(). */
  baseDir?: string;
  roots: DocsRootConfig[];
}

export interface ResolvedDocsRoot {
  id: string;
  title: string;
  description: string | null;
  /** Absolute real path to the root directory. */
  absolutePath: string;
  /** Config path relative to workspace (`.` → ``). Used for cross-root link resolution. */
  mountPath: string;
  skipDirs: string[];
}

export function loadDocsExplorerConfig(filePath: string): DocsExplorerConfig {
  if (!existsSync(filePath)) {
    throw new Error(`Docs explorer config not found: ${filePath}`);
  }
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Docs explorer config must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.roots)) {
    throw new Error("Docs explorer config must include a roots array.");
  }
  const roots: DocsRootConfig[] = [];
  for (const item of obj.roots) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Each root must be an object.");
    }
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || !r.id.trim()) {
      throw new Error("Each root requires a non-empty string id.");
    }
    if (typeof r.title !== "string" || !r.title.trim()) {
      throw new Error(`Root "${r.id}" requires a title.`);
    }
    if (typeof r.path !== "string" || !r.path.trim()) {
      throw new Error(`Root "${r.id}" requires a path.`);
    }
    const skipDirs = Array.isArray(r.skipDirs)
      ? r.skipDirs.filter((d): d is string => typeof d === "string" && d.trim().length > 0).map((d) => d.trim())
      : undefined;
    roots.push({
      id: r.id.trim(),
      title: r.title.trim(),
      description: typeof r.description === "string" ? r.description.trim() : undefined,
      path: r.path.trim(),
      skipDirs,
    });
  }
  if (roots.length === 0) {
    throw new Error("Docs explorer config must declare at least one root.");
  }
  const ids = new Set<string>();
  for (const root of roots) {
    if (ids.has(root.id)) {
      throw new Error(`Duplicate docs root id: ${root.id}`);
    }
    ids.add(root.id);
  }
  return {
    baseDir: typeof obj.baseDir === "string" ? obj.baseDir : undefined,
    roots,
  };
}

export function resolveBaseDir(config: DocsExplorerConfig, fallbackCwd: string): string {
  const raw = config.baseDir?.trim() || fallbackCwd;
  return isAbsolute(raw) ? raw : resolve(fallbackCwd, raw);
}

export function resolveRoots(
  config: DocsExplorerConfig,
  baseDir: string,
): ResolvedDocsRoot[] {
  return config.roots.map((root) => {
    const absolutePath = isAbsolute(root.path)
      ? root.path
      : resolve(baseDir, root.path);
    const mountPath =
      root.path === "." || root.path === "./"
        ? ""
        : root.path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
    return {
      id: root.id,
      title: root.title,
      description: root.description ?? null,
      absolutePath,
      mountPath,
      skipDirs: root.skipDirs ?? [],
    };
  });
}
