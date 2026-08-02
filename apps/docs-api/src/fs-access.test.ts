import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { loadDocsExplorerConfig, resolveRoots, resolveBaseDir } from "./config.js";
import {
  DocsPathError,
  listDirectory,
  listTreeRecursive,
  readMarkdownFile,
  resolveUnderRoot,
} from "./fs-access.js";
import { createDocsApiServer } from "./server.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function tempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "docs-api-"));
  tempDirs.push(dir);
  return dir;
}

function rootAt(abs: string, skipDirs: string[] = [], mountPath = "") {
  return {
    id: "repo",
    title: "Repo",
    description: null,
    absolutePath: abs,
    mountPath,
    skipDirs,
  };
}

describe("docs explorer config", () => {
  it("loads roots and skipDirs from JSON", () => {
    const dir = tempWorkspace();
    const file = join(dir, "roots.json");
    writeFileSync(
      file,
      JSON.stringify({
        baseDir: dir,
        roots: [{ id: "eng", title: "Engineering", path: "docs", skipDirs: ["secret"] }],
      }),
    );
    mkdirSync(join(dir, "docs"));
    const config = loadDocsExplorerConfig(file);
    expect(config.roots[0]?.skipDirs).toEqual(["secret"]);
    const roots = resolveRoots(config, resolveBaseDir(config, dir));
    expect(roots[0]?.skipDirs).toEqual(["secret"]);
  });
});

describe("sandboxed filesystem access", () => {
  it("lists markdown files and directories that contain markdown", () => {
    const dir = tempWorkspace();
    mkdirSync(join(dir, "docs", "guides"), { recursive: true });
    writeFileSync(join(dir, "docs", "README.md"), "# Hi\n");
    writeFileSync(join(dir, "docs", "secret.txt"), "nope");
    writeFileSync(join(dir, "docs", "guides", "setup.md"), "# Setup\n");
    mkdirSync(join(dir, "docs", "empty"), { recursive: true });

    const listed = listDirectory(rootAt(join(dir, "docs")), "");
    expect(listed.entries.map((e) => e.name).sort()).toEqual(["README.md", "guides"]);
    expect(listed.entries.find((e) => e.name === "guides")?.kind).toBe("dir");
  });

  it("builds a nested tree ordered folders-then-files", () => {
    const dir = tempWorkspace();
    mkdirSync(join(dir, "docs", "b"), { recursive: true });
    mkdirSync(join(dir, "docs", "a"), { recursive: true });
    writeFileSync(join(dir, "docs", "z.md"), "# Z\n");
    writeFileSync(join(dir, "docs", "a", "a.md"), "# A\n");
    writeFileSync(join(dir, "docs", "b", "b.md"), "# B\n");

    const tree = listTreeRecursive(rootAt(join(dir, "docs")), "", { maxDepth: 3 });
    expect(tree.nodes.map((n) => n.name)).toEqual(["a", "b", "z.md"]);
    expect(tree.nodes[0]?.children?.[0]?.name).toBe("a.md");
  });

  it("honours skipDirs and includes root markdown", () => {
    const dir = tempWorkspace();
    writeFileSync(join(dir, "CURSOR.md"), "# Contract\n");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "x.md"), "# X\n");
    mkdirSync(join(dir, "apps"), { recursive: true });
    writeFileSync(join(dir, "apps", "no.md"), "# no\n");

    const listed = listDirectory(rootAt(dir, ["apps"]), "");
    expect(listed.entries.map((e) => e.name).sort()).toEqual(["CURSOR.md", "docs"]);
  });

  it("reads markdown content", () => {
    const dir = tempWorkspace();
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "a.md"), "# Title\n\nHello\n");
    const file = readMarkdownFile(rootAt(join(dir, "docs")), "a.md");
    expect(file.content).toContain("# Title");
  });

  it("normalizes .. within the root", () => {
    const dir = tempWorkspace();
    mkdirSync(join(dir, "docs", "guides"), { recursive: true });
    writeFileSync(join(dir, "docs", "a.md"), "# A\n");
    writeFileSync(join(dir, "docs", "guides", "b.md"), "# B\n");
    const file = readMarkdownFile(rootAt(join(dir, "docs")), "guides/../a.md");
    expect(file.path).toBe("a.md");
  });

  it("blocks path escape with .. above the root", () => {
    const dir = tempWorkspace();
    mkdirSync(join(dir, "docs"), { recursive: true });
    expect(() => resolveUnderRoot(rootAt(join(dir, "docs")), "../docs")).toThrow(DocsPathError);
  });

  it("blocks symlink escape outside the root", () => {
    const dir = tempWorkspace();
    const docs = join(dir, "docs");
    const outside = join(dir, "outside");
    mkdirSync(docs, { recursive: true });
    mkdirSync(outside, { recursive: true });
    writeFileSync(join(outside, "secret.md"), "# secret\n");
    try {
      symlinkSync(outside, join(docs, "link"));
    } catch {
      return;
    }
    expect(() => readMarkdownFile(rootAt(docs), "link/secret.md")).toThrow(DocsPathError);
  });
});

describe("docs-api HTTP", () => {
  it("serves health, roots, recursive tree, and file", async () => {
    const dir = tempWorkspace();
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "hello.md"), "# Hello\n");

    const api = createDocsApiServer({
      host: "127.0.0.1",
      port: 0,
      version: "0.1.0-test",
      roots: [rootAt(join(dir, "docs"))],
    });
    await api.listen();
    const addr = api.server.address();
    if (!addr || typeof addr === "string") throw new Error("expected port");
    const base = `http://127.0.0.1:${addr.port}`;

    const health = await fetch(`${base}/health`);
    expect((await health.json() as { ok: boolean }).ok).toBe(true);

    const rootsRes = await fetch(`${base}/api/roots`);
    const rootsBody = (await rootsRes.json()) as { roots: { id: string; path: string }[] };
    expect(rootsBody.roots[0]?.path).toBe("");

    const tree = await fetch(`${base}/api/roots/repo/tree?recursive=1`);
    const treeBody = (await tree.json()) as { nodes: { name: string }[]; recursive: boolean };
    expect(treeBody.recursive).toBe(true);
    expect(treeBody.nodes.some((e) => e.name === "hello.md")).toBe(true);

    const file = await fetch(`${base}/api/roots/repo/file?path=hello.md`);
    expect(((await file.json()) as { content: string }).content).toContain("# Hello");

    const escape = await fetch(`${base}/api/roots/repo/file?path=../hello.md`);
    expect(escape.status).toBe(403);

    await api.close();
  });
});
