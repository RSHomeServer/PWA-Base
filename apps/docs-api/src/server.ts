import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ResolvedDocsRoot } from "./config.js";
import {
  DocsPathError,
  listDirectory,
  listTreeRecursive,
  readMarkdownFile,
} from "./fs-access.js";

export interface DocsApiServerOptions {
  host: string;
  port: number;
  version: string;
  roots: ResolvedDocsRoot[];
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function notFound(res: ServerResponse): void {
  sendJson(res, 404, { error: "not_found", message: "Not found." });
}

function readUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
}

function findRoot(roots: ResolvedDocsRoot[], id: string): ResolvedDocsRoot | null {
  return roots.find((r) => r.id === id) ?? null;
}

export function createDocsApiServer(options: DocsApiServerOptions) {
  const rootsById = new Map(options.roots.map((r) => [r.id, r]));

  const server = createServer((req, res) => {
    try {
      if (!req.method || !["GET", "HEAD"].includes(req.method)) {
        sendJson(res, 405, { error: "method_not_allowed", message: "Only GET is supported." });
        return;
      }

      const url = readUrl(req);

      if (url.pathname === "/health") {
        sendJson(res, 200, {
          ok: true,
          service: "docs-api",
          version: options.version,
          roots: options.roots.length,
        });
        return;
      }

      if (url.pathname === "/api/roots") {
        sendJson(res, 200, {
          roots: options.roots.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            path: r.mountPath,
          })),
        });
        return;
      }

      const treeMatch = url.pathname.match(/^\/api\/roots\/([^/]+)\/tree$/);
      if (treeMatch) {
        const id = decodeURIComponent(treeMatch[1]!);
        const root = rootsById.get(id) ?? findRoot(options.roots, id);
        if (!root) {
          notFound(res);
          return;
        }
        const pathParam = url.searchParams.get("path");
        const recursive =
          url.searchParams.get("recursive") === "1" ||
          url.searchParams.get("recursive") === "true";
        if (recursive) {
          const maxDepthRaw = url.searchParams.get("maxDepth");
          const maxDepth = maxDepthRaw ? Number(maxDepthRaw) : 8;
          const result = listTreeRecursive(root, pathParam, {
            maxDepth: Number.isFinite(maxDepth) ? maxDepth : 8,
          });
          sendJson(res, 200, result);
          return;
        }
        const result = listDirectory(root, pathParam);
        sendJson(res, 200, result);
        return;
      }

      const fileMatch = url.pathname.match(/^\/api\/roots\/([^/]+)\/file$/);
      if (fileMatch) {
        const id = decodeURIComponent(fileMatch[1]!);
        const root = rootsById.get(id) ?? findRoot(options.roots, id);
        if (!root) {
          notFound(res);
          return;
        }
        const pathParam = url.searchParams.get("path");
        const result = readMarkdownFile(root, pathParam);
        sendJson(res, 200, result);
        return;
      }

      notFound(res);
    } catch (err) {
      if (err instanceof DocsPathError) {
        sendJson(res, err.status, { error: err.code, message: err.message });
        return;
      }
      console.error("[docs-api]", err);
      sendJson(res, 500, { error: "internal_error", message: "Internal server error." });
    }
  });

  return {
    server,
    listen(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(options.port, options.host, () => resolve());
      });
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
