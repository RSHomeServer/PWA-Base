import { verifySha256 } from "./hash.js";
import { readActivePack, writeActivePack } from "../storage/packStore.js";
import type {
  ContentPackManifest,
  PackClientOptions,
  PackInstallProgress,
  PackInstallResult,
} from "./types.js";

const CACHE_PREFIX = "platform-pack:";

function joinUrl(root: string, ...parts: string[]): string {
  const base = root.replace(/\/+$/, "");
  const path = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return `${base}/${path}`;
}

export function packBaseUrl(
  appId: string,
  packId: string,
  version: string,
  packsRoot = "/packs",
): string {
  return joinUrl(packsRoot, appId, packId, version);
}

async function resolveVersion(
  appId: string,
  packId: string,
  packsRoot: string,
  explicit?: string,
  signal?: AbortSignal,
): Promise<string> {
  if (explicit) return explicit;
  try {
    const res = await fetch(joinUrl(packsRoot, appId, packId, "current.json"), { signal });
    if (res.ok) {
      const body = (await res.json()) as { version?: string };
      if (body.version) return body.version;
    }
  } catch {
    /* fall through */
  }
  return "1.0.0";
}

export async function fetchPackManifest(
  appId: string,
  packId: string,
  version: string,
  packsRoot = "/packs",
  signal?: AbortSignal,
): Promise<ContentPackManifest> {
  const url = joinUrl(packBaseUrl(appId, packId, version, packsRoot), "pack.json");
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch pack manifest (${res.status}): ${url}`);
  }
  const manifest = (await res.json()) as ContentPackManifest;
  if (manifest.id !== packId) {
    throw new Error(`Pack id mismatch: expected ${packId}, got ${manifest.id}`);
  }
  if (manifest.version !== version) {
    throw new Error(`Pack version mismatch: expected ${version}, got ${manifest.version}`);
  }
  return manifest;
}

function emit(
  onProgress: PackClientOptions["onProgress"],
  progress: PackInstallProgress,
): void {
  onProgress?.(progress);
}

export async function isPackActive(packId: string, version?: string): Promise<boolean> {
  const active = await readActivePack(packId);
  if (!active) return false;
  if (version && active.version !== version) return false;
  return true;
}

export async function readActivePackVersion(packId: string): Promise<string | null> {
  const active = await readActivePack(packId);
  return active?.version ?? null;
}

/**
 * Install (or confirm) a Content Pack from static `/packs/...` files.
 * Verifies SHA-256 for each entry before activation.
 */
export async function installContentPack(
  appId: string,
  packId: string,
  options: PackClientOptions = {},
): Promise<PackInstallResult> {
  const packsRoot = options.packsRoot ?? "/packs";
  const version = await resolveVersion(appId, packId, packsRoot, options.version, options.signal);

  if (options.skipIfActive !== false && (await isPackActive(packId, version))) {
    emit(options.onProgress, {
      packId,
      version,
      phase: "done",
      completedEntries: 0,
      totalEntries: 0,
      message: "Already active",
    });
    return { packId, version, activated: true };
  }

  emit(options.onProgress, {
    packId,
    version,
    phase: "manifest",
    completedEntries: 0,
    totalEntries: 0,
  });

  const manifest = await fetchPackManifest(appId, packId, version, packsRoot, options.signal);
  const base = packBaseUrl(appId, packId, version, packsRoot);
  const cache = await caches.open(`${CACHE_PREFIX}${packId}@${version}`);
  const entryHashes: Record<string, string> = {};
  let completed = 0;
  const total = manifest.entries.length;

  for (const entry of manifest.entries) {
    emit(options.onProgress, {
      packId,
      version,
      phase: "download",
      completedEntries: completed,
      totalEntries: total,
      message: entry.path,
    });
    const url = joinUrl(base, entry.path);
    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch pack entry (${res.status}): ${url}`);
    }
    const buffer = await res.arrayBuffer();

    emit(options.onProgress, {
      packId,
      version,
      phase: "verify",
      completedEntries: completed,
      totalEntries: total,
      message: entry.path,
    });
    const ok = await verifySha256(buffer, entry.hash);
    if (!ok) {
      throw new Error(`Hash mismatch for pack entry: ${entry.path}`);
    }

    await cache.put(url, new Response(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
        "X-Content-Pack-Hash": entry.hash,
      },
    }));
    entryHashes[entry.path] = entry.hash;
    completed += 1;
  }

  emit(options.onProgress, {
    packId,
    version,
    phase: "activate",
    completedEntries: completed,
    totalEntries: total,
  });

  await writeActivePack({
    packId,
    version,
    appId,
    activatedAt: new Date().toISOString(),
    entryHashes,
  });

  emit(options.onProgress, {
    packId,
    version,
    phase: "done",
    completedEntries: completed,
    totalEntries: total,
  });

  return { packId, version, activated: true };
}

/** Ensure every required pack is installed and active (complete-first-install gate). */
export async function ensureRequiredPacks(
  appId: string,
  packIds: readonly string[],
  options: PackClientOptions = {},
): Promise<PackInstallResult[]> {
  const results: PackInstallResult[] = [];
  for (const packId of packIds) {
    results.push(await installContentPack(appId, packId, options));
  }
  return results;
}

export async function getPackEntryUrl(
  appId: string,
  packId: string,
  entryPath: string,
  packsRoot = "/packs",
): Promise<string | null> {
  const active = await readActivePack(packId);
  if (!active || active.appId !== appId) return null;
  return joinUrl(packBaseUrl(appId, packId, active.version, packsRoot), entryPath);
}

export async function getPackEntryText(
  appId: string,
  packId: string,
  entryPath: string,
  packsRoot = "/packs",
): Promise<string | null> {
  const url = await getPackEntryUrl(appId, packId, entryPath, packsRoot);
  if (!url) return null;
  const cacheName = `${CACHE_PREFIX}${packId}@${(await readActivePack(packId))!.version}`;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(url);
  if (cached) return cached.text();
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}
