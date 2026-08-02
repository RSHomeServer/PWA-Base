const DB_NAME = "platform-runtime-packs";
const DB_VERSION = 1;
const STORE = "active";

export interface ActivePackRecord {
  packId: string;
  version: string;
  appId: string;
  activatedAt: string;
  entryHashes: Record<string, string>;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "packId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function readActivePack(packId: string): Promise<ActivePackRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(packId);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
    req.onsuccess = () => resolve((req.result as ActivePackRecord | undefined) ?? null);
  });
}

export async function writeActivePack(record: ActivePackRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB put failed"));
    tx.oncomplete = () => resolve();
  });
}
