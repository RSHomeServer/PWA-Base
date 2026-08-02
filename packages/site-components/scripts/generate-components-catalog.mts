#!/usr/bin/env tsx
/**
 * Validates that major @platform/ui and @platform/controls exports have catalogue entries.
 * Run via: pnpm --filter @platform/site-components generate:catalog
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { components } from "../src/catalog.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");

/** Maps public export names to catalogue entry ids. */
const EXPORT_TO_CATALOG_ID: Record<string, string> = {
  Button: "button",
  IconButton: "icon-button",
  Stack: "stack",
  Surface: "surface-panel",
  Panel: "surface-panel",
  Label: "form-controls",
  TextField: "form-controls",
  Select: "form-controls",
  TextArea: "form-controls",
  Badge: "badge",
  EmptyState: "empty-state",
  Spinner: "loading",
  Skeleton: "loading",
  Kbd: "kbd",
  ThemeToggle: "theme-toggle",
  ParameterPanel: "parameter-panel",
};

/** Exports that are internal helpers, types-only, or intentionally not catalogued. */
const ALLOWLIST = new Set([
  "Link",
  "Divider",
  "ThemeProvider",
  "useTheme",
  "applyTheme",
  "getSystemTheme",
  "resolveTheme",
  "THEME_STORAGE_KEY",
  "ParamDef",
  "ParamValue",
  "ParamValues",
  "NumberParamDef",
  "BooleanParamDef",
  "SelectParamDef",
  "TextParamDef",
  "SelectOption",
]);

function parseValueExports(indexPath: string): string[] {
  const source = readFileSync(indexPath, "utf8");
  const exports: string[] = [];

  const blockPattern = /export\s+(?!type\s)\{([^}]+)\}\s+from/g;
  for (const match of source.matchAll(blockPattern)) {
    const names = match[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.split(/\s+as\s+/)[0]?.trim())
      .filter((name): name is string => Boolean(name));
    exports.push(...names);
  }

  return exports;
}

function main(): void {
  const catalogIds = new Set(components.map((entry) => entry.id));
  const uiExports = parseValueExports(join(repoRoot, "packages/ui/src/index.ts"));
  const controlsExports = parseValueExports(
    join(repoRoot, "packages/controls/src/index.ts"),
  );
  const allExports = [...uiExports, ...controlsExports];

  const missingMapping: string[] = [];
  const missingCatalogEntry: string[] = [];

  for (const exportName of allExports) {
    if (ALLOWLIST.has(exportName)) {
      continue;
    }

    const catalogId = EXPORT_TO_CATALOG_ID[exportName];
    if (!catalogId) {
      missingMapping.push(exportName);
      continue;
    }

    if (!catalogIds.has(catalogId)) {
      missingCatalogEntry.push(`${exportName} → ${catalogId}`);
    }
  }

  const duplicateMappings = Object.entries(
    Object.entries(EXPORT_TO_CATALOG_ID).reduce<Record<string, string[]>>(
      (acc, [exportName, catalogId]) => {
        acc[catalogId] ??= [];
        acc[catalogId].push(exportName);
        return acc;
      },
      {},
    ),
  ).filter(([, exportNames]) => exportNames.length > 1);

  console.log(`Scanned ${uiExports.length} @platform/ui exports`);
  console.log(`Scanned ${controlsExports.length} @platform/controls exports`);
  console.log(`Catalogue entries: ${components.length}`);

  if (duplicateMappings.length > 0) {
    console.log("\nMulti-export catalogue groups:");
    for (const [catalogId, exportNames] of duplicateMappings) {
      console.log(`  ${catalogId}: ${exportNames.join(", ")}`);
    }
  }

  let failed = false;

  if (missingMapping.length > 0) {
    failed = true;
    console.error("\nMajor exports without catalogue mapping:");
    for (const name of missingMapping.sort()) {
      console.error(`  - ${name}`);
    }
    console.error(
      "\nAdd EXPORT_TO_CATALOG_ID entries or ALLOWLIST exceptions in scripts/generate-components-catalog.mts",
    );
  }

  if (missingCatalogEntry.length > 0) {
    failed = true;
    console.error("\nMapped exports with missing catalogue entries:");
    for (const entry of missingCatalogEntry.sort()) {
      console.error(`  - ${entry}`);
    }
    console.error("\nAdd entries to src/catalog.ts");
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log("\nCatalogue coverage OK — all major exports are documented.");
}

main();
