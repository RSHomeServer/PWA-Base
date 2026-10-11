import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "./hash.js";
import {
  ensureRequiredPacks,
  installContentPack,
  packCacheName,
  resolvePackVersion,
} from "./client.js";
import { readActivePack, writeActivePack } from "../storage/packStore.js";

const APP = "demo";
const PACK = "demo-base";

type Fixture = {
  version: string;
  entries: { path: string; body: string }[];
};

function installMemoryCaches() {
  const stores = new Map<string, Map<string, Response>>();
  vi.stubGlobal("caches", {
    async keys() {
      return [...stores.keys()];
    },
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        async put(request: RequestInfo, response: Response) {
          const url = typeof request === "string" ? request : request.url;
          store.set(url, response.clone());
        },
        async match(request: RequestInfo) {
          const url = typeof request === "string" ? request : request.url;
          const hit = store.get(url);
          return hit ? hit.clone() : undefined;
        },
        async keys() {
          return [...store.keys()].map((url) => new Request(url));
        },
        async delete(request: RequestInfo) {
          const url = typeof request === "string" ? request : request.url;
          return store.delete(url);
        },
      };
    },
    async delete(name: string) {
      return stores.delete(name);
    },
  });
  return stores;
}

async function fixtureManifest(fixture: Fixture) {
  const entries = [];
  for (const entry of fixture.entries) {
    const data = new TextEncoder().encode(entry.body).buffer;
    entries.push({
      path: entry.path,
      hash: `sha256:${await sha256Hex(data)}`,
      size: entry.body.length,
    });
  }
  return {
    id: PACK,
    version: fixture.version,
    appId: APP,
    entries,
  };
}

function mockPackNetwork(options: {
  currentVersion?: string | null;
  currentThrows?: boolean;
  fixtures: Record<string, Fixture>;
  corruptEntryPath?: string;
}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input.url;

    if (url.endsWith("/current.json")) {
      if (options.currentThrows) throw new TypeError("Failed to fetch");
      if (options.currentVersion == null) {
        return new Response("missing", { status: 404 });
      }
      return Response.json({ version: options.currentVersion });
    }

    const match = url.match(new RegExp(`/packs/${APP}/${PACK}/([^/]+)/(.*)$`));
    if (!match) return new Response("not found", { status: 404 });
    const [, version, rel] = match;
    const fixture = options.fixtures[version];
    if (!fixture) return new Response("not found", { status: 404 });

    if (rel === "pack.json") {
      return Response.json(await fixtureManifest(fixture));
    }

    const entry = fixture.entries.find((e) => e.path === rel);
    if (!entry) return new Response("not found", { status: 404 });
    const body =
      options.corruptEntryPath === entry.path ? `${entry.body}-tampered` : entry.body;
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  });
}

describe("content pack Ready / version resolution", () => {
  const v110: Fixture = {
    version: "1.1.0",
    entries: [
      { path: "content/keepsake.json", body: '{"v":1}' },
      { path: "media/photos/a.png", body: "photo-a" },
    ],
  };
  const v120: Fixture = {
    version: "1.2.0",
    entries: [
      { path: "content/keepsake.json", body: '{"v":2}' },
      { path: "media/photos/a.png", body: "photo-a-v2" },
    ],
  };

  beforeEach(() => {
    installMemoryCaches();
    // Isolate IndexedDB between tests (fake-indexeddb).
    // eslint-disable-next-line no-global-assign
    indexedDB = new IDBFactory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offline reload: Ready succeeds from installed pack when current.json fetch fails", async () => {
    mockPackNetwork({ currentVersion: "1.1.0", fixtures: { "1.1.0": v110 } });
    await installContentPack(APP, PACK, { skipIfActive: true });
    expect((await readActivePack(PACK))?.version).toBe("1.1.0");

    mockPackNetwork({
      currentThrows: true,
      fixtures: { "1.1.0": v110 },
    });

    const resolved = await resolvePackVersion(APP, PACK, "/packs");
    expect(resolved).toEqual({ version: "1.1.0", source: "active" });

    const results = await ensureRequiredPacks(APP, [PACK], { skipIfActive: true });
    expect(results).toEqual([{ packId: PACK, version: "1.1.0", activated: true }]);
  });

  it("first launch offline: Ready fails clearly with no installed pack", async () => {
    mockPackNetwork({ currentThrows: true, fixtures: {} });

    await expect(resolvePackVersion(APP, PACK, "/packs")).rejects.toThrow(
      /network unavailable and no installed pack/,
    );
    await expect(ensureRequiredPacks(APP, [PACK], { skipIfActive: true })).rejects.toThrow(
      /network unavailable and no installed pack/,
    );
  });

  it("online update: installs a newer version from current.json", async () => {
    mockPackNetwork({
      currentVersion: "1.1.0",
      fixtures: { "1.1.0": v110, "1.2.0": v120 },
    });
    await installContentPack(APP, PACK, { skipIfActive: true });
    expect((await readActivePack(PACK))?.version).toBe("1.1.0");

    mockPackNetwork({
      currentVersion: "1.2.0",
      fixtures: { "1.1.0": v110, "1.2.0": v120 },
    });
    const result = await installContentPack(APP, PACK, { skipIfActive: true });
    expect(result).toEqual({ packId: PACK, version: "1.2.0", activated: true });
    expect((await readActivePack(PACK))?.version).toBe("1.2.0");
    expect(await caches.keys()).toContain(packCacheName(PACK, "1.2.0"));
  });

  it("stale cache: does not report Ready when installed metadata lacks Cache Storage entries", async () => {
    mockPackNetwork({ currentVersion: "1.1.0", fixtures: { "1.1.0": v110 } });
    await installContentPack(APP, PACK, { skipIfActive: true });

    await caches.delete(packCacheName(PACK, "1.1.0"));

    // Fully offline: version falls back to active, but cache repair cannot run.
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(installContentPack(APP, PACK, { skipIfActive: true })).rejects.toThrow(
      /unusable and cannot be re-downloaded/,
    );
  });

  it("transient current.json failure: uses active pack without masking integrity errors", async () => {
    mockPackNetwork({ currentVersion: "1.1.0", fixtures: { "1.1.0": v110 } });
    await installContentPack(APP, PACK, { skipIfActive: true });

    mockPackNetwork({
      currentThrows: true,
      fixtures: { "1.1.0": v110 },
    });
    await expect(
      ensureRequiredPacks(APP, [PACK], { skipIfActive: true }),
    ).resolves.toEqual([{ packId: PACK, version: "1.1.0", activated: true }]);

    // Integrity failure while online still surfaces (not swallowed by offline fallback).
    mockPackNetwork({
      currentVersion: "1.2.0",
      fixtures: { "1.2.0": v120 },
      corruptEntryPath: "content/keepsake.json",
    });
    await expect(installContentPack(APP, PACK, { skipIfActive: true })).rejects.toThrow(
      /Hash mismatch/,
    );
  });

  it("reachable missing current.json still defaults to 1.0.0 (online v1 behaviour)", async () => {
    const v100: Fixture = {
      version: "1.0.0",
      entries: [{ path: "meta/welcome.json", body: '{"hi":true}' }],
    };
    mockPackNetwork({ currentVersion: null, fixtures: { "1.0.0": v100 } });
    const resolved = await resolvePackVersion(APP, PACK, "/packs");
    expect(resolved).toEqual({ version: "1.0.0", source: "default" });
    await expect(installContentPack(APP, PACK)).resolves.toMatchObject({
      version: "1.0.0",
      activated: true,
    });
  });

  it("does not treat IndexedDB-only records for another app as usable offline", async () => {
    await writeActivePack({
      packId: PACK,
      version: "1.1.0",
      appId: "other-app",
      activatedAt: new Date().toISOString(),
      entryHashes: { "content/keepsake.json": "sha256:abc" },
    });
    mockPackNetwork({ currentThrows: true, fixtures: {} });
    await expect(resolvePackVersion(APP, PACK, "/packs")).rejects.toThrow(
      /network unavailable and no installed pack/,
    );
  });
});
