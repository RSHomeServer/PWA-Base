/**
 * Room / camera / shelf / keepsake authoring panel — no artistic knobs, only params.
 */
import styles from "../SceneRenderer.module.css";
import type { SceneAuthoringParams } from "./params.js";

type Props = {
  params: SceneAuthoringParams;
  onChange: (next: SceneAuthoringParams) => void;
  geometryView: boolean;
  onGeometryView: (on: boolean) => void;
  focusAssetId: string | null;
  onFocusAsset: (id: string | null) => void;
};

function Num({
  label,
  value,
  min,
  max,
  step,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  testId?: string;
}) {
  return (
    <label className={styles.authorField}>
      <span>{label}</span>
      <input
        type="number"
        data-author={testId ?? label}
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step ?? 0.1}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function AuthoringPanel({
  params,
  onChange,
  geometryView,
  onGeometryView,
  focusAssetId,
  onFocusAsset,
}: Props) {
  const patchRoom = (partial: Partial<SceneAuthoringParams["room"]>) =>
    onChange({ ...params, room: { ...params.room, ...partial } });
  const patchCamera = (partial: Partial<SceneAuthoringParams["camera"]>) =>
    onChange({ ...params, camera: { ...params.camera, ...partial } });
  const patchShelf = (partial: Partial<SceneAuthoringParams["shelf"]>) =>
    onChange({ ...params, shelf: { ...params.shelf, ...partial } });
  const patchKeepsake = (
    partial: Partial<SceneAuthoringParams["keepsake"]>,
  ) => onChange({ ...params, keepsake: { ...params.keepsake, ...partial } });
  const patchArmillary = (
    partial: Partial<SceneAuthoringParams["armillary"]>,
  ) => onChange({ ...params, armillary: { ...params.armillary, ...partial } });
  const patchWardrobe = (
    partial: Partial<SceneAuthoringParams["wardrobe"]>,
  ) => onChange({ ...params, wardrobe: { ...params.wardrobe, ...partial } });

  return (
    <aside className={styles.authorPanel} data-author-panel="room">
      <header className={styles.authorHeader}>
        <strong>Room authoring</strong>
      </header>

      <section className={styles.authorSection} data-author-section="room">
        <h3>Room</h3>
        <Num
          label="Length"
          testId="room-length"
          value={params.room.length}
          min={6}
          max={30}
          step={0.5}
          onChange={(length) => patchRoom({ length })}
        />
        <Num
          label="Width"
          testId="room-width"
          value={params.room.width}
          min={6}
          max={24}
          step={0.5}
          onChange={(width) => patchRoom({ width })}
        />
        <Num
          label="Wall height"
          testId="room-wall-height"
          value={params.room.wallHeight}
          min={2}
          max={8}
          step={0.1}
          onChange={(wallHeight) => patchRoom({ wallHeight })}
        />
      </section>

      <section className={styles.authorSection} data-author-section="camera">
        <h3>Camera</h3>
        <label className={styles.authorField}>
          <span>Fit to viewport</span>
          <input
            type="checkbox"
            data-author="camera-fit"
            checked={params.camera.fitToViewport}
            onChange={(e) => patchCamera({ fitToViewport: e.target.checked })}
          />
        </label>
        {!params.camera.fitToViewport ? (
          <>
            <Num
              label="Zoom"
              testId="camera-zoom"
              value={params.camera.zoom}
              min={0.2}
              max={4}
              step={0.05}
              onChange={(zoom) => patchCamera({ zoom })}
            />
            <Num
              label="Pan X"
              testId="camera-pan-x"
              value={params.camera.panX}
              step={5}
              onChange={(panX) => patchCamera({ panX })}
            />
            <Num
              label="Pan Y"
              testId="camera-pan-y"
              value={params.camera.panY}
              step={5}
              onChange={(panY) => patchCamera({ panY })}
            />
          </>
        ) : null}
      </section>

      <section className={styles.authorSection} data-author-section="shelf">
        <h3>Shelf / keepsakes</h3>
        <Num
          label="Shelf length"
          testId="shelf-length"
          value={params.shelf.length}
          min={2}
          max={12}
          step={0.2}
          onChange={(length) => patchShelf({ length })}
        />
        <Num
          label="Keepsake spacing"
          testId="keepsake-spacing"
          value={params.keepsake.spacing}
          min={1}
          max={8}
          step={1}
          onChange={(spacing) => patchKeepsake({ spacing })}
        />
        <Num
          label="Keepsake scale"
          testId="keepsake-scale"
          value={params.keepsake.scale}
          min={0.5}
          max={4}
          step={0.05}
          onChange={(scale) => patchKeepsake({ scale })}
        />
        <Num
          label="Armillary ring R"
          testId="armillary-ring-radius"
          value={params.armillary.ringRadius}
          min={0.1}
          max={0.8}
          step={0.02}
          onChange={(ringRadius) => patchArmillary({ ringRadius })}
        />
      </section>

      <section className={styles.authorSection} data-author-section="wardrobe">
        <h3>Wardrobe params</h3>
        <Num
          label="Width"
          testId="wardrobe-width"
          value={params.wardrobe.width}
          step={0.05}
          onChange={(width) => patchWardrobe({ width })}
        />
        <Num
          label="Depth"
          testId="wardrobe-depth"
          value={params.wardrobe.depth}
          step={0.05}
          onChange={(depth) => patchWardrobe({ depth })}
        />
        <Num
          label="Height"
          testId="wardrobe-height"
          value={params.wardrobe.height}
          step={0.05}
          onChange={(height) => patchWardrobe({ height })}
        />
        <Num
          label="Door thickness"
          testId="wardrobe-door-thickness"
          value={params.wardrobe.doorThickness}
          step={0.01}
          onChange={(doorThickness) => patchWardrobe({ doorThickness })}
        />
        <Num
          label="Plinth height"
          testId="wardrobe-plinth-height"
          value={params.wardrobe.plinthHeight}
          step={0.01}
          onChange={(plinthHeight) => patchWardrobe({ plinthHeight })}
        />
        <Num
          label="Handle radius"
          testId="wardrobe-handle-radius"
          value={params.wardrobe.handleRadius}
          step={0.005}
          onChange={(handleRadius) => patchWardrobe({ handleRadius })}
        />
      </section>

      <section className={styles.authorSection} data-author-section="geometry">
        <h3>Geometry view</h3>
        <label className={styles.authorField}>
          <span>Debug primitives</span>
          <input
            type="checkbox"
            data-author="geometry-view"
            checked={geometryView}
            onChange={(e) => onGeometryView(e.target.checked)}
          />
        </label>
        <label className={styles.authorField}>
          <span>Focus asset</span>
          <select
            data-author="geometry-focus"
            value={focusAssetId ?? ""}
            onChange={(e) => onFocusAsset(e.target.value || null)}
          >
            <option value="">All placed</option>
            <option value="prop.wardrobe">Wardrobe</option>
            <option value="keepsake.armillary-sphere">Armillary</option>
            <option value="surface.desk">Desk</option>
            <option value="prop.chair">Chair</option>
            <option value="surface.shelf">Shelf</option>
          </select>
        </label>
      </section>
    </aside>
  );
}
