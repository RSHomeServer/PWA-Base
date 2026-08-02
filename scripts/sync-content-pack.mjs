#!/usr/bin/env node
/**
 * Hash Content Pack entries and mirror into solo (+ optional host) public folders.
 *
 * Usage:
 *   node scripts/sync-content-pack.mjs <appId> <packId> [version]
 *   pnpm content-pack:sync -- birthday birthday-base
 *   pnpm content-pack:sync -- birthday birthday-base 1.1.0
 *
 * Birthday shorthand (backwards compatible):
 *   pnpm birthday:pack
 *   node scripts/sync-birthday-pack.mjs [version]
 */
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const appId = process.argv[2];
const packId = process.argv[3];
const versionArg = process.argv[4];

if (!appId || !packId) {
  console.error(
    "Usage: node scripts/sync-content-pack.mjs <appId> <packId> [version]\n" +
      "Example: node scripts/sync-content-pack.mjs birthday birthday-base 1.1.0",
  );
  process.exit(1);
}

const sitePackage = `site-${appId}`;
const contentRoot = join(root, "packages", sitePackage, "content", packId);

function readCurrentVersion() {
  const currentPath = join(contentRoot, "current.json");
  if (!existsSync(currentPath)) return undefined;
  try {
    const body = JSON.parse(readFileSync(currentPath, "utf8"));
    return typeof body?.version === "string" ? body.version : undefined;
  } catch {
    return undefined;
  }
}

const version = versionArg ?? readCurrentVersion() ?? "1.1.0";
const sourceDir = join(contentRoot, version);

if (!existsSync(sourceDir)) {
  console.error(`Missing pack source: ${sourceDir}`);
  process.exit(1);
}

function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "pack.json") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, base, out);
    else out.push(full);
  }
  return out;
}

const files = walk(sourceDir).sort();
const entries = files.map((full) => {
  const buf = readFileSync(full);
  const hash = createHash("sha256").update(buf).digest("hex");
  return {
    path: relative(sourceDir, full).split("\\").join("/"),
    hash: `sha256:${hash}`,
    size: buf.byteLength,
  };
});

const manifest = {
  id: packId,
  version,
  appId,
  entries,
};

writeFileSync(join(sourceDir, "pack.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(contentRoot, "current.json"), `${JSON.stringify({ version }, null, 2)}\n`);

const soloWeb = join(root, "apps", `${appId}-web`, "public", "packs", appId, packId);
const platformMirror = join(root, "apps/platform/public/packs", appId, packId);

const mirrors = [soloWeb];
if (existsSync(join(root, "apps/platform/public"))) {
  mirrors.push(platformMirror);
}

for (const mirrorRoot of mirrors) {
  mkdirSync(mirrorRoot, { recursive: true });
  const destVersion = join(mirrorRoot, version);
  if (existsSync(destVersion)) rmSync(destVersion, { recursive: true, force: true });
  cpSync(sourceDir, destVersion, { recursive: true });
  writeFileSync(join(mirrorRoot, "current.json"), `${JSON.stringify({ version }, null, 2)}\n`);
  console.log(`mirrored → ${relative(root, destVersion)} (${entries.length} entries)`);
}

console.log(`pack ${packId}@${version} ready (${entries.length} hashed files)`);
