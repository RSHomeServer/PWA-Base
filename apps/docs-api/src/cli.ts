import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDocsExplorerConfig, resolveBaseDir, resolveRoots } from "./config.js";
import { createDocsApiServer } from "./server.js";

const here = dirname(fileURLToPath(import.meta.url));

function readPackageVersion(): string {
  try {
    const pkgPath = resolve(here, "../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function defaultConfigPath(): string {
  // apps/docs-api/src → repo root config/
  return resolve(here, "../../../config/docs-explorer.roots.json");
}

function defaultWorkspaceRoot(): string {
  return resolve(here, "../../..");
}

export async function main(): Promise<void> {
  const host = process.env.DOCS_API_HOST ?? "0.0.0.0";
  const port = Number(process.env.DOCS_API_PORT ?? "4320");
  const configPath = process.env.DOCS_API_CONFIG ?? defaultConfigPath();
  const workspaceFallback = process.env.DOCS_API_WORKSPACE ?? defaultWorkspaceRoot();

  const config = loadDocsExplorerConfig(configPath);
  const baseDir = resolveBaseDir(config, workspaceFallback);
  const roots = resolveRoots(config, baseDir);

  const api = createDocsApiServer({
    host,
    port,
    version: readPackageVersion(),
    roots,
  });

  await api.listen();
  console.log(
    `[docs-api] v${readPackageVersion()} listening on http://${host}:${port} (${roots.length} roots)`,
  );
}

main().catch((err) => {
  console.error("[docs-api] failed to start", err);
  process.exit(1);
});
