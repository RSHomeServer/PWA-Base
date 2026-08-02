export interface DocsRootSummary {
  id: string;
  title: string;
  description: string | null;
  /** Workspace-relative mount path (empty string for repo root). */
  path: string;
}

export interface DocsEntry {
  name: string;
  kind: "dir" | "file";
  path: string;
}

export interface DocsTreeNode extends DocsEntry {
  children?: DocsTreeNode[];
}

export interface DocsTreeResponse {
  rootId: string;
  path: string;
  recursive: boolean;
  nodes: DocsTreeNode[];
}

export interface DocsFileResponse {
  rootId: string;
  path: string;
  name: string;
  content: string;
  contentType: "text/markdown";
}

const API_BASE = "/docs-api";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function listRoots(): Promise<{ roots: DocsRootSummary[] }> {
  return getJson(`${API_BASE}/api/roots`);
}

export function listTreeRecursive(rootId: string, path = ""): Promise<DocsTreeResponse> {
  const q = new URLSearchParams({ recursive: "1", maxDepth: "10" });
  if (path) q.set("path", path);
  return getJson(`${API_BASE}/api/roots/${encodeURIComponent(rootId)}/tree?${q}`);
}

export function getFile(rootId: string, path: string): Promise<DocsFileResponse> {
  return getJson(
    `${API_BASE}/api/roots/${encodeURIComponent(rootId)}/file?path=${encodeURIComponent(path)}`,
  );
}

/** Posix-join and normalise `.` / `..` without allowing escape above empty root. */
function joinPosix(baseDir: string, href: string): string | null {
  const baseParts = baseDir.split("/").filter(Boolean);
  const relParts = href.replace(/\\/g, "/").split("/");
  const stack = [...baseParts];
  for (const part of relParts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (stack.length === 0) return null;
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join("/");
}

function ensureMarkdownPath(path: string): string | null {
  if (!path) return null;
  if (/\.(md|mdx|markdown)$/i.test(path)) return path;
  if (!path.includes(".")) return `${path}.md`;
  return null;
}

/** Resolve a relative Markdown href against the current file path (posix, within one root). */
export function resolveMarkdownDocPath(currentFilePath: string, href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return null;
  if (trimmed.startsWith("#")) return null;

  const withoutHash = trimmed.split("#")[0] ?? "";
  if (!withoutHash) return null;
  if (withoutHash.startsWith("/")) return null;

  const baseDir = currentFilePath.split("/").slice(0, -1).join("/");
  const joined = joinPosix(baseDir, withoutHash);
  if (joined == null) return null;
  return ensureMarkdownPath(joined);
}

export interface DocNavTarget {
  rootId: string;
  path: string;
}

/**
 * Resolve an in-document Markdown link, preferring the active root, then other
 * roots via workspace-relative mount paths (so `../../CURSOR.md` from docs/ works).
 */
export function resolveDocNavigation(
  roots: DocsRootSummary[],
  currentRootId: string,
  currentFilePath: string,
  href: string,
): DocNavTarget | null {
  const trimmed = href.trim();
  if (!trimmed || /^(https?:|mailto:|tel:)/i.test(trimmed) || trimmed.startsWith("#")) {
    return null;
  }
  const withoutHash = (trimmed.split("#")[0] ?? "").replace(/\\/g, "/");
  if (!withoutHash || withoutHash.startsWith("/")) return null;

  const current = roots.find((r) => r.id === currentRootId);
  if (!current) {
    const within = resolveMarkdownDocPath(currentFilePath, withoutHash);
    return within ? { rootId: currentRootId, path: within } : null;
  }

  const workspaceBase = [current.path, ...currentFilePath.split("/").slice(0, -1)]
    .filter(Boolean)
    .join("/");
  const workspaceTarget = joinPosix(workspaceBase, withoutHash);
  if (workspaceTarget == null) return null;
  const mdTarget = ensureMarkdownPath(workspaceTarget);
  if (!mdTarget) return null;

  // Prefer the longest matching mount prefix (docs over repo when both match).
  const sorted = [...roots].sort((a, b) => b.path.length - a.path.length);
  for (const root of sorted) {
    if (root.path === "") {
      return { rootId: root.id, path: mdTarget };
    }
    if (mdTarget === root.path) continue;
    if (mdTarget.startsWith(`${root.path}/`)) {
      return { rootId: root.id, path: mdTarget.slice(root.path.length + 1) };
    }
  }

  const within = resolveMarkdownDocPath(currentFilePath, withoutHash);
  return within ? { rootId: currentRootId, path: within } : null;
}
