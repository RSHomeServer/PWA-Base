import { readdirSync, readFileSync, realpathSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, extname, basename } from "node:path";
import type { ResolvedDocsRoot } from "./config.js";

export type DocsEntryKind = "dir" | "file";

export interface DocsEntry {
  name: string;
  kind: DocsEntryKind;
  /** Path relative to the documentation root (posix-style). */
  path: string;
}

export interface DocsTreeNode extends DocsEntry {
  children?: DocsTreeNode[];
}

export interface DocsListResult {
  rootId: string;
  path: string;
  entries: DocsEntry[];
}

export interface DocsTreeResult {
  rootId: string;
  path: string;
  recursive: boolean;
  nodes: DocsTreeNode[];
}

export interface DocsFileResult {
  rootId: string;
  path: string;
  name: string;
  content: string;
  contentType: "text/markdown";
}

const DEFAULT_SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "dist",
  "coverage",
  ".turbo",
  ".next",
  "test-results",
  "playwright-report",
]);

const MARKDOWN_EXT = new Set([".md", ".mdx", ".markdown"]);

export class DocsPathError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "DocsPathError";
    this.status = status;
    this.code = code;
  }
}

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

/**
 * Normalize a relative path, allowing `..` segments but rejecting escapes above the root.
 */
export function normalizeRelativeRequest(raw: string | null | undefined): string {
  if (raw == null || raw === "" || raw === ".") return "";
  const p = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  if (p.includes("\0")) {
    throw new DocsPathError(400, "invalid_path", "Path contains invalid characters.");
  }
  const stack: string[] = [];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (stack.length === 0) {
        throw new DocsPathError(403, "forbidden", "Path escapes the configured documentation root.");
      }
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join("/");
}

function skipSetFor(root: ResolvedDocsRoot): Set<string> {
  const set = new Set(DEFAULT_SKIP_DIR_NAMES);
  for (const name of root.skipDirs) set.add(name);
  return set;
}

/**
 * Resolve a user path under a docs root. Ensures the result stays inside the root
 * via realpath comparison (no symlink escape).
 */
export function resolveUnderRoot(
  root: ResolvedDocsRoot,
  relativePath: string | null | undefined,
): { absolutePath: string; relativePosix: string } {
  if (!existsSync(root.absolutePath)) {
    throw new DocsPathError(404, "root_missing", `Documentation root is missing on disk: ${root.id}`);
  }
  let rootReal: string;
  try {
    rootReal = realpathSync(root.absolutePath);
  } catch {
    throw new DocsPathError(404, "root_missing", `Documentation root is unreadable: ${root.id}`);
  }

  const rel = normalizeRelativeRequest(relativePath);
  const candidate = rel ? join(rootReal, ...rel.split("/")) : rootReal;

  if (!existsSync(candidate)) {
    throw new DocsPathError(404, "not_found", "Path not found.");
  }

  let resolved: string;
  try {
    resolved = realpathSync(candidate);
  } catch {
    throw new DocsPathError(404, "not_found", "Path not found.");
  }

  const prefix = rootReal.endsWith(sep) ? rootReal : rootReal + sep;
  if (resolved !== rootReal && !resolved.startsWith(prefix)) {
    throw new DocsPathError(403, "forbidden", "Path escapes the configured documentation root.");
  }

  const relativePosix = resolved === rootReal ? "" : toPosix(relative(rootReal, resolved));
  return { absolutePath: resolved, relativePosix };
}

export function isMarkdownFile(name: string): boolean {
  return MARKDOWN_EXT.has(extname(name).toLowerCase());
}

function compareEntries(a: { kind: DocsEntryKind; name: string }, b: { kind: DocsEntryKind; name: string }): number {
  if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
}

/** True if this directory (or a descendant) contains at least one Markdown file. */
function directoryContainsMarkdown(
  absDir: string,
  skip: Set<string>,
  depthLeft: number,
): boolean {
  if (depthLeft < 0) return false;
  let names: string[];
  try {
    names = readdirSync(absDir);
  } catch {
    return false;
  }
  for (const name of names) {
    if (name.startsWith(".")) continue;
    if (skip.has(name)) continue;
    const childAbs = join(absDir, name);
    let st;
    try {
      st = statSync(childAbs);
    } catch {
      continue;
    }
    if (st.isFile() && isMarkdownFile(name)) return true;
    if (st.isDirectory() && directoryContainsMarkdown(childAbs, skip, depthLeft - 1)) return true;
  }
  return false;
}

function listRawEntries(
  absolutePath: string,
  relativePosix: string,
  skip: Set<string>,
  pruneEmptyDirs: boolean,
): DocsEntry[] {
  const names = readdirSync(absolutePath);
  const entries: DocsEntry[] = [];

  for (const name of names) {
    if (name.startsWith(".")) continue;
    if (skip.has(name)) continue;
    const childAbs = join(absolutePath, name);
    let childStat;
    try {
      childStat = statSync(childAbs);
    } catch {
      continue;
    }
    const childRel = relativePosix ? `${relativePosix}/${name}` : name;
    if (childStat.isDirectory()) {
      if (pruneEmptyDirs && !directoryContainsMarkdown(childAbs, skip, 12)) continue;
      entries.push({ name, kind: "dir", path: childRel });
    } else if (childStat.isFile() && isMarkdownFile(name)) {
      entries.push({ name, kind: "file", path: childRel });
    }
  }

  entries.sort(compareEntries);
  return entries;
}

export function listDirectory(
  root: ResolvedDocsRoot,
  relativePath?: string | null,
  options: { pruneEmptyDirs?: boolean } = {},
): DocsListResult {
  const pruneEmptyDirs = options.pruneEmptyDirs ?? true;
  const { absolutePath, relativePosix } = resolveUnderRoot(root, relativePath);
  const st = statSync(absolutePath);
  if (!st.isDirectory()) {
    throw new DocsPathError(400, "not_a_directory", "Path is not a directory.");
  }

  const skip = skipSetFor(root);
  const entries = listRawEntries(absolutePath, relativePosix, skip, pruneEmptyDirs);

  return {
    rootId: root.id,
    path: relativePosix,
    entries,
  };
}

function buildNodes(
  root: ResolvedDocsRoot,
  absolutePath: string,
  relativePosix: string,
  skip: Set<string>,
  depthLeft: number,
  pruneEmptyDirs: boolean,
): DocsTreeNode[] {
  const entries = listRawEntries(absolutePath, relativePosix, skip, pruneEmptyDirs);
  return entries.map((entry) => {
    if (entry.kind === "file" || depthLeft <= 0) {
      return { ...entry };
    }
    const childAbs = join(root.absolutePath, ...entry.path.split("/"));
    return {
      ...entry,
      children: buildNodes(root, childAbs, entry.path, skip, depthLeft - 1, pruneEmptyDirs),
    };
  });
}

/**
 * Nested filesystem tree (folders first, then Markdown files), for explorer UIs.
 */
export function listTreeRecursive(
  root: ResolvedDocsRoot,
  relativePath?: string | null,
  options: { maxDepth?: number; pruneEmptyDirs?: boolean } = {},
): DocsTreeResult {
  const maxDepth = Math.min(Math.max(options.maxDepth ?? 8, 0), 16);
  const pruneEmptyDirs = options.pruneEmptyDirs ?? true;
  const { absolutePath, relativePosix } = resolveUnderRoot(root, relativePath);
  const st = statSync(absolutePath);
  if (!st.isDirectory()) {
    throw new DocsPathError(400, "not_a_directory", "Path is not a directory.");
  }
  const skip = skipSetFor(root);
  return {
    rootId: root.id,
    path: relativePosix,
    recursive: true,
    nodes: buildNodes(root, absolutePath, relativePosix, skip, maxDepth, pruneEmptyDirs),
  };
}

export function readMarkdownFile(
  root: ResolvedDocsRoot,
  relativePath: string | null | undefined,
): DocsFileResult {
  const rel = normalizeRelativeRequest(relativePath);
  if (!rel) {
    throw new DocsPathError(400, "invalid_path", "File path is required.");
  }
  if (!isMarkdownFile(rel)) {
    throw new DocsPathError(400, "unsupported_type", "Only Markdown files can be retrieved.");
  }

  const { absolutePath, relativePosix } = resolveUnderRoot(root, rel);
  const st = statSync(absolutePath);
  if (!st.isFile()) {
    throw new DocsPathError(400, "not_a_file", "Path is not a file.");
  }

  const content = readFileSync(absolutePath, "utf8");
  return {
    rootId: root.id,
    path: relativePosix,
    name: basename(absolutePath),
    content,
    contentType: "text/markdown",
  };
}
