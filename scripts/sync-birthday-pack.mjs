#!/usr/bin/env node
/**
 * Backwards-compatible Birthday pack sync.
 *
 * Prefer:
 *   pnpm content-pack:sync -- birthday birthday-base [version]
 *   node scripts/sync-content-pack.mjs birthday birthday-base [version]
 *
 * Legacy:
 *   node scripts/sync-birthday-pack.mjs [version]
 *   pnpm birthday:pack
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const generic = join(here, "sync-content-pack.mjs");
const version = process.argv[2];
const args = [generic, "birthday", "birthday-base"];
if (version) args.push(version);

const result = spawnSync(process.execPath, args, { stdio: "inherit" });
process.exit(result.status === null ? 1 : result.status);
