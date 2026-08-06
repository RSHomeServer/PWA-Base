import { useEffect } from "react";
import { Button } from "@platform/ui";
import { useDisplayInfo, useRefreshRate, verdictFromThresholds } from "@platform/browser";
import { Gauge } from "../../components/Gauge.js";
import { SectionHeader } from "../../components/SectionHeader.js";
import { StatGrid, type StatItem } from "../../components/StatGrid.js";
import { FullscreenDemo } from "./FullscreenDemo.js";
import styles from "./DisplaySection.module.css";

export function DisplaySection() {
  const info = useDisplayInfo();
  const { estimatedHz, nearestHz, measuring, measure } = useRefreshRate();

  useEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshVerdict = nearestHz === null ? "info" : verdictFromThresholds(nearestHz, 60, 90);

  const items: StatItem[] = [
    {
      key: "resolution",
      label: "Screen resolution",
      value: `${info.screenWidth} × ${info.screenHeight}`,
    },
    { key: "viewport", label: "Viewport", value: `${info.innerWidth} × ${info.innerHeight}` },
    { key: "dpr", label: "Device pixel ratio", value: `${info.dpr}×` },
    { key: "gamut", label: "Color gamut", value: info.colorGamut },
    { key: "hdr", label: "HDR / dynamic range", value: info.hdr ? "High" : "Standard" },
    { key: "contrast", label: "Contrast preference", value: info.contrastPreference },
    { key: "scheme", label: "Preferred color scheme", value: info.colorScheme },
    {
      key: "orientation",
      label: "Orientation",
      value: info.orientationType,
      hint: `${info.orientationAngle}° rotation`,
    },
  ];

  return (
    <section aria-labelledby="lab-display-title">
      <SectionHeader
        eyebrow="Optics Bay"
        title="Display"
        description="Panel geometry, color capability, and refresh-rate estimation — measured live from the device you're viewing this on right now."
        actions={
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={measure}
            disabled={measuring}
          >
            {measuring ? "Measuring…" : "Re-measure refresh rate"}
          </Button>
        }
      />

      <div className={styles.layout}>
        <div className={styles.gauges}>
          <Gauge
            value={estimatedHz ?? 0}
            max={240}
            label="Estimated refresh rate"
            displayValue={nearestHz === null ? "…" : `${nearestHz}`}
            unit={nearestHz === null ? undefined : "Hz"}
            verdict={refreshVerdict}
            typicalValue={60}
          />
          <p className={styles.gaugeHint}>
            {estimatedHz === null
              ? "Sampling frame timing…"
              : `Raw sample: ${estimatedHz.toFixed(1)} Hz, snapped to nearest common panel rate.`}
          </p>
        </div>

        <div className={styles.statsColumn}>
          <StatGrid items={items} />
          <FullscreenDemo />
        </div>
      </div>
    </section>
  );
}
