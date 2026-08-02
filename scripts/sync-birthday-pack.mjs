#!/usr/bin/env node
/**
 * Hash birthday-base pack entries and mirror into solo (+ optional host) public folders.
 *
 * Usage:
 *   node scripts/sync-birthday-pack.mjs [version]
 *   pnpm birthday:pack
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
const packId = "birthday-base";
const appId = "birthday";
const version = process.argv[2] ?? "1.1.0";
const sourceDir = join(root, "packages/site-birthday/content", packId, version);

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
writeFileSync(
  join(root, "packages/site-birthday/content", packId, "current.json"),
  `${JSON.stringify({ version }, null, 2)}\n`,
);

const mirrors = [
  join(root, "apps/birthday-web/public/packs", appId, packId),
  join(root, "apps/platform/public/packs", appId, packId),
];

for (const mirrorRoot of mirrors) {
  mkdirSync(mirrorRoot, { recursive: true });
  const destVersion = join(mirrorRoot, version);
  if (existsSync(destVersion)) rmSync(destVersion, { recursive: true, force: true });
  cpSync(sourceDir, destVersion, { recursive: true });
  writeFileSync(join(mirrorRoot, "current.json"), `${JSON.stringify({ version }, null, 2)}\n`);
  console.log(`mirrored → ${relative(root, destVersion)} (${entries.length} entries)`);
}

console.log(`pack ${packId}@${version} ready (${entries.length} hashed files)`);
