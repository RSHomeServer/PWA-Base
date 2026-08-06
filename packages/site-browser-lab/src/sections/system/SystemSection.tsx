import { useSystemInfo, verdictFromThresholds } from "@platform/browser";
import { Badge } from "@platform/ui";
import { Gauge } from "../../components/Gauge.js";
import { SectionHeader } from "../../components/SectionHeader.js";
import { StatGrid, type StatItem } from "../../components/StatGrid.js";
import { verdictBadgeVariant } from "../../lib/verdict.js";
import styles from "./SystemSection.module.css";

export function SystemSection() {
  const info = useSystemInfo();

  const coreVerdict = verdictFromThresholds(info.cores, 4, 8);
  const memoryVerdict =
    info.deviceMemoryGb === null ? "info" : verdictFromThresholds(info.deviceMemoryGb, 4, 8);

  const items: StatItem[] = [
    { key: "browser", label: "Browser", value: `${info.browser} ${info.browserVersion}`.trim() },
    { key: "engine", label: "Engine", value: info.engine },
    { key: "os", label: "Operating system", value: info.os },
    { key: "languages", label: "Languages", value: info.languages },
    {
      key: "webgl",
      label: "WebGL renderer",
      value: info.webgl.supported ? info.webgl.renderer : "Not supported",
      hint: info.webgl.supported
        ? `Vendor: ${info.webgl.vendor} · ${info.webgl.version.toUpperCase()}`
        : undefined,
    },
    { key: "cookies", label: "Cookies", value: info.cookiesEnabled ? "Enabled" : "Disabled" },
  ];

  return (
    <section aria-labelledby="lab-system-title">
      <SectionHeader
        eyebrow="Identity Bay"
        title="System"
        description="Runtime identity of the browser, engine, and hardware this session executes on — the baseline every other instrument in the lab calibrates against."
      />

      <div className={styles.layout}>
        <div className={styles.gauges}>
          <Gauge
            value={info.cores}
            max={32}
            label="Logical cores"
            displayValue={String(info.cores || "—")}
            verdict={coreVerdict}
            typicalValue={8}
          />
          <Gauge
            value={info.deviceMemoryGb ?? 0}
            max={32}
            label="Memory estimate"
            displayValue={info.deviceMemoryGb === null ? "N/A" : `${info.deviceMemoryGb}`}
            unit={info.deviceMemoryGb === null ? undefined : "GB+"}
            verdict={memoryVerdict}
            typicalValue={8}
          />
        </div>

        <div className={styles.statsColumn}>
          <StatGrid items={items} />
          <div className={styles.badgeRow} aria-label="Platform capability flags">
            <Badge variant={verdictBadgeVariant(info.webgpu ? "pass" : "fail")}>
              WebGPU {info.webgpu ? "available" : "unavailable"}
            </Badge>
            <Badge variant={verdictBadgeVariant(info.wasm.supported ? "pass" : "fail")}>
              WebAssembly {info.wasm.supported ? "supported" : "unsupported"}
            </Badge>
            {info.wasm.supported ? (
              <Badge variant={verdictBadgeVariant(info.wasm.simd ? "pass" : "warn")}>
                WASM SIMD {info.wasm.simd ? "yes" : "no"}
              </Badge>
            ) : null}
            {info.wasm.supported ? (
              <Badge variant={verdictBadgeVariant(info.wasm.streaming ? "pass" : "warn")}>
                Streaming compile {info.wasm.streaming ? "yes" : "no"}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
