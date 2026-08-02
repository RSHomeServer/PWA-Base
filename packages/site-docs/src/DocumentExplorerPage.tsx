import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge, EmptyState, Panel, Skeleton, Stack } from "@platform/ui";
import { Markdown, type MarkdownProps } from "@platform/markdown";
import "@platform/markdown/styles.css";
import {
  getFile,
  listRoots,
  listTreeRecursive,
  resolveDocNavigation,
  type DocsRootSummary,
  type DocsTreeNode,
} from "./api.js";
import styles from "./explorer.module.css";

function parentPath(path: string): string {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

function breadcrumbSegments(path: string): { label: string; path: string }[] {
  if (!path) return [];
  const parts = path.split("/").filter(Boolean);
  const out: { label: string; path: string }[] = [];
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    out.push({ label: part, path: acc });
  }
  return out;
}

function collectAncestorDirs(filePath: string): Set<string> {
  const set = new Set<string>();
  let cur = parentPath(filePath);
  while (cur) {
    set.add(cur);
    cur = parentPath(cur);
  }
  return set;
}

function TreeNodes({
  nodes,
  depth,
  selectedPath,
  expanded,
  onToggle,
  onOpen,
}: {
  nodes: DocsTreeNode[];
  depth: number;
  selectedPath: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onOpen: (path: string, kind: "dir" | "file") => void;
}) {
  return (
    <ul className={styles.tree} role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => {
        const selected = node.path === selectedPath;
        const isDir = node.kind === "dir";
        const isExpanded = isDir && expanded.has(node.path);
        const children = node.children ?? [];
        return (
          <li key={node.path} role="treeitem" aria-expanded={isDir ? isExpanded : undefined}>
            <div className={styles.treeRow} style={{ paddingLeft: `${0.35 + depth * 0.85}rem` }}>
              {isDir ? (
                <button
                  type="button"
                  className={styles.treeTwist}
                  aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
                  onClick={() => onToggle(node.path)}
                >
                  {isExpanded ? "▾" : "▸"}
                </button>
              ) : (
                <span className={styles.treeTwistSpacer} aria-hidden />
              )}
              <button
                type="button"
                className={[
                  styles.treeItem,
                  isDir ? styles.treeDir : styles.treeFile,
                  selected ? styles.treeItemSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (isDir) onToggle(node.path);
                  onOpen(node.path, node.kind);
                }}
              >
                <span className={styles.treeKind} aria-hidden>
                  {isDir ? "◇" : "◈"}
                </span>
                <span className={styles.treeName}>{node.name}</span>
              </button>
            </div>
            {isDir && isExpanded && children.length > 0 ? (
              <TreeNodes
                nodes={children}
                depth={depth + 1}
                selectedPath={selectedPath}
                expanded={expanded}
                onToggle={onToggle}
                onOpen={onOpen}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DocumentExplorerPage() {
  const { rootId } = useParams<{ rootId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const path = searchParams.get("path") ?? "";
  const isFile = Boolean(path) && /\.(md|mdx|markdown)$/i.test(path);

  const [roots, setRoots] = useState<DocsRootSummary[] | null>(null);
  const [rootsError, setRootsError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<DocsTreeNode[] | null>(null);
  const [navError, setNavError] = useState<string | null>(null);
  const [doc, setDoc] = useState<{ name: string; content: string; path: string } | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [loadingNav, setLoadingNav] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    listRoots()
      .then((res) => {
        if (!cancelled) {
          setRoots(res.roots);
          setRootsError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRootsError(err instanceof Error ? err.message : "Failed to load roots");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!roots || rootId) return;
    if (roots.length > 0) {
      navigate(`/${encodeURIComponent(roots[0]!.id)}`, { replace: true });
    }
  }, [roots, rootId, navigate]);

  const activeRoot = useMemo(
    () => roots?.find((r) => r.id === rootId) ?? null,
    [roots, rootId],
  );

  const openPath = useCallback(
    (nextRootId: string, nextPath: string) => {
      const q = nextPath ? `?path=${encodeURIComponent(nextPath)}` : "";
      navigate(`/${encodeURIComponent(nextRootId)}${q}`);
    },
    [navigate],
  );

  useEffect(() => {
    if (!rootId) return;
    let cancelled = false;
    setLoadingNav(true);
    setNavError(null);
    listTreeRecursive(rootId, "")
      .then((res) => {
        if (!cancelled) setNodes(res.nodes);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setNodes([]);
          setNavError(err instanceof Error ? err.message : "Failed to list folder");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingNav(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rootId]);

  // Expand ancestors of the selected file/folder when path changes.
  useEffect(() => {
    if (!path) return;
    const ancestors = collectAncestorDirs(isFile ? path : path);
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const a of ancestors) next.add(a);
      if (!isFile && path) next.add(path);
      return next;
    });
  }, [path, isFile]);

  useEffect(() => {
    if (!rootId || !isFile) {
      setDoc(null);
      setDocError(null);
      return;
    }
    let cancelled = false;
    setLoadingDoc(true);
    setDocError(null);
    getFile(rootId, path)
      .then((res) => {
        if (!cancelled) {
          setDoc({ name: res.name, content: res.content, path: res.path });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDoc(null);
          setDocError(err instanceof Error ? err.message : "Failed to load document");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDoc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rootId, path, isFile]);

  const toggleExpanded = useCallback((dirPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  }, []);

  const handleDocLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!rootId || !doc || !roots) return;
      const href = event.currentTarget.getAttribute("href");
      if (!href) return;
      // Prefer resolving from data attribute if present (set by renderer)
      const targetRoot = event.currentTarget.dataset.docRoot;
      const targetPath = event.currentTarget.dataset.docPath;
      if (targetRoot && targetPath) {
        event.preventDefault();
        openPath(targetRoot, targetPath);
        return;
      }
      const resolved = resolveDocNavigation(roots, rootId, doc.path, href);
      if (!resolved) return;
      event.preventDefault();
      openPath(resolved.rootId, resolved.path);
    },
    [rootId, doc, roots, openPath],
  );

  const markdownComponents = useMemo<NonNullable<MarkdownProps["components"]>>(
    () => ({
      a: ({ href, children, ...rest }) => {
        const resolved =
          rootId && doc && roots && href
            ? resolveDocNavigation(roots, rootId, doc.path, href)
            : null;
        if (resolved) {
          return (
            <a
              {...rest}
              href={`/${encodeURIComponent(resolved.rootId)}?path=${encodeURIComponent(resolved.path)}`}
              data-doc-root={resolved.rootId}
              data-doc-path={resolved.path}
              onClick={handleDocLinkClick}
            >
              {children}
            </a>
          );
        }
        const external = Boolean(href && /^(https?:|mailto:|tel:)/i.test(href));
        return (
          <a
            {...rest}
            href={href}
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
          >
            {children}
          </a>
        );
      },
    }),
    [rootId, doc, roots, handleDocLinkClick],
  );

  const folderPath = isFile ? parentPath(path) : path;
  const crumbs = breadcrumbSegments(isFile ? parentPath(path) : path);

  const topLevelFiles = useMemo(() => {
    if (!nodes) return [];
    return nodes.filter((n) => n.kind === "file");
  }, [nodes]);

  return (
    <div className={styles.shell}>
      <aside className={styles.nav} aria-label="Documentation navigation">
        <div className={styles.navHeader}>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.subtitle}>Browse Markdown by filesystem path</p>
        </div>

        <div className={styles.roots} role="list" aria-label="Documentation roots">
          {rootsError ? (
            <p className={styles.error}>{rootsError}</p>
          ) : !roots ? (
            <Skeleton className={styles.skel} />
          ) : roots.length === 0 ? (
            <p className={styles.muted}>No documentation roots configured.</p>
          ) : (
            roots.map((root) => (
              <button
                key={root.id}
                type="button"
                className={[styles.rootBtn, root.id === rootId ? styles.rootBtnActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => openPath(root.id, "")}
              >
                <span className={styles.rootTitle}>{root.title}</span>
                {root.description ? (
                  <span className={styles.rootDesc}>{root.description}</span>
                ) : null}
              </button>
            ))
          )}
        </div>

        {rootId ? (
          <div className={styles.treeSection}>
            <div className={styles.treeToolbar}>
              <span className={styles.treeLabel}>Tree</span>
              <button
                type="button"
                className={styles.upBtn}
                onClick={() => openPath(rootId, "")}
              >
                Root
              </button>
            </div>
            {loadingNav ? (
              <Skeleton className={styles.skel} />
            ) : navError ? (
              <p className={styles.error}>{navError}</p>
            ) : !nodes || nodes.length === 0 ? (
              <p className={styles.muted}>No Markdown files in this root.</p>
            ) : (
              <TreeNodes
                nodes={nodes}
                depth={0}
                selectedPath={path}
                expanded={expanded}
                onToggle={toggleExpanded}
                onOpen={(nextPath) => openPath(rootId, nextPath)}
              />
            )}
          </div>
        ) : null}
      </aside>

      <main className={styles.viewer} aria-label="Document viewer">
        {!rootId ? (
          <EmptyState
            title="Select a folder root"
            description="Choose Website_Hosting/, docs/, or packages/ from the left to browse Markdown files."
          />
        ) : (
          <Stack gap="md">
            <header className={styles.viewerHeader}>
              <div className={styles.crumbs} aria-label="Breadcrumb">
                <Link className={styles.crumbLink} to={`/${encodeURIComponent(rootId)}`}>
                  {activeRoot?.title ?? rootId}
                </Link>
                {crumbs.map((c) => (
                  <span key={c.path} className={styles.crumbSeg}>
                    <span className={styles.crumbSep}>/</span>
                    <button
                      type="button"
                      className={styles.crumbLink}
                      onClick={() => openPath(rootId, c.path)}
                    >
                      {c.label}
                    </button>
                  </span>
                ))}
                {isFile && doc ? (
                  <span className={styles.crumbSeg}>
                    <span className={styles.crumbSep}>/</span>
                    <span className={styles.crumbCurrent}>{doc.name}</span>
                  </span>
                ) : null}
              </div>
              {isFile ? <Badge variant="default">Markdown</Badge> : null}
            </header>

            {!isFile ? (
              <Panel title={folderPath ? folderPath : (activeRoot?.title ?? "Folder")}>
                <p className={styles.muted}>
                  {activeRoot?.description ??
                    "Expand folders in the tree, or open a Markdown file to read it."}
                </p>
                {topLevelFiles.length > 0 && !folderPath ? (
                  <ul className={styles.fileHints}>
                    {topLevelFiles.map((e) => (
                      <li key={e.path}>
                        <button
                          type="button"
                          className={styles.hintLink}
                          onClick={() => openPath(rootId, e.path)}
                        >
                          {e.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Panel>
            ) : loadingDoc ? (
              <Skeleton className={styles.skelTall} />
            ) : docError ? (
              <EmptyState title="Could not load document" description={docError} />
            ) : doc ? (
              <article className={styles.article}>
                <Markdown variant="document" components={markdownComponents}>
                  {doc.content}
                </Markdown>
              </article>
            ) : null}
          </Stack>
        )}
      </main>
    </div>
  );
}
