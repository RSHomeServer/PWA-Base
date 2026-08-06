import { useCallback, useEffect, useState } from "react";
import { Badge, Button } from "@platform/ui";
import {
  formatBytes,
  formatMs,
  formatNumber,
  getStorageEstimate,
  isStoragePersisted,
  percent,
  requestPersistentStorage,
  runIndexedDbBenchmark,
  runLocalStorageProbe,
  useBenchmark,
  verdictFromThresholds,
  type BenchmarkRunner,
  type StorageEstimate,
} from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import { MeterBar } from "../../components/MeterBar.js";
import { SectionHeader } from "../../components/SectionHeader.js";
import { verdictBadgeVariant } from "../../lib/verdict.js";
import styles from "./StorageSection.module.css";

const indexedDbRunner: BenchmarkRunner = async ({ onProgress }) => {
  const result = await runIndexedDbBenchmark(onProgress);
  const verdict = verdictFromThresholds(result.readOpsPerSec, 4000, 15000);
  return {
    score: result.readOpsPerSec,
    unit: "ops/s",
    label: `${formatNumber(result.readOpsPerSec)} reads/s`,
    verdict,
    detail: `${result.count} records · write ${formatMs(result.writeMs)} (${formatNumber(result.writeOpsPerSec)} ops/s) · read ${formatMs(result.readMs)}`,
  };
};

const localStorageRunner: BenchmarkRunner = async ({ onProgress }) => {
  const result = await runLocalStorageProbe(onProgress);
  const verdict = verdictFromThresholds(result.opsPerSec, 2000, 8000);
  return {
    score: result.opsPerSec,
    unit: "ops/s",
    label: `${formatNumber(result.opsPerSec)} ops/s`,
    verdict,
    detail: `${result.iterations} write+read round-trips in ${formatMs(result.elapsedMs)}`,
  };
};

export function StorageSection() {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [persisted, setPersisted] = useState(false);
  const [persistBusy, setPersistBusy] = useState(false);

  const indexedDbBench = useBenchmark(indexedDbRunner);
  const localStorageBench = useBenchmark(localStorageRunner);

  const refresh = useCallback(() => {
    getStorageEstimate()
      .then(setEstimate)
      .catch(() => setEstimate(null));
    isStoragePersisted()
      .then(setPersisted)
      .catch(() => setPersisted(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePersist = useCallback(async () => {
    setPersistBusy(true);
    try {
      const granted = await requestPersistentStorage();
      setPersisted(granted);
    } finally {
      setPersistBusy(false);
    }
  }, []);

  const usagePct = estimate ? percent(estimate.usage, estimate.quota) : 0;

  return (
    <section aria-labelledby="lab-storage-title">
      <SectionHeader
        eyebrow="Archive Bay"
        title="Storage"
        description="Origin storage quota, a persistence request, and micro-benchmarks that write and read real records through IndexedDB and localStorage."
        actions={
          <Button type="button" size="sm" variant="secondary" onClick={refresh}>
            Refresh estimate
          </Button>
        }
      />

      <div className={styles.overview}>
        <div className={styles.meterWrap}>
          <MeterBar
            label="Origin storage usage"
            value={estimate?.usage ?? 0}
            max={estimate?.quota ?? 1}
            displayValue={
              estimate
                ? `${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`
                : "Not supported"
            }
            verdict={estimate ? verdictFromThresholds(100 - usagePct, 20, 60) : "info"}
          />
        </div>
        <div className={styles.persistRow}>
          <div>
            <p className={styles.persistLabel}>Persistent storage</p>
            <Badge variant={verdictBadgeVariant(persisted ? "pass" : "info")}>
              {persisted ? "Granted" : "Not persisted"}
            </Badge>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handlePersist}
            disabled={persistBusy || persisted}
          >
            {persistBusy
              ? "Requesting…"
              : persisted
                ? "Already granted"
                : "Request persistent storage"}
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        <BenchmarkCard
          title="IndexedDB micro-benchmark"
          description="Writes 400 small records into a temporary object store, reads them all back, then deletes the database."
          status={indexedDbBench.status}
          progress={indexedDbBench.progress}
          result={indexedDbBench.result}
          error={indexedDbBench.error}
          onRun={indexedDbBench.run}
          runLabel="Run IndexedDB test"
          historyKey="storage-indexeddb"
          typical={{ value: 4000, label: "Typical desktop" }}
        />
        <BenchmarkCard
          title="localStorage probe"
          description="Performs 400 synchronous write + read round-trips against a single dedicated key to measure effective throughput."
          status={localStorageBench.status}
          progress={localStorageBench.progress}
          result={localStorageBench.result}
          error={localStorageBench.error}
          onRun={localStorageBench.run}
          runLabel="Run localStorage test"
          historyKey="storage-localstorage"
          typical={{ value: 2000, label: "Typical desktop" }}
        />
      </div>
    </section>
  );
}
