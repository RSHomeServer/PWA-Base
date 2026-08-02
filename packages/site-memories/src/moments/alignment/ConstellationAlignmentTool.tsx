import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ConstellationRenderer,
  resolveConstellation,
  undirectedEdgeKey,
  type DrawnEdge,
} from "../constellation/index.js";
import { listConstellationIds } from "../constellations/index.js";
import { findUsConfig } from "../types.js";
import { AlignmentOverlay } from "./AlignmentOverlay.js";
import { ConstellationSection } from "./ConstellationSection.js";
import {
  createAlignmentInstance,
  DEFAULT_DISPLAY_OPTIONS,
  exportAlignmentConfig,
  type AlignmentDisplayOptions,
  type AlignmentInstance,
} from "./model.js";
import styles from "./AlignmentTool.module.css";
import momentStyles from "../FindUsMoment.module.css";

function edgesFromDraft(
  graphEdges: [string, string][],
  show: boolean,
): DrawnEdge[] {
  if (!show) return [];
  const seen = new Set<string>();
  const out: DrawnEdge[] = [];
  for (const [a, b] of graphEdges) {
    const key = undirectedEdgeKey(a, b);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ fromUid: a, toUid: b, key });
  }
  return out;
}

/**
 * Internal Constellation Alignment Tool.
 * Gated by Development Mode at the page level — never mounts in production mode.
 * Preview iterates ConstellationInstance[] through the shared production renderer.
 */
export function ConstellationAlignmentTool() {
  const constellationIds = useMemo(() => listConstellationIds(), []);
  const defaultId = constellationIds[0] ?? "leo";

  const [instances, setInstances] = useState<AlignmentInstance[]>(() => [
    createAlignmentInstance(defaultId),
  ]);
  const [display, setDisplay] = useState<AlignmentDisplayOptions>(
    DEFAULT_DISPLAY_OPTIONS,
  );
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [hover, setHover] = useState<{
    id: string;
    name: string;
    subtitle: string;
    x: number;
    y: number;
  } | null>(null);

  const viewBox = {
    w: findUsConfig.stage.viewBoxWidth,
    h: findUsConfig.stage.viewBoxHeight,
  };

  useEffect(() => {
    document.documentElement.classList.add("moment-immersive");
    return () => {
      document.documentElement.classList.remove("moment-immersive");
    };
  }, []);

  const updateInstance = useCallback(
    (instanceId: string, patch: Partial<AlignmentInstance>) => {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.instanceId === instanceId ? { ...inst, ...patch } : inst,
        ),
      );
    },
    [],
  );

  /** New collapsible instance at the top of the panel. */
  const addConstellation = () => {
    setInstances((prev) => [createAlignmentInstance(defaultId), ...prev]);
  };

  const copyConfig = async (instanceId: string) => {
    const inst = instances.find((i) => i.instanceId === instanceId);
    if (!inst) return;
    const payload = JSON.stringify(
      exportAlignmentConfig(inst.definition, inst.instance),
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(payload);
      setCopyStatus(`Copied definition + instance (${inst.definition.id})`);
    } catch {
      setCopyStatus("Clipboard failed — select JSON manually");
    }
    window.setTimeout(() => setCopyStatus(null), 2000);
  };

  const copyAllConfigs = async () => {
    const payload = JSON.stringify(
      instances.map((inst) => exportAlignmentConfig(inst.definition, inst.instance)),
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(payload);
      setCopyStatus(`Copied ${instances.length} constellation configuration(s)`);
    } catch {
      setCopyStatus("Clipboard failed — select JSON manually");
    }
    window.setTimeout(() => setCopyStatus(null), 2000);
  };

  const resolved = instances.map((inst) => ({
    inst,
    resolved: resolveConstellation(inst.definition, inst.instance.transform),
  }));

  return (
    <div
      className={styles.root}
      style={
        {
          ["--sky-top"]: findUsConfig.colors.skyTop,
          ["--sky-mid"]: findUsConfig.colors.skyMid,
          ["--sky-bottom"]: findUsConfig.colors.skyBottom,
          ["--stage-aspect"]: findUsConfig.stage.aspectRatio,
        } as CSSProperties
      }
    >
      <div className={styles.previewPane}>
        <div className={momentStyles.sky} />
        <div className={[momentStyles.stage, styles.previewStage].join(" ")}>
          {resolved.map(({ inst, resolved: c }) => {
            const activated = new Set(c.vertices.map((v) => v.uid));
            const drawnEdges = edgesFromDraft(
              c.graphEdges,
              display.showGraphEdges && !display.showDrawOrder,
            );
            return (
              <div key={inst.instanceId} className={styles.previewLayer}>
                <ConstellationRenderer
                  constellation={c}
                  activatedUids={activated}
                  nextUid={null}
                  drawnEdges={drawnEdges}
                  showArtwork={display.showArtwork}
                  showLabel={false}
                  interactive
                  hideStars={!display.showVertices}
                  onHover={(uid, name, subtitle, x, y) =>
                    setHover({ id: uid, name, subtitle, x, y })
                  }
                  onLeave={() => setHover(null)}
                  onActivate={() => undefined}
                  reducedMotion
                  lineDrawMs={1}
                  lineWidth={0.7}
                  viewBox={viewBox}
                />
                <AlignmentOverlay
                  constellation={c}
                  constellationCentre={c.instanceCentre}
                  options={display}
                  viewBox={viewBox}
                />
              </div>
            );
          })}
          {hover ? (
            <div
              className={momentStyles.starLabel}
              style={{ left: `${hover.x}%`, top: `${hover.y}%` }}
            >
              <strong>{hover.name}</strong>
            </div>
          ) : null}
        </div>
      </div>

      <aside className={styles.panel} aria-label="Constellation alignment">
        {/* Use div — Find Us immersive CSS hides all <header> elements. */}
        <div className={styles.panelHeader}>
          <h2 className={styles.title}>Constellation Alignment</h2>
          <p className={styles.subtitle}>
            Definition geometry · Instance placement — shared production
            renderer
          </p>
          <p className={styles.subtitle}>
            Active instances: {instances.length}
          </p>
          <button
            type="button"
            className={styles.addBtn}
            onClick={addConstellation}
          >
            + Add Constellation
          </button>
          <button
            type="button"
            className={styles.smallBtn}
            onClick={() => void copyAllConfigs()}
          >
            Copy All Configurations
          </button>
          {copyStatus ? (
            <p className={styles.copyStatus} role="status">
              {copyStatus}
            </p>
          ) : null}
        </div>

        <fieldset className={styles.displayOpts}>
          <legend>Display options</legend>
          {(
            [
              ["showArtwork", "Show artwork"],
              ["showVertices", "Show vertices"],
              ["showStarNames", "Show star names"],
              ["showVertexUids", "Show vertex UIDs"],
              ["showGraphEdges", "Show graph edges"],
              ["showDrawOrder", "Show draw order"],
              ["showArtworkCentre", "Show artwork centre"],
              ["showConstellationCentre", "Show constellation centre"],
              ["showBoundingBoxes", "Show bounding boxes"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={display[key]}
                onChange={(e) =>
                  setDisplay((d) => ({ ...d, [key]: e.target.checked }))
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <div className={styles.sections}>
          {instances.map((inst) => (
            <ConstellationSection
              key={inst.instanceId}
              definition={inst.definition}
              instance={inst.instance}
              constellationIds={constellationIds}
              collapsed={inst.collapsed}
              onToggleCollapsed={() =>
                updateInstance(inst.instanceId, {
                  collapsed: !inst.collapsed,
                })
              }
              onChangeDefinition={(definition) =>
                updateInstance(inst.instanceId, { definition })
              }
              onChangeInstance={(instance) =>
                updateInstance(inst.instanceId, { instance })
              }
              onSelectDefinition={(id) => {
                const fresh = createAlignmentInstance(id);
                updateInstance(inst.instanceId, {
                  definition: fresh.definition,
                  instance: fresh.instance,
                });
              }}
              onReset={() => {
                const fresh = createAlignmentInstance(inst.definition.id);
                updateInstance(inst.instanceId, {
                  definition: fresh.definition,
                  instance: fresh.instance,
                });
              }}
              onRemove={() =>
                setInstances((prev) =>
                  prev.length <= 1
                    ? prev
                    : prev.filter((p) => p.instanceId !== inst.instanceId),
                )
              }
              onCopy={() => void copyConfig(inst.instanceId)}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
