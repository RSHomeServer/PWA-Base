import { useCallback } from "react";
import {
  formatMs,
  formatNumber,
  pingOnce,
  probeWebsocket,
  useBenchmark,
  useNetworkConnection,
  verdictFromThresholds,
  type BenchmarkRunner,
} from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import { MeterBar } from "../../components/MeterBar.js";
import { SectionHeader } from "../../components/SectionHeader.js";
import { StatGrid, type StatItem } from "../../components/StatGrid.js";
import { PublicIpLookup } from "./PublicIpLookup.js";
import styles from "./NetworkSection.module.css";

const PING_SAMPLES = 12;

const latencyRunner: BenchmarkRunner = async ({ onProgress }) => {
  const series: number[] = [];
  for (let i = 0; i < PING_SAMPLES; i += 1) {
    try {
      const ms = await pingOnce();
      series.push(ms);
    } catch {
      /* skip failed sample */
    }
    onProgress((i + 1) / PING_SAMPLES);
  }

  if (series.length === 0) {
    return {
      score: 0,
      unit: "ms",
      label: "No response",
      verdict: "fail",
      detail: "Same-origin ping requests failed — check connectivity.",
    };
  }

  const avg = series.reduce((sum, v) => sum + v, 0) / series.length;
  const jitter = Math.max(...series) - Math.min(...series);
  const verdict = verdictFromThresholds(200 - avg, 100, 160);

  return {
    score: avg,
    unit: "ms",
    label: `${formatMs(avg)} avg`,
    verdict,
    detail: `Jitter ${formatMs(jitter)} across ${series.length} same-origin requests`,
    series,
  };
};

const websocketRunner: BenchmarkRunner = async ({ onProgress }) => {
  onProgress(0.3);
  const result = await probeWebsocket();
  onProgress(1);

  if (!result.connected) {
    return {
      score: 0,
      unit: "ms",
      label: "No endpoint",
      verdict: "info",
      detail:
        "No WebSocket endpoint responded at this origin within the timeout — expected on static hosts.",
    };
  }

  const verdict = verdictFromThresholds(400 - result.ms, 250, 350);
  return {
    score: result.ms,
    unit: "ms",
    label: `${formatMs(result.ms)} connect`,
    verdict,
    detail: "Handshake completed and socket was closed immediately after connecting.",
  };
};

export function NetworkSection() {
  const connection = useNetworkConnection();
  const latency = useBenchmark(latencyRunner);
  const websocket = useBenchmark(websocketRunner);

  const runLatency = useCallback(() => latency.run(), [latency]);
  const runWebsocket = useCallback(() => websocket.run(), [websocket]);

  const items: StatItem[] = [
    {
      key: "effectiveType",
      label: "Effective connection type",
      value: connection.supported ? connection.effectiveType : "Not exposed",
      hint: connection.supported
        ? undefined
        : "Network Information API isn't available in this browser.",
    },
    {
      key: "saveData",
      label: "Data saver",
      value: connection.supported ? (connection.saveData ? "Enabled" : "Disabled") : "—",
    },
  ];

  return (
    <section aria-labelledby="lab-network-title">
      <SectionHeader
        eyebrow="Signal Bay"
        title="Network"
        description="Connection hints reported by the browser, same-origin latency sampling, a public-IP lookup, and a best-effort WebSocket handshake probe."
      />

      <div className={styles.meters}>
        <MeterBar
          label="Downlink estimate"
          value={connection.downlinkMbps ?? 0}
          max={50}
          displayValue={
            connection.downlinkMbps === null
              ? "Not exposed"
              : `${formatNumber(connection.downlinkMbps, 1)} Mbps`
          }
          verdict={
            connection.downlinkMbps === null
              ? "info"
              : verdictFromThresholds(connection.downlinkMbps, 2, 10)
          }
        />
        <MeterBar
          label="Round-trip time (reported)"
          value={connection.rttMs === null ? 0 : Math.max(0, 300 - connection.rttMs)}
          max={300}
          displayValue={
            connection.rttMs === null ? "Not exposed" : `${formatNumber(connection.rttMs)} ms`
          }
          verdict={
            connection.rttMs === null
              ? "info"
              : verdictFromThresholds(300 - connection.rttMs, 150, 220)
          }
        />
      </div>

      <StatGrid items={items} />

      <div className={styles.grid}>
        <BenchmarkCard
          title="Same-origin latency"
          description={`Sends ${PING_SAMPLES} cache-busted fetches to this page's own origin and reports average round-trip time and jitter.`}
          status={latency.status}
          progress={latency.progress}
          result={latency.result}
          error={latency.error}
          onRun={runLatency}
          runLabel="Run ping test"
          historyKey="network-latency"
          higherIsBetter={false}
        />
        <BenchmarkCard
          title="WebSocket roundtrip"
          description="Attempts a WebSocket handshake to this origin and times the connection open event. Most static hosts have no listener, so 'No endpoint' is an expected, healthy result."
          status={websocket.status}
          progress={websocket.progress}
          result={websocket.result}
          error={websocket.error}
          onRun={runWebsocket}
          runLabel="Probe WebSocket"
          historyKey="network-websocket"
          higherIsBetter={false}
        />
      </div>

      <PublicIpLookup />
    </section>
  );
}
