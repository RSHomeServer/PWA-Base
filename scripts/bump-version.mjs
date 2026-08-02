#!/usr/bin/env node
/**
 * Bump the root VERSION file (semver).
 * Usage: node scripts/bump-version.mjs [patch|minor|major]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const kind = (process.argv[2] ?? "patch").toLowerCase();
const file = join(process.cwd(), "VERSION");
const current = readFileSync(file, "utf8").trim();
const match = /^(\d+)\.(\d+)\.(\d+)/.exec(current);
if (!match) {
  console.error(`Invalid VERSION: ${current}`);
  process.exit(1);
}
let [, major, minor, patch] = match.map((v, i) => (i === 0 ? v : Number(v)));
if (kind === "major") {
  major += 1;
  minor = 0;
  patch = 0;
} else if (kind === "minor") {
  minor += 1;
  patch = 0;
} else if (kind === "patch") {
  patch += 1;
} else {
  console.error(`Unknown bump kind: ${kind}`);
  process.exit(1);
}
const next = `${major}.${minor}.${patch}`;
writeFileSync(file, `${next}\n`);
console.log(`${current} → ${next}`);
