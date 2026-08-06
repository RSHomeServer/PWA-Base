const DB_NAME = "browser-lab-bench";
const STORE_NAME = "items";

function openBenchDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function deleteBenchDb(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export interface IndexedDbBenchmarkResult {
  count: number;
  writeMs: number;
  readMs: number;
  writeOpsPerSec: number;
  readOpsPerSec: number;
}

export async function runIndexedDbBenchmark(
  onProgress: (fraction: number) => void,
  count = 400,
): Promise<IndexedDbBenchmarkResult> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this context.");
  }

  const db = await openBenchDb();
  const payload = Array.from({ length: 48 }, (_, i) => i);

  const writeStart = performance.now();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (let i = 0; i < count; i += 1) {
      store.put({ id: i, payload, ts: Date.now() }, i);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Write transaction failed"));
  });
  const writeMs = performance.now() - writeStart;
  onProgress(0.5);

  const readStart = performance.now();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    let completed = 0;
    for (let i = 0; i < count; i += 1) {
      const request = store.get(i);
      request.onsuccess = () => {
        completed += 1;
        if (completed === count) {
          resolve();
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Read failed"));
    }
  });
  const readMs = performance.now() - readStart;
  onProgress(0.9);

  db.close();
  await deleteBenchDb();
  onProgress(1);

  return {
    count,
    writeMs,
    readMs,
    writeOpsPerSec: count / (writeMs / 1000),
    readOpsPerSec: count / (readMs / 1000),
  };
}

export interface LocalStorageProbeResult {
  iterations: number;
  elapsedMs: number;
  opsPerSec: number;
}

const PROBE_KEY = "__browser_lab_probe__";

export async function runLocalStorageProbe(
  onProgress: (fraction: number) => void,
  iterations = 400,
): Promise<LocalStorageProbeResult> {
  if (typeof localStorage === "undefined") {
    throw new Error("localStorage is not available in this context.");
  }

  const value = "x".repeat(256);
  const start = performance.now();

  try {
    for (let i = 0; i < iterations; i += 1) {
      localStorage.setItem(PROBE_KEY, `${value}${i}`);
      const readBack = localStorage.getItem(PROBE_KEY);
      if (readBack === null) {
        throw new Error("Round-trip read returned null.");
      }
      if (i % 20 === 0) {
        onProgress(i / iterations);
      }
    }
  } finally {
    localStorage.removeItem(PROBE_KEY);
  }

  onProgress(1);
  const elapsedMs = performance.now() - start;
  return {
    iterations,
    elapsedMs,
    opsPerSec: (iterations * 2) / (elapsedMs / 1000),
  };
}

export interface StorageEstimate {
  usage: number;
  quota: number;
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) {
    return null;
  }
  const estimate = await navigator.storage.estimate();
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}

export async function isStoragePersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) {
    return false;
  }
  return navigator.storage.persisted();
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) {
    return false;
  }
  return navigator.storage.persist();
}
