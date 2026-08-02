import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  getAsset,
  libraryCategoryLabel,
  listLibraryAssets,
} from "./assets/catalog.js";
import { assetThumbnail } from "./assetThumbnail.js";
import { artworkHitRect, usesImportedArtwork } from "./artworkHit.js";
import {
  nearestCellOnSurface,
  pickSurfaceAtScreen,
} from "./editorHit.js";
import {
  polyPoints,
  projectIso,
  projectPoly,
  roomProjectedBounds,
  type Point2,
} from "./iso.js";
import {
  resolveScenePlacement,
  surfaceBoundsCorners,
  surfaceRectCorners,
  type ResolvedProp,
  type ResolvedSurface,
  type ScenePlacement,
} from "./placement.js";
import {
  canPlaceAsset,
  canPlaceProp,
  defaultOccupiedFootprint,
  eligibleSurfacesForAsset,
  eligibleSurfacesForProp,
  snapOccupiedCells,
} from "./placementValidation.js";
import { fitArtworkToPlacement } from "./fitting.js";
import { PropIllustration } from "./PropIllustration.js";
import {
  AuthoringPanel,
  GeometryDebugLayer,
  applyKeepsakeAuthoring,
  applyRoomToSurfaces,
  applyShelfToSurfaces,
  defaultAuthoringParams,
  roomBoundsFromAuthoring,
  type SceneAuthoringParams,
} from "./geometry/index.js";
import { cascadeDeleteProp } from "./sceneCascade.js";
import type {
  AssetDefinition,
  AssetLibraryCategory,
  OccupiedCells,
  PlacementSurface,
  PropInstance,
  SceneBlueprint,
  SceneZoneId,
} from "./types.js";
import { ASSET_RENDER_LAYER_ORDER } from "./types.js";
import styles from "./SceneRenderer.module.css";

export type SceneInteractionMode = "experience" | "editor";

type Props = {
  scene: SceneBlueprint;
  /** Defaults to experience (visitor-facing). */
  initialMode?: SceneInteractionMode;
};

type CameraState = {
  zoom: number;
  panX: number;
  panY: number;
};

type DragPreview = {
  propId: string;
  parentSurface: string;
  occupiedCells: OccupiedCells;
  valid: boolean;
  reason?: string;
};

type PlacePreview = {
  assetId: string;
  parentSurface: string;
  occupiedCells: OccupiedCells;
  valid: boolean;
  reason?: string;
};

type PointerMode = "idle" | "pan" | "drag" | "place";

const PLACE_PREVIEW_ID = "__place-preview__";

function zoneForAsset(assetId: string): SceneZoneId {
  const asset = getAsset(assetId);
  if (!asset) return "furniture";
  if (asset.kind === "decoration") return "decoration";
  if (asset.kind === "keepsake-slot") return "keepsake";
  if (asset.renderLayer === "wall") return "wall";
  return "furniture";
}

function StructureShell({
  placement,
  offset,
}: {
  placement: ScenePlacement;
  offset: Point2;
}) {
  const floor = placement.surfaceById.get("floor");
  const wallLeft = placement.surfaceById.get("wall-left");
  const wallBack = placement.surfaceById.get("wall-back");

  // Dollhouse cutaway — only left + back walls (no front / right).
  return (
    <>
      <g data-layer="wall" className={styles.layerWall}>
        {wallLeft ? (
          <polygon
            className={styles.wallLeft}
            points={polyPoints(
              projectPoly(surfaceBoundsCorners(wallLeft)),
              offset,
            )}
          />
        ) : null}
        {wallBack ? (
          <polygon
            className={styles.wallBack}
            points={polyPoints(
              projectPoly(surfaceBoundsCorners(wallBack)),
              offset,
            )}
          />
        ) : null}
      </g>
      <g data-layer="floor" className={styles.layerFloor}>
        {floor ? (
          <polygon
            className={styles.floorPoly}
            points={polyPoints(
              projectPoly(surfaceBoundsCorners(floor)),
              offset,
            )}
          />
        ) : null}
      </g>
    </>
  );
}

function PropArtwork({
  resolved,
  placement,
  offset,
  selected,
  authoring,
}: {
  resolved: ResolvedProp;
  placement: ScenePlacement;
  offset: Point2;
  selected: boolean;
  authoring: SceneAuthoringParams;
}) {
  const asset = getAsset(resolved.prop.assetId);
  const body =
    usesImportedArtwork(asset) && asset ? (
      (() => {
        const fitted = fitArtworkToPlacement(asset, resolved);
        if (!fitted || !asset.image) return null;
        return (
          <image
            href={asset.image}
            xlinkHref={asset.image}
            x={fitted.left - offset.x}
            y={fitted.top - offset.y}
            width={fitted.width}
            height={fitted.height}
            preserveAspectRatio="none"
            style={{ pointerEvents: "none" }}
          />
        );
      })()
    ) : (
      <PropIllustration
        resolved={resolved}
        placement={placement}
        offset={offset}
        authoring={authoring}
      />
    );

  return (
    <g
      data-instance={resolved.prop.id}
      data-asset={resolved.prop.assetId}
      data-illustration={usesImportedArtwork(asset) ? "imported" : "prop"}
      data-selected={selected ? "true" : "false"}
      opacity={resolved.prop.id === PLACE_PREVIEW_ID ? 0.72 : 1}
    >
      {body}
      {selected ? (
        <polygon
          className={styles.selectionRing}
          points={polyPoints(projectPoly(resolved.footprintCorners), offset)}
        />
      ) : null}
    </g>
  );
}

/** Diagnostic overlay — outlines, names, occupied cells, origins only. */
function DevelopmentOverlay({
  placement,
  offset,
}: {
  placement: ScenePlacement;
  offset: Point2;
}) {
  return (
    <g data-layer="overlay" className={styles.layerOverlay}>
      {placement.surfaces.map((surface) => {
        const bounds = surfaceBoundsCorners(surface);
        const labelAt = projectIso(bounds[0]!.x, bounds[0]!.y, bounds[0]!.z);
        return (
          <g key={surface.id} data-surface={surface.id}>
            <polygon
              className={styles.surfaceBounds}
              points={polyPoints(projectPoly(bounds), offset)}
            />
            <text
              className={styles.surfaceLabel}
              x={labelAt.x - offset.x + 4}
              y={labelAt.y - offset.y - 4}
            >
              {surface.id}
            </text>
          </g>
        );
      })}
      {placement.props
        .filter((p) => p.prop.id !== PLACE_PREVIEW_ID)
        .map((resolved) => {
          const origin = projectIso(
            resolved.worldOrigin.x,
            resolved.worldOrigin.y,
            resolved.worldOrigin.z,
          );
          return (
            <g key={`ov-${resolved.prop.id}`}>
              <polygon
                className={styles.occupiedFootprint}
                points={polyPoints(
                  projectPoly(resolved.footprintCorners),
                  offset,
                )}
              />
              {resolved.cellQuads.map((quad, i) => (
                <polygon
                  key={`${resolved.prop.id}-c${i}`}
                  className={styles.occupiedCell}
                  points={polyPoints(projectPoly(quad), offset)}
                />
              ))}
              <circle
                className={styles.originDot}
                cx={origin.x - offset.x}
                cy={origin.y - offset.y}
                r={3.5}
              />
              <text
                className={styles.originLabel}
                x={origin.x - offset.x + 6}
                y={origin.y - offset.y - 4}
              >
                {resolved.prop.id}
              </text>
            </g>
          );
        })}
    </g>
  );
}

function SurfaceGridCells({
  surface,
  offset,
}: {
  surface: ResolvedSurface;
  offset: Point2;
}) {
  const cells: ReactNode[] = [];
  for (let r = 0; r < surface.rows; r += 1) {
    for (let c = 0; c < surface.cols; c += 1) {
      const u0 = c * surface.cellWidth;
      const v0 = r * surface.cellHeight;
      const corners = surfaceRectCorners(
        surface,
        u0,
        v0,
        u0 + surface.cellWidth,
        v0 + surface.cellHeight,
      );
      cells.push(
        <polygon
          key={`${surface.id}-${c}-${r}`}
          className={styles.gridCell}
          points={polyPoints(projectPoly(corners), offset)}
        />,
      );
    }
  }
  return <>{cells}</>;
}

function SelectionGuides({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const surface = resolved.surface;
  return (
    <g data-guides="selection">
      <polygon
        className={styles.parentSurfaceHighlight}
        points={polyPoints(projectPoly(surfaceBoundsCorners(surface)), offset)}
      />
      <SurfaceGridCells surface={surface} offset={offset} />
      {resolved.cellQuads.map((quad, i) => (
        <polygon
          key={`sel-${i}`}
          className={styles.occupiedCellSelected}
          points={polyPoints(projectPoly(quad), offset)}
        />
      ))}
    </g>
  );
}

function DragGuides({
  placement,
  preview,
  offset,
}: {
  placement: ScenePlacement;
  preview: DragPreview | PlacePreview;
  offset: Point2;
}) {
  const surface = placement.surfaceById.get(preview.parentSurface);
  if (!surface) return null;
  const prop =
    "propId" in preview
      ? placement.props.find((p) => p.prop.id === preview.propId)
      : placement.props.find((p) => p.prop.id === PLACE_PREVIEW_ID);
  const cells = prop?.cellQuads ?? [];
  return (
    <g data-guides="drag">
      <polygon
        className={styles.parentSurfaceHighlight}
        points={polyPoints(projectPoly(surfaceBoundsCorners(surface)), offset)}
      />
      <SurfaceGridCells surface={surface} offset={offset} />
      {cells.map((quad, i) => (
        <polygon
          key={`prev-${i}`}
          className={
            preview.valid ? styles.previewCellValid : styles.previewCellInvalid
          }
          points={polyPoints(projectPoly(quad), offset)}
        />
      ))}
    </g>
  );
}

function PropInspector({
  resolved,
  onDelete,
}: {
  resolved: ResolvedProp;
  onDelete: () => void;
}) {
  const asset = getAsset(resolved.prop.assetId);
  const cells = resolved.occupiedCells;
  return (
    <aside className={styles.inspector} data-inspector={resolved.prop.id}>
      <h2 className={styles.inspectorTitle}>
        {asset?.displayName ?? resolved.prop.assetId}
      </h2>
      <dl className={styles.inspectorList}>
        <div>
          <dt>Asset</dt>
          <dd>{resolved.prop.assetId}</dd>
        </div>
        <div>
          <dt>Parent surface</dt>
          <dd>{resolved.prop.parentSurface}</dd>
        </div>
        <div>
          <dt>Occupied cells</dt>
          <dd>
            c{cells.col} r{cells.row} · {cells.width}×{cells.height}
          </dd>
        </div>
        <div>
          <dt>Orientation</dt>
          <dd>{resolved.prop.orientation}°</dd>
        </div>
        <div>
          <dt>Scale</dt>
          <dd>{resolved.prop.scale.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Bounding footprint</dt>
          <dd>
            {resolved.footprintWidth.toFixed(2)} ×{" "}
            {resolved.footprintDepth.toFixed(2)}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.deleteBtn}
        data-action="delete-prop"
        onClick={onDelete}
      >
        Delete
      </button>
    </aside>
  );
}

function AssetLibraryPanel({
  open,
  onToggle,
  activeAssetId,
  onPick,
}: {
  open: boolean;
  onToggle: () => void;
  activeAssetId: string | null;
  onPick: (assetId: string) => void;
}) {
  const assets = useMemo(() => listLibraryAssets(), []);
  const grouped = useMemo(() => {
    const map = new Map<AssetLibraryCategory, AssetDefinition[]>();
    for (const asset of assets) {
      const cat = asset.libraryCategory!;
      const list = map.get(cat) ?? [];
      list.push(asset);
      map.set(cat, list);
    }
    return map;
  }, [assets]);

  return (
    <aside
      className={styles.library}
      data-library={open ? "open" : "closed"}
    >
      <button
        type="button"
        className={styles.libraryToggle}
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? "▾ Asset Library" : "▸ Asset Library"}
      </button>
      {open ? (
        <div className={styles.libraryBody}>
          {[...grouped.entries()].map(([category, entries]) => (
            <section key={category} className={styles.librarySection}>
              <h3 className={styles.librarySectionTitle}>
                {libraryCategoryLabel(category)}
              </h3>
              <ul className={styles.libraryList}>
                {entries.map((asset) => (
                  <li key={asset.id}>
                    <button
                      type="button"
                      className={styles.libraryItem}
                      data-library-asset={asset.id}
                      data-active={activeAssetId === asset.id ? "true" : "false"}
                      onClick={() => onPick(asset.id)}
                    >
                      <span className={styles.libraryThumb} aria-hidden="true">
                        <img src={assetThumbnail(asset)} alt="" />
                      </span>
                      <span className={styles.libraryMeta}>
                        <span className={styles.libraryName}>
                          {asset.displayName}
                        </span>
                        <span className={styles.librarySurfaces}>
                          {asset.supportedSurfaces?.join(", ") ?? "any"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

/**
 * Scene authoring + experience shell — placement engine is the only spatial source of truth.
 * Editor mode: library / select / place / delete / overlay.
 * Experience mode: keepsake launch routes only (same renderer).
 */
export function SceneRenderer({
  scene: blueprint,
  initialMode = "experience",
}: Props) {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ w: 1, h: 1 });
  const [camera, setCamera] = useState<CameraState>({
    zoom: blueprint.camera.defaultZoom,
    panX: 0,
    panY: 0,
  });
  const [interactionMode, setInteractionMode] =
    useState<SceneInteractionMode>(initialMode);
  const isEditor = interactionMode === "editor";
  const [overlay, setOverlay] = useState(false);
  const [smooth, setSmooth] = useState(true);
  const [props, setProps] = useState<PropInstance[]>(() => {
    const defaults = defaultAuthoringParams();
    return applyKeepsakeAuthoring(
      blueprint.props,
      defaults.keepsake,
      defaults.shelf.cellCount,
    );
  });
  const [surfaces, setSurfaces] = useState<PlacementSurface[]>(() => {
    const defaults = defaultAuthoringParams();
    return applyShelfToSurfaces(
      applyRoomToSurfaces(blueprint.surfaces, defaults.room),
      defaults.shelf,
    );
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [placePreview, setPlacePreview] = useState<PlacePreview | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [authoring, setAuthoring] = useState<SceneAuthoringParams>(() =>
    defaultAuthoringParams(),
  );
  const [room, setRoom] = useState(() =>
    roomBoundsFromAuthoring(defaultAuthoringParams().room),
  );
  const [geometryView, setGeometryView] = useState(false);
  const [geometryFocus, setGeometryFocus] = useState<string | null>(
    "prop.wardrobe",
  );

  const mode = useRef<PointerMode>("idle");
  const panDrag = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const propDrag = useRef<{
    propId: string;
    pointerId: number;
  } | null>(null);
  const idCounter = useRef(0);

  const scene = useMemo<SceneBlueprint>(() => {
    let merged = props.map((prop) => {
      if (!dragPreview || dragPreview.propId !== prop.id) return prop;
      return {
        ...prop,
        parentSurface: dragPreview.parentSurface,
        occupiedCells: dragPreview.occupiedCells,
      };
    });
    if (placePreview) {
      merged = [
        ...merged,
        {
          id: PLACE_PREVIEW_ID,
          assetId: placePreview.assetId,
          parentSurface: placePreview.parentSurface,
          occupiedCells: placePreview.occupiedCells,
          orientation: getAsset(placePreview.assetId)?.defaultOrientation ?? 0,
          scale: 1,
          zone: zoneForAsset(placePreview.assetId),
        },
      ];
    }
    return { ...blueprint, room, surfaces, props: merged };
  }, [blueprint, dragPreview, placePreview, props, room, surfaces]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewportSize({ w: Math.max(1, width), h: Math.max(1, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (isEditor) return;
    setOverlay(false);
    setSelectedId(null);
    setDragPreview(null);
    setPlacePreview(null);
    mode.current = "idle";
  }, [isEditor]);

  const placement = useMemo(() => resolveScenePlacement(scene), [scene]);

  const bounds = useMemo(
    () => roomProjectedBounds(room.width, room.depth, room.wallHeight),
    [room.depth, room.wallHeight, room.width],
  );
  const offset: Point2 = useMemo(
    () => ({ x: bounds.minX, y: bounds.minY }),
    [bounds.minX, bounds.minY],
  );

  const fitScale = useMemo(() => {
    const margin = 16;
    return Math.min(
      (viewportSize.w - margin * 2) / bounds.w,
      (viewportSize.h - margin * 2) / bounds.h,
    );
  }, [bounds.h, bounds.w, viewportSize.h, viewportSize.w]);

  const totalScale = authoring.camera.fitToViewport
    ? fitScale * camera.zoom
    : authoring.camera.zoom;

  // Apply room / shelf / keepsake authoring into placement data.
  useEffect(() => {
    setRoom(roomBoundsFromAuthoring(authoring.room));
    setSurfaces((prev) =>
      applyShelfToSurfaces(
        applyRoomToSurfaces(prev, authoring.room),
        authoring.shelf,
      ),
    );
  }, [authoring.room, authoring.shelf]);

  useEffect(() => {
    setProps((prev) =>
      applyKeepsakeAuthoring(
        prev,
        authoring.keepsake,
        authoring.shelf.cellCount,
      ),
    );
  }, [authoring.keepsake, authoring.shelf.cellCount]);

  useEffect(() => {
    if (authoring.camera.fitToViewport) return;
    setCamera({
      zoom: authoring.camera.zoom,
      panX: authoring.camera.panX,
      panY: authoring.camera.panY,
    });
  }, [
    authoring.camera.fitToViewport,
    authoring.camera.panX,
    authoring.camera.panY,
    authoring.camera.zoom,
  ]);

  const propsByLayer = useMemo(() => {
    const groups = new Map<string, ResolvedProp[]>();
    for (const layer of ASSET_RENDER_LAYER_ORDER) groups.set(layer, []);
    for (const resolved of placement.props) {
      const asset = getAsset(resolved.prop.assetId);
      const layer = asset?.renderLayer ?? "object";
      const list = groups.get(layer) ?? [];
      list.push(resolved);
      groups.set(layer, list);
    }
    return groups;
  }, [placement.props]);

  const selected = selectedId
    ? (placement.props.find((p) => p.prop.id === selectedId) ?? null)
    : null;

  const resetView = useCallback(() => {
    setSmooth(true);
    setCamera({
      zoom: blueprint.camera.defaultZoom,
      panX: 0,
      panY: 0,
    });
  }, [blueprint.camera.defaultZoom]);

  const clientToSvg = useCallback(
    (clientX: number, clientY: number): Point2 | null => {
      const viewport = viewportRef.current;
      if (!viewport) return null;
      const rect = viewport.getBoundingClientRect();
      const vx = clientX - rect.left - rect.width / 2;
      const vy = clientY - rect.top - rect.height / 2;
      const panX = authoring.camera.fitToViewport
        ? camera.panX
        : authoring.camera.panX;
      const panY = authoring.camera.fitToViewport
        ? camera.panY
        : authoring.camera.panY;
      const lx = (vx - panX) / totalScale;
      const ly = (vy - panY) / totalScale;
      return {
        x: lx + bounds.w / 2,
        y: ly + bounds.h / 2,
      };
    },
    [
      authoring.camera.fitToViewport,
      authoring.camera.panX,
      authoring.camera.panY,
      bounds.h,
      bounds.w,
      camera.panX,
      camera.panY,
      totalScale,
    ],
  );

  const draftScene = useCallback(
    (): SceneBlueprint => ({ ...blueprint, room, surfaces, props }),
    [blueprint, props, room, surfaces],
  );

  const updateDragPreview = useCallback(
    (propId: string, clientX: number, clientY: number) => {
      const screen = clientToSvg(clientX, clientY);
      if (!screen) return;
      const prop = props.find((p) => p.id === propId);
      if (!prop) return;

      const eligible = eligibleSurfacesForProp(draftScene(), prop);
      const eligibleResolved = eligible
        .map((s) => placement.surfaceById.get(s.id))
        .filter((s): s is ResolvedSurface => Boolean(s));

      const current = placement.surfaceById.get(
        dragPreview?.parentSurface ?? prop.parentSurface,
      );
      let target =
        current && eligibleResolved.some((s) => s.id === current.id)
          ? current
          : null;
      const picked = pickSurfaceAtScreen(eligibleResolved, screen, offset);
      if (picked) target = picked;
      if (!target && eligibleResolved[0]) target = eligibleResolved[0];
      if (!target) return;

      const nearest = nearestCellOnSurface(target, screen, offset);
      if (!nearest) return;
      const cells = snapOccupiedCells(target.surface, nearest.col, nearest.row, {
        width: prop.occupiedCells.width,
        height: prop.occupiedCells.height,
      });
      const verdict = canPlaceProp({
        scene: draftScene(),
        propId,
        surfaceId: target.id,
        cells,
        ignorePropIds: [propId],
      });
      setDragPreview({
        propId,
        parentSurface: target.id,
        occupiedCells: cells,
        valid: verdict.ok,
        reason: verdict.reason,
      });
    },
    [
      clientToSvg,
      draftScene,
      dragPreview?.parentSurface,
      offset,
      placement.surfaceById,
      props,
    ],
  );

  const updatePlacePreview = useCallback(
    (assetId: string, clientX: number, clientY: number) => {
      const screen = clientToSvg(clientX, clientY);
      if (!screen) return;
      const base = draftScene();
      const eligible = eligibleSurfacesForAsset(base, assetId);
      const eligibleResolved = eligible
        .map((s) => placement.surfaceById.get(s.id))
        .filter((s): s is ResolvedSurface => Boolean(s));

      const currentId = placePreview?.parentSurface;
      const current = currentId
        ? placement.surfaceById.get(currentId)
        : null;
      let target =
        current && eligibleResolved.some((s) => s.id === current.id)
          ? current
          : null;
      const picked = pickSurfaceAtScreen(eligibleResolved, screen, offset);
      if (picked) target = picked;
      if (!target && eligibleResolved[0]) target = eligibleResolved[0];
      if (!target) return;

      const footprint = defaultOccupiedFootprint(target.surface, assetId);
      const nearest = nearestCellOnSurface(target, screen, offset);
      if (!nearest) return;
      const cells = snapOccupiedCells(
        target.surface,
        nearest.col,
        nearest.row,
        footprint,
      );
      const verdict = canPlaceAsset({
        scene: base,
        assetId,
        surfaceId: target.id,
        cells,
      });
      setPlacePreview({
        assetId,
        parentSurface: target.id,
        occupiedCells: cells,
        valid: verdict.ok,
        reason: verdict.reason,
      });
    },
    [clientToSvg, draftScene, offset, placePreview?.parentSurface, placement.surfaceById],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId || !isEditor) return;
    const result = cascadeDeleteProp(props, surfaces, selectedId);
    setProps(result.props);
    setSurfaces(result.surfaces);
    setSelectedId(null);
    setDragPreview(null);
    setPlacePreview(null);
  }, [isEditor, props, selectedId, surfaces]);

  useEffect(() => {
    if (!isEditor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlacePreview(null);
        mode.current = "idle";
        return;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedId &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, isEditor, selectedId]);

  const beginPlace = useCallback(
    (assetId: string) => {
      if (!isEditor) return;
      setSelectedId(null);
      setDragPreview(null);
      const base = draftScene();
      const eligible = eligibleSurfacesForAsset(base, assetId);
      const first = eligible[0];
      if (!first) {
        setPlacePreview(null);
        return;
      }
      const footprint = defaultOccupiedFootprint(first, assetId);
      const cells = snapOccupiedCells(first, 0, 0, footprint);
      const verdict = canPlaceAsset({
        scene: base,
        assetId,
        surfaceId: first.id,
        cells,
      });
      setPlacePreview({
        assetId,
        parentSurface: first.id,
        occupiedCells: cells,
        valid: verdict.ok,
        reason: verdict.reason,
      });
      mode.current = "place";
    },
    [draftScene, isEditor],
  );

  const commitPlace = useCallback(() => {
    if (!placePreview?.valid) return;
    idCounter.current += 1;
    const id = `${placePreview.assetId.split(".").pop()}-${Date.now().toString(36)}-${idCounter.current}`;
    const asset = getAsset(placePreview.assetId);
    const next: PropInstance = {
      id,
      assetId: placePreview.assetId,
      parentSurface: placePreview.parentSurface,
      occupiedCells: { ...placePreview.occupiedCells },
      orientation: asset?.defaultOrientation ?? 0,
      scale: 1,
      zone: zoneForAsset(placePreview.assetId),
    };
    setProps((prev) => [...prev, next]);
    setSelectedId(id);
    setPlacePreview(null);
    mode.current = "idle";
  }, [placePreview]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !blueprint.camera.allowZoom) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setSmooth(true);
      const rect = el.getBoundingClientRect();
      const mx = event.clientX - rect.left - rect.width / 2;
      const my = event.clientY - rect.top - rect.height / 2;
      setCamera((prev) => {
        const factor = event.deltaY < 0 ? 1.09 : 0.91;
        const nextZoom = Math.min(
          blueprint.camera.maxZoom,
          Math.max(blueprint.camera.minZoom, prev.zoom * factor),
        );
        const ratio = nextZoom / prev.zoom;
        return {
          zoom: nextZoom,
          panX: mx - (mx - prev.panX) * ratio,
          panY: my - (my - prev.panY) * ratio,
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [blueprint.camera]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        (event.target as HTMLElement).closest(
          "button,aside,a,input,textarea,label",
        )
      ) {
        return;
      }

      if (isEditor && placePreview) {
        updatePlacePreview(placePreview.assetId, event.clientX, event.clientY);
        mode.current = "place";
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      const hitEl = (event.target as Element | null)?.closest?.(
        "[data-hit-prop]",
      ) as HTMLElement | null;
      const hitId = hitEl?.getAttribute("data-hit-prop");

      if (hitId && hitId !== PLACE_PREVIEW_ID) {
        const committed = resolveScenePlacement(draftScene());
        const hit = committed.props.find((p) => p.prop.id === hitId);
        if (!hit) return;

        if (!isEditor) {
          const route = hit.prop.launchRoute;
          if (route) navigate(route);
          return;
        }

        setSelectedId(hit.prop.id);
        setSmooth(false);
        mode.current = "drag";
        propDrag.current = { propId: hit.prop.id, pointerId: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragPreview({
          propId: hit.prop.id,
          parentSurface: hit.prop.parentSurface,
          occupiedCells: { ...hit.prop.occupiedCells },
          valid: true,
        });
        event.stopPropagation();
        return;
      }

      if (isEditor) {
        setSelectedId(null);
        setDragPreview(null);
      }
      if (!blueprint.camera.allowPan) return;
      setSmooth(false);
      mode.current = "pan";
      event.currentTarget.setPointerCapture(event.pointerId);
      panDrag.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: camera.panX,
        originY: camera.panY,
      };
    },
    [
      blueprint.camera.allowPan,
      camera.panX,
      camera.panY,
      draftScene,
      isEditor,
      navigate,
      placePreview,
      updatePlacePreview,
    ],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (mode.current === "pan" && panDrag.current) {
        const drag = panDrag.current;
        setCamera((prev) => ({
          ...prev,
          panX: drag.originX + (event.clientX - drag.startX),
          panY: drag.originY + (event.clientY - drag.startY),
        }));
        return;
      }
      if (!isEditor) return;
      if (mode.current === "drag" && propDrag.current) {
        updateDragPreview(
          propDrag.current.propId,
          event.clientX,
          event.clientY,
        );
        return;
      }
      if (placePreview) {
        updatePlacePreview(placePreview.assetId, event.clientX, event.clientY);
      }
    },
    [isEditor, placePreview, updateDragPreview, updatePlacePreview],
  );

  const endPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isEditor && mode.current === "place" && placePreview) {
        if (placePreview.valid) commitPlace();
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
        return;
      }
      if (isEditor && mode.current === "drag" && propDrag.current && dragPreview) {
        if (dragPreview.valid) {
          setProps((prev) =>
            prev.map((prop) =>
              prop.id === dragPreview.propId
                ? {
                    ...prop,
                    parentSurface: dragPreview.parentSurface,
                    occupiedCells: { ...dragPreview.occupiedCells },
                  }
                : prop,
            ),
          );
        }
        setDragPreview(null);
      }
      mode.current = isEditor && placePreview ? "place" : "idle";
      propDrag.current = null;
      panDrag.current = null;
      setSmooth(true);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    },
    [commitPlace, dragPreview, isEditor, placePreview],
  );

  const statusText = !isEditor
    ? "Experience · click a keepsake to open"
    : placePreview
      ? placePreview.valid
        ? `Place ${getAsset(placePreview.assetId)?.displayName ?? placePreview.assetId} on ${placePreview.parentSurface}`
        : `Cannot place · ${placePreview.reason ?? "blocked"}`
      : dragPreview
        ? dragPreview.valid
          ? `Drop on ${dragPreview.parentSurface}`
          : `Invalid · ${dragPreview.reason ?? "blocked"}`
        : selected
          ? `Selected · ${selected.prop.id}`
          : "Editor · select · drag · place from Asset Library";

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-scene-id={scene.id}
      data-mode={interactionMode}
      data-overlay={overlay ? "on" : "off"}
      data-placement-engine="v1"
      data-editor={isEditor ? "authoring" : "experience"}
      data-selected={selectedId ?? ""}
      data-dragging={dragPreview ? "true" : "false"}
      data-placing={placePreview?.assetId || undefined}
      data-geometry-view={geometryView ? "on" : "off"}
      data-room-length={room.width}
      data-room-width={room.depth}
      data-room-wall-height={room.wallHeight}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div className={styles.toolbar} role="toolbar" aria-label="Scene controls">
        <span className={styles.toolbarMeta}>{statusText}</span>
        <div className={styles.toolbarActions}>
          <div className={styles.modeToggle} role="group" aria-label="Scene mode">
            <button
              type="button"
              className={styles.toolBtn}
              data-mode-btn="experience"
              aria-pressed={!isEditor}
              onClick={() => setInteractionMode("experience")}
            >
              Experience
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              data-mode-btn="editor"
              aria-pressed={isEditor}
              onClick={() => setInteractionMode("editor")}
            >
              Editor
            </button>
          </div>
          {isEditor && placePreview ? (
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => {
                setPlacePreview(null);
                mode.current = "idle";
              }}
            >
              Cancel place
            </button>
          ) : null}
          <button
            type="button"
            className={styles.toolBtn}
            onClick={resetView}
            title="Reset camera"
          >
            Reset view
          </button>
          {isEditor ? (
            <button
              type="button"
              className={styles.toolBtn}
              aria-pressed={overlay}
              onClick={() => setOverlay((v) => !v)}
              title="Toggle diagnostic overlay"
            >
              {overlay ? "Overlay on" : "Overlay"}
            </button>
          ) : null}
        </div>
      </div>

      {isEditor ? (
        <AssetLibraryPanel
          open={libraryOpen}
          onToggle={() => setLibraryOpen((v) => !v)}
          activeAssetId={placePreview?.assetId ?? null}
          onPick={beginPlace}
        />
      ) : null}

      {isEditor && selected && !dragPreview && !placePreview ? (
        <PropInspector resolved={selected} onDelete={deleteSelected} />
      ) : null}

      {isEditor ? (
        <AuthoringPanel
          params={authoring}
          onChange={setAuthoring}
          geometryView={geometryView}
          onGeometryView={setGeometryView}
          focusAssetId={geometryFocus}
          onFocusAsset={setGeometryFocus}
        />
      ) : null}

      <div
        className={`${styles.stage} ${smooth ? styles.stageSmooth : ""}`}
        style={{
          transform: `translate(${
            authoring.camera.fitToViewport
              ? camera.panX
              : authoring.camera.panX
          }px, ${
            authoring.camera.fitToViewport
              ? camera.panY
              : authoring.camera.panY
          }px) scale(${totalScale})`,
        }}
      >
        <div
          className={styles.world}
          style={{ width: bounds.w, height: bounds.h }}
        >
          <svg
            className={styles.canvas}
            width={bounds.w}
            height={bounds.h}
            viewBox={`0 0 ${bounds.w} ${bounds.h}`}
            aria-hidden="true"
          >
            {geometryView ? null : (
              <StructureShell placement={placement} offset={offset} />
            )}

            {geometryView ? (
              <GeometryDebugLayer
                props={placement.props.filter(
                  (p) => p.prop.id !== PLACE_PREVIEW_ID,
                )}
                authoring={authoring}
                offset={offset}
                focusAssetId={geometryFocus}
              />
            ) : (
              ASSET_RENDER_LAYER_ORDER.map((layer) => {
                const rows = propsByLayer.get(layer) ?? [];
                if (rows.length === 0) return null;
                return (
                  <g
                    key={layer}
                    data-layer={layer}
                    className={styles.layerArtwork}
                  >
                    {rows.map((resolved) => (
                      <PropArtwork
                        key={resolved.prop.id}
                        resolved={resolved}
                        placement={placement}
                        offset={offset}
                        selected={isEditor && resolved.prop.id === selectedId}
                        authoring={authoring}
                      />
                    ))}
                  </g>
                );
              })
            )}

            {isEditor ? (
              <g data-layer="editor-guides" className={styles.layerGuides}>
                {selected && !dragPreview && !placePreview ? (
                  <SelectionGuides resolved={selected} offset={offset} />
                ) : null}
                {dragPreview ? (
                  <DragGuides
                    placement={placement}
                    preview={dragPreview}
                    offset={offset}
                  />
                ) : null}
                {placePreview ? (
                  <DragGuides
                    placement={placement}
                    preview={placePreview}
                    offset={offset}
                  />
                ) : null}
              </g>
            ) : null}

            <g data-layer="hits" className={styles.layerHits}>
              {[...placement.props]
                .filter((p) => p.prop.id !== PLACE_PREVIEW_ID)
                .slice()
                .sort((a, b) => {
                  const za = a.prop.zone === "decoration" ? 0 : 1;
                  const zb = b.prop.zone === "decoration" ? 0 : 1;
                  if (za !== zb) return za - zb;
                  const dy = a.worldOrigin.y - b.worldOrigin.y;
                  if (Math.abs(dy) > 0.01) return dy;
                  return (
                    a.worldOrigin.x +
                    a.worldOrigin.z * 10 -
                    (b.worldOrigin.x + b.worldOrigin.z * 10)
                  );
                })
                .map((resolved) => {
                  const hit = artworkHitRect(resolved, offset);
                  const interactive =
                    isEditor || Boolean(resolved.prop.launchRoute);
                  return (
                    <rect
                      key={`hit-${resolved.prop.id}`}
                      className={
                        interactive ? styles.hitTarget : styles.hitTargetIdle
                      }
                      data-hit-prop={resolved.prop.id}
                      data-launch={resolved.prop.launchRoute ?? ""}
                      x={hit.x}
                      y={hit.y}
                      width={hit.width}
                      height={hit.height}
                      style={{
                        pointerEvents: interactive ? "auto" : "none",
                      }}
                    />
                  );
                })}
            </g>

            {isEditor && overlay ? (
              <DevelopmentOverlay placement={placement} offset={offset} />
            ) : null}
          </svg>
        </div>
      </div>
    </div>
  );
}
