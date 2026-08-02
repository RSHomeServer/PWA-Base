import type {
  ConstellationDefinition,
  ConstellationInstance,
  ConstellationVertex,
} from "../constellation/types.js";
import {
  artworkOptionsFor,
  deriveGraphEdgesFromDrawOrder,
  formatEffects,
  parseEffects,
  patchInstanceTransform,
} from "./model.js";
import { SliderField } from "./SliderField.js";
import styles from "./AlignmentTool.module.css";

type Props = {
  definition: ConstellationDefinition;
  instance: ConstellationInstance;
  constellationIds: string[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onChangeDefinition: (next: ConstellationDefinition) => void;
  onChangeInstance: (next: ConstellationInstance) => void;
  onSelectDefinition: (id: string) => void;
  onReset: () => void;
  onRemove: () => void;
  onCopy: () => void;
};

export function ConstellationSection({
  definition,
  instance,
  constellationIds,
  collapsed,
  onToggleCollapsed,
  onChangeDefinition,
  onChangeInstance,
  onSelectDefinition,
  onReset,
  onRemove,
  onCopy,
}: Props) {
  const artOptions = artworkOptionsFor(definition.id);
  const artImage = definition.artwork?.image ?? "";
  const { transform } = instance;

  const patchDef = (partial: Partial<ConstellationDefinition>) =>
    onChangeDefinition({ ...definition, ...partial });

  const patchVertex = (index: number, next: ConstellationVertex) => {
    const vertices = definition.vertices.map((v, i) =>
      i === index ? next : v,
    );
    patchDef({ vertices });
  };

  return (
    <section className={styles.section} data-collapsed={collapsed || undefined}>
      {/* Use div — Find Us immersive CSS hides all <header> elements. */}
      <div className={styles.sectionHeader}>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
        >
          {collapsed ? "▸" : "▾"} {definition.displayName}
          <span className={styles.sectionId}>
            ({definition.id} · {instance.definitionId})
          </span>
        </button>
        <div className={styles.sectionActions}>
          <button type="button" className={styles.smallBtn} onClick={onCopy}>
            Copy Configuration
          </button>
          <button type="button" className={styles.smallBtn} onClick={onReset}>
            Reset to Defaults
          </button>
          <button type="button" className={styles.dangerBtn} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <div className={styles.sectionBody}>
          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Constellation definition</span>
              <select
                value={definition.id}
                onChange={(e) => onSelectDefinition(e.target.value)}
              >
                {constellationIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Artwork</span>
              <select
                value={artImage}
                disabled={!definition.artwork}
                onChange={(e) => {
                  if (!definition.artwork) return;
                  patchDef({
                    artwork: {
                      ...definition.artwork,
                      image: e.target.value,
                    },
                  });
                }}
              >
                {artOptions.map((opt) => (
                  <option key={opt.id} value={opt.image}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Custom artwork path</span>
            <input
              type="text"
              value={definition.artwork?.image ?? ""}
              placeholder="/moments/find-us/your-artwork.png"
              onChange={(e) => {
                if (!definition.artwork) return;
                patchDef({
                  artwork: {
                    ...definition.artwork,
                    image: e.target.value,
                  },
                });
              }}
            />
          </label>

          <h4 className={styles.subhead}>Instance Position</h4>
          <p className={styles.hint}>
            Places the whole constellation (vertices, edges, artwork, labels,
            overlays). Definition origin stays fixed in local space.
          </p>
          <SliderField
            label="Centre X"
            value={transform.centre.x}
            min={0}
            max={100}
            step={0.01}
            onChange={(x) =>
              onChangeInstance(patchInstanceTransform(instance, { centre: { x } }))
            }
          />
          <SliderField
            label="Centre Y"
            value={transform.centre.y}
            min={0}
            max={100}
            step={0.01}
            onChange={(y) =>
              onChangeInstance(patchInstanceTransform(instance, { centre: { y } }))
            }
          />

          <h4 className={styles.subhead}>Instance Rotation</h4>
          <SliderField
            label="Rotation"
            value={transform.rotationDeg}
            min={-180}
            max={180}
            step={0.1}
            onChange={(rotationDeg) =>
              onChangeInstance(
                patchInstanceTransform(instance, { rotationDeg }),
              )
            }
          />

          <h4 className={styles.subhead}>Instance Scale</h4>
          <SliderField
            label="Scale"
            value={transform.scale}
            min={0.1}
            max={3}
            step={0.01}
            onChange={(scale) =>
              onChangeInstance(patchInstanceTransform(instance, { scale }))
            }
          />

          {definition.artwork ? (
            <>
              <h4 className={styles.subhead}>Artwork (definition)</h4>
              <label className={styles.field}>
                <span>Image</span>
                <input
                  type="text"
                  value={definition.artwork.image}
                  onChange={(e) =>
                    patchDef({
                      artwork: {
                        ...definition.artwork!,
                        image: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <SliderField
                label="Opacity"
                value={definition.artwork.opacity}
                min={0}
                max={1}
                step={0.01}
                onChange={(opacity) =>
                  patchDef({
                    artwork: { ...definition.artwork!, opacity },
                  })
                }
              />
              <SliderField
                label="Scale"
                value={definition.artwork.scale}
                min={0.1}
                max={3}
                step={0.01}
                onChange={(scale) =>
                  patchDef({
                    artwork: { ...definition.artwork!, scale },
                  })
                }
              />
              <SliderField
                label="Rotation"
                value={definition.artwork.rotationDeg}
                min={-180}
                max={180}
                step={0.1}
                onChange={(rotationDeg) =>
                  patchDef({
                    artwork: { ...definition.artwork!, rotationDeg },
                  })
                }
              />
              <SliderField
                label="Centre X"
                value={definition.artwork.centre.x}
                min={0}
                max={100}
                step={0.01}
                onChange={(x) =>
                  patchDef({
                    artwork: {
                      ...definition.artwork!,
                      centre: { ...definition.artwork!.centre, x },
                    },
                  })
                }
              />
              <SliderField
                label="Centre Y"
                value={definition.artwork.centre.y}
                min={0}
                max={100}
                step={0.01}
                onChange={(y) =>
                  patchDef({
                    artwork: {
                      ...definition.artwork!,
                      centre: { ...definition.artwork!.centre, y },
                    },
                  })
                }
              />
            </>
          ) : (
            <p className={styles.hint}>No artwork on this definition.</p>
          )}

          <h4 className={styles.subhead}>Vertices (definition)</h4>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>UID</th>
                  <th>Star Name</th>
                  <th>Subtitle</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Special Effects</th>
                </tr>
              </thead>
              <tbody>
                {definition.vertices.map((v, i) => (
                  <tr key={`${v.uid}-${i}`}>
                    <td>
                      <input
                        value={v.uid}
                        onChange={(e) =>
                          patchVertex(i, { ...v, uid: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={v.name}
                        onChange={(e) =>
                          patchVertex(i, { ...v, name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={v.subtitle}
                        onChange={(e) =>
                          patchVertex(i, { ...v, subtitle: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step={0.01}
                        value={v.xPosition}
                        onChange={(e) =>
                          patchVertex(i, {
                            ...v,
                            xPosition: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step={0.01}
                        value={v.yPosition}
                        onChange={(e) =>
                          patchVertex(i, {
                            ...v,
                            yPosition: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={formatEffects(v.specialEffects)}
                        placeholder="comma-separated"
                        onChange={(e) =>
                          patchVertex(i, {
                            ...v,
                            specialEffects: parseEffects(e.target.value),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className={styles.subhead}>Draw Order</h4>
          <p className={styles.hint}>
            Selection order as UID sequence (space or comma separated). Repeated
            UIDs are removed automatically.
          </p>
          <textarea
            className={styles.textarea}
            rows={2}
            value={definition.drawOrder.join(" ")}
            onChange={(e) => {
              const seen = new Set<string>();
              const drawOrder = e.target.value
                .split(/[\s,]+/)
                .map((s) => s.trim())
                .filter((uid) => {
                  if (!uid || seen.has(uid)) return false;
                  seen.add(uid);
                  return true;
                });
              patchDef({ drawOrder });
            }}
          />

          <h4 className={styles.subhead}>Graph Edges</h4>
          <p className={styles.hint}>
            Permanent connectivity as UID pairs (one per line: A B). Can be
            derived from draw order.
          </p>
          <button
            type="button"
            className={styles.smallBtn}
            onClick={() =>
              patchDef({
                graphEdges: deriveGraphEdgesFromDrawOrder(definition.drawOrder),
              })
            }
          >
            Derive from draw order
          </button>
          <textarea
            className={styles.textarea}
            rows={Math.max(3, definition.graphEdges.length)}
            value={definition.graphEdges.map(([a, b]) => `${a} ${b}`).join("\n")}
            onChange={(e) => {
              const graphEdges = e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [a, b] = line.split(/[\s,]+/);
                  return [a ?? "", b ?? ""] as [string, string];
                })
                .filter(([a, b]) => a && b);
              patchDef({ graphEdges });
            }}
          />
        </div>
      )}
    </section>
  );
}
